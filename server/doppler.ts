import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { ReadWriteFactory, DOPPLER_V4_ADDRESSES, ReadDoppler, ReadQuoter } from 'doppler-v4-sdk';
import { createDrift } from '@delvtech/drift';
import { viemAdapter } from '@delvtech/drift-viem';
import { createCoin, setApiKey } from '@zoralabs/coins-sdk';
import type { ContentCoinCurrency, StartingMarketCap } from '@zoralabs/coins-sdk';

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
  isSimulated?: boolean;
  explorerUrl?: string;
  deploymentMethod?: 'zora' | 'doppler' | 'simulation';
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
    
    // Check for required environment variables
    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    const zoraApiKey = process.env.ZORA_API_KEY;
    
    console.log('🔑 Environment Variables Status:');
    console.log(`   DEPLOYER_PRIVATE_KEY: ${deployerPrivateKey ? '✅ Found' : '❌ Missing'}`);
    console.log(`   ZORA_API_KEY: ${zoraApiKey ? '✅ Found' : '❌ Missing'}`);
    
    // Set up Zora API key if available
    if (zoraApiKey) {
      setApiKey(zoraApiKey);
      console.log('✅ Zora API key configured');
    } else {
      console.log('⚠️ No ZORA_API_KEY found, using without API key');
    }
    
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
    try {
      // Create token metadata URI from IPFS CID
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${config.mediaCid}`;

      if (this.walletClient && this.publicClient) {
        console.log('🚀 Real deployment using Zora Coins SDK...');
        
        // Determine currency based on chain
        let currency: ContentCoinCurrency;
        if (this.chainId === 84532) {
          // Base Sepolia - use ETH as ZORA tokens aren't available on testnet
          currency = "ETH";
        } else {
          // Base mainnet - use ZORA
          currency = "ZORA";
        }

        // Configure Zora coin creation parameters
        const createCoinArgs = {
          creator: config.creatorAddress as `0x${string}`,
          name: config.name,
          symbol: config.symbol,
          metadata: {
            type: "RAW_URI" as const,
            uri: tokenURI
          },
          currency,
          chainId: this.chainId,
          startingMarketCap: "LOW" as StartingMarketCap,
          // Optional: add platform referrer if available
          // platformReferrer: "0x..." as Address,
        };

        console.log('📝 Creating coin with Zora SDK:', createCoinArgs);

        // Deploy using Zora SDK
        const result = await createCoin({
          call: createCoinArgs,
          walletClient: this.walletClient,
          publicClient: this.publicClient,
          options: {
            skipValidateTransaction: false
          }
        });
        
        console.log('✅ Zora coin deployment successful:', result);
        
        return {
          tokenAddress: result.address || '0x0000000000000000000000000000000000000000',
          txHash: result.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
          poolId: `zora-coin-${Date.now()}`,
          bondingCurveAddress: result.deployment?.market || '0x0000000000000000000000000000000000000000',
          dopplerAddress: result.deployment?.market,
          isSimulated: false,
          explorerUrl: this.chainId === 84532 
            ? `https://sepolia.basescan.org/tx/${result.hash}`
            : `https://basescan.org/tx/${result.hash}`,
          deploymentMethod: 'zora'
        };

      } else {
        // Fallback to simulation if no wallet clients
        console.log('⚠️ No wallet client available, using simulation mode...');
        return this.simulateZoraDeployment(config);
      }

    } catch (error: any) {
      console.error('❌ Zora deployment failed:', error);
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
      } else if (errorMessage.includes('API key')) {
        errorMessage = 'Zora API key required. Please set ZORA_API_KEY environment variable.';
      }
      
      // Fallback to simulation on any error
      console.log('🔄 Falling back to simulation mode due to error...');
      return this.simulateZoraDeployment(config);
    }
  }

  // Simulate Zora deployment for testing without spending gas
  async simulateZoraDeployment(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    console.log('🔄 Simulating Zora coin deployment for:', config.name, config.symbol);
    
    // Generate realistic-looking addresses
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    
    // Generate realistic token address
    const tokenAddress = `0x${random}${'0'.repeat(34)}`.slice(0, 42);
    
    // Generate realistic tx hash
    const txHash = `0x${'b'.repeat(8)}${timestamp.toString(16)}${'0'.repeat(48)}`.slice(0, 66);
    
    // Add a small delay to simulate network time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      tokenAddress,
      txHash,
      poolId: `zora-coin-${timestamp}`,
      bondingCurveAddress: `0x${'20720'.padEnd(40, '0')}`, // "zora" in hex-like format
      dopplerAddress: `0x${'20720'.padEnd(40, '0')}`,
      isSimulated: true,
      explorerUrl: this.chainId === 84532 
        ? `https://sepolia.basescan.org/tx/${txHash}`
        : `https://basescan.org/tx/${txHash}`,
      deploymentMethod: 'simulation'
    };
  }

  // Keep old simulation method for backwards compatibility
  async simulateDeployment(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    return this.simulateZoraDeployment(config);
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