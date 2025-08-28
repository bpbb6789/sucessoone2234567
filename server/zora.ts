import { 
  createCoin, 
  createCoinCall, 
  setApiKey,
  DeployCurrency
} from '@zoralabs/coins-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { uploadJSONToIPFS } from './ipfs';

// Initialize Zora SDK with API key
const zoraApiKey = process.env.ZORA_API_KEY;
if (zoraApiKey) {
  console.log('🔑 Initializing Zora SDK with API key...');
  setApiKey(zoraApiKey);
  console.log('✅ Zora SDK initialized successfully');
} else {
  console.warn('⚠️  ZORA_API_KEY not found - SDK may use rate-limited requests');
}

// Zora contract addresses - these are the official Zora addresses, NOT PumpFun
// Zora Factory on Base Sepolia (different from mainnet)
const ZORA_FACTORY_ADDRESS = '0x777777751622c0d3258f214F9DF38E35BF45baF3' as const;
const ZORA_HOOK_REGISTRY = '0x777777C4c14b133858c3982D41Dbf02509fc18d7' as const;

// Create public client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Get deployment account (server-side signing for demonstration)
const getDeploymentAccount = () => {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.log('⚠️  DEPLOYER_PRIVATE_KEY not found, using simulation mode');
    return null;
  }
  try {
    return privateKeyToAccount(privateKey as `0x${string}`);
  } catch (error) {
    console.error('❌ Invalid DEPLOYER_PRIVATE_KEY format');
    return null;
  }
};

// Create wallet client for deployments
const getWalletClient = () => {
  const account = getDeploymentAccount();
  if (!account) {
    return null;
  }
  
  return createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });
};

// Helper to create Zora metadata (simplified - SDK doesn't have metadata builder)
export async function createZoraMetadata(params: {
  name: string;
  description: string;
  imageUrl: string;
  contentType: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}): Promise<string> {
  try {
    console.log('📝 Creating Zora metadata...');
    console.log('Input params:', {
      name: params.name,
      description: params.description,
      imageUrl: params.imageUrl,
      contentType: params.contentType
    });
    
    const metadata = {
      name: params.name,
      description: params.description,
      image: params.imageUrl.startsWith('http') ? params.imageUrl : `https://gateway.pinata.cloud/ipfs/${params.imageUrl}`,
      attributes: [
        {
          trait_type: 'Content Type',
          value: params.contentType
        },
        {
          trait_type: 'Creator Platform',
          value: 'Web3 Video Platform'
        },
        ...(params.attributes || [])
      ],
      animation_url: params.contentType === 'video' || params.contentType === 'audio' 
        ? (params.imageUrl.startsWith('http') ? params.imageUrl : `https://gateway.pinata.cloud/ipfs/${params.imageUrl}`)
        : undefined
    };

    console.log('📤 Uploading metadata to IPFS:', JSON.stringify(metadata, null, 2));
    
    // Upload metadata to IPFS and return the URI
    const metadataCid = await uploadJSONToIPFS(metadata);
    console.log('📦 Metadata uploaded with CID:', metadataCid);
    
    const metadataUri = `https://gateway.pinata.cloud/ipfs/${metadataCid}`;
    
    console.log('✅ Metadata created successfully:', metadataUri);
    return metadataUri;
  } catch (error) {
    console.error('❌ Failed to create Zora metadata:', error);
    throw error;
  }
}

