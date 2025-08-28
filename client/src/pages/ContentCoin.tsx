import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Play, Heart, Share2, MoreHorizontal, Hash, Eye, Copy } from "lucide-react";
import { useCreatorCoins, useCreators } from '@/hooks/useCreatorCoins';
import { useGetAllChannels } from '@/hooks/useGetAllChannels';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';
import { CategoryChips } from "@/components/CategoryChips";
import { CATEGORIES } from "@/lib/constants";

interface ContentCoin {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  description?: string | null;
  contentType: string;
  mediaCid: string;
  thumbnailCid?: string;
  metadataUri?: string;
  coinAddress?: string;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error || !creators || creators.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-full text-center py-8">
          <p className="text-gray-400">No creators found</p>
        </div>
      </div>
    );
  }

  // Show top 4 creators
  const topCreators = creators.slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {topCreators.map((creator: any, index: number) => (
        <Link key={creator.id} to={`/creators/${creator.address}`}>
          <div className="group cursor-pointer">
            <div className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors rounded-lg p-4">
              <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{creator.name.charAt(0)}</span>
                </div>
                {/* Show rank in top right corner */}
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">#{creator.rank}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-white font-semibold text-lg mb-1">{creator.name}</h3>
                <p className="text-gray-400 text-sm">{creator.contentCoins} Content Coins</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
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
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Now Trending
            </h1>
            <p className="text-gray-400 text-lg">
              Your tokenized content collection • {filteredContent.length} items
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-col gap-4">
            <CategoryChips 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
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

          {/* Top Channels Cards - Widget Style Layout */}
          <div className="space-y-3">
            {channelsLoading ? (
              // Loading state
              <>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </>
            ) : channelsError || !channels || channels.length === 0 ? (
              // Error or empty state
              <div className="text-center py-8">
                <p className="text-gray-400">No channels found</p>
              </div>
            ) : (
              // Widget Card Layout
              <>
                {channels.slice(0, 4).map((channel, index) => (
                  <Link key={channel.id} to={`/channels/${channel.slug}`}>
                    <div className="group cursor-pointer">
                      <Card className="bg-gray-900/60 hover:bg-gray-800/80 border-gray-700/50 transition-all duration-200 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-center gap-4 p-4">
                            {/* Thumbnail/Avatar - Left Side */}
                            <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
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
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ${(channel.coverUrl || channel.avatarUrl) ? 'hidden' : ''}`}>
                                <span className="text-white font-bold text-xl">{channel.name.charAt(0)}</span>
                              </div>
                            </div>

                            {/* Content Details - Right Side */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-white text-base leading-tight mb-1 truncate">
                                    {channel.name}
                                  </h3>
                                  <p className="text-gray-400 text-sm">
                                    {channel.category || 'Entertainment'} • {channel.name.slice(0, 8).toUpperCase()}
                                  </p>
                                </div>
                                
                                {/* Rating/Score */}
                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                  <span className="text-yellow-400">⭐</span>
                                  <span className="text-white font-semibold text-sm">
                                    {(4.2 + Math.random() * 0.7).toFixed(1)}
                                  </span>
                                </div>
                              </div>

                              {/* Stats Row */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <span className="text-green-400">💰</span>
                                    <span className="text-gray-300">
                                      ${Math.floor(Math.random() * 500 + 50)}K
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-blue-400">👥</span>
                                    <span className="text-gray-300">
                                      {Math.floor(Math.random() * 1000 + 100)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-purple-400">📺</span>
                                    <span className="text-gray-300">
                                      {Math.floor(Math.random() * 50 + 5)} videos
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-gray-500 text-xs">
                                  Created {Math.floor(Math.random() * 30 + 1)}d ago
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Content Coins Section - Now Trending */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Now Trending</h2>
            </div>
            <Link to="/create-content-coin">
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
              <div className="grid md:hidden grid-cols-2 gap-4">
                {filteredContent.slice(0, 6).map((coin: ContentCoin) => (
                  <Link to={`/content/base/${coin.memeTokenAddress || coin.id}`} key={`mobile-${coin.id}`}>
                    <Card 
                      className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer group relative overflow-hidden"
                    >
                      <CardContent className="p-0">
                        {/* Content Image/Thumbnail */}
                        <div className="relative aspect-square overflow-hidden">
                          {coin.contentType === 'image' ? (
                            <img
                              src={getContentUrl(coin.mediaCid)}
                              alt={coin.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = `data:image/svg+xml,${encodeURIComponent(`
                                  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                                    <rect width="200" height="200" fill="#374151"/>
                                    <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9CA3AF" font-family="Arial" font-size="16">
                                      ${coin.contentType.toUpperCase()}
                                    </text>
                                  </svg>
                                `)}`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <div className="text-center text-white">
                                <Play className="w-8 h-8 mx-auto mb-1" />
                                <p className="text-xs font-medium">{coin.contentType.toUpperCase()}</p>
                              </div>
                            </div>
                          )}

                          {/* Play Button - Only for video/audio content */}
                          {(coin.contentType === 'video' || coin.contentType === 'audio') && (
                            <Button
                              size="icon"
                              className="absolute bottom-2 right-2 bg-black bg-opacity-70 hover:bg-black hover:bg-opacity-90 text-white rounded-full w-6 h-6 opacity-80 hover:opacity-100 transition-all"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-2 right-2">
                            <Badge 
                              variant={coin.status === 'deployed' ? 'default' : 'secondary'}
                              className={`text-xs ${coin.status === 'deployed' 
                                ? 'bg-green-500 text-black' 
                                : 'bg-yellow-500 text-black'
                              }`}
                            >
                              {coin.status === 'deployed' ? '✓' : '⏳'}
                            </Badge>
                          </div>
                        </div>

                        {/* Content Info */}
                        <div className="p-3 space-y-2">
                          <div>
                            <h3 className="font-semibold text-white text-xs line-clamp-2 mb-1">
                              {coin.title}
                            </h3>
                            <p className="text-gray-400 text-xs">
                              {coin.coinSymbol}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-gray-400 text-xs">
                            ${coin.currentPrice}
                          </div>

                          {/* BUY Button */}
                          <Button
                            size="sm"
                            className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold text-xs h-6"
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
              <div className="hidden md:flex space-x-6 overflow-x-auto scrollbar-hide pb-4">
                {filteredContent.map((coin: ContentCoin) => (
                  <Link to={`/content/base/${coin.memeTokenAddress || coin.id}`} key={`desktop-${coin.id}`}>
                    <div className="flex-shrink-0 w-48 group cursor-pointer">
                      <Card 
                        className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer group relative overflow-hidden"
                      >
                        <CardContent className="p-0">
                          {/* Content Image/Thumbnail */}
                          <div className="relative aspect-square overflow-hidden">
                            {coin.contentType === 'image' ? (
                              <img
                                src={getContentUrl(coin.mediaCid)}
                                alt={coin.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.src = `data:image/svg+xml,${encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                                      <rect width="200" height="200" fill="#374151"/>
                                      <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9CA3AF" font-family="Arial" font-size="16">
                                        ${coin.contentType.toUpperCase()}
                                      </text>
                                    </svg>
                                  `)}`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <div className="text-center text-white">
                                  <Play className="w-12 h-12 mx-auto mb-2" />
                                  <p className="text-sm font-medium">{coin.contentType.toUpperCase()}</p>
                                </div>
                              </div>
                            )}

                            {/* Play Button - Only for video/audio content */}
                            {(coin.contentType === 'video' || coin.contentType === 'audio') && (
                              <Button
                                size="icon"
                                className="absolute bottom-2 right-2 bg-black bg-opacity-70 hover:bg-black hover:bg-opacity-90 text-white rounded-full w-8 h-8 opacity-80 hover:opacity-100 transition-all"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-2 right-2">
                              <Badge 
                                variant={coin.status === 'deployed' ? 'default' : 'secondary'}
                                className={coin.status === 'deployed' 
                                  ? 'bg-green-500 text-black' 
                                  : 'bg-yellow-500 text-black'
                                }
                              >
                                {coin.status === 'deployed' ? '✓ Deployed' : '⏳ Pending'}
                              </Badge>
                            </div>
                          </div>

                          {/* Content Info */}
                          <div className="p-4 space-y-3">
                            <div>
                              <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                                {coin.title}
                              </h3>
                              <p className="text-gray-400 text-xs">
                                {coin.coinSymbol} • {formatTimeAgo(coin.createdAt)}
                              </p>
                            </div>

                            {/* Compact Info Row */}
                            <div className="flex items-center justify-between pt-2 text-xs">
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
                                    className="h-4 p-1 text-xs text-blue-400 hover:text-blue-300"
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
                                className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold text-xs h-7"
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