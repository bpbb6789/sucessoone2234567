import { getTelegramService } from './telegramService';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { creatorCoins, web3Channels } from '@shared/schema';

export class TelegramLeaderboard {
  private static instance: TelegramLeaderboard | null = null;
  
  static getInstance(): TelegramLeaderboard {
    if (!this.instance) {
      this.instance = new TelegramLeaderboard();
    }
    return this.instance;
  }

  async sendDailyLeaderboard(): Promise<boolean> {
    const telegramService = getTelegramService();
    if (!telegramService) {
      console.log('Telegram service not available for leaderboard');
      return false;
    }

    try {
      // Get top creators by content coins count
      const topCreators = await db
        .select({
          creator: creatorCoins.creatorAddress,
          count: sql<number>`count(*)`.as('count')
        })
        .from(creatorCoins)
        .where(sql`${creatorCoins.status} = 'deployed'`)
        .groupBy(creatorCoins.creatorAddress)
        .orderBy(sql`count(*) desc`)
        .limit(5);

      if (topCreators.length > 0) {
        const leaderboardData = topCreators.map((creator, index) => ({
          name: creator.creator.slice(0, 8) + '...',
          value: `${creator.count} coins`,
          rank: index + 1
        }));

        await telegramService.notifyLeaderboard({
          type: 'CREATOR',
          topEntries: leaderboardData
        });

        console.log('📊 Daily leaderboard sent to Telegram');
        return true;
      }
    } catch (error) {
      console.error('Failed to send daily leaderboard:', error);
      return false;
    }

    return false;
  }

  async sendWeeklyStats(): Promise<boolean> {
    const telegramService = getTelegramService();
    if (!telegramService) {
      return false;
    }

    try {
      // Get weekly stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const newCoinsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(creatorCoins)
        .where(sql`${creatorCoins.createdAt} >= ${weekAgo}`)
        .then(result => result[0]?.count || 0);

      const newChannelsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(web3Channels)
        .where(sql`${web3Channels.createdAt} >= ${weekAgo}`)
        .then(result => result[0]?.count || 0);

      if (newCoinsCount > 0 || newChannelsCount > 0) {
        await telegramService.notifyMilestone({
          type: 'CONTENT_COUNT',
          milestone: 'Weekly Growth',
          current: `${newCoinsCount} new coins, ${newChannelsCount} new channels`
        });

        console.log('📈 Weekly stats sent to Telegram');
        return true;
      }
    } catch (error) {
      console.error('Failed to send weekly stats:', error);
    }

    return false;
  }

  // Schedule periodic updates
  startScheduledUpdates(): void {
    // Daily leaderboard at 9 AM UTC
    const scheduleDaily = () => {
      const now = new Date();
      const next9AM = new Date();
      next9AM.setUTCHours(9, 0, 0, 0);
      
      if (next9AM <= now) {
        next9AM.setUTCDate(next9AM.getUTCDate() + 1);
      }
      
      const timeUntilNext = next9AM.getTime() - now.getTime();
      
      setTimeout(() => {
        this.sendDailyLeaderboard();
        // Schedule for next day
        setInterval(() => this.sendDailyLeaderboard(), 24 * 60 * 60 * 1000);
      }, timeUntilNext);
    };

    // Weekly stats on Sundays at 10 AM UTC
    const scheduleWeekly = () => {
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()));
      nextSunday.setUTCHours(10, 0, 0, 0);
      
      if (nextSunday <= now) {
        nextSunday.setUTCDate(nextSunday.getUTCDate() + 7);
      }
      
      const timeUntilNext = nextSunday.getTime() - now.getTime();
      
      setTimeout(() => {
        this.sendWeeklyStats();
        // Schedule for next week
        setInterval(() => this.sendWeeklyStats(), 7 * 24 * 60 * 60 * 1000);
      }, timeUntilNext);
    };

    scheduleDaily();
    scheduleWeekly();
    
    console.log('📅 Telegram leaderboard scheduler started');
  }
}

// Initialize scheduler
export function initializeTelegramLeaderboard(): void {
  const leaderboard = TelegramLeaderboard.getInstance();
  leaderboard.startScheduledUpdates();
}