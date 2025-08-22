import { type ShortsWithChannel } from "@shared/schema";
import { formatViewCount } from "@/lib/constants";
import { Button } from "./ui/button";
import { useLocation } from "wouter";

interface ShortsCardProps {
  shorts: ShortsWithChannel;
  onClick?: () => void;
}

function ShortsCard({ shorts, onClick }: ShortsCardProps) {
  const [, setLocation] = useLocation();

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/token`);
  };
  return (
    <div 
      className="shorts-card cursor-pointer group relative"
      onClick={onClick}
      data-testid={`shorts-card-${shorts.id}`}
    >
      <div className="relative">
        <img
          src={shorts.thumbnailUrl}
          alt={shorts.title}
          className="w-full shorts-aspect object-cover rounded-xl"
          loading="lazy"
        />
        <Button
          onClick={handleBuyClick}
          className="absolute top-2 right-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 h-auto"
          size="sm"
        >
          BUY
        </Button>
      </div>
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

export default ShortsCard;
