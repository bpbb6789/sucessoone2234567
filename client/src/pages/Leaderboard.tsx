
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, TrendingDown, X, Music, Trophy, Users, Coins, Activity, DollarSign, Calendar, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface UserRankingData {
  id: string;
  rank: number;
  address: string;
  username: string;
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
  
  // Earnings metrics
  totalEarnings: string;
  creatorRewards: string;
  tradingProfit: string;
  
  // Overall score
  overallScore: number;
  
  // Social info
  socialLinks: {
    x?: boolean;
    farcaster?: boolean;
    tiktok?: boolean;
  };
  memberSince: string;
  lastActive: string;
}

interface GlobalStats {
  totalUsers: number;
  totalContent: number;
  totalTrades: number;
  totalVolume: string;
  totalChannels: number;
  totalEarnings: string;
}

const Leaderboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overall');

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['leaderboard', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?category=${activeTab}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json() as UserRankingData[];
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });

  // Fetch global stats
  const { data: globalStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['leaderboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json() as GlobalStats;
    },
    refetchInterval: 300000
  });

  const filteredData = leaderboardData?.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.address.toLowerCase().includes(searchQuery.toLowerCase())
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
      case 1: return 'bg-yellow-400/10 border-yellow-400/20';
      case 2: return 'bg-gray-300/10 border-gray-300/20';
      case 3: return 'bg-amber-600/10 border-amber-600/20';
      default: return 'bg-gray-400/5';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Trophy className="w-5 h-5 text-gray-300" />;
      case 3: return <Trophy className="w-5 h-5 text-amber-600" />;
      default: return <span className={`text-sm font-bold ${getRankColor(rank)}`}>{rank}</span>;
    }
  };

  const getTabMetrics = (user: UserRankingData, tab: string) => {
    switch (tab) {
      case 'content':
        return {
          primary: `${user.contentsCreated} posts`,
          secondary: `${user.totalViews.toLocaleString()} views`,
          tertiary: `${user.totalLikes.toLocaleString()} likes`
        };
      case 'trading':
        return {
          primary: user.volumeTraded,
          secondary: `${user.tradesCount} trades`,
          tertiary: `${user.uniqueTokensTraded} tokens`
        };
      case 'channels':
        return {
          primary: `${user.channelsCreated} channels`,
          secondary: `${user.totalSubscribers.toLocaleString()} subs`,
          tertiary: 'Active creator'
        };
      case 'earnings':
        return {
          primary: user.totalEarnings,
          secondary: user.creatorRewards,
          tertiary: user.tradingProfit
        };
      default: // overall
        return {
          primary: `${user.overallScore} pts`,
          secondary: `${user.contentsCreated}C • ${user.tradesCount}T`,
          tertiary: user.totalEarnings
        };
    }
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
                Platform Leaderboard
              </h1>
              <p className="text-sm text-muted-foreground">Top performers across all categories</p>
            </div>
          </div>

          {/* Global Stats Cards */}
          {globalStats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <Users className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-sm font-semibold">{globalStats.totalUsers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Users</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <Activity className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <div className="text-sm font-semibold">{globalStats.totalContent.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Content</div>
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
                  <Coins className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                  <div className="text-sm font-semibold">{globalStats.totalChannels.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Channels</div>
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
              placeholder="Search users..."
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overall" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Overall
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Earnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-2">
            {filteredData.map((user) => {
              const metrics = getTabMetrics(user, activeTab);
              return (
                <Card key={user.id} className={`hover:bg-card/80 transition-colors ${getRankBg(user.rank)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Left side - Rank, Avatar, User info */}
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center`}>
                          {getRankIcon(user.rank)}
                        </div>

                        {/* Avatar */}
                        <div className="relative">
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {user.rank <= 3 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Trophy className="w-3 h-3 text-yellow-900" />
                            </div>
                          )}
                        </div>

                        {/* User info */}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-foreground">{user.username}</h3>
                            <span className="text-sm text-muted-foreground">
                              {user.address.slice(0, 6)}...{user.address.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Member since {user.memberSince}</span>
                          </div>
                        </div>
                      </div>

                      {/* Center - Metrics based on active tab */}
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-foreground">{metrics.primary}</div>
                          <div className="text-sm text-muted-foreground">{metrics.secondary}</div>
                          <div className="text-xs text-muted-foreground">{metrics.tertiary}</div>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center space-x-2">
                          {user.socialLinks.x && (
                            <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                              <X className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                          {user.socialLinks.farcaster && (
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-purple-500 rounded-full" />
                            </div>
                          )}
                          {user.socialLinks.tiktok && (
                            <div className="w-6 h-6 bg-pink-500/20 rounded-full flex items-center justify-center">
                              <Music className="w-3 h-3 text-pink-500" />
                            </div>
                          )}
                        </div>

                        {/* Last Active */}
                        <div className="text-sm text-muted-foreground">
                          {user.lastActive}
                        </div>
                      </div>

                      {/* Right side - Profile button */}
                      <div>
                        <Link to={`/profile/${user.address}`}>
                          <Button 
                            variant="outline"
                            className="px-4 py-2 rounded-full font-medium"
                          >
                            View Profile
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
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">Try adjusting your search query or check back later</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
