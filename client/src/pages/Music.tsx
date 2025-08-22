import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/VideoCard";
import { type VideoWithChannel, type MusicAlbum } from "@shared/schema";

export default function Music() {
  const { data: musicVideos = [], isLoading: videosLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos", "Music"],
  });

  const { data: albums = [], isLoading: albumsLoading } = useQuery<MusicAlbum[]>({
    queryKey: ["/api/music/albums"],
  });

  const isLoading = videosLoading || albumsLoading;

  // Mock playlists data
  const playlists = [
    {
      id: "1",
      title: "Pop Hits 2024",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      songCount: 45,
    },
    {
      id: "2", 
      title: "Rock Classics",
      coverUrl: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      songCount: 67,
    },
    {
      id: "3",
      title: "Jazz Collection",
      coverUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      songCount: 23,
    },
    {
      id: "4",
      title: "Acoustic Sessions",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      songCount: 31,
    },
  ];

  return (
    <div className="p-4" data-testid="page-music">
      <h1 className="text-2xl font-bold mb-6">Music</h1>
      
      {/* Playlists Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Your playlists</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse" data-testid={`playlist-skeleton-${i}`}>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {playlists.map((playlist) => (
              <div 
                key={playlist.id} 
                className="cursor-pointer group"
                data-testid={`playlist-${playlist.id}`}
              >
                <img
                  src={playlist.coverUrl}
                  alt={playlist.title}
                  className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                />
                <h3 className="text-sm font-medium mt-2" data-testid={`playlist-title-${playlist.id}`}>
                  {playlist.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`playlist-count-${playlist.id}`}>
                  {playlist.songCount} songs
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Recommended Music */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Recommended for you</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse" data-testid={`music-video-skeleton-${i}`}>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-xl video-aspect"></div>
                <div className="flex space-x-3">
                  <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : musicVideos.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No music videos found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Music recommendations will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {musicVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => {
                  console.log("Music video clicked:", video.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
