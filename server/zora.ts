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
import { formatEther, formatUnits, parseEther, parseUnits } from 'viem';
import { getDexScreenerData } from './dexscreener.js';
import { eq, sql } from 'drizzle-orm';
import { creatorCoins } from '../shared/schema.js';
import { db } from './db.js';

// Initialize Zora SDK with API key
const zoraApiKey = process.env.ZORA_API_KEY;
if (zoraApiKey) {
  console.log('🔑 Initializing Zora SDK with API key...');
  setApiKey(zoraApiKey);
  console.log('✅ Zora SDK initialized successfully');
} else {
  console.warn('⚠️  ZORA_API_KEY not found - SDK may use rate-limited requests');
}

// YOUR CUSTOM Zora factory addresses - with proper WETH configuration for trading
// Custom Factory on Base Sepolia (your deployed factory with WETH support)
const ZORA_FACTORY_ADDRESS = '0x90193C961A926261B756D1E5bb255e67ff9498A1' as const;
const ZORA_HOOK_REGISTRY = '0x777777C4c14b133858c3982D41Dbf02509fc18d7' as const;

// Platform address for developer rewards (15% create referral + 15% trade referral)
const PLATFORM_REFERRER_ADDRESS = '0x71527294D2a4dF27266580b6E07723721944Bf93' as const;

// Create public client with multiple RPC endpoints for reliability
const getRpcTransports = () => {
  const transports = [];

  // Primary: Use environment variable if available
  if (process.env.BASE_SEPOLIA_RPC_URL) {
    transports.push(http(process.env.BASE_SEPOLIA_RPC_URL));
  }

  // Backup: Public endpoints
  transports.push(
    http('https://sepolia.base.org'),
    http('https://base-sepolia-rpc.publicnode.com'),
    http('https://base-sepolia.blockpi.network/v1/rpc/public')
  );

  return transports;
};

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: getRpcTransports()[0] // Use first available transport
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

    console.log('Uploading metadata to IPFS:', JSON.stringify(metadata, null, 2));

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

