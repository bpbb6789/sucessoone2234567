
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

export async function checkBaseSepoliaHealth(): Promise<{
  healthy: boolean;
  blockNumber?: bigint;
  error?: string;
}> {
  try {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org', {
        timeout: 10000,
        retryCount: 2
      })
    });

    const blockNumber = await client.getBlockNumber();
    
    // Check if we're getting recent blocks (within last 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const block = await client.getBlock({ blockNumber });
    const blockAge = now - Number(block.timestamp);
    
    if (blockAge > 300) { // 5 minutes
      return {
        healthy: false,
        error: `Base Sepolia seems behind - last block is ${blockAge}s old`
      };
    }

    return {
      healthy: true,
      blockNumber
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown network error'
    };
  }
}
