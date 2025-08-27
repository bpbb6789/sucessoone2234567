import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Play, Heart, Share2, MoreHorizontal, Hash, Eye, Copy } from "lucide-react";
import { useCreatorCoins } from '@/hooks/useCreatorCoins';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';

interface ContentCoin {
  id: string;
  title: string;
  coinName: string;
  coinSymbol: string;
  description?: string;
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

export default function ContentCoin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Get creator coins from API
  const { data: contentCoins, isLoading, error } = useCreatorCoins();

  // Filter and sort content
  const filteredContent = (contentCoins || [])
    .filter((coin: ContentCoin) => {
      const matchesSearch = coin.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.coinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.coinSymbol.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = selectedFilter === 'all' || 
        selectedFilter === coin.contentType ||
        (selectedFilter === 'deployed' && coin.status === 'deployed');

      return matchesSearch && matchesFilter;
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Content Coins
              </h1>
              <p className="text-gray-400 text-lg">
                Your tokenized content collection • {filteredContent.length} items
              </p>
            </div>
            <Link to="/create-content-coin">
              <Button 
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-full"
                data-testid="button-create-content-coin"
              >
                + Create Content Coin
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search content coins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                data-testid="input-search-content"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedFilter('all')}
                className={selectedFilter === 'all' ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
              >
                All
              </Button>
              <Button
                variant={selectedFilter === 'image' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedFilter('image')}
                className={selectedFilter === 'image' ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
              >
                Images
              </Button>
              <Button
                variant={selectedFilter === 'video' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedFilter('video')}
                className={selectedFilter === 'video' ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
              >
                Videos
              </Button>
              <Button
                variant={selectedFilter === 'deployed' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedFilter('deployed')}
                className={selectedFilter === 'deployed' ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
              >
                Deployed
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredContent.map((coin: ContentCoin) => (
              <Link to={`/contentcoin/${coin.memeTokenAddress || coin.id}`} key={coin.id}>
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
                            // TODO: Implement buy functionality
                            console.log("Buy button clicked for:", coin.id);
                          }}
                        >
                          BUY
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}