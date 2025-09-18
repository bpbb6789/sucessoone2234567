import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import { storage } from "./storage";
import { uploadFileToIPFS, uploadJSONToIPFS } from './ipfs';
import {
  createZoraMetadata,
  createCreatorCoin,
  validateContentForTokenization,
  generateThumbnail
} from './zora';
import {
  insertVideoSchema, insertShortsSchema, insertChannelSchema, insertPlaylistSchema,
  insertMusicAlbumSchema, insertCommentSchema, insertSubscriptionSchema,
  insertVideoLikeSchema, insertShortsLikeSchema, insertShareSchema,
  insertMusicTrackSchema, insertUserProfileSchema, insertTokenSchema, insertWeb3ChannelSchema,
  insertContentImportSchema, insertPadSchema, insertPadLikeSchema, insertPadCommentSchema,
  insertCreatorCoinSchema, insertCreatorCoinLikeSchema, insertCreatorCoinCommentSchema, insertCreatorCoinTradeSchema,
  insertNotificationSchema, insertChannelAnalyticsSchema, insertEnhancedSubscriptionSchema,
  insertChannelCommentSchema, insertSearchFilterSchema
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { contentImports, creatorCoins, creatorCoinLikes, creatorCoinComments, creatorCoinTrades, web3Channels, walletProfiles } from "@shared/schema";
// Doppler system removed
import { PrismaClient } from '../lib/generated/prisma/index.js';
import { getTelegramService } from "./services/telegramService";
import { adminAuth } from "./middleware/adminAuth"; // Assuming adminAuth middleware is defined elsewhere
import { v4 as uuidv4 } from 'uuid'; // Import uuid for trade IDs
// import * as admin from './admin'; // Import admin module
import { registerAdvancedTradingRoutes } from './routes/advancedTrading';
import { ethers } from 'ethers';
import { initializeDatabase } from './initializeDatabase';
import { zoraTradingService } from './services/zoraTradingService';
import { getCoinPrice } from './zora';
import { getTokenHolders } from './blockchain';


const prisma = new PrismaClient();


// Helper function to handle database errors gracefully
function handleDatabaseError(error: any, operation: string) {
  console.error(`Database error in ${operation}:`, error);

  // Check if it's a disabled endpoint error
  if (error?.message?.includes('The endpoint has been disabled')) {
    console.error('❌ Database endpoint disabled - needs to be re-enabled via Neon Console or new database created');
    return {
      error: true,
      message: "Database has been disabled due to inactivity. Please create a new database in the Database tab.",
      operation,
      needsDbRecreation: true
    };
  }

  // Check if it's an authentication error
  if (error?.message?.includes('password authentication failed')) {
    console.error('❌ Database authentication failed - check DATABASE_URL password in Secrets');
    return {
      error: true,
      message: "Database authentication failed. Please check your database configuration.",
      operation,
      needsDbReset: true
    };
  }

  // Check if it's an endpoint not found error
  if (error?.message?.includes('The requested endpoint could not be found')) {
    console.error('❌ Database endpoint not found - database may be sleeping or misconfigured');
    return {
      error: true,
      message: "Database endpoint not accessible. Database may be sleeping.",
      operation,
      needsDbWakeup: true
    };
  }

  return {
    error: true,
    message: "Database temporarily unavailable",
    operation
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database schema
  console.log('🔧 Checking database schema...');
  const dbInitialized = await initializeDatabase();
  if (dbInitialized) {
    console.log('✅ Database ready for use');
  } else {
    console.warn('⚠️ Database initialization had issues, but server will continue');
  }

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // IPFS Upload endpoints
  app.post("/api/upload/file", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const file = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });

      const cid = await uploadFileToIPFS(file);
      res.json({ cid });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file to IPFS" });
    }
  });

  app.post("/api/upload/json", async (req, res) => {
    try {
      const metadata = req.body;
      const cid = await uploadJSONToIPFS(metadata);
      res.json({ cid });
    } catch (error) {
      console.error("JSON upload error:", error);
      res.status(500).json({ message: "Failed to upload metadata to IPFS" });
    }
  });
  // Channels
  app.get("/api/channels", async (req, res) => {
    try {
      const channels = await storage.getAllChannels();
      res.json(channels);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch channels" });
      res.status(500).json(handleDatabaseError(error, "getAllChannels"));
    }
  });

  app.get("/api/channels/:id", async (req, res) => {
    try {
      const channel = await storage.getChannel(req.params.id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch channel" });
      res.status(500).json(handleDatabaseError(error, "getChannel"));
    }
  });

  app.post("/api/channels", async (req, res) => {
    try {
      const validatedData = insertChannelSchema.parse(req.body);
      const channel = await storage.createChannel(validatedData);

      // Trigger notification for channel creation
      await triggerNotification('channel_created', {
        creatorAddress: validatedData.createdBy || 'unknown',
        channelName: channel.name,
        channelId: channel.id
      });

      // Send Telegram notification for new channel
      const telegramService = getTelegramService();
      if (telegramService) {
        await telegramService.notifyNewChannel({
          name: channel.name,
          creator: channel.createdBy || 'Unknown',
          coinAddress: undefined,
          category: 'General',
          slug: channel.slug,
          createdAt: channel.createdAt?.toISOString()
        }).catch(err => console.log('Telegram notification failed:', err));
      }

      res.status(201).json(channel);
    } catch (error) {
      // res.status(400).json({ message: "Invalid channel data" });
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid channel data", errors: (error as any).errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createChannel"));
      }
    }
  });

  // Videos
  app.get("/api/videos", async (req, res) => {
    try {
      const category = req.query.category as string;
      const channelId = req.query.channelId as string;

      let videos;
      if (category) {
        videos = await storage.getVideosByCategory(category);
      } else if (channelId) {
        videos = await storage.getVideosByChannel(channelId);
      } else {
        videos = await storage.getAllVideos();
      }

      res.json(videos);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch videos" });
      res.status(500).json(handleDatabaseError(error, "getVideos"));
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch video" });
      res.status(500).json(handleDatabaseError(error, "getVideo"));
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const validatedData = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      // res.status(400).json({ message: "Invalid video data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createVideo"));
      }
    }
  });

  app.patch("/api/videos/:id/views", async (req, res) => {
    try {
      await storage.updateVideoViews(req.params.id);
      res.json({ message: "Views updated" });
    } catch (error) {
      // res.status(500).json({ message: "Failed to update views" });
      res.status(500).json(handleDatabaseError(error, "updateVideoViews"));
    }
  });

  // Shorts
  app.get("/api/shorts", async (req, res) => {
    try {
      const channelId = req.query.channelId as string;
      let shorts;

      if (channelId) {
        shorts = await storage.getShortsByChannel(channelId);
      } else {
        shorts = await storage.getAllShorts();
      }

      res.json(shorts);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch shorts" });
      res.status(500).json(handleDatabaseError(error, "getShorts"));
    }
  });

  app.get("/api/shorts/:id", async (req, res) => {
    try {
      const shorts = await storage.getShorts(req.params.id);
      if (!shorts) {
        return res.status(404).json({ message: "Shorts not found" });
      }
      res.json(shorts);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch shorts" });
      res.status(500).json(handleDatabaseError(error, "getShorts"));
    }
  });

  app.post("/api/shorts", async (req, res) => {
    try {
      const validatedData = insertShortsSchema.parse(req.body);
      const shorts = await storage.createShorts(validatedData);
      res.status(201).json(shorts);
    } catch (error) {
      // res.status(400).json({ message: "Invalid shorts data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid shorts data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createShorts"));
      }
    }
  });

  app.patch("/api/shorts/:id/views", async (req, res) => {
    try {
      await storage.updateShortsViews(req.params.id);
      res.json({ message: "Views updated" });
    } catch (error) {
      // res.status(500).json({ message: "Failed to update views" });
      res.status(500).json(handleDatabaseError(error, "updateShortsViews"));
    }
  });

  // Playlists
  app.get("/api/playlists", async (req, res) => {
    try {
      const channelId = req.query.channelId as string;
      let playlists: any[] = [];

      if (channelId) {
        playlists = await storage.getPlaylistsByChannel(channelId);
      }

      res.json(playlists);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch playlists" });
      res.status(500).json(handleDatabaseError(error, "getPlaylists"));
    }
  });

  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch playlist" });
      res.status(500).json(handleDatabaseError(error, "getPlaylist"));
    }
  });

  app.post("/api/playlists", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      res.status(201).json(playlist);
    } catch (error) {
      // res.status(400).json({ message: "Invalid playlist data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid playlist data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createPlaylist"));
      }
    }
  });

  // Music Albums
  app.get("/api/music/albums", async (req, res) => {
    try {
      const albums = await storage.getAllMusicAlbums();
      res.json(albums);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch music albums" });
      res.status(500).json(handleDatabaseError(error, "getAllMusicAlbums"));
    }
  });

  app.get("/api/music/albums/:id", async (req, res) => {
    try {
      const album = await storage.getMusicAlbum(req.params.id);
      if (!album) {
        return res.status(404).json({ message: "Music album not found" });
      }
      res.json(album);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch music album" });
      res.status(500).json(handleDatabaseError(error, "getMusicAlbum"));
    }
  });

  app.post("/api/music/albums", async (req, res) => {
    try {
      const validatedData = insertMusicAlbumSchema.parse(req.body);
      const album = await storage.createMusicAlbum(validatedData);
      res.status(201).json(album);
    } catch (error) {
      // res.status(400).json({ message: "Invalid music album data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid music album data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createMusicAlbum"));
      }
    }
  });

  // Comments
  app.get("/api/comments", async (req, res) => {
    try {
      const videoId = req.query.videoId as string;
      const shortsId = req.query.shortsId as string;

      let comments: any[] = [];
      if (videoId) {
        comments = await storage.getCommentsByVideo(videoId);
      } else if (shortsId) {
        comments = await storage.getCommentsByShorts(shortsId);
      }

      res.json(comments);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch comments" });
      res.status(500).json(handleDatabaseError(error, "getComments"));
    }
  });

  app.get("/api/comments/:id", async (req, res) => {
    try {
      const comment = await storage.getComment(req.params.id);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch comment" });
      res.status(500).json(handleDatabaseError(error, "getComment"));
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      // res.status(400).json({ message: "Invalid comment data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createComment"));
      }
    }
  });

  // Subscriptions
  app.get("/api/subscriptions/:channelId", async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptionsByChannel(req.params.channelId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getSubscriptionsByChannel"));
    }
  });

  // Get user's subscriptions (channels they follow)
  app.get("/api/user/:channelId/subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getUserSubscriptions(req.params.channelId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getUserSubscriptions"));
    }
  });

  // Get subscription feed (videos from subscribed channels)
  app.get("/api/user/:channelId/feed", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const feed = await storage.getSubscriptionFeed(req.params.channelId, limit, offset);
      res.json(feed);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getSubscriptionFeed"));
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);

      // Prevent self-subscription
      if (validatedData.subscriberChannelId === validatedData.subscribedToChannelId) {
        return res.status(400).json({ message: "Cannot subscribe to yourself" });
      }

      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      } else if (error.message === 'Already subscribed to this channel') {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json(handleDatabaseError(error, "createSubscription"));
      }
    }
  });

  app.delete("/api/subscriptions", async (req, res) => {
    try {
      const { subscriberChannelId, subscribedToChannelId } = req.body;

      if (!subscriberChannelId || !subscribedToChannelId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      await storage.deleteSubscription(subscriberChannelId, subscribedToChannelId);
      res.json({ message: "Subscription deleted successfully" });
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "deleteSubscription"));
    }
  });

  // Subscription routes (Duplicate, keeping the first one for now)
  // app.post("/api/subscriptions", async (req, res) => {
  //   try {
  //     const validatedData = insertSubscriptionSchema.parse(req.body);
  //     const subscription = await storage.createSubscription(validatedData);
  //     res.status(201).json(subscription);
  //   } catch (error) {
  //     res.status(400).json({ message: "Invalid subscription data" });
  //   }
  // });

  app.delete("/api/subscriptions/:subscriberChannelId/:subscribedToChannelId", async (req, res) => {
    try {
      await storage.deleteSubscription(req.params.subscriberChannelId, req.params.subscribedToChannelId);
      res.status(204).send();
    } catch (error) {
      // res.status(500).json({ message: "Failed to delete subscription" });
      res.status(500).json(handleDatabaseError(error, "deleteSubscription"));
    }
  });

  app.get("/api/subscriptions/check/:subscriberChannelId/:subscribedToChannelId", async (req, res) => {
    try {
      const isSubscribed = await storage.isSubscribed(req.params.subscriberChannelId, req.params.subscribedToChannelId);
      res.json({ isSubscribed });
    } catch (error) {
      // res.status(500).json({ message: "Failed to check subscription" });
      res.status(500).json(handleDatabaseError(error, "isSubscribed"));
    }
  });

  // Like routes
  app.post("/api/videos/:id/like", async (req, res) => {
    try {
      const { channelId, isLike } = req.body;
      await storage.likeVideo(req.params.id, channelId, isLike);

      // Trigger notification for video like (only for actual likes, not dislikes)
      if (isLike) {
        const video = await storage.getVideo(req.params.id);
        if (video) {
          await triggerNotification('video_liked', {
            videoOwnerAddress: video.channelId, // In a real app, this would be the owner's address
            videoTitle: video.title,
            videoId: video.id,
            likerAddress: channelId,
            likerName: channelId
          });
        }
      }

      res.status(200).json({ message: "Like updated" });
    } catch (error) {
      // res.status(400).json({ message: "Failed to like video" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Failed to like video", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "likeVideo"));
      }
    }
  });

  app.delete("/api/videos/:id/like/:channelId", async (req, res) => {
    try {
      await storage.unlikeVideo(req.params.id, req.params.channelId);
      res.status(204).send();
    } catch (error) {
      // res.status(500).json({ message: "Failed to unlike video" });
      res.status(500).json(handleDatabaseError(error, "unlikeVideo"));
    }
  });

  app.get("/api/videos/:id/like/:channelId", async (req, res) => {
    try {
      const like = await storage.getUserVideoLike(req.params.id, req.params.channelId);
      res.json(like || null);
    } catch (error) {
      // res.status(500).json({ message: "Failed to get like status" });
      res.status(500).json(handleDatabaseError(error, "getUserVideoLike"));
    }
  });

  app.post("/api/shorts/:id/like", async (req, res) => {
    try {
      const { channelId, isLike } = req.body;
      await storage.likeShorts(req.params.id, channelId, isLike);
      res.status(200).json({ message: "Like updated" });
    } catch (error) {
      // res.status(400).json({ message: "Failed to like shorts" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Failed to like shorts", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "likeShorts"));
      }
    }
  });

  app.delete("/api/shorts/:id/like/:channelId", async (req, res) => {
    try {
      await storage.unlikeShorts(req.params.id, req.params.channelId);
      res.status(204).send();
    } catch (error) {
      // res.status(500).json({ message: "Failed to unlike shorts" });
      res.status(500).json(handleDatabaseError(error, "unlikeShorts"));
    }
  });

  app.get("/api/shorts/:id/like/:channelId", async (req, res) => {
    try {
      const like = await storage.getUserShortsLike(req.params.id, req.params.channelId);
      res.json(like || null);
    } catch (error) {
      // res.status(500).json({ message: "Failed to get like status" });
      res.status(500).json(handleDatabaseError(error, "getUserShortsLike"));
    }
  });

  // Comment routes
  app.get("/api/videos/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByVideo(req.params.id);
      res.json(comments);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch comments" });
      res.status(500).json(handleDatabaseError(error, "getCommentsByVideo"));
    }
  });

  app.get("/api/shorts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByShorts(req.params.id);
      res.json(comments);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch comments" });
      res.status(500).json(handleDatabaseError(error, "getCommentsByShorts"));
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validatedData);

      // Trigger notification for comment (get video/content owner)
      if (validatedData.videoId) {
        const video = await storage.getVideo(validatedData.videoId);
        if (video && video.channelId !== validatedData.channelId) {
          await triggerNotification('comment_posted', {
            recipientAddress: video.channelId,
            commenterAddress: validatedData.channelId,
            commenterName: validatedData.channelId,
            contentOwnerAddress: video.channelId,
            contentTitle: video.title,
            contentId: video.id,
            contentType: 'video',
            commentText: validatedData.content
          });
        }
      }

      res.status(201).json(comment);
    } catch (error) {
      // res.status(400).json({ message: "Invalid comment data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createComment"));
      }
    }
  });

  app.post("/api/comments/:id/like", async (req, res) => {
    try {
      const { channelId } = req.body;
      await storage.likeComment(req.params.id, channelId);

      // Trigger notification for comment like
      const comment = await storage.getComment(req.params.id);
      if (comment && comment.channelId !== channelId) {
        await triggerNotification('comment_liked', {
          recipientAddress: comment.channelId,
          commentOwnerAddress: comment.channelId,
          commentId: comment.id,
          likerAddress: channelId,
          likerName: channelId
        });
      }

      res.status(200).json({ message: "Comment liked" });
    } catch (error) {
      // res.status(400).json({ message: "Failed to like comment" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Failed to like comment", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "likeComment"));
      }
    }
  });

  app.delete("/api/comments/:id/like/:channelId", async (req, res) => {
    try {
      await storage.unlikeComment(req.params.id, req.params.channelId);
      res.status(204).send();
    } catch (error) {
      // res.status(500).json({ message: "Failed to unlike comment" });
      res.status(500).json(handleDatabaseError(error, "unlikeComment"));
    }
  });

  // Share routes
  app.post("/api/share", async (req, res) => {
    try {
      const validatedData = insertShareSchema.parse(req.body);
      const share = await storage.shareContent(validatedData);
      res.status(201).json(share);
    } catch (error) {
      // res.status(400).json({ message: "Invalid share data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid share data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "shareContent"));
      }
    }
  });

  app.get("/api/share/count", async (req, res) => {
    try {
      const { videoId, shortsId } = req.query;
      const count = await storage.getShareCount(videoId as string, shortsId as string);
      res.json({ count });
    } catch (error) {
      // res.status(500).json({ message: "Failed to get share count" });
      res.status(500).json(handleDatabaseError(error, "getShareCount"));
    }
  });

  // Search routes
  app.get("/api/search", async (req, res) => {
    try {
      const { q: query, type } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      let results;
      switch (type) {
        case 'videos':
          results = { videos: await storage.searchVideos(query) };
          break;
        case 'shorts':
          results = { shorts: await storage.searchShorts(query) };
          break;
        case 'channels':
          const channels = await storage.searchAll(query);
          results = { channels: channels.channels };
          break;
        default:
          results = await storage.searchAll(query);
      }

      res.json(results);
    } catch (error) {
      // res.status(500).json({ message: "Search failed" });
      res.status(500).json(handleDatabaseError(error, "search"));
    }
  });

  // Music routes
  app.get("/api/music/tracks", async (req, res) => {
    try {
      const { albumId } = req.query;
      let tracks;
      if (albumId && typeof albumId === 'string') {
        tracks = await storage.getTracksByAlbum(albumId);
      } else {
        tracks = [];
      }
      res.json(tracks);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch tracks" });
      res.status(500).json(handleDatabaseError(error, "getTracksByAlbum"));
    }
  });

  app.get("/api/music/tracks/:id", async (req, res) => {
    try {
      const track = await storage.getMusicTrack(req.params.id);
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch track" });
      res.status(500).json(handleDatabaseError(error, "getMusicTrack"));
    }
  });

  app.post("/api/music/tracks", async (req, res) => {
    try {
      const validatedData = insertMusicTrackSchema.parse(req.body);
      const track = await storage.createMusicTrack(validatedData);
      res.status(201).json(track);
    } catch (error) {
      // res.status(400).json({ message: "Invalid track data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid track data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createMusicTrack"));
      }
    }
  });

  // User Profile routes
  app.get("/api/profiles/:channelId", async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.params.channelId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      // res.status(500).json({ message: "Failed to fetch profile" });
      res.status(500).json(handleDatabaseError(error, "getUserProfile"));
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const validatedData = insertUserProfileSchema.parse(req.body);
      const profile = await storage.createUserProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      // res.status(400).json({ message: "Invalid profile data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createUserProfile"));
      }
    }
  });

  app.put("/api/profiles/:channelId", async (req, res) => {
    try {
      const profile = await storage.updateUserProfile(req.params.channelId, req.body);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      // res.status(500).json({ message: "Failed to update profile" });
      res.status(500).json(handleDatabaseError(error, "updateUserProfile"));
    }
  });

  app.put("/api/channels/:id", async (req, res) => {
    try {
      const channel = await storage.updateChannel(req.params.id, req.body);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      // res.status(500).json({ message: "Failed to update channel" });
      res.status(500).json(handleDatabaseError(error, "updateChannel"));
    }
  });

  // Pending channel endpoint for pre-transaction metadata
  app.post("/api/pending-channel", async (req, res) => {
    try {
      // Just acknowledge the pending channel metadata for now
      // This can be used to store temporary data before blockchain confirmation
      console.log('Pending channel metadata received:', req.body);
      res.json({ success: true, message: "Pending channel metadata received" });
    } catch (error) {
      console.error('Error processing pending channel:', error);
      res.status(500).json({ message: "Failed to process pending channel" });
    }
  });

  // Tokens API endpoints
  app.get("/api/tokens", async (req, res) => {
    try {
      // Get all tokens from storage (database)
      const dbTokens = await storage.getAllTokens();

      // Get available tokens from bonding curve system
      const allCreatorCoins = await db.select().from(creatorCoins).where(sql`coin_address IS NOT NULL`);

      const bondingCurveTokens = [];

      // Future: Scan bonding curve factory for tokens
      try {
        // Bonding curve token discovery to be implemented
        const factoryTokens = []; // Placeholder for bonding curve tokens

        console.log(`🔍 Found ${factoryTokens.length} tokens in bonding curve system`);

        for (const token of factoryTokens) {
          try {
            // Future: Get bonding curve data for pricing
            const bondingCurveData = null; // await getBondingCurveData(token.address);

            let price = 0;
            let marketCap = 0;
            let volume24h = 0;

            if (bondingCurveData && bondingCurveData.tokenMint !== '0x0000000000000000000000000000000000000000') {
              // Calculate price from bonding curve
              price = Number(bondingCurveData.virtualEthReserves) / Number(bondingCurveData.virtualTokenReserves);
              const totalSupply = Number(bondingCurveData.tokenTotalSupply) / 1e18;
              marketCap = price * totalSupply;
              volume24h = Number(bondingCurveData.realEthReserves) / 1e18;
            }

            bondingCurveTokens.push({
              id: `factory-${token.index}`,
              address: token.address,
              name: token.name,
              symbol: token.symbol,
              description: `Token created via TokenFactory contract with bonding curve`,
              creator: 'TokenFactory Contract',
              price: price.toFixed(8),
              marketCap: marketCap.toFixed(2),
              volume24h: volume24h,
              holders: 0, // Would need to fetch from chain
              totalSupply: (Number(token.totalSupply) / 1e18).toString(),
              createdAt: new Date().toISOString(), // Would need to get from creation event
              imageUri: undefined,
              isTokenFactory: true
            });

            console.log(`✅ Added TokenFactory token: ${token.name} (${token.symbol}) at ${token.address}`);
          } catch (error) {
            console.log(`❌ Error processing TokenFactory token ${token.address}:`, error.message);
          }
        }
      } catch (error) {
        console.error('❌ Error scanning TokenFactory:', error);
      }

      console.log(`📊 Found ${dbTokens.length} database tokens and ${bondingCurveTokens.length} bonding curve tokens`);

      // Combine database tokens with discovered bonding curve tokens
      const allTokens = [...dbTokens, ...bondingCurveTokens];
      res.json(allTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json(handleDatabaseError(error, "getAllTokens"));
    }
  });

  app.post("/api/tokens", async (req, res) => {
    try {
      const validatedData = insertTokenSchema.parse(req.body);
      const token = await storage.createToken(validatedData);
      res.status(201).json(token);
    } catch (error) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid token data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createToken"));
      }
    }
  });

  // Token holders endpoint
  app.post("/api/token-holders", async (req, res) => {
    try {
      const { tokenAddress } = req.body;

      if (!tokenAddress) {
        return res.status(400).json({ error: 'Token address is required' });
      }

      // Use GraphQL to get transaction data and count unique holders
      const response = await fetch('https://unipump-contracts.onrender.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetTokenTransfers($tokenAddress: String!) {
              transfers(
                where: { tokenAddress: $tokenAddress }
                first: 10000
              ) {
                items {
                  to
                  from
                  tokenAddress
                }
              }
            }
          `,
          variables: { tokenAddress }
        })
      });

      const data = await response.json();
      const transfers = data.data?.transfers?.items || [];

      // Count unique holders (exclude zero address)
      const holders = new Set();
      transfers.forEach((transfer: any) => {
        if (transfer.to && transfer.to !== '0x0000000000000000000000000000000000000000') {
          holders.add(transfer.to.toLowerCase());
        }
      });

      res.json({ holderCount: holders.size });
    } catch (error) {
      console.error('Error fetching holder count:', error);
      res.status(500).json({ error: true, message: 'Failed to fetch holder count' });
    }
  });

  // Token creation time endpoint
  app.post('/api/token-creation-time', async (req, res) => {
    try {
      const { tokenAddress } = req.body;

      if (!tokenAddress) {
        return res.status(400).json({ error: true, message: 'Token address is required' });
      }

      // Get creation time from GraphQL
      const response = await fetch('https://unipump-contracts.onrender.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetTokenCreation($tokenAddress: String!) {
              uniPumpCreatorSaless(
                where: { memeTokenAddress: $tokenAddress }
              ) {
                items {
                  blockTimestamp
                  blockNumber
                }
              }
            }
          `,
          variables: { tokenAddress }
        })
      });

      const data = await response.json();
      const tokenData = data.data?.uniPumpCreatorSaless?.items?.[0];

      if (tokenData?.blockTimestamp) {
        res.json({ creationTime: new Date(parseInt(tokenData.blockTimestamp) * 1000).toISOString() });
      } else {
        res.json({ creationTime: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Error fetching creation time:', error);
      res.status(500).json({ error: true, message: 'Failed to fetch creation time' });
    }
  });

  // Web3 Channels API
  // New Zora-based Channel Creation
  app.post("/api/zora-channels", upload.fields([
    { name: 'avatarFile', maxCount: 1 },
    { name: 'coverFile', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { name, ticker, category, chainId, currency, creatorAddress, description } = req.body;

      if (!creatorAddress) {
        return res.status(400).json({ error: "Creator address required" });
      }

      console.log('🚀 Creating Zora channel:', { name, ticker, category });

      // Upload avatar to IPFS if provided
      let avatarCid: string | undefined;
      const avatarFile = req.files?.['avatarFile']?.[0];
      if (avatarFile) {
        const avatar = new File([avatarFile.buffer], avatarFile.originalname, {
          type: avatarFile.mimetype,
        });
        avatarCid = await uploadFileToIPFS(avatar);
        console.log('📁 Avatar uploaded:', avatarCid);
      }

      // Upload cover to IPFS if provided
      let coverCid: string | undefined;
      const coverFile = req.files?.['coverFile']?.[0];
      if (coverFile) {
        const cover = new File([coverFile.buffer], coverFile.originalname, {
          type: coverFile.mimetype,
        });
        coverCid = await uploadFileToIPFS(cover);
        console.log('📁 Cover uploaded:', coverCid);
      }

      // Create metadata for the channel coin
      const metadataUri = await createZoraMetadata({
        name: name,
        description: description || `${name} Channel Coin`,
        imageUrl: avatarCid ? `https://gateway.pinata.cloud/ipfs/${avatarCid}` : 'https://via.placeholder.com/400',
        contentType: 'channel',
        attributes: [
          { trait_type: "Category", value: category },
          { trait_type: "Ticker", value: ticker },
        ]
      });

      console.log('📋 Metadata created:', metadataUri);

      // Deploy the channel coin using Zora SDK - this will throw if deployment fails
      console.log('🚀 Deploying channel coin with Zora SDK...');
      const coinResult = await createCreatorCoin({
        name: name,
        symbol: ticker,
        uri: metadataUri,
        currency: currency || 'ETH',
        creatorAddress: creatorAddress
      });

      console.log('✅ Zora coin deployed successfully:', coinResult);

      // Create slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      // Save channel to database
      const channelData = {
        owner: creatorAddress,
        createdBy: creatorAddress,
        name: name,
        slug: slug,
        ticker: ticker,
        coinAddress: coinResult.coinAddress,
        chainId: parseInt(chainId) || 8453,
        avatarCid: avatarCid,
        coverCid: coverCid,
        category: category,
        description: description,
        zoraPlatform: 'zora',
        zoraFactoryAddress: coinResult.factoryAddress,
        metadataUri: metadataUri,
        currency: currency || 'ETH',
        txHash: coinResult.txHash,
      };

      const channel = await storage.createWeb3Channel(channelData);
      console.log('💾 Channel saved to database:', channel.id);

      // Trigger notification for web3 channel creation
      await triggerNotification('web3_channel_created', {
        creatorAddress: channel.createdBy || 'unknown',
        channelName: channel.name,
        channelId: channel.id,
        tokenSymbol: channel.ticker
      });

      // Send Telegram notification for new channel
      const telegramService = getTelegramService();
      if (telegramService) {
        await telegramService.notifyNewChannel({
          name: channel.name,
          creator: channel.createdBy,
          coinAddress: channel.coinAddress || undefined,
          ticker: channel.ticker,
          category: channel.category,
          avatarUrl: channel.avatarCid ? `https://gateway.pinata.cloud/ipfs/${channel.avatarCid}` : undefined,
          slug: channel.slug,
          createdAt: channel.createdAt?.toISOString()
        }).catch(err => console.log('Telegram notification failed:', err));
      }

      res.json({
        success: true,
        id: channel.id,
        name: channel.name,
        ticker: channel.ticker,
        coinAddress: channel.coinAddress,
        txHash: channel.txHash
      });

    } catch (error: any) {
      console.error('❌ Zora channel creation failed:', error);
      res.status(500).json({
        error: "Failed to create Zora channel",
        details: error.message
      });
    }
  });

  // Legacy TokenFactory channel system - DEPRECATED in favor of Zora
  // Keep for migration purposes but discourage new usage
  app.post("/api/web3-channels", async (req, res) => {
    try {
      // Generate unique slug with counter if needed
      let baseSlug = req.body.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      let slug = baseSlug;
      let counter = 1;

      // Check if slug exists and increment until unique
      while (true) {
        try {
          const existing = await storage.getAllWeb3Channels();
          const slugExists = existing.some(channel => channel.slug === slug);
          if (!slugExists) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        } catch (error) {
          break; // If we can't check, proceed with original slug
        }
      }

      const bodyWithSlug = {
        ...req.body,
        slug: slug
      };
      const validatedData = insertWeb3ChannelSchema.parse(bodyWithSlug);
      const channel = await storage.createWeb3Channel(validatedData);

      // Send Telegram notification for new channel
      const telegramService = getTelegramService();
      if (telegramService) {
        await telegramService.notifyNewChannel({
          name: channel.name,
          creator: channel.createdBy || channel.owner || 'Unknown',
          coinAddress: channel.coinAddress || undefined,
          ticker: channel.ticker,
          category: channel.category,
          avatarUrl: channel.avatarCid ? `https://gateway.pinata.cloud/ipfs/${channel.avatarCid}` : undefined,
          slug: channel.slug,
          createdAt: channel.createdAt?.toISOString()
        }).catch(err => console.log('Telegram notification failed:', err));
      }

      res.status(201).json(channel);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid channel data", errors: error.errors });
      } else {
        res.status(500).json(handleDatabaseError(error, "createWeb3Channel"));
      }
    }
  });

  app.get("/api/web3-channels", async (req, res) => {
    try {
      const channels = await storage.getAllWeb3Channels();

      // Transform channels to match expected structure for tokens page
      const transformedChannels = channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description || '',
        avatarUrl: channel.avatarCid ? (channel.avatarCid.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${channel.avatarCid}` : channel.avatarCid) : null,
        coverUrl: channel.coverCid ? (channel.coverCid.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${channel.coverCid}` : channel.coverCid) : null,
        coinAddress: channel.coinAddress,
        metadataUri: channel.metadataUri || '',
        transactionHash: channel.txHash || '',
        owner: channel.owner || channel.createdBy,
        creatorUsername: channel.owner ? `${channel.owner.slice(0, 6)}...${channel.owner.slice(-4)}` : 'creator',
        ticker: channel.ticker || channel.name.toUpperCase().slice(0, 8),
        category: channel.category || 'General',
        chainId: channel.chainId || 8453,
        slug: channel.slug || channel.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        postsCount: 0, // Will be populated when content management is implemented
        holderCount: 0, // Will be populated from blockchain data
        marketCap: 0, // Will be populated from price data
        creatorAvatar: channel.avatarUrl // Use channel avatar as creator avatar for now
      }));

      console.log(`Returning ${transformedChannels.length} channels with coin addresses:`, transformedChannels.map(c => ({ name: c.name, coinAddress: c.coinAddress, avatarUrl: c.avatarUrl, coverUrl: c.coverUrl })));
      res.json(transformedChannels);
    } catch (error: any) {
      console.error('Error fetching web3 channels:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get channel content (videos, shorts, stats)
  app.get('/api/channel-content/:slug', async (req, res) => {
    try {
      const { slug } = req.params;

      // Get the channel first from web3 channels
      const channels = await storage.getAllWeb3Channels();
      const channel = channels.find(c => c.slug === slug);

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      // For now, return empty arrays since we don't have content management yet
      // In the future, this would fetch from a content database table
      const response = {
        videos: [],
        shorts: [],
        stats: {
          subscriberCount: 0,
          totalViews: 0,
          totalVideos: 0,
          totalShorts: 0
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching channel content:', error);
      res.status(500).json({ error: 'Failed to fetch channel content' });
    }
  });

  // Get a single channel by slug
  app.get('/api/web3-channels/slug/:slug', async (req, res) => {
    try {
      const channels = await storage.getAllWeb3Channels();
      const channel = channels.find(c => c.slug === req.params.slug);

      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Transform channel data similar to the main channels endpoint
      const transformedChannel = {
        id: channel.id,
        name: channel.name,
        description: channel.description || '',
        avatarUrl: channel.avatarCid ? (channel.avatarCid.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${channel.avatarCid}` : channel.avatarCid) : null,
        coverUrl: channel.coverCid ? (channel.coverCid.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${channel.coverCid}` : channel.coverCid) : null,
        coinAddress: channel.coinAddress,
        metadataUri: channel.metadataUri || '',
        transactionHash: channel.txHash || '',
        owner: channel.owner || channel.createdBy,
        creatorUsername: channel.owner ? `${channel.owner.slice(0, 6)}...${channel.owner.slice(-4)}` : 'creator',
        ticker: channel.ticker || channel.name.toUpperCase().slice(0, 8),
        category: channel.category || 'General',
        chainId: channel.chainId || 8453,
        slug: channel.slug || channel.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        postsCount: 0,
        holderCount: 0,
        marketCap: 0,
        creatorAvatar: channel.avatarUrl // Use channel avatar as creator avatar for now
      };

      res.json(transformedChannel);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch channel by slug' });
    }
  });

  app.get("/api/web3-channels/owner/:owner", async (req, res) => {
    try {
      const channel = await storage.getWeb3ChannelByOwner(req.params.owner);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getWeb3ChannelByOwner"));
    }
  });

  // Get user channel data
  app.get('/api/me', async (req, res) => {
    try {
      const address = req.headers['x-wallet-address'] as string;

      if (!address) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      // Check if user has any channels
      const channels = await prisma.web3Channel.findMany({
        where: {
          OR: [
            { owner: { equals: address, mode: 'insensitive' } },
            { createdBy: { equals: address, mode: 'insensitive' } }
          ]
        }
      });

      if (channels.length > 0) {
        const channel = channels[0];
        return res.json({
          hasChannel: true,
          managerPath: `/channel/${channel.slug}/manager`,
          channel: {
            id: channel.id,
            name: channel.name,
            slug: channel.slug
          }
        });
      }

      return res.json({ hasChannel: false });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  // Update user profile
  app.put('/api/profile', async (req, res) => {
    try {
      const address = req.headers['x-wallet-address'] as string || req.body.address;
      const { name, description, avatarUrl } = req.body;

      if (!address) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      console.log('Profile update request:', { address, name, description, avatarUrl });

      // Check if profile exists
      const existingProfile = await db
        .select()
        .from(walletProfiles)
        .where(eq(walletProfiles.address, address))
        .limit(1);

      let profile;
      if (existingProfile.length > 0) {
        // Update existing profile
        [profile] = await db
          .update(walletProfiles)
          .set({
            name,
            description,
            avatarUrl,
            updatedAt: new Date()
          })
          .where(eq(walletProfiles.address, address))
          .returning();
      } else {
        // Create new profile
        [profile] = await db
          .insert(walletProfiles)
          .values({
            address,
            name,
            description,
            avatarUrl
          })
          .returning();
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: { name, description, avatarUrl }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Content Import API endpoints
  app.get("/api/content-imports", async (req, res) => {
    try {
      const channelId = req.query.channelId as string;
      if (!channelId) {
        return res.status(400).json({ message: "Channel ID is required" });
      }

      const contents = await storage.getContentImportsByChannel(channelId);
      res.json(contents);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getContentImportsByChannel"));
    }
  });

  app.get("/api/content-imports/:id", async (req, res) => {
    try {
      const content = await storage.getContentImport(req.params.id);
      if (!content) {
        return res.status(404).json({ message: "Content import not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getContentImport"));
    }
  });

  app.post("/api/content-imports", async (req, res) => {
    try {
      const validatedData = insertContentImportSchema.parse(req.body);
      const content = await storage.createContentImport(validatedData);
      res.status(201).json(content);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid content data", errors: error.errors });
      } else {
        res.status(500).json(handleDatabaseError(error, "createContentImport"));
      }
    }
  });

  app.patch("/api/content-imports/:id", async (req, res) => {
    try {
      const updates = req.body;
      const content = await storage.updateContentImport(req.params.id, updates);
      if (!content) {
        return res.status(404).json({ message: "Content import not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "updateContentImport"));
    }
  });

  app.delete("/api/content-imports/:id", async (req, res) => {
    try {
      await storage.deleteContentImport(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "deleteContentImport"));
    }
  });

  // Marketplace endpoint - get all tokenized content
  app.get("/api/marketplace", async (req, res) => {
    try {
      // Get all content imports from database that are tokenized
      const tokenizedContent = await storage.getAllContentImports().then(content =>
        content.filter(item => item.status === 'tokenized')
      );
      res.json(tokenizedContent)
    } catch (error) {
      console.error('Error fetching marketplace content:', error)
      res.status(500).json({ message: 'Failed to fetch marketplace content' })
    }
  });

  // IPFS Upload endpoint for file uploads
  app.post("/api/content-imports/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const { channelId, contentType, title, description, coinName, coinSymbol } = req.body;

      if (!contentType || !title) {
        return res.status(400).json({ message: "Missing required fields: contentType, title" });
      }

      console.log(`📤 Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);

      // Upload file to IPFS
      const file = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });

      const mediaCid = await uploadFileToIPFS(file);
      console.log(`✅ File uploaded to IPFS: ${mediaCid}`);

      // Create metadata JSON
      const metadata = {
        title,
        description: description || '',
        contentType,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString()
      };

      // Upload metadata to IPFS
      const metadataCid = await uploadJSONToIPFS(metadata);
      console.log(`✅ Metadata uploaded to IPFS: ${metadataCid}`);

      // Always return success response with IPFS data (database-independent)
      const publicContent = {
        id: `public-${Date.now()}`,
        title,
        description,
        contentType,
        mediaCid,
        ipfsCid: metadataCid,
        metadata,
        status: 'uploaded',
        coinName: coinName || req.file.originalname.replace(/\.[^/.]+$/, ""),
        coinSymbol: coinSymbol || req.file.originalname.slice(0, 6).toUpperCase().replace(/[^A-Z]/g, ""),
        createdAt: new Date()
      };

      // Try to save to database if available, but don't fail if database is down
      if (channelId && channelId !== 'public') {
        try {
          const existingChannel = await storage.getChannel(channelId);
          if (existingChannel) {
            const contentData = {
              channelId,
              title,
              description,
              contentType,
              mediaCid,
              ipfsCid: metadataCid,
              metadata,
              status: 'uploaded' as const,
              coinName: coinName || req.file.originalname.replace(/\.[^/.]+$/, ""),
              coinSymbol: coinSymbol || req.file.originalname.slice(0, 6).toUpperCase().replace(/[^A-Z]/g, "")
            };

            const content = await storage.createContentImport(contentData);
            console.log(`💾 Content saved to database: ${content.id}`);

            res.json({
              success: true,
              content,
              mediaCid,
              metadataCid
            });
            return;
          }
        } catch (dbError) {
          console.warn(`⚠️ Database unavailable, continuing with IPFS-only upload:`, dbError);
        }
      }

      // Return IPFS-only response (fallback when database is unavailable)
      res.json({
        success: true,
        content: publicContent,
        mediaCid,
        metadataCid,
        message: "Content uploaded to IPFS successfully (database unavailable)"
      });

    } catch (error) {
      console.error("❌ Content upload error:", error);
      res.status(500).json({
        message: "Failed to upload content to IPFS",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Enhanced URL Import endpoint for shorts content
  app.post("/api/content-imports/import-url", async (req, res) => {
    try {
      const { url, channelId, contentType, title, description, coinName, coinSymbol } = req.body;

      if (!url || !contentType || !title || !coinName || !coinSymbol) {
        return res.status(400).json({ message: "Missing required fields: url, contentType, title, coinName, coinSymbol" });
      }

      // Import the shorts processor
      const { shortsProcessor } = await import('./shortsProcessor');

      // For reel/video content, use enhanced processing
      if (contentType === 'reel') {
        console.log(`Processing shorts content from: ${url}`);

        // Process the video URL
        const processResult = await shortsProcessor.processShorts(url);

        if (!processResult.success) {
          return res.status(400).json({
            message: processResult.error || "Failed to process shorts content"
          });
        }

        const { videoInfo, videoCid, thumbnailCid } = processResult;

        // Create comprehensive metadata
        const metadata = {
          title: videoInfo?.title || title,
          description: videoInfo?.description || description || '',
          contentType,
          originalUrl: url,
          platform: videoInfo?.platform,
          duration: videoInfo?.duration,
          importedAt: new Date().toISOString(),
          videoCid,
          thumbnailCid
        };

        // Upload metadata to IPFS
        const metadataCid = await uploadJSONToIPFS(metadata);

        // For public imports, don't save to database, just return IPFS data
        if (!channelId || channelId === 'public') {
          const publicId = `public-${Date.now()}`;

          // For public imports, also try to create a creator coin entry
          try {
            await db.insert(creatorCoins).values({
              id: publicId,
              creatorAddress: 'public',
              title: videoInfo?.title || title,
              description: videoInfo?.description || description,
              contentType,
              coinName,
              coinSymbol,
              mediaCid: videoCid,
              thumbnailCid,
              metadataUri: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
              originalUrl: url,
              status: 'uploaded',
              currency: 'ETH',
              currentPrice: '0',
              startingMarketCap: '0',
              platform: videoInfo?.platform || 'Unknown'
            });
          } catch (error) {
            console.warn('⚠️ Failed to create public creator coin entry:', error);
          }

          res.json({
            success: true,
            content: {
              id: publicId,
              title: videoInfo?.title || title,
              description: videoInfo?.description || description,
              contentType,
              originalUrl: url,
              ipfsCid: metadataCid,
              mediaCid: videoCid,
              thumbnailCid,
              metadata,
              status: 'ready',
              coinName,
              coinSymbol,
              createdAt: new Date()
            },
            metadataCid,
            videoCid,
            thumbnailCid
          });
          return;
        }

        // Save content import record with media CIDs
        const contentData = {
          channelId,
          title: videoInfo?.title || title,
          description: videoInfo?.description || description,
          contentType,
          originalUrl: url,
          ipfsCid: metadataCid,
          mediaCid: videoCid,
          thumbnailCid,
          metadata,
          status: 'ready' as const,
          coinName,
          coinSymbol
        };

        const content = await storage.createContentImport(contentData);

        // Also create a creator coin entry so it appears on /contentcoins page
        try {
          await db.insert(creatorCoins).values({
            id: content.id, // Use same ID to link them
            creatorAddress: channelId,
            title: videoInfo?.title || title,
            description: videoInfo?.description || description,
            contentType,
            coinName,
            coinSymbol,
            mediaCid: videoCid,
            thumbnailCid,
            metadataUri: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
            originalUrl: url,
            status: 'uploaded',
            currency: 'ETH',
            currentPrice: '0',
            startingMarketCap: '0',
            platform: videoInfo?.platform || 'Unknown'
          });
          console.log('✅ Created creator coin entry for imported content');
        } catch (error) {
          console.warn('⚠️ Failed to create creator coin entry:', error);
          // Don't fail the entire request if this fails
        }

        res.json({
          success: true,
          content,
          metadataCid,
          videoCid,
          thumbnailCid,
          videoInfo
        });

      } else {
        // For non-video content, use basic metadata processing
        const metadata = {
          title,
          description: description || '',
          contentType,
          originalUrl: url,
          importedAt: new Date().toISOString()
        };

        const metadataCid = await uploadJSONToIPFS(metadata);

        if (!channelId || channelId === 'public') {
          res.json({
            success: true,
            content: {
              id: `public-${Date.now()}`,
              title,
              description,
              contentType,
              originalUrl: url,
              ipfsCid: metadataCid,
              metadata,
              status: 'ready',
              coinName,
              coinSymbol,
              createdAt: new Date()
            },
            metadataCid
          });
          return;
        }

        const contentData = {
          channelId,
          title,
          description,
          contentType,
          originalUrl: url,
          ipfsCid: metadataCid,
          metadata,
          status: 'ready' as const,
          coinName,
          coinSymbol
        };

        const content = await storage.createContentImport(contentData);

        res.json({
          success: true,
          content,
          metadataCid
        });
      }

    } catch (error) {
      console.error("URL import error:", error);
      res.status(500).json({ message: "Failed to import content from URL" });
    }
  });

  // File upload endpoint for IPFS
  app.post("/api/upload/file", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Upload file to IPFS
      const cid = await uploadFileToIPFS(req.file);

      res.json({
        success: true,
        cid,
        url: `https://gateway.pinata.cloud/ipfs/${cid}`
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file to IPFS" });
    }
  });

  // Tokenize content endpoint
  app.post("/api/content-imports/:id/tokenize", async (req, res) => {
    try {
      // Update status to tokenizing
      await storage.updateContentImport(req.params.id, { status: 'tokenizing' });

      // Simulate tokenization process (replace with actual Doppler integration)
      setTimeout(async () => {
        try {
          await storage.updateContentImport(req.params.id, {
            status: 'tokenized',
            tokenizedAt: new Date()
          });
        } catch (error) {
          console.error("Tokenization completion error:", error);
          await storage.updateContentImport(req.params.id, { status: 'failed' });
        }
      }, 3000);

      res.json({ message: "Tokenization started" });
    } catch (error) {
      console.error("Tokenization error:", error);
      res.status(500).json({ message: "Failed to start tokenization" });
    }
  });

  // ==================== PADROUTES (pump.fun style tokens) ====================

  // Get all pads (with optional deployed filter)
  app.get("/api/pads", async (req, res) => {
    try {
      let pads = await storage.getAllPads();

      // Filter for deployed pads if requested
      if (req.query.deployed === 'true') {
        pads = pads.filter(pad =>
          pad.status === 'deployed' ||
          pad.status === 'graduated' ||
          (pad.tokenAddress && pad.deploymentTxHash)
        );
      }

      res.json(pads);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getAllPads"));
    }
  });

  // Get pad by ID
  app.get("/api/pads/:id", async (req, res) => {
    try {
      const pad = await storage.getPad(req.params.id);
      if (!pad) {
        return res.status(404).json({ message: "Pad not found" });
      }
      res.json(pad);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getPad"));
    }
  });

  // Get pads by creator
  app.get("/api/pads/creator/:address", async (req, res) => {
    try {
      const pads = await storage.getPadsByCreator(req.params.address);
      res.json(pads);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getPadsByCreator"));
    }
  });

  // Create new pad
  app.post("/api/pads", async (req, res) => {
    try {
      const validatedData = insertPadSchema.parse(req.body);
      const pad = await storage.createPad(validatedData);

      // TODO: Integrate Doppler V4 SDK for token deployment
      // For now, we'll set status to pending and deploy later

      res.status(201).json(pad);
    } catch (error) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid pad data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createPad"));
      }
    }
  });

  // Update pad (for deployment status, token address, etc.)
  app.patch("/api/pads/:id", async (req, res) => {
    try {
      const updates = req.body;
      const pad = await storage.updatePad(req.params.id, updates);
      if (!pad) {
        return res.status(404).json({ message: "Pad not found" });
      }
      res.json(pad);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "updatePad"));
    }
  });

  // Delete pad
  app.delete("/api/pads/:id", async (req, res) => {
    try {
      await storage.deletePad(req.params.id);
      res.json({ message: "Pad deleted successfully" });
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "deletePad"));
    }
  });

  // Search pads
  app.get("/api/pads/search/:query", async (req, res) => {
    try {
      const pads = await storage.searchPads(req.params.query);
      res.json(pads);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "searchPads"));
    }
  });

  // ==================== PAD INTERACTION ROUTES ====================

  // Like a pad
  app.post("/api/pads/:id/like", async (req, res) => {
    try {
      const { userAddress } = req.body;
      if (!userAddress) {
        return res.status(400).json({ message: "User address required" });
      }

      await storage.likePad(req.params.id, userAddress);
      res.json({ message: "Pad liked successfully" });
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "likePad"));
    }
  });

  // Unlike a pad
  app.delete("/api/pads/:id/like", async (req, res) => {
    try {
      const { userAddress } = req.body;
      if (!userAddress) {
        return res.status(400).json({ message: "User address required" });
      }

      await storage.unlikePad(req.params.id, userAddress);
      res.json({ message: "Pad unliked successfully" });
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "unlikePad"));
    }
  });

  // Get pad likes
  app.get("/api/pads/:id/likes", async (req, res) => {
    try {
      const likes = await storage.getPadLikes(req.params.id);
      res.json(likes);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getPadLikes"));
    }
  });

  // Check if user liked pad
  app.get("/api/pads/:id/likes/:userAddress", async (req, res) => {
    try {
      const like = await storage.getUserPadLike(req.params.id, req.params.userAddress);
      res.json({ liked: !!like, like });
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getUserPadLike"));
    }
  });

  // ==================== PAD COMMENT ROUTES ====================

  // Get pad comments
  app.get("/api/pads/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPadComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getPadComments"));
    }
  });

  // Create pad comment
  app.post("/api/pads/:id/comments", async (req, res) => {
    try {
      const validatedData = insertPadCommentSchema.parse({
        ...req.body,
        padId: req.params.id
      });

      const comment = await storage.createPadComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createPadComment"));
      }
    }
  });

  // Delete pad comment
  app.delete("/api/pads/comments/:commentId", async (req, res) => {
    try {
      await storage.deletePadComment(req.params.commentId);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "deletePadComment"));
    }
  });

  // ==================== DOPPLER TRADING ENDPOINTS ====================

  // Get Doppler token info
  app.get("/api/doppler/tokens/:address", async (req, res) => {
    res.status(501).json({
      message: "Doppler V4 system has been removed",
      error: "Use bonding curve system instead"
    });
  });

  // Doppler quote endpoint removed  
  app.post("/api/doppler/quote", async (req, res) => {
    res.status(501).json({
      message: "Doppler V4 system has been removed",
      error: "Use bonding curve system for quotes"
    });
  });

  // Doppler buy endpoint removed
  app.post("/api/doppler/buy", async (req, res) => {
    res.status(501).json({
      message: "Doppler V4 system has been removed",
      error: "Use bonding curve system for trading"
    });
  });

  // ==================== PAD DEPLOYMENT ENDPOINT ====================

  // Deploy pad token using bonding curve system (Doppler system removed)
  app.post("/api/pads/:id/deploy", async (req, res) => {
    let padId = req.params.id;

    try {
      console.log(`Deployment requested for pad ${padId}, but Doppler system has been removed`);

      const pad = await storage.getPad(padId);
      if (!pad) {
        return res.status(404).json({ message: "Pad not found" });
      }

      return res.status(501).json({
        message: "Doppler V4 system has been removed - use bonding curve system for token deployment",
        error: "Pad deployment no longer supported"
      });
    } catch (error: any) {
      console.error(`❌ Pad ${padId} deployment failed:`, error);
      res.status(500).json({
        success: false,
        error: true,
        message: `Doppler system removed - deployment not available`,
        details: "Use bonding curve system for token deployment",
        padId: padId
      });
    }
  });

  // Creator Coins routes
  app.get("/api/creator-coins", async (req, res) => {
    try {
      const coins = await db.select().from(creatorCoins).orderBy(desc(creatorCoins.createdAt));
      res.json(coins);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getAllCreatorCoins"));
    }
  });

  app.get("/api/creator-coins/:id", async (req, res) => {
    try {
      const identifier = req.params.id;
      let coin;

      // Check if the identifier is a contract address (starts with 0x) or database ID
      if (identifier.startsWith('0x')) {
        // Look up by contract address
        coin = await db.select().from(creatorCoins).where(eq(creatorCoins.coinAddress, identifier)).limit(1);
      } else {
        // Look up by database ID
        coin = await db.select().from(creatorCoins).where(eq(creatorCoins.id, identifier)).limit(1);
      }

      if (!coin.length) {
        return res.status(404).json({ message: "Creator coin not found" });
      }
      res.json(coin[0]);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getCreatorCoin"));
    }
  });

  app.post("/api/creator-coins/upload", upload.single('file'), async (req, res) => {
    console.log('📤 Creator coin upload started');
    console.log('Request body:', req.body);
    console.log('File info:', req.file ? {
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'No file');

    try {
      if (!req.file) {
        console.error('❌ No file provided in upload request');
        return res.status(400).json({ message: "No file provided" });
      }

      const {
        creatorAddress, title, description, contentType,
        coinName, coinSymbol, currency, startingMarketCap,
        twitter, discord, website
      } = req.body;

      console.log('📋 Upload parameters:', {
        creatorAddress, title, contentType, coinName, coinSymbol, currency, startingMarketCap
      });

      // Validate required fields
      if (!creatorAddress || !title || !coinName || !coinSymbol || !contentType) {
        console.error('❌ Missing required fields:', {
          creatorAddress: !!creatorAddress,
          title: !!title,
          coinName: !!coinName,
          coinSymbol: !!coinSymbol,
          contentType: !!contentType
        });
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate content for tokenization
      const validation = validateContentForTokenization(contentType, req.file.size);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      console.log('📤 Uploading file to IPFS...');
      // Upload file to IPFS
      const file = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });

      const mediaCid = await uploadFileToIPFS(file);
      console.log('✅ File uploaded to IPFS:', mediaCid);

      // Generate thumbnail if needed
      console.log('🖼️ Generating thumbnail...');
      const thumbnailCid = await generateThumbnail(contentType, mediaCid);
      console.log('Thumbnail CID:', thumbnailCid);

      // Create Zora metadata
      console.log('📝 Creating Zora metadata...');
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${mediaCid}`;

      let metadataUri: string | null = null;
      try {
        metadataUri = await createZoraMetadata({
          name: coinName,
          description: description || `Creator coin for ${title}`,
          imageUrl,
          contentType,
          attributes: [
            { trait_type: 'Original Title', value: title },
            { trait_type: 'Creator', value: creatorAddress },
            { trait_type: 'Currency', value: currency || 'ETH' }
          ]
        });
        console.log('✅ Metadata created successfully:', metadataUri);
      } catch (metadataError) {
        console.error('❌ Failed to create metadata:', metadataError);
        console.error('Metadata error details:', metadataError instanceof Error ? metadataError.stack : metadataError);
        // Fail the upload if metadata creation fails
        return res.status(500).json({
          error: "Metadata creation failed",
          details: metadataError instanceof Error ? metadataError.message : 'Unknown error'
        });
      }

      // Create creator coin in database
      const coinData = {
        creatorAddress,
        title,
        description,
        contentType,
        mediaCid,
        thumbnailCid,
        metadataUri: metadataUri,
        coinName,
        coinSymbol,
        currency: currency || 'ETH',
        startingMarketCap: startingMarketCap || 'LOW',
        twitter: twitter || null,
        discord: discord || null,
        website: website || null,
        status: 'pending' as const
      };

      console.log('💾 Saving coin to database...', coinData);
      const validatedCoinData = insertCreatorCoinSchema.parse(coinData);
      const [newCoin] = await db.insert(creatorCoins).values(validatedCoinData).returning();

      // Trigger notification for content coin creation
      await triggerNotification('content_coin_created', {
        creatorAddress: newCoin.creatorAddress,
        coinName: newCoin.coinName,
        coinId: newCoin.id
      });

      // Also trigger upload success notification
      await triggerNotification('content_uploaded', {
        creatorAddress: newCoin.creatorAddress,
        title: newCoin.title,
        coinName: newCoin.coinName,
        coinSymbol: newCoin.coinSymbol,
        contentType: newCoin.contentType,
        coinId: newCoin.id
      });

      console.log('✅ Upload completed successfully:', newCoin);

      res.status(201).json({
        message: "Content uploaded successfully",
        coin: newCoin,
        mediaCid,
        metadataUri: metadataUri
      });
    } catch (error) {
      console.error("❌ Creator coin upload error:", error);
      console.error("Full error details:", error instanceof Error ? error.stack : error);

      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        console.error('Validation errors:', (error as any).errors);
        res.status(400).json({ message: "Invalid coin data", errors: (error as any).errors });
      } else {
        res.status(500).json(handleDatabaseError(error, "uploadCreatorCoin"));
      }
    }
  });

  app.post("/api/creator-coins/:id/deploy", async (req, res) => {
    const coinId = req.params.id;
    console.log(`🚀 Starting deployment for creator coin: ${coinId}`);

    try {
      const coin = await db.select().from(creatorCoins).where(eq(creatorCoins.id, coinId)).limit(1);

      if (!coin.length) {
        console.error(`❌ Creator coin not found: ${coinId}`);
        return res.status(404).json({ message: "Creator coin not found" });
      }

      const coinData = coin[0];
      console.log(`📋 Found creator coin:`, {
        id: coinData.id,
        name: coinData.coinName,
        symbol: coinData.coinSymbol,
        status: coinData.status,
        creator: coinData.creatorAddress
      });

      // Allow redeployment of failed coins
      if (coinData.status !== 'pending' && coinData.status !== 'failed') {
        console.error(`❌ Invalid coin status: ${coinData.status}, expected: pending or failed`);
        return res.status(400).json({
          message: `Coin cannot be deployed (current status: ${coinData.status}). Only pending or failed coins can be deployed.`,
          currentStatus: coinData.status,
          allowedStatuses: ['pending', 'failed']
        });
      }

      // Check if metadata URI exists before starting deployment
      if (!coinData.metadataUri || coinData.metadataUri.trim() === '') {
        console.error(`❌ No metadata URI found for coin ${coinId}`);
        return res.status(400).json({
          message: "Cannot deploy coin without valid metadata URI. Please re-upload the content.",
          details: "Metadata creation failed during upload process"
        });
      }

      console.log(`⏳ Updating coin status to 'creating'...`);
      // Update status to creating and clear any previous error info
      await db.update(creatorCoins)
        .set({
          status: 'creating',
          updatedAt: new Date(),
          deploymentTxHash: null // Clear previous failed tx hash if any
        })
        .where(eq(creatorCoins.id, coinId));

      console.log(`🔧 Creating coin with Zora SDK...`);
      console.log(`Deployment params:`, {
        name: coinData.coinName,
        symbol: coinData.coinSymbol,
        metadataUri: coinData.metadataUri,
        startingMarketCap: coinData.startingMarketCap,
        currency: coinData.currency,
        creator: coinData.creatorAddress
      });

      // Check if we have valid metadata before deployment
      if (!coinData.metadataUri) {
        throw new Error('Cannot deploy coin without valid metadata URI. Metadata creation failed.');
      }

      // Create coin using Zora SDK with retry logic for IPFS issues
      let deploymentResult;
      try {
        deploymentResult = await createCreatorCoin({
          name: coinData.coinName,
          symbol: coinData.coinSymbol,
          uri: coinData.metadataUri,
          currency: coinData.currency,
          creatorAddress: coinData.creatorAddress
        });
      } catch (error: any) {
        // If it's an IPFS/metadata issue, try one more time after a delay
        if (error.message?.includes('Metadata fetch failed') || error.message?.includes('429')) {
          console.log('🔄 Retrying deployment after IPFS gateway issue...');
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

          deploymentResult = await createCreatorCoin({
            name: coinData.coinName,
            symbol: coinData.coinSymbol,
            uri: coinData.metadataUri,
            currency: coinData.currency,
            creatorAddress: coinData.creatorAddress
          });
        } else {
          throw error;
        }
      }

      console.log(`✅ Zora Creator Coin deployed successfully:`, deploymentResult);

      // Update coin with deployment info immediately (before additional services)
      await db.update(creatorCoins)
        .set({
          status: 'deployed',
          coinAddress: deploymentResult.coinAddress,
          deploymentTxHash: deploymentResult.txHash,
          updatedAt: new Date()
        })
        .where(eq(creatorCoins.id, coinId));



      // Trigger multiple notifications for successful creator coin creation
      await triggerNotification('creator_coin_created', {
        creatorAddress: coinData.creatorAddress,
        coinName: coinData.coinName,
        coinId: coinData.id
      });

      // Also trigger a deployment confirmation notification
      await triggerNotification('creator_coin_deployed', {
        creatorAddress: coinData.creatorAddress,
        coinName: coinData.coinName,
        coinSymbol: coinData.coinSymbol,
        coinId: coinData.id,
        coinAddress: deploymentResult.coinAddress,
        txHash: deploymentResult.txHash,
        deploymentStatus: 'success'
      });

      console.log(`✅ Creator coin deployment completed for ${coinId}`);

      res.json({
        success: true,
        coin: {
          id: coinId,
          coinAddress: deploymentResult.coinAddress,
          txHash: deploymentResult.txHash,
          factoryAddress: deploymentResult.factoryAddress,
          status: 'deployed',
          message: 'Creator coin deployed successfully to Zora network.'
        }
      });
    } catch (error) {
      console.error("Creator coin deployment error:", error);

      // Mark coin as failed
      try {
        await db.update(creatorCoins)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(creatorCoins.id, req.params.id));
      } catch (updateError) {
        console.error("Failed to update coin status:", updateError);
      }

      res.status(500).json({
        message: "Failed to deploy creator coin",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  





  // Get creator coin holders with real blockchain data
  app.get('/api/creator-coins/:coinId/holders', async (req, res) => {
    try {
      const { coinId } = req.params;
      console.log(`🔍 Fetching holders for creator coin: ${coinId}`);

      // First, get the creator coin to find the contract address
      const coin = await db.select().from(creatorCoins).where(eq(creatorCoins.id, coinId)).limit(1);

      if (!coin.length) {
        return res.status(404).json({ error: 'Creator coin not found' });
      }

      const coinData = coin[0];
      const coinAddress = coinData.coinAddress;

      if (!coinAddress || coinAddress === 'Deploying...' || coinAddress.length < 10) {
        console.log(`⚠️ No valid contract address for coin ${coinId}, returning empty holders`);
        return res.json([]);
      }

      // Get real holders data from blockchain
      const holdersData = await getTokenHolders(coinAddress);

      console.log(`✅ Found ${holdersData.totalHolders} holders for creator coin ${coinId}`);

      // Update the database with the current holder count
      await db.update(creatorCoins)
        .set({
          holders: holdersData.totalHolders,
          updatedAt: new Date()
        })
        .where(eq(creatorCoins.id, coinId));

      res.json(holdersData.holders);

    } catch (error) {
      console.error('Error fetching creator coin holders:', error);
      res.status(500).json({
        error: 'Failed to fetch holders',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all creators who have deployed content coins
  app.get('/api/creators', async (req, res) => {
    try {
      console.log('📋 Fetching creators from content coins...');

      // Get unique creators with their stats
      const creatorsData = await db
        .select({
          creatorAddress: creatorCoins.creatorAddress,
          creatorCoinsCount: sql`COUNT(*)`.as('creator_coins_count'),
          totalLikes: sql`SUM(COALESCE(likes, 0))`.as('total_likes'),
          totalComments: sql`SUM(COALESCE(comments, 0))`.as('total_comments'),
          firstCreated: sql`MIN(${creatorCoins.createdAt})`.as('first_created'),
          latestCreated: sql`MAX(${creatorCoins.createdAt})`.as('latest_created')
        })
        .from(creatorCoins)
        .where(sql`${creatorCoins.creatorAddress} IS NOT NULL AND ${creatorCoins.creatorAddress} != ''`)
        .groupBy(creatorCoins.creatorAddress)
        .orderBy(sql`COUNT(*) DESC`);

      console.log(`✅ Found ${creatorsData.length} unique creators`);

      // Get profile data for all creators
      const profilesPromises = creatorsData.map(async (creator) => {
        try {
          const profile = await db
            .select()
            .from(walletProfiles)
            .where(eq(walletProfiles.address, creator.creatorAddress))
            .limit(1);

          return profile[0] || null;
        } catch (error) {
          console.warn(`Failed to fetch profile for ${creator.creatorAddress}:`, error);
          return null;
        }
      });

      const profiles = await Promise.all(profilesPromises);

      // Transform the data for frontend with profile data
      const creators = creatorsData.map((creator, index) => {
        const profile = profiles[index];

        return {
          id: creator.creatorAddress,
          address: creator.creatorAddress,
          name: profile?.name || creator.creatorAddress,
          username: `@${creator.creatorAddress.slice(0, 8)}`,
          avatarUrl: profile?.avatarUrl || null,
          contentCoins: parseInt(creator.creatorCoinsCount as string),
          totalLikes: parseInt(creator.totalLikes as string) || 0,
          totalComments: parseInt(creator.totalComments as string) || 0,
          memberSince: creator.firstCreated,
          lastActive: 'Today',
          rank: index + 1
        };
      });

      res.json(creators);
    } catch (error) {
      console.error('❌ Error fetching creators:', error);
      res.status(500).json({
        error: 'Failed to fetch creators',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all creator coins
  app.get('/api/creator-coins', async (req, res) => {
    try {
      console.log('📋 Fetching all creator coins...');

      const allCoins = await db.select().from(creatorCoins).orderBy(sql`${creatorCoins.createdAt} DESC`);

      console.log(`✅ Found ${allCoins.length} creator coins`);
      res.status(200).json(allCoins);
    } catch (error) {
      console.error('❌ Error fetching creator coins:', error);
      res.status(500).json({
        error: 'Failed to fetch creator coins',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get latest deployed coin with contract details
  app.get('/api/latest-deployed-coin', async (req, res) => {
    try {
      console.log('🔍 Fetching latest deployed coin...');

      const latestDeployedCoin = await db
        .select()
        .from(creatorCoins)
        .where(sql`${creatorCoins.status} = 'deployed' AND ${creatorCoins.coinAddress} IS NOT NULL AND ${creatorCoins.coinAddress} != ''`)
        .orderBy(sql`${creatorCoins.createdAt} DESC`)
        .limit(1);

      if (!latestDeployedCoin.length) {
        return res.status(404).json({ message: 'No deployed coins found' });
      }

      const coin = latestDeployedCoin[0];

      // Generate explorer links
      const contractAddress = coin.coinAddress;
      const txHash = coin.deploymentTxHash;

      const explorerLinks = {
        contractUrl: `https://sepolia.basescan.org/token/${contractAddress}`,
        txUrl: txHash ? `https://sepolia.basescan.org/tx/${txHash}` : null,
        addressUrl: `https://sepolia.basescan.org/address/${contractAddress}`
      };

      console.log(`✅ Found latest deployed coin: ${coin.coinName} (${coin.coinSymbol})`);
      console.log(`📋 Contract: ${contractAddress}`);
      console.log(`🔗 Explorer: ${explorerLinks.contractUrl}`);

      res.json({
        coin,
        contractAddress,
        explorerLinks,
        network: 'Base Sepolia',
        explorerName: 'BaseScan'
      });

    } catch (error) {
      console.error('❌ Error fetching latest deployed coin:', error);
      res.status(500).json({
        error: 'Failed to fetch latest deployed coin',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ====================
  // NOTIFICATIONS SYSTEM API
  // ====================

  // Get user notifications
  app.get("/api/notifications/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const { limit = 50, unreadOnly = false } = req.query;

      const notifications = await storage.getNotifications(
        address,
        parseInt(limit as string),
        unreadOnly === 'true'
      );

      res.json(notifications);
    } catch (error) {
      const dbError = handleDatabaseError(error, 'getNotifications');
      if (dbError.error) {
        // Return empty array for notifications when DB is down
        console.warn('Database unavailable, returning empty notifications');
        res.json([]);
        return;
      }
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Create notification (triggered by system events)
  app.post('/api/notifications', async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create notification' });
      }
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Mark all notifications as read for user
  app.patch('/api/notifications/:userAddress/read-all', async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.params.userAddress);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/:address/unread-count", async (req, res) => {
    try {
      const { address } = req.params;
      const count = await storage.getUnreadNotificationCount(address);
      res.json({ count });
    } catch (error) {
      const dbError = handleDatabaseError(error, 'getUnreadNotificationCount');
      if (dbError.error) {
        // Return 0 count when DB is down
        console.warn('Database unavailable, returning 0 unread count');
        res.json({ count: 0 });
        return;
      }
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: 'Failed to fetch unread count' });
    }
  });

  // Delete notification
  app.delete('/api/notifications/:id', async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  // ==================== ENHANCED SUBSCRIPTIONS API
  // ====================

  // Subscribe to channel with preferences
  app.post('/api/subscriptions/enhanced', async (req, res) => {
    try {
      const validatedData = insertEnhancedSubscriptionSchema.parse(req.body);

      // Check if subscription already exists
      const existing = await storage.getEnhancedSubscription(
        validatedData.subscriberAddress,
        validatedData.channelId,
        validatedData.web3ChannelId
      );

      if (existing) {
        return res.status(409).json({ error: 'Subscription already exists' });
      }

      const subscription = await storage.createEnhancedSubscription(validatedData);

      // Create notification for channel owner
      const channelId = validatedData.channelId || validatedData.web3ChannelId;
      if (channelId) {
        await storage.createNotification({
          recipientAddress: validatedData.subscriberAddress, // This would actually be the channel owner
          title: 'New Subscriber',
          message: `${validatedData.subscriberAddress.slice(0, 6)}...${validatedData.subscriberAddress.slice(-4)} subscribed to your channel`,
          type: 'subscription',
          entityType: validatedData.channelId ? 'channel' : 'web3_channel',
          entityId: channelId,
          actorAddress: validatedData.subscriberAddress,
          actionUrl: validatedData.channelId ? `/channels/${validatedData.channelId}` : `/channel/${channelId}`
        });
      }

      res.status(201).json(subscription);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create subscription' });
      }
    }
  });

  // Unsubscribe from channel
  app.delete('/api/subscriptions/enhanced', async (req, res) => {
    try {
      const { subscriberAddress, channelId, web3ChannelId } = req.query;

      await storage.deleteEnhancedSubscription(
        subscriberAddress as string,
        channelId as string,
        web3ChannelId as string
      );

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  });

  // Get user's subscriptions
  app.get('/api/subscriptions/:userAddress', async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptionsByAddress(req.params.userAddress);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });

  // Update subscription preferences
  app.patch('/api/subscriptions/:id/preferences', async (req, res) => {
    try {
      await storage.updateSubscriptionPreferences(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  // ==================== CHANNEL ANALYTICS API
  // ====================

  // Get channel analytics
  app.get('/api/analytics/channel', async (req, res) => {
    try {
      const { channelId, web3ChannelId } = req.query;

      const analytics = await storage.getChannelAnalytics(
        channelId as string,
        web3ChannelId as string
      );

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Get real subscriber count
  app.get('/api/analytics/subscribers', async (req, res) => {
    try {
      const { channelId, web3ChannelId } = req.query;

      const count = await storage.getChannelSubscriberCount(
        channelId as string,
        web3ChannelId as string
      );

      res.json({ subscriberCount: count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch subscriber count' });
    }
  });

  // Create/update channel analytics
  app.post('/api/analytics/channel', async (req, res) => {
    try {
      const validatedData = insertChannelAnalyticsSchema.parse(req.body);
      const analytics = await storage.createChannelAnalytics(validatedData);
      res.status(201).json(analytics);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid analytics data", errors: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create analytics' });
      }
    }
  });

  // ==================== CHANNEL COMMENTS API
  // ====================

  // Get channel comments
  app.get('/api/channel-comments', async (req, res) => {
    try {
      const { channelId, web3ChannelId } = req.query;

      const comments = await storage.getChannelComments(
        channelId as string,
        web3ChannelId as string
      );

      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  // Create channel comment
  app.post('/api/channel-comments', async (req, res) => {
    try {
      const validatedData = insertChannelCommentSchema.parse(req.body);
      const comment = await storage.createChannelComment(validatedData);

      // Create notification for channel owner
      const channelId = validatedData.channelId || validatedData.web3ChannelId;
      if (channelId && validatedData.authorAddress) {
        await storage.createNotification({
          recipientAddress: validatedData.authorAddress, // Would be channel owner in real implementation
          title: 'New Comment',
          message: `${validatedData.authorName || 'Someone'} commented on your channel`,
          type: 'comment',
          entityType: validatedData.channelId ? 'channel' : 'web3_channel',
          entityId: channelId,
          actorAddress: validatedData.authorAddress,
          actorName: validatedData.authorName,
          actorAvatar: validatedData.authorAvatar,
          actionUrl: validatedData.channelId ? `/channels/${validatedData.channelId}` : `/channel/${channelId}`
        });
      }

      res.status(201).json(comment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create comment' });
      }
    }
  });

  // Like channel comment
  app.post('/api/channel-comments/:id/like', async (req, res) => {
    try {
      await storage.likeChannelComment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to like comment' });
    }
  });

  // Pin/unpin channel comment
  app.patch('/api/channel-comments/:id/pin', async (req, res) => {
    try {
      const { isPinned } = req.body;
      await storage.pinChannelComment(req.params.id, isPinned);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to pin comment' });
    }
  });

  // Delete channel comment
  app.delete('/api/channel-comments/:id', async (req, res) => {
    try {
      await storage.deleteChannelComment(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  // ====================
  // ADVANCED SEARCH API
  // ====================

  // Advanced channel search with filters
  app.get('/api/search/channels', async (req, res) => {
    try {
      const {
        q: query = '',
        category,
        sortBy = 'relevance',
        userAddress
      } = req.query;

      const filters = {
        categoryFilter: category as string,
        sortBy: sortBy as string,
        filterType: 'channel'
      };

      const results = await storage.searchChannelsAdvanced(query as string, filters);

      // Save search filter for analytics if user address provided
      if (userAddress) {
        await storage.saveSearchFilter({
          userAddress: userAddress as string,
          searchQuery: query as string,
          filterType: 'channel',
          categoryFilter: category as string,
          sortBy: sortBy as string,
          resultsFound: results.length
        });
      }

      res.json({
        query,
        filters,
        results,
        count: results.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to search channels' });
    }
  });

  // Get user search history
  app.get('/api/search/history/:userAddress', async (req, res) => {
    try {
      const history = await storage.getUserSearchHistory(req.params.userAddress);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch search history' });
    }
  });

  // ====================
  // TRIGGER NOTIFICATIONS FOR PLATFORM EVENTS
  // ====================

  // Helper function to trigger notifications for various platform events
  async function triggerNotification(type: string, data: any) {
    try {
      switch (type) {
        case 'token_trade':
          await storage.createNotification({
            recipientAddress: data.recipientAddress,
            title: data.tradeType === 'buy' ? 'Token Purchase' : 'Token Sale',
            message: `${data.amount} ${data.tokenSymbol} ${data.tradeType === 'buy' ? 'bought' : 'sold'} for ${data.price} ETH`,
            type: 'trade',
            entityType: 'token',
            entityId: data.tokenId,
            actorAddress: data.traderAddress,
            metadata: { amount: data.amount, price: data.price, tradeType: data.tradeType },
            actionUrl: `/token/${data.tokenId}`
          });

          // Send Telegram notification for trade
          const telegramService = getTelegramService();
          if (telegramService) {
            await telegramService.notifyTrade({
              type: data.tradeType.toUpperCase() as 'BUY' | 'SELL',
              coinSymbol: data.tokenSymbol,
              amount: data.amount,
              price: data.price,
              trader: data.traderAddress
            }).catch(err => console.log('Telegram notification failed:', err));
          }
          break;

        case 'content_coin_launch':
          await storage.createNotification({
            recipientAddress: data.recipientAddress,
            title: 'New Content Coin',
            message: `${data.creatorName} launched a new content coin: ${data.coinName}`,
            type: 'content_coin',
            entityType: 'content_coin',
            entityId: data.coinId,
            actorAddress: data.creatorAddress,
            actorName: data.creatorName,
            actionUrl: `/content-coin/${data.coinId}`
          });
          break;

        case 'follow':
          await storage.createNotification({
            recipientAddress: data.recipientAddress,
            title: 'New Follower',
            message: `${data.followerName} started following you`,
            type: 'follow',
            entityType: 'user',
            entityId: data.followerId,
            actorAddress: data.followerAddress,
            actorName: data.followerName,
            actionUrl: `/profile/${data.followerAddress}`
          });
          break;

        case 'channel_created':
          await storage.createNotification({
            recipientAddress: data.creatorAddress,
            title: 'Channel Created',
            message: `You successfully created channel "${data.channelName}"`,
            type: 'channel_created',
            entityType: 'channel',
            entityId: data.channelId,
            actorAddress: data.creatorAddress,
            actionUrl: `/channel/${data.channelId}`
          });
          break;

        case 'video_uploaded':
          await storage.createNotification({
            recipientAddress: data.creatorAddress,
            title: 'Video Uploaded',
            message: `Your video "${data.videoTitle}" has been uploaded successfully`,
            type: 'video_uploaded',
            entityType: 'video',
            entityId: data.videoId,
            actorAddress: data.creatorAddress,
            actionUrl: `/video/${data.videoId}`
          });
          break;

        case 'video_liked':
          await storage.createNotification({
            recipientAddress: data.videoOwnerAddress,
            title: 'Video Liked',
            message: `${data.likerName || 'Someone'} liked your video "${data.videoTitle}"`,
            type: 'like',
            entityType: 'video',
            entityId: data.videoId,
            actorAddress: data.likerAddress,
            actorName: data.likerName,
            actionUrl: `/video/${data.videoId}`
          });
          break;

        case 'comment_posted':
          await storage.createNotification({
            recipientAddress: data.recipientAddress,
            title: 'New Comment',
            message: `${data.commenterName || 'Someone'} commented on your ${data.entityType}`,
            type: 'comment',
            entityType: data.entityType,
            entityId: data.entityId,
            actorAddress: data.commenterAddress,
            actorName: data.commenterName,
            actionUrl: `/${data.entityType}/${data.entityId}`
          });
          break;

        case 'subscription_created':
          await storage.createNotification({
            recipientAddress: data.channelOwnerAddress,
            title: 'New Subscriber',
            message: `${data.subscriberName || 'Someone'} subscribed to your channel`,
            type: 'subscription',
            entityType: 'channel',
            entityId: data.channelId,
            actorAddress: data.subscriberAddress,
            actorName: data.subscriberName,
            actionUrl: `/channel/${data.channelId}`
          });
          break;

        case 'creator_coin_created':
          await storage.createNotification({
            recipientAddress: data.creatorAddress,
            title: 'Content Coin Created',
            message: `Your content coin "${data.coinName}" has been created successfully`,
            type: 'content_coin',
            entityType: 'content_coin',
            entityId: data.coinId,
            actorAddress: data.creatorAddress,
            actionUrl: `/content-coin/${data.coinId}`
          });
          break;

        case 'creator_coin_deployed':
          await storage.createNotification({
            recipientAddress: data.creatorAddress,
            title: 'Content Coin Deployed! 🚀',
            message: `Your content coin "${data.coinName}" (${data.coinSymbol}) has been successfully deployed to the blockchain! Contract: ${data.coinAddress?.slice(0, 6)}...${data.coinAddress?.slice(-4)}`,
            type: 'content_coin',
            entityType: 'content_coin',
            entityId: data.coinId,
            actorAddress: data.creatorAddress,
            metadata: {
              coinAddress: data.coinAddress,
              txHash: data.txHash,
              deploymentStatus: data.deploymentStatus
            },
            actionUrl: `/content-coin/${data.coinId}`
          });
          break;

        case 'content_uploaded':
          await storage.createNotification({
            recipientAddress: data.creatorAddress,
            title: 'Content Uploaded Successfully! ✅',
            message: `Your ${data.contentType} "${data.title}" has been uploaded and is ready for deployment as "${data.coinName}" (${data.coinSymbol})`,
            type: 'content_coin',
            entityType: 'content_coin',
            entityId: data.coinId,
            actorAddress: data.creatorAddress,
            actionUrl: `/content-coin/${data.coinId}`
          });
          break;

        case 'creator_coin_liked':
          await storage.createNotification({
            recipientAddress: data.coinOwnerAddress,
            title: 'Content Coin Liked',
            message: `${data.likerName || 'Someone'} liked your content coin "${data.coinName}"`,
            type: 'like',
            entityType: 'content_coin',
            entityId: data.coinId,
            actorAddress: data.likerAddress,
            actorName: data.likerName,
            actionUrl: `/content-coin/${data.coinId}`
          });
          break;

        case 'creator_coin_trade':
          await storage.createNotification({
            recipientAddress: data.coinOwnerAddress,
            title: 'Content Coin Trade',
            message: `${data.traderName || 'Someone'} ${data.tradeType} ${data.amount} of your content coin for ${data.price} ETH`,
            type: 'trade',
            entityType: 'content_coin',
            entityId: data.coinId,
            actorAddress: data.traderAddress,
            actorName: data.traderName,
            metadata: { amount: data.amount, price: data.price, tradeType: data.tradeType },
            actionUrl: `/content-coin/${data.coinId}`
          });
          break;

        case 'web3_channel_created':
          await storage.createNotification({
            recipientAddress: data.creatorAddress,
            title: 'Web3 Channel Created',
            message: `Your Web3 channel "${data.channelName}" has been created with token ${data.tokenSymbol}`,
            type: 'channel_created',
            entityType: 'web3_channel',
            entityId: data.channelId,
            actorAddress: data.creatorAddress,
            actionUrl: `/channel/${data.channelId}`
          });
          break;
      }
    } catch (error) {
      console.error('Failed to trigger notification:', error);
    }
  }


  // Trade notification endpoint
  app.post('/api/trades/notify', async (req, res) => {
    try {
      const { type, coinSymbol, amount, price, trader, coinId } = req.body;

      if (!type || !coinSymbol || !amount || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Send internal notification
      await triggerNotification('token_trade', {
        recipientAddress: trader,
        tradeType: type.toLowerCase(),
        amount,
        tokenSymbol: coinSymbol,
        price,
        tokenId: coinId,
        traderAddress: trader
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Trade notification error:', error);
      res.status(500).json({ error: 'Failed to send trade notification' });
    }
  });

  // DexScreener API endpoint for real trading data
  app.get('/api/dexscreener/:tokenAddress', async (req, res) => {
    try {
      const { tokenAddress } = req.params;

      if (!tokenAddress) {
        return res.status(400).json({ error: 'Token address is required' });
      }

      console.log(`🔍 Fetching DexScreener data for: ${tokenAddress}`);

      // Import getDexScreenerData function
      const { getDexScreenerData } = await import('./dexscreener.js');
      const dexData = await getDexScreenerData(tokenAddress);

      if (!dexData.price) {
        return res.status(404).json({
          error: 'No trading data found',
          message: 'Token not actively traded on DEX platforms'
        });
      }

      // Return the real trading data
      res.json({
        price: dexData.price,
        marketCap: dexData.marketCap,
        volume24h: dexData.volume24h,
        priceChange24h: dexData.priceChange24h,
        pairUrl: dexData.chartData ? `https://dexscreener.com/base/${tokenAddress}` : undefined,
        dexName: 'Uniswap V3'
      });

    } catch (error) {
      console.error('DexScreener API error:', error);
      res.status(500).json({
        error: 'Failed to fetch trading data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Leaderboard endpoints
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const { category = 'overall' } = req.query;

      // Get all user wallet profiles with their metrics
      const usersWithMetrics = await db
        .select({
          address: walletProfiles.address,
          name: walletProfiles.name,
          avatarUrl: walletProfiles.avatarUrl,
          isVerified: walletProfiles.isVerified,
          createdAt: walletProfiles.createdAt,
          // Count content created (creator coins)
          contentsCreated: sql<number>`COALESCE(content.count, 0)`.as('contentsCreated'),
          // Count channels created
          channelsCreated: sql<number>`COALESCE(channels.count, 0)`.as('channelsCreated'),
          // Count trades made
          tradesCount: sql<number>`COALESCE(trades.count, 0)`.as('tradesCount'),
          // Total volume traded
          volumeTraded: sql<string>`COALESCE(trades.volume, '0')`.as('volumeTraded'),
          // Unique tokens traded
          uniqueTokensTraded: sql<number>`COALESCE(trades.unique_tokens, 0)`.as('uniqueTokensTraded'),
          // Total likes from creator coins
          totalLikes: sql<number>`COALESCE(content.total_likes, 0)`.as('totalLikes'),
        })
        .from(walletProfiles)
        .leftJoin(
          sql`(
            SELECT creator_address, COUNT(*) as count, SUM(COALESCE(likes, 0)) as total_likes
            FROM creator_coins
            WHERE status = 'deployed'
            GROUP BY creator_address
          ) as content`,
          sql`${walletProfiles.address} = content.creator_address`
        )
        .leftJoin(
          sql`(
            SELECT owner as creator_address, COUNT(*) as count
            FROM web3_channels
            WHERE owner IS NOT NULL
            GROUP BY owner
          ) as channels`,
          sql`${walletProfiles.address} = channels.creator_address`
        )
        .leftJoin(
          sql`(
            SELECT
              user_address as trader_address,
              COUNT(*) as count,
              SUM(CAST(COALESCE(amount, '0') AS DECIMAL)) as volume,
              COUNT(DISTINCT coin_id) as unique_tokens
            FROM creator_coin_trades
            WHERE user_address IS NOT NULL
            GROUP BY user_address
          ) as trades`,
          sql`${walletProfiles.address} = trades.trader_address`
        )
        .orderBy(sql`COALESCE(content.count, 0) + COALESCE(channels.count, 0) + COALESCE(trades.count, 0) DESC`)
        .limit(100);

      // Transform the data to match the frontend interface
      const leaderboardData = usersWithMetrics.map((user, index) => {
        const totalViews = 0; // Real analytics data needed
        const totalLikes = parseInt(user.totalLikes) || 0; // Use real likes from database
        const totalSubscribers = 0; // Real subscriber count needed

        // Calculate overall score based on various metrics
        const overallScore =
          (user.contentsCreated * 10) +
          (user.channelsCreated * 20) +
          (user.tradesCount * 5) +
          (user.uniqueTokensTraded * 15) +
          (totalLikes * 0.1) +
          (totalViews * 0.01);

        return {
          id: user.address,
          rank: index + 1,
          address: user.address,
          username: user.name || `User ${user.address.slice(0, 8)}`,
          avatar: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.address}`,

          // Content metrics
          contentsCreated: user.contentsCreated,
          totalViews,
          totalLikes,

          // Trading metrics
          tradesCount: user.tradesCount,
          volumeTraded: user.volumeTraded + ' ETH',
          uniqueTokensTraded: user.uniqueTokensTraded,

          // Channel metrics
          channelsCreated: user.channelsCreated,
          totalSubscribers,

          // Earnings metrics - use real transaction data only
          totalEarnings: '0.00 ETH', // Calculate from actual trading fees
          creatorRewards: '0.000 ETH', // Calculate from actual content monetization
          tradingProfit: '0.000 ETH', // Calculate from actual trading profits

          // Overall score
          overallScore: Math.round(overallScore),

          // Social info - remove random generation
          socialLinks: {
            x: false, // Real social verification needed
            farcaster: false, // Real social verification needed
            tiktok: false, // Real social verification needed
          },
          memberSince: new Date(user.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
          }),
          lastActive: 'Today',
        };
      });

      // Sort by category
      const sortedData = leaderboardData.sort((a, b) => {
        switch (category) {
          case 'content':
            return b.contentsCreated - a.contentsCreated || b.totalViews - a.totalViews;
          case 'trading':
            return b.tradesCount - a.tradesCount || parseFloat(b.volumeTraded) - parseFloat(a.volumeTraded);
          case 'channels':
            return b.channelsCreated - a.channelsCreated || b.totalSubscribers - a.totalSubscribers;
          case 'earnings':
            return parseFloat(b.totalEarnings) - parseFloat(a.totalEarnings);
          default: // overall
            return b.overallScore - a.overallScore;
        }
      });

      // Update ranks after sorting
      const finalData = sortedData.map((user, index) => ({
        ...user,
        rank: index + 1
      }));

      res.json(finalData);
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      res.status(500).json(handleDatabaseError(error, "getLeaderboard"));
    }
  });

  app.get("/api/leaderboard/stats", async (req, res) => {
    try {
      // Get global platform statistics
      const totalUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(walletProfiles)
        .then(result => result[0]?.count || 0);

      const totalContent = await db
        .select({ count: sql<number>`count(*)` })
        .from(creatorCoins)
        .where(sql`${creatorCoins.status} = 'deployed'`)
        .then(result => result[0]?.count || 0);

      const totalTrades = await db
        .select({ count: sql<number>`count(*)` })
        .from(creatorCoinTrades)
        .then(result => result[0]?.count || 0);

      const totalVolumeResult = await db
        .select({ volume: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(creatorCoinTrades)
        .then(result => result[0]?.volume || '0');

      const totalChannels = await db
        .select({ count: sql<number>`count(*)` })
        .from(web3Channels)
        .then(result => result[0]?.count || 0);

      // Calculate total earnings from real transaction data only
      const totalEarnings = '0.00 ETH'; // Sum of actual trading fees and rewards

      const globalStats = {
        totalUsers,
        totalContent,
        totalTrades,
        totalVolume: totalVolumeResult + ' ETH',
        totalChannels,
        totalEarnings,
      };

      res.json(globalStats);
    } catch (error) {
      console.error('Global stats fetch error:', error);
      res.status(500).json(handleDatabaseError(error, "getGlobalStats"));
    }
  });

  // Telegram bulk posting endpoints
  app.post("/api/telegram/sync/content", async (req, res) => {
    try {
      const telegramService = getTelegramService();
      if (!telegramService) {
        return res.status(503).json({ message: "Telegram service not available" });
      }

      console.log('🚀 API: Starting content sync to Telegram...');
      const success = await telegramService.postAllExistingContent();

      if (success) {
        res.json({
          success: true,
          message: "Content sync to Telegram completed successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Content sync to Telegram failed"
        });
      }
    } catch (error) {
      console.error('❌ API: Content sync error:', error);
      res.status(500).json({
        success: false,
        message: "Internal error during content sync"
      });
    }
  });

  app.post("/api/telegram/sync/channels", async (req, res) => {
    try {
      const telegramService = getTelegramService();
      if (!telegramService) {
        return res.status(503).json({ message: "Telegram service not available" });
      }

      console.log('🚀 API: Starting channels sync to Telegram...');
      const success = await telegramService.postAllExistingChannels();

      if (success) {
        res.json({
          success: true,
          message: "Channels sync to Telegram completed successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Channels sync to Telegram failed"
        });
      }
    } catch (error) {
      console.error('❌ API: Channels sync error:', error);
      res.status(500).json({
        success: false,
        message: "Internal error during channels sync"
      });
    }
  });

  app.post("/api/telegram/sync/all", async (req, res) => {
    try {
      const telegramService = getTelegramService();
      if (!telegramService) {
        return res.status(503).json({ message: "Telegram service not available" });
      }

      console.log('🚀 API: Starting complete data sync to Telegram...');
      const success = await telegramService.postAllExistingData();

      if (success) {
        res.json({
          success: true,
          message: "Complete data sync to Telegram completed successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Complete data sync to Telegram failed"
        });
      }
    } catch (error) {
      console.error('❌ API: Complete sync error:', error);
      res.status(500).json({
        success: false,
        message: "Internal error during complete sync"
      });
    }
  });

  // Register advanced trading routes
  registerAdvancedTradingRoutes(app);

  // Register content token routes
  const { setupContentTokenRoutes } = await import('./contentTokenRoutes');
  setupContentTokenRoutes(app);

  // Database health check
  app.get('/api/database/health', async (req, res) => {
    try {
      // Test database connection with a simple query
      const result = await db.execute(sql`SELECT 1 as health`);
      res.json({
        database: 'connected',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        database: 'disconnected',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Network health check
  app.get('/api/network/health', async (req, res) => {
    try {
      const { checkBaseSepoliaHealth } = await import('./networkHealth');
      const health = await checkBaseSepoliaHealth();

      if (health.healthy) {
        res.json({
          network: 'Base Sepolia',
          status: 'healthy',
          blockNumber: health.blockNumber?.toString(),
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          network: 'Base Sepolia',
          status: 'unhealthy',
          error: health.error,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({
        network: 'Base Sepolia',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });




  // Zora Trading API Endpoints
  app.post("/api/zora-trading/buy", async (req, res) => {
    try {
      const { tokenAddress, ethAmount, slippage = 0.05, senderAddress } = req.body;

      if (!zoraTradingService.isZoraTradingAvailable()) {
        return res.status(503).json({
          error: "Zora Trading only available on Base Mainnet",
          suggestion: "Deploy your tokens to Base Mainnet for trading access"
        });
      }

      const receipt = await zoraTradingService.buyTokenWithETH(
        tokenAddress,
        BigInt(ethAmount),
        slippage,
        senderAddress
      );

      res.json({
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });
    } catch (error) {
      console.error('Zora buy trade error:', error);
      res.status(500).json({
        error: 'Failed to execute buy trade',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/zora-trading/sell", async (req, res) => {
    try {
      const { tokenAddress, tokenAmount, slippage = 0.15, senderAddress } = req.body;

      if (!zoraTradingService.isZoraTradingAvailable()) {
        return res.status(503).json({
          error: "Zora Trading only available on Base Mainnet",
          suggestion: "Deploy your tokens to Base Mainnet for trading access"
        });
      }

      const receipt = await zoraTradingService.sellTokenForETH(
        tokenAddress,
        BigInt(tokenAmount),
        slippage,
        senderAddress
      );

      res.json({
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });
    } catch (error) {
      console.error('Zora sell trade error:', error);
      res.status(500).json({
        error: 'Failed to execute sell trade',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/zora-trading/swap", async (req, res) => {
    try {
      const { fromToken, toToken, amountIn, slippage = 0.05, senderAddress } = req.body;

      if (!zoraTradingService.isZoraTradingAvailable()) {
        return res.status(503).json({
          error: "Zora Trading only available on Base Mainnet",
          suggestion: "Deploy your tokens to Base Mainnet for trading access"
        });
      }

      const receipt = await zoraTradingService.swapTokens(
        fromToken,
        toToken,
        BigInt(amountIn),
        slippage,
        senderAddress
      );

      res.json({
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });
    } catch (error) {
      console.error('Zora swap trade error:', error);
      res.status(500).json({
        error: 'Failed to execute token swap',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/zora-trading/quote", async (req, res) => {
    try {
      const tradeParameters = req.body;

      const quote = await zoraTradingService.getTradeQuote(tradeParameters);

      res.json({
        success: true,
        quote,
        estimatedGas: quote.call ? 'calculated' : 'unavailable',
        routing: 'zora-automatic'
      });
    } catch (error) {
      console.error('Zora quote error:', error);
      res.status(500).json({
        error: 'Failed to get trade quote',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/zora-trading/status", async (req, res) => {
    res.json({
      available: zoraTradingService.isZoraTradingAvailable(),
      network: process.env.NODE_ENV === 'production' ? 'base-mainnet' : 'base-sepolia',
      features: {
        gaslessApprovals: true,
        crossTokenTrading: true,
        slippageProtection: true,
        automaticRouting: true
      },
      supportedTokens: ['ETH', 'USDC', 'ZORA', 'Creator Coins', 'Content Coins'],
      note: zoraTradingService.isZoraTradingAvailable()
        ? "Zora Trading fully available"
        : "Deploy to Base Mainnet for Zora Trading access"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}