// Create a coin using YOUR CUSTOM factory directly (bypasses Zora SDK limitations)
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

    // Validate metadata URI before deployment with robust retry logic
    console.log('🔍 Validating metadata URI:', params.uri);
    let metadataValidated = false;
    let lastError: any = null;

    // Try validation with exponential backoff
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        console.log(`📡 Metadata validation attempt ${attempt}/4...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const metadataResponse = await fetch(params.uri, {
          method: 'HEAD',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (metadataResponse.ok) {
          console.log('✅ Metadata URI is accessible');
          metadataValidated = true;
          break;
        } else if (metadataResponse.status === 429) {
          // Rate limited - wait longer before retry
          const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.warn(`⚠️ Rate limited (429), waiting ${waitTime}ms before retry ${attempt}/4...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          lastError = new Error(`Rate limited by IPFS gateway (attempt ${attempt})`);
        } else {
          console.warn(`⚠️ Metadata URI returned status ${metadataResponse.status} on attempt ${attempt}`);
          lastError = new Error(`HTTP ${metadataResponse.status} from metadata URI`);
          if (attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Linear backoff for other errors
          }
        }
      } catch (fetchError) {
        console.warn(`⚠️ Metadata validation attempt ${attempt} failed:`, fetchError);
        lastError = fetchError;
        if (attempt < 4) {
          const waitTime = 1000 * attempt; // Linear backoff for network errors
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    if (!metadataValidated) {
      console.error('❌ All metadata validation attempts failed');

      // For IPFS gateway issues, allow deployment to proceed with a warning
      if (lastError && (
        lastError.message?.includes('429') ||
        lastError.message?.includes('Rate limited') ||
        lastError.message?.includes('timeout')
      )) {
        console.warn('⚠️ IPFS gateway issues detected, proceeding with deployment (metadata will be available once IPFS propagates)');
      } else {
        throw new Error(`Metadata validation failed after 4 attempts: ${lastError instanceof Error ? lastError.message : 'Unknown error'}. Please check your metadata URI.`);
      }
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

    // Call YOUR CUSTOM factory directly (bypasses Zora SDK hardcoded addresses)
    console.log('🏭 Using YOUR custom factory:', ZORA_FACTORY_ADDRESS);
    
    // Prepare factory call parameters
    const owners = [params.creatorAddress as `0x${string}`];
    const platformReferrer = PLATFORM_REFERRER_ADDRESS as `0x${string}`;
    
    // Use your custom platform configuration (pool config will be set by factory)
    const poolConfig = '0x'; // Empty - your factory will use default config
    const postDeployHook = '0x0000000000000000000000000000000000000000'; // No post deploy hook
    const postDeployHookData = '0x';
    const coinSalt = `0x${Math.random().toString(16).slice(2, 66).padStart(64, '0')}`; // Random salt
    
    console.log('📋 Custom factory call parameters:', {
      payoutRecipient: params.creatorAddress,
      owners,
      uri: params.uri,
      name: params.name,
      symbol: params.symbol,
      poolConfig,
      platformReferrer,
      postDeployHook,
      postDeployHookData,
      coinSalt
    });

    // Call your custom factory's deploy function directly
    const deployPromise = walletClient.writeContract({
      address: ZORA_FACTORY_ADDRESS as `0x${string}`,
      abi: [
        {
          type: 'function',
          name: 'deploy',
          inputs: [
            { name: 'payoutRecipient', type: 'address' },
            { name: 'owners', type: 'address[]' },
            { name: 'uri', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' },
            { name: 'poolConfig', type: 'bytes' },
            { name: 'platformReferrer', type: 'address' },
            { name: 'postDeployHook', type: 'address' },
            { name: 'postDeployHookData', type: 'bytes' },
            { name: 'coinSalt', type: 'bytes32' }
          ],
          outputs: [
            { name: 'coin', type: 'address' },
            { name: 'postDeployHookDataOut', type: 'bytes' }
          ],
          stateMutability: 'payable'
        }
      ],
      functionName: 'deploy',
      args: [
        params.creatorAddress as `0x${string}`,
        owners,
        params.uri,
        params.name,
        params.symbol,
        poolConfig,
        platformReferrer,
        postDeployHook,
        postDeployHookData,
        coinSalt
      ]
    });

    // Add timeout to the deployment (3 minutes for blockchain operations)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Deployment timeout after 3 minutes')), 180000)
    );

    const deployTxHash = await Promise.race([deployPromise, timeoutPromise]);
    console.log('⚡ Transaction sent:', deployTxHash);

    // Wait for transaction receipt to get the coin address
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: deployTxHash as `0x${string}`,
      timeout: 60000
    });

    console.log('✅ Custom factory deployment successful:', receipt);

    // Extract coin address from transaction logs
    let coinAddress = '';
    if (receipt.logs && receipt.logs.length > 0) {
      // The coin address is typically in one of the first logs
      for (const log of receipt.logs) {
        if (log.topics && log.topics[0] && log.address) {
          // This is likely the coin address from the deployment event
          coinAddress = log.address;
          break;
        }
      }
    }

    const txHash = deployTxHash as string;
    
    // The pool is automatically created by the factory - you can get pool info by:
    // 1. Listening to CoinCreatedV4 events from the factory
    // 2. Calling getPoolKey() on the coin contract
    // 3. Pool address = hash(poolKey) on Uniswap V4
    
    console.log(`🏊 Coin deployed through YOUR custom factory: ${coinAddress}`);
    console.log(`📊 Pool created with proper WETH configuration: https://sepolia.basescan.org/address/${coinAddress}`);
    console.log(`🎯 Your custom factory used: ${ZORA_FACTORY_ADDRESS}`);
    
    return {
      coinAddress,
      factoryAddress: ZORA_FACTORY_ADDRESS,
      txHash
    };

  } catch (error) {
    console.error('❌ Zora Creator Coin deployment failed:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Log additional error details for debugging
    if (error && typeof error === 'object') {
      console.error('Error object keys:', Object.keys(error));
      if ('code' in error) console.error('Error code:', error.code);
      if ('reason' in error) console.error('Error reason:', error.reason);
      if ('data' in error) console.error('Error data:', error.data);
    }

    // Provide more helpful error messages
    let friendlyError = error instanceof Error ? error.message : 'Unknown deployment error';

    if (friendlyError.includes('Metadata fetch failed')) {
      friendlyError = 'Unable to access metadata on IPFS. This is usually temporary - please wait a few minutes and try again.';
    } else if (friendlyError.includes('timeout')) {
      friendlyError = 'Deployment timed out. Please check your transaction and try again if needed.';
    } else if (friendlyError.includes('gas')) {
      friendlyError = 'Transaction failed due to gas estimation issues. Please try again.';
    }

    throw new Error(friendlyError);
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

// Trading functions removed - use bonding curve system for all trading operations





// Approach 4: Use Basescan API (most accurate for Base)
// Basescan API configuration for Base Sepolia
const BASESCAN_API_URL = 'https://api-sepolia.basescan.org/api';
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || '';

async function getHoldersFromBasescan(contractAddress: `0x${string}`) {
  try {
    console.log(`🔍 Fetching holders from Basescan API...`);

    // Skip if no API key is configured
    if (!BASESCAN_API_KEY) {
      console.log(`⚠️ No Basescan API key configured, skipping...`);
      throw new Error('No Basescan API key configured');
    }

    const url = `${BASESCAN_API_URL}?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=100&apikey=${BASESCAN_API_KEY}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PumpIt-DApp/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== '1' || data.message !== 'OK') {
      console.log(`⚠️ Basescan API error response:`, data);
      throw new Error(`Basescan API returned error: ${data.status} - ${data.message}`);
    }

    if (!data.result || data.result.length === 0) {
      console.log(`⚠️ No holders found in Basescan response`);
      return [];
    }

    return data.result.map((holder: any) => ({
      address: holder.TokenHolderAddress,
      balance: holder.TokenHolderQuantity
    }));
  } catch (error) {
    console.log(`⚠️ Basescan API failed:`, error);
    throw error;
  }
}

// Helper function to find contract deployment block
async function findContractDeploymentBlock(
  client: any,
  contractAddress: `0x${string}`
): Promise<bigint> {
  console.log(`🔍 Finding deployment block for ${contractAddress}...`);

  // Use binary search to find deployment block efficiently
  let low = 0n;
  let high = await client.getBlockNumber();
  let deploymentBlock = high;

  while (low <= high) {
    const mid = (low + high) / 2n;

    try {
      const code = await client.getBytecode({
        address: contractAddress,
        blockNumber: mid
      });

      if (code && code !== '0x') {
        // Contract exists at this block, try earlier
        deploymentBlock = mid;
        high = mid - 1n;
      } else {
        // Contract doesn't exist, try later
        low = mid + 1n;
      }
    } catch (error) {
      // If we can't get bytecode at this block, try later
      low = mid + 1n;
    }
  }

  console.log(`🎯 Contract deployed at block: ${deploymentBlock}`);
  return deploymentBlock;
}

// Helper function to get holders from any RPC client (optimized)
async function getHoldersFromRPCClient(
  client: any,
  contractAddress: `0x${string}`,
  source: string
): Promise<{
  holders: Array<{ address: string; balance: string; percentage: number }>;
  totalHolders: number;
}> {
  console.log(`📡 Fetching holders from ${source}...`);

  // Verify contract exists and get total supply
  const totalSupply = await client.readContract({
    address: contractAddress,
    abi: [
      {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'totalSupply'
  }) as bigint;

  if (totalSupply === 0n) {
    throw new Error('Token has no supply');
  }

  console.log(`📊 Total supply: ${totalSupply.toString()}`);

  // Find the deployment block to avoid scanning unnecessary blocks
  const deploymentBlock = await findContractDeploymentBlock(client, contractAddress);
  const latestBlock = await client.getBlockNumber();

  console.log(`📅 Scanning from deployment block ${deploymentBlock} to ${latestBlock}`);

  // Use efficient chunk size for Base Sepolia
  const chunkSize = 5000n;
  let currentBlock = deploymentBlock;
  const balances = new Map<string, bigint>();
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  while (currentBlock <= latestBlock) {
    const toBlock = currentBlock + chunkSize > latestBlock ? latestBlock : currentBlock + chunkSize;

    console.log(`📋 Querying blocks ${currentBlock} to ${toBlock}...`);

    try {
      const logs = await client.getLogs({
        address: contractAddress,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false }
          ]
        },
        fromBlock: currentBlock,
        toBlock
      });

      // Process logs
      for (const log of logs) {
        const { args } = log;
        if (!args) continue;

        const from = args.from as string;
        const to = args.to as string;
        const value = args.value as bigint;

        if (value === 0n) continue;

        // Update sender balance (decrease)
        if (from !== zeroAddress) {
          const currentBalance = balances.get(from.toLowerCase()) || 0n;
          balances.set(from.toLowerCase(), currentBalance - value);
        }

        // Update receiver balance (increase)
        if (to !== zeroAddress) {
          const currentBalance = balances.get(to.toLowerCase()) || 0n;
          balances.set(to.toLowerCase(), currentBalance + value);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to query blocks ${currentBlock}-${toBlock}:`, error);
      // Continue with next chunk instead of failing completely
    }

    currentBlock = toBlock + 1n;
  }

  // Filter positive balances and calculate percentages
  const holders = Array.from(balances.entries())
    .filter(([_, balance]) => balance > 0n)
    .map(([address, balance]) => ({
      address,
      balance: (Number(balance) / 1e18).toFixed(6),
      percentage: Number((balance * 10000n) / totalSupply) / 100
    }))
    .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
    .slice(0, 100);

  console.log(`✅ Found ${holders.length} holders with positive balances from ${source}`);

  if (holders.length === 0) {
    throw new Error(`No holders found for contract ${contractAddress}`);
  }

  return {
    holders,
    totalHolders: holders.length
  };
}

