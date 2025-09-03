
import { createPublicClient, createWalletClient, http, parseEther, Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

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
  explorerUrl?: string;
  deploymentMethod: 'doppler';
}

export interface DopplerTokenConfig {
  name: string;
  symbol: string;
  totalSupply: bigint;
  tokensForSale: bigint;
  tokenURI: string;
  startTime: number;
  duration: number;
  fee: number;
  tickSpacing: number;
  minProceeds: bigint;
  maxProceeds: bigint;
  creator: Address;
  integrator: Address;
}

export class DopplerV4Service {
  private publicClient: any = null;
  private walletClient: any = null;
  private chainId: number;
  
  // Doppler V4 Contract Addresses (from GitHub repo)
  private readonly DOPPLER_ADDRESSES = {
    84532: { // Base Sepolia
      dopplerV4Factory: '0x0000000000000000000000000000000000000000', // Will be updated with actual addresses
      dopplerV4Initializer: '0x0000000000000000000000000000000000000000',
      airlock: '0x0000000000000000000000000000000000000000',
      stateView: '0x0000000000000000000000000000000000000000'
    },
    8453: { // Base Mainnet
      dopplerV4Factory: '0x0000000000000000000000000000000000000000',
      dopplerV4Initializer: '0x0000000000000000000000000000000000000000', 
      airlock: '0x0000000000000000000000000000000000000000',
      stateView: '0x0000000000000000000000000000000000000000'
    }
  };

  constructor(chainId: number = 84532) {
    this.chainId = chainId;
    this.initialize();
  }

  private getRpcUrl(): string {
    if (this.chainId === 84532) {
      return process.env.PONDER_RPC_URL_84532 || 'https://sepolia.base.org';
    }
    return 'https://mainnet.base.org';
  }

