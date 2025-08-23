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

// Price calculation service using bonding curve
export class PriceService {
  private priceCache = new Map<string, { price: number; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  // Get real-time price using bonding curve calculation
  async getTokenPrice(tokenAddress: string): Promise<number> {
    console.log(`Getting price for token: ${tokenAddress}`);

    // Check cache first
    const cached = this.priceCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    try {
      // Use bonding curve calculation directly since external APIs don't support Unichain
      const price = await this.calculatePriceFromBondingCurve(tokenAddress);

      // Cache the result
      this.priceCache.set(tokenAddress, { price, timestamp: Date.now() });

      return price;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return 0; // Return 0 instead of throwing
    }
  }

  // Calculate price from bonding curve data using GraphQL and contract formula
  private async calculatePriceFromBondingCurve(tokenAddress: string): Promise<{
    price: string;
    priceChange24h: number;
    volume24h: string;
    marketCap: string;
  }> {
    try {
      // Use the correct GraphQL endpoint
      const response = await fetch('https://unipump-contracts.onrender.com/graphql', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
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
                  totalSupply
                }
              }
            }
          `,
          variables: { tokenAddress }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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

        // Calculate market cap using bonding curve formula
        const totalSupply = parseFloat(tokenData?.totalSupply || '1000000000');
        const marketCap = this.calculateMarketCapFromBondingCurve(currentPrice, totalSupply);

        return {
          price: currentPrice.toFixed(8),
          priceChange24h,
          volume24h: volume24h.toFixed(2),
          marketCap: marketCap.toFixed(2)
        };
      }

      // If no historical data, calculate from bonding curve parameters
      return this.calculateFromBaseBondingCurve(tokenAddress);
    } catch (error) {
      console.error('Error calculating price from bonding curve:', error);
      return this.calculateFromBaseBondingCurve(tokenAddress);
    }
  }

  // Calculate price using the bonding curve formula from the contract
  private static calculateFromBaseBondingCurve(tokenAddress: string): Promise<{
    price: string;
    priceChange24h: number;
    volume24h: string;
    marketCap: string;
  }> {
    // Bonding curve formula from UniPump.sol:
    // curve(x) = 0.6015 * exp(0.00003606 * x)
    // price = curve(cap) / M where M = 1,000,000

    // Use a base cap value for new tokens (this would normally come from contract state)
    const baseCap = 1000; // Base cap in ETH equivalent
    const M = 1000000; // 1M tokens as per contract

    // Calculate price using the exponential bonding curve
    const expValue = Math.exp(0.00003606 * baseCap);
    const curveValue = 0.6015 * expValue;
    const price = curveValue / M;

    // Assume ETH price is $3000 for USD conversion
    const ethPrice = 3000;
    const priceUSD = price * ethPrice;

    // Calculate market cap
    const totalSupply = 1000000000; // 1B tokens as per contract
    const marketCap = priceUSD * totalSupply;

    return Promise.resolve({
      price: priceUSD.toFixed(8),
      priceChange24h: 0, // No historical data for new calculation
      volume24h: '0',
      marketCap: marketCap.toFixed(2)
    });
  }

  // Calculate market cap using bonding curve mechanics
  private static calculateMarketCapFromBondingCurve(price: number, supply: number): number {
    // For bonding curve tokens, market cap = current_price * circulating_supply
    // The circulating supply grows as more tokens are minted through the bonding curve
    const circulatingSupply = Math.min(supply, 800000000); // Max 800M before pool creation
    return price * circulatingSupply;
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

  // Enhanced bonding curve calculation using contract data
  static calculateBondingCurvePrice(cap: bigint, supply: bigint): number {
    // Convert bigint to numbers for calculation
    const capEth = Number(cap) / 1e18; // Convert from wei to ETH
    const supplyTokens = Number(supply) / 1e18; // Convert from wei to tokens

    // UniPump bonding curve formula: curve(x) = 0.6015 * exp(0.00003606 * x)
    const expValue = Math.exp(0.00003606 * capEth);
    const curveValue = 0.6015 * expValue;
    const M = 1000000; // 1M as per contract

    // Price per token = curve(cap) / M
    const pricePerToken = curveValue / M;

    // Convert to USD (assuming ETH = $3000)
    return pricePerToken * 3000;
  }

  // Calculate bonding curve progress percentage
  static calculateBondingCurveProgress(supply: bigint): number {
    const supplyTokens = Number(supply) / 1e18;
    const maxSupply = 800000000; // 800M tokens before pool creation
    return Math.min((supplyTokens / maxSupply) * 100, 100);
  }
}