
import { tradeCoin } from "@zoralabs/coins-sdk";
import { createPublicClient, createWalletClient, http, parseEther, parseUnits, formatUnits } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

interface TradeParameters {
  sell: { type: "eth" } | { type: "erc20"; address: string };
  buy: { type: "eth" } | { type: "erc20"; address: string };
  amountIn: bigint;
  slippage?: number;
  sender: string;
  recipient?: string;
}

export class ZoraTradingService {
  private isMainnet: boolean;
  private publicClient: any;
  private walletClient: any;
  private account: any;

  constructor() {
    // Check if we're on Base Mainnet (chain ID 8453)
    this.isMainnet = process.env.CHAIN_ID === '8453' || process.env.NODE_ENV === 'production';
    
    // Initialize clients for mainnet
    if (this.isMainnet && (process.env.BASE_RPC_URL || process.env.BASE_MAINNET_RPC_URL) && process.env.DEPLOYER_PRIVATE_KEY) {
      const rpcUrl = process.env.BASE_RPC_URL || process.env.BASE_MAINNET_RPC_URL;
      this.publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      });

      this.account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: base,
        transport: http(rpcUrl),
      });
    }
  }

  /**
   * Check if Zora Trading is available (only on Base Mainnet)
   */
  isZoraTradingAvailable(): boolean {
    return this.isMainnet && !!this.publicClient && !!this.walletClient && !!this.account;
  }

  /**
   * Buy tokens with ETH using Zora SDK
   */
  async buyTokenWithETH(
    tokenAddress: string, 
    ethAmount: bigint, 
    slippage: number = 0.05,
    senderAddress: string
  ) {
    if (!this.isZoraTradingAvailable()) {
      throw new Error('Zora Trading only available on Base Mainnet with proper RPC configuration');
    }

    try {
      const tradeParameters: TradeParameters = {
        sell: { type: "eth" },
        buy: {
          type: "erc20",
          address: tokenAddress,
        },
        amountIn: ethAmount,
        slippage: slippage,
        sender: senderAddress,
      };

      const receipt = await tradeCoin({
        tradeParameters,
        walletClient: this.walletClient,
        account: this.account,
        publicClient: this.publicClient,
      });

      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      console.error('Zora buy trade error:', error);
      throw new Error(`Buy trade failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sell tokens for ETH using Zora SDK
   */
  async sellTokenForETH(
    tokenAddress: string, 
    tokenAmount: bigint, 
    slippage: number = 0.15,
    senderAddress: string
  ) {
    if (!this.isZoraTradingAvailable()) {
      throw new Error('Zora Trading only available on Base Mainnet with proper RPC configuration');
    }

    try {
      const tradeParameters: TradeParameters = {
        sell: { 
          type: "erc20", 
          address: tokenAddress
        },
        buy: { type: "eth" },
        amountIn: tokenAmount,
        slippage: slippage,
        sender: senderAddress,
      };

      const receipt = await tradeCoin({
        tradeParameters,
        walletClient: this.walletClient,
        account: this.account,
        publicClient: this.publicClient,
      });

      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      console.error('Zora sell trade error:', error);
      throw new Error(`Sell trade failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Swap tokens using Zora SDK
   */
  async swapTokens(
    fromToken: string,
    toToken: string, 
    amountIn: bigint, 
    slippage: number = 0.05,
    senderAddress: string
  ) {
    if (!this.isZoraTradingAvailable()) {
      throw new Error('Zora Trading only available on Base Mainnet with proper RPC configuration');
    }

    try {
      const tradeParameters: TradeParameters = {
        sell: {
          type: "erc20",
          address: fromToken,
        },
        buy: {
          type: "erc20",
          address: toToken,
        },
        amountIn: amountIn,
        slippage: slippage,
        sender: senderAddress,
      };

      const receipt = await tradeCoin({
        tradeParameters,
        walletClient: this.walletClient,
        account: this.account,
        publicClient: this.publicClient,
      });

      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      console.error('Zora swap trade error:', error);
      throw new Error(`Token swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get trade quote using mock implementation (Zora SDK doesn't expose quote-only function)
   */
  async getTradeQuote(tradeParameters: any) {
    if (!this.isZoraTradingAvailable()) {
      throw new Error('Zora Trading only available on Base Mainnet with proper RPC configuration');
    }

    try {
      // Since Zora SDK doesn't have a separate quote function,
      // we'd need to simulate or estimate the trade
      // For now, return a mock quote structure
      return {
        quote: '0',
        routing: 'zora-automatic',
        priceImpact: 0,
        gasEstimate: '21000'
      };
    } catch (error) {
      console.error('Zora quote error:', error);
      throw new Error(`Quote failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get trading status and capabilities
   */
  getTradingStatus() {
    return {
      available: this.isZoraTradingAvailable(),
      network: this.isMainnet ? 'base-mainnet' : 'base-sepolia',
      features: {
        gaslessApprovals: true,
        crossTokenTrading: true,
        slippageProtection: true,
        automaticRouting: true,
        permitSignatures: true
      },
      supportedTokens: ['ETH', 'USDC', 'ZORA', 'Creator Coins', 'Content Coins'],
      limitations: this.isMainnet ? [] : [
        'Zora Trading SDK only supports Base Mainnet',
        'Switch to production environment for full trading functionality'
      ]
    };
  }
}

// Export singleton instance
export const zoraTradingService = new ZoraTradingService();
