import TelegramBot from 'node-telegram-bot-api';

export interface TelegramConfig {
  botToken: string;
  channelId: string;
}

export class TelegramService {
  private bot: TelegramBot | null = null;
  private channelId: string = '';

  constructor(config: TelegramConfig) {
    if (config.botToken && config.channelId) {
      try {
        this.bot = new TelegramBot(config.botToken, { polling: false });
        this.channelId = config.channelId;
        console.log('✅ Telegram bot initialized successfully');
        console.log('📋 Channel ID configured:', config.channelId);
      } catch (error) {
        console.error('❌ Failed to initialize Telegram bot:', error);
        this.bot = null;
        this.channelId = '';
      }
    } else {
      console.log('⚠️ Telegram bot not initialized - missing credentials');
      console.log('💡 Required env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID');
      if (!config.botToken) console.log('❌ Missing TELEGRAM_BOT_TOKEN');
      if (!config.channelId) console.log('❌ Missing TELEGRAM_CHANNEL_ID');
    }
  }

  async sendMessage(message: string, options?: { parseMode?: 'HTML' | 'Markdown' }): Promise<boolean> {
    if (!this.bot) {
      console.log('⚠️ Telegram bot not available - skipping message');
      return false;
    }

    if (!this.channelId) {
      console.log('⚠️ Telegram channel ID not configured - skipping message');
      return false;
    }

    try {
      await this.bot.sendMessage(this.channelId, message, {
        parse_mode: options?.parseMode,
        disable_web_page_preview: true,
      });
      console.log('📤 Telegram message sent successfully');
      return true;
    } catch (error: any) {
      if (error?.response?.body?.description?.includes('chat not found')) {
        console.error('❌ Telegram chat not found. Please check TELEGRAM_CHANNEL_ID environment variable.');
        console.error('💡 Current channel ID:', this.channelId);
        console.error('💡 Make sure the bot is added to the channel and has permission to send messages.');
      } else if (error?.response?.body?.description?.includes('bot was blocked')) {
        console.error('❌ Telegram bot was blocked by the user/channel.');
      } else if (error?.response?.body?.description?.includes('Forbidden')) {
        console.error('❌ Telegram bot lacks permission to send messages to this channel.');
      } else {
        console.error('❌ Failed to send Telegram message:', error?.message || error);
      }
      return false;
    }
  }

  // Event-specific message formatters
  async notifyNewContentCoin(data: {
    title: string;
    coinSymbol: string;
    creator: string;
    contentType: string;
    coinAddress?: string;
    marketCap?: string;
    totalSupply?: string;
    currentPrice?: string;
    imageUrl?: string;
    createdAt?: string;
  }): Promise<boolean> {
    let message;
    
    if (data.coinAddress) {
      // Get formatted timestamp
      const timestamp = data.createdAt ? new Date(data.createdAt).toISOString().replace('T', ' ').replace('.000Z', ' UTC') : new Date().toISOString().replace('T', ' ').replace('.000Z', ' UTC');
      
      // Deployed coin with comprehensive onchain stats
      message = `🆕🪙 <b>NEW CREATOR COIN CREATED</b>

📛 <b>${data.title}</b> (${data.coinSymbol})
💰 Market Cap: $${data.marketCap || '0.00'}
📊 Total Supply: ${data.totalSupply || '1.00B'}
👤 <a href="https://zora.co/profile/${data.creator}">${data.creator.slice(0, 6)}...${data.creator.slice(-4)}</a>
📅 Created: ${timestamp}
📄 Contract: <code>${data.coinAddress.slice(0, 6)}...${data.coinAddress.slice(-4)}</code>

🔗 <a href="https://zora.co/creator-coins/base:${data.coinAddress}">View on Zora</a> | <a href="https://basescan.org/address/${data.coinAddress}">BaseScan</a> | <a href="https://dexscreener.com/base/${data.coinAddress}">DexScreener</a>

#NewCreatorCoin #${data.coinSymbol} #Deployed`;
    } else {
      // Content uploaded, pending deployment
      message = `🎬 <b>NEW CONTENT COIN UPLOADED</b>

📺 <b>${data.title}</b>
💰 Symbol: <code>${data.coinSymbol}</code>
👤 Creator: ${data.creator.slice(0, 6)}...${data.creator.slice(-4)}
🎭 Type: ${data.contentType}
⏳ Status: Pending Deployment

#NewContentCoin #${data.coinSymbol} #Pending`;
    }

    return this.sendMessage(message, { parseMode: 'HTML' });
  }

