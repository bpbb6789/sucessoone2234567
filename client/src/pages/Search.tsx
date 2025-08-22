
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, Filter, Clock, Trending, User } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import ShortsCard from "@/components/ShortsCard";
import { formatDistance } from "date-fns";

interface SearchResult {
  id: string;
  type: "video" | "short" | "channel" | "playlist";
  title: string;
  thumbnail: string;
  channelName: string;
  channelAvatar: string;
  views?: number;
  publishedAt?: Date;
  duration?: string;
  description?: string;
  subscriberCount?: number;
}

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches] = useState([
    "React tutorial",
    "Gaming highlights",
    "Tech review",
    "Cooking recipes"
  ]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      
      // Simulate search API call
      const mockResults: SearchResult[] = [
        {
          id: "1",
          type: "video",
          title: "React Tutorial for Beginners - Complete Course",
          thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=168",
          channelName: "Code Academy",
          channelAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
          views: 1200000,
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          duration: "2:34:15",
          description: "Learn React from scratch with this comprehensive tutorial covering all the fundamentals..."
        },
        {
          id: "2",
          type: "channel",
          title: "Tech Explorer",
          thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=168",
          channelName: "Tech Explorer",
          channelAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
          subscriberCount: 125000,
          description: "Latest technology reviews, tutorials, and tech news. Subscribe for weekly tech content!"
        },
        {
          id: "3",
          type: "short",
          title: "Quick React Tip #shorts",
          thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=168&h=300",
          channelName: "Dev Tips",
          channelAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
          views: 45000,
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          duration: "0:58"
        }
      ];

      return mockResults.filter(result =>
        result.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        result.channelName.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    },
    enabled: debouncedQuery.length > 0,
  });

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  const formatSubscribers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M subscribers`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K subscribers`;
    return `${count} subscribers`;
  };

  const renderSearchResult = (result: SearchResult) => {
    if (result.type === "channel") {
      return (
        <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img
                src={result.channelAvatar}
                alt={result.channelName}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{result.title}</h3>
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {result.subscriberCount && formatSubscribers(result.subscriberCount)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {result.description}
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Subscribe
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative">
              <img
                src={result.thumbnail}
                alt={result.title}
                className={`rounded object-cover ${
                  result.type === "short" ? "w-24 h-36" : "w-40 h-24"
                }`}
              />
              {result.duration && (
                <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
                  {result.duration}
                </span>
              )}
              {result.type === "short" && (
                <Badge className="absolute top-1 left-1 text-xs">Short</Badge>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1 line-clamp-2">{result.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                {result.views && <span>{formatViews(result.views)}</span>}
                {result.publishedAt && (
                  <>
                    <span>•</span>
                    <span>{formatDistance(result.publishedAt, new Date(), { addSuffix: true })}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={result.channelAvatar}
                  alt={result.channelName}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {result.channelName}
                </span>
              </div>
              {result.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {result.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto" data-testid="page-search">
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search YouTube"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12 h-12 text-lg"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!debouncedQuery ? (
        <div className="space-y-6">
          {/* Recent Searches */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery(search)}
                  className="rounded-full"
                >
                  {search}
                </Button>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trending className="h-5 w-5" />
              Trending searches
            </h2>
            <div className="space-y-2">
              {["AI tutorial", "React 18 features", "Gaming setup 2024", "Cooking tips"].map((trend, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => setSearchQuery(trend)}
                >
                  <div className="flex items-center gap-3">
                    <Trending className="h-4 w-4" />
                    <span>{trend}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex gap-4 animate-pulse">
                        <div className="w-40 h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try different keywords or remove search filters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map(renderSearchResult)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <div className="space-y-4">
              {searchResults
                .filter(result => result.type === "video")
                .map(renderSearchResult)}
            </div>
          </TabsContent>

          <TabsContent value="channels" className="mt-6">
            <div className="space-y-4">
              {searchResults
                .filter(result => result.type === "channel")
                .map(renderSearchResult)}
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No playlists found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try different search terms
              </p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
