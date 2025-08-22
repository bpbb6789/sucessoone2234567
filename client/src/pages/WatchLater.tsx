import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/VideoCard";
import { type VideoWithChannel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Play, Shuffle } from "lucide-react";

export default function WatchLater() {
  const { data: videos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos"],
  });

  // Mock watch later videos (first 5 from the list)
  const watchLaterVideos = videos.slice(0, 5);

  return (
    <div className="p-4" data-testid="page-watch-later">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Watch later</h1>
        {watchLaterVideos.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Button className="bg-youtube-red hover:bg-red-600 text-white" data-testid="button-play-all">
              <Play className="h-4 w-4 mr-2" />
              Play all
            </Button>
            <Button variant="outline" data-testid="button-shuffle">
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
          </div>
        )}
        <p className="text-gray-500 dark:text-gray-400">
          {watchLaterVideos.length} video{watchLaterVideos.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse" data-testid={`watch-later-skeleton-${i}`}>
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
      ) : watchLaterVideos.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No videos saved</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Save videos to watch them later
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {watchLaterVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => {
                console.log("Watch later video clicked:", video.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
