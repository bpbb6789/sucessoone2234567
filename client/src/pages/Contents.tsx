
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Play, Hash, Eye } from "lucide-react";
import { useCreatorCoins } from '@/hooks/useCreatorCoins';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';
import { CategoryChips } from "@/components/CategoryChips";
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
  deploymentTxHash?: string | null;
  creatorAddress: string;
  status: string;
  createdAt: Date | null | string;
  likes: number;
  currency: string;
  currentPrice: string;
  memeTokenAddress?: string;
}

const formatTimeAgo = (dateValue: Date | null | string): string => {
  if (!dateValue) return 'Unknown';
  
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
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

export default function Contents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Get creator coins from API
  const { data: contentCoins, isLoading, error } = useCreatorCoins();

  // Filter and sort content
  const filteredContent = (contentCoins || [])
    .filter((coin: any) => {
      const matchesSearch = !searchTerm || 
        coin.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.coinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.coinSymbol.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || 
        coin.contentType.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Onchain' && coin.status === 'deployed');

      return matchesSearch && matchesCategory;
    })
    .sort((a: any, b: any) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });

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
            {Array.from({ length: 20 }).map((_, i) => (
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
              All Content Coins
            </h1>
            <p className="text-gray-400 text-lg">
              Explore all tokenized content • {filteredContent.length} items
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search content coins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-col gap-4">
            <CategoryChips 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredContent.map((coin: any) => (
              <Link to={`/content/base/${coin.memeTokenAddress || coin.id}`} key={coin.id}>
                <Card 
                  className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer group relative overflow-hidden"
                >
                  <CardContent className="p-0">
                    {/* Content Preview */}
                    <div className="relative aspect-square overflow-hidden">
                      <div className="group-hover:scale-105 transition-transform duration-300">
                        <ContentPreview
                          mediaCid={coin.mediaCid}
                          thumbnailCid={coin.thumbnailCid}
                          contentType={coin.contentType}
                          title={coin.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-1 right-1">
                        <Badge 
                          variant={coin.status === 'deployed' ? 'default' : 'secondary'}
                          className={`text-[10px] px-1.5 py-0.5 h-4 ${coin.status === 'deployed' 
                            ? 'bg-green-500 text-black' 
                            : 'bg-yellow-500 text-black'
                          }`}
                        >
                          {coin.status === 'deployed' ? '✓' : '⏳'}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-2 space-y-1.5">
                      <div>
                        <h3 className="font-semibold text-white text-[11px] line-clamp-2 mb-0.5">
                          {coin.title}
                        </h3>
                        <p className="text-gray-400 text-[10px]">
                          {coin.coinSymbol} • {formatTimeAgo(coin.createdAt)}
                        </p>
                      </div>

                      {/* Stats Row with Holders and Price */}
                      <div className="space-y-0.5">
                        {/* Holders and Likes Row */}
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              <span className="text-[9px]">👥</span>
                              <span className="text-gray-400">{(coin as any).holders || 0}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <span className="text-[9px]">❤️</span>
                              <span className="text-gray-400">{coin.likes || 0}</span>
                            </div>
                          </div>
                          <div className="text-green-400 font-medium text-[10px]">
                            ${coin.currentPrice}
                          </div>
                        </div>

                        {/* Contract info */}
                        {coin.status === 'deployed' && coin.coinAddress && (
                          <div className="flex items-center justify-between text-[9px]">
                            <div className="flex items-center gap-0.5">
                              <Hash className="w-2 h-2 text-green-400" />
                              <code className="text-green-400 font-mono">
                                {`${coin.coinAddress.slice(0, 4)}...${coin.coinAddress.slice(-2)}`}
                              </code>
                            </div>
                            {coin.deploymentTxHash && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-3 p-0.5 text-[9px] text-blue-400 hover:text-blue-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://sepolia.basescan.org/tx/${coin.deploymentTxHash}`, '_blank');
                                }}
                              >
                                <Eye className="w-2 h-2" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* BUY Button */}
                      <Button
                        size="sm"
                        className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold text-[10px] h-5"
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
        )}
      </div>
    </div>
  );
}
