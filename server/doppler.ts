import { ReadWriteFactory, DOPPLER_V4_ADDRESSES } from 'doppler-v4-sdk';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { createDrift, getContract } from '@delvtech/drift';

// Configuration for different networks
const NETWORK_CONFIG = {
  8453: { // Base mainnet
    chain: base,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org'
  },
  84532: { // Base Sepolia
    chain: baseSepolia,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
  }
};

export interface PadTokenConfig {
  name: string;
  symbol: string;
  totalSupply?: bigint;
  numTokensToSell?: bigint;
  mediaCid: string;
  creatorAddress: string;
}

export interface TokenDeploymentResult {
  tokenAddress: string;
  txHash: string;
  poolId: string;
  bondingCurveAddress: string;
}

export class DopplerV4Service {
  private factory: ReadWriteFactory | null = null;
  private drift: any = null;
  private addresses: any = null;
  private chainId: number;
  private initPromise: Promise<void>;
  private rpcUrl: string;

  constructor(chainId: number = 84532) { // Default to Base Sepolia for testing
    this.chainId = chainId;
    this.rpcUrl = this.getRpcUrl(chainId);
    this.initPromise = this.initialize();
  }

  private getRpcUrl(chainId: number): string {
    const rpcUrls: Record<number, string> = {
      84532: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org', // Base Sepolia
      8453: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',  // Base Mainnet
    };

    const url = rpcUrls[chainId] || rpcUrls[84532];
    console.log(`Using RPC URL for chain ${chainId}: ${url}`);
    return url;
  }

  private getAddressesForChain(chainId: number): any | null {
    // This function should return the Doppler V4 contract addresses for the given chain ID
    // For now, it's a placeholder. In a real scenario, this would fetch from a configuration or constant.
    // Example structure:
    // const addresses = {
    //   airlock: '0x...',
    //   factory: '0x...',
    //   // ... other addresses
    // };
    // return addresses[chainId];
    return DOPPLER_V4_ADDRESSES[chainId];
  }

  async initialize(): Promise<void> {
    try {
      console.log(`🔧 Initializing Doppler V4 Service for chain ${this.chainId}...`);

      // Initialize addresses
      this.addresses = this.getAddressesForChain(this.chainId);
      if (!this.addresses) {
        throw new Error(`No addresses configured for chain ${this.chainId}`);
      }
      console.log(`✅ Found Doppler V4 addresses for chain ${this.chainId}`);

      console.log('Testing clients...');

      // Create Drift client with simplified configuration
      try {
        this.drift = createDrift({
          rpcUrl: this.rpcUrl
        });
        console.log('✅ Drift client created successfully');
      } catch (driftError) {
        console.error('Failed to create Drift client:', driftError);
        // Try alternative initialization
        console.log('Attempting alternative Drift initialization...');
        this.drift = createDrift(this.rpcUrl);
      }

      console.log('Deploying token with Doppler V4 SDK...');

      // Create factory client
      this.factory = this.drift.contract({
        abi: DopplerFactoryAbi, // Assuming DopplerFactoryAbi is defined elsewhere
        address: this.addresses.factory as `0x${string}`,
      });

      // Test connection with a simple call
      try {
        const blockNumber = await this.drift.getBlockNumber();
        console.log(`Connected to chain ${this.chainId}, block: ${blockNumber}`);
      } catch (blockError) {
        console.warn('Could not get block number, but continuing...');
      }

      console.log(`✅ Doppler V4 Service initialized successfully`);
    } catch (error) {
      console.error('Failed to initialize Doppler V4 Service:', error);
      throw error;
    }
  }

