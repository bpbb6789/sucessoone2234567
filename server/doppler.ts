import { ReadWriteFactory, DOPPLER_V4_ADDRESSES } from 'doppler-v4-sdk';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { createDrift } from '@delvtech/drift';

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

  constructor(chainId: number = 84532) { // Default to Base Sepolia for testing
    this.chainId = chainId;
    this.initialize();
  }

  private async initialize() {
    try {
      const config = NETWORK_CONFIG[this.chainId];
      if (!config) {
        throw new Error(`Unsupported chain ID: ${this.chainId}`);
      }

      // Get Doppler V4 addresses for this chain
      this.addresses = DOPPLER_V4_ADDRESSES[this.chainId];
      if (!this.addresses) {
        throw new Error(`Doppler V4 not deployed on chain ${this.chainId}`);
      }

      const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
      if (!deployerPrivateKey) {
        console.warn('No DEPLOYER_PRIVATE_KEY found. Token deployment will be simulated.');
        return;
      }

      // Ensure private key is properly formatted
      let formattedKey = deployerPrivateKey;
      if (!deployerPrivateKey.startsWith('0x')) {
        formattedKey = `0x${deployerPrivateKey}`;
      }
      
      const account = privateKeyToAccount(formattedKey as `0x${string}`);

      // Create clients with proper configuration for Drift
      const transport = http(config.rpcUrl);
      
      const publicClient = createPublicClient({
        chain: config.chain,
        transport,
      });

      const walletClient = createWalletClient({
        account,
        chain: config.chain,
        transport,
      });

      // Verify clients are working before creating Drift
      console.log('Testing clients...');
      const blockNumber = await publicClient.getBlockNumber();
      console.log(`Connected to chain ${this.chainId}, block: ${blockNumber}`);

      // Create drift instance
      this.drift = createDrift({
        publicClient,
        walletClient,
      });

      // Initialize factory
      this.factory = new ReadWriteFactory(this.addresses.airlock, this.drift);
      
      console.log(`Doppler V4 Service initialized for chain ${this.chainId}`);
    } catch (error) {
      console.error('Failed to initialize Doppler V4 Service:', error);
    }
  }

  async deployPadToken(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    if (!this.factory || !this.drift || !this.addresses) {
      throw new Error('Doppler V4 Service not properly initialized');
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
        numPdSlugs: 15,
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