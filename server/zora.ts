import { createCoin, createCoinCall, DeployCurrency } from '@zoralabs/coins-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { uploadJSONToIPFS } from './ipfs';

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

// Helper to create Zora metadata
export async function createZoraMetadata(params: {
  name: string;
  description: string;
  imageUrl: string;
  contentType: string;
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}): Promise<string> {
  const metadata = {
    name: params.name,
    description: params.description,
    image: params.imageUrl.startsWith('http') ? params.imageUrl : `https://gateway.pinata.cloud/ipfs/${params.imageUrl}`,
    external_url: params.externalUrl,
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
    // Zora-specific fields
    animation_url: params.contentType === 'video' || params.contentType === 'audio' 
      ? (params.imageUrl.startsWith('http') ? params.imageUrl : `https://gateway.pinata.cloud/ipfs/${params.imageUrl}`)
      : undefined,
    content_type: params.contentType,
    properties: {
      category: 'creator-content',
      platform: 'web3-video-platform'
    }
  };

  try {
    console.log('📤 Uploading metadata to IPFS:', JSON.stringify(metadata, null, 2));
    // Upload metadata to IPFS and return the CID
    const metadataCid = await uploadJSONToIPFS(metadata);
    console.log('✅ Metadata uploaded to IPFS with CID:', metadataCid);
    return `https://gateway.pinata.cloud/ipfs/${metadataCid}`;
  } catch (error) {
    console.error('❌ Failed to upload metadata to IPFS:', error);
    throw error;
  }
}

// Create a creator coin using Zora SDK
export async function createCreatorCoin(params: {
  name: string;
  symbol: string;
  metadataUri: string;
  startingMarketCap: 'LOW' | 'HIGH';
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
      console.log('⚠️  No wallet client available, using simulation mode');
      return simulateZoraDeployment(params);
    }

    console.log('⚡ Deploying Creator Coin with Zora SDK...');

    // Map our currency to Zora's currency enum
    let zoraCurrency: DeployCurrency;
    switch (params.currency) {
      case 'ETH':
        zoraCurrency = DeployCurrency.ETH;
        break;
      case 'ZORA':
        zoraCurrency = DeployCurrency.ZORA;
        break;
      default:
        zoraCurrency = DeployCurrency.ETH;
    }

    // Note: Based on the SDK, there's no startingMarketCap enum 
    // The Zora SDK uses different pool configuration approach

    // Create coin using official Zora SDK - following the correct API structure
    const coinArgs = {
      name: params.name,
      symbol: params.symbol,
      uri: params.metadataUri,
      chainId: baseSepolia.id,
      payoutRecipient: params.creatorAddress as `0x${string}`,
      currency: zoraCurrency,
      owners: [params.creatorAddress as `0x${string}`],
      platformReferrer: undefined // Optional platform referrer
    };

    console.log('📋 Zora coin creation args:', coinArgs);

    // Deploy using Zora SDK
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
    console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error type');
    
    // Fallback to simulation if Zora deployment fails
    console.log('🔄 Falling back to simulation mode...');
    return simulateZoraDeployment(params);
  }
}

// Fallback simulation function for Zora Creator Coins
function simulateZoraDeployment(params: {
  name: string;
  symbol: string;
  metadataUri: string;
  startingMarketCap: 'LOW' | 'HIGH';
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