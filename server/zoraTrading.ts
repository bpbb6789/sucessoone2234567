
<line_number>1</line_number>
import { 
  tradeCoin, 
  TradeParameters, 
  TradeCurrency,
  createTradeCall 
} from "@zoralabs/coins-sdk";
import { createPublicClient, createWalletClient, http, parseEther, Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export class ZoraTradingService {
  private publicClient;
  private walletClient;
  private account;

  constructor() {
    const rpcUrl = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

    this.publicClient = createPublicClient({
      chain: base, // Zora Trading only supports Base Mainnet currently
      transport: http(rpcUrl)
    });

    if (privateKey) {
      this.account = privateKeyToAccount(`0x${privateKey.replace(/^0x/, '')}`);
      this.walletClient = createWalletClient({
        chain: base,
        transport: http(rpcUrl),
        account: this.account
      });
    }
  }

  /**
   * Trade ETH for Creator Coin using Zora SDK
   */
  async buyTokenWithETH(
    tokenAddress: Address,
    ethAmount: bigint,
    slippage: number = 0.05,
    senderAddress: Address
  ) {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not configured for trading');
    }

    const tradeParameters: TradeParameters = {
      sell: { type: "eth" },
      buy: {
        type: "erc20",
        address: tokenAddress,
      },
      amountIn: ethAmount,
      slippage,
      sender: senderAddress,
    };

    console.log(`🔄 Zora Trading: Buying ${tokenAddress} with ${ethAmount} ETH`);

    const receipt = await tradeCoin({
      tradeParameters,
      walletClient: this.walletClient,
      account: this.account,
      publicClient: this.publicClient,
    });

    return receipt;
  }

  /**
   * Trade Creator Coin for ETH using Zora SDK
   */
  async sellTokenForETH(
    tokenAddress: Address,
    tokenAmount: bigint,
    slippage: number = 0.15,
    senderAddress: Address
  ) {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not configured for trading');
    }

    const tradeParameters: TradeParameters = {
      sell: { 
        type: "erc20", 
        address: tokenAddress
      },
      buy: { type: "eth" },
      amountIn: tokenAmount,
      slippage,
      sender: senderAddress,
    };

    console.log(`🔄 Zora Trading: Selling ${tokenAmount} of ${tokenAddress} for ETH`);

    const receipt = await tradeCoin({
      tradeParameters,
      walletClient: this.walletClient,
      account: this.account,
      publicClient: this.publicClient,
    });

    return receipt;
  }

  /**
   * Trade between two ERC20 tokens using Zora SDK
   */
  async swapTokens(
    fromTokenAddress: Address,
    toTokenAddress: Address,
    amountIn: bigint,
    slippage: number = 0.05,
    senderAddress: Address
  ) {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not configured for trading');
    }

    const tradeParameters: TradeParameters = {
      sell: {
        type: "erc20",
        address: fromTokenAddress,
      },
      buy: {
        type: "erc20",
        address: toTokenAddress,
      },
      amountIn,
      slippage,
      sender: senderAddress,
    };

    console.log(`🔄 Zora Trading: Swapping ${amountIn} of ${fromTokenAddress} for ${toTokenAddress}`);

    const receipt = await tradeCoin({
      tradeParameters,
      walletClient: this.walletClient,
      account: this.account,
      publicClient: this.publicClient,
    });

    return receipt;
  }

  /**
   * Get trade quote without executing
   */
  async getTradeQuote(tradeParameters: TradeParameters) {
    console.log(`💰 Getting Zora trade quote:`, tradeParameters);
    
    try {
      const quote = await createTradeCall(tradeParameters);
      return quote;
    } catch (error) {
      console.error('❌ Failed to get trade quote:', error);
      throw error;
    }
  }

  /**
   * Check if trading is available (Base Mainnet only)
   */
  isZoraTradingAvailable(): boolean {
    // Zora Trading SDK only supports Base Mainnet currently
    return process.env.NODE_ENV === 'production' && 
           process.env.BASE_MAINNET_RPC_URL !== undefined;
  }
}

export const zoraTradingService = new ZoraTradingService();
