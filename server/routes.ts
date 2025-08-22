import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, insertShortsSchema, insertChannelSchema, insertPlaylistSchema, insertMusicAlbumSchema, insertCommentSchema, insertSubscriptionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Channels
  app.get("/api/channels", async (req, res) => {
    try {
      const channels = await storage.getAllChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channels" });
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
      res.status(500).json({ message: "Failed to fetch channel" });
    }
  });

  app.post("/api/channels", async (req, res) => {
    try {
      const validatedData = insertChannelSchema.parse(req.body);
      const channel = await storage.createChannel(validatedData);
      res.status(201).json(channel);
    } catch (error) {
      res.status(400).json({ message: "Invalid channel data" });
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
      res.status(500).json({ message: "Failed to fetch videos" });
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
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const validatedData = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      res.status(400).json({ message: "Invalid video data" });
    }
  });

  app.patch("/api/videos/:id/views", async (req, res) => {
    try {
      await storage.updateVideoViews(req.params.id);
      res.json({ message: "Views updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update views" });
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
      res.status(500).json({ message: "Failed to fetch shorts" });
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
      res.status(500).json({ message: "Failed to fetch shorts" });
    }
  });

  app.post("/api/shorts", async (req, res) => {
    try {
      const validatedData = insertShortsSchema.parse(req.body);
      const shorts = await storage.createShorts(validatedData);
      res.status(201).json(shorts);
    } catch (error) {
      res.status(400).json({ message: "Invalid shorts data" });
    }
  });

  app.patch("/api/shorts/:id/views", async (req, res) => {
    try {
      await storage.updateShortsViews(req.params.id);
      res.json({ message: "Views updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update views" });
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
      res.status(500).json({ message: "Failed to fetch playlists" });
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
      res.status(500).json({ message: "Failed to fetch playlist" });
    }
  });

  app.post("/api/playlists", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      res.status(201).json(playlist);
    } catch (error) {
      res.status(400).json({ message: "Invalid playlist data" });
    }
  });

  // Music Albums
  app.get("/api/music/albums", async (req, res) => {
    try {
      const albums = await storage.getAllMusicAlbums();
      res.json(albums);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch music albums" });
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
      res.status(500).json({ message: "Failed to fetch music album" });
    }
  });

  app.post("/api/music/albums", async (req, res) => {
    try {
      const validatedData = insertMusicAlbumSchema.parse(req.body);
      const album = await storage.createMusicAlbum(validatedData);
      res.status(201).json(album);
    } catch (error) {
      res.status(400).json({ message: "Invalid music album data" });
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
      res.status(500).json({ message: "Failed to fetch comments" });
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
      res.status(500).json({ message: "Failed to fetch comment" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  // Subscriptions
  app.get("/api/subscriptions/:channelId", async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptionsByChannel(req.params.channelId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(400).json({ message: "Invalid subscription data" });
    }
  });

  app.delete("/api/subscriptions", async (req, res) => {
    try {
      const { subscriberChannelId, subscribedToChannelId } = req.body;
      await storage.deleteSubscription(subscriberChannelId, subscribedToChannelId);
      res.json({ message: "Subscription deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
