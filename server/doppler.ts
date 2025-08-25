import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// UniPump contract addresses on Base Sepolia
const UNIPUMP_ADDRESSES = {
  84532: {
    creator: '0x4844d08A4B2dD5a2db165C02cFBc9676B51b92aF', // UniPumpCreator
    weth: '0x79AE52Ca5f25199afDD381c2B835eFFC6Ead4a9a', // WETH on Base Sepolia
  }
};

// Simple ABI for token creation
const CREATOR_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_symbol", "type": "string" },
      { "internalType": "string", "name": "_twitter", "type": "string" },
      { "internalType": "string", "name": "_discord", "type": "string" },
      { "internalType": "string", "name": "_bio", "type": "string" },
      { "internalType": "string", "name": "_imageUri", "type": "string" }
    ],
    "name": "createTokenSale",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

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
  private publicClient: any = null;
  private walletClient: any = null;
  private addresses: any = null;
  private chainId: number;

  constructor(chainId: number = 84532) { // Default to Base Sepolia for testing
    this.chainId = chainId;
    this.addresses = UNIPUMP_ADDRESSES[chainId];
    this.initialize();
  }

  private getRpcUrl(): string {
    return process.env.PONDER_RPC_URL_84532 || 'https://sepolia.base.org';
  }

  private initialize(): void {
    try {
      console.log(`🔧 Initializing UniPump Service for chain ${this.chainId}...`);

      if (!this.addresses) {
        throw new Error(`No addresses configured for chain ${this.chainId}`);
      }

      // Create public client for reading blockchain data
      this.publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(this.getRpcUrl())
      });

      // Create wallet client if private key is available
      const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
      if (privateKey) {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        this.walletClient = createWalletClient({
          account,
          chain: baseSepolia,
          transport: http(this.getRpcUrl())
        });
        console.log(`✅ Wallet client created with address: ${account.address}`);
      } else {
        console.log('⚠️ No DEPLOYER_PRIVATE_KEY found, will simulate deployments');
      }

      console.log(`✅ UniPump Service initialized successfully`);
    } catch (error) {
      console.error('Failed to initialize UniPump Service:', error);
      throw error;
    }
  }

  async deployPadToken(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    if (!this.addresses) {
      throw new Error('UniPump Service not properly initialized');
    }

    try {
      // Create token metadata URI from IPFS CID
      const imageUri = `https://gateway.pinata.cloud/ipfs/${config.mediaCid}`;

      if (this.walletClient) {
        // Real deployment using UniPump
        console.log('Deploying token with UniPump...');
        
        const { request } = await this.publicClient.simulateContract({
          address: this.addresses.creator as `0x${string}`,
          abi: CREATOR_ABI,
          functionName: 'createTokenSale',
          args: [
            config.name,           // _name
            config.symbol,         // _symbol
            '',                    // _twitter (empty for now)
            '',                    // _discord (empty for now)  
            config.name,           // _bio (use name as description)
            imageUri               // _imageUri
          ],
          account: this.walletClient.account
        });

        const txHash = await this.walletClient.writeContract(request);
        console.log(`Transaction sent: ${txHash}`);

        // Wait for transaction confirmation
        const receipt = await this.publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log(`Token deployed successfully: ${txHash}`);

        // Extract token address from logs (would need proper event parsing)
        // For now, we'll use a placeholder
        const tokenAddress = receipt.logs[0]?.address || `0x${Math.random().toString(16).slice(2, 42)}`;

        return {
          tokenAddress,
          txHash,
          poolId: `${config.symbol}-${Date.now()}`, // Generate pool ID
          bondingCurveAddress: this.addresses.creator,
        };
      } else {
        // Simulation mode
        console.log('Simulating token deployment (no private key)...');
        return this.simulateDeployment(config);
      }

    } catch (error: any) {
      console.error('Token deployment failed:', error);
      throw new Error(`Token deployment failed: ${error.message || error}`);
    }
  }

  // Simulate deployment for testing without spending gas
  async simulateDeployment(config: PadTokenConfig): Promise<TokenDeploymentResult> {
    console.log('Simulating deployment for:', config.name, config.symbol);
    
    // Generate realistic-looking addresses
    const timestamp = Date.now().toString(16);
    const random = Math.random().toString(16).slice(2, 8);
    
    return {
      tokenAddress: `0x${timestamp.slice(-6)}${random}${'0'.repeat(34 - timestamp.slice(-6).length - random.length)}`,
      txHash: `0x${Math.random().toString(16).slice(2)}${'0'.repeat(64)}`.slice(0, 66),
      poolId: `${config.symbol}-POOL-${timestamp}`,
      bondingCurveAddress: this.addresses?.creator || '0x0000000000000000000000000000000000000000',
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