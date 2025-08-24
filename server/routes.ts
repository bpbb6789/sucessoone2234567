import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import { storage } from "./storage";
import { uploadFileToIPFS, uploadJSONToIPFS } from './ipfs';
import { 
  insertVideoSchema, insertShortsSchema, insertChannelSchema, insertPlaylistSchema, 
  insertMusicAlbumSchema, insertCommentSchema, insertSubscriptionSchema,
  insertVideoLikeSchema, insertShortsLikeSchema, insertShareSchema,
  insertMusicTrackSchema, insertUserProfileSchema, insertTokenSchema, insertWeb3ChannelSchema,
  insertContentImportSchema
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { contentImports } from "@shared/schema";
import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();


// Helper function to handle database errors gracefully
function handleDatabaseError(error: any, operation: string) {
  console.error(`Database error in ${operation}:`, error);
  return {
    error: true,
    message: "Database temporarily unavailable",
    operation
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
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
      res.status(201).json(channel);
    } catch (error) {
      // res.status(400).json({ message: "Invalid channel data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid channel data", errors: error.errors });
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
      // res.status(500).json({ message: "Failed to fetch subscriptions" });
      res.status(500).json(handleDatabaseError(error, "getSubscriptionsByChannel"));
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error) {
      // res.status(400).json({ message: "Invalid subscription data" });
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      } else {
        res.status(400).json(handleDatabaseError(error, "createSubscription"));
      }
    }
  });

  app.delete("/api/subscriptions", async (req, res) => {
    try {
      const { subscriberChannelId, subscribedToChannelId } = req.body;
      await storage.deleteSubscription(subscriberChannelId, subscribedToChannelId);
      res.json({ message: "Subscription deleted" });
    } catch (error) {
      // res.status(500).json({ message: "Failed to delete subscription" });
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

  // Tokens API endpoints
  app.get("/api/tokens", async (req, res) => {
    try {
      // Get all tokens from storage (database)
      const tokens = await storage.getAllTokens();
      res.json(tokens);
    } catch (error) {
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

  // Token holder count endpoint
  app.post('/api/token-holders', async (req, res) => {
    try {
      const { tokenAddress } = req.body;

      if (!tokenAddress) {
        return res.status(400).json({ error: true, message: 'Token address is required' });
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

  const httpServer = createServer(app);
  // Web3 Channels API
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
      res.json(channels);
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getAllWeb3Channels"));
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

  app.get("/api/me", async (req, res) => {
    try {
      // Get wallet address from request headers or auth
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        return res.status(401).json({ message: "Wallet address required" });
      }

      const channel = await storage.getWeb3ChannelByOwner(walletAddress);

      if (channel) {
        res.json({ 
          hasChannel: true, 
          managerPath: `/channel/${channel.slug}/manager`,
          channel 
        });
      } else {
        res.json({ hasChannel: false });
      }
    } catch (error) {
      res.status(500).json(handleDatabaseError(error, "getUserProfile"));
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
      const tokenizedContent = await prisma.contentImport.findMany({
        where: {
          status: 'tokenized'
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
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

      if (!contentType || !title || !coinName || !coinSymbol) {
        return res.status(400).json({ message: "Missing required fields: contentType, title, coinName, coinSymbol" });
      }

      // Upload file to IPFS
      const file = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });

      const mediaCid = await uploadFileToIPFS(file);

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

      // For public uploads, don't save to database, just return IPFS data
      if (!channelId || channelId === 'public') {
        res.json({
          success: true,
          content: {
            id: `public-${Date.now()}`,
            title,
            description,
            contentType,
            mediaCid,
            ipfsCid: metadataCid,
            metadata,
            status: 'tokenizing',
            createdAt: new Date()
          },
          mediaCid,
          metadataCid
        });
        return;
      }

      // Verify channel exists before trying to save content import
      const existingChannel = await storage.getChannel(channelId);
      if (!existingChannel) {
        return res.status(400).json({ message: "Channel not found" });
      }

      // Save content import record only if valid channelId provided
      const contentData = {
        channelId,
        title,
        description,
        contentType,
        mediaCid,
        ipfsCid: metadataCid,
        metadata,
        status: 'tokenizing' as const,
        coinName: req.body.coinName || req.file.originalname.replace(/\.[^/.]+$/, ""),
        coinSymbol: req.body.coinSymbol || req.file.originalname.slice(0, 6).toUpperCase().replace(/[^A-Z]/g, "")
      };

      const content = await storage.createContentImport(contentData);

      // Auto-tokenize content after creation
      setTimeout(async () => {
        try {
          await storage.updateContentImport(content.id, { 
            status: 'tokenized',
            tokenizedAt: new Date()
          });
        } catch (error) {
          console.error("Auto-tokenization error:", error);
          await storage.updateContentImport(content.id, { status: 'failed' });
        }
      }, 2000);

      res.json({
        success: true,
        content,
        mediaCid,
        metadataCid
      });
    } catch (error) {
      console.error("Content upload error:", error);
      res.status(500).json({ message: "Failed to upload content to IPFS" });
    }
  });

  // URL Import endpoint
  app.post("/api/content-imports/import-url", async (req, res) => {
    try {
      const { url, channelId, contentType, title, description, coinName, coinSymbol } = req.body;

      if (!url || !contentType || !title || !coinName || !coinSymbol) {
        return res.status(400).json({ message: "Missing required fields: url, contentType, title, coinName, coinSymbol" });
      }

      // Create metadata for URL import
      const metadata = {
        title,
        description: description || '',
        contentType,
        originalUrl: url,
        importedAt: new Date().toISOString()
      };

      // Upload metadata to IPFS
      const metadataCid = await uploadJSONToIPFS(metadata);

      // For public imports, don't save to database, just return IPFS data
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
            status: 'tokenizing',
            createdAt: new Date()
          },
          metadataCid
        });
        return;
      }

      // Save content import record only if valid channelId provided
      const contentData = {
        channelId,
        title,
        description,
        contentType,
        originalUrl: url,
        ipfsCid: metadataCid,
        metadata,
        status: 'tokenizing' as const,
        coinName,
        coinSymbol
      };

      const content = await storage.createContentImport(contentData);

      // Auto-tokenize content after creation
      setTimeout(async () => {
        try {
          await storage.updateContentImport(content.id, { 
            status: 'tokenized',
            tokenizedAt: new Date()
          });
        } catch (error) {
          console.error("Auto-tokenization error:", error);
          await storage.updateContentImport(content.id, { status: 'failed' });
        }
      }, 2000);

      res.json({
        success: true,
        content,
        metadataCid
      });
    } catch (error) {
      console.error("URL import error:", error);
      res.status(500).json({ message: "Failed to import content from URL" });
    }
  });

  // Tokenize content endpoint
  app.post("/api/content-imports/:id/tokenize", async (req, res) => {
    try {
      // Update status to tokenizing
      await storage.updateContentImport(req.params.id, { status: 'tokenizing' });

      // Simulate tokenization process (replace with actual Zora SDK integration)
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

  return httpServer;
}