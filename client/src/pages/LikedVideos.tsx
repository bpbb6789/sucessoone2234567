import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/VideoCard";
import { type VideoWithChannel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Play, Shuffle } from "lucide-react";

export default function LikedVideos() {
  const { data: videos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos"],
  });

  // Mock liked videos (first 3 from the list)
  const likedVideos = videos.slice(0, 3);

  return (
    <div className="p-4" data-testid="page-liked-videos">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Liked videos</h1>
        {likedVideos.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Button className="bg-youtube-red hover:bg-red-600 text-white" data-testid="button-play-all-liked">
              <Play className="h-4 w-4 mr-2" />
              Play all
            </Button>
            <Button variant="outline" data-testid="button-shuffle-liked">
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
          </div>
        )}
        <p className="text-gray-500 dark:text-gray-400">
          {likedVideos.length} video{likedVideos.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse" data-testid={`liked-video-skeleton-${i}`}>
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
      ) : likedVideos.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No liked videos</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Videos you like will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {likedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => {
                console.log("Liked video clicked:", video.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
