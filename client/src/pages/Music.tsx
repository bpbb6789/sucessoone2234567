import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Pause, Heart, MoreHorizontal, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { type MusicAlbum, type MusicTrack } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MusicPlayerState {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export default function Music() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [player, setPlayer] = useState<MusicPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  const { data: albums = [], isLoading: albumsLoading } = useQuery<MusicAlbum[]>({
    queryKey: ["/api/music/albums"],
  });

  const { data: tracks = [], isLoading: tracksLoading } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music/tracks"],
  });

  const isLoading = albumsLoading || tracksLoading;

  const categories = ["All", "Music", "Podcasts"];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const playTrack = (track: MusicTrack) => {
    setPlayer({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: track.duration,
    });
  };

  const togglePlayPause = () => {
    setPlayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const featuredAlbums = albums.slice(0, 3);
  const todaysHits = tracks.filter(track => track.playCount > 3000000).slice(0, 6);
  const freshTracks = tracks.slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black text-white" data-testid="page-music">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                selectedCategory === category
                  ? "bg-green-500 text-black"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              )}
              data-testid={`music-category-${category.toLowerCase()}`}
            >
              {category}
            </button>
          ))}
        </div>

        </div>

      {/* Featured Albums */}
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Featured albums</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse" data-testid={`album-skeleton-${i}`}>
                <div className="bg-gray-700 rounded-lg aspect-square mb-4"></div>
                <div className="h-5 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAlbums.map((album) => (
              <div
                key={album.id}
                className="group cursor-pointer"
                data-testid={`featured-album-${album.id}`}
              >
                <div className="relative mb-4">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Play className="w-16 h-16 text-green-500" fill="currentColor" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-1" data-testid={`album-title-${album.id}`}>
                  {album.title}
                </h3>
                <p className="text-gray-400" data-testid={`album-artist-${album.id}`}>
                  {album.artist}
                </p>
                <p className="text-sm text-gray-500" data-testid={`album-info-${album.id}`}>
                  {album.releaseYear} • {album.trackCount} tracks
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Music Player */}
      {player.currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4" data-testid="music-player">
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            {/* Current Track Info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <img
                src={player.currentTrack.coverUrl}
                alt={player.currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-medium truncate" data-testid="player-track-title">
                  {player.currentTrack.title}
                </h4>
                <p className="text-xs text-gray-400 truncate" data-testid="player-track-artist">
                  {player.currentTrack.artist}
                </p>
              </div>
              <Heart className="w-4 h-4 text-gray-400 hover:text-green-500 cursor-pointer" />
            </div>

            {/* Player Controls */}
            <div className="flex items-center space-x-4">
              <Shuffle className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
              <SkipBack className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                data-testid="player-play-pause"
              >
                {player.isPlaying ? (
                  <Pause className="w-4 h-4 text-black" fill="currentColor" />
                ) : (
                  <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
                )}
              </button>
              <SkipForward className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            </div>

            {/* Volume & Progress */}
            <div className="flex items-center space-x-3 flex-1 justify-end">
              <span className="text-xs text-gray-400" data-testid="player-current-time">
                {formatDuration(player.currentTime)}
              </span>
              <div className="w-32 bg-gray-600 rounded-full h-1">
                <div 
                  className="bg-green-500 h-1 rounded-full" 
                  style={{ width: `${(player.currentTime / player.duration) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-400" data-testid="player-duration">
                {formatDuration(player.duration)}
              </span>
              <Volume2 className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
