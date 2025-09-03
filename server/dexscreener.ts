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

// Get real trading data from DexScreener
export async function getDexScreenerData(tokenAddress: string): Promise<{
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  chartData: Array<{time: number, price: number, volume: number}> | null;
}> {
  try {
    console.log(`🔍 Fetching DexScreener data for token: ${tokenAddress}`);
    
    // DexScreener API endpoint for token search
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`⚠️ DexScreener API error: ${response.status}`);
      return {
        price: null,
        marketCap: null,
        volume24h: null,
        priceChange24h: null,
        chartData: null
      };
    }

    const data = await response.json() as DexScreenerResponse;
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log(`⚠️ No trading pairs found for ${tokenAddress} on DexScreener`);
      return {
        price: null,
        marketCap: null,
        volume24h: null,
        priceChange24h: null,
        chartData: null
      };
    }

    // Get the most liquid pair (highest volume)
    const mostLiquidPair = data.pairs.reduce((prev, current) => {
      return (current.volume.h24 > prev.volume.h24) ? current : prev;
    });

    console.log(`✅ Found trading pair on ${mostLiquidPair.dexId}`);

    // Extract real trading data
    const realData = {
      price: mostLiquidPair.priceUsd ? parseFloat(mostLiquidPair.priceUsd) : null,
      marketCap: mostLiquidPair.marketCap || mostLiquidPair.fdv || null,
      volume24h: mostLiquidPair.volume.h24 || null,
      priceChange24h: mostLiquidPair.priceChange.h24 || null,
      chartData: null // Will implement historical data separately
    };

    console.log(`✅ DexScreener data for ${tokenAddress}:`, realData);
    return realData;

  } catch (error) {
    console.error('DexScreener API error:', error);
    return {
      price: null,
      marketCap: null,
      volume24h: null,
      priceChange24h: null,
      chartData: null
    };
  }
}

// Get historical chart data for trading charts
export async function getDexScreenerChartData(pairAddress: string, timeframe: '5m' | '1h' | '6h' | '24h' = '24h'): Promise<Array<{
  time: number;
  price: number;
  volume: number;
}> | null> {
  try {
    // Note: DexScreener doesn't provide historical OHLCV data in their free API
    // This would require a paid plan or alternative data source
    console.log(`📊 Chart data would require DexScreener Pro API or alternative source`);
    return null;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return null;
  }
}

// Integrate DexScreener data into coin price function
export async function getEnhancedCoinPrice(coinAddress: string): Promise<{
  price: string;
  marketCap: string;
  volume24h: string;
  priceChange24h: number;
  source: 'dexscreener' | 'blockchain';
}> {
  // First try DexScreener for real trading data
  const dexData = await getDexScreenerData(coinAddress);
  
  if (dexData.price && dexData.marketCap && dexData.volume24h) {
    return {
      price: dexData.price.toFixed(6),
      marketCap: dexData.marketCap.toFixed(2),
      volume24h: dexData.volume24h.toFixed(2),
      priceChange24h: dexData.priceChange24h || 0,
      source: 'dexscreener'
    };
  }

  // Fallback: throw error (no mock data)
  throw new Error(`No real trading data available for ${coinAddress} on DexScreener`);
}