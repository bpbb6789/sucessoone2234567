
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Users, TrendingUp, Star, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';

interface Creator {
  id: string;
  name: string;
  username: string;
  releases: number;
  totalMints: number;
  verified: boolean;
  followers: number;
  avatar?: string;
  coverImage?: string;
  description?: string;
  category: string;
}

// Mock creator data - replace with real API data later
const mockCreators: Creator[] = [
  {
    id: "1",
    name: "ATRIP",
    username: "@atrip",
    releases: 22,
    totalMints: 15420,
    verified: true,
    followers: 8900,
    description: "Electronic music producer & NFT artist",
    category: "Music"
  },
  {
    id: "2",
    name: "jigitz",
    username: "@jigitz",
    releases: 20,
    totalMints: 12300,
    verified: false,
    followers: 6700,
    description: "Digital art & generative visuals",
    category: "Art"
  },
  {
    id: "3",
    name: "Daniel Allan",
    username: "@danielallan",
    releases: 19,
    totalMints: 18900,
    verified: true,
    followers: 12400,
    description: "Singer-songwriter & Web3 musician",
    category: "Music"
  },
  {
    id: "4",
    name: "33 Below",
    username: "@33below",
    releases: 19,
    totalMints: 9800,
    verified: false,
    followers: 5600,
    description: "Hip-hop artist & content creator",
    category: "Music"
  },
  {
    id: "5",
    name: "CryptoKitty",
    username: "@cryptokitty",
    releases: 15,
    totalMints: 7200,
    verified: true,
    followers: 4300,
    description: "NFT collector & digital artist",
    category: "NFT"
  },
  {
    id: "6",
    name: "VideoVibe",
    username: "@videovibe",
    releases: 12,
    totalMints: 5500,
    verified: false,
    followers: 3200,
    description: "Short-form video content creator",
    category: "Videos"
  },
  {
    id: "7",
    name: "FashionForward",
    username: "@fashionforward",
    releases: 18,
    totalMints: 11200,
    verified: true,
    followers: 8900,
    description: "Fashion designer & lifestyle content",
    category: "Fashion"
  },
  {
    id: "8",
    name: "GenZGuru",
    username: "@genzguru",
    releases: 14,
    totalMints: 6700,
    verified: false,
    followers: 4800,
    description: "Gen Z trends & cultural commentary",
    category: "GenZ"
  }
];

const categories = ["All", "Music", "Art", "NFT", "Videos", "Fashion", "GenZ", "Sports", "Skits"];

export default function Creators() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('releases'); // releases, mints, followers

  // Filter and sort creators
  const filteredCreators = mockCreators
    .filter((creator) => {
      const matchesSearch = 
        creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (creator.description && creator.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || 
        creator.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'mints':
          return b.totalMints - a.totalMints;
        case 'followers':
          return b.followers - a.followers;
        default:
          return b.releases - a.releases;
      }
    });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Creators ({mockCreators.length})
              </h1>
              <p className="text-gray-400 text-lg">
                Discover and follow the best content creators on the platform
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Creators</p>
                    <p className="text-xl font-bold text-white">{mockCreators.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Releases</p>
                    <p className="text-xl font-bold text-white">
                      {mockCreators.reduce((sum, creator) => sum + creator.releases, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Mints</p>
                    <p className="text-xl font-bold text-white">
                      {mockCreators.reduce((sum, creator) => sum + creator.totalMints, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Verified</p>
                    <p className="text-xl font-bold text-white">
                      {mockCreators.filter(c => c.verified).length}
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
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category 
                    ? "bg-green-500 text-black hover:bg-green-600" 
                    : "border-gray-600 text-gray-400 hover:bg-gray-700"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
            >
              <option value="releases">Sort by Releases</option>
              <option value="mints">Sort by Mints</option>
              <option value="followers">Sort by Followers</option>
            </select>
          </div>
        </div>

        {/* Creators Grid */}
        {filteredCreators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">No creators found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm ? `No creators match "${searchTerm}"` : 'No creators in this category'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCreators.map((creator) => (
              <Link to={`/creator/${creator.id}`} key={creator.id}>
                <Card className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer group">
                  <CardContent className="p-0">
                    {/* Cover Image */}
                    <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500">
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    </div>

                    {/* Avatar and Info */}
                    <div className="relative px-6 pb-6">
                      {/* Avatar */}
                      <div className="absolute -top-8 left-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-4 border-gray-800 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {creator.name.charAt(0)}
                          </span>
                        </div>
                        {creator.verified && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>

                      {/* Creator Info */}
                      <div className="pt-10 space-y-3">
                        <div>
                          <h3 className="font-bold text-white text-lg group-hover:text-green-400 transition-colors">
                            {creator.name}
                          </h3>
                          <p className="text-gray-400 text-sm">{creator.username}</p>
                        </div>

                        {creator.description && (
                          <p className="text-gray-300 text-sm line-clamp-2">
                            {creator.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div className="text-center">
                            <p className="text-white font-semibold">{creator.releases}</p>
                            <p className="text-gray-400 text-xs">Releases</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-semibold">{creator.totalMints.toLocaleString()}</p>
                            <p className="text-gray-400 text-xs">Mints</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-semibold">{creator.followers.toLocaleString()}</p>
                            <p className="text-gray-400 text-xs">Followers</p>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <div className="flex justify-between items-center pt-2">
                          <Badge 
                            variant="secondary" 
                            className="bg-gray-700 text-gray-300"
                          >
                            {creator.category}
                          </Badge>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-black font-semibold">
                            Follow
                          </Button>
                        </div>
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