  async deployPadToken(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    // Ensure initialization is complete
    await this.initPromise;

    if (!this.factory || !this.drift || !this.addresses) {
      console.error('Doppler V4 Service components:', {
        factory: !!this.factory,
        drift: !!this.drift,
        addresses: !!this.addresses
      });
      throw new Error('Doppler V4 Service not properly initialized after await');
    }

    try {
      // Create token metadata URI from IPFS CID
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${config.mediaCid}`;

      // Configuration for pump.fun style token
      const dopplerConfig = {
        name: config.name,
        symbol: config.symbol,
        totalSupply: config.totalSupply || parseEther('1000000000'), // 1B tokens
        numTokensToSell: config.numTokensToSell || parseEther('600000000'), // 60% for sale
        tokenURI,
        blockTimestamp: Math.floor(Date.now() / 1000),
        startTimeOffset: 1, // Start immediately
        duration: 1 / 4, // 6 hours (1/4 of a day)
        epochLength: 200, // Blocks per epoch
        gamma: 800, // Price movement per epoch
        tickRange: {
          startTick: 174_312, // Starting price tick
          endTick: 186_840,   // Ending price tick
        },
        tickSpacing: 2,
        fee: 20_000, // 2% fee
        minProceeds: parseEther('0.1'), // Minimum ETH to raise
        maxProceeds: parseEther('10'), // Maximum ETH to raise
        yearlyMintRate: 0n, // No inflation
        vestingDuration: BigInt(0), // No vesting
        recipients: [config.creatorAddress], // Creator gets remaining tokens
        amounts: [parseEther('400000000')], // 40% to creator
        numPdSlães: 15,
        integrator: config.creatorAddress, // Integrator (usually the creator)
      };

      // Build configuration (without governance for simplicity)
      const { createParams, hook, token } = this.factory.buildConfig(
        dopplerConfig,
        this.addresses,
        { useGovernance: false } // Use NoOpGovernanceFactory for simpler deployment
      );

      // Simulate deployment first
      console.log('Simulating token deployment...');
      const simulation = await this.factory.simulateCreate(createParams);
      console.log(`Estimated gas: ${simulation.request.gas}`);

      // Execute deployment
      console.log('Deploying token on-chain...');
      const txHash = await this.factory.create(createParams);

      // Wait for transaction confirmation
      const receipt = await this.drift.publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      console.log(`Token deployed successfully: ${txHash}`);

      return {
        tokenAddress: token,
        txHash,
        poolId: hook, // The hook address acts as pool identifier
        bondingCurveAddress: this.addresses.airlock,
      };

    } catch (error) {
      console.error('Token deployment failed:', error);
      throw new Error(`Token deployment failed: ${error.message}`);
    }
  }

  // Simulate deployment for testing without spending gas
  async simulateDeployment(config: PadTokenConfig): Promise<{
    tokenAddress: string;
    txHash: string;
    poolId: string;
    estimatedGas: string;
  }> {
    // Return simulated values for testing
    return {
      tokenAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      poolId: `0x${Math.random().toString(16).slice(2, 42)}`,
      estimatedGas: '150000',
    };
  }

  // Get current token price from bonding curve
  async getCurrentPrice(tokenAddress: string): Promise<string> {
    if (!this.drift || !this.addresses) {
      return '0.000001'; // Default starting price
    }

    try {
      // This would query the actual bonding curve state
      // For now, return a mock price
      return '0.000001';
    } catch (error) {
      console.error('Failed to get current price:', error);
      return '0.000001';
    }
  }

  // Check if token has graduated from bonding curve
  async hasGraduated(tokenAddress: string): Promise<boolean> {
    if (!this.drift || !this.addresses) {
      return false;
    }

    try {
      // This would check if the token has moved to full DEX trading
      // For now, return false
      return false;
    } catch (error) {
      console.error('Failed to check graduation status:', error);
      return false;
    }
  }
}

// Singleton instance for the service
let dopplerService: DopplerV4Service | null = null;

export function getDopplerService(chainId?: number): DopplerV4Service {
  if (!dopplerService || (chainId && dopplerService['chainId'] !== chainId)) {
    dopplerService = new DopplerV4Service(chainId);
  }
  return dopplerService;
}