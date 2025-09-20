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

  async sendPhoto(photoUrl: string, caption?: string, options?: { parseMode?: 'HTML' | 'Markdown' }): Promise<boolean> {
    if (!this.bot) {
      console.log('⚠️ Telegram bot not available - skipping photo');
      return false;
    }

    if (!this.channelId) {
      console.log('⚠️ Telegram channel ID not configured - skipping photo');
      return false;
    }

    try {
      await this.bot.sendPhoto(this.channelId, photoUrl, {
        caption: caption,
        parse_mode: options?.parseMode,
      });
      console.log('📤 Telegram photo sent successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send Telegram photo:', error?.message || error);
      return false;
    }
  }

  async sendVideo(videoUrl: string, caption?: string, options?: { parseMode?: 'HTML' | 'Markdown' }): Promise<boolean> {
    if (!this.bot) {
      console.log('⚠️ Telegram bot not available - skipping video');
      return false;
    }

    if (!this.channelId) {
      console.log('⚠️ Telegram channel ID not configured - skipping video');
      return false;
    }

    try {
      await this.bot.sendVideo(this.channelId, videoUrl, {
        caption: caption,
        parse_mode: options?.parseMode,
      });
      console.log('📤 Telegram video sent successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send Telegram video:', error?.message || error);
      return false;
    }
  }

  async sendDocument(documentUrl: string, caption?: string, options?: { parseMode?: 'HTML' | 'Markdown' }): Promise<boolean> {
    if (!this.bot) {
      console.log('⚠️ Telegram bot not available - skipping document');
      return false;
    }

    if (!this.channelId) {
      console.log('⚠️ Telegram channel ID not configured - skipping document');
      return false;
    }

    try {
      await this.bot.sendDocument(this.channelId, documentUrl, {
        caption: caption,
        parse_mode: options?.parseMode,
      });
      console.log('📤 Telegram document sent successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send Telegram document:', error?.message || error);
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
    mediaUrl?: string;
    thumbnailUrl?: string;
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
👤 <a href="${process.env.PLATFORM_URL || 'https://your-platform.replit.app'}/creators/${data.creator}">${data.creator.slice(0, 6)}...${data.creator.slice(-4)}</a>
📅 Created: ${timestamp}
📄 Contract: <code>${data.coinAddress.slice(0, 6)}...${data.coinAddress.slice(-4)}</code>

🔗 <a href="https://sepolia.basescan.org/address/${data.coinAddress}">BaseScan</a> | <a href="https://dexscreener.com/base/${data.coinAddress}">DexScreener</a>

#NewCreatorCoin #${data.coinSymbol} #Deployed`;
    } else {
      // Content uploaded, pending deployment
      message = `🎬 <b>NEW CONTENT COIN UPLOADED</b>

📺 <b>${data.title}</b>
💰 Symbol: <code>${data.coinSymbol}</code>
👤 Creator: <a href="${process.env.PLATFORM_URL || 'https://your-platform.replit.app'}/creators/${data.creator}">${data.creator.slice(0, 6)}...${data.creator.slice(-4)}</a>
🎭 Type: ${data.contentType}
⏳ Status: Pending Deployment

#NewContentCoin #${data.coinSymbol} #Pending`;
    }

    // Always try to send with media first
    const mediaUrl = data.mediaUrl || data.thumbnailUrl;
    if (mediaUrl) {
      // Ensure URL is properly formatted for IPFS
      const formattedUrl = mediaUrl.startsWith('http') ? mediaUrl : 
                          mediaUrl.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${mediaUrl}` : 
                          `https://gateway.pinata.cloud/ipfs/${mediaUrl}`;
      
      console.log(`📤 Sending Telegram message with media: ${formattedUrl}`);
      
      try {
        // Try different media types based on content or file extension
        if (data.contentType === 'video' || data.contentType === 'reel' || formattedUrl.includes('.mp4') || formattedUrl.includes('.mov')) {
          return await this.sendVideo(formattedUrl, message, { parseMode: 'HTML' });
        } else if (data.contentType === 'audio' || formattedUrl.includes('.mp3') || formattedUrl.includes('.wav')) {
          return await this.sendDocument(formattedUrl, message, { parseMode: 'HTML' });
        } else if (data.contentType === 'gif' || formattedUrl.includes('.gif')) {
          // GIFs work better as animations in Telegram
          return await this.sendDocument(formattedUrl, message, { parseMode: 'HTML' });
        } else {
          // Default to photo for images and other visual content
          return await this.sendPhoto(formattedUrl, message, { parseMode: 'HTML' });
        }
      } catch (mediaError) {
        console.warn(`⚠️ Failed to send media ${formattedUrl}:`, mediaError);
        // Fallback to text if media fails
      }
    }

    // Fallback to text message
    return this.sendMessage(message, { parseMode: 'HTML' });
  }

  async notifyNewChannel(data: {
    name: string;
    creator: string;
    coinAddress?: string;
    ticker?: string;
    category?: string;
    avatarUrl?: string;
    coverUrl?: string;
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
👤 <a href="${process.env.PLATFORM_URL || 'https://your-platform.replit.app'}/creators/${data.creator}">${data.creator.slice(0, 6)}...${data.creator.slice(-4)}</a>
📅 Created: ${timestamp}
💰 Coin Address: <code>${data.coinAddress.slice(0, 6)}...${data.coinAddress.slice(-4)}</code>

🔗 <a href="https://sepolia.basescan.org/address/${data.coinAddress}">BaseScan</a>
📺 <a href="${process.env.PLATFORM_URL || 'https://your-platform.replit.app'}/channel/${data.slug || data.name.toLowerCase()}">Visit Channel</a>

#NewChannel #${data.ticker || data.name.replace(/\s+/g, '')} #WithCoin`;
    } else {
      // Regular channel without coin
      message = `📺 <b>NEW CHANNEL CREATED</b>

🏷️ <b>${data.name}</b>
📂 Category: ${data.category || 'General'}
👤 Creator: <a href="${process.env.PLATFORM_URL || 'https://your-platform.replit.app'}/creators/${data.creator}">${data.creator.slice(0, 6)}...${data.creator.slice(-4)}</a>
📅 Created: ${timestamp}

📺 <a href="${process.env.PLATFORM_URL || 'https://your-platform.replit.app'}/channel/${data.slug || data.name.toLowerCase()}">Visit Channel</a>

#NewChannel #${data.name.replace(/\s+/g, '')}`;
    }

    // Always try to send with image if available (prioritize cover over avatar)
    const imageUrl = data.coverUrl || data.avatarUrl;
    if (imageUrl) {
      // Ensure URL is properly formatted for IPFS
      const formattedUrl = imageUrl.startsWith('http') ? imageUrl : 
                          imageUrl.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${imageUrl}` : 
                          `https://gateway.pinata.cloud/ipfs/${imageUrl}`;
      
      console.log(`📤 Sending channel Telegram message with image: ${formattedUrl}`);
      
      try {
        return await this.sendPhoto(formattedUrl, message, { parseMode: 'HTML' });
      } catch (mediaError) {
        console.warn(`⚠️ Failed to send channel image ${formattedUrl}:`, mediaError);
        // Fallback to text if image fails
      }
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

  // Bulk posting functions for existing content
  async postAllExistingContent(): Promise<boolean> {
    if (!this.bot) {
      console.log('⚠️ Telegram bot not available - skipping bulk content posting');
      return false;
    }

    try {
      // Import db and storage here to avoid circular dependencies
      const { db } = await import('../db');
      const { creatorCoins } = await import('../../shared/schema');
      const { desc } = await import('drizzle-orm');

      console.log('📤 Starting bulk posting of existing content to Telegram...');
      
      // Get all content coins from database
      const contentCoins = await db.select().from(creatorCoins).orderBy(desc(creatorCoins.createdAt));
      
      console.log(`📊 Found ${contentCoins.length} content coins to post`);
      
      let successCount = 0;
      let failCount = 0;

      // Post each content coin with delay to avoid rate limiting
      for (const coin of contentCoins) {
        try {
          // Ensure proper IPFS URL formatting for media
          const mediaUrl = coin.mediaCid 
            ? (coin.mediaCid.startsWith('http') 
                ? coin.mediaCid 
                : coin.mediaCid.startsWith('baf')
                ? `https://gateway.pinata.cloud/ipfs/${coin.mediaCid}` 
                : `https://gateway.pinata.cloud/ipfs/${coin.mediaCid}`)
            : undefined;
            
          const thumbnailUrl = coin.thumbnailCid 
            ? (coin.thumbnailCid.startsWith('http')
                ? coin.thumbnailCid
                : coin.thumbnailCid.startsWith('baf')
                ? `https://gateway.pinata.cloud/ipfs/${coin.thumbnailCid}`
                : `https://gateway.pinata.cloud/ipfs/${coin.thumbnailCid}`)
            : undefined;

          console.log(`📤 Bulk posting content coin: ${coin.title} with media:`, { mediaUrl, thumbnailUrl });

          const success = await this.notifyNewContentCoin({
            title: coin.title,
            coinSymbol: coin.coinSymbol,
            creator: coin.creatorAddress,
            contentType: coin.contentType,
            coinAddress: coin.coinAddress || undefined,
            marketCap: coin.marketCap || undefined,
            totalSupply: coin.totalSupply || undefined,
            currentPrice: coin.currentPrice || undefined,
            mediaUrl,
            thumbnailUrl,
            createdAt: coin.createdAt?.toISOString()
          });

          if (success) {
            successCount++;
            console.log(`✅ Posted content: ${coin.title} (${coin.coinSymbol})`);
          } else {
            failCount++;
            console.log(`❌ Failed to post content: ${coin.title}`);
          }

          // Add delay to avoid rate limiting (3-5 seconds between posts)
          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
          
        } catch (error) {
          failCount++;
          console.error(`❌ Error posting content ${coin.title}:`, error);
        }
      }

      console.log(`📤 Bulk content posting completed: ${successCount} success, ${failCount} failed`);
      
      // Send summary message
      await this.sendMessage(
        `📊 <b>Content Sync Complete!</b>\n\n✅ Posted: ${successCount} content coins\n❌ Failed: ${failCount}\n\n#BulkSync #ContentCoins`,
        { parseMode: 'HTML' }
      );
      
      return successCount > 0;
      
    } catch (error) {
      console.error('❌ Failed to post existing content:', error);
      return false;
    }
  }

  async postAllExistingChannels(): Promise<boolean> {
    if (!this.bot) {
      console.log('⚠️ Telegram bot not available - skipping bulk channel posting');
      return false;
    }

    try {
      // Import db and storage here to avoid circular dependencies
      const { db } = await import('../db');
      const { web3Channels } = await import('../../shared/schema');
      const { desc } = await import('drizzle-orm');

      console.log('📤 Starting bulk posting of existing channels to Telegram...');
      
      // Get all channels from database
      const channels = await db.select().from(web3Channels).orderBy(desc(web3Channels.createdAt));
      
      console.log(`📊 Found ${channels.length} channels to post`);
      
      let successCount = 0;
      let failCount = 0;

      // Post each channel with delay to avoid rate limiting
      for (const channel of channels) {
        try {
          // Ensure proper IPFS URL formatting for channel images
          const avatarUrl = channel.avatarUrl 
            ? (channel.avatarUrl.startsWith('http')
                ? channel.avatarUrl
                : channel.avatarUrl.startsWith('baf')
                ? `https://gateway.pinata.cloud/ipfs/${channel.avatarUrl}`
                : `https://gateway.pinata.cloud/ipfs/${channel.avatarUrl}`)
            : undefined;
            
          const coverUrl = channel.coverUrl 
            ? (channel.coverUrl.startsWith('http')
                ? channel.coverUrl
                : channel.coverUrl.startsWith('baf')
                ? `https://gateway.pinata.cloud/ipfs/${channel.coverUrl}`
                : `https://gateway.pinata.cloud/ipfs/${channel.coverUrl}`)
            : undefined;

          console.log(`📤 Bulk posting channel: ${channel.name} with media:`, { avatarUrl, coverUrl });

          const success = await this.notifyNewChannel({
            name: channel.name,
            creator: channel.createdBy || channel.creatorAddress || channel.owner,
            coinAddress: channel.coinAddress || undefined,
            ticker: channel.ticker || channel.coinSymbol || undefined,
            category: channel.category || undefined,
            avatarUrl,
            coverUrl,
            slug: channel.slug || undefined,
            createdAt: channel.createdAt?.toISOString()
          });

          if (success) {
            successCount++;
            console.log(`✅ Posted channel: ${channel.name}`);
          } else {
            failCount++;
            console.log(`❌ Failed to post channel: ${channel.name}`);
          }

          // Add delay to avoid rate limiting (3-5 seconds between posts)
          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
          
        } catch (error) {
          failCount++;
          console.error(`❌ Error posting channel ${channel.name}:`, error);
        }
      }

      console.log(`📤 Bulk channel posting completed: ${successCount} success, ${failCount} failed`);
      
      // Send summary message
      await this.sendMessage(
        `📊 <b>Channel Sync Complete!</b>\n\n✅ Posted: ${successCount} channels\n❌ Failed: ${failCount}\n\n#BulkSync #Channels`,
        { parseMode: 'HTML' }
      );
      
      return successCount > 0;
      
    } catch (error) {
      console.error('❌ Failed to post existing channels:', error);
      return false;
    }
  }

  async postAllExistingData(): Promise<boolean> {
    console.log('🚀 Starting complete data sync to Telegram...');
    
    // Send start notification
    await this.sendMessage(
      '🚀 <b>Starting Platform Data Sync</b>\n\nPosting all existing content and channels to Telegram...\n\n#DataSync #Started',
      { parseMode: 'HTML' }
    );
    
    const contentSuccess = await this.postAllExistingContent();
    const channelSuccess = await this.postAllExistingChannels();
    
    // Send completion notification
    await this.sendMessage(
      `🎉 <b>Platform Data Sync Complete!</b>\n\n${contentSuccess ? '✅' : '❌'} Content Coins Sync\n${channelSuccess ? '✅' : '❌'} Channels Sync\n\n#DataSync #Complete`,
      { parseMode: 'HTML' }
    );
    
    return contentSuccess || channelSuccess;
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