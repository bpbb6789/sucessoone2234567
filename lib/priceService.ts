import { gql } from "@apollo/client";

// Enhanced GraphQL queries for real price data
export const GET_TOKEN_PRICE_DATA = gql`
  query GetTokenPriceData($tokenAddress: String!, $timeframe: String = "1h") {
    minBuckets(
      where: { tokenAddress: $tokenAddress }
      orderBy: { id: desc }
      first: 100
    ) {
      items {
        id
        open
        high
        low
        close
        average
        count
        tokenAddress
        timestamp
      }
    }
    
    uniPumpCreatorSaless(
      where: { memeTokenAddress: $tokenAddress }
    ) {
      items {
        memeTokenAddress
        name
        symbol
        bio
        createdBy
        totalSupply
        isUSDCToken0
        imageUri
        twitter
        discord
      }
    }
  }
`;

export const GET_TOKEN_TRANSACTIONS = gql`
  query GetTokenTransactions($tokenAddress: String!) {
    swaps(
      where: { tokenAddress: $tokenAddress }
      orderBy: { timestamp: desc }
      first: 1000
    ) {
      items {
        id
        tokenAddress
        amountIn
        amountOut
        tokenIn
        tokenOut
        timestamp
        sender
      }
    }
  }
`;

// Price calculation service
export class PriceService {
  private static COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private static GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2';
  
  // Get real-time price from DEX
  static async getTokenPrice(tokenAddress: string): Promise<{
    price: string;
    priceChange24h: number;
    volume24h: string;
    marketCap: string;
  }> {
    try {
      // Try GeckoTerminal API for Unichain
      const response = await fetch(
        `${this.GECKOTERMINAL_API}/networks/unichain/tokens/${tokenAddress}/pools`
      );
      
      if (response.ok) {
        const data = await response.json();
        const pools = data.data;
        
        if (pools && pools.length > 0) {
          const mainPool = pools[0];
          const attributes = mainPool.attributes;
          
          return {
            price: attributes.base_token_price_usd || '0',
            priceChange24h: parseFloat(attributes.price_change_percentage?.h24 || '0'),
            volume24h: attributes.volume_usd?.h24 || '0',
            marketCap: attributes.market_cap_usd || '0'
          };
        }
      }
      
      // Fallback: Use bonding curve data from GraphQL
      return await this.calculatePriceFromBondingCurve(tokenAddress);
    } catch (error) {
      console.error('Error fetching token price:', error);
      return await this.calculatePriceFromBondingCurve(tokenAddress);
    }
  }
  
  // Calculate price from bonding curve data
  private static async calculatePriceFromBondingCurve(tokenAddress: string): Promise<{
    price: string;
    priceChange24h: number;
    volume24h: string;
    marketCap: string;
  }> {
    try {
      // Use the correct GraphQL endpoint
      const response = await fetch('https://unipump-contracts.onrender.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetTokenPriceData($tokenAddress: String!) {
              minBuckets(
                where: { tokenAddress: $tokenAddress }
                orderBy: { id: desc }
                first: 100
              ) {
                items {
                  id
                  open
                  high
                  low
                  close
                  average
                  count
                  tokenAddress
                }
              }
              
              uniPumpCreatorSaless(
                where: { memeTokenAddress: $tokenAddress }
              ) {
                items {
                  memeTokenAddress
                  name
                  symbol
                  totalSupply
                }
              }
            }
          `,
          variables: { tokenAddress }
        })
      });
      
      const data = await response.json();
      const buckets = data.data?.minBuckets?.items || [];
      const tokenData = data.data?.uniPumpCreatorSaless?.items?.[0];
      
      if (buckets.length > 0) {
        const latest = buckets[0];
        const previous24h = buckets.find(b => 
          (parseInt(latest.id) - parseInt(b.id)) >= 24 * 60 // 24 hours in minutes
        );
        
        const currentPrice = parseFloat(latest.close || latest.average || '0');
        const previousPrice = parseFloat(previous24h?.close || previous24h?.average || currentPrice.toString());
        const priceChange24h = previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
        
        // Calculate 24h volume from recent swaps
        const volume24h = buckets
          .filter(b => (parseInt(latest.id) - parseInt(b.id)) <= 24 * 60)
          .reduce((sum, bucket) => sum + (parseFloat(bucket.count || '0') * currentPrice), 0);
        
        // Calculate market cap
        const totalSupply = parseFloat(tokenData?.totalSupply || '1000000');
        const marketCap = currentPrice * totalSupply;
        
        return {
          price: currentPrice.toFixed(6),
          priceChange24h,
          volume24h: volume24h.toFixed(2),
          marketCap: marketCap.toFixed(2)
        };
      }
      
      return {
        price: '0.000001',
        priceChange24h: 0,
        volume24h: '0',
        marketCap: '0'
      };
    } catch (error) {
      console.error('Error calculating price from bonding curve:', error);
      return {
        price: '0.000001',
        priceChange24h: 0,
        volume24h: '0',
        marketCap: '0'
      };
    }
  }
  
  // Get holder count from blockchain
  static async getHolderCount(tokenAddress: string): Promise<number> {
    try {
      // Use the existing contract integration
      const response = await fetch('/api/token-holders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.holderCount || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching holder count:', error);
      return 0;
    }
  }
  
  // Get creation time from blockchain
  static async getTokenCreationTime(tokenAddress: string): Promise<Date> {
    try {
      const response = await fetch('/api/token-creation-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress })
      });
      
      if (response.ok) {
        const data = await response.json();
        return new Date(data.creationTime);
      }
      
      return new Date();
    } catch (error) {
      console.error('Error fetching creation time:', error);
      return new Date();
    }
  }
}