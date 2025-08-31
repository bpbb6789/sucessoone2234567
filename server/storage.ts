
import { db } from "./db";
import { eq, desc, sql, like, and, or } from "drizzle-orm";
import {
  channels, videos, shorts, playlists, musicAlbums, comments, subscriptions,
  videoLikes, shortsLikes, shares, musicTracks, userProfiles, tokens,
  contentImports, web3Channels, pads, padLikes, padComments, creatorCoins,
  notifications, enhancedSubscriptions, channelAnalytics, channelComments,
  searchFilters, walletProfiles
} from "@shared/schema";

// Channels
export const getAllChannels = async () => {
  return await db.select().from(channels).orderBy(desc(channels.createdAt));
};

export const getChannel = async (id: string) => {
  const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return result[0] || null;
};

export const createChannel = async (data: any) => {
  const [channel] = await db.insert(channels).values(data).returning();
  return channel;
};

export const updateChannel = async (id: string, data: any) => {
  const [channel] = await db.update(channels).set(data).where(eq(channels.id, id)).returning();
  return channel;
};

// Videos
export const getAllVideos = async () => {
  return await db.select().from(videos).orderBy(desc(videos.createdAt));
};

export const getVideo = async (id: string) => {
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0] || null;
};

export const getVideosByCategory = async (category: string) => {
  return await db.select().from(videos).where(eq(videos.category, category)).orderBy(desc(videos.createdAt));
};

export const getVideosByChannel = async (channelId: string) => {
  return await db.select().from(videos).where(eq(videos.channelId, channelId)).orderBy(desc(videos.createdAt));
};

export const createVideo = async (data: any) => {
  const [video] = await db.insert(videos).values(data).returning();
  return video;
};

export const updateVideoViews = async (id: string) => {
  await db.update(videos).set({ views: sql`${videos.views} + 1` }).where(eq(videos.id, id));
};

// Shorts
export const getAllShorts = async () => {
  return await db.select().from(shorts).orderBy(desc(shorts.createdAt));
};

export const getShorts = async (id: string) => {
  const result = await db.select().from(shorts).where(eq(shorts.id, id)).limit(1);
  return result[0] || null;
};

export const getShortsByChannel = async (channelId: string) => {
  return await db.select().from(shorts).where(eq(shorts.channelId, channelId)).orderBy(desc(shorts.createdAt));
};

export const createShorts = async (data: any) => {
  const [short] = await db.insert(shorts).values(data).returning();
  return short;
};

export const updateShortsViews = async (id: string) => {
  await db.update(shorts).set({ views: sql`${shorts.views} + 1` }).where(eq(shorts.id, id));
};

// Playlists
export const getPlaylistsByChannel = async (channelId: string) => {
  return await db.select().from(playlists).where(eq(playlists.channelId, channelId)).orderBy(desc(playlists.createdAt));
};

export const getPlaylist = async (id: string) => {
  const result = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
  return result[0] || null;
};

export const createPlaylist = async (data: any) => {
  const [playlist] = await db.insert(playlists).values(data).returning();
  return playlist;
};

// Music Albums
export const getAllMusicAlbums = async () => {
  return await db.select().from(musicAlbums).orderBy(desc(musicAlbums.createdAt));
};

export const getMusicAlbum = async (id: string) => {
  const result = await db.select().from(musicAlbums).where(eq(musicAlbums.id, id)).limit(1);
  return result[0] || null;
};

export const createMusicAlbum = async (data: any) => {
  const [album] = await db.insert(musicAlbums).values(data).returning();
  return album;
};

// Comments
export const getCommentsByVideo = async (videoId: string) => {
  return await db.select().from(comments).where(eq(comments.videoId, videoId)).orderBy(desc(comments.createdAt));
};

export const getCommentsByShorts = async (shortsId: string) => {
  return await db.select().from(comments).where(eq(comments.shortsId, shortsId)).orderBy(desc(comments.createdAt));
};

export const getComment = async (id: string) => {
  const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return result[0] || null;
};

export const createComment = async (data: any) => {
  const [comment] = await db.insert(comments).values(data).returning();
  return comment;
};

// Subscriptions
export const getSubscriptionsByChannel = async (channelId: string) => {
  return await db.select().from(subscriptions).where(eq(subscriptions.subscribedToChannelId, channelId)).orderBy(desc(subscriptions.createdAt));
};

export const getUserSubscriptions = async (channelId: string) => {
  return await db.select().from(subscriptions).where(eq(subscriptions.subscriberChannelId, channelId)).orderBy(desc(subscriptions.createdAt));
};