  async notifyNewChannel(data: {
    name: string;
    creator: string;
    coinAddress?: string;
    ticker?: string;
    category?: string;
    avatarUrl?: string;
    slug?: string;
    createdAt?: string;
  }): Promise<boolean> {
    const timestamp = data.createdAt ? new Date(data.createdAt).toISOString().replace('T', ' ').replace('.000Z', ' UTC') : new Date().toISOString().replace('T', ' ').replace('.000Z', ' UTC');
    
    let message;
    
    if (data.coinAddress) {
      // Channel with deployed coin
      message = `📺🪙 <b>NEW CHANNEL WITH COIN CREATED</b>

🏷️ <b>${data.name}</b> (${data.ticker || 'TKN'})
📂 Category: ${data.category || 'General'}
👤 <a href="https://zora.co/profile/${data.creator}">${data.creator.slice(0, 6)}...${data.creator.slice(-4)}</a>
📅 Created: ${timestamp}
💰 Coin Address: <code>${data.coinAddress.slice(0, 6)}...${data.coinAddress.slice(-4)}</code>

🔗 <a href="https://zora.co/creator-coins/base:${data.coinAddress}">View Coin on Zora</a> | <a href="https://basescan.org/address/${data.coinAddress}">BaseScan</a>
📺 <a href="/channel/${data.slug || data.name.toLowerCase()}">Visit Channel</a>

#NewChannel #${data.ticker || data.name.replace(/\s+/g, '')} #WithCoin`;
    } else {
      // Regular channel without coin
      message = `📺 <b>NEW CHANNEL CREATED</b>

🏷️ <b>${data.name}</b>
📂 Category: ${data.category || 'General'}
👤 Creator: ${data.creator.slice(0, 6)}...${data.creator.slice(-4)}
📅 Created: ${timestamp}

📺 <a href="/channel/${data.slug || data.name.toLowerCase()}">Visit Channel</a>

#NewChannel #${data.name.replace(/\s+/g, '')}`;
    }

    return this.sendMessage(message, { parseMode: 'HTML' });
  }

  async notifyNewCreator(data: {
    name: string;
    address: string;
    contentCoins: number;
  }): Promise<boolean> {
    const message = `👨‍🎨 <b>New Creator Joined!</b>

🎭 <b>${data.name}</b>
🔑 Address: <code>${data.address}</code>
🎬 Content Coins: ${data.contentCoins}

#NewCreator #Welcome`;

    return this.sendMessage(message, { parseMode: 'HTML' });
  }

  async notifyTrade(data: {
    type: 'BUY' | 'SELL';
    coinSymbol: string;
    amount: string;
    price: string;
    trader?: string;
  }): Promise<boolean> {
    const emoji = data.type === 'BUY' ? '🟢' : '🔴';
    const action = data.type === 'BUY' ? 'Bought' : 'Sold';
    
    const message = `${emoji} <b>${action} ${data.coinSymbol}!</b>

💰 Amount: ${data.amount}
💵 Price: $${data.price}
${data.trader ? `👤 Trader: ${data.trader}` : ''}

#${data.type} #${data.coinSymbol}`;

    return this.sendMessage(message, { parseMode: 'HTML' });
  }

  async notifyLeaderboard(data: {
    type: 'CREATOR' | 'COIN' | 'TRADER';
    topEntries: Array<{
      name: string;
      value: string;
      rank: number;
    }>;
  }): Promise<boolean> {
    const emoji = data.type === 'CREATOR' ? '🎭' : data.type === 'COIN' ? '💰' : '📈';
    const title = `${emoji} <b>${data.type} Leaderboard Update!</b>`;
    
    const entries = data.topEntries
      .slice(0, 5) // Top 5
      .map(entry => `${entry.rank}. <b>${entry.name}</b> - ${entry.value}`)
      .join('\n');

    const message = `${title}

${entries}

#Leaderboard #Top${data.type}s`;

    return this.sendMessage(message, { parseMode: 'HTML' });
  }

  async notifyMilestone(data: {
    type: 'MARKET_CAP' | 'USER_COUNT' | 'CONTENT_COUNT';
    milestone: string;
    current: string;
  }): Promise<boolean> {
    const emoji = data.type === 'MARKET_CAP' ? '🚀' : data.type === 'USER_COUNT' ? '👥' : '🎬';
    
    const message = `${emoji} <b>Milestone Achieved!</b>

🎯 ${data.milestone}
📊 Current: ${data.current}

#Milestone #Growth`;

    return this.sendMessage(message, { parseMode: 'HTML' });
  }
}

// Singleton instance
let telegramService: TelegramService | null = null;

export function initializeTelegramService(): TelegramService {
  if (!telegramService) {
    const config: TelegramConfig = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      channelId: process.env.TELEGRAM_CHANNEL_ID || '',
    };
    telegramService = new TelegramService(config);
  }
  return telegramService;
}

export function getTelegramService(): TelegramService | null {
  return telegramService;
}