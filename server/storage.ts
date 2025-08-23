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
import { eq, and, desc, or, ilike, isNull, count } from "drizzle-orm";

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
}

export class MemStorage implements IStorage {
  private channels: Map<string, Channel> = new Map();
  private videos: Map<string, Video> = new Map();
  private shorts: Map<string, Shorts> = new Map();
  private playlists: Map<string, Playlist> = new Map();
  private musicAlbums: Map<string, MusicAlbum> = new Map();
  private comments: Map<string, Comment> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize sample channels
    const sampleChannels: Channel[] = [
      {
        id: "1",
        name: "Tech Explorer",
        handle: "@techexplorer",
        description: "Latest technology reviews and tutorials",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300",
        subscriberCount: 2500000,
        verified: true,
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "Nature Explorer",
        handle: "@natureexplorer",
        description: "Amazing nature landscapes and wildlife",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        bannerUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300",
        subscriberCount: 1800000,
        verified: true,
        createdAt: new Date(),
      },
      {
        id: "3",
        name: "Chef Master",
        handle: "@chefmaster",
        description: "Delicious recipes and cooking tutorials",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        bannerUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300",
        subscriberCount: 940000,
        verified: false,
        createdAt: new Date(),
      },
    ];

    // Initialize sample videos
    const sampleVideos: Video[] = [
      {
        id: "1",
        title: "Amazing Nature Landscapes You Must Visit",
        description: "Explore the most beautiful nature landscapes around the world",
        thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: 720,
        viewCount: 2300000,
        likeCount: 142000,
        dislikeCount: 1200,
        commentCount: 8500,
        channelId: "2",
        category: "Travel",
        tags: ["nature", "travel", "landscapes"],
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: "2",
        title: "Latest Tech Reviews 2024 - Must Watch",
        description: "Comprehensive review of the latest technology products",
        thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: 1440,
        viewCount: 1800000,
        likeCount: 89000,
        dislikeCount: 800,
        commentCount: 5200,
        channelId: "1",
        category: "Technology",
        tags: ["tech", "review", "2024"],
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: "3",
        title: "Top 10 Delicious Recipes for Beginners",
        description: "Easy and delicious recipes that anyone can make at home",
        thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: 900,
        viewCount: 950000,
        likeCount: 67000,
        dislikeCount: 400,
        commentCount: 3200,
        channelId: "3",
        category: "Cooking",
        tags: ["cooking", "recipes", "food"],
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: "4",
        title: "Epic Gaming Moments Compilation",
        description: "The best gaming moments from this week's streams",
        thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: 600,
        viewCount: 1200000,
        likeCount: 85000,
        dislikeCount: 600,
        commentCount: 4100,
        channelId: "1",
        category: "Gaming",
        tags: ["gaming", "compilation", "epic"],
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: "5",
        title: "Relaxing Music for Focus and Study",
        description: "2 hours of calming instrumental music perfect for concentration",
        thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: 7200,
        viewCount: 3500000,
        likeCount: 195000,
        dislikeCount: 800,
        commentCount: 12500,
        channelId: "2",
        category: "Music",
        tags: ["music", "relaxing", "study", "focus"],
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
    ];

    // Initialize sample shorts
    const sampleShorts: Shorts[] = [
      {
        id: "1",
        title: "Funny Cat Compilation #shorts",
        description: "Hilarious cat moments that will make you laugh",
        thumbnailUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=270&h=480",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        viewCount: 2100000,
        likeCount: 180000,
        dislikeCount: 500,
        commentCount: 12000,
        channelId: "3",
        hashtags: ["cats", "funny", "pets"],
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: "2",
        title: "Quick Cooking Hack #shorts",
        description: "Amazing cooking tip that will save you time",
        thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=270&h=480",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        viewCount: 890000,
        likeCount: 67000,
        dislikeCount: 200,
        commentCount: 4500,
        channelId: "3",
        hashtags: ["cooking", "hack", "kitchen"],
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: "3",
        title: "Tech Tips in 60 Seconds #shorts",
        description: "Quick tech tip everyone should know",
        thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=270&h=480",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        viewCount: 1300000,
        likeCount: 95000,
        dislikeCount: 300,
        commentCount: 6700,
        channelId: "1",
        hashtags: ["tech", "tips", "productivity"],
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      {
        id: "4",
        title: "Beautiful Sunset Timelapse #shorts",
        description: "Stunning sunset captured in 30 seconds",
        thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=270&h=480",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        viewCount: 750000,
        likeCount: 48000,
        dislikeCount: 150,
        commentCount: 2800,
        channelId: "2",
        hashtags: ["nature", "sunset", "timelapse"],
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
    ];

    // Store data
    sampleChannels.forEach(channel => this.channels.set(channel.id, channel));
    sampleVideos.forEach(video => this.videos.set(video.id, video));
    sampleShorts.forEach(short => this.shorts.set(short.id, short));
  }

  // Channel methods
  async getChannel(id: string): Promise<Channel | undefined> {
    return this.channels.get(id);
  }

  async getChannelByHandle(handle: string): Promise<Channel | undefined> {
    return Array.from(this.channels.values()).find(channel => channel.handle === handle);
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = randomUUID();
    const channel: Channel = { 
      ...insertChannel, 
      id, 
      createdAt: new Date(),
      description: insertChannel.description ?? null,
      bannerUrl: insertChannel.bannerUrl ?? null,
      subscriberCount: insertChannel.subscriberCount ?? 0,
      verified: insertChannel.verified ?? false
    };
    this.channels.set(id, channel);
    return channel;
  }

  async getAllChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  // Video methods
  async getVideo(id: string): Promise<VideoWithChannel | undefined> {
    const video = this.videos.get(id);
    if (!video) return undefined;
    const channel = this.channels.get(video.channelId);
    if (!channel) return undefined;
    return { ...video, channel };
  }

  async getAllVideos(): Promise<VideoWithChannel[]> {
    const videos: VideoWithChannel[] = [];
    const videoValues = Array.from(this.videos.values());
    for (const video of videoValues) {
      const channel = this.channels.get(video.channelId);
      if (channel) {
        videos.push({ ...video, channel });
      }
    }
    return videos.sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime());
  }

  async getVideosByCategory(category: string): Promise<VideoWithChannel[]> {
    const allVideos = await this.getAllVideos();
    return allVideos.filter(video => video.category === category);
  }

  async getVideosByChannel(channelId: string): Promise<VideoWithChannel[]> {
    const allVideos = await this.getAllVideos();
    return allVideos.filter(video => video.channelId === channelId);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = { 
      ...insertVideo, 
      id, 
      createdAt: new Date(),
      description: insertVideo.description ?? null,
      category: insertVideo.category ?? null,
      duration: insertVideo.duration ?? null,
      viewCount: insertVideo.viewCount ?? 0,
      likeCount: insertVideo.likeCount ?? 0,
      dislikeCount: insertVideo.dislikeCount ?? 0,
      commentCount: insertVideo.commentCount ?? 0,
      publishedAt: insertVideo.publishedAt ?? new Date(),
      tags: insertVideo.tags ?? null
    };
    this.videos.set(id, video);
    return video;
  }

  async updateVideoViews(id: string): Promise<void> {
    const video = this.videos.get(id);
    if (video) {
      video.viewCount = (video.viewCount || 0) + 1;
      this.videos.set(id, video);
    }
  }

  // Shorts methods
  async getShorts(id: string): Promise<ShortsWithChannel | undefined> {
    const shorts = this.shorts.get(id);
    if (!shorts) return undefined;
    const channel = this.channels.get(shorts.channelId);
    if (!channel) return undefined;
    return { ...shorts, channel };
  }

  async getAllShorts(): Promise<ShortsWithChannel[]> {
    const shorts: ShortsWithChannel[] = [];
    const shortsValues = Array.from(this.shorts.values());
    for (const short of shortsValues) {
      const channel = this.channels.get(short.channelId);
      if (channel) {
        shorts.push({ ...short, channel });
      }
    }
    return shorts.sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime());
  }

