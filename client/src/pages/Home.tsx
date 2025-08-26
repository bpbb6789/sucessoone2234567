import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Play, Coins, Music, Radio, Plus } from "lucide-react";
import { type VideoWithChannel, type MusicAlbum, type MusicTrack } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetAllSales } from '@/hooks/useGetAllSales';

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

// Interface for Channel data fetched from /api/web3-channels
interface ChannelData {
  id: string;
  name: string;
  description: string;
  avatar: string;
  subscribers: number;
  isSubscribed: boolean;
  isVerified: boolean;
  category: string;
  ticker?: string; // Added ticker for display
}

// Interface for Creator Tokens fetched from GraphQL
interface CreatorToken {
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
  creator: string;
  isOnBondingCurve?: boolean;
  progress?: number;
  imageUri?: string;
}

// Helper function to format time ago
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

// Mock data for channels (replace with actual fetch if needed)
const mockChannelData: ChannelData[] = [
  { id: 'c1', name: 'Channel One', description: 'Desc 1', avatar: '/placeholder-avatar.png', subscribers: 100, isSubscribed: false, isVerified: true, category: 'Music', ticker: 'CH1' },
  { id: 'c2', name: 'Channel Two', description: 'Desc 2', avatar: '/placeholder-avatar.png', subscribers: 150, isSubscribed: false, isVerified: false, category: 'Gaming', ticker: 'CH2' },
  { id: 'c3', name: 'Channel Three', description: 'Desc 3', avatar: '/placeholder-avatar.png', subscribers: 200, isSubscribed: true, isVerified: true, category: 'Tech', ticker: 'CH3' },
];


