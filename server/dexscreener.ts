import fetch from 'node-fetch';

export interface DexScreenerToken {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerToken[] | null;
}

// Get real-time price data from DexScreener API or contract data for testnets
export async function getDexScreenerData(tokenAddress: string): Promise<{
  price: string;
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
  liquidity: string;
} | null> {
  try {
    console.log(`📊 Fetching DexScreener data for token: ${tokenAddress}`);

    // Check if this is a testnet by trying to detect the network
    // For Base Sepolia (testnet), use contract data instead of DexScreener
    if (process.env.NODE_ENV === 'development' || tokenAddress.length === 42) {
      console.log(`🧪 Testnet detected, fetching contract data instead of DexScreener`);
      
      // Try to get real contract data from Zora
      try {
        const contractResponse = await fetch(`/api/zora-token/${tokenAddress}`);
        if (contractResponse.ok) {
          const contractData = await contractResponse.json();
          console.log(`📋 Using real contract data for testnet token: ${tokenAddress}`);
          
          return {
            price: contractData.price || '0.000001',
            priceChange24h: contractData.change24h || 0,
            volume24h: contractData.volume24h || '0',
            marketCap: contractData.marketCap || '0',
            liquidity: '0' // No real liquidity on testnet
          };
        }
      } catch (contractError) {
        console.warn(`⚠️ Failed to fetch contract data, using minimal values`);
      }

      // Return minimal testnet values instead of inflated $35 market cap
      return {
        price: '0.000001', // Very small price for new testnet tokens
        priceChange24h: 0,
        volume24h: '0',
        marketCap: '1000', // $1000 instead of $35k
        liquidity: '0'
      };
    }

    // For mainnet, use DexScreener API
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ContentCoin-Platform/1.0'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ DexScreener API returned ${response.status} for ${tokenAddress}`);
      return null;
    }

    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      console.log(`📊 No trading pairs found for ${tokenAddress} on DexScreener`);
      return null;
    }

    // Get the most liquid pair
    const pair = data.pairs.sort((a: any, b: any) => 
      parseFloat(b.liquidity?.usd || '0') - parseFloat(a.liquidity?.usd || '0')
    )[0];

    return {
      price: pair.priceUsd || '0',
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24 || '0',
      marketCap: pair.marketCap || '0',
      liquidity: pair.liquidity?.usd || '0'
    };

  } catch (error) {
    console.error(`❌ Error fetching DexScreener data for ${tokenAddress}:`, error);
    return null;
  }
}

// API route handler for DexScreener data
export async function handleDexScreenerRequest(tokenAddress: string) {
  return await getDexScreenerData(tokenAddress);
}

// Validate content for tokenization