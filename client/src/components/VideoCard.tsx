import { type VideoWithChannel } from "@shared/schema";
import { formatViewCount, formatTimeAgo } from "@/lib/constants";

interface VideoCardProps {
  video: VideoWithChannel;
  onClick?: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div 
      className="video-card cursor-pointer"
      onClick={onClick}
      data-testid={`video-card-${video.id}`}
    >
      <div className="relative">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full video-aspect object-cover rounded-xl"
          loading="lazy"
        />
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>
      
      <div className="flex mt-3 space-x-3">
        <img
          src={video.channel.avatarUrl}
          alt={video.channel.name}
          className="w-9 h-9 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium line-clamp-2 mb-1" data-testid={`video-title-${video.id}`}>
            {video.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`video-channel-${video.id}`}>
            {video.channel.name}
            {video.channel.verified && (
              <span className="ml-1">✓</span>
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`video-stats-${video.id}`}>
            {formatViewCount(video.viewCount || 0)} views • {formatTimeAgo(video.publishedAt || new Date())}
          </p>
        </div>
      </div>
    </div>
  );
}
