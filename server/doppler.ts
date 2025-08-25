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
        console.log('🚀 Real deployment using Doppler V4 SDK...');
        
        // Get current block timestamp for deployment parameters
        const blockTimestamp = Math.floor(Date.now() / 1000);
        
        // Configure deployment parameters
        const deploymentConfig: DopplerPreDeploymentConfig = {
          name: config.name,
          symbol: config.symbol,
          totalSupply: BigInt('1000000000000000000000000'), // 1M tokens with 18 decimals
          numTokensToSell: BigInt('800000000000000000000000'), // 800K tokens for sale
          tokenURI,
          blockTimestamp,
          startTimeOffset: 0, // Start immediately
          duration: 86400 * 7, // 7 days
          epochLength: 86400, // 1 day epochs
          gamma: 0.5, // Price discovery parameter
          tickSpacing: 60,
          fee: 3000, // 0.3%
          minProceeds: BigInt('1000000000000000'), // 0.001 ETH minimum
          maxProceeds: BigInt('10000000000000000000'), // 10 ETH maximum
          yearlyMintRate: BigInt('0'), // No inflation
          vestingDuration: BigInt('0'), // No vesting
          recipients: [config.creatorAddress as `0x${string}`],
          amounts: [BigInt('200000000000000000000000')], // 200K tokens to creator
          integrator: config.creatorAddress as `0x${string}`,
        };

        // Deploy using Doppler V4 factory
        const result = await this.factory.preDeploy(deploymentConfig);
        
        console.log('✅ Real Doppler V4 deployment successful:', result);
        
        return {
          tokenAddress: result.tokenAddress || '0x0000000000000000000000000000000000000000',
          txHash: result.txHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
          poolId: result.poolId || `doppler-pool-${Date.now()}`,
          bondingCurveAddress: result.bondingCurveAddress || this.addresses.airlock,
          dopplerAddress: result.dopplerAddress || this.addresses.airlock,
          isSimulated: false,
          explorerUrl: `https://sepolia.basescan.org/tx/${result.txHash}`,
        };

      } else {
        // Fallback to simulation if no wallet/SDK
        console.log('⚠️ No wallet client available, using simulation mode...');
        return this.simulateDeployment(config);
      }

    } catch (error: any) {
      console.error('❌ Real deployment failed:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      
      // Extract more specific error information
      let errorMessage = error.message || error;
      
      if (error.cause?.reason) {
        errorMessage = error.cause.reason;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.reason) {
        errorMessage = error.reason;
      }
      
      // Check for common issues
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance for gas fees. Please add testnet ETH to your wallet.';
      } else if (errorMessage.includes('execution reverted')) {
        errorMessage = 'Transaction reverted. Check deployment parameters and contract requirements.';
      }
      
      throw new Error(`Real deployment failed: ${errorMessage}`);
    }
  }

  // Simulate deployment for testing without spending gas
  async simulateDeployment(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    console.log('🔄 Simulating Doppler V4 deployment for:', config.name, config.symbol);
    
    // Generate realistic-looking addresses
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    
    // Generate realistic token address
    const tokenAddress = `0x${random}${'0'.repeat(34)}`.slice(0, 42);
    
    // Generate realistic tx hash
    const txHash = `0x${'a'.repeat(8)}${timestamp.toString(16)}${'0'.repeat(48)}`.slice(0, 66);
    
    // Add a small delay to simulate network time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      tokenAddress,
      txHash,
      poolId: `doppler-pool-${timestamp}`,
      bondingCurveAddress: `0x${'d0pp1e7'.padEnd(40, '0')}`,
      dopplerAddress: `0x${'d0pp1e7'.padEnd(40, '0')}`,
      message: `Token deployment simulated successfully for ${config.name}`,
      isSimulated: true,
      explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
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