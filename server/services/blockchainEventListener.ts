
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { getTelegramService } from './telegramService';
import { db } from '../db';
import { creatorCoins } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Blockchain event listener for Zora trading events
export class BlockchainEventListener {
  private publicClient;
  private telegramService;
  private isListening = false;
  private latestBlock = 0n;

  constructor() {
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
    });
    this.telegramService = getTelegramService();
  }

  async startListening() {
    if (this.isListening) {
      console.log('🔄 Blockchain event listener already running');
      return;
    }

    console.log('🚀 Starting blockchain event listener for trading events...');
    this.isListening = true;

    // Get latest block to start from
    this.latestBlock = await this.publicClient.getBlockNumber();
    console.log(`📊 Starting from block: ${this.latestBlock}`);

    // Start polling for new blocks
    this.pollForEvents();
  }

  async stopListening() {
    console.log('⏹️ Stopping blockchain event listener...');
    this.isListening = false;
  }

  private async pollForEvents() {
    while (this.isListening) {
      try {
        const currentBlock = await this.publicClient.getBlockNumber();
        
        if (currentBlock > this.latestBlock) {
          await this.processNewBlocks(this.latestBlock + 1n, currentBlock);
          this.latestBlock = currentBlock;
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('❌ Error polling for events:', error);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s on error
      }
    }
  }

  private async processNewBlocks(fromBlock: bigint, toBlock: bigint) {
    console.log(`🔍 Scanning blocks ${fromBlock} to ${toBlock} for trading events...`);

    try {
      // Get all deployed coins to listen for their events
      const coins = await db.select().from(creatorCoins);
      const coinAddresses = coins
        .filter(coin => coin.coinAddress)
        .map(coin => coin.coinAddress as `0x${string}`);

      if (coinAddresses.length === 0) {
        return;
      }

      // Listen for CoinBuy events
      await this.listenForBuyEvents(coinAddresses, fromBlock, toBlock);
      
      // Listen for CoinSell events
      await this.listenForSellEvents(coinAddresses, fromBlock, toBlock);
      
      // Listen for CoinTradeRewards events (creator earnings)
      await this.listenForTradeRewardsEvents(coinAddresses, fromBlock, toBlock);
      
      // Listen for CoinTransfer events
      await this.listenForTransferEvents(coinAddresses, fromBlock, toBlock);

    } catch (error) {
      console.error('❌ Error processing blocks:', error);
    }
  }

  private async listenForBuyEvents(coinAddresses: `0x${string}`[], fromBlock: bigint, toBlock: bigint) {
    try {
      const logs = await this.publicClient.getLogs({
        address: coinAddresses,
        event: parseAbiItem('event CoinBuy(address indexed buyer, address indexed recipient, address indexed tradeReferrer, uint256 coinsPurchased, address currency, uint256 amountFee, uint256 amountSold)'),
        fromBlock,
        toBlock
      });

      for (const log of logs) {
        await this.handleBuyEvent(log);
      }
    } catch (error) {
      console.error('❌ Error listening for buy events:', error);
    }
  }

  private async listenForSellEvents(coinAddresses: `0x${string}`[], fromBlock: bigint, toBlock: bigint) {
    try {
      const logs = await this.publicClient.getLogs({
        address: coinAddresses,
        event: parseAbiItem('event CoinSell(address indexed seller, address indexed recipient, address indexed tradeReferrer, uint256 coinsSold, address currency, uint256 amountFee, uint256 amountPurchased)'),
        fromBlock,
        toBlock
      });

      for (const log of logs) {
        await this.handleSellEvent(log);
      }
    } catch (error) {
      console.error('❌ Error listening for sell events:', error);
    }
  }

  private async listenForTradeRewardsEvents(coinAddresses: `0x${string}`[], fromBlock: bigint, toBlock: bigint) {
    try {
      const logs = await this.publicClient.getLogs({
        address: coinAddresses,
        event: parseAbiItem('event CoinTradeRewards(address indexed payoutRecipient, address indexed platformReferrer, address indexed tradeReferrer, address protocolRewardRecipient, uint256 creatorReward, uint256 platformReferrerReward, uint256 traderReferrerReward, uint256 protocolReward, address currency)'),
        fromBlock,
        toBlock
      });

      for (const log of logs) {
        await this.handleTradeRewardsEvent(log);
      }
    } catch (error) {
      console.error('❌ Error listening for trade rewards events:', error);
    }
  }

  private async listenForTransferEvents(coinAddresses: `0x${string}`[], fromBlock: bigint, toBlock: bigint) {
    try {
      const logs = await this.publicClient.getLogs({
        address: coinAddresses,
        event: parseAbiItem('event CoinTransfer(address indexed sender, address indexed recipient, uint256 amount, uint256 senderBalance, uint256 recipientBalance)'),
        fromBlock,
        toBlock
      });

      for (const log of logs) {
        await this.handleTransferEvent(log);
      }
    } catch (error) {
      console.error('❌ Error listening for transfer events:', error);
    }
  }

  private async handleBuyEvent(log: any) {
    try {
      const { args } = log;
      const coinAddress = log.address;
      
      // Get coin details from database
      const coin = await db.select().from(creatorCoins)
        .where(eq(creatorCoins.coinAddress, coinAddress))
        .limit(1);

      if (coin.length === 0) return;

      const coinData = coin[0];
      const buyerAddress = args.buyer;
      const coinsPurchased = Number(args.coinsPurchased) / 1e18;
      const amountSpent = Number(args.amountSold) / 1e18;

      console.log(`🟢 BUY EVENT: ${coinsPurchased.toFixed(4)} ${coinData.coinSymbol} for ${amountSpent.toFixed(6)} ETH`);

      // Send Telegram notification
      if (this.telegramService) {
        await this.telegramService.notifyTrade({
          type: 'BUY',
          coinSymbol: coinData.coinSymbol,
          amount: coinsPurchased.toFixed(4),
          price: amountSpent.toFixed(6),
          trader: `${buyerAddress.slice(0, 6)}...${buyerAddress.slice(-4)}`
        });
      }

      // Update coin statistics in database
      await this.updateCoinStats(coinAddress, 'BUY', coinsPurchased, amountSpent);

    } catch (error) {
      console.error('❌ Error handling buy event:', error);
    }
  }

  private async handleSellEvent(log: any) {
    try {
      const { args } = log;
      const coinAddress = log.address;
      
      // Get coin details from database
      const coin = await db.select().from(creatorCoins)
        .where(eq(creatorCoins.coinAddress, coinAddress))
        .limit(1);

      if (coin.length === 0) return;

      const coinData = coin[0];
      const sellerAddress = args.seller;
      const coinsSold = Number(args.coinsSold) / 1e18;
      const amountReceived = Number(args.amountPurchased) / 1e18;

      console.log(`🔴 SELL EVENT: ${coinsSold.toFixed(4)} ${coinData.coinSymbol} for ${amountReceived.toFixed(6)} ETH`);

      // Send Telegram notification
      if (this.telegramService) {
        await this.telegramService.notifyTrade({
          type: 'SELL',
          coinSymbol: coinData.coinSymbol,
          amount: coinsSold.toFixed(4),
          price: amountReceived.toFixed(6),
          trader: `${sellerAddress.slice(0, 6)}...${sellerAddress.slice(-4)}`
        });
      }

      // Update coin statistics in database
      await this.updateCoinStats(coinAddress, 'SELL', coinsSold, amountReceived);

    } catch (error) {
      console.error('❌ Error handling sell event:', error);
    }
  }

  private async handleTradeRewardsEvent(log: any) {
    try {
      const { args } = log;
      const coinAddress = log.address;
      
      // Get coin details from database
      const coin = await db.select().from(creatorCoins)
        .where(eq(creatorCoins.coinAddress, coinAddress))
        .limit(1);

      if (coin.length === 0) return;

      const coinData = coin[0];
      const creatorReward = Number(args.creatorReward) / 1e18;
      const payoutRecipient = args.payoutRecipient;

      console.log(`💰 CREATOR EARNINGS: ${creatorReward.toFixed(6)} ETH for ${coinData.coinSymbol}`);

      // Send Telegram notification for creator earnings
      if (this.telegramService && creatorReward > 0) {
        const message = `💰 <b>Creator Earnings!</b>

🎭 <b>${coinData.title}</b> (${coinData.coinSymbol})
👤 Creator: <code>${payoutRecipient.slice(0, 6)}...${payoutRecipient.slice(-4)}</code>
💸 Earned: ${creatorReward.toFixed(6)} ETH
📈 From recent trading activity

#CreatorEarnings #${coinData.coinSymbol}`;

        await this.telegramService.sendMessage(message, { parseMode: 'HTML' });
      }

    } catch (error) {
      console.error('❌ Error handling trade rewards event:', error);
    }
  }

  private async handleTransferEvent(log: any) {
    try {
      const { args } = log;
      const amount = Number(args.amount) / 1e18;
      
      // Only notify for large transfers (> 1000 tokens)
      if (amount > 1000) {
        const coinAddress = log.address;
        
        const coin = await db.select().from(creatorCoins)
          .where(eq(creatorCoins.coinAddress, coinAddress))
          .limit(1);

        if (coin.length === 0) return;

        const coinData = coin[0];
        console.log(`🔄 LARGE TRANSFER: ${amount.toFixed(0)} ${coinData.coinSymbol}`);
      }
    } catch (error) {
      console.error('❌ Error handling transfer event:', error);
    }
  }

  private async updateCoinStats(coinAddress: string, type: 'BUY' | 'SELL', amount: number, ethAmount: number) {
    try {
      // Update coin volume and price statistics
      const coin = await db.select().from(creatorCoins)
        .where(eq(creatorCoins.coinAddress, coinAddress))
        .limit(1);

      if (coin.length === 0) return;

      const currentPrice = ethAmount / amount;
      const currentVolume = parseFloat(coin[0].volume24h || '0');
      const newVolume = currentVolume + ethAmount;

      await db.update(creatorCoins)
        .set({
          currentPrice: currentPrice.toFixed(8),
          volume24h: newVolume.toFixed(6),
          updatedAt: new Date()
        })
        .where(eq(creatorCoins.coinAddress, coinAddress));

      console.log(`📊 Updated ${coin[0].coinSymbol} stats: price=${currentPrice.toFixed(8)}, volume=${newVolume.toFixed(6)}`);

    } catch (error) {
      console.error('❌ Error updating coin stats:', error);
    }
  }
}

// Singleton instance
let blockchainEventListener: BlockchainEventListener | null = null;

export function initializeBlockchainEventListener(): BlockchainEventListener {
  if (!blockchainEventListener) {
    blockchainEventListener = new BlockchainEventListener();
  }
  return blockchainEventListener;
}

export function getBlockchainEventListener(): BlockchainEventListener | null {
  return blockchainEventListener;
}