export const getSubscriptionFeed = async (channelId: string, limit: number, offset: number) => {
  return await db.select().from(videos)
    .innerJoin(subscriptions, eq(videos.channelId, subscriptions.subscribedToChannelId))
    .where(eq(subscriptions.subscriberChannelId, channelId))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(offset);
};

export const createSubscription = async (data: any) => {
  // Check if subscription already exists
  const existing = await db.select().from(subscriptions)
    .where(and(
      eq(subscriptions.subscriberChannelId, data.subscriberChannelId),
      eq(subscriptions.subscribedToChannelId, data.subscribedToChannelId)
    )).limit(1);
  
  if (existing.length > 0) {
    throw new Error('Already subscribed to this channel');
  }
  
  const [subscription] = await db.insert(subscriptions).values(data).returning();
  return subscription;
};

export const deleteSubscription = async (subscriberChannelId: string, subscribedToChannelId: string) => {
  await db.delete(subscriptions)
    .where(and(
      eq(subscriptions.subscriberChannelId, subscriberChannelId),
      eq(subscriptions.subscribedToChannelId, subscribedToChannelId)
    ));
};

export const isSubscribed = async (subscriberChannelId: string, subscribedToChannelId: string) => {
  const result = await db.select().from(subscriptions)
    .where(and(
      eq(subscriptions.subscriberChannelId, subscriberChannelId),
      eq(subscriptions.subscribedToChannelId, subscribedToChannelId)
    )).limit(1);
  return result.length > 0;
};

// Likes
export const likeVideo = async (videoId: string, channelId: string, isLike: boolean) => {
  await db.insert(videoLikes).values({ videoId, channelId, isLike }).onConflictDoUpdate({
    target: [videoLikes.videoId, videoLikes.channelId],
    set: { isLike }
  });
};

export const unlikeVideo = async (videoId: string, channelId: string) => {
  await db.delete(videoLikes).where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.channelId, channelId)));
};

export const getUserVideoLike = async (videoId: string, channelId: string) => {
  const result = await db.select().from(videoLikes)
    .where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.channelId, channelId))).limit(1);
  return result[0] || null;
};

export const likeShorts = async (shortsId: string, channelId: string, isLike: boolean) => {
  await db.insert(shortsLikes).values({ shortsId, channelId, isLike }).onConflictDoUpdate({
    target: [shortsLikes.shortsId, shortsLikes.channelId],
    set: { isLike }
  });
};

export const unlikeShorts = async (shortsId: string, channelId: string) => {
  await db.delete(shortsLikes).where(and(eq(shortsLikes.shortsId, shortsId), eq(shortsLikes.channelId, channelId)));
};

export const getUserShortsLike = async (shortsId: string, channelId: string) => {
  const result = await db.select().from(shortsLikes)
    .where(and(eq(shortsLikes.shortsId, shortsId), eq(shortsLikes.channelId, channelId))).limit(1);
  return result[0] || null;
};

export const likeComment = async (commentId: string, channelId: string) => {
  // This would need a comment likes table implementation
  console.log(`Comment ${commentId} liked by ${channelId}`);
};

export const unlikeComment = async (commentId: string, channelId: string) => {
  console.log(`Comment ${commentId} unliked by ${channelId}`);
};

// Shares
export const shareContent = async (data: any) => {
  const [share] = await db.insert(shares).values(data).returning();
  return share;
};

export const getShareCount = async (videoId?: string, shortsId?: string) => {
  if (videoId) {
    const result = await db.select({ count: sql`count(*)` }).from(shares).where(eq(shares.videoId, videoId));
    return parseInt(result[0]?.count as string) || 0;
  } else if (shortsId) {
    const result = await db.select({ count: sql`count(*)` }).from(shares).where(eq(shares.shortsId, shortsId));
    return parseInt(result[0]?.count as string) || 0;
  }
  return 0;
};

// Search
export const searchVideos = async (query: string) => {
  return await db.select().from(videos)
    .where(or(
      like(videos.title, `%${query}%`),
      like(videos.description, `%${query}%`)
    ))
    .orderBy(desc(videos.createdAt));
};

export const searchShorts = async (query: string) => {
  return await db.select().from(shorts)
    .where(or(
      like(shorts.title, `%${query}%`),
      like(shorts.description, `%${query}%`)
    ))
    .orderBy(desc(shorts.createdAt));
};

export const searchChannels = async (query: string) => {
  return await db.select().from(channels)
    .where(or(
      like(channels.name, `%${query}%`),
      like(channels.description, `%${query}%`)
    ))
    .orderBy(desc(channels.createdAt));
};

