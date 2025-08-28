
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, X, Music } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';
import { useCreatorCoins } from '@/hooks/useCreatorCoins';

interface LeaderboardEntry {
  id: string;
  rank: number;
  avatar: string;
  username: string;
  handle: string;
  marketCap: string;
  trend: 'up' | 'down';
  trendAmount: string;
  socialLinks: {
    x?: boolean;
    farcaster?: boolean;
    tiktok?: boolean;
  };
  timeAgo: string;
  coinAddress?: string;
}

const Leaderboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: creatorCoins, isLoading } = useCreatorCoins();

  // Transform creator coins data to leaderboard format
  const leaderboardData: LeaderboardEntry[] = creatorCoins?.map((coin: any, index: number) => ({
    id: coin.id,
    rank: index + 1,
    avatar: coin.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${coin.name}`,
    username: coin.name || `Creator ${index + 1}`,
    handle: `@${coin.symbol?.toLowerCase() || `creator${index + 1}`}`,
    marketCap: `$${(Math.random() * 15 + 1).toFixed(1)}m`,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendAmount: `$${(Math.random() * 2 + 0.1).toFixed(1)}m`,
    socialLinks: {
      x: Math.random() > 0.5,
      farcaster: Math.random() > 0.7,
      tiktok: Math.random() > 0.8,
    },
    timeAgo: `${Math.floor(Math.random() * 30 + 1)}d`,
    coinAddress: coin.coinAddress,
  })) || [];

  const filteredData = leaderboardData.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-gray-400';
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400/10';
      case 2: return 'bg-gray-300/10';
      case 3: return 'bg-amber-600/10';
      default: return 'bg-gray-400/10';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-16 h-3" />
                      </div>
                    </div>
                    <Skeleton className="w-20 h-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">Top performing creator coins</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-2">
          {filteredData.map((entry) => (
            <Card key={entry.id} className="bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Left side - Rank, Avatar, User info */}
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full ${getRankBg(entry.rank)} flex items-center justify-center`}>
                      <span className={`text-sm font-bold ${getRankColor(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                      <img
                        src={entry.avatar}
                        alt={entry.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </div>

                    {/* User info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-foreground">{entry.username}</h3>
                        <span className="text-sm text-muted-foreground">{entry.handle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center - Market Cap and Trend */}
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{entry.marketCap}</div>
                      <div className={`flex items-center space-x-1 text-sm ${
                        entry.trend === 'up' ? 'text-green-500' : 'text-pink-500'
                      }`}>
                        {entry.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{entry.trendAmount}</span>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center space-x-2">
                      {entry.socialLinks.x && (
                        <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      {entry.socialLinks.farcaster && (
                        <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full" />
                        </div>
                      )}
                      {entry.socialLinks.tiktok && (
                        <div className="w-6 h-6 bg-pink-500/20 rounded-full flex items-center justify-center">
                          <Music className="w-3 h-3 text-pink-500" />
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div className="text-sm text-muted-foreground">
                      {entry.timeAgo}
                    </div>
                  </div>

                  {/* Right side - Buy button */}
                  <div>
                    {entry.coinAddress ? (
                      <Link to={`/token/${entry.coinAddress}`}>
                        <Button 
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-medium"
                        >
                          Buy
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-medium"
                        onClick={() => console.log(`Buy ${entry.username}`)}
                      >
                        Buy
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredData.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">Try adjusting your search query</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
