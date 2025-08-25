import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { ReadWriteFactory, DOPPLER_V4_ADDRESSES, ReadDoppler, ReadQuoter } from 'doppler-v4-sdk';
import { createDrift } from '@delvtech/drift';
import { viemAdapter } from '@delvtech/drift-viem';

export interface PadTokenConfig {
  name: string;
  symbol: string;
  totalSupply?: bigint;
  numTokensToSell?: bigint;
  mediaCid: string;
  creatorAddress: string;
  description?: string;
  twitter?: string;
  discord?: string;
}

export interface TokenDeploymentResult {
  tokenAddress: string;
  txHash: string;
  poolId: string;
  bondingCurveAddress: string;
  dopplerAddress?: string;
}

export interface DopplerPreDeploymentConfig {
  name: string;
  symbol: string;
  totalSupply: bigint;
  numTokensToSell: bigint;
  tokenURI: string;
  blockTimestamp: number;
  startTimeOffset: number;
  duration: number;
  epochLength: number;
  gamma?: number;
  tickRange?: {
    startTick: number;
    endTick: number;
  };
  tickSpacing: number;
  fee: number;
  minProceeds: bigint;
  maxProceeds: bigint;
  numPdSlugs?: number;
  yearlyMintRate: bigint;
  vestingDuration: bigint;
  recipients: `0x${string}`[];
  amounts: bigint[];
  integrator: `0x${string}`;
}

export class DopplerV4Service {
  private publicClient: any = null;
  private walletClient: any = null;
  private addresses: any = null;
  private chainId: number;
  private drift: any = null;
  private factory: ReadWriteFactory | null = null;

  constructor(chainId: number = 84532) { // Default to Base Sepolia for testing
    this.chainId = chainId;
    this.addresses = DOPPLER_V4_ADDRESSES[chainId as keyof typeof DOPPLER_V4_ADDRESSES];
    this.initialize();
  }

  private getRpcUrl(): string {
    if (this.chainId === 84532) {
      return process.env.PONDER_RPC_URL_84532 || 'https://sepolia.base.org';
    }
    return 'https://mainnet.base.org'; // Base mainnet
  }

  private async initialize(): Promise<void> {
    try {
      console.log(`🔧 Initializing Doppler V4 Service for chain ${this.chainId}...`);

      if (!this.addresses) {
        throw new Error(`No Doppler addresses configured for chain ${this.chainId}`);
      }

      console.log('📍 Using Doppler V4 addresses:', this.addresses);

      // Create public client for reading blockchain data
      this.publicClient = createPublicClient({
        chain: this.chainId === 84532 ? baseSepolia : base,
        transport: http(this.getRpcUrl())
      });

      // Create wallet client if private key is available
      const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
      if (privateKey) {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        this.walletClient = createWalletClient({
          account,
          chain: this.chainId === 84532 ? baseSepolia : base,
          transport: http(this.getRpcUrl())
        });
        console.log(`✅ Wallet client created with address: ${account.address}`);

        // Initialize Doppler SDK
        this.drift = createDrift({
          adapter: viemAdapter({ 
            publicClient: this.publicClient,
            walletClient: this.walletClient 
          })
        });
        
        this.factory = new ReadWriteFactory(this.addresses.airlock, this.drift);
        console.log('✅ Doppler V4 SDK initialized successfully');
      } else {
        console.log('⚠️ No DEPLOYER_PRIVATE_KEY found, will simulate deployments');
      }

      console.log(`✅ Doppler V4 Service initialized successfully`);
    } catch (error) {
      console.error('Failed to initialize Doppler V4 Service:', error);
      throw error;
    }
  }

