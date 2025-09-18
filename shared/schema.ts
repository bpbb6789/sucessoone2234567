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
  category: text("category"),
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

export const musicTracks = pgTable("music_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  albumId: varchar("album_id").references(() => musicAlbums.id),
  duration: integer("duration").notNull(), // in seconds
  trackNumber: integer("track_number"),
  audioUrl: text("audio_url").notNull(),
  coverUrl: text("cover_url").notNull(),
  genre: text("genre"),
  playCount: integer("play_count").default(0),
  likeCount: integer("like_count").default(0),
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

// Pads - pump.fun style meme tokens
export const pads = pgTable("pads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorAddress: text("creator_address").notNull(), // Wallet address of creator
  title: text("title").notNull(),
  description: text("description"),
  mediaType: text("media_type").notNull(), // 'image', 'gif', 'animation', 'audio', 'svg'
  mediaCid: text("media_cid").notNull(), // IPFS CID of the media file
  thumbnailCid: text("thumbnail_cid"), // Thumbnail for videos/animations
  
  // Token Information
  tokenName: text("token_name").notNull(), // e.g., "Pepe Moon"
  tokenSymbol: text("token_symbol").notNull(), // e.g., "PMOON"
  tokenAddress: text("token_address"), // Contract address after deployment
  
  // Trading & Metrics
  currentPrice: text("current_price").default("0.000001"), // Current price per token
  marketCap: text("market_cap").default("0"), // Market cap in USD
  bondingCurveProgress: text("bonding_curve_progress").default("0"), // Progress percentage (0-100)
  totalSupply: text("total_supply").default("1000000000"), // Total token supply
  holders: integer("holders").default(0), // Number of unique holders
  volume24h: text("volume_24h").default("0"), // 24h trading volume
  
  // Social & Engagement
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  
  // Status & Deployment
  status: text("status").notNull().default("pending"), // 'pending', 'deploying', 'deployed', 'graduated', 'failed'
  deploymentTxHash: text("deployment_tx_hash"), // Transaction hash of token deployment
  graduationTxHash: text("graduation_tx_hash"), // If graduated to full DEX
  
  // Metadata
  metadata: jsonb("metadata"), // Additional data (colors, themes, etc.)
  tags: text("tags").array(), // Searchable tags
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pad interactions (likes, comments, etc.)
export const padLikes = pgTable("pad_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  padId: varchar("pad_id").references(() => pads.id).notNull(),
  userAddress: text("user_address").notNull(), // Wallet address of user who liked
  createdAt: timestamp("created_at").defaultNow(),
});

export const padComments = pgTable("pad_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  padId: varchar("pad_id").references(() => pads.id).notNull(),
  userAddress: text("user_address").notNull(), // Wallet address of commenter
  content: text("content").notNull(),
  parentId: varchar("parent_id"), // For threaded comments
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertPadSchema = createInsertSchema(pads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tokenAddress: true, // Will be set after deployment
  currentPrice: true, // Auto-calculated
  marketCap: true, // Auto-calculated
  bondingCurveProgress: true, // Auto-calculated
  holders: true, // Auto-calculated
  volume24h: true, // Auto-calculated
  likes: true, // Auto-calculated
  comments: true, // Auto-calculated
  shares: true, // Auto-calculated
  deploymentTxHash: true, // Set during deployment
  graduationTxHash: true, // Set during graduation
});

export const insertPadLikeSchema = createInsertSchema(padLikes).omit({
  id: true,
  createdAt: true,
});

export const insertPadCommentSchema = createInsertSchema(padComments).omit({
  id: true,
  createdAt: true,
  likes: true, // Auto-calculated
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

export type Pad = typeof pads.$inferSelect;
export type InsertPad = z.infer<typeof insertPadSchema>;

export type PadLike = typeof padLikes.$inferSelect;
export type InsertPadLike = z.infer<typeof insertPadLikeSchema>;

export type PadComment = typeof padComments.$inferSelect;
export type InsertPadComment = z.infer<typeof insertPadCommentSchema>;

// Creator Coins with Zora SDK - Content tokenization
export const creatorCoins = pgTable("creator_coins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorAddress: text("creator_address").notNull(), // Wallet address of creator
  title: text("title").notNull(),
  description: text("description"),
  
  // Content Information
  contentType: text("content_type").notNull(), // 'image', 'video', 'audio', 'gif', 'document'
  mediaCid: text("media_cid").notNull(), // IPFS CID of the main content
  thumbnailCid: text("thumbnail_cid"), // Thumbnail CID for videos/large files
  metadataUri: text("metadata_uri"), // Zora metadata URI
  metadata: text("metadata"), // Additional metadata as JSON string
  
  // Coin Information
  coinName: text("coin_name").notNull(),
  coinSymbol: text("coin_symbol").notNull(),
  coinAddress: text("coin_address"), // Zora coin contract address
  
  // Zora Specific
  zoraFactoryAddress: text("zora_factory_address"), // Zora factory used
  zoraPlatform: text("zora_platform").notNull().default("zora"), // 'zora'
  uniswapV4Pool: text("uniswap_v4_pool"), // Associated Uniswap V4 pool
  hookAddress: text("hook_address"), // Hook contract address
  
  // Bonding Curve Integration
  bondingCurveFactoryAddress: text("bonding_curve_factory_address"), // BondingCurveFactory address
  bondingCurveExchangeAddress: text("bonding_curve_exchange_address"), // Individual BondingCurveExchange address
  bondingCurveDeploymentTxHash: text("bonding_curve_deployment_tx_hash"), // TX hash of bonding curve deployment
  hasBondingCurve: boolean("has_bonding_curve").default(false), // Whether bonding curve is deployed
  
  // Trading & Economics
  currency: text("currency").notNull().default("ETH"), // 'ETH', 'ZORA', etc.
  startingMarketCap: text("starting_market_cap").notNull().default("LOW"), // 'LOW', 'HIGH'
  currentPrice: text("current_price").default("0.000001"),
  marketCap: text("market_cap").default("0"),
  bondingCurveProgress: text("bonding_curve_progress").default("0"),
  totalSupply: text("total_supply").default("1000000000"),
  holders: integer("holders").default(0),
  volume24h: text("volume_24h").default("0"),
  
  // Social Links
  twitter: text("twitter"),
  discord: text("discord"),
  website: text("website"),
  
  // Status & Metadata
  status: text("status").notNull().default("pending"), // 'pending', 'creating', 'deployed', 'failed'
  deploymentTxHash: text("deployment_tx_hash"),
  metadata: jsonb("metadata"), // Additional Zora-specific metadata
  tags: text("tags").array(),
  
  // Engagement
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Creator Coin interactions
export const creatorCoinLikes = pgTable("creator_coin_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coinId: varchar("coin_id").references(() => creatorCoins.id).notNull(),
  userAddress: text("user_address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creatorCoinComments = pgTable("creator_coin_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coinId: varchar("coin_id").references(() => creatorCoins.id).notNull(),
  userAddress: text("user_address").notNull(),
  content: text("content").notNull(),
  parentId: varchar("parent_id"), // For threaded comments
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator coin trades
export const creatorCoinTrades = pgTable("creator_coin_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coinId: varchar("coin_id").references(() => creatorCoins.id).notNull(),
  userAddress: text("user_address").notNull(),
  tradeType: text("trade_type").notNull(), // 'buy', 'sell'
  amount: text("amount").notNull(),
  price: text("price").notNull(),
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

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

// Web3 Channels (Channel Coins) - Now Zora-based
export const web3Channels = pgTable("web3_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  owner: text("owner").notNull(), // wallet address (checksum normalized)
  createdBy: text("created_by").notNull(), // creator wallet address
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ticker: text("ticker").notNull().unique(),
  coinAddress: text("coin_address").notNull().unique(),
  chainId: integer("chain_id").notNull(),
  avatarCid: text("avatar_cid"),
  coverCid: text("cover_cid"),
  category: text("category").notNull(), // 'Reels' | 'Podcasts' | 'Events' | 'Art' | 'Music'
  description: text("description"),
  
  // Zora-specific fields
  zoraPlatform: text("zora_platform").notNull().default("zora"), // Always 'zora' for new channels
  zoraFactoryAddress: text("zora_factory_address"), // Zora factory used
  metadataUri: text("metadata_uri"), // IPFS metadata URI
  currency: text("currency").notNull().default("ETH"), // 'ETH', 'ZORA'
  
  // Status & Trading
  status: text("status").notNull().default("active"),
  currentPrice: text("current_price").default("0.000001"),
  marketCap: text("market_cap").default("0"),
  holders: integer("holders").default(0),
  volume24h: text("volume_24h").default("0"),
  
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
  currentPrice: true, // auto-calculated
  marketCap: true, // auto-calculated  
  holders: true, // auto-calculated
  volume24h: true, // auto-calculated
});

// Creator Coins insert schemas
export const insertCreatorCoinSchema = createInsertSchema(creatorCoins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  coinAddress: true, // Set after deployment
  // metadataUri is now included since we create it during upload
  currentPrice: true, // Auto-calculated
  marketCap: true, // Auto-calculated
  bondingCurveProgress: true, // Auto-calculated
  holders: true, // Auto-calculated
  volume24h: true, // Auto-calculated
  likes: true, // Auto-calculated
  comments: true, // Auto-calculated
  shares: true, // Auto-calculated
  deploymentTxHash: true, // Set during deployment
  // Bonding Curve fields set during deployment
  bondingCurveFactoryAddress: true, // Set during bonding curve deployment
  bondingCurveExchangeAddress: true, // Set during bonding curve deployment
  bondingCurveDeploymentTxHash: true, // Set during bonding curve deployment
  hasBondingCurve: true, // Set during bonding curve deployment
});

// Notifications system for all platform activities
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientAddress: text("recipient_address").notNull(), // Wallet address who receives the notification
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'subscription', 'trade', 'like', 'comment', 'token_launch', 'follow', 'content_coin'
  entityType: text("entity_type"), // 'channel', 'token', 'content_coin', 'pad', 'comment'
  entityId: text("entity_id"), // ID of the related entity
  actorAddress: text("actor_address"), // Wallet address who triggered the notification
  actorName: text("actor_name"), // Display name of the actor
  actorAvatar: text("actor_avatar"), // Avatar URL of the actor
  metadata: jsonb("metadata"), // Additional data (token price, amounts, etc.)
  read: boolean("read").default(false),
  actionUrl: text("action_url"), // URL to navigate when notification is clicked
  createdAt: timestamp("created_at").defaultNow(),
});

// Channel Analytics - Track subscriber counts and metrics
export const channelAnalytics = pgTable("channel_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => channels.id),
  web3ChannelId: varchar("web3_channel_id").references(() => web3Channels.id),
  subscriberCount: integer("subscriber_count").default(0),
  totalViews: integer("total_views").default(0),
  totalLikes: integer("total_likes").default(0),
  totalComments: integer("total_comments").default(0),
  totalShares: integer("total_shares").default(0),
  engagementRate: text("engagement_rate").default("0"), // Calculated percentage
  averageViewDuration: integer("average_view_duration").default(0), // in seconds
  topContentType: text("top_content_type"), // 'video', 'shorts', 'content_coin'
  revenueGenerated: text("revenue_generated").default("0"), // in ETH/USD
  date: timestamp("date").defaultNow(), // Daily snapshots
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced subscriptions with notification preferences
export const enhancedSubscriptions = pgTable("enhanced_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberAddress: text("subscriber_address").notNull(), // Wallet address of subscriber
  channelId: varchar("channel_id").references(() => channels.id),
  web3ChannelId: varchar("web3_channel_id").references(() => web3Channels.id),
  notifyOnNewContent: boolean("notify_on_new_content").default(true),
  notifyOnLiveStreams: boolean("notify_on_live_streams").default(true),
  notifyOnTokenUpdates: boolean("notify_on_token_updates").default(false),
  notifyOnMajorAnnouncements: boolean("notify_on_major_announcements").default(true),
  subscriptionTier: text("subscription_tier").default("free"), // 'free', 'premium', 'vip'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Channel Comments Integration
export const channelComments = pgTable("channel_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").references(() => channels.id),
  web3ChannelId: varchar("web3_channel_id").references(() => web3Channels.id),
  authorAddress: text("author_address").notNull(),
  authorName: text("author_name"),
  authorAvatar: text("author_avatar"),
  content: text("content").notNull(),
  parentId: varchar("parent_id"), // For threaded replies
  likes: integer("likes").default(0),
  replyCount: integer("reply_count").default(0),
  isPinned: boolean("is_pinned").default(false),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallet-based user profiles for creators
export const walletProfiles = pgTable("wallet_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(), // Wallet address as the primary identifier
  name: text("name"), // Display name
  description: text("description"), // Bio/description
  avatarUrl: text("avatar_url"), // Profile picture URL
  coverUrl: text("cover_url"), // Cover/banner image URL
  website: text("website"), // Personal website
  twitter: text("twitter"), // Twitter handle
  discord: text("discord"), // Discord handle
  preferences: jsonb("preferences"), // User preferences (theme, notifications, etc.)
  isVerified: boolean("is_verified").default(false), // Verification status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Search filters and preferences
export const searchFilters = pgTable("search_filters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userAddress: text("user_address").notNull(),
  searchQuery: text("search_query").notNull(),
  filterType: text("filter_type").notNull(), // 'channel', 'token', 'content', 'user'
  categoryFilter: text("category_filter"), // 'Reels', 'Podcasts', etc.
  priceRangeMin: text("price_range_min"),
  priceRangeMax: text("price_range_max"),
  marketCapMin: text("market_cap_min"),
  marketCapMax: text("market_cap_max"),
  sortBy: text("sort_by").default("relevance"), // 'relevance', 'newest', 'price', 'market_cap'
  resultsFound: integer("results_found").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCreatorCoinLikeSchema = createInsertSchema(creatorCoinLikes).omit({
  id: true,
  createdAt: true,
});

export const insertCreatorCoinCommentSchema = createInsertSchema(creatorCoinComments).omit({
  id: true,
  createdAt: true,
  likes: true, // Auto-calculated
});

export const insertCreatorCoinTradeSchema = createInsertSchema(creatorCoinTrades).omit({
  id: true,
  createdAt: true,
});

// Creator Coins types
export type CreatorCoin = typeof creatorCoins.$inferSelect;
export type InsertCreatorCoin = z.infer<typeof insertCreatorCoinSchema>;

export type CreatorCoinLike = typeof creatorCoinLikes.$inferSelect;
export type InsertCreatorCoinLike = z.infer<typeof insertCreatorCoinLikeSchema>;

export type CreatorCoinComment = typeof creatorCoinComments.$inferSelect;
export type InsertCreatorCoinComment = z.infer<typeof insertCreatorCoinCommentSchema>;

export type CreatorCoinTrade = typeof creatorCoinTrades.$inferSelect;
export type InsertCreatorCoinTrade = z.infer<typeof insertCreatorCoinTradeSchema>;

// Notification system types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type ChannelAnalytics = typeof channelAnalytics.$inferSelect;
export type InsertChannelAnalytics = typeof channelAnalytics.$inferInsert;

export type EnhancedSubscription = typeof enhancedSubscriptions.$inferSelect;
export type InsertEnhancedSubscription = typeof enhancedSubscriptions.$inferInsert;

export type ChannelComment = typeof channelComments.$inferSelect;
export type InsertChannelComment = typeof channelComments.$inferInsert;

export type SearchFilter = typeof searchFilters.$inferSelect;
export type InsertSearchFilter = typeof searchFilters.$inferInsert;

// Insert schemas for new tables
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertChannelAnalyticsSchema = createInsertSchema(channelAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertEnhancedSubscriptionSchema = createInsertSchema(enhancedSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChannelCommentSchema = createInsertSchema(channelComments).omit({
  id: true,
  createdAt: true,
  likes: true, // Auto-calculated
  replyCount: true, // Auto-calculated
  editedAt: true, // Set when edited
});

export const insertWalletProfileSchema = createInsertSchema(walletProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSearchFilterSchema = createInsertSchema(searchFilters).omit({
  id: true,
  createdAt: true,
  resultsFound: true, // Auto-calculated
});

// Wallet profiles types
export type WalletProfile = typeof walletProfiles.$inferSelect;
export type InsertWalletProfile = z.infer<typeof insertWalletProfileSchema>;
