import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  description: text("description"),
  avatarUrl: text("avatar_url").notNull(),
  bannerUrl: text("banner_url"),
  subscriberCount: integer("subscriber_count").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url").notNull(),
  videoUrl: text("video_url").notNull(),
  duration: integer("duration"), // in seconds
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  dislikeCount: integer("dislike_count").default(0),
  commentCount: integer("comment_count").default(0),
  channelId: varchar("channel_id").references(() => channels.id).notNull(),
  category: text("category"),
  tags: text("tags").array(),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shorts = pgTable("shorts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url").notNull(),
  videoUrl: text("video_url").notNull(),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  dislikeCount: integer("dislike_count").default(0),
  commentCount: integer("comment_count").default(0),
  channelId: varchar("channel_id").references(() => channels.id).notNull(),
  hashtags: text("hashtags").array(),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  channelId: varchar("channel_id").references(() => channels.id).notNull(),
  videoCount: integer("video_count").default(0),
  privacy: text("privacy").default("public"), // public, unlisted, private
  createdAt: timestamp("created_at").defaultNow(),
});

export const musicAlbums = pgTable("music_albums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  coverUrl: text("cover_url").notNull(),
  genre: text("genre"),
  releaseYear: integer("release_year"),
  trackCount: integer("track_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  videoId: varchar("video_id"),
  shortsId: varchar("shorts_id"),
  channelId: varchar("channel_id").notNull(),
  likeCount: integer("like_count").default(0),
  replyCount: integer("reply_count").default(0),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberChannelId: varchar("subscriber_channel_id").references(() => channels.id).notNull(),
  subscribedToChannelId: varchar("subscribed_to_channel_id").references(() => channels.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoLikes = pgTable("video_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").references(() => videos.id).notNull(),
  channelId: varchar("channel_id").references(() => channels.id).notNull(),
  isLike: boolean("is_like").notNull(), // true for like, false for dislike
  createdAt: timestamp("created_at").defaultNow(),
});

export const shortsLikes = pgTable("shorts_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortsId: varchar("shorts_id").references(() => shorts.id).notNull(),
  channelId: varchar("channel_id").references(() => channels.id).notNull(),
  isLike: boolean("is_like").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commentLikes = pgTable("comment_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").references(() => comments.id).notNull(),
  channelId: varchar("channel_id").references(() => channels.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shares = pgTable("shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").references(() => videos.id),
  shortsId: varchar("shorts_id").references(() => shorts.id),
  channelId: varchar("channel_id").references(() => channels.id).notNull(),
  shareType: text("share_type").notNull(), // 'link', 'embed', 'social'
  platform: text("platform"), // 'twitter', 'facebook', 'email', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const musicTracks = pgTable("music_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  albumId: varchar("album_id").references(() => musicAlbums.id),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration"), // in seconds
  trackNumber: integer("track_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => channels.id).notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  bio: text("bio"),
  website: text("website"),
  location: text("location"),
  preferences: jsonb("preferences"), // theme, language, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentImports = pgTable("content_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => channels.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  contentType: text("content_type").notNull(), // 'reel', 'podcast', 'image', 'post', 'event'
  originalUrl: text("original_url"), // YouTube, TikTok, Spotify URL if imported
  ipfsCid: text("ipfs_cid"), // Main content CID
  mediaCid: text("media_cid"), // Media file CID
  thumbnailCid: text("thumbnail_cid"), // Thumbnail CID
  metadata: jsonb("metadata"), // Additional metadata
  status: text("status").notNull().default("tokenizing"), // 'tokenizing', 'tokenized', 'failed'
  
  // Content Coin Information
  coinName: text("coin_name").notNull(), // e.g., "Epic Cooking Tutorial"
  coinSymbol: text("coin_symbol").notNull(), // e.g., "COOK"
  coinAddress: text("coin_address"), // Contract address after deployment
  bondingCurveProgress: text("bonding_curve_progress").default("0"), // Progress percentage
  currentPrice: text("current_price").default("0.000001"), // Current price per token
  marketCap: text("market_cap").default("0"), // Market cap in USD
  holders: integer("holders").default(0), // Number of holders
  tokenizedAt: timestamp("tokenized_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export const insertShortsSchema = createInsertSchema(shorts).omit({
  id: true,
  createdAt: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
});

export const insertMusicAlbumSchema = createInsertSchema(musicAlbums).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertVideoLikeSchema = createInsertSchema(videoLikes).omit({
  id: true,
  createdAt: true,
});

export const insertShortsLikeSchema = createInsertSchema(shortsLikes).omit({
  id: true,
  createdAt: true,
});

export const insertCommentLikeSchema = createInsertSchema(commentLikes).omit({
  id: true,
  createdAt: true,
});

export const insertShareSchema = createInsertSchema(shares).omit({
  id: true,
  createdAt: true,
});

export const insertMusicTrackSchema = createInsertSchema(musicTracks).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentImportSchema = createInsertSchema(contentImports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tokenizedAt: true,
  coinAddress: true, // Will be set after deployment
  bondingCurveProgress: true, // Auto-calculated
  currentPrice: true, // Auto-calculated
  marketCap: true, // Auto-calculated
  holders: true, // Auto-calculated
});

// Types
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Shorts = typeof shorts.$inferSelect;
export type InsertShorts = z.infer<typeof insertShortsSchema>;

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;

export type MusicAlbum = typeof musicAlbums.$inferSelect;
export type InsertMusicAlbum = z.infer<typeof insertMusicAlbumSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type VideoLike = typeof videoLikes.$inferSelect;
export type InsertVideoLike = z.infer<typeof insertVideoLikeSchema>;

export type ShortsLike = typeof shortsLikes.$inferSelect;
export type InsertShortsLike = z.infer<typeof insertShortsLikeSchema>;

export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;

export type Share = typeof shares.$inferSelect;
export type InsertShare = z.infer<typeof insertShareSchema>;

export type MusicTrack = typeof musicTracks.$inferSelect;
export type InsertMusicTrack = z.infer<typeof insertMusicTrackSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type ContentImport = typeof contentImports.$inferSelect;
export type InsertContentImport = z.infer<typeof insertContentImportSchema>;

// Extended types with relations
export type VideoWithChannel = Video & {
  channel: Channel;
};

export type ShortsWithChannel = Shorts & {
  channel: Channel;
};

export type CommentWithChannel = Comment & {
  channel: Channel;
  replies?: CommentWithChannel[];
};

// Token tables for Web3 functionality
export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  bio: text("bio"),
  imageUri: text("image_uri"),
  memeTokenAddress: text("meme_token_address").notNull().unique(),
  createdBy: text("created_by").notNull(), // wallet address
  twitter: text("twitter"),
  discord: text("discord"), 
  isUSDCToken0: boolean("is_usdc_token0").default(false),
  marketCap: text("market_cap"),
  price: text("price"),
  volume24h: text("volume_24h"),
  holders: integer("holders").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokenSales = pgTable("token_sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").references(() => tokens.id).notNull(),
  userAddress: text("user_address").notNull(),
  amount: text("amount").notNull(),
  price: text("price").notNull(),
  saleType: text("sale_type").notNull(), // 'buy' or 'sell'
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Web3 Channels (Channel Coins)
export const web3Channels = pgTable("web3_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  owner: text("owner").notNull(), // wallet address (checksum normalized)
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ticker: text("ticker").notNull().unique(),
  coinAddress: text("coin_address").notNull().unique(),
  chainId: integer("chain_id").notNull(),
  avatarCid: text("avatar_cid"),
  coverCid: text("cover_cid"),
  category: text("category").notNull(), // 'Reels' | 'Podcasts' | 'Events' | 'Art' | 'Music'
  status: text("status").notNull().default("active"),
  txHash: text("tx_hash"), // transaction hash from coin deployment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Token types
export type Token = typeof tokens.$inferSelect;
export type InsertToken = typeof tokens.$inferInsert;

export type TokenSale = typeof tokenSales.$inferSelect;
export type InsertTokenSale = typeof tokenSales.$inferInsert;

export type Web3Channel = typeof web3Channels.$inferSelect;
export type InsertWeb3Channel = typeof web3Channels.$inferInsert;

// Insert schemas for tokens
export const insertTokenSchema = createInsertSchema(tokens);
export const insertTokenSaleSchema = createInsertSchema(tokenSales);
export const insertWeb3ChannelSchema = createInsertSchema(web3Channels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  slug: true, // auto-generated
});
