import { History, ThumbsUp, Clock, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type VideoWithChannel } from "@shared/schema";
import { formatTimeAgo } from "@/lib/constants";

const quickAccessItems = [
  { icon: History, label: "History", href: "/history" },
  { icon: ThumbsUp, label: "Liked videos", href: "/liked-videos" },
  { icon: Clock, label: "Watch later", href: "/watch-later" },
  { icon: Download, label: "Downloads", href: "/downloads" },
];

export default function Library() {
  const { data: recentVideos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos"],
  });

  return (
    <div className="p-4" data-testid="page-library">
      <h1 className="text-2xl font-bold mb-6">Library</h1>
      
      {/* Quick Access */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {quickAccessItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-gray-100 dark:bg-youtube-dark-secondary rounded-lg p-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-youtube-dark-hover transition-colors"
              data-testid={`quick-access-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <h3 className="font-medium">{item.label}</h3>
            </div>
          );
        })}
      </div>
      
      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recently watched</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-3 p-2 animate-pulse" data-testid={`recent-video-skeleton-${i}`}>
                <div className="w-42 h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentVideos.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No recent activity</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your recently watched videos will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentVideos.slice(0, 10).map((video) => (
              <div
                key={video.id}
                className="flex space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-youtube-dark-secondary cursor-pointer"
                data-testid={`recent-video-${video.id}`}
              >
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-42 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-medium line-clamp-2 mb-1" data-testid={`recent-video-title-${video.id}`}>
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`recent-video-channel-${video.id}`}>
                    {video.channel.name} • {(video.viewCount || 0).toLocaleString()} views
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`recent-video-watched-${video.id}`}>
                    Watched {formatTimeAgo(video.publishedAt || new Date())}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