// Create a creator coin using Zora SDK (actual API)
export async function createCreatorCoin(params: {
  name: string;
  symbol: string;
  uri: string;
  currency: string;
  creatorAddress: string;
}): Promise<{
  coinAddress: string;
  factoryAddress: string;
  txHash: string;
}> {
  console.log('🔧 Starting Zora Creator Coin deployment...');
  console.log('Parameters:', params);
  
  try {
    const walletClient = getWalletClient();
    
    if (!walletClient) {
      const errorMsg = 'DEPLOYER_PRIVATE_KEY not found in environment variables. Real deployment requires a valid private key with funds on Base Sepolia.';
      console.error('❌ Deployment Error:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('⚡ Deploying Creator Coin with Zora SDK...');
    console.log('🔑 Using deployer address:', walletClient.account.address);

    // Check deployer balance before deployment
    const balance = await publicClient.getBalance({
      address: walletClient.account.address
    });
    console.log(`💰 Deployer balance: ${balance} wei (${Number(balance) / 1e18} ETH)`);

    if (balance === 0n) {
      throw new Error(`Deployer wallet ${walletClient.account.address} has no ETH balance. Please add testnet ETH to deploy.`);
    }

    // Map our currency to Zora's actual DeployCurrency enum
    let zoraCurrency = DeployCurrency.ETH; // Default to ETH
    switch (params.currency) {
      case 'ETH':
        zoraCurrency = DeployCurrency.ETH;
        break;
      case 'ZORA':
        zoraCurrency = DeployCurrency.ZORA;
        break;
    }

    // Use the actual Zora SDK API structure (no startingMarketCap in real API)
    const coinArgs = {
      name: params.name,
      symbol: params.symbol,
      uri: params.uri,
      chainId: baseSepolia.id,
      payoutRecipient: params.creatorAddress as `0x${string}`,
      currency: zoraCurrency,
      platformReferrer: undefined // Optional platform referrer
    };

    console.log('📋 Zora coin creation args:', coinArgs);

    // Deploy using actual Zora SDK API
    const result = await createCoin(
      coinArgs,
      walletClient,
      publicClient,
      {
        gasMultiplier: 1.2
      }
    );

    console.log('✅ Zora Creator Coin deployed successfully:', result);

    return {
      coinAddress: result.address || '',
      factoryAddress: ZORA_FACTORY_ADDRESS,
      txHash: result.hash || ''
    };

  } catch (error) {
    console.error('❌ Zora Creator Coin deployment failed:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error type');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Log additional error details for debugging
    if (error && typeof error === 'object') {
      console.error('Error object keys:', Object.keys(error));
      if ('code' in error) console.error('Error code:', error.code);
      if ('reason' in error) console.error('Error reason:', error.reason);
      if ('data' in error) console.error('Error data:', error.data);
    }
    
    // Re-throw the actual error instead of falling back to simulation
    throw error;
  }
}

// Fallback simulation function for Zora Creator Coins
function simulateZoraDeployment(params: {
  name: string;
  symbol: string;
  uri: string;
  currency: string;
  creatorAddress: string;
}) {
  console.log('🎭 Using simulation mode for Zora Creator Coin deployment');
  
  const simulatedCoinAddress = `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`;
  const simulatedTxHash = `0x${Math.random().toString(16).slice(2, 66).padStart(64, '0')}`;
  
  const result = {
    coinAddress: simulatedCoinAddress,
    factoryAddress: ZORA_FACTORY_ADDRESS, // Use Zora factory, not PumpFun
    txHash: simulatedTxHash
  };
  
  console.log('✅ Zora simulation completed:', result);
  return result;
}

// Get coin price from Zora/Uniswap V4
export async function getCoinPrice(coinAddress: string): Promise<{
  price: string;
  marketCap: string;
  volume24h: string;
  holders: number;
}> {
  try {
    // In a real implementation, this would query Zora's APIs or Uniswap V4 pools
    // For now, we'll return simulated data
    
    return {
      price: (Math.random() * 0.01 + 0.000001).toFixed(6),
      marketCap: (Math.random() * 10000).toFixed(2),
      volume24h: (Math.random() * 1000).toFixed(2),
      holders: Math.floor(Math.random() * 1000)
    };
  } catch (error) {
    console.error('Error fetching coin price:', error);
    throw new Error('Failed to fetch coin price data');
  }
}

// Get bonding curve progress
export async function getBondingCurveProgress(coinAddress: string): Promise<number> {
  try {
    // In a real implementation, this would query the bonding curve contract
    // For now, return a simulated progress
    return Math.floor(Math.random() * 100);
  } catch (error) {
    console.error('Error fetching bonding curve progress:', error);
    return 0;
  }
}

// Validate content for tokenization
export function validateContentForTokenization(contentType: string, fileSize: number): {
  isValid: boolean;
  error?: string;
} {
  const maxSizes = {
    image: 50 * 1024 * 1024, // 50MB
    video: 500 * 1024 * 1024, // 500MB
    audio: 100 * 1024 * 1024, // 100MB
    gif: 50 * 1024 * 1024, // 50MB
    document: 10 * 1024 * 1024 // 10MB
  };

  const allowedTypes = ['image', 'video', 'audio', 'gif', 'document'];

  if (!allowedTypes.includes(contentType)) {
    return {
      isValid: false,
      error: `Content type '${contentType}' is not supported for tokenization`
    };
  }

  const maxSize = maxSizes[contentType as keyof typeof maxSizes];
  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size for ${contentType} (${Math.round(maxSize / (1024 * 1024))}MB)`
    };
  }

  return { isValid: true };
}

// Generate thumbnail for content
export async function generateThumbnail(contentType: string, contentCid: string): Promise<string | null> {
  try {
    // In a real implementation, this would generate thumbnails for videos/audio
    // For now, return null - thumbnails would be generated on the frontend or via external service
    if (contentType === 'video' || contentType === 'audio') {
      // Placeholder for thumbnail generation
      return null;
    }
    return null;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}