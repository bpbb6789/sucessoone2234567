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
      this.bot = new TelegramBot(config.botToken, { polling: false });
      this.channelId = config.channelId;
      console.log('✅ Telegram bot initialized successfully');
    } else {
      console.log('⚠️ Telegram bot not initialized - missing credentials');
    }
  }

  async sendMessage(message: string, options?: { parseMode?: 'HTML' | 'Markdown' }): Promise<boolean> {
    if (!this.bot) {
      console.log('Telegram bot not available - skipping message');
      return false;
    }

    try {
      await this.bot.sendMessage(this.channelId, message, {
        parse_mode: options?.parseMode,
        disable_web_page_preview: true,
      });
      console.log('📤 Telegram message sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send Telegram message:', error);
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
  }): Promise<boolean> {
    const message = `🎬 <b>New Content Coin Created!</b>

📺 <b>${data.title}</b>
💰 Symbol: <code>${data.coinSymbol}</code>
👤 Creator: ${data.creator}
🎭 Type: ${data.contentType}
${data.coinAddress ? `🔗 Address: <code>${data.coinAddress}</code>` : ''}

#NewContentCoin #${data.coinSymbol}`;

    return this.sendMessage(message, { parseMode: 'HTML' });
  }

  async notifyNewChannel(data: {
    name: string;
    creator: string;
    coinAddress?: string;
  }): Promise<boolean> {
    const message = `📺 <b>New Channel Created!</b>

🏷️ <b>${data.name}</b>
👤 Creator: ${data.creator}
${data.coinAddress ? `💰 Coin Address: <code>${data.coinAddress}</code>` : ''}

#NewChannel #${data.name.replace(/\s+/g, '')}`;

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