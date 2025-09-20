
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, TrendingDown, X, Trophy, Users, Coins, Activity, DollarSign, Calendar, Crown, ExternalLink, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface CreatorLeaderboardData {
  id: string;
  rank: number;
  address: string;
  name: string;
  avatar: string;
  
  // Content metrics
  contentsCreated: number;
  totalViews: number;
  totalLikes: number;
  
  // Trading metrics
  tradesCount: number;
  volumeTraded: string;
  uniqueTokensTraded: number;
  
  // Channel metrics
  channelsCreated: number;
  totalSubscribers: number;
  
  // Earnings metrics (real data)
  totalEarnings: string;
  earnings24h: string;
  tradingProfit: string;
  
  // Market metrics
  totalMarketCap: string;
  avgTokenPrice: string;
  topCoinSymbol: string;
  topCoinMarketCap: string;
  
  // Time metrics
  memberSince: string;
  lastActive: string;
  lastCoinCreated: string;
  
  // Social verification
  socialLinks: {
    x?: boolean;
    farcaster?: boolean;
    website?: string;
  };
  
  // Performance
  marketCapGrowth24h: number;
  priceChange24h: number;
  isVerified: boolean;
}

interface GlobalStats {
  totalUsers: number;
  totalContent: number;
  totalTrades: number;
  totalVolume: string;
  totalChannels: number;
  totalEarnings: string;
  totalMarketCap: string;
}

const Leaderboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('earnings');

  // Fetch real leaderboard data
  const { data: leaderboardData, isLoading: isLoadingLeaderboard, refetch } = useQuery({
    queryKey: ['creator-leaderboard', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard/creators?category=${activeTab}`);
      if (!response.ok) throw new Error('Failed to fetch creator leaderboard');
      return response.json() as CreatorLeaderboardData[];
    },
    refetchInterval: 10000 // Refetch every 10 seconds for real-time updates
  });

  // Fetch global stats
  const { data: globalStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['leaderboard-global-stats'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json() as GlobalStats;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const filteredData = leaderboardData?.filter(entry =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.topCoinSymbol?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
      case 1: return 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/30';
      case 2: return 'bg-gradient-to-r from-gray-300/20 to-gray-500/20 border-gray-300/30';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-amber-800/20 border-amber-600/30';
      default: return 'bg-card hover:bg-card/80';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Trophy className="w-5 h-5 text-gray-300" />;
      case 3: return <Trophy className="w-5 h-5 text-amber-600" />;
      default: return <span className={`text-lg font-bold ${getRankColor(rank)}`}>#{rank}</span>;
    }
  };

  const getTabMetrics = (creator: CreatorLeaderboardData, tab: string) => {
    switch (tab) {
      case 'earnings':
        return {
          primary: `$${creator.totalEarnings}`,
          secondary: `$${creator.earnings24h} (24h)`,
          tertiary: `${creator.contentsCreated} coins`,
          growth: creator.marketCapGrowth24h
        };
      case 'marketcap':
        return {
          primary: `$${creator.totalMarketCap}`,
          secondary: creator.topCoinSymbol ? `${creator.topCoinSymbol}: $${creator.topCoinMarketCap}` : 'No coins',
          tertiary: `Avg: $${creator.avgTokenPrice}`,
          growth: creator.priceChange24h
        };
      case 'content':
        return {
          primary: `${creator.contentsCreated} coins`,
          secondary: `${creator.totalViews.toLocaleString()} views`,
          tertiary: `${creator.totalLikes.toLocaleString()} likes`,
          growth: 0
        };
      case 'trading':
        return {
          primary: creator.volumeTraded,
          secondary: `${creator.tradesCount} trades`,
          tertiary: `${creator.uniqueTokensTraded} tokens`,
          growth: 0
        };
      default:
        return {
          primary: `$${creator.totalEarnings}`,
          secondary: `${creator.contentsCreated} coins`,
          tertiary: creator.totalMarketCap ? `$${creator.totalMarketCap} MC` : 'No MC',
          growth: creator.marketCapGrowth24h
        };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 2592000)}mo`;
  };

  if (isLoadingLeaderboard || isLoadingStats) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="w-full h-32" />
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
      {/* Header with Global Stats */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Creator Leaderboard
                <Badge variant="outline" className="ml-2">Live</Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Real-time rankings • Updates every 10s</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Global Stats Cards */}
          {globalStats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <Users className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-sm font-semibold">{globalStats.totalUsers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Creators</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <Coins className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <div className="text-sm font-semibold">{globalStats.totalContent.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Coins</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                  <div className="text-sm font-semibold">{globalStats.totalTrades.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Trades</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                  <div className="text-sm font-semibold">{globalStats.totalVolume}</div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <Activity className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                  <div className="text-sm font-semibold">{globalStats.totalMarketCap || '$0'}</div>
                  <div className="text-xs text-muted-foreground">Market Cap</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                  <div className="text-sm font-semibold">{globalStats.totalEarnings}</div>
                  <div className="text-xs text-muted-foreground">Earnings</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators, addresses, or coin symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="marketcap" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Market Cap
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Trading
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-2">
            {filteredData.map((creator) => {
              const metrics = getTabMetrics(creator, activeTab);
              return (
                <Card key={creator.id} className={`transition-all duration-300 hover:scale-[1.01] ${getRankBg(creator.rank)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Left side - Rank, Avatar, Creator info */}
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-background/50">
                          {getRankIcon(creator.rank)}
                        </div>

                        {/* Avatar */}
                        <div className="relative">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-background"
                          />
                          {creator.isVerified && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Trophy className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Creator info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-bold text-foreground truncate">{creator.name}</h3>
                            {creator.topCoinSymbol && (
                              <Badge variant="secondary" className="text-xs">
                                {creator.topCoinSymbol}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                            <span>{creator.address.slice(0, 6)}...{creator.address.slice(-4)}</span>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatTimeAgo(creator.memberSince)}</span>
                            </div>
                            {creator.lastCoinCreated && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Last coin: {formatTimeAgo(creator.lastCoinCreated)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Center - Metrics based on active tab */}
                      <div className="text-center px-4">
                        <div className="text-xl font-bold text-foreground mb-1">{metrics.primary}</div>
                        <div className="text-sm text-muted-foreground mb-1">{metrics.secondary}</div>
                        <div className="text-xs text-muted-foreground">{metrics.tertiary}</div>
                        {metrics.growth !== 0 && (
                          <div className={`text-xs font-medium mt-1 flex items-center justify-center gap-1 ${
                            metrics.growth > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {metrics.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(metrics.growth).toFixed(1)}%
                          </div>
                        )}
                      </div>

                      {/* Right side - Social Links and Actions */}
                      <div className="flex items-center space-x-3">
                        {/* Social Links */}
                        <div className="flex items-center space-x-2">
                          {creator.socialLinks.x && (
                            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
                              <X className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {creator.socialLinks.farcaster && (
                            <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 bg-white rounded-full" />
                            </div>
                          )}
                          {creator.socialLinks.website && (
                            <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                              <ExternalLink className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <Link to={`/creators/${creator.address}`}>
                          <Button 
                            variant="default"
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white px-6"
                          >
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {filteredData.length === 0 && !isLoadingLeaderboard && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground">Try adjusting your search query or check back later</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
