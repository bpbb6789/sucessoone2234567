import { db } from "../server/db";
import { channels, videos, shorts, musicAlbums, musicTracks, playlists } from "@shared/schema";

async function populateSampleData() {
  try {
    console.log("🌱 Populating sample data...");

    // Create sample channels
    const sampleChannels = [
      {
        id: "channel-1",
        name: "Tech Reviews",
        handle: "@techreviews",
        description: "Latest technology reviews and tutorials",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=center",
        bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=300&fit=crop&crop=center",
        verified: true,
        subscriberCount: 125000
      },
      {
        id: "channel-2", 
        name: "Cooking Master",
        handle: "@cookingmaster",
        description: "Delicious recipes and cooking tips for everyone",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center",
        bannerUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=300&fit=crop&crop=center",
        verified: true,
        subscriberCount: 89000
      },
      {
        id: "channel-3",
        name: "Music World",
        handle: "@musicworld", 
        description: "Discover new music and artists from around the globe",
        avatarUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center",
        bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=300&fit=crop&crop=center",
        verified: true,
        subscriberCount: 250000
      }
    ];

    await db.insert(channels).values(sampleChannels).onConflictDoNothing();
    console.log("✅ Sample channels created");

    // Create sample videos
    const sampleVideos = [
      {
        id: "video-1",
        title: "iPhone 15 Pro Review: Is It Worth the Upgrade?",
        description: "Complete review of the iPhone 15 Pro including camera tests, performance benchmarks, and battery life analysis.",
        thumbnailUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=640&h=360&fit=crop&crop=center",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        channelId: "channel-1",
        category: "Technology",
        viewCount: 45820,
        likeCount: 3200,
        dislikeCount: 89,
        duration: 720,
        publishedAt: new Date("2024-01-15")
      },
      {
        id: "video-2", 
        title: "Perfect Chocolate Chip Cookies Recipe",
        description: "Learn how to make the perfect chocolate chip cookies with this easy-to-follow recipe. Crispy edges, soft centers!",
        thumbnailUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=640&h=360&fit=crop&crop=center",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        channelId: "channel-2",
        category: "Food",
        viewCount: 22100,
        likeCount: 1850,
        dislikeCount: 12,
        duration: 480,
        publishedAt: new Date("2024-01-10")
      },
      {
        id: "video-3",
        title: "Top 10 Songs of 2024 So Far",
        description: "Countdown of the best songs released this year across all genres. What's your favorite?",
        thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop&crop=center",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        channelId: "channel-3",
        category: "Music",
        viewCount: 78500,
        likeCount: 5600,
        dislikeCount: 150,
        duration: 900,
        publishedAt: new Date("2024-01-12")
      }
    ];

    await db.insert(videos).values(sampleVideos).onConflictDoNothing();
    console.log("✅ Sample videos created");

    // Create sample shorts
    const sampleShorts = [
      {
        id: "shorts-1",
        title: "Quick Phone Photography Tips!",
        description: "Transform your photos with these 3 simple tricks #photography #tips",
        thumbnailUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=360&h=640&fit=crop&crop=center",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        channelId: "channel-1",
        viewCount: 12400,
        likeCount: 890,
        dislikeCount: 15,
        hashtags: ["photography", "tips", "phone"],
        publishedAt: new Date("2024-01-18")
      },
      {
        id: "shorts-2",
        title: "30-Second Pasta Hack",
        description: "Make perfect pasta every time with this simple trick! #cooking #pasta #lifehack",
        thumbnailUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=360&h=640&fit=crop&crop=center", 
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        channelId: "channel-2",
        viewCount: 8900,
        likeCount: 750,
        dislikeCount: 8,
        hashtags: ["cooking", "pasta", "lifehack"],
        publishedAt: new Date("2024-01-16")
      }
    ];

    await db.insert(shorts).values(sampleShorts).onConflictDoNothing();
    console.log("✅ Sample shorts created");

    // Create sample music albums
    const sampleAlbums = [
      {
        id: "album-1",
        title: "Chill Vibes Vol. 1",
        artist: "Various Artists",
        coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center",
        genre: "Chillout",
        releaseYear: 2024,
        trackCount: 12
      },
      {
        id: "album-2",
        title: "Electronic Dreams",
        artist: "Synth Master",
        coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center",
        genre: "Electronic",
        releaseYear: 2024,
        trackCount: 8
      }
    ];

    await db.insert(musicAlbums).values(sampleAlbums).onConflictDoNothing();
    console.log("✅ Sample music albums created");

    // Create sample music tracks
    const sampleTracks = [
      {
        id: "track-1",
        title: "Sunrise Meditation",
        artist: "Calm Sounds",
        albumId: "album-1",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
        duration: 180,
        trackNumber: 1
      },
      {
        id: "track-2", 
        title: "Ocean Waves",
        artist: "Nature Audio",
        albumId: "album-1",
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
        duration: 240,
        trackNumber: 2
      },
      {
        id: "track-3",
        title: "Digital Pulse",
        artist: "Synth Master",
        albumId: "album-2", 
        audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
        duration: 200,
        trackNumber: 1
      }
    ];

    await db.insert(musicTracks).values(sampleTracks).onConflictDoNothing();
    console.log("✅ Sample music tracks created");

    // Create sample playlists
    const samplePlaylists = [
      {
        id: "playlist-1",
        title: "Tech News Weekly",
        description: "Latest tech news and product reviews",
        channelId: "channel-1",
        thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center",
        videoIds: ["video-1"],
        isPublic: true
      },
      {
        id: "playlist-2",
        title: "Cooking Essentials", 
        description: "Must-know recipes for every home cook",
        channelId: "channel-2",
        thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center",
        videoIds: ["video-2"],
        isPublic: true
      }
    ];

    await db.insert(playlists).values(samplePlaylists).onConflictDoNothing();
    console.log("✅ Sample playlists created");

    console.log("🎉 Sample data population completed successfully!");

  } catch (error) {
    console.error("❌ Error populating sample data:", error);
    throw error;
  }
}

// Run the script if called directly
populateSampleData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { populateSampleData };