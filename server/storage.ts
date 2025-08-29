import {
  type Channel, type InsertChannel,
  type Video, type InsertVideo,
  type Shorts, type InsertShorts,
  type Playlist, type InsertPlaylist,
  type MusicAlbum, type InsertMusicAlbum,
  type Comment, type InsertComment,
  type Subscription, type InsertSubscription,
  type VideoLike, type InsertVideoLike,
  type ShortsLike, type InsertShortsLike,
  type CommentLike, type InsertCommentLike,
  type Share, type InsertShare,
  type MusicTrack, type InsertMusicTrack,
  type UserProfile, type InsertUserProfile,
  type Token, type InsertToken,
  type TokenSale, type InsertTokenSale,
  type Web3Channel, type InsertWeb3Channel,
  type ContentImport, type InsertContentImport,
  type Pad, type InsertPad,
  type PadLike, type InsertPadLike,
  type PadComment, type InsertPadComment,
  type Notification, type InsertNotification,
  type ChannelAnalytics, type InsertChannelAnalytics,
  type EnhancedSubscription, type InsertEnhancedSubscription,
  type ChannelComment, type InsertChannelComment,
  type SearchFilter, type InsertSearchFilter,
  type VideoWithChannel, type ShortsWithChannel, type CommentWithChannel,
  channels, videos, shorts, playlists, musicAlbums, comments, subscriptions,
  videoLikes, shortsLikes, commentLikes, shares, musicTracks, userProfiles,
  tokens, tokenSales, web3Channels, contentImports, pads, padLikes, padComments,
  notifications, channelAnalytics, enhancedSubscriptions, channelComments, searchFilters
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc, or, ilike, isNull, count, sql } from "drizzle-orm";