export default function Home() {
  const [activeTab, setActiveTab] = useState("trending");
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [deployedPadsData, setDeployedPadsData] = useState<any[]>([]);
  const [creatorTokens, setCreatorTokens] = useState<CreatorToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get token sales data from GraphQL (PumpFun tokens)
  const { data: salesData, loading: salesLoading, error: salesError } = useGetAllSales();


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

  // Deployed Pads data (This is now replaced by creatorTokens from GraphQL)
  // const { data: deployedPadsData = [], isLoading: deployedPadsLoading } = useQuery({
  //   queryKey: ['/api/pads/deployed'],
  //   queryFn: async () => {
  //     const response = await fetch('/api/pads?deployed=true')
  //     if (!response.ok) throw new Error('Failed to fetch deployed pads')
  //     return response.json()
  //   }
  // });

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
  const processedChannels = channelsData.map((channel: any) => ({
    ...channel,
    avatarUrl: channel.avatarCid ? `https://ipfs.io/ipfs/${channel.avatarCid}` : '/placeholder-avatar.png',
    coverUrl: channel.coverCid ? `https://ipfs.io/ipfs/${channel.coverCid}` : undefined,
    ticker: channel.ticker || 'N/A' // Ensure ticker is present
  }));

  // Determine overall loading state, considering channel data fetching
  const isLoadingData = albumsLoading || tracksLoading || contentImportsLoading || channelsLoading || isLoading; // Added 'isLoading' from channel mock data simulation


  // Process GraphQL data for creator tokens
  React.useEffect(() => {
    let allCreatorTokens: CreatorToken[] = [];

    // Add GraphQL tokens if available
    if (salesData && Array.isArray(salesData) && salesData.length > 0) {
      const pumpFunTokens = salesData.map((token: any) => ({
        id: token.memeTokenAddress || token.id,
        address: token.memeTokenAddress,
        name: token.name || token.symbol || 'Unknown Token',
        symbol: token.symbol || 'UNKNOWN',
        description: token.bio || token.description || 'Created via pump.fun mechanics',
        imageUri: token.imageUri || '',
        createdAt: new Date(token.createdAt || token.blockTimestamp || Date.now()),
        creator: token.createdBy || 'No Creator Found',
        price: token.price || '0.000001',
        marketCap: token.marketCap || '0',
        volume24h: token.volume24h || '0',
        holders: token.holders || 0,
        change24h: token.priceChange24h || 0,
        isOnBondingCurve: token.bondingCurve !== null,
        progress: token.progress || 0
      }));
      allCreatorTokens = [...allCreatorTokens, ...pumpFunTokens];
    }

    setCreatorTokens(allCreatorTokens);
    setDeployedPadsData(allCreatorTokens); // Keep this for backward compatibility
  }, [salesData, salesLoading]);

  // Effect to simulate loading for channels if not loaded from API
  useEffect(() => {
    if (channelsData.length === 0 && !channelsLoading) {
      // Simulate loading time for channels if API returns empty or it's still loading
      const timer = setTimeout(() => {
        setChannels(mockChannelData);
        setIsLoading(false); // Set isLoading to false after mock data is set
      }, 1000);

      return () => clearTimeout(timer);
    } else if (channelsData.length > 0) {
      setChannels(processedChannels); // Use processed channels from API
      setIsLoading(false); // Set isLoading to false if data is available
    }
  }, [channelsData, channelsLoading, processedChannels]); // Depend on channelsData and channelsLoading

  const musicCategories = ["Music", "Podcasts"];

  // Filter tracks for podcasts
  const podcastTracks = tracks.filter(track => track.genre?.toLowerCase().includes('podcast'));
  const musicTracks = tracks.filter(track => !track.genre?.toLowerCase().includes('podcast'));

  // Process tokens data from contentImportsData
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

  return (
    <div className="min-h-screen text-white dark:text-white text-gray-900 dark:text-white" data-testid="page-home">
      <div className="p-4 md:p-6">
        <Tabs defaultValue="pads" className="w-full">
          <TabsList className="inline-flex w-auto bg-gray-800/50 dark:bg-gray-800/50 bg-gray-200/50 dark:bg-gray-800/50 h-8 p-0.5 rounded-lg">
            <TabsTrigger
              value="pads"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
              data-testid="tab-pads"
            >
              <Coins className="w-3 h-3" />
              <span className="hidden sm:inline">Creator Coins</span>
            </TabsTrigger>
            <TabsTrigger
              value="channel"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
              data-testid="tab-channel"
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">Channels</span>
            </TabsTrigger>
            <TabsTrigger
              value="music"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
              data-testid="tab-music"
            >
              <Music className="w-3 h-3" />
              <span className="hidden sm:inline">Music</span>
            </TabsTrigger>
            <TabsTrigger
              value="podcasts"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
              data-testid="tab-podcasts"
            >
              <Radio className="w-3 h-3" />
              <span className="hidden sm:inline">Podcasts</span>
            </TabsTrigger>
            <TabsTrigger
              value="reels"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
              data-testid="tab-reels"
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">Reels</span>
            </TabsTrigger>
            <TabsTrigger
              value="contents"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
              data-testid="tab-contents"
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">Contents</span>
            </TabsTrigger>
          </TabsList>

          {/* Creator Coins Tab Content */}
          <TabsContent value="pads" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold">Creator Coins</h2>
                <p className="text-sm text-gray-400">{creatorTokens.length} creator coins available</p>
              </div>

              {isLoadingData || salesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-3"></div>
                      <div className="h-4 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : creatorTokens.length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No creator coins yet</h3>
                  <p className="text-gray-400 mb-4">Create your first creator coin</p>
                  <Link href="/creatorcoins">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Creator Coin
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creatorTokens.slice(0, 6).map((token) => (
                    <Card key={token.id} className="bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                      <CardContent className="p-4">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Token Avatar */}
                            {token.imageUri && token.imageUri.trim() !== '' ? (
                              <img 
                                src={token.imageUri}
                                alt={`${token.name} logo`}
                                className="w-10 h-10 rounded-lg object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  target.style.display = 'none';
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm ${token.imageUri && token.imageUri.trim() !== '' ? 'hidden' : ''}`}>
                              {token.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-gray-900 dark:text-white font-semibold text-sm">{token.name}</h3>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{token.symbol}</span>
                                <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-200 text-xs px-2 py-0">
                                  🚀 Creator
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500 text-xs">
                                <span>{formatTimeAgo(token.createdAt)}</span>
                                {token.isOnBondingCurve && (
                                  <Badge variant="outline" className="text-xs px-1 py-0 border-green-500 text-green-600">
                                    Bonding
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {token.address && (
                              <Link href={`/token/${token.address}`}>
                                <Button 
                                  className="px-2 py-1 h-6 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" 
                                  size="sm"
                                >
                                  Trade
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Price and Stats Row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Price</span>
                              <span className="text-purple-600 dark:text-purple-400 font-medium">${token.price}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">MC</span>
                              <span className="text-purple-600 dark:text-purple-400 font-medium">${token.marketCap}K</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar for Bonding Curve */}
                        {token.isOnBondingCurve && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <span>Bonding Curve Progress</span>
                              <span>{token.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(token.progress || 0, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <span className="text-green-500 dark:text-green-400">📈</span>
                              <span className={`${token.change24h && token.change24h < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                                {token.change24h ? Math.abs(token.change24h).toFixed(1) : '0.0'}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-blue-500 dark:text-blue-400">👥</span>
                              <span className="text-gray-600 dark:text-gray-400">{token.holders}</span>
                            </div>
                          </div>
                        </div>

                        {/* Creator Info */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 dark:text-gray-400">Creator:</span>
                              <span className="font-mono text-purple-600 dark:text-purple-400">
                                {token.creator !== 'No Creator Found' ? `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}` : 'No Creator Found'}
                              </span>
                            </div>
                            {token.address && (
                              <Link href={`/token/${token.address}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-2 text-xs text-gray-500 hover:text-purple-600"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Music Tab Content */}
          <TabsContent value="music" className="mt-6">
            <div className="space-y-6 md:space-y-8">


              {/* Jump back in section */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Jump back in</h2>
                {isLoadingData ? (
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
                {isLoadingData ? (
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

              {isLoadingData ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-square mb-3"></div>
                      <div className="h-4 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : tokens.length === 0 ? (
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
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {tokens.map((token) => (
                    <Link key={token.id} href={`/token/${token.address || token.id}`}>
                      <div className="group cursor-pointer">
                        <div className="relative mb-3">
                          <img
                            src={token.originalUrl || '/placeholder-content.png'} // Fallback image
                            alt={token.name}
                            className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Play className="w-8 h-8 md:w-12 md:h-12 text-green-500" fill="currentColor" />
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              {token.contentType}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-medium text-sm md:text-base mb-1 truncate">{token.name}</h3>
                        <p className="text-xs md:text-sm text-gray-400 truncate mb-1">{token.symbol}</p>
                        <p className="text-xs text-green-400 font-medium">${token.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Podcasts Tab Content */}
          <TabsContent value="podcasts" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold">Podcasts & Audio Content</h2>
                <p className="text-sm text-gray-400">{podcastTracks.length} episodes found</p>
              </div>

              {isLoadingData ? (
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
              {isLoadingData ? (
                <div className="space-y-6">
                  {/* Loading Top Channels */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl md:text-2xl font-bold">Top Channels</h2>
                      <div className="h-4 w-16 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {Array.from({ length: 5 }).map((_, i) => (
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
                    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {Array.from({ length: 5 }).map((_, i) => (
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
                    <div className="hidden md:grid md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {channels.slice(0, 8).map((channel: any) => (
                        <Link key={channel.id} href={`/channel/${channel.id}`}>
                          <div className="group cursor-pointer bg-gray-900/40 hover:bg-gray-800/60 rounded-lg p-3 transition-colors">
                            <div className="relative mb-3">
                              <img
                                src={channel.avatarUrl || '/placeholder-avatar.png'}
                                alt={channel.name}
                                className="w-full aspect-square object-cover rounded-md group-hover:scale-105 transition-transform shadow-lg"
                              />
                            </div>
                            <h3 className="font-medium text-sm mb-1 truncate text-white">{channel.name}</h3>
                            <p className="text-xs text-gray-400 truncate mb-2">{channel.ticker}</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-green-500">▲</span>
                                <span className="text-green-400 text-xs font-medium">
                                  ${Math.floor(Math.random() * 50000) + 1000}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  📄 {Math.floor(Math.random() * 50) + 5}
                                </span>
                                <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  👥 {Math.floor(Math.random() * 100) + 10}
                                </span>
                              </div>
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
                    <div className="hidden md:grid md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {channels.slice(4, 12).map((channel: any) => (
                        <Link key={channel.id} href={`/channel/${channel.id}`}>
                          <div className="group cursor-pointer bg-gray-900/40 hover:bg-gray-800/60 rounded-lg p-3 transition-colors">
                            <div className="relative mb-3">
                              <img
                                src={channel.avatarUrl || '/placeholder-avatar.png'}
                                alt={channel.name}
                                className="w-full aspect-square object-cover rounded-md group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <h3 className="font-medium text-sm mb-1 truncate text-white">{channel.name}</h3>
                            <p className="text-xs text-gray-400 truncate mb-2">{channel.ticker}</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-pink-500">▼</span>
                                <span className="text-pink-400 text-xs font-medium">
                                  ${Math.floor(Math.random() * 20000) + 500}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  📄 {Math.floor(Math.random() * 50) + 5}
                                </span>
                                <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  👥 {Math.floor(Math.random() * 100) + 10}
                                </span>
                              </div>
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

              {isLoadingData ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded-lg aspect-[9/16]"></div>
                      <div className="h-3 bg-gray-700 dark:bg-gray-700 bg-gray-300 dark:bg-gray-700 rounded mt-2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

              {isLoadingData ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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