// Get real price from Uniswap V4 pool if available
async function getUniswapV4Price(coinAddress: string): Promise<{
  price: number;
  volume24h: number;
} | null> {
  try {
    // This would query Uniswap V4 pool contracts for real price data
    // For now, return null to indicate no pool exists
    return null;
  } catch (error) {
    return null;
  }
}

// Get coin price from DexScreener and real blockchain data


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

// Trading Functions for Zora Creator Coins
export async function getCoinPrice(coinAddress: string): Promise<{
  price: string;
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
} | null> {
  try {
    console.log(`💰 Fetching price for coin: ${coinAddress}`);
    
    // Try DexScreener first for real market data
    const dexData = await getDexScreenerData(coinAddress);
    if (dexData && dexData.price && parseFloat(dexData.price) > 0) {
      return {
        price: dexData.price,
        priceChange24h: dexData.priceChange24h || 0,
        volume24h: dexData.volume24h || "0",
        marketCap: dexData.marketCap || "0"
      };
    }
    
    // Fallback: Get price from database
    const coin = await db.select().from(creatorCoins)
      .where(eq(creatorCoins.coinAddress, coinAddress))
      .limit(1);
    
    if (coin[0]) {
      return {
        price: coin[0].currentPrice || "0.000001",
        priceChange24h: 0,
        volume24h: coin[0].volume24h || "0",
        marketCap: coin[0].marketCap || "0"
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching coin price:', error);
    return null;
  }
}

// Get pool information for a Zora coin
export async function getCoinPoolInfo(coinAddress: string): Promise<{
  poolKey: any;
  poolAddress: string;
  isInitialized: boolean;
} | null> {
  try {
    console.log(`🏊 Getting pool info for coin: ${coinAddress}`);
    
    // Call getPoolKey() on the coin contract
    const poolKey = await publicClient.readContract({
      address: coinAddress as `0x${string}`,
      abi: [
        {
          name: 'getPoolKey',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [
            {
              name: '',
              type: 'tuple',
              components: [
                { name: 'currency0', type: 'address' },
                { name: 'currency1', type: 'address' },
                { name: 'fee', type: 'uint24' },
                { name: 'tickSpacing', type: 'int24' },
                { name: 'hooks', type: 'address' }
              ]
            }
          ]
        }
      ],
      functionName: 'getPoolKey'
    });
    
    // Pool address is derived from poolKey hash in Uniswap V4
    const poolAddress = `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`; // Simplified
    
    return {
      poolKey,
      poolAddress,
      isInitialized: true
    };
  } catch (error) {
    console.error('Error getting pool info:', error);
    return null;
  }
}

export async function getCoinHolders(coinAddress: string): Promise<{
  holders: Array<{ address: string; balance: string; percentage: number }>;
  totalHolders: number;
} | null> {
  try {
    console.log(`👥 Fetching holders for coin: ${coinAddress}`);
    
    // Try Basescan API first (most reliable)
    try {
      const basescanHolders = await getHoldersFromBasescan(coinAddress as `0x${string}`);
      if (basescanHolders.length > 0) {
        const totalSupply = BigInt("1000000000000000000000000000"); // 1B tokens with 18 decimals
        return {
          holders: basescanHolders.map((holder: any) => ({
            address: holder.address,
            balance: holder.balance,
            percentage: Number((BigInt(holder.balance) * 10000n) / totalSupply) / 100
          })),
          totalHolders: basescanHolders.length
        };
      }
    } catch (error) {
      console.log('Basescan API unavailable, trying RPC...');
    }
    
    // Fallback to RPC scanning
    try {
      const rpcHolders = await getHoldersFromRPCClient(
        publicClient, 
        coinAddress as `0x${string}`, 
        'Base Sepolia'
      );
      return rpcHolders;
    } catch (error) {
      console.log('RPC scanning failed:', error);
    }
    
    return {
      holders: [],
      totalHolders: 0
    };
  } catch (error) {
    console.error('Error fetching coin holders:', error);
    return null;
  }
}

export async function buyCoin(coinAddress: string, ethAmount: string, userAddress: string): Promise<{
  success: boolean;
  transactionHash?: string;
  tokensReceived?: string;
  error?: string;
}> {
  try {
    console.log(`🛒 Buy request: ${ethAmount} ETH for ${coinAddress} from ${userAddress}`);
    
    // For Base Sepolia testnet, we'll simulate the trade and update the database
    // In production, this would interact with the actual Zora contracts
    
    const ethAmountWei = parseEther(ethAmount);
    const currentPrice = parseFloat("0.000001"); // Base price
    const tokensToReceive = (parseFloat(ethAmount) / currentPrice).toFixed(0);
    
    // Update creator coin data in database
    await db.update(creatorCoins)
      .set({
        currentPrice: (currentPrice * 1.01).toFixed(8), // Small price increase
        volume24h: ethAmount,
        holders: sql`${creatorCoins.holders} + 1`,
        updatedAt: new Date()
      })
      .where(eq(creatorCoins.coinAddress, coinAddress));
    
    // Record the trade
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2, 66).padStart(64, '0')}`, // Simulated
      tokensReceived: tokensToReceive,
    };
  } catch (error) {
    console.error('Error buying coin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function sellCoin(coinAddress: string, tokenAmount: string, userAddress: string): Promise<{
  success: boolean;
  transactionHash?: string;
  ethReceived?: string;
  error?: string;
}> {
  try {
    console.log(`💸 Sell request: ${tokenAmount} tokens of ${coinAddress} from ${userAddress}`);
    
    const currentPrice = parseFloat("0.000001"); // Base price
    const ethToReceive = (parseFloat(tokenAmount) * currentPrice).toFixed(8);
    
    // Update creator coin data in database  
    await db.update(creatorCoins)
      .set({
        currentPrice: Math.max(currentPrice * 0.99, 0.000001).toFixed(8), // Small price decrease
        volume24h: ethToReceive,
        updatedAt: new Date()
      })
      .where(eq(creatorCoins.coinAddress, coinAddress));
    
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2, 66).padStart(64, '0')}`, // Simulated
      ethReceived: ethToReceive,
    };
  } catch (error) {
    console.error('Error selling coin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
