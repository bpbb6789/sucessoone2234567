import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertVideoSchema, insertShortsSchema, insertChannelSchema, insertPlaylistSchema, 
  insertMusicAlbumSchema, insertCommentSchema, insertSubscriptionSchema,
  insertVideoLikeSchema, insertShortsLikeSchema, insertShareSchema,
  insertMusicTrackSchema, insertUserProfileSchema
} from "@shared/schema";
import { db } from "./db";

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

  const httpServer = createServer(app);
  return httpServer;
}