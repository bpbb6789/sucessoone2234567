import { type Channel, type InsertChannel, type Video, type InsertVideo, type Shorts, type InsertShorts, type Playlist, type InsertPlaylist, type MusicAlbum, type InsertMusicAlbum, type Comment, type InsertComment, type Subscription, type InsertSubscription, type VideoWithChannel, type ShortsWithChannel, type CommentWithChannel } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Channels
  getChannel(id: string): Promise<Channel | undefined>;
  getChannelByHandle(handle: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  getAllChannels(): Promise<Channel[]>;

  // Videos
  getVideo(id: string): Promise<VideoWithChannel | undefined>;
  getAllVideos(): Promise<VideoWithChannel[]>;
  getVideosByCategory(category: string): Promise<VideoWithChannel[]>;
  getVideosByChannel(channelId: string): Promise<VideoWithChannel[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideoViews(id: string): Promise<void>;

  // Shorts
  getShorts(id: string): Promise<ShortsWithChannel | undefined>;
  getAllShorts(): Promise<ShortsWithChannel[]>;
  getShortsByChannel(channelId: string): Promise<ShortsWithChannel[]>;
  createShorts(shorts: InsertShorts): Promise<Shorts>;
  updateShortsViews(id: string): Promise<void>;

  // Playlists
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistsByChannel(channelId: string): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;

  // Music Albums
  getMusicAlbum(id: string): Promise<MusicAlbum | undefined>;
  getAllMusicAlbums(): Promise<MusicAlbum[]>;
  createMusicAlbum(album: InsertMusicAlbum): Promise<MusicAlbum>;

  // Comments
  getComment(id: string): Promise<CommentWithChannel | undefined>;
  getCommentsByVideo(videoId: string): Promise<CommentWithChannel[]>;
  getCommentsByShorts(shortsId: string): Promise<CommentWithChannel[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Subscriptions
  getSubscription(subscriberChannelId: string, subscribedToChannelId: string): Promise<Subscription | undefined>;
  getSubscriptionsByChannel(channelId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  deleteSubscription(subscriberChannelId: string, subscribedToChannelId: string): Promise<void>;
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
}

export const storage = new MemStorage();
