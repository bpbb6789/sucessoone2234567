
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

    if (!isValidEthereumAddress(tokenAddress)) {
      console.log(`❌ Invalid Ethereum address: ${tokenAddress}`);
      return {
        holders: [],
        totalHolders: 0
      };
    }

    // TODO: Implement real token holder fetching using The Graph or Alchemy
    // For now, return empty data until proper indexing is implemented
    return {
      holders: [],
      totalHolders: 0
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

    if (!isValidEthereumAddress(tokenAddress)) {
      console.log(`❌ Invalid Ethereum address: ${tokenAddress}`);
      return '0';
    }

    // TODO: Implement real price fetching from DEX pools or price oracles
    // For now, return 0 until proper price data is implemented
    return '0';

  } catch (error) {
    console.error('Error fetching coin price:', error);
    return '0';
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