export const searchAll = async (query: string) => {
  const videoResults = await searchVideos(query);
  const shortsResults = await searchShorts(query);
  const channelResults = await searchChannels(query);
  
  return {
    videos: videoResults,
    shorts: shortsResults,
    channels: channelResults
  };
};

// Music tracks
export const getTracksByAlbum = async (albumId: string) => {
  return await db.select().from(musicTracks).where(eq(musicTracks.albumId, albumId)).orderBy(musicTracks.trackNumber);
};

export const getMusicTrack = async (id: string) => {
  const result = await db.select().from(musicTracks).where(eq(musicTracks.id, id)).limit(1);
  return result[0] || null;
};

export const createMusicTrack = async (data: any) => {
  const [track] = await db.insert(musicTracks).values(data).returning();
  return track;
};

// User profiles
export const getUserProfile = async (channelId: string) => {
  const result = await db.select().from(userProfiles).where(eq(userProfiles.channelId, channelId)).limit(1);
  return result[0] || null;
};

export const createUserProfile = async (data: any) => {
  const [profile] = await db.insert(userProfiles).values(data).returning();
  return profile;
};

export const updateUserProfile = async (channelId: string, data: any) => {
  const [profile] = await db.update(userProfiles).set(data).where(eq(userProfiles.channelId, channelId)).returning();
  return profile;
};

// Tokens
export const getAllTokens = async () => {
  return await db.select().from(tokens).orderBy(desc(tokens.createdAt));
};

export const createToken = async (data: any) => {
  const [token] = await db.insert(tokens).values(data).returning();
  return token;
};

// Web3 Channels
export const getAllWeb3Channels = async () => {
  return await db.select().from(web3Channels).orderBy(desc(web3Channels.createdAt));
};

export const getWeb3ChannelByOwner = async (owner: string) => {
  const result = await db.select().from(web3Channels).where(eq(web3Channels.owner, owner)).limit(1);
  return result[0] || null;
};

export const createWeb3Channel = async (data: any) => {
  const [channel] = await db.insert(web3Channels).values(data).returning();
  return channel;
};

// Content Imports
export const getAllContentImports = async () => {
  return await db.select().from(contentImports).orderBy(desc(contentImports.createdAt));
};

export const getContentImportsByChannel = async (channelId: string) => {
  return await db.select().from(contentImports).where(eq(contentImports.channelId, channelId)).orderBy(desc(contentImports.createdAt));
};

export const getContentImport = async (id: string) => {
  const result = await db.select().from(contentImports).where(eq(contentImports.id, id)).limit(1);
  return result[0] || null;
};

export const createContentImport = async (data: any) => {
  const [content] = await db.insert(contentImports).values(data).returning();
  return content;
};

export const updateContentImport = async (id: string, data: any) => {
  const [content] = await db.update(contentImports).set(data).where(eq(contentImports.id, id)).returning();
  return content;
};

export const deleteContentImport = async (id: string) => {
  await db.delete(contentImports).where(eq(contentImports.id, id));
};

// Pads
export const getAllPads = async () => {
  return await db.select().from(pads).orderBy(desc(pads.createdAt));
};

export const getPad = async (id: string) => {
  const result = await db.select().from(pads).where(eq(pads.id, id)).limit(1);
  return result[0] || null;
};

export const getPadsByCreator = async (creatorAddress: string) => {
  return await db.select().from(pads).where(eq(pads.creatorAddress, creatorAddress)).orderBy(desc(pads.createdAt));
};

export const createPad = async (data: any) => {
  const [pad] = await db.insert(pads).values(data).returning();
  return pad;
};

export const updatePad = async (id: string, data: any) => {
  const [pad] = await db.update(pads).set(data).where(eq(pads.id, id)).returning();
  return pad;
};

export const deletePad = async (id: string) => {
  await db.delete(pads).where(eq(pads.id, id));
};

export const searchPads = async (query: string) => {
  return await db.select().from(pads)
    .where(or(
      like(pads.tokenName, `%${query}%`),
      like(pads.tokenSymbol, `%${query}%`),
      like(pads.description, `%${query}%`)
    ))
    .orderBy(desc(pads.createdAt));
};

// Pad interactions
export const likePad = async (padId: string, userAddress: string) => {
  await db.insert(padLikes).values({ padId, userAddress }).onConflictDoNothing();
};

export const unlikePad = async (padId: string, userAddress: string) => {
  await db.delete(padLikes).where(and(eq(padLikes.padId, padId), eq(padLikes.userAddress, userAddress)));
};

export const getPadLikes = async (padId: string) => {
  return await db.select().from(padLikes).where(eq(padLikes.padId, padId)).orderBy(desc(padLikes.createdAt));
};

