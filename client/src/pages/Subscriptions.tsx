import { useQuery } from "@tanstack/react-query";
import VideoCard from "@/components/VideoCard";
import { type VideoWithChannel, type Channel } from "@shared/schema";

export default function Subscriptions() {
  const { data: videos = [], isLoading: videosLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos"],
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const isLoading = videosLoading || channelsLoading;

  return (
    <div className="p-4" data-testid="page-subscriptions">
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>
      
      {/* Latest Videos Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Latest videos</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse" data-testid={`video-skeleton-${i}`}>
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
        ) : videos.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No recent videos</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Videos from your subscriptions will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.slice(0, 8).map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => {
                  console.log("Video clicked:", video.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* All Subscriptions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All subscriptions</h2>
          <button 
            className="text-blue-500 hover:text-blue-600 text-sm"
            data-testid="button-manage-subscriptions"
          >
            Manage
          </button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="text-center animate-pulse" data-testid={`channel-skeleton-${i}`}>
                <div className="w-22 h-22 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No subscriptions</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Start subscribing to channels to see them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {channels.map((channel) => (
              <div 
                key={channel.id} 
                className="text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-youtube-dark-secondary rounded-lg p-2 transition-colors"
                data-testid={`subscription-channel-${channel.id}`}
              >
                <img
                  src={channel.avatarUrl}
                  alt={channel.name}
                  className="w-22 h-22 rounded-full mx-auto mb-2"
                />
                <h3 className="text-sm font-medium" data-testid={`channel-name-${channel.id}`}>
                  {channel.name}
                  {channel.verified && <span className="ml-1">✓</span>}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`channel-subscribers-${channel.id}`}>
                  {(channel.subscriberCount || 0).toLocaleString()} subscribers
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
