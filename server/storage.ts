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
  type VideoWithChannel, type ShortsWithChannel, type CommentWithChannel,
  channels, videos, shorts, playlists, musicAlbums, comments, subscriptions,
  videoLikes, shortsLikes, commentLikes, shares, musicTracks, userProfiles,
  tokens, tokenSales, web3Channels, contentImports
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
}

export class DatabaseStorage implements IStorage {
  // Initialize client here if it's not already done or passed in constructor
  private client: any; // Assuming 'client' is a property that holds the database connection client

  constructor() {
    // Assuming 'db' is initialized elsewhere and accessible.
    // If 'client' needs to be explicitly set, you might need to inject it or initialize it here.
    // For this example, we'll assume 'db' can be used directly or has a client property.
    // If 'db' is a Drizzle client, it might not have a 'query' method directly like this.
    // The following implementation assumes a different client structure based on the provided snippet.
    // Let's adapt to use Drizzle's client if possible, or stick to the provided structure.

    // If the intention is to use Drizzle's `db` object for inserts:
    // We will adapt the `createWeb3Channel` to use Drizzle's insert method.
    // If the provided snippet implies a different client (e.g., pg client), then this needs adjustment.

    // For now, let's assume the provided snippet's `this.client.query` was a placeholder
    // and we should use Drizzle's `db` object as shown in other methods.
  }

  // Channel methods
  async getChannel(id: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel || undefined;
  }

  async getChannelByHandle(handle: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.handle, handle));
    return channel || undefined;
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const [newChannel] = await db.insert(channels).values({
      id: randomUUID(),
      subscriberCount: 0,
      verified: false,
      createdAt: new Date(),
      ...channel,
    }).returning();
    return newChannel;
  }

  async getAllChannels(): Promise<Channel[]> {
    return await db.select().from(channels);
  }

  async updateChannel(id: string, updates: Partial<InsertChannel>): Promise<Channel | undefined> {
    const [channel] = await db.update(channels)
      .set(updates)
      .where(eq(channels.id, id))
      .returning();
    return channel || undefined;
  }

  // Video methods
  async getVideo(id: string): Promise<VideoWithChannel | undefined> {
    const [video] = await db.select({
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
    return await db.select({
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
    return await db.select({
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
    return await db.select({
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
    const [newVideo] = await db.insert(videos).values({
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
    await db.update(videos)
      .set({ viewCount: sql`${videos.viewCount} + 1` })
      .where(eq(videos.id, id));
  }

  async searchVideos(query: string): Promise<VideoWithChannel[]> {
    return await db.select({
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
    const [album] = await db.select().from(musicAlbums).where(eq(musicAlbums.id, id));
    return album || undefined;
  }

  async getAllMusicAlbums(): Promise<MusicAlbum[]> {
    return await db.select().from(musicAlbums).orderBy(desc(musicAlbums.createdAt));
  }

  async createMusicAlbum(album: InsertMusicAlbum): Promise<MusicAlbum> {
    const [newAlbum] = await db.insert(musicAlbums).values({
      id: randomUUID(),
      createdAt: new Date(),
      ...album,
    }).returning();
    return newAlbum;
  }

  // Music Track methods
  async getMusicTrack(id: string): Promise<MusicTrack | undefined> {
    const [track] = await db.select().from(musicTracks).where(eq(musicTracks.id, id));
    return track || undefined;
  }

  async getAllMusicTracks(): Promise<MusicTrack[]> {
    return await db.select().from(musicTracks).orderBy(desc(musicTracks.createdAt));
  }

  async getTracksByAlbum(albumId: string): Promise<MusicTrack[]> {
    return await db.select().from(musicTracks)
      .where(eq(musicTracks.albumId, albumId))
      .orderBy(musicTracks.trackNumber);
  }

  async createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack> {
    const [newTrack] = await db.insert(musicTracks).values({
      id: randomUUID(),
      createdAt: new Date(),
      ...track,
    }).returning();
    return newTrack;
  }

  // Content Import methods
  async getContentImport(id: string): Promise<ContentImport | undefined> {
    const [content] = await db.select().from(contentImports).where(eq(contentImports.id, id));
    return content || undefined;
  }

  async getContentImportsByChannel(channelId: string): Promise<ContentImport[]> {
    return await db.select().from(contentImports)
      .where(eq(contentImports.channelId, channelId))
      .orderBy(desc(contentImports.createdAt));
  }

  async createContentImport(content: InsertContentImport): Promise<ContentImport> {
    const [newContent] = await db.insert(contentImports).values({
      id: randomUUID(),
      createdAt: new Date(),
      ...content,
    }).returning();
    return newContent;
  }

  async updateContentImport(id: string, updates: Partial<InsertContentImport>): Promise<ContentImport | undefined> {
    const [content] = await db.update(contentImports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentImports.id, id))
      .returning();
    return content || undefined;
  }

  async deleteContentImport(id: string): Promise<void> {
    await db.delete(contentImports).where(eq(contentImports.id, id));
  }

  async getAllContentImports(): Promise<ContentImport[]> {
    return await db.select().from(contentImports).orderBy(desc(contentImports.createdAt));
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

  async getSubscription(): Promise<Subscription | undefined> { return undefined; }
  async getSubscriptionsByChannel(): Promise<Subscription[]> { return []; }
  async createSubscription(): Promise<Subscription> { throw new Error('Not implemented'); }
  async deleteSubscription(): Promise<void> { }
  async isSubscribed(): Promise<boolean> { return false; }

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
    const channelResults = await db.select().from(channels)
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
    const [channel] = await db.select().from(web3Channels).where(eq(web3Channels.id, id));
    return channel || undefined;
  }
  async getWeb3ChannelByOwner(owner: string): Promise<Web3Channel | undefined> {
    const [channel] = await db.select().from(web3Channels).where(eq(web3Channels.createdBy, owner));
    return channel || undefined;
  }
  async getWeb3ChannelByCoinAddress(coinAddress: string): Promise<Web3Channel | undefined> {
    const [channel] = await db.select().from(web3Channels).where(eq(web3Channels.id, coinAddress)); // Assuming coinAddress is the id for now, adjust if schema differs
    return channel || undefined;
  }
  async createWeb3Channel(channel: InsertWeb3Channel): Promise<Web3Channel> {
    const [newChannel] = await db.insert(web3Channels).values({
      id: randomUUID(),
      name: channel.name,
      description: channel.description || '',
      imageUri: channel.imageUri || '',
      createdBy: channel.createdBy,
      isVerified: channel.isVerified || false,
      subscriberCount: channel.subscriberCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newChannel;
  }
  async getAllWeb3Channels(): Promise<Web3Channel[]> {
    return await db.select().from(web3Channels).orderBy(desc(web3Channels.createdAt));
  }
}

// Use database storage
export const storage = new DatabaseStorage();