export const getUserPadLike = async (padId: string, userAddress: string) => {
  const result = await db.select().from(padLikes)
    .where(and(eq(padLikes.padId, padId), eq(padLikes.userAddress, userAddress))).limit(1);
  return result[0] || null;
};

// Pad comments
export const getPadComments = async (padId: string) => {
  return await db.select().from(padComments).where(eq(padComments.padId, padId)).orderBy(desc(padComments.createdAt));
};

export const createPadComment = async (data: any) => {
  const [comment] = await db.insert(padComments).values(data).returning();
  return comment;
};

export const deletePadComment = async (commentId: string) => {
  await db.delete(padComments).where(eq(padComments.id, commentId));
};

// Notifications
export const getNotifications = async (userAddress: string, limit: number, unreadOnly: boolean) => {
  let query = db.select().from(notifications).where(eq(notifications.recipientAddress, userAddress));
  
  if (unreadOnly) {
    query = query.where(eq(notifications.read, false));
  }
  
  return await query.orderBy(desc(notifications.createdAt)).limit(limit);
};

export const createNotification = async (data: any) => {
  const [notification] = await db.insert(notifications).values(data).returning();
  return notification;
};

export const markNotificationAsRead = async (id: string) => {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
};

export const markAllNotificationsAsRead = async (userAddress: string) => {
  await db.update(notifications).set({ read: true }).where(eq(notifications.recipientAddress, userAddress));
};