  async getShortsByChannel(channelId: string): Promise<ShortsWithChannel[]> {
    const allShorts = await this.getAllShorts();
    return allShorts.filter(short => short.channelId === channelId);
  }

  async createShorts(insertShorts: InsertShorts): Promise<Shorts> {
    const id = randomUUID();
    const shorts: Shorts = { 
      ...insertShorts, 
      id, 
      createdAt: new Date(),
      description: insertShorts.description ?? null,
      viewCount: insertShorts.viewCount ?? 0,
      likeCount: insertShorts.likeCount ?? 0,
      dislikeCount: insertShorts.dislikeCount ?? 0,
      commentCount: insertShorts.commentCount ?? 0,
      publishedAt: insertShorts.publishedAt ?? new Date(),
      hashtags: insertShorts.hashtags ?? null
    };
    this.shorts.set(id, shorts);
    return shorts;
  }

  async updateShortsViews(id: string): Promise<void> {
    const shorts = this.shorts.get(id);
    if (shorts) {
      shorts.viewCount = (shorts.viewCount || 0) + 1;
      this.shorts.set(id, shorts);
    }
  }

  // Playlist methods
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getPlaylistsByChannel(channelId: string): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(playlist => playlist.channelId === channelId);
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const id = randomUUID();
    const playlist: Playlist = { 
      ...insertPlaylist, 
      id, 
      createdAt: new Date(),
      description: insertPlaylist.description ?? null,
      thumbnailUrl: insertPlaylist.thumbnailUrl ?? null,
      videoCount: insertPlaylist.videoCount ?? 0,
      privacy: insertPlaylist.privacy ?? "public"
    };
    this.playlists.set(id, playlist);
    return playlist;
  }

  // Music Album methods
  async getMusicAlbum(id: string): Promise<MusicAlbum | undefined> {
    return this.musicAlbums.get(id);
  }

  async getAllMusicAlbums(): Promise<MusicAlbum[]> {
    return Array.from(this.musicAlbums.values());
  }

  async createMusicAlbum(insertMusicAlbum: InsertMusicAlbum): Promise<MusicAlbum> {
    const id = randomUUID();
    const album: MusicAlbum = { 
      ...insertMusicAlbum, 
      id, 
      createdAt: new Date(),
      genre: insertMusicAlbum.genre ?? null,
      releaseYear: insertMusicAlbum.releaseYear ?? null,
      trackCount: insertMusicAlbum.trackCount ?? 0
    };
    this.musicAlbums.set(id, album);
    return album;
  }

  // Comment methods
  async getComment(id: string): Promise<CommentWithChannel | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    const channel = this.channels.get(comment.channelId);
    if (!channel) return undefined;
    return { ...comment, channel };
  }

  async getCommentsByVideo(videoId: string): Promise<CommentWithChannel[]> {
    const comments: CommentWithChannel[] = [];
    const commentValues = Array.from(this.comments.values());
    for (const comment of commentValues) {
      if (comment.videoId === videoId) {
        const channel = this.channels.get(comment.channelId);
        if (channel) {
          comments.push({ ...comment, channel });
        }
      }
    }
    return comments.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getCommentsByShorts(shortsId: string): Promise<CommentWithChannel[]> {
    const comments: CommentWithChannel[] = [];
    const commentValues = Array.from(this.comments.values());
    for (const comment of commentValues) {
      if (comment.shortsId === shortsId) {
        const channel = this.channels.get(comment.channelId);
        if (channel) {
          comments.push({ ...comment, channel });
        }
      }
    }
    return comments.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = { 
      ...insertComment, 
      id, 
      createdAt: new Date(),
      likeCount: insertComment.likeCount ?? 0,
      replyCount: insertComment.replyCount ?? 0,
      videoId: insertComment.videoId ?? null,
      shortsId: insertComment.shortsId ?? null,
      parentId: insertComment.parentId ?? null
    };
    this.comments.set(id, comment);
    return comment;
  }

  // Subscription methods
  async getSubscription(subscriberChannelId: string, subscribedToChannelId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      sub => sub.subscriberChannelId === subscriberChannelId && sub.subscribedToChannelId === subscribedToChannelId
    );
  }

  async getSubscriptionsByChannel(channelId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => sub.subscriberChannelId === channelId);
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = { ...insertSubscription, id, createdAt: new Date() };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async deleteSubscription(subscriberChannelId: string, subscribedToChannelId: string): Promise<void> {
    const subscription = await this.getSubscription(subscriberChannelId, subscribedToChannelId);
    if (subscription) {
      this.subscriptions.delete(subscription.id);
    }
  }

  // Stub implementations for new methods (not implemented in MemStorage)
  async updateChannel(): Promise<Channel | undefined> { throw new Error('Not implemented in MemStorage'); }
  async searchVideos(): Promise<VideoWithChannel[]> { throw new Error('Not implemented in MemStorage'); }
  async searchShorts(): Promise<ShortsWithChannel[]> { throw new Error('Not implemented in MemStorage'); }
  async getMusicTrack(): Promise<MusicTrack | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getTracksByAlbum(): Promise<MusicTrack[]> { throw new Error('Not implemented in MemStorage'); }
  
  // Token methods (not implemented in MemStorage)
  async getToken(): Promise<Token | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getTokenByAddress(): Promise<Token | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getAllTokens(): Promise<Token[]> { throw new Error('Not implemented in MemStorage'); }
  async createToken(): Promise<Token> { throw new Error('Not implemented in MemStorage'); }

  // Web3 Channel methods (not implemented in MemStorage)
  async getWeb3Channel(): Promise<Web3Channel | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getWeb3ChannelByOwner(): Promise<Web3Channel | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getWeb3ChannelByCoinAddress(): Promise<Web3Channel | undefined> { throw new Error('Not implemented in MemStorage'); }
  async createWeb3Channel(): Promise<Web3Channel> { throw new Error('Not implemented in MemStorage'); }
  async getAllWeb3Channels(): Promise<Web3Channel[]> { throw new Error('Not implemented in MemStorage'); }
  async createMusicTrack(): Promise<MusicTrack> { throw new Error('Not implemented in MemStorage'); }
  async likeComment(): Promise<void> { throw new Error('Not implemented in MemStorage'); }
  async unlikeComment(): Promise<void> { throw new Error('Not implemented in MemStorage'); }
  async isSubscribed(): Promise<boolean> { throw new Error('Not implemented in MemStorage'); }
  async likeVideo(): Promise<void> { throw new Error('Not implemented in MemStorage'); }
  async unlikeVideo(): Promise<void> { throw new Error('Not implemented in MemStorage'); }
  async likeShorts(): Promise<void> { throw new Error('Not implemented in MemStorage'); }
  async unlikeShorts(): Promise<void> { throw new Error('Not implemented in MemStorage'); }
  async getUserVideoLike(): Promise<VideoLike | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getUserShortsLike(): Promise<ShortsLike | undefined> { throw new Error('Not implemented in MemStorage'); }
  async shareContent(): Promise<Share> { throw new Error('Not implemented in MemStorage'); }
  async getShareCount(): Promise<number> { throw new Error('Not implemented in MemStorage'); }
  async getUserProfile(): Promise<UserProfile | undefined> { throw new Error('Not implemented in MemStorage'); }
  async createUserProfile(): Promise<UserProfile> { throw new Error('Not implemented in MemStorage'); }
  async updateUserProfile(): Promise<UserProfile | undefined> { throw new Error('Not implemented in MemStorage'); }
  async searchAll(): Promise<{videos: VideoWithChannel[], shorts: ShortsWithChannel[], channels: Channel[]}> { throw new Error('Not implemented in MemStorage'); }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Channel methods
  async getChannel(id: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel || undefined;
  }

  async getChannelByHandle(handle: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.handle, handle));
    return channel || undefined;
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const [channel] = await db.insert(channels).values(insertChannel).returning();
    return channel;
  }

  async getAllChannels(): Promise<Channel[]> {
    return await db.select().from(channels).orderBy(desc(channels.subscriberCount));
  }

  async updateChannel(id: string, updates: Partial<InsertChannel>): Promise<Channel | undefined> {
    const [channel] = await db.update(channels).set(updates).where(eq(channels.id, id)).returning();
    return channel || undefined;
  }

  // Video methods
  async getVideo(id: string): Promise<VideoWithChannel | undefined> {
    const result = await db
      .select()
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(eq(videos.id, id));
    
    if (!result[0]) return undefined;
    return {
      ...result[0].videos,
      channel: result[0].channels
    };
  }

  async getAllVideos(): Promise<VideoWithChannel[]> {
    const result = await db
      .select()
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .orderBy(desc(videos.publishedAt));
    
    return result.map(row => ({
      ...row.videos,
      channel: row.channels
    }));
  }

  async getVideosByCategory(category: string): Promise<VideoWithChannel[]> {
    const result = await db
      .select()
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(eq(videos.category, category))
      .orderBy(desc(videos.publishedAt));
    
    return result.map(row => ({
      ...row.videos,
      channel: row.channels
    }));
  }

  async getVideosByChannel(channelId: string): Promise<VideoWithChannel[]> {
    const result = await db
      .select()
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(eq(videos.channelId, channelId))
      .orderBy(desc(videos.publishedAt));
    
    return result.map(row => ({
      ...row.videos,
      channel: row.channels
    }));
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(insertVideo).returning();
    return video;
  }

  async updateVideoViews(id: string): Promise<void> {
    const video = await this.getVideo(id);
    if (video) {
      await db.update(videos).set({ viewCount: (video.viewCount || 0) + 1 }).where(eq(videos.id, id));
    }
  }

  async searchVideos(query: string): Promise<VideoWithChannel[]> {
    const result = await db
      .select()
      .from(videos)
      .innerJoin(channels, eq(videos.channelId, channels.id))
      .where(or(
        ilike(videos.title, `%${query}%`),
        ilike(videos.description, `%${query}%`)
      ))
      .orderBy(desc(videos.viewCount));
    
    return result.map(row => ({
      ...row.videos,
      channel: row.channels
    }));
  }

  // Shorts methods
  async getShorts(id: string): Promise<ShortsWithChannel | undefined> {
    const result = await db
      .select()
      .from(shorts)
      .innerJoin(channels, eq(shorts.channelId, channels.id))
      .where(eq(shorts.id, id));
    
    if (!result[0]) return undefined;
    return {
      ...result[0].shorts,
      channel: result[0].channels
    };
  }

  async getAllShorts(): Promise<ShortsWithChannel[]> {
    const result = await db
      .select()
      .from(shorts)
      .innerJoin(channels, eq(shorts.channelId, channels.id))
      .orderBy(desc(shorts.publishedAt));
    
    return result.map(row => ({
      ...row.shorts,
      channel: row.channels
    }));
  }

  async getShortsByChannel(channelId: string): Promise<ShortsWithChannel[]> {
    const result = await db
      .select()
      .from(shorts)
      .innerJoin(channels, eq(shorts.channelId, channels.id))
      .where(eq(shorts.channelId, channelId))
      .orderBy(desc(shorts.publishedAt));
    
    return result.map(row => ({
      ...row.shorts,
      channel: row.channels
    }));
  }

  async createShorts(insertShorts: InsertShorts): Promise<Shorts> {
    const [shortsRecord] = await db.insert(shorts).values(insertShorts).returning();
    return shortsRecord;
  }

  async updateShortsViews(id: string): Promise<void> {
    const shortsItem = await this.getShorts(id);
    if (shortsItem) {
      await db.update(shorts).set({ viewCount: (shortsItem.viewCount || 0) + 1 }).where(eq(shorts.id, id));
    }
  }

  async searchShorts(query: string): Promise<ShortsWithChannel[]> {
    const result = await db
      .select()
      .from(shorts)
      .innerJoin(channels, eq(shorts.channelId, channels.id))
      .where(or(
        ilike(shorts.title, `%${query}%`),
        ilike(shorts.description, `%${query}%`)
      ))
      .orderBy(desc(shorts.viewCount));
    
    return result.map(row => ({
      ...row.shorts,
      channel: row.channels
    }));
  }

  // Playlist methods
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async getPlaylistsByChannel(channelId: string): Promise<Playlist[]> {
    return await db.select().from(playlists).where(eq(playlists.channelId, channelId));
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const [playlist] = await db.insert(playlists).values(insertPlaylist).returning();
    return playlist;
  }

  // Music Album methods
  async getMusicAlbum(id: string): Promise<MusicAlbum | undefined> {
    const [album] = await db.select().from(musicAlbums).where(eq(musicAlbums.id, id));
    return album || undefined;
  }

  async getAllMusicAlbums(): Promise<MusicAlbum[]> {
    return await db.select().from(musicAlbums).orderBy(desc(musicAlbums.createdAt));
  }

  async createMusicAlbum(insertAlbum: InsertMusicAlbum): Promise<MusicAlbum> {
    const [album] = await db.insert(musicAlbums).values(insertAlbum).returning();
    return album;
  }

  // Music Track methods
  async getMusicTrack(id: string): Promise<MusicTrack | undefined> {
    const [track] = await db.select().from(musicTracks).where(eq(musicTracks.id, id));
    return track || undefined;
  }

  async getTracksByAlbum(albumId: string): Promise<MusicTrack[]> {
    return await db.select().from(musicTracks)
      .where(eq(musicTracks.albumId, albumId))
      .orderBy(musicTracks.trackNumber);
  }

  async createMusicTrack(insertTrack: InsertMusicTrack): Promise<MusicTrack> {
    const [track] = await db.insert(musicTracks).values(insertTrack).returning();
    return track;
  }

  // Comment methods
  async getComment(id: string): Promise<CommentWithChannel | undefined> {
    const result = await db
      .select()
      .from(comments)
      .innerJoin(channels, eq(comments.channelId, channels.id))
      .where(eq(comments.id, id));
    
    if (!result[0]) return undefined;
    return {
      ...result[0].comments,
      channel: result[0].channels
    };
  }

  async getCommentsByVideo(videoId: string): Promise<CommentWithChannel[]> {
    const result = await db
      .select()
      .from(comments)
      .innerJoin(channels, eq(comments.channelId, channels.id))
      .where(and(eq(comments.videoId, videoId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt));
    
    return result.map(row => ({
      ...row.comments,
      channel: row.channels
    }));
  }

  async getCommentsByShorts(shortsId: string): Promise<CommentWithChannel[]> {
    const result = await db
      .select()
      .from(comments)
      .innerJoin(channels, eq(comments.channelId, channels.id))
      .where(and(eq(comments.shortsId, shortsId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt));
    
    return result.map(row => ({
      ...row.comments,
      channel: row.channels
    }));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async likeComment(commentId: string, channelId: string): Promise<void> {
    await db.insert(commentLikes).values({ commentId, channelId }).onConflictDoNothing();
  }

  async unlikeComment(commentId: string, channelId: string): Promise<void> {
    await db.delete(commentLikes)
      .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.channelId, channelId)));
  }

  // Subscription methods
  async getSubscription(subscriberChannelId: string, subscribedToChannelId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.subscriberChannelId, subscriberChannelId),
        eq(subscriptions.subscribedToChannelId, subscribedToChannelId)
      ));
    return subscription || undefined;
  }

  async getSubscriptionsByChannel(channelId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions)
      .where(eq(subscriptions.subscriberChannelId, channelId));
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(insertSubscription).returning();
    
    // Update subscriber count
    const channel = await this.getChannel(insertSubscription.subscribedToChannelId);
    if (channel) {
      await db.update(channels)
        .set({ subscriberCount: (channel.subscriberCount || 0) + 1 })
        .where(eq(channels.id, insertSubscription.subscribedToChannelId));
    }
    
    return subscription;
  }

  async deleteSubscription(subscriberChannelId: string, subscribedToChannelId: string): Promise<void> {
    await db.delete(subscriptions)
      .where(and(
        eq(subscriptions.subscriberChannelId, subscriberChannelId),
        eq(subscriptions.subscribedToChannelId, subscribedToChannelId)
      ));
    
    // Update subscriber count
    const channel = await this.getChannel(subscribedToChannelId);
    if (channel) {
      await db.update(channels)
        .set({ subscriberCount: Math.max(0, (channel.subscriberCount || 0) - 1) })
        .where(eq(channels.id, subscribedToChannelId));
    }
  }

  async isSubscribed(subscriberChannelId: string, subscribedToChannelId: string): Promise<boolean> {
    const subscription = await this.getSubscription(subscriberChannelId, subscribedToChannelId);
    return !!subscription;
  }

  // Like methods
  async likeVideo(videoId: string, channelId: string, isLike: boolean): Promise<void> {
    await db.insert(videoLikes)
      .values({ videoId, channelId, isLike })
      .onConflictDoUpdate({
        target: [videoLikes.videoId, videoLikes.channelId],
        set: { isLike }
      });
  }

  async unlikeVideo(videoId: string, channelId: string): Promise<void> {
    await db.delete(videoLikes)
      .where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.channelId, channelId)));
  }

  async likeShorts(shortsId: string, channelId: string, isLike: boolean): Promise<void> {
    await db.insert(shortsLikes)
      .values({ shortsId, channelId, isLike })
      .onConflictDoUpdate({
        target: [shortsLikes.shortsId, shortsLikes.channelId],
        set: { isLike }
      });
  }

  async unlikeShorts(shortsId: string, channelId: string): Promise<void> {
    await db.delete(shortsLikes)
      .where(and(eq(shortsLikes.shortsId, shortsId), eq(shortsLikes.channelId, channelId)));
  }

  async getUserVideoLike(videoId: string, channelId: string): Promise<VideoLike | undefined> {
    const [like] = await db.select().from(videoLikes)
      .where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.channelId, channelId)));
    return like || undefined;
  }

  async getUserShortsLike(shortsId: string, channelId: string): Promise<ShortsLike | undefined> {
    const [like] = await db.select().from(shortsLikes)
      .where(and(eq(shortsLikes.shortsId, shortsId), eq(shortsLikes.channelId, channelId)));
    return like || undefined;
  }

  // Share methods
  async shareContent(insertShare: InsertShare): Promise<Share> {
    const [share] = await db.insert(shares).values(insertShare).returning();
    return share;
  }

  async getShareCount(videoId?: string, shortsId?: string): Promise<number> {
    const conditions = [];
    if (videoId) conditions.push(eq(shares.videoId, videoId));
    if (shortsId) conditions.push(eq(shares.shortsId, shortsId));
    
    const result = await db.select().from(shares)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return result.length;
  }

  // User Profile methods
  async getUserProfile(channelId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles)
      .where(eq(userProfiles.channelId, channelId));
    return profile || undefined;
  }

  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const [profile] = await db.insert(userProfiles).values(insertProfile).returning();
    return profile;
  }

  async updateUserProfile(channelId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [profile] = await db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.channelId, channelId))
      .returning();
    return profile || undefined;
  }

  // Search methods
  async searchAll(query: string): Promise<{videos: VideoWithChannel[], shorts: ShortsWithChannel[], channels: Channel[]}> {
    const [videosResult, shortsResult, channelsResult] = await Promise.all([
      this.searchVideos(query),
      this.searchShorts(query),
      db.select().from(channels)
        .where(or(
          ilike(channels.name, `%${query}%`),
          ilike(channels.description, `%${query}%`),
          ilike(channels.handle, `%${query}%`)
        ))
        .orderBy(desc(channels.subscriberCount))
    ]);

    return {
      videos: videosResult,
      shorts: shortsResult,
      channels: channelsResult
    };
  }

  // Token methods
  async getToken(id: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.id, id));
    return token || undefined;
  }

  async getTokenByAddress(address: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.memeTokenAddress, address));
    return token || undefined;
  }

  async getAllTokens(): Promise<Token[]> {
    return await db.select().from(tokens).orderBy(desc(tokens.createdAt));
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const [token] = await db.insert(tokens).values(insertToken).returning();
    return token;
  }

  // Web3 Channel methods
  async getWeb3Channel(id: string): Promise<Web3Channel | undefined> {
    const [channel] = await db.select().from(web3Channels).where(eq(web3Channels.id, id));
    return channel || undefined;
  }

  async getWeb3ChannelByOwner(owner: string): Promise<Web3Channel | undefined> {
    const [channel] = await db.select().from(web3Channels).where(eq(web3Channels.owner, owner.toLowerCase()));
    return channel || undefined;
  }

  async getWeb3ChannelByCoinAddress(coinAddress: string): Promise<Web3Channel | undefined> {
    const [channel] = await db.select().from(web3Channels).where(eq(web3Channels.coinAddress, coinAddress.toLowerCase()));
    return channel || undefined;
  }

  async createWeb3Channel(insertWeb3Channel: InsertWeb3Channel): Promise<Web3Channel> {
    // Generate slug from name
    const slug = insertWeb3Channel.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    const channelData = {
      ...insertWeb3Channel,
      slug,
      owner: insertWeb3Channel.owner.toLowerCase(), // normalize address
      coinAddress: insertWeb3Channel.coinAddress.toLowerCase(),
    };

    const [channel] = await db.insert(web3Channels).values(channelData).returning();
    return channel;
  }

  async getAllWeb3Channels(): Promise<Web3Channel[]> {
    return await db.select().from(web3Channels).orderBy(desc(web3Channels.createdAt));
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

  async createContentImport(insertContent: InsertContentImport): Promise<ContentImport> {
    const [content] = await db.insert(contentImports).values(insertContent).returning();
    return content;
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
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();

// Keep MemStorage for reference but don't export as default
// export { MemStorage };