export interface IStorage {
  // Channels
  getChannel(id: string): Promise<Channel | undefined>;
  getChannelByHandle(handle: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  getAllChannels(): Promise<Channel[]>;
  updateChannel(id: string, updates: Partial<InsertChannel>): Promise<Channel | undefined>;

  // Videos
  getVideo(id: string): Promise<VideoWithChannel | undefined>;
  getAllVideos(): Promise<VideoWithChannel[]>;
  getVideosByCategory(category: string): Promise<VideoWithChannel[]>;
  getVideosByChannel(channelId: string): Promise<VideoWithChannel[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideoViews(id: string): Promise<void>;
  searchVideos(query: string): Promise<VideoWithChannel[]>;

  // Shorts
  getShorts(id: string): Promise<ShortsWithChannel | undefined>;
  getAllShorts(): Promise<ShortsWithChannel[]>;
  getShortsByChannel(channelId: string): Promise<ShortsWithChannel[]>;
  createShorts(shorts: InsertShorts): Promise<Shorts>;
  updateShortsViews(id: string): Promise<void>;
  searchShorts(query: string): Promise<ShortsWithChannel[]>;

  // Playlists
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistsByChannel(channelId: string): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;

  // Music Albums
  getMusicAlbum(id: string): Promise<MusicAlbum | undefined>;
  getAllMusicAlbums(): Promise<MusicAlbum[]>;
  createMusicAlbum(album: InsertMusicAlbum): Promise<MusicAlbum>;

  // Music Tracks
  getMusicTrack(id: string): Promise<MusicTrack | undefined>;
  getAllMusicTracks(): Promise<MusicTrack[]>;
  getTracksByAlbum(albumId: string): Promise<MusicTrack[]>;
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;

  // Comments
  getComment(id: string): Promise<CommentWithChannel | undefined>;
  getCommentsByVideo(videoId: string): Promise<CommentWithChannel[]>;
  getCommentsByShorts(shortsId: string): Promise<CommentWithChannel[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  likeComment(commentId: string, channelId: string): Promise<void>;
  unlikeComment(commentId: string, channelId: string): Promise<void>;

  // Subscriptions
  getSubscription(subscriberChannelId: string, subscribedToChannelId: string): Promise<Subscription | undefined>;
  getSubscriptionsByChannel(channelId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  deleteSubscription(subscriberChannelId: string, subscribedToChannelId: string): Promise<void>;
  isSubscribed(subscriberChannelId: string, subscribedToChannelId: string): Promise<boolean>;
  getUserSubscriptions(subscriberChannelId: string): Promise<Subscription[]>;
  getSubscriptionCount(channelId: string): Promise<number>;
  getSubscriptionFeed(subscriberChannelId: string, limit?: number, offset?: number): Promise<VideoWithChannel[]>;


  // Likes
  likeVideo(videoId: string, channelId: string, isLike: boolean): Promise<void>;
  unlikeVideo(videoId: string, channelId: string): Promise<void>;
  likeShorts(shortsId: string, channelId: string, isLike: boolean): Promise<void>;
  unlikeShorts(shortsId: string, channelId: string): Promise<void>;
  getUserVideoLike(videoId: string, channelId: string): Promise<VideoLike | undefined>;
  getUserShortsLike(shortsId: string, channelId: string): Promise<ShortsLike | undefined>;

  // Shares
  shareContent(share: InsertShare): Promise<Share>;
  getShareCount(videoId?: string, shortsId?: string): Promise<number>;

  // User Profiles
  getUserProfile(channelId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(channelId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;

  // Search
  searchAll(query: string): Promise<{videos: VideoWithChannel[], shorts: ShortsWithChannel[], channels: Channel[]}>;

  // Tokens
  getToken(id: string): Promise<Token | undefined>;
  getTokenByAddress(address: string): Promise<Token | undefined>;
  getAllTokens(): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;

  // Web3 Channels
  getWeb3Channel(id: string): Promise<Web3Channel | undefined>;
  getWeb3ChannelByOwner(owner: string): Promise<Web3Channel | undefined>;
  getWeb3ChannelByCoinAddress(coinAddress: string): Promise<Web3Channel | undefined>;
  createWeb3Channel(channel: InsertWeb3Channel): Promise<Web3Channel>;
  getAllWeb3Channels(): Promise<Web3Channel[]>;

  // Content Imports
  getContentImport(id: string): Promise<ContentImport | undefined>;
  getContentImportsByChannel(channelId: string): Promise<ContentImport[]>;
  createContentImport(content: InsertContentImport): Promise<ContentImport>;
  updateContentImport(id: string, updates: Partial<InsertContentImport>): Promise<ContentImport | undefined>;
  deleteContentImport(id: string): Promise<void>;
  getAllContentImports(): Promise<ContentImport[]>;

  // Pads (pump.fun style tokens)
  getPad(id: string): Promise<Pad | undefined>;
  getAllPads(): Promise<Pad[]>;
  getPadsByCreator(creatorAddress: string): Promise<Pad[]>;
  createPad(pad: InsertPad): Promise<Pad>;
  updatePad(id: string, updates: Partial<InsertPad>): Promise<Pad | undefined>;
  deletePad(id: string): Promise<void>;
  searchPads(query: string): Promise<Pad[]>;

  // Pad Interactions
  likePad(padId: string, userAddress: string): Promise<void>;
  unlikePad(padId: string, userAddress: string): Promise<void>;
  getPadLikes(padId: string): Promise<PadLike[]>;
  getUserPadLike(padId: string, userAddress: string): Promise<PadLike | undefined>;

  // Pad Comments
  getPadComment(id: string): Promise<PadComment | undefined>;
  getPadComments(padId: string): Promise<PadComment[]>;
  createPadComment(comment: InsertPadComment): Promise<PadComment>;
  deletePadComment(id: string): Promise<void>;

  // Notifications
  getNotifications(userAddress: string, limit?: number, unreadOnly?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userAddress: string): Promise<void>;
  getUnreadNotificationCount(userAddress: string): Promise<number>;
  deleteNotification(id: string): Promise<void>;

  // Channel Analytics
  createChannelAnalytics(analytics: InsertChannelAnalytics): Promise<ChannelAnalytics>;
  getChannelAnalytics(channelId?: string, web3ChannelId?: string): Promise<ChannelAnalytics[]>;
  getChannelSubscriberCount(channelId?: string, web3ChannelId?: string): Promise<number>;

  // Enhanced Subscriptions
  createEnhancedSubscription(subscription: InsertEnhancedSubscription): Promise<EnhancedSubscription>;
  getEnhancedSubscription(subscriberAddress: string, channelId?: string, web3ChannelId?: string): Promise<EnhancedSubscription | undefined>;
  deleteEnhancedSubscription(subscriberAddress: string, channelId?: string, web3ChannelId?: string): Promise<void>;
  updateSubscriptionPreferences(id: string, preferences: Partial<InsertEnhancedSubscription>): Promise<void>;
  getSubscriptionsByAddress(subscriberAddress: string): Promise<EnhancedSubscription[]>;

  // Channel Comments
  createChannelComment(comment: InsertChannelComment): Promise<ChannelComment>;
  getChannelComments(channelId?: string, web3ChannelId?: string): Promise<ChannelComment[]>;
  likeChannelComment(commentId: string): Promise<void>;
  deleteChannelComment(id: string): Promise<void>;
  pinChannelComment(id: string, isPinned: boolean): Promise<void>;

  // Search
  saveSearchFilter(filter: InsertSearchFilter): Promise<SearchFilter>;
  getUserSearchHistory(userAddress: string): Promise<SearchFilter[]>;
  searchChannelsAdvanced(query: string, filters?: Partial<InsertSearchFilter>): Promise<Web3Channel[]>;

}

export class DatabaseStorage implements IStorage {
  // Assuming 'db' is initialized elsewhere and accessible.
  // The following implementation assumes Drizzle's 'db' object is available.
  private db = db;

  // Helper method to retry database operations
  private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 2): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry for validation errors
        if (error.name === 'ZodError') {
          throw error;
        }
        
        // If it's the last attempt, throw the error
        if (i === maxRetries) {
          console.error(`❌ Database operation failed after ${maxRetries + 1} attempts:`, error);
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, i) * 1000;
        console.log(`⏳ Database operation failed, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Channel methods
  async getChannel(id: string): Promise<Channel | undefined> {
    const [channel] = await this.db.select().from(channels).where(eq(channels.id, id));
    return channel || undefined;
  }

  async getChannelByHandle(handle: string): Promise<Channel | undefined> {
    const [channel] = await this.db.select().from(channels).where(eq(channels.handle, handle));
    return channel || undefined;
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const [newChannel] = await this.db.insert(channels).values({
      id: randomUUID(),
      subscriberCount: 0,
      verified: false,
      createdAt: new Date(),
      ...channel,
    }).returning();
    return newChannel;
  }

  async getAllChannels(): Promise<Channel[]> {
    return await this.db.select().from(channels);
  }

  async updateChannel(id: string, updates: Partial<InsertChannel>): Promise<Channel | undefined> {
    const [channel] = await this.db.update(channels)
      .set(updates)
      .where(eq(channels.id, id))
      .returning();
    return channel || undefined;
  }

  // Video methods
  async getVideo(id: string): Promise<VideoWithChannel | undefined> {
    const [video] = await this.db.select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      thumbnailUrl: videos.thumbnailUrl,
      videoUrl: videos.videoUrl,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      dislikeCount: videos.dislikeCount,
      commentCount: videos.commentCount,
      channelId: videos.channelId,
      category: videos.category,
      tags: videos.tags,
      publishedAt: videos.publishedAt,
      createdAt: videos.createdAt,
      channel: {
        id: channels.id,
        name: channels.name,
        handle: channels.handle,
        description: channels.description,
        avatarUrl: channels.avatarUrl,
        bannerUrl: channels.bannerUrl,
        subscriberCount: channels.subscriberCount,
        verified: channels.verified,
        createdAt: channels.createdAt,
      }
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(eq(videos.id, id));

    return video || undefined;
  }

  async getAllVideos(): Promise<VideoWithChannel[]> {
    return await this.db.select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      thumbnailUrl: videos.thumbnailUrl,
      videoUrl: videos.videoUrl,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      dislikeCount: videos.dislikeCount,
      commentCount: videos.commentCount,
      channelId: videos.channelId,
      category: videos.category,
      tags: videos.tags,
      publishedAt: videos.publishedAt,
      createdAt: videos.createdAt,
      channel: {
        id: channels.id,
        name: channels.name,
        handle: channels.handle,
        description: channels.description,
        avatarUrl: channels.avatarUrl,
        bannerUrl: channels.bannerUrl,
        subscriberCount: channels.subscriberCount,
        verified: channels.verified,
        createdAt: channels.createdAt,
      }
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .orderBy(desc(videos.publishedAt));
  }

  async getVideosByCategory(category: string): Promise<VideoWithChannel[]> {
    return await this.db.select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      thumbnailUrl: videos.thumbnailUrl,
      videoUrl: videos.videoUrl,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      dislikeCount: videos.dislikeCount,
      commentCount: videos.commentCount,
      channelId: videos.channelId,
      category: videos.category,
      tags: videos.tags,
      publishedAt: videos.publishedAt,
      createdAt: videos.createdAt,
      channel: {
        id: channels.id,
        name: channels.name,
        handle: channels.handle,
        description: channels.description,
        avatarUrl: channels.avatarUrl,
        bannerUrl: channels.bannerUrl,
        subscriberCount: channels.subscriberCount,
        verified: channels.verified,
        createdAt: channels.createdAt,
      }
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(eq(videos.category, category))
    .orderBy(desc(videos.publishedAt));
  }

  async getVideosByChannel(channelId: string): Promise<VideoWithChannel[]> {
    return await this.db.select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      thumbnailUrl: videos.thumbnailUrl,
      videoUrl: videos.videoUrl,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      dislikeCount: videos.dislikeCount,
      commentCount: videos.commentCount,
      channelId: videos.channelId,
      category: videos.category,
      tags: videos.tags,
      publishedAt: videos.publishedAt,
      createdAt: videos.createdAt,
      channel: {
        id: channels.id,
        name: channels.name,
        handle: channels.handle,
        description: channels.description,
        avatarUrl: channels.avatarUrl,
        bannerUrl: channels.bannerUrl,
        subscriberCount: channels.subscriberCount,
        verified: channels.verified,
        createdAt: channels.createdAt,
      }
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(eq(videos.channelId, channelId))
    .orderBy(desc(videos.publishedAt));
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await this.db.insert(videos).values({
      id: randomUUID(),
      viewCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      commentCount: 0,
      tags: [],
      publishedAt: new Date(),
      createdAt: new Date(),
      ...video,
    }).returning();
    return newVideo;
  }

  async updateVideoViews(id: string): Promise<void> {
    await this.db.update(videos)
      .set({ viewCount: sql`${videos.viewCount} + 1` })
      .where(eq(videos.id, id));
  }

  async searchVideos(query: string): Promise<VideoWithChannel[]> {
    return await this.db.select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      thumbnailUrl: videos.thumbnailUrl,
      videoUrl: videos.videoUrl,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      dislikeCount: videos.dislikeCount,
      commentCount: videos.commentCount,
      channelId: videos.channelId,
      category: videos.category,
      tags: videos.tags,
      publishedAt: videos.publishedAt,
      createdAt: videos.createdAt,
      channel: {
        id: channels.id,
        name: channels.name,
        handle: channels.handle,
        description: channels.description,
        avatarUrl: channels.avatarUrl,
        bannerUrl: channels.bannerUrl,
        subscriberCount: channels.subscriberCount,
        verified: channels.verified,
        createdAt: channels.createdAt,
      }
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(or(
      ilike(videos.title, `%${query}%`),
      ilike(videos.description, `%${query}%`)
    ))
    .orderBy(desc(videos.publishedAt));
  }

  // Music Album methods
  async getMusicAlbum(id: string): Promise<MusicAlbum | undefined> {
    const [album] = await this.db.select().from(musicAlbums).where(eq(musicAlbums.id, id));
    return album || undefined;
  }

  async getAllMusicAlbums(): Promise<MusicAlbum[]> {
    return await this.db.select().from(musicAlbums).orderBy(desc(musicAlbums.createdAt));
  }

  async createMusicAlbum(album: InsertMusicAlbum): Promise<MusicAlbum> {
    const [newAlbum] = await this.db.insert(musicAlbums).values({
      id: randomUUID(),
      createdAt: new Date(),
      ...album,
    }).returning();
    return newAlbum;
  }

  // Music Track methods
  async getMusicTrack(id: string): Promise<MusicTrack | undefined> {
    const [track] = await this.db.select().from(musicTracks).where(eq(musicTracks.id, id));
    return track || undefined;
  }

  async getAllMusicTracks(): Promise<MusicTrack[]> {
    return await this.db.select().from(musicTracks).orderBy(desc(musicTracks.createdAt));
  }

  async getTracksByAlbum(albumId: string): Promise<MusicTrack[]> {
    return await this.db.select().from(musicTracks)
      .where(eq(musicTracks.albumId, albumId))
      .orderBy(musicTracks.trackNumber);
  }

  async createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack> {
    const [newTrack] = await this.db.insert(musicTracks).values({
      id: randomUUID(),
      createdAt: new Date(),
      ...track,
    }).returning();
    return newTrack;
  }

  // Content Import methods
  async getContentImport(id: string): Promise<ContentImport | undefined> {
    const [content] = await this.db.select().from(contentImports).where(eq(contentImports.id, id));
    return content || undefined;
  }

  async getContentImportsByChannel(channelId: string): Promise<ContentImport[]> {
    return await this.db.select().from(contentImports)
      .where(eq(contentImports.channelId, channelId))
      .orderBy(desc(contentImports.createdAt));
  }

  async createContentImport(content: InsertContentImport): Promise<ContentImport> {
    const [newContent] = await this.db.insert(contentImports).values({
      id: randomUUID(),
      createdAt: new Date(),
      ...content,
    }).returning();
    return newContent;
  }

  async updateContentImport(id: string, updates: Partial<InsertContentImport>): Promise<ContentImport | undefined> {
    const [content] = await this.db.update(contentImports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentImports.id, id))
      .returning();
    return content || undefined;
  }

  async deleteContentImport(id: string): Promise<void> {
    await this.db.delete(contentImports).where(eq(contentImports.id, id));
  }

  async getAllContentImports(): Promise<ContentImport[]> {
    return await this.db.select().from(contentImports).orderBy(desc(contentImports.createdAt));
  }

  // Pad methods
  async getPad(id: string): Promise<Pad | undefined> {
    const [pad] = await this.db.select().from(pads).where(eq(pads.id, id));
    return pad || undefined;
  }

  async getAllPads(): Promise<Pad[]> {
    return await this.db.select().from(pads).orderBy(desc(pads.createdAt));
  }

  async getPadsByCreator(creatorAddress: string): Promise<Pad[]> {
    return await this.db.select().from(pads)
      .where(eq(pads.creatorAddress, creatorAddress))
      .orderBy(desc(pads.createdAt));
  }

  async createPad(pad: InsertPad): Promise<Pad> {
    const [newPad] = await this.db.insert(pads).values({
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...pad,
    }).returning();
    return newPad;
  }

  async updatePad(id: string, updates: Partial<InsertPad>): Promise<Pad | undefined> {
    const [pad] = await this.db.update(pads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pads.id, id))
      .returning();
    return pad || undefined;
  }

  async deletePad(id: string): Promise<void> {
    await this.db.delete(pads).where(eq(pads.id, id));
  }

  async searchPads(query: string): Promise<Pad[]> {
    return await this.db.select().from(pads)
      .where(or(
        ilike(pads.title, `%${query}%`),
        ilike(pads.description, `%${query}%`),
        ilike(pads.tokenName, `%${query}%`),
        ilike(pads.tokenSymbol, `%${query}%`)
      ))
      .orderBy(desc(pads.createdAt));
  }

  // Pad interaction methods
  async likePad(padId: string, userAddress: string): Promise<void> {
    // Check if like already exists
    const existingLike = await this.getUserPadLike(padId, userAddress);
    if (existingLike) return;

    await this.db.insert(padLikes).values({
      id: randomUUID(),
      padId,
      userAddress,
      createdAt: new Date(),
    });

    // Update like count in pads table
    await this.db.update(pads)
      .set({ likes: sql`${pads.likes} + 1` })
      .where(eq(pads.id, padId));
  }

  async unlikePad(padId: string, userAddress: string): Promise<void> {
    const result = await this.db.delete(padLikes)
      .where(and(eq(padLikes.padId, padId), eq(padLikes.userAddress, userAddress)))
      .returning();

    if (result.length > 0) {
      // Update like count in pads table
      await this.db.update(pads)
        .set({ likes: sql`${pads.likes} - 1` })
        .where(eq(pads.id, padId));
    }
  }

  async getPadLikes(padId: string): Promise<PadLike[]> {
    return await this.db.select().from(padLikes).where(eq(padLikes.padId, padId));
  }

  async getUserPadLike(padId: string, userAddress: string): Promise<PadLike | undefined> {
    const [like] = await this.db.select().from(padLikes)
      .where(and(eq(padLikes.padId, padId), eq(padLikes.userAddress, userAddress)));
    return like || undefined;
  }

  // Pad comment methods
  async getPadComment(id: string): Promise<PadComment | undefined> {
    const [comment] = await this.db.select().from(padComments).where(eq(padComments.id, id));
    return comment || undefined;
  }

  async getPadComments(padId: string): Promise<PadComment[]> {
    return await this.db.select().from(padComments)
      .where(eq(padComments.padId, padId))
      .orderBy(desc(padComments.createdAt));
  }

  async createPadComment(comment: InsertPadComment): Promise<PadComment> {
    const [newComment] = await this.db.insert(padComments).values({
      id: randomUUID(),
      createdAt: new Date(),
      ...comment,
    }).returning();

    // Update comment count in pads table
    await this.db.update(pads)
      .set({ comments: sql`${pads.comments} + 1` })
      .where(eq(pads.id, comment.padId));

    return newComment;
  }

  async deletePadComment(id: string): Promise<void> {
    const [deletedComment] = await this.db.delete(padComments)
      .where(eq(padComments.id, id))
      .returning();

    if (deletedComment) {
      // Update comment count in pads table
      await this.db.update(pads)
        .set({ comments: sql`${pads.comments} - 1` })
        .where(eq(pads.id, deletedComment.padId));
    }
  }

  // Notifications Implementation
  async getNotifications(userAddress: string, limit: number = 50, unreadOnly: boolean = false): Promise<Notification[]> {
    let query = this.db.select().from(notifications)
      .where(eq(notifications.recipientAddress, userAddress));
    
    if (unreadOnly) {
      query = query.where(eq(notifications.isRead, false));
    }
    
    return await query.orderBy(desc(notifications.createdAt)).limit(limit);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await this.db.insert(notifications).values({
      id: randomUUID(),
      createdAt: new Date(),
      isRead: false,
      ...notification,
    }).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userAddress: string): Promise<void> {
    await this.db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(notifications.recipientAddress, userAddress),
        eq(notifications.isRead, false)
      ));
  }

  async getUnreadNotificationCount(userAddress: string): Promise<number> {
    const result = await this.db.select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.recipientAddress, userAddress),
        eq(notifications.isRead, false)
      ));
    return result[0]?.count || 0;
  }

  async deleteNotification(id: string): Promise<void> {
    await this.db.delete(notifications).where(eq(notifications.id, id));
  }

  // Subscription methods
  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    try {
      // Check if subscription already exists
      const existing = await this.isSubscribed(data.subscriberChannelId, data.subscribedToChannelId);
      if (existing) {
        throw new Error('Already subscribed to this channel');
      }

      const [subscription] = await this.db.insert(subscriptions).values(data).returning();

      // Update subscriber count for the channel being subscribed to
      await this.db.update(channels)
        .set({
          subscriberCount: sql`${channels.subscriberCount} + 1`
        })
        .where(eq(channels.id, data.subscribedToChannelId));

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async deleteSubscription(subscriberChannelId: string, subscribedToChannelId: string): Promise<Subscription[]> {
    try {
      const result = await this.db.delete(subscriptions)
        .where(
          and(
            eq(subscriptions.subscriberChannelId, subscriberChannelId),
            eq(subscriptions.subscribedToChannelId, subscribedToChannelId)
          )
        )
        .returning();

      if (result.length > 0) {
        // Update subscriber count for the channel being unsubscribed from
        await this.db.update(channels)
          .set({
            subscriberCount: sql`GREATEST(${channels.subscriberCount} - 1, 0)`
          })
          .where(eq(channels.id, subscribedToChannelId));
      }

      return result;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  }

  async getSubscriptionsByChannel(channelId: string): Promise<any[]> {
    try {
      return await this.db.select({
        id: subscriptions.id,
        subscriberChannelId: subscriptions.subscriberChannelId,
        subscribedToChannelId: subscriptions.subscribedToChannelId,
        createdAt: subscriptions.createdAt,
        subscriber: {
          id: channels.id,
          name: channels.name,
          handle: channels.handle,
          avatarUrl: channels.avatarUrl
        }
      })
      .from(subscriptions)
      .leftJoin(channels, eq(subscriptions.subscriberChannelId, channels.id))
      .where(eq(subscriptions.subscribedToChannelId, channelId))
      .orderBy(desc(subscriptions.createdAt));
    } catch (error) {
      console.error('Error getting subscriptions by channel:', error);
      throw error;
    }
  }

  async getUserSubscriptions(subscriberChannelId: string): Promise<any[]> {
    try {
      return await this.db.select({
        id: subscriptions.id,
        subscriberChannelId: subscriptions.subscriberChannelId,
        subscribedToChannelId: subscriptions.subscribedToChannelId,
        createdAt: subscriptions.createdAt,
        channel: {
          id: channels.id,
          name: channels.name,
          handle: channels.handle,
          avatarUrl: channels.avatarUrl,
          subscriberCount: channels.subscriberCount,
          verified: channels.verified
        }
      })
      .from(subscriptions)
      .leftJoin(channels, eq(subscriptions.subscribedToChannelId, channels.id))
      .where(eq(subscriptions.subscriberChannelId, subscriberChannelId))
      .orderBy(desc(subscriptions.createdAt));
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      throw error;
    }
  }

  async isSubscribed(subscriberChannelId: string, subscribedToChannelId: string): Promise<boolean> {
    try {
      if (!subscriberChannelId || !subscribedToChannelId) {
        return false;
      }

      const result = await this.db.select().from(subscriptions)
        .where(
          and(
            eq(subscriptions.subscriberChannelId, subscriberChannelId),
            eq(subscriptions.subscribedToChannelId, subscribedToChannelId)
          )
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  async getSubscriptionCount(channelId: string): Promise<number> {
    try {
      const result = await this.db.select({ count: sql<number>`count(*)` })
        .from(subscriptions)
        .where(eq(subscriptions.subscribedToChannelId, channelId));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting subscription count:', error);
      return 0;
    }
  }

  async getSubscriptionFeed(subscriberChannelId: string, limit: number = 20, offset: number = 0): Promise<VideoWithChannel[]> {
    try {
      // Get videos from subscribed channels
      const feedVideos = await this.db.select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        dislikeCount: videos.dislikeCount,
        commentCount: videos.commentCount,
        category: videos.category,
        tags: videos.tags,
        publishedAt: videos.publishedAt,
        createdAt: videos.createdAt,
        channel: {
          id: channels.id,
          name: channels.name,
          handle: channels.handle,
          avatarUrl: channels.avatarUrl,
          verified: channels.verified
        }
      })
      .from(videos)
      .leftJoin(channels, eq(videos.channelId, channels.id))
      .leftJoin(subscriptions, and(
        eq(subscriptions.subscribedToChannelId, videos.channelId),
        eq(subscriptions.subscriberChannelId, subscriberChannelId)
      ))
      .where(sql`${subscriptions.id} IS NOT NULL`)
      .orderBy(desc(videos.publishedAt))
      .limit(limit)
      .offset(offset);

      return feedVideos;
    } catch (error) {
      console.error('Error getting subscription feed:', error);
      throw error;
    }
  }


  // Placeholder implementations for remaining methods
  async getShorts(): Promise<ShortsWithChannel | undefined> { return undefined; }
  async getAllShorts(): Promise<ShortsWithChannel[]> { return []; }
  async getShortsByChannel(): Promise<ShortsWithChannel[]> { return []; }
  async createShorts(): Promise<Shorts> { throw new Error('Not implemented'); }
  async updateShortsViews(): Promise<void> { }
  async searchShorts(): Promise<ShortsWithChannel[]> { return []; }

  async getPlaylist(): Promise<Playlist | undefined> { return undefined; }
  async getPlaylistsByChannel(): Promise<Playlist[]> { return []; }
  async createPlaylist(): Promise<Playlist> { throw new Error('Not implemented'); }

  async getComment(): Promise<CommentWithChannel | undefined> { return undefined; }
  async getCommentsByVideo(): Promise<CommentWithChannel[]> { return []; }
  async getCommentsByShorts(): Promise<CommentWithChannel[]> { return []; }
  async createComment(): Promise<Comment> { throw new Error('Not implemented'); }
  async likeComment(): Promise<void> { }
  async unlikeComment(): Promise<void> { }

  async likeVideo(): Promise<void> { }
  async unlikeVideo(): Promise<void> { }
  async likeShorts(): Promise<void> { }
  async unlikeShorts(): Promise<void> { }
  async getUserVideoLike(): Promise<VideoLike | undefined> { return undefined; }
  async getUserShortsLike(): Promise<ShortsLike | undefined> { return undefined; }

  async shareContent(): Promise<Share> { throw new Error('Not implemented'); }
  async getShareCount(): Promise<number> { return 0; }

  async getUserProfile(): Promise<UserProfile | undefined> { return undefined; }
  async createUserProfile(): Promise<UserProfile> { throw new Error('Not implemented'); }
  async updateUserProfile(): Promise<UserProfile | undefined> { return undefined; }

  async searchAll(query: string): Promise<{videos: VideoWithChannel[], shorts: ShortsWithChannel[], channels: Channel[]}> {
    const videos = await this.searchVideos(query);
    const shorts: ShortsWithChannel[] = [];
    const channelResults = await this.db.select().from(channels)
      .where(or(
        ilike(channels.name, `%${query}%`),
        ilike(channels.description, `%${query}%`)
      ));
    return { videos, shorts, channels: channelResults };
  }

  async getToken(): Promise<Token | undefined> { return undefined; }
  async getTokenByAddress(): Promise<Token | undefined> { return undefined; }
  async getAllTokens(): Promise<Token[]> { return []; }
  async createToken(): Promise<Token> { throw new Error('Not implemented'); }

  async getWeb3Channel(id: string): Promise<Web3Channel | undefined> {
    const [channel] = await this.db.select().from(web3Channels).where(eq(web3Channels.id, id));
    return channel || undefined;
  }
  async getWeb3ChannelByOwner(owner: string): Promise<Web3Channel | undefined> {
    const [channel] = await this.db.select().from(web3Channels).where(eq(web3Channels.owner, owner));
    return channel || undefined;
  }
  async getWeb3ChannelByCoinAddress(coinAddress: string): Promise<Web3Channel | undefined> {
    const [channel] = await this.db.select().from(web3Channels).where(eq(web3Channels.coinAddress, coinAddress));
    return channel || undefined;
  }
  async createWeb3Channel(channel: InsertWeb3Channel): Promise<Web3Channel> {
    const [newChannel] = await this.db.insert(web3Channels).values({
      owner: channel.owner,
      createdBy: channel.createdBy,
      name: channel.name,
      slug: channel.slug || channel.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      ticker: channel.ticker,
      coinAddress: channel.coinAddress,
      chainId: channel.chainId || 8453,
      avatarCid: channel.avatarCid,
      coverCid: channel.coverCid,
      category: channel.category,
      description: channel.description,
      zoraPlatform: channel.zoraPlatform || 'zora',
      zoraFactoryAddress: channel.zoraFactoryAddress,
      metadataUri: channel.metadataUri,
      currency: channel.currency || 'ETH',
      status: channel.status || 'active',
      currentPrice: channel.currentPrice,
      marketCap: channel.marketCap,
      holders: channel.holders,
      volume24h: channel.volume24h,
      txHash: channel.txHash,
    }).returning();
    return newChannel;
  }
  async getAllWeb3Channels(): Promise<Web3Channel[]> {
    return await this.retryOperation(async () => {
      return await this.db.select().from(web3Channels).orderBy(desc(web3Channels.createdAt));
    });
  }

  // Content Imports - Placeholder implementations
  async getContentImport(): Promise<ContentImport | undefined> { return undefined; }
  async getContentImportsByChannel(): Promise<ContentImport[]> { return []; }
  async createContentImport(): Promise<ContentImport> { throw new Error('Not implemented'); }
  async updateContentImport(): Promise<ContentImport | undefined> { return undefined; }
  async deleteContentImport(): Promise<void> { }
  async getAllContentImports(): Promise<ContentImport[]> { return []; }

  // Pads - Placeholder implementations
  async getPad(): Promise<Pad | undefined> { return undefined; }
  async getAllPads(): Promise<Pad[]> { return []; }
  async getPadsByCreator(): Promise<Pad[]> { return []; }
  async createPad(): Promise<Pad> { throw new Error('Not implemented'); }
  async updatePad(): Promise<Pad | undefined> { return undefined; }
  async deletePad(): Promise<void> { }
  async searchPads(): Promise<Pad[]> { return []; }

  // Pad Interactions - Placeholder implementations
  async likePad(): Promise<void> { }
  async unlikePad(): Promise<void> { }
  async getPadLikes(): Promise<PadLike[]> { return []; }
  async getUserPadLike(): Promise<PadLike | undefined> { return undefined; }

  // Pad Comments - Placeholder implementations
  async getPadComment(): Promise<PadComment | undefined> { return undefined; }
  async getPadComments(): Promise<PadComment[]> { return []; }
  async createPadComment(): Promise<PadComment> { throw new Error('Not implemented'); }
  async deletePadComment(): Promise<void> { }


  // Channel Analytics Implementation
  async createChannelAnalytics(analytics: InsertChannelAnalytics): Promise<ChannelAnalytics> {
    const [newAnalytics] = await this.db.insert(channelAnalytics).values({
      id: randomUUID(),
      createdAt: new Date(),
      ...analytics,
    }).returning();
    return newAnalytics;
  }

  async getChannelAnalytics(channelId?: string, web3ChannelId?: string): Promise<ChannelAnalytics[]> {
    let query = this.db.select().from(channelAnalytics);
    
    if (channelId) {
      query = query.where(eq(channelAnalytics.channelId, channelId));
    } else if (web3ChannelId) {
      query = query.where(eq(channelAnalytics.web3ChannelId, web3ChannelId));
    }
    
    return await query.orderBy(desc(channelAnalytics.date));
  }

  async updateChannelAnalytics(channelId: string, updates: Partial<InsertChannelAnalytics>): Promise<void> {
    await this.db.update(channelAnalytics)
      .set(updates)
      .where(eq(channelAnalytics.channelId, channelId));
  }

  async getChannelSubscriberCount(channelId?: string, web3ChannelId?: string): Promise<number> {
    if (web3ChannelId) {
      const result = await this.db.select({ count: count() })
        .from(enhancedSubscriptions)
        .where(eq(enhancedSubscriptions.web3ChannelId, web3ChannelId));
      return result[0]?.count || 0;
    } else if (channelId) {
      const result = await this.db.select({ count: count() })
        .from(subscriptions)
        .where(eq(subscriptions.subscribedToChannelId, channelId));
      return result[0]?.count || 0;
    }
    return 0;
  }

  // Enhanced Subscriptions Implementation
  async createEnhancedSubscription(subscription: InsertEnhancedSubscription): Promise<EnhancedSubscription> {
    const [newSubscription] = await this.db.insert(enhancedSubscriptions).values({
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...subscription,
    }).returning();
    return newSubscription;
  }

  async getEnhancedSubscription(subscriberAddress: string, channelId?: string, web3ChannelId?: string): Promise<EnhancedSubscription | undefined> {
    let query = this.db.select().from(enhancedSubscriptions)
      .where(eq(enhancedSubscriptions.subscriberAddress, subscriberAddress));
    
    if (channelId) {
      query = query.where(eq(enhancedSubscriptions.channelId, channelId));
    } else if (web3ChannelId) {
      query = query.where(eq(enhancedSubscriptions.web3ChannelId, web3ChannelId));
    }
    
    const [subscription] = await query;
    return subscription || undefined;
  }

  async deleteEnhancedSubscription(subscriberAddress: string, channelId?: string, web3ChannelId?: string): Promise<void> {
    let query = this.db.delete(enhancedSubscriptions)
      .where(eq(enhancedSubscriptions.subscriberAddress, subscriberAddress));
    
    if (channelId) {
      await this.db.delete(enhancedSubscriptions)
        .where(and(
          eq(enhancedSubscriptions.subscriberAddress, subscriberAddress),
          eq(enhancedSubscriptions.channelId, channelId)
        ));
    } else if (web3ChannelId) {
      await this.db.delete(enhancedSubscriptions)
        .where(and(
          eq(enhancedSubscriptions.subscriberAddress, subscriberAddress),
          eq(enhancedSubscriptions.web3ChannelId, web3ChannelId)
        ));
    }
  }

  async updateSubscriptionPreferences(id: string, preferences: Partial<InsertEnhancedSubscription>): Promise<void> {
    await this.db.update(enhancedSubscriptions)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(enhancedSubscriptions.id, id));
  }

  async getSubscriptionsByAddress(subscriberAddress: string): Promise<EnhancedSubscription[]> {
    return await this.db.select().from(enhancedSubscriptions)
      .where(eq(enhancedSubscriptions.subscriberAddress, subscriberAddress))
      .orderBy(desc(enhancedSubscriptions.createdAt));
  }

  // Channel Comments Implementation
  async createChannelComment(comment: InsertChannelComment): Promise<ChannelComment> {
    const [newComment] = await this.db.insert(channelComments).values({
      id: randomUUID(),
      createdAt: new Date(),
      likes: 0,
      replyCount: 0,
      ...comment,
    }).returning();
    return newComment;
  }

  async getChannelComments(channelId?: string, web3ChannelId?: string): Promise<ChannelComment[]> {
    let query = this.db.select().from(channelComments);
    
    if (channelId) {
      query = query.where(eq(channelComments.channelId, channelId));
    } else if (web3ChannelId) {
      query = query.where(eq(channelComments.web3ChannelId, web3ChannelId));
    }
    
    return await query.orderBy(desc(channelComments.createdAt));
  }

  async likeChannelComment(commentId: string): Promise<void> {
    await this.db.update(channelComments)
      .set({ likes: sql`${channelComments.likes} + 1` })
      .where(eq(channelComments.id, commentId));
  }

  async deleteChannelComment(id: string): Promise<void> {
    await this.db.delete(channelComments).where(eq(channelComments.id, id));
  }

  async pinChannelComment(id: string, isPinned: boolean): Promise<void> {
    await this.db.update(channelComments)
      .set({ isPinned })
      .where(eq(channelComments.id, id));
  }

  // Search Filters & Advanced Search Implementation
  async saveSearchFilter(filter: InsertSearchFilter): Promise<SearchFilter> {
    const [newFilter] = await this.db.insert(searchFilters).values({
      id: randomUUID(),
      createdAt: new Date(),
      resultsFound: 0,
      ...filter,
    }).returning();
    return newFilter;
  }

  async getUserSearchHistory(userAddress: string): Promise<SearchFilter[]> {
    return await this.db.select().from(searchFilters)
      .where(eq(searchFilters.userAddress, userAddress))
      .orderBy(desc(searchFilters.createdAt))
      .limit(20);
  }

  async searchChannelsAdvanced(query: string, filters?: Partial<InsertSearchFilter>): Promise<Web3Channel[]> {
    let dbQuery = this.db.select().from(web3Channels);
    
    // Basic text search
    if (query) {
      dbQuery = dbQuery.where(or(
        ilike(web3Channels.name, `%${query}%`),
        ilike(web3Channels.description, `%${query}%`),
        ilike(web3Channels.ticker, `%${query}%`)
      ));
    }
    
    // Apply filters
    if (filters?.categoryFilter) {
      dbQuery = dbQuery.where(eq(web3Channels.category, filters.categoryFilter));
    }
    
    // Sort by criteria
    if (filters?.sortBy === 'newest') {
      dbQuery = dbQuery.orderBy(desc(web3Channels.createdAt));
    } else if (filters?.sortBy === 'market_cap') {
      dbQuery = dbQuery.orderBy(desc(web3Channels.marketCap));
    } else {
      dbQuery = dbQuery.orderBy(desc(web3Channels.createdAt)); // default to newest
    }
    
    return await dbQuery;
  }
}

// Use database storage
export const storage = new DatabaseStorage();