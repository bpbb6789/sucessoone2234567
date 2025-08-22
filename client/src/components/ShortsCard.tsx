import { type ShortsWithChannel } from "@shared/schema";
import { formatViewCount } from "@/lib/constants";

interface ShortsCardProps {
  shorts: ShortsWithChannel;
  onClick?: () => void;
}

export function ShortsCard({ shorts, onClick }: ShortsCardProps) {
  return (
    <div 
      className="shorts-card cursor-pointer group"
      onClick={onClick}
      data-testid={`shorts-card-${shorts.id}`}
    >
      <img
        src={shorts.thumbnailUrl}
        alt={shorts.title}
        className="w-full shorts-aspect object-cover rounded-xl"
        loading="lazy"
      />
      <div className="mt-2">
        <h3 className="text-sm font-medium line-clamp-2" data-testid={`shorts-title-${shorts.id}`}>
          {shorts.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" data-testid={`shorts-views-${shorts.id}`}>
          {formatViewCount(shorts.viewCount || 0)} views
        </p>
      </div>
    </div>
  );
}
