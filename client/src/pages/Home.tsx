import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Play, Coins, Music, Radio, Plus } from "lucide-react";
import { type VideoWithChannel, type MusicAlbum, type MusicTrack } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Token interface from Tokens page
interface Token {
  id: string;
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  volume24h: string;
  holders: number;
  change24h?: number;
  createdAt: Date;
  description?: string;
  address: string;
  tokenType: 'channel' | 'content';
  slug?: string;
  avatarUrl?: string;
  coverUrl?: string;
  contentType?: string;
  originalUrl?: string;
  hasTokenData?: boolean;
  tokenDataLoading?: boolean;
}

export default function Home() {
  const [selectedMusicCategory, setSelectedMusicCategory] = useState("Music");

  // Music data queries
  const { data: albums = [], isLoading: albumsLoading } = useQuery<MusicAlbum[]>({
    queryKey: ["/api/music/albums"],
  });

  const { data: tracks = [], isLoading: tracksLoading } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music/tracks"],
  });

  // Token data queries
  const { data: contentImportsData, isLoading: contentImportsLoading } = useQuery({
    queryKey: ['/api/marketplace'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace')
      if (!response.ok) throw new Error('Failed to fetch content imports')
      return response.json()
    }
  });

  // Channels data
  const { data: channelsData = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['/api/web3-channels'],
    queryFn: async () => {
      const response = await fetch('/api/web3-channels')
      if (!response.ok) throw new Error('Failed to fetch channels')
      return response.json()
    }
  });

  // Transform web3 channels data for display
  const channels = channelsData.map((channel: any) => ({
    ...channel,
    avatarUrl: channel.avatarCid ? `https://ipfs.io/ipfs/${channel.avatarCid}` : '/placeholder-avatar.png',
    coverUrl: channel.coverCid ? `https://ipfs.io/ipfs/${channel.coverCid}` : undefined
  }));

  const isLoading = albumsLoading || tracksLoading || contentImportsLoading || channelsLoading;
  const musicCategories = ["Music", "Podcasts"];

  // Filter tracks for podcasts
  const podcastTracks = tracks.filter(track => track.genre?.toLowerCase().includes('podcast'));
  const musicTracks = tracks.filter(track => !track.genre?.toLowerCase().includes('podcast'));

  // Process tokens data
  const tokens: Token[] = contentImportsData ? contentImportsData
    .filter((content: any) => content.status === 'tokenized' && content.coinAddress)
    .map((content: any) => ({
      id: content.coinAddress || content.id,
      address: content.coinAddress,
      name: content.coinName || content.title,
      symbol: content.coinSymbol || 'CONTENT',
      description: content.description,
      createdAt: new Date(content.createdAt || content.tokenizedAt),
      tokenType: 'content' as const,
      contentType: content.contentType,
      originalUrl: content.originalUrl,
      price: content.currentPrice || '0.000001',
      marketCap: '0',
      volume24h: '0',
      holders: 0,
      change24h: 0,
      hasTokenData: false,
      tokenDataLoading: false
    })) : [];

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="min-h-screen text-white dark:text-white text-gray-900 dark:text-white" data-testid="page-home">
      <div className="p-4 md:p-6">
        <Tabs defaultValue="channel" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 dark:bg-gray-800/50 bg-gray-200/50 dark:bg-gray-800/50">
            <TabsTrigger
              value="channel"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-2"
              data-testid="tab-channel"
            >
              <Play className="w-4 h-4" />
              <span>Channels</span>
            </TabsTrigger>
            <TabsTrigger
              value="music"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-2"
              data-testid="tab-music"
            >
              <Music className="w-4 h-4" />
              <span>Music</span>
            </TabsTrigger>
            <TabsTrigger
              value="podcasts"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-2"
              data-testid="tab-podcasts"
            >
              <Radio className="w-4 h-4" />
              <span>Podcasts</span>
            </TabsTrigger>
            <TabsTrigger
              value="reels"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-2"
              data-testid="tab-reels"
            >
              <Play className="w-4 h-4" />
              <span>Reels</span>
            </TabsTrigger>
            <TabsTrigger
              value="contents"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-2"
              data-testid="tab-contents"
            >
              <Play className="w-4 h-4" />
              <span>Contents</span>
            </TabsTrigger>
          </TabsList>

          {/* Music Tab Content */}
          <TabsContent value="music" className="mt-6">
            <div className="space-y-6 md:space-y-8">


              {/* Jump back in section */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Jump back in</h2>
                {isLoading ? (
                  <div>
                    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-2 md:mb-3"></div>
                          <div className="h-3 md:h-4 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded mb-1 md:mb-2"></div>
                          <div className="h-2 md:h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex md:hidden space-x-3 overflow-x-auto scrollbar-hide pb-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-24 animate-pulse">
                          <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-2"></div>
                          <div className="h-3 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-2 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Desktop Grid */}
                    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                      {albums.slice(0, 6).map((album) => (
                        <div
                          key={album.id}
                          className="group cursor-pointer"
                          data-testid={`jump-back-album-${album.id}`}
                        >
                          <div className="relative mb-2 md:mb-3">
                            <img
                              src={album.coverUrl}
                              alt={album.title}
                              className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Play className="w-8 h-8 md:w-12 md:h-12 text-green-500" fill="currentColor" />
                            </div>
                          </div>
                          <h3 className="font-medium text-sm md:text-base mb-1 truncate">{album.title}</h3>
                          <p className="text-xs md:text-sm text-gray-400 truncate">{album.artist}</p>
                        </div>
                      ))}
                    </div>

                    {/* Mobile Horizontal Scroll */}
                    <div className="flex md:hidden space-x-3 overflow-x-auto scrollbar-hide pb-4">
                      {albums.slice(0, 8).map((album) => (
                        <div
                          key={album.id}
                          className="flex-shrink-0 w-24 group cursor-pointer"
                          data-testid={`jump-back-album-${album.id}`}
                        >
                          <div className="relative mb-2">
                            <img
                              src={album.coverUrl}
                              alt={album.title}
                              className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Play className="w-6 h-6 text-green-500" fill="currentColor" />
                            </div>
                          </div>
                          <h3 className="font-medium text-xs mb-1 truncate">{album.title}</h3>
                          <p className="text-xs text-gray-400 truncate">{album.artist}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* More of what you like */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">More of what you like</h2>
                {isLoading ? (
                  <div>
                    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-2 md:mb-3"></div>
                          <div className="h-3 md:h-4 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded mb-1 md:mb-2"></div>
                          <div className="h-2 md:h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex md:hidden space-x-3 overflow-x-auto scrollbar-hide pb-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-24 animate-pulse">
                          <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-2"></div>
                          <div className="h-3 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-2 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Desktop Grid */}
                    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                      {albums.slice(2, 8).map((album) => (
                        <div
                          key={album.id}
                          className="group cursor-pointer"
                          data-testid={`more-like-album-${album.id}`}
                        >
                          <div className="relative mb-2 md:mb-3">
                            <img
                              src={album.coverUrl}
                              alt={album.title}
                              className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Play className="w-8 h-8 md:w-12 md:h-12 text-green-500" fill="currentColor" />
                            </div>
                          </div>
                          <h3 className="font-medium text-sm md:text-base mb-1 truncate">{album.title}</h3>
                          <p className="text-xs md:text-sm text-gray-400 truncate">{album.artist}</p>
                        </div>
                      ))}
                    </div>

                    {/* Mobile Horizontal Scroll */}
                    <div className="flex md:hidden space-x-3 overflow-x-auto scrollbar-hide pb-4">
                      {albums.slice(2, 10).map((album) => (
                        <div
                          key={album.id}
                          className="flex-shrink-0 w-24 group cursor-pointer"
                          data-testid={`more-like-album-${album.id}`}
                        >
                          <div className="relative mb-2">
                            <img
                              src={album.coverUrl}
                              alt={album.title}
                              className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Play className="w-6 h-6 text-green-500" fill="currentColor" />
                            </div>
                          </div>
                          <h3 className="font-medium text-xs mb-1 truncate">{album.title}</h3>
                          <p className="text-xs text-gray-400 truncate">{album.artist}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tokens Tab Content */}
          <TabsContent value="tokens" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold">Content Tokens</h2>
                <p className="text-sm text-gray-400">Tokenized content marketplace</p>
              </div>

              <div className="text-center py-12">
                <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No tokens found</h3>
                <p className="text-gray-400">No tokenized content available at the moment</p>
                <div className="mt-4">
                  <Link href="/create">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Token
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Podcasts Tab Content */}
          <TabsContent value="podcasts" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold">Podcasts & Audio Content</h2>
                <p className="text-sm text-gray-400">{podcastTracks.length} episodes found</p>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-gray-800/50 dark:bg-gray-800/50 bg-white/80 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : podcastTracks.length === 0 ? (
                <div className="text-center py-12">
                  <Radio className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No podcasts found</h3>
                  <p className="text-gray-400">Check back later for podcast content</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {podcastTracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center space-x-4 p-4 bg-gray-800/50 dark:bg-gray-800/50 bg-white/80 dark:bg-gray-800/50 rounded-lg hover:bg-gray-700/50 dark:hover:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                      data-testid={`podcast-${track.id}`}
                    >
                      <div className="relative">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Play className="w-6 h-6 text-green-500" fill="currentColor" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base mb-1 truncate">{track.title}</h3>
                        <p className="text-xs md:text-sm text-gray-400 mb-1 truncate">{track.artist}</p>
                        <p className="text-xs text-gray-500">
                          Episode {index + 1} • {Math.floor(track.duration / 60)}m {track.duration % 60}s
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Latest episode</p>
                        <Play className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Channel Tab Content */}
          <TabsContent value="channel" className="mt-6">
            <div className="space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  {/* Loading Top Channels */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl md:text-2xl font-bold">Top Channels</h2>
                      <div className="h-4 w-16 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-2"></div>
                          <div className="h-4 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded mb-2"></div>
                          <div className="h-3 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex md:hidden space-x-3 overflow-x-auto scrollbar-hide pb-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-24 animate-pulse">
                          <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-2"></div>
                          <div className="h-3 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-2 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Loading Trending */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl md:text-2xl font-bold">Trending</h2>
                      <div className="h-4 w-16 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-2"></div>
                          <div className="h-4 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded mb-2"></div>
                          <div className="h-3 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex md:hidden space-x-3 overflow-x-auto scrollbar-hide pb-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-24 animate-pulse">
                          <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-2"></div>
                          <div className="h-3 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-2 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : channels.length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No channels found</h3>
                  <p className="text-gray-400">Channels will appear here when available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Channels Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg md:text-xl font-bold">Top Channels</h2>
                      <button className="text-blue-500 hover:text-blue-600 text-xs font-medium">
                        Show all
                      </button>
                    </div>

                    {/* Desktop Grid - Compact Spotify-like cards */}
                    <div className="hidden md:grid md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                      {channels.slice(0, 10).map((channel: any) => (
                        <Link key={channel.id} href={`/channel/${channel.id}`}>
                          <div className="group cursor-pointer bg-gray-900/40 hover:bg-gray-800/60 rounded-lg p-2 transition-colors">
                            <div className="relative mb-2">
                              <img
                                src={channel.avatarUrl || '/placeholder-avatar.png'}
                                alt={channel.name}
                                className="w-full aspect-square object-cover rounded-md group-hover:scale-105 transition-transform shadow-lg"
                              />
                            </div>
                            <h3 className="font-medium text-xs mb-1 truncate text-white">{channel.name}</h3>
                            <p className="text-xs text-gray-400 truncate mb-1">{channel.ticker}</p>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded text-xs">
                                MC
                              </span>
                              <span className="bg-green-500/20 text-green-400 px-1 py-0.5 rounded text-xs flex items-center gap-1">
                                📄 {Math.floor(Math.random() * 50) + 5}
                              </span>
                              <span className="bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded text-xs flex items-center gap-1">
                                👥 {Math.floor(Math.random() * 100) + 10}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Mobile Horizontal Scroll */}
                    <div className="flex md:hidden space-x-3 overflow-x-auto scrollbar-hide pb-4">
                      {channels.slice(0, 8).map((channel: any) => (
                        <Link key={channel.id} href={`/channel/${channel.id}`}>
                          <div className="flex-shrink-0 w-24 group cursor-pointer">
                            <div className="relative mb-2">
                              <img
                                src={channel.avatarUrl || '/placeholder-avatar.png'}
                                alt={channel.name}
                                className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute top-1 right-1 flex flex-col gap-1">
                                <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                  MC
                                </span>
                                <div className="flex gap-1">
                                  <span className="bg-green-500 text-white text-xs px-1 py-0.5 rounded-full">
                                    📄{Math.floor(Math.random() * 50) + 5}
                                  </span>
                                  <span className="bg-purple-500 text-white text-xs px-1 py-0.5 rounded-full">
                                    👥{Math.floor(Math.random() * 100) + 10}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <h3 className="font-medium text-xs mb-1 truncate">{channel.name}</h3>
                            <p className="text-xs text-gray-400 truncate">{channel.ticker}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Trending Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg md:text-xl font-bold">Trending</h2>
                      <button className="text-blue-500 hover:text-blue-600 text-xs font-medium">
                        Show all
                      </button>
                    </div>

                    {/* Desktop Grid */}
                    <div className="hidden md:grid md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                      {channels.slice(4, 14).map((channel: any) => (
                        <Link key={channel.id} href={`/channel/${channel.id}`}>
                          <div className="group cursor-pointer bg-gray-900/40 hover:bg-gray-800/60 rounded-lg p-2 transition-colors">
                            <div className="relative mb-2">
                              <img
                                src={channel.avatarUrl || '/placeholder-avatar.png'}
                                alt={channel.name}
                                className="w-full aspect-square object-cover rounded-md group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <h3 className="font-medium text-xs mb-1 truncate text-white">{channel.name}</h3>
                            <p className="text-xs text-gray-400 truncate mb-1">{channel.ticker}</p>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded text-xs">
                                MC
                              </span>
                              <span className="bg-green-500/20 text-green-400 px-1 py-0.5 rounded text-xs flex items-center gap-1">
                                📄 {Math.floor(Math.random() * 50) + 5}
                              </span>
                              <span className="bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded text-xs flex items-center gap-1">
                                👥 {Math.floor(Math.random() * 100) + 10}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Mobile Horizontal Scroll */}
                    <div className="flex md:hidden space-x-3 overflow-x-auto scrollbar-hide pb-4">
                      {channels.slice(4, 12).map((channel: any) => (
                        <Link key={channel.id} href={`/channel/${channel.id}`}>
                          <div className="flex-shrink-0 w-24 group cursor-pointer">
                            <div className="relative mb-2">
                              <img
                                src={channel.avatarUrl || '/placeholder-avatar.png'}
                                alt={channel.name}
                                className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute top-1 right-1 flex flex-col gap-1">
                                <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                  MC
                                </span>
                                <div className="flex gap-1">
                                  <span className="bg-green-500 text-white text-xs px-1 py-0.5 rounded-full">
                                    📄{Math.floor(Math.random() * 50) + 5}
                                  </span>
                                  <span className="bg-purple-500 text-white text-xs px-1 py-0.5 rounded-full">
                                    👥{Math.floor(Math.random() * 100) + 10}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <h3 className="font-medium text-xs mb-1 truncate">{channel.name}</h3>
                            <p className="text-xs text-gray-400 truncate">{channel.ticker}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reels Tab Content */}
          <TabsContent value="reels" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold">Reels</h2>
                <p className="text-sm text-gray-400">Short-form video content</p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-[9/16]"></div>
                      <div className="h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded mt-2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Link key={i} href={`/reel/${i + 1}`}>
                      <div className="group cursor-pointer">
                        <div className="relative mb-2 md:mb-3">
                          <img
                            src={`https://picsum.photos/300/400?random=${i}`}
                            alt={`Reel ${i + 1}`}
                            className="w-full aspect-[9/16] object-cover rounded-lg group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Play className="w-8 h-8 md:w-12 md:h-12 text-white" fill="currentColor" />
                          </div>
                          <div className="absolute bottom-2 left-2 text-white text-xs bg-black/60 px-2 py-1 rounded">
                            {Math.floor(Math.random() * 60) + 15}s
                          </div>
                        </div>
                        <h3 className="font-medium text-sm md:text-base mb-1 truncate">Amazing Reel #{i + 1}</h3>
                        <p className="text-xs md:text-sm text-gray-400 truncate">creator{i + 1}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Contents Tab Content */}
          <TabsContent value="contents" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold">Contents</h2>
                <p className="text-sm text-gray-400">All content types</p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg p-4">
                        <div className="h-4 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-gray-600 dark:bg-gray-600 bg-gray-400 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Link key={i} href={`/content/${i + 1}`}>
                      <div className="group cursor-pointer">
                        <div className="relative mb-2 md:mb-3">
                          <img
                            src={`https://picsum.photos/400/300?random=${i + 10}`}
                            alt={`Content ${i + 1}`}
                            className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 right-2">
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Article
                            </span>
                          </div>
                        </div>
                        <h3 className="font-medium text-sm md:text-base mb-1 truncate">Content Piece #{i + 1}</h3>
                        <p className="text-xs md:text-sm text-gray-400 truncate mb-1">writer{i + 1}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{Math.floor(Math.random() * 1000) + 100} views</span>
                          <span>{Math.floor(Math.random() * 12) + 1}h ago</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}