  async deployPadToken(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    if (!this.addresses) {
      throw new Error('Doppler V4 Service not properly initialized');
    }

    try {
      // Create token metadata URI from IPFS CID
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${config.mediaCid}`;

      if (this.walletClient && this.factory) {
        // Real deployment using Doppler V4 SDK
        console.log('🚀 Deploying token with Doppler V4 SDK...');
        
        const dopplerConfig: DopplerPreDeploymentConfig = {
          name: config.name,
          symbol: config.symbol,
          totalSupply: parseEther('1000000'), // 1M tokens (smaller for testing)
          numTokensToSell: parseEther('500000'), // 500K for sale
          tokenURI,
          blockTimestamp: Math.floor(Date.now() / 1000),
          startTimeOffset: 1, // Start in 1 day for better stability
          duration: 1, // 1 day for testing
          epochLength: 600, // 10 minute epochs for faster testing
          gamma: 100, // Lower gamma for more stable price movement
          tickRange: {
            startTick: -887220, // Lower starting price tick for testnet
            endTick: 887220,    // Higher ending price tick for testnet  
          },
          tickSpacing: 60, // Standard tick spacing for most pools
          fee: 20_000, // 2% fee
          minProceeds: parseEther('0.01'), // Minimum 0.01 ETH (lower for testing)
          maxProceeds: parseEther('1'), // Maximum 1 ETH (lower for testing)
          yearlyMintRate: BigInt(0), // No inflation
          vestingDuration: BigInt(24 * 60 * 60 * 365), // 1 year vesting
          recipients: [config.creatorAddress as `0x${string}`],
          amounts: [parseEther('50000')], // 50K tokens to creator
          numPdSlugs: 15,
          integrator: config.creatorAddress as `0x${string}`,
        };

        // Build configuration with Doppler SDK (no governance for simple launches)
        console.log('🔧 Building configuration...');
        const { createParams, hook, token } = this.factory.buildConfig(
          dopplerConfig, 
          this.addresses,
          { useGovernance: false } // No governance for simple launches
        );

        console.log('📋 Configuration built successfully');

        // Simulate deployment first
        console.log('🔍 Simulating deployment...');
        const simulation = await this.factory.simulateCreate(createParams);
        console.log('⛽ Deployment simulation complete');

        // Execute deployment
        console.log('🚀 Executing deployment...');
        console.log('🔧 Deployment parameters:', {
          name: dopplerConfig.name,
          symbol: dopplerConfig.symbol,
          totalSupply: dopplerConfig.totalSupply.toString(),
          numTokensToSell: dopplerConfig.numTokensToSell.toString(),
          startTimeOffset: dopplerConfig.startTimeOffset,
          duration: dopplerConfig.duration,
          useGovernance: false
        });
        const txHash = await this.factory.create(createParams);
        console.log(`🎉 Doppler pool created: ${txHash}`);

        // Wait for transaction confirmation
        console.log('⏳ Waiting for transaction confirmation...');
        const receipt = await this.publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log('✅ Transaction confirmed:', receipt.status);

        // Extract addresses from deployment
        const tokenAddress = token;
        const dopplerAddress = hook;

        return {
          tokenAddress,
          txHash,
          poolId: `doppler-${Date.now()}`,
          bondingCurveAddress: dopplerAddress,
          dopplerAddress,
        };
      } else {
        // Simulation mode
        console.log('🔄 Simulating Doppler V4 deployment (no private key or SDK)...');
        return this.simulateDeployment(config);
      }

    } catch (error: any) {
      console.error('❌ Doppler V4 token deployment failed:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      // Extract more specific error information
      let errorMessage = error.message || error;
      let revertReason = 'Unknown';
      
      // Try to extract revert data
      if (error.data) {
        console.error('❌ Error data:', error.data);
        revertReason = `Contract revert data: ${error.data}`;
      }
      
      if (error.cause?.data) {
        console.error('❌ Cause data:', error.cause.data);
        revertReason = `Contract revert: ${error.cause.data}`;
      }
      
      if (error.cause?.reason) {
        errorMessage = error.cause.reason;
        revertReason = error.cause.reason;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.reason) {
        errorMessage = error.reason;
        revertReason = error.reason;
      }
      
      // Check for common issues
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance for gas fees. Please add testnet ETH to your wallet.';
      } else if (errorMessage.includes('execution reverted')) {
        errorMessage = `Transaction reverted: ${revertReason}. Check deployment parameters and contract requirements.`;
      }
      
      console.error('❌ Final error message:', errorMessage);
      throw new Error(`Doppler V4 deployment failed: ${errorMessage}`);
    }
  }

  // Simulate deployment for testing without spending gas
  async simulateDeployment(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    console.log('🔄 Simulating Doppler V4 deployment for:', config.name, config.symbol);
    
    // Generate realistic-looking addresses
    const timestamp = Date.now().toString(16);
    const random = Math.random().toString(16).slice(2, 8);
    
    return {
      tokenAddress: `0x${timestamp.slice(-6)}${random}${'0'.repeat(34 - timestamp.slice(-6).length - random.length)}`,
      txHash: `0x${Math.random().toString(16).slice(2)}${'0'.repeat(64)}`.slice(0, 66),
      poolId: `doppler-${timestamp}`,
      bondingCurveAddress: `0x${'d0pp1e7'.padEnd(40, '0')}`,
      dopplerAddress: `0x${'d0pp1e7'.padEnd(40, '0')}`,
    };
  }

  // Get current token price from Doppler bonding curve
  async getCurrentPrice(tokenAddress: string, poolId: string): Promise<string> {
    if (!this.drift || !this.addresses) {
      return '0.000001'; // Default starting price
    }

    try {
      // Use Doppler SDK to get current price
      const doppler = new ReadDoppler(tokenAddress as `0x${string}`, this.addresses.stateView, this.drift, poolId);
      const price = await doppler.getCurrentPrice();
      return price.toString();
    } catch (error) {
      console.error('Failed to get current price from Doppler:', error);
      return '0.000001';
    }
  }

  // Check if token has graduated from price discovery
  async hasGraduated(tokenAddress: string, poolId: string): Promise<boolean> {
    if (!this.drift || !this.addresses) {
      return false;
    }

    try {
      // Check if the price discovery phase has ended
      const doppler = new ReadDoppler(tokenAddress as `0x${string}`, this.addresses.stateView, this.drift, poolId);
      const endTime = await doppler.getEndingTime();
      const currentTime = Math.floor(Date.now() / 1000);
      return currentTime > Number(endTime);
    } catch (error) {
      console.error('Failed to check graduation status:', error);
      return false;
    }
  }

  // Get quote for token swap
  async getQuote(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<bigint> {
    if (!this.drift || !this.addresses) {
      return BigInt(0);
    }

    try {
      // Use Doppler quoter to get swap quote
      const quoter = new ReadQuoter(this.addresses.v4Quoter, this.drift);
      const poolKey = {
        currency0: tokenIn as `0x${string}`,
        currency1: tokenOut as `0x${string}`,
        fee: 3000,
        tickSpacing: 60,
        hooks: this.addresses.airlock,
      };
      const quote = await quoter.quoteExactInputV4({
        poolKey,
        zeroForOne: true,
        exactAmount: amountIn,
        hookData: '0x' as `0x${string}`,
      });
      return quote.amountOut;
    } catch (error) {
      console.error('Failed to get quote:', error);
      return BigInt(0);
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