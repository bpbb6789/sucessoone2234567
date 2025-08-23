import { useQuery } from "@tanstack/react-query";
import { type VideoWithChannel } from "@shared/schema";
import { formatTimeAgo } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { data: videos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos"],
  });

  if (isLoading) {
    return (
      <div className="p-4" data-testid="page-history-loading">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex space-x-3 p-2 animate-pulse" data-testid={`history-video-skeleton-${i}`}>
              <Skeleton className="w-42 h-24 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4" data-testid="page-history">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Watch history</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-search-history">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" size="sm" data-testid="button-clear-history">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Your watch history is empty</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Videos you watch will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex space-x-4 hover:bg-gray-50 dark:hover:bg-youtube-dark-secondary rounded-lg p-2 cursor-pointer"
              data-testid={`history-video-${video.id}`}
            >
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-48 h-28 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-medium line-clamp-2 mb-1" data-testid={`history-video-title-${video.id}`}>
                  {video.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1" data-testid={`history-video-channel-${video.id}`}>
                  {video.channel.name}
                  {video.channel.verified && <span className="ml-1">✓</span>}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400" data-testid={`history-video-stats-${video.id}`}>
                  {(video.viewCount || 0).toLocaleString()} views • {formatTimeAgo(video.publishedAt || new Date())}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Watched {formatTimeAgo(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}