
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org')
});

/**
 * Get token holders for a given contract address
 */
export async function getTokenHolders(tokenAddress: string): Promise<{
  holders: Array<{
    address: string;
    balance: string;
    percentage: number;
  }>;
  totalHolders: number;
}> {
  try {
    console.log(`🔍 Fetching token holders for: ${tokenAddress}`);

    // For now, return mock data since we need a proper indexing service
    // In production, this would query a service like The Graph or Alchemy
    const mockHolders = [
      {
        address: '0x1234567890123456789012345678901234567890',
        balance: '1000000',
        percentage: 45.5
      },
      {
        address: '0x2345678901234567890123456789012345678901',
        balance: '750000',
        percentage: 34.1
      },
      {
        address: '0x3456789012345678901234567890123456789012',
        balance: '450000',
        percentage: 20.4
      }
    ];

    return {
      holders: mockHolders,
      totalHolders: mockHolders.length
    };

  } catch (error) {
    console.error('Error fetching token holders:', error);
    return {
      holders: [],
      totalHolders: 0
    };
  }
}

/**
 * Get current price of a token from on-chain data
 */
export async function getCoinPrice(tokenAddress: string): Promise<string> {
  try {
    console.log(`💰 Fetching price for token: ${tokenAddress}`);

    // Mock price data - in production this would query DEX pools
    return '0.00001';

  } catch (error) {
    console.error('Error fetching coin price:', error);
    return '0.00001';
  }
}

/**
 * Check if an address is a valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get block number from Base Sepolia
 */
export async function getCurrentBlockNumber(): Promise<bigint> {
  try {
    return await publicClient.getBlockNumber();
  } catch (error) {
    console.error('Error getting block number:', error);
    return BigInt(0);
  }
}
