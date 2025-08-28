
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Users, TrendingUp, Star, Award, Coins, MessageSquare, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';
import { useCreators } from '@/hooks/useCreators';

interface Creator {
  id: string;
  address: string;
  name: string;
  username: string;
  contentCoins: number;
  totalLikes: number;
  totalComments: number;
  memberSince: string;
  lastActive: string;
  rank: number;
}

const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 1) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 30) return `${diffInDays}d ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
};

export default function Creators() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('contentCoins'); // contentCoins, totalLikes, totalComments

  // Get real creators data
  const { data: creators, isLoading, error } = useCreators();

  // Filter and sort creators
  const filteredCreators = (creators || [])
    .filter((creator: Creator) => {
      const matchesSearch = 
        creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.address.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    })
    .sort((a: Creator, b: Creator) => {
      switch (sortBy) {
        case 'totalLikes':
          return b.totalLikes - a.totalLikes;
        case 'totalComments':
          return b.totalComments - a.totalComments;
        default:
          return b.contentCoins - a.contentCoins;
      }
    });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
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
            <p className="text-red-500 mb-4">Error loading creators: {error.message}</p>
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
                Content Creators ({creators?.length || 0})
              </h1>
              <p className="text-gray-400 text-lg">
                Discover creators who have deployed content coins on the platform
              </p>
            </div>
            <Link to="/create-content-coin">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Coins className="mr-2 h-4 w-4" />
                Create Content Coin
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Creators</p>
                    <p className="text-xl font-bold text-white">{creators?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Content Coins</p>
                    <p className="text-xl font-bold text-white">
                      {creators?.reduce((sum: number, creator: Creator) => sum + creator.contentCoins, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Likes</p>
                    <p className="text-xl font-bold text-white">
                      {creators?.reduce((sum: number, creator: Creator) => sum + creator.totalLikes, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Comments</p>
                    <p className="text-xl font-bold text-white">
                      {creators?.reduce((sum: number, creator: Creator) => sum + creator.totalComments, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search creators by address or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                data-testid="input-search-creators"
              />
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
            >
              <option value="contentCoins">Sort by Content Coins</option>
              <option value="totalLikes">Sort by Total Likes</option>
              <option value="totalComments">Sort by Total Comments</option>
            </select>
          </div>
        </div>

        {/* Creators Grid */}
        {filteredCreators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <Coins className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No creators found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm ? `No creators match "${searchTerm}"` : 'No content creators have deployed coins yet'}
              </p>
              <Link to="/create-content-coin">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  <Coins className="mr-2 h-4 w-4" />
                  Be the First Creator
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCreators.map((creator: Creator, index: number) => {
              // Generate vibrant gradient colors for each creator
              const gradients = [
                'from-orange-400 via-red-500 to-pink-500',
                'from-lime-400 via-green-500 to-emerald-500', 
                'from-blue-400 via-purple-500 to-pink-500',
                'from-yellow-400 via-orange-500 to-red-500',
                'from-cyan-400 via-blue-500 to-purple-500',
                'from-emerald-400 via-teal-500 to-cyan-500',
                'from-pink-400 via-rose-500 to-red-500',
                'from-indigo-400 via-purple-500 to-pink-500'
              ];
              const gradientClass = gradients[index % gradients.length];
              
              return (
                <div key={creator.id} className="group cursor-pointer" data-testid={`creator-card-${creator.id}`}>
                  <div className={`relative bg-gradient-to-br ${gradientClass} rounded-2xl p-6 h-80 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
                    {/* Rank Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                        #{creator.rank}
                      </div>
                    </div>

                    {/* Creator Avatar */}
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full border-4 border-white/30 flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {creator.name.charAt(0)}
                        </span>
                      </div>
                    </div>

                    {/* Creator Content */}
                    <div className="text-center text-white space-y-3">
                      <div>
                        <h3 className="text-xl font-bold mb-1 group-hover:scale-105 transition-transform">
                          /{creator.name}
                        </h3>
                        <p className="text-white/80 text-sm">{creator.username}</p>
                      </div>

                      {/* Stats Grid */}
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80 text-sm">Content Coins</span>
                          <span className="text-white font-bold">{creator.contentCoins}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80 text-sm">Total Likes</span>
                          <span className="text-white font-bold">{creator.totalLikes}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80 text-sm">Comments</span>
                          <span className="text-white font-bold">{creator.totalComments}</span>
                        </div>
                      </div>

                      {/* Member Info */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                        <p className="text-white/80 text-xs">
                          Member since {formatTimeAgo(creator.memberSince)}
                        </p>
                      </div>
                    </div>

                    {/* View Profile Button */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <Link to={`/creators/${creator.address}`}>
                        <Button 
                          className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 font-semibold transition-all duration-300 hover:scale-105"
                          data-testid={`view-creator-${creator.id}`}
                        >
                          View Profile
                        </Button>
                      </Link>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full"></div>
                    <div className="absolute -bottom-5 -left-5 w-15 h-15 bg-white/5 rounded-full"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