export const getUnreadNotificationCount = async (userAddress: string) => {
  const result = await db.select({ count: sql`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.recipientAddress, userAddress), eq(notifications.read, false)));
  return parseInt(result[0]?.count as string) || 0;
};

export const deleteNotification = async (id: string) => {
  await db.delete(notifications).where(eq(notifications.id, id));
};

// Enhanced subscriptions
export const getEnhancedSubscription = async (subscriberAddress: string, channelId?: string, web3ChannelId?: string) => {
  let query = db.select().from(enhancedSubscriptions).where(eq(enhancedSubscriptions.subscriberAddress, subscriberAddress));
  
  if (channelId) {
    query = query.where(eq(enhancedSubscriptions.channelId, channelId));
  }
  if (web3ChannelId) {
    query = query.where(eq(enhancedSubscriptions.web3ChannelId, web3ChannelId));
  }
  
  const result = await query.limit(1);
  return result[0] || null;
};

export const createEnhancedSubscription = async (data: any) => {
  const [subscription] = await db.insert(enhancedSubscriptions).values(data).returning();
  return subscription;
};

export const deleteEnhancedSubscription = async (subscriberAddress: string, channelId?: string, web3ChannelId?: string) => {
  let query = db.delete(enhancedSubscriptions).where(eq(enhancedSubscriptions.subscriberAddress, subscriberAddress));
  
  if (channelId) {
    query = query.where(eq(enhancedSubscriptions.channelId, channelId));
  }
  if (web3ChannelId) {
    query = query.where(eq(enhancedSubscriptions.web3ChannelId, web3ChannelId));
  }
  
  await query;
};

export const getSubscriptionsByAddress = async (userAddress: string) => {
  return await db.select().from(enhancedSubscriptions).where(eq(enhancedSubscriptions.subscriberAddress, userAddress)).orderBy(desc(enhancedSubscriptions.createdAt));
};

export const updateSubscriptionPreferences = async (id: string, preferences: any) => {
  await db.update(enhancedSubscriptions).set(preferences).where(eq(enhancedSubscriptions.id, id));
};

// Channel analytics
export const getChannelAnalytics = async (channelId?: string, web3ChannelId?: string) => {
  let query = db.select().from(channelAnalytics);
  
  if (channelId) {
    query = query.where(eq(channelAnalytics.channelId, channelId));
  }
  if (web3ChannelId) {
    query = query.where(eq(channelAnalytics.web3ChannelId, web3ChannelId));
  }
  
  const result = await query.limit(1);
  return result[0] || null;
};

export const getChannelSubscriberCount = async (channelId?: string, web3ChannelId?: string) => {
  let query = db.select({ count: sql`count(*)` }).from(enhancedSubscriptions);
  
  if (channelId) {
    query = query.where(eq(enhancedSubscriptions.channelId, channelId));
  }
  if (web3ChannelId) {
    query = query.where(eq(enhancedSubscriptions.web3ChannelId, web3ChannelId));
  }
  
  const result = await query;
  return parseInt(result[0]?.count as string) || 0;
};

export const createChannelAnalytics = async (data: any) => {
  const [analytics] = await db.insert(channelAnalytics).values(data).returning();
  return analytics;
};

// Channel comments
export const getChannelComments = async (channelId?: string, web3ChannelId?: string) => {
  let query = db.select().from(channelComments);
  
  if (channelId) {
    query = query.where(eq(channelComments.channelId, channelId));
  }
  if (web3ChannelId) {
    query = query.where(eq(channelComments.web3ChannelId, web3ChannelId));
  }
  
  return await query.orderBy(desc(channelComments.createdAt));
};

export const createChannelComment = async (data: any) => {
  const [comment] = await db.insert(channelComments).values(data).returning();
  return comment;
};

export const likeChannelComment = async (id: string) => {
  await db.update(channelComments).set({ likes: sql`${channelComments.likes} + 1` }).where(eq(channelComments.id, id));
};

export const pinChannelComment = async (id: string, isPinned: boolean) => {
  await db.update(channelComments).set({ isPinned }).where(eq(channelComments.id, id));
};

export const deleteChannelComment = async (id: string) => {
  await db.delete(channelComments).where(eq(channelComments.id, id));
};

// Advanced search
export const searchChannelsAdvanced = async (query: string, filters: any) => {
  let dbQuery = db.select().from(web3Channels);
  
  if (query) {
    dbQuery = dbQuery.where(or(
      like(web3Channels.name, `%${query}%`),
      like(web3Channels.description, `%${query}%`),
      like(web3Channels.ticker, `%${query}%`)
    ));
  }
  
  if (filters.categoryFilter) {
    dbQuery = dbQuery.where(eq(web3Channels.category, filters.categoryFilter));
  }
  
  switch (filters.sortBy) {
    case 'newest':
      dbQuery = dbQuery.orderBy(desc(web3Channels.createdAt));
      break;
    case 'popular':
      dbQuery = dbQuery.orderBy(desc(web3Channels.holders));
      break;
    case 'marketCap':
      dbQuery = dbQuery.orderBy(desc(web3Channels.marketCap));
      break;
    default:
      dbQuery = dbQuery.orderBy(desc(web3Channels.createdAt));
  }
  
  return await dbQuery;
};

export const saveSearchFilter = async (data: any) => {
  const [filter] = await db.insert(searchFilters).values(data).returning();
  return filter;
};

export const getUserSearchHistory = async (userAddress: string) => {
  return await db.select().from(searchFilters).where(eq(searchFilters.userAddress, userAddress)).orderBy(desc(searchFilters.createdAt)).limit(10);
};

// Create storage object to match existing imports
export const storage = {
  getAllChannels,
  getChannel,
  createChannel,
  updateChannel,
  getAllVideos,
  getVideo,
  getVideosByCategory,
  getVideosByChannel,
  createVideo,
  updateVideoViews,
  getAllShorts,
  getShorts,
  getShortsByChannel,
  createShorts,
  updateShortsViews,
  getPlaylistsByChannel,
  getPlaylist,
  createPlaylist,
  getAllMusicAlbums,
  getMusicAlbum,
  createMusicAlbum,
  getCommentsByVideo,
  getCommentsByShorts,
  getComment,
  createComment,
  getSubscriptionsByChannel,
  getUserSubscriptions,
  getSubscriptionFeed,
  createSubscription,
  deleteSubscription,
  isSubscribed,
  likeVideo,
  unlikeVideo,
  getUserVideoLike,
  likeShorts,
  unlikeShorts,
  getUserShortsLike,
  likeComment,
  unlikeComment,
  shareContent,
  getShareCount,
  searchVideos,
  searchShorts,
  searchAll,
  getTracksByAlbum,
  getMusicTrack,
  createMusicTrack,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  getAllTokens,
  createToken,
  getAllWeb3Channels,
  getWeb3ChannelByOwner,
  createWeb3Channel,
  getAllContentImports,
  getContentImportsByChannel,
  getContentImport,
  createContentImport,
  updateContentImport,
  deleteContentImport,
  getAllPads,
  getPad,
  getPadsByCreator,
  createPad,
  updatePad,
  deletePad,
  searchPads,
  likePad,
  unlikePad,
  getPadLikes,
  getUserPadLike,
  getPadComments,
  createPadComment,
  deletePadComment,
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
  getEnhancedSubscription,
  createEnhancedSubscription,
  deleteEnhancedSubscription,
  getSubscriptionsByAddress,
  updateSubscriptionPreferences,
  getChannelAnalytics,
  getChannelSubscriberCount,
  createChannelAnalytics,
  getChannelComments,
  createChannelComment,
  likeChannelComment,
  pinChannelComment,
  deleteChannelComment,
  searchChannelsAdvanced,
  saveSearchFilter,
  getUserSearchHistory
};
