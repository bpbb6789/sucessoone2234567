import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/hooks/useSearch";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { type VideoWithChannel, type ShortsWithChannel, type Channel } from "@shared/schema";
import { formatViewCount } from "@/lib/constants";

interface SearchBarProps {
  placeholder?: string;
  onResultSelect?: (result: VideoWithChannel | ShortsWithChannel | Channel, type: string) => void;
  className?: string;
}

export function SearchBar({ 
  placeholder = "Search videos, channels, and more...", 
  onResultSelect,
  className 
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { 
    query, 
    setQuery, 
    searchType, 
    setSearchType, 
    results, 
    isLoading, 
    hasResults 
  } = useSearch();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show results when we have query and results
  useEffect(() => {
    setShowResults(query.length > 2 && (hasResults || isLoading));
  }, [query, hasResults, isLoading]);

  const handleResultClick = (result: VideoWithChannel | ShortsWithChannel | Channel, type: string) => {
    onResultSelect?.(result, type);
    setShowResults(false);
    setIsFocused(false);
  };

  const clearSearch = () => {
    setQuery("");
    setShowResults(false);
  };

  const searchTypes = [
    { value: "all", label: "All" },
    { value: "videos", label: "Videos" },
    { value: "shorts", label: "Shorts" },
    { value: "channels", label: "Channels" }
  ];

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)} data-testid="search-bar">
      <div className="relative flex">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={cn(
            "pl-10 pr-20 py-2 w-full",
            isFocused && "ring-2 ring-blue-500 border-blue-500"
          )}
          data-testid="search-input"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {query && (
            <Button
              onClick={clearSearch}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              data-testid="clear-search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            data-testid="search-filter"
          >
            <Filter className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Search Type Filters */}
      {isFocused && (
        <div className="flex gap-1 mt-2">
          {searchTypes.map((type) => (
            <Badge
              key={type.value}
              variant={searchType === type.value ? "default" : "secondary"}
              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setSearchType(type.value as any)}
              data-testid={`filter-${type.value}`}
            >
              {type.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto z-50 border shadow-lg" data-testid="search-results">
          {isLoading ? (
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-500">Searching...</span>
              </div>
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-gray-500">
              <p>No results found for "{query}"</p>
              <p className="text-xs mt-1">Try different keywords or check spelling</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {/* Video Results */}
              {results.videos && results.videos.length > 0 && (
                <div className="p-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">Videos</h4>
                  {results.videos.slice(0, 3).map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                      onClick={() => handleResultClick(video, 'video')}
                      data-testid={`search-result-video-${video.id}`}
                    >
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-12 h-8 object-cover rounded mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.title}</p>
                        <p className="text-xs text-gray-500">
                          {video.channel.name} • {formatViewCount(video.viewCount || 0)} views
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Shorts Results */}
              {results.shorts && results.shorts.length > 0 && (
                <div className="p-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">Shorts</h4>
                  {results.shorts.slice(0, 2).map((short) => (
                    <div
                      key={short.id}
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                      onClick={() => handleResultClick(short, 'shorts')}
                      data-testid={`search-result-short-${short.id}`}
                    >
                      <img
                        src={short.thumbnailUrl}
                        alt={short.title}
                        className="w-8 h-12 object-cover rounded mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{short.title}</p>
                        <p className="text-xs text-gray-500">
                          {short.channel.name} • {formatViewCount(short.viewCount || 0)} views
                        </p>
                        {short.hashtags && short.hashtags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {short.hashtags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Channel Results */}
              {results.channels && results.channels.length > 0 && (
                <div className="p-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">Channels</h4>
                  {results.channels.slice(0, 3).map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                      onClick={() => handleResultClick(channel, 'channel')}
                      data-testid={`search-result-channel-${channel.id}`}
                    >
                      <img
                        src={channel.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=center'}
                        alt={channel.name}
                        className="w-10 h-10 object-cover rounded-full mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">{channel.name}</p>
                          {channel.verified && (
                            <span className="text-blue-500 text-xs">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          @{channel.handle} • {formatViewCount(channel.subscriberCount || 0)} subscribers
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}