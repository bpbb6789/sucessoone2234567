import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ShortsCard from "@/components/ShortsCard";
import { VideoCard } from "@/components/VideoCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { type ShortsWithChannel, type VideoWithChannel } from "@shared/schema";
import { formatViewCount } from "@/lib/constants";

const SHORTS_CATEGORIES = ["For you", "Following", "Channels", "Reels", "Music", "Podcasts"];
import { ThumbsUp, ThumbsDown, MessageCircle, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Shorts() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("For you");

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };
  
  const { data: allShorts = [], isLoading: shortsLoading, error: shortsError } = useQuery<ShortsWithChannel[]>({
    queryKey: ["/api/shorts"],
  });

  const { data: musicAlbums = [], isLoading: albumsLoading } = useQuery<any[]>({
    queryKey: ["/api/music/albums"],
    enabled: selectedCategory === "Music",
  });

  const { data: musicTracks = [], isLoading: tracksLoading } = useQuery<any[]>({
    queryKey: ["/api/music/tracks"],
    enabled: selectedCategory === "Music",
  });
  
  // Filter shorts based on selected category
  const shorts = selectedCategory === "For you" || selectedCategory === "Following" 
    ? allShorts 
    : allShorts.filter(short => 
        short.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        short.hashtags?.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()))
      );

  const isLoading = selectedCategory === "Music" ? (albumsLoading || tracksLoading) : shortsLoading;
  const error = shortsError;

  const handleAvatarClick = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    setLocation(`/profile/${channelId}`);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load shorts</h2>
          <p className="text-gray-500 dark:text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile vertical feed with category tabs
    return (
      <div className="shorts-container" data-testid="page-shorts-mobile">
        {/* Category Tabs - Always visible */}
        <div className="fixed top-4 left-0 right-0 z-50">
          <div className="flex space-x-2 px-4 overflow-x-auto scrollbar-hide">
            {SHORTS_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={cn(
                  "flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200",
                  selectedCategory === category
                    ? "bg-white text-black"
                    : "bg-white/20 text-white hover:bg-white/30"
                )}
                data-testid={`shorts-category-${category.toLowerCase().replace(' ', '-')}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Full Screen */}
        <div className="relative">
          {selectedCategory === "Music" ? (
            // Music Content
            <div className="pt-20 px-4 min-h-screen bg-gradient-to-b from-purple-900/20 to-black text-white">
              {isLoading ? (
                <div className="space-y-8">
                  {/* Albums skeleton */}
                  <div>
                    <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-gray-700 rounded-lg aspect-square mb-3"></div>
                          <div className="h-4 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Tracks skeleton */}
                  <div>
                    <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 animate-pulse">
                          <div className="w-12 h-12 bg-gray-700 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Featured Albums */}
                  {musicAlbums.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Featured Albums</h2>
                      <div className="grid grid-cols-2 gap-4">
                        {musicAlbums.slice(0, 4).map((album) => (
                          <div key={album.id} className="group cursor-pointer">
                            <div className="relative mb-3">
                              <img
                                src={album.coverUrl}
                                alt={album.title}
                                className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <h3 className="text-sm font-bold mb-1 truncate">
                              {album.title}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">
                              {album.artist}
                            </p>
                            <p className="text-xs text-gray-500">
                              {album.releaseYear} • {album.trackCount} tracks
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fresh Tracks */}
                  {musicTracks.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Fresh Tracks</h2>
                      <div className="space-y-2">
                        {musicTracks.slice(0, 8).map((track, index) => (
                          <div
                            key={track.id}
                            className="flex items-center space-x-4 p-2 rounded-lg hover:bg-white/10 group cursor-pointer"
                          >
                            <div className="w-6 text-gray-400 text-sm font-medium">
                              {index + 1}
                            </div>
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium truncate">
                                {track.title}
                              </h3>
                              <p className="text-xs text-gray-400 truncate">
                                {track.artist}
                              </p>
                            </div>
                            <div className="text-xs text-gray-400">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {musicAlbums.length === 0 && musicTracks.length === 0 && (
                    <div className="flex items-center justify-center min-h-[50vh] text-center">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">No music content</h2>
                        <p className="text-gray-300">No albums or tracks available</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Shorts Content
            shorts.length === 0 && !isLoading ? (
              <div className="flex items-center justify-center min-h-screen text-white">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">No {selectedCategory.toLowerCase()} shorts</h2>
                  <p className="text-gray-300">Try a different category</p>
                </div>
              </div>
            ) : (
              shorts.map((short, index) => (
          <div key={short.id} className="shorts-video relative bg-black flex items-center justify-center">
            <img
              src={short.thumbnailUrl}
              alt={short.title}
              className="w-full h-full object-cover"
              data-testid={`shorts-video-${short.id}`}
            />

            {/* BUY Button */}
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                className="bg-white text-black px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-200"
                data-testid={`button-buy-${short.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement buy functionality
                  console.log("Buy button clicked for:", short.id);
                }}
              >
                BUY
              </Button>
            </div>

            {/* Video Info Overlay */}
            <div className="absolute bottom-20 left-4 right-20 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src={short.channel.avatarUrl}
                  alt={short.channel.name}
                  className="w-8 h-8 rounded-full cursor-pointer"
                  onClick={(e) => handleAvatarClick(e, short.channel.id)}
                />
                <span className="text-sm font-medium">@{short.channel.handle}</span>
                <Button
                  size="sm"
                  className="bg-white text-black px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-200"
                  data-testid={`button-subscribe-${short.id}`}
                >
                  Subscribe
                </Button>
              </div>
              <p className="text-sm mb-1" data-testid={`shorts-description-${short.id}`}>
                {short.description}
              </p>
              <p className="text-xs opacity-75" data-testid={`shorts-views-mobile-${short.id}`}>
                {formatViewCount(short.viewCount || 0)} views
              </p>
            </div>

            {/* Engagement Buttons */}
            <div className="absolute right-4 bottom-20 flex flex-col space-y-6">
              <button
                className="flex flex-col items-center space-y-1 text-white"
                data-testid={`button-like-${short.id}`}
              >
                <ThumbsUp className="h-6 w-6" />
                <span className="text-xs">{formatViewCount(short.likeCount || 0)}</span>
              </button>
              <button
                className="flex flex-col items-center space-y-1 text-white"
                data-testid={`button-dislike-${short.id}`}
              >
                <ThumbsDown className="h-6 w-6" />
                <span className="text-xs">Dislike</span>
              </button>
              <button
                className="flex flex-col items-center space-y-1 text-white"
                data-testid={`button-comment-${short.id}`}
              >
                <MessageCircle className="h-6 w-6" />
                <span className="text-xs">{formatViewCount(short.commentCount || 0)}</span>
              </button>
              <button
                className="flex flex-col items-center space-y-1 text-white"
                data-testid={`button-share-${short.id}`}
              >
                <Share className="h-6 w-6" />
                <span className="text-xs">Share</span>
              </button>
              <button
                className="flex flex-col items-center space-y-1 text-white"
                data-testid={`button-more-${short.id}`}
              >
                <MoreVertical className="h-6 w-6" />
              </button>
            </div>
          </div>
            ))
            )
          )}
        </div>
      </div>
    );
  }

  // Desktop grid view
  return (
    <div className="p-4" data-testid="page-shorts">
      <h1 className="text-2xl font-bold mb-6">Shorts</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse" data-testid={`shorts-skeleton-${i}`}>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-xl shorts-aspect"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : shorts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No shorts found</h2>
          <p className="text-gray-500 dark:text-gray-400">No shorts available at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {shorts.map((short) => (
            <ShortsCard
              key={short.id}
              shorts={short}
              onClick={() => {
                // TODO: Navigate to shorts player
                console.log("Shorts clicked:", short.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}