  private async initialize(): Promise<void> {
    try {
      console.log(`🔧 Initializing Doppler V4 Service for chain ${this.chainId}...`);

      const addresses = this.DOPPLER_ADDRESSES[this.chainId as keyof typeof this.DOPPLER_ADDRESSES];
      if (!addresses) {
        throw new Error(`No Doppler addresses configured for chain ${this.chainId}`);
      }

      console.log('📍 Using Doppler V4 addresses:', addresses);

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
      } else {
        console.log('⚠️ No DEPLOYER_PRIVATE_KEY found, deployments will fail');
      }

      console.log(`✅ Doppler V4 Service initialized successfully`);
    } catch (error) {
      console.error('Failed to initialize Doppler V4 Service:', error);
      throw error;
    }
  }

  // Doppler V4 Factory ABI (simplified for basic operations)
  private readonly DOPPLER_V4_FACTORY_ABI = [
    {
      name: 'createDynamicAuction',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: 'config', type: 'tuple', components: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'totalSupply', type: 'uint256' },
          { name: 'tokensForSale', type: 'uint256' },
          { name: 'tokenURI', type: 'string' },
          { name: 'startTime', type: 'uint256' },
          { name: 'duration', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'minProceeds', type: 'uint256' },
          { name: 'maxProceeds', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'integrator', type: 'address' }
        ]}
      ],
      outputs: [
        { name: 'tokenAddress', type: 'address' },
        { name: 'auctionAddress', type: 'address' }
      ]
    }
  ] as const;

  async deployPadToken(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    try {
      if (!this.walletClient || !this.publicClient) {
        throw new Error('No wallet client available! DEPLOYER_PRIVATE_KEY must be set for real deployments.');
      }

      console.log('🚀 Deploying token using Doppler V4 Protocol...');
      
      // Create token metadata URI from IPFS CID
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${config.mediaCid}`;
      
      // Get current block timestamp
      const block = await this.publicClient.getBlock({ blockTag: 'latest' });
      const currentTimestamp = Number(block.timestamp);
      
      // Configure Doppler deployment parameters
      const dopplerConfig: DopplerTokenConfig = {
        name: config.name,
        symbol: config.symbol,
        totalSupply: config.totalSupply || parseEther('1000000'), // Default 1M tokens
        tokensForSale: config.numTokensToSell || parseEther('500000'), // Default 500K for sale
        tokenURI,
        startTime: currentTimestamp + 60, // Start in 1 minute
        duration: 86400 * 7, // 7 days duration
        fee: 3000, // 0.3% fee
        tickSpacing: 60, // Standard tick spacing
        minProceeds: parseEther('0.01'), // Minimum 0.01 ETH
        maxProceeds: parseEther('10'), // Maximum 10 ETH
        creator: config.creatorAddress as Address,
        integrator: config.creatorAddress as Address // Use creator as integrator
      };

      console.log('📝 Creating token with Doppler V4 config:', dopplerConfig);

      const addresses = this.DOPPLER_ADDRESSES[this.chainId as keyof typeof this.DOPPLER_ADDRESSES];
      
      // Call the Doppler V4 Factory contract
      const { request } = await this.publicClient.simulateContract({
        address: addresses.dopplerV4Factory as Address,
        abi: this.DOPPLER_V4_FACTORY_ABI,
        functionName: 'createDynamicAuction',
        args: [dopplerConfig],
        account: this.walletClient.account,
        value: parseEther('0') // No ETH required for deployment
      });

      // Execute the transaction
      const txHash = await this.walletClient.writeContract(request);
      console.log('📡 Transaction submitted:', txHash);

      // Wait for transaction receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: txHash,
        timeout: 60000 // 60 second timeout
      });

      console.log('✅ Transaction confirmed:', receipt);

      // Parse the logs to get token and auction addresses
      let tokenAddress = '0x0000000000000000000000000000000000000000';
      let auctionAddress = '0x0000000000000000000000000000000000000000';

      // Look for TokenCreated and AuctionCreated events in logs
      for (const log of receipt.logs) {
        try {
          // This is a simplified version - in reality you'd decode the logs properly
          if (log.topics[0] && log.data) {
            // Extract addresses from logs (this would need proper event decoding)
            tokenAddress = `0x${log.data.slice(26, 66)}`;
            auctionAddress = `0x${log.data.slice(90, 130)}`;
          }
        } catch (e) {
          // Skip invalid logs
        }
      }
        
      return {
        tokenAddress,
        txHash,
        poolId: `doppler-v4-${Date.now()}`,
        bondingCurveAddress: auctionAddress,
        dopplerAddress: auctionAddress,
        explorerUrl: this.chainId === 84532 
          ? `https://sepolia.basescan.org/tx/${txHash}`
          : `https://basescan.org/tx/${txHash}`,
        deploymentMethod: 'doppler'
      };

    } catch (error: any) {
      console.error('❌ Doppler V4 deployment failed:', error);
      
      // Extract meaningful error message
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
        errorMessage = 'Transaction reverted. The Doppler V4 contracts may not be deployed on this network yet.';
      } else if (errorMessage.includes('CALL_EXCEPTION')) {
        errorMessage = 'Contract call failed. Doppler V4 may not be available on this network.';
      }
      
      throw new Error(errorMessage);
    }
  }

  // Get current token price from Doppler auction
  async getCurrentPrice(tokenAddress: string, auctionAddress: string): Promise<string> {
    try {
      if (!this.publicClient) {
        return '0.000001';
      }

      // This would call the Doppler auction contract to get current price
      // For now return a placeholder
      console.log('📊 Getting current price for Doppler auction:', auctionAddress);
      
      // In real implementation, you'd call:
      // const price = await this.publicClient.readContract({
      //   address: auctionAddress as Address,
      //   abi: DOPPLER_AUCTION_ABI,
      //   functionName: 'getCurrentPrice'
      // });
      
      return '0.000001';
    } catch (error) {
      console.error('Failed to get current price:', error);
      return '0.000001';
    }
  }

  // Check if auction has ended and tokens migrated
  async hasGraduated(tokenAddress: string, auctionAddress: string): Promise<boolean> {
    try {
      if (!this.publicClient) {
        return false;
      }

      console.log('🎓 Checking graduation status for:', tokenAddress);
      
      // In real implementation, you'd call:
      // const isComplete = await this.publicClient.readContract({
      //   address: auctionAddress as Address,
      //   abi: DOPPLER_AUCTION_ABI,
      //   functionName: 'isAuctionComplete'
      // });
      
      return false;
    } catch (error) {
      console.error('Failed to check graduation status:', error);
      return false;
    }
  }

  // Get quote for buying tokens in the auction
  async getQuote(tokenAddress: string, auctionAddress: string, ethAmount: bigint): Promise<bigint> {
    try {
      if (!this.publicClient) {
        return BigInt(0);
      }

      console.log('💰 Getting quote for ETH amount:', ethAmount.toString());
      
      // In real implementation, you'd call:
      // const tokens = await this.publicClient.readContract({
      //   address: auctionAddress as Address,
      //   abi: DOPPLER_AUCTION_ABI,
      //   functionName: 'getTokensForEth',
      //   args: [ethAmount]
      // });
      
      // For now, return a simple calculation
      return ethAmount * BigInt(1000); // 1000 tokens per ETH
    } catch (error) {
      console.error('Failed to get quote:', error);
      return BigInt(0);
    }
  }

  // Buy tokens in the Dutch auction
  async buyTokens(auctionAddress: string, ethAmount: bigint): Promise<string> {
    try {
      if (!this.walletClient || !this.publicClient) {
        throw new Error('No wallet client available');
      }

      console.log('🛒 Buying tokens in Doppler auction:', auctionAddress);
      
      // In real implementation, you'd call the auction contract
      // const { request } = await this.publicClient.simulateContract({
      //   address: auctionAddress as Address,
      //   abi: DOPPLER_AUCTION_ABI,
      //   functionName: 'buyTokens',
      //   value: ethAmount,
      //   account: this.walletClient.account
      // });
      // 
      // const txHash = await this.walletClient.writeContract(request);
      
      throw new Error('Buy functionality not yet implemented - Doppler V4 contracts need to be deployed');
    } catch (error) {
      console.error('Failed to buy tokens:', error);
      throw error;
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
