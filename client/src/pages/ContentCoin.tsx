import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Search, Play, Heart, Share2, MoreHorizontal, Hash, Eye, Copy, User, DollarSign, FileText, ArrowLeft, Download, ExternalLink, Calendar, Tag, FileImage, Music, Loader2, MessageCircle, CheckCircle, Link as LinkIcon } from 'lucide-react'
import { useCreatorCoins, useCreators } from '@/hooks/useCreatorCoins';
import { useGetAllChannels } from '@/hooks/useGetAllChannels';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';
import { CategoryChips } from "@/components/CategoryChips";
import { CATEGORIES } from "@/lib/constants";
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { ContentPreview } from "@/components/ContentPreview";

interface ContentCoin {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  description?: string | null;
  contentType: string;
  mediaCid: string;
  thumbnailCid?: string | null;
  metadataUri?: string | null;
  coinAddress?: string | null;
  deploymentTxHash?: string;
  creatorAddress: string;
  status: string;
  createdAt: string;
  likes: number;
  currency: string;
  currentPrice: string;
  memeTokenAddress?: string;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
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

const getContentUrl = (mediaCid: string): string => {
  return `https://gateway.pinata.cloud/ipfs/${mediaCid}`;
};

// Top Creators Section Component
function TopCreatorsSection() {
  const { data: creators, isLoading, error } = useCreators();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !creators || creators.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
        <div className="col-span-full text-center py-8">
          <p className="text-gray-400">No creators found</p>
        </div>
      </div>
    );
  }

  // Show top 4 creators
  const topCreators = creators.slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
      {topCreators.map((creator: any, index: number) => {
        // Use creator's profile data for avatar

        return (
          <Link key={creator.id} to={`/creators/${creator.address}`}>
            <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105">
              <div className="bg-gray-800/50 hover:bg-gray-700/50 rounded-xl p-2 h-16 flex items-center gap-1 shadow-lg hover:shadow-xl transition-colors">
                {/* Creator Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                    {creator.avatarUrl ? (
                      <img
                        src={creator.avatarUrl.startsWith('baf') 
                          ? `https://gateway.pinata.cloud/ipfs/${creator.avatarUrl}` 
                          : creator.avatarUrl
                        }
                        alt={creator.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${creator.avatarUrl ? 'hidden' : ''}`}>
                      <span className="text-white font-bold text-sm">{creator.name.charAt(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-[10px] leading-tight truncate mb-1">
                    {creator.name}
                  </h3>
                  <p className="text-white/80 text-[9px] truncate">
                    {creator.contentCoins} Content Coins
                  </p>
                </div>

                {/* Rank Badge */}
                <div className="flex-shrink-0">
                  <div className="bg-gray-700 px-1 py-0.5 rounded-lg">
                    <span className="text-white text-[9px] font-bold">#{creator.rank}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function ContentCoin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Get creator coins from API
  const { data: contentCoins, isLoading, error } = useCreatorCoins();

  // Get real channels data
  const { data: channels, isLoading: channelsLoading, error: channelsError } = useGetAllChannels();

  // Music player functionality
  const { loadTrack, loadPlaylist } = useMusicPlayer();

  // Handle play audio content
  const handlePlayAudio = (coin: ContentCoin, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (coin.contentType === 'audio') {
      const track = {
        id: coin.id,
        title: coin.title,
        creator: coin.coinSymbol,
        audioUrl: getContentUrl(coin.mediaCid),
        coverUrl: coin.thumbnailCid ? getContentUrl(coin.thumbnailCid) : undefined
      };

      // Create playlist from all audio content
      const audioCoins = (contentCoins || []).filter((c: ContentCoin) => c.contentType === 'audio');
      const playlist = audioCoins.map((c: ContentCoin) => ({
        id: c.id,
        title: c.title,
        creator: c.coinSymbol,
        audioUrl: getContentUrl(c.mediaCid),
        coverUrl: c.thumbnailCid ? getContentUrl(c.thumbnailCid) : undefined
      }));

      const currentIndex = audioCoins.findIndex((c: ContentCoin) => c.id === coin.id);
      loadPlaylist(playlist, currentIndex);
    }
  };

  // Filter and sort content
  const filteredContent = (contentCoins || [])
    .filter((coin: ContentCoin) => {
      const matchesSearch = !searchTerm || 
        coin.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.coinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.coinSymbol.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || 
        coin.contentType.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Deployed' && coin.status === 'deployed');

      return matchesSearch && matchesCategory;
    })
    .sort((a: ContentCoin, b: ContentCoin) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-6 w-[500px]" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading content coins: {error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Category Filter Chips */}
        <div className="mb-6">
          <CategoryChips 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Top Channels Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Top Channels</h2>
            </div>
            <Link to="/channels">
              <Button 
                variant="ghost" 
                className="text-green-400 hover:text-green-300 text-sm"
              >
                See All
              </Button>
            </Link>
          </div>

          {/* Top Channels - Compact Card Layout */}
          <div className="relative">
            {channelsLoading ? (
              // Loading state
              <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-64 rounded-2xl flex-shrink-0" />
                ))}
              </div>
            ) : channelsError || !channels || channels.length === 0 ? (
              // Error or empty state
              <div className="text-center py-8">
                <p className="text-gray-400">No channels found</p>
              </div>
            ) : (
              // 4 Cards per Row Grid Layout
              <div className="grid grid-cols-4 gap-2">
                {channels.slice(0, 4).map((channel, index) => (
                  <Link key={channel.id} to={`/channel/${channel.slug}`} data-testid={`channel-card-${channel.id}`}>
                    <div className="group cursor-pointer">
                      <Card className="bg-gray-900/90 hover:bg-gray-800/90 border-gray-700/50 transition-all duration-300 overflow-hidden rounded-xl h-20 relative">
                        <CardContent className="p-0 h-full">
                          {/* Background Image with Overlay */}
                          <div className="relative w-full h-full">
                            {/* Background Image */}
                            <div className="absolute inset-0">
                              {channel.coverUrl || channel.avatarUrl ? (
                                <img
                                  src={
                                    (channel.coverUrl?.startsWith('baf') 
                                      ? `https://gateway.pinata.cloud/ipfs/${channel.coverUrl}` 
                                      : channel.coverUrl) ||
                                    (channel.avatarUrl?.startsWith('baf')
                                      ? `https://gateway.pinata.cloud/ipfs/${channel.avatarUrl}`
                                      : channel.avatarUrl)
                                  }
                                  alt={channel.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 ${(channel.coverUrl || channel.avatarUrl) ? 'hidden' : ''}`}>
                              </div>
                            </div>

                            {/* Dark Overlay */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300"></div>

                            {/* Content Overlay */}
                            <div className="absolute inset-0 p-2 flex flex-col justify-between">
                              {/* Top Section - Rating-like Badge */}
                              <div className="flex justify-end">
                                <div className="bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                  <span className="text-white text-[10px] font-medium">LIVE</span>
                                </div>
                              </div>

                              {/* Bottom Section - Channel Info */}
                              <div className="space-y-0.5">
                                <h3 className="text-white font-bold text-xs leading-tight truncate">
                                  {channel.name}
                                </h3>
                                <div className="flex items-center gap-1 text-white/80 text-[10px]">
                                  <span className="bg-white/20 px-1 py-0.5 rounded text-[9px] font-medium">
                                    ${channel.ticker || channel.name.slice(0, 3).toUpperCase()}
                                  </span>
                                  <span className="text-[8px]">•</span>
                                  <span className="text-[9px]">
                                    {formatTimeAgo(channel.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Coins Section - Now Trending */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Now Trending</h2>
            </div>
            <Link to="/contents">
              <Button 
                variant="ghost" 
                className="text-green-400 hover:text-green-300 text-sm"
              >
                See All
              </Button>
            </Link>
          </div>

          {filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">No content coins found</h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm ? `No content matches "${searchTerm}"` : 'Start creating your first content coin'}
                </p>
                <Link to="/create-content-coin">
                  <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-3 rounded-full">
                    Create Your First Content Coin
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {/* Mobile: 2 per row grid */}
              <div className="grid md:hidden grid-cols-2 gap-1">
                {filteredContent.slice(0, 6).map((coin: ContentCoin) => (
                  <Link to={`/content/base/${coin.memeTokenAddress || coin.id}`} key={`mobile-${coin.id}`}>
                    <Card 
                      className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer group relative overflow-hidden"
                    >
                      <CardContent className="p-0">
                        {/* Content Preview */}
                        <div className="relative aspect-square overflow-hidden">
                          <ContentPreview
                            mediaCid={coin.mediaCid}
                            thumbnailCid={coin.thumbnailCid}
                            contentType={coin.contentType}
                            title={coin.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Play Button - Only for video/audio content */}
                          {(coin.contentType === 'video' || coin.contentType === 'audio') && (
                            <Button
                              size="icon"
                              onClick={(e) => handlePlayAudio(coin, e)}
                              className="absolute bottom-2 right-2 bg-black bg-opacity-70 hover:bg-black hover:bg-opacity-90 text-white rounded-full w-6 h-6 opacity-80 hover:opacity-100 transition-all"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-2 right-2">
                            <div 
                              className={`p-1 rounded-full ${coin.status === 'deployed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {coin.status === 'deployed' ? (
                                <LinkIcon className="w-2.5 h-2.5" />
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content Info */}
                        <div className="p-3 space-y-2">
                          <div>
                            <h3 className="font-semibold text-white text-[10px] line-clamp-2 mb-1">
                              {coin.title}
                            </h3>
                            <p className="text-gray-400 text-[10px]">
                              {coin.coinSymbol}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-gray-400 text-[10px]">
                            ${coin.currentPrice}
                          </div>

                          {/* BUY Button */}
                          <Button
                            size="sm"
                            className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold text-[9px] h-5"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Buy button clicked for:", coin.id);
                            }}
                          >
                            BUY
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Desktop: Horizontal Scroll */}
              <div className="hidden md:flex space-x-1 overflow-x-auto scrollbar-hide pb-4">
                {filteredContent.map((coin: ContentCoin) => (
                  <Link to={`/content/base/${coin.memeTokenAddress || coin.id}`} key={`desktop-${coin.id}`}>
                    <div className="flex-shrink-0 w-48 group cursor-pointer">
                      <Card 
                        className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer group relative overflow-hidden"
                      >
                        <CardContent className="p-0">
                          {/* Content Image/Thumbnail */}
                          <div className="relative aspect-square overflow-hidden">
                            <ContentPreview
                              mediaCid={coin.mediaCid}
                              thumbnailCid={coin.thumbnailCid}
                              contentType={coin.contentType}
                              title={coin.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Play Button - Only for video/audio content */}
                            {(coin.contentType === 'video' || coin.contentType === 'audio') && (
                              <Button
                                size="icon"
                                onClick={(e) => handlePlayAudio(coin, e)}
                                className="absolute bottom-2 right-2 bg-black bg-opacity-70 hover:bg-black hover:bg-opacity-90 text-white rounded-full w-8 h-8 opacity-80 hover:opacity-100 transition-all"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-2 right-2">
                              <div 
                                className={`p-1 rounded-full ${coin.status === 'deployed' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-yellow-500/20 text-yellow-400'
                                }`}
                              >
                                {coin.status === 'deployed' ? (
                                  <LinkIcon className="w-2.5 h-2.5" />
                                ) : (
                                  <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Content Info */}
                          <div className="p-4 space-y-3">
                            <div>
                              <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                                {coin.title}
                              </h3>
                              <p className="text-gray-400 text-[10px]">
                                {coin.coinSymbol} • {formatTimeAgo(coin.createdAt)}
                              </p>
                            </div>

                            {/* Compact Info Row */}
                            <div className="flex items-center justify-between pt-2 text-[10px]">
                              <div className="flex items-center gap-2">
                                {coin.status === 'deployed' && coin.coinAddress && (
                                  <div className="flex items-center gap-1">
                                    <Hash className="w-3 h-3 text-green-400" />
                                    <code className="text-green-400 font-mono">
                                      {`${coin.coinAddress.slice(0, 4)}...${coin.coinAddress.slice(-2)}`}
                                    </code>
                                  </div>
                                )}
                                {coin.deploymentTxHash && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 p-1 text-[10px] text-blue-400 hover:text-blue-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`https://sepolia.basescan.org/tx/${coin.deploymentTxHash}`, '_blank');
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              <div className="text-gray-400">
                                ${coin.currentPrice}
                              </div>
                            </div>

                            {/* BUY Button */}
                            <div className="pt-2">
                              <Button
                                size="sm"
                                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold text-[10px] h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log("Buy button clicked for:", coin.id);
                                }}
                              >
                                BUY
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Creators Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Top Creators</h2>
              <p className="text-gray-400">Discover trending content creators</p>
            </div>
            <Link to="/creators">
              <Button 
                variant="ghost" 
                className="text-green-400 hover:text-green-300 text-sm"
              >
                See All
              </Button>
            </Link>
          </div>

          {/* Top Creators Cards */}
          <TopCreatorsSection />
        </div>
      </div>
    </div>
  );
}