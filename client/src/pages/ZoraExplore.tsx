"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users, 
  Filter,
  Zap,
  ExternalLink,
  ArrowUpRight,
  Coins,
  Eye,
  Heart
} from 'lucide-react';
import { Link } from 'wouter';

const sortOptions = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'price-high', label: 'Price: High to Low', icon: DollarSign },
  { value: 'price-low', label: 'Price: Low to High', icon: DollarSign },
  { value: 'market-cap', label: 'Market Cap', icon: TrendingUp },
  { value: 'volume', label: '24h Volume', icon: TrendingUp },
  { value: 'trending', label: 'Trending', icon: TrendingUp },
];

const tokenTypes = [
  { value: 'all', label: 'All Tokens', color: 'bg-gray-100 text-gray-800' },
  { value: 'creator', label: 'Creator Coins', color: 'bg-purple-100 text-purple-800' },
  { value: 'content', label: 'Content Coins', color: 'bg-blue-100 text-blue-800' },
  { value: 'basic', label: 'Basic Tokens', color: 'bg-green-100 text-green-800' },
];

interface ZoraToken {
  id: string;
  address: string;
  name: string;
  symbol: string;
  description: string;
  type: 'creator' | 'content' | 'basic';
  creator: string;
  price: string;
  marketCap: string;
  volume24h: string;
  holders: number;
  change24h: number;
  imageUri?: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  stats?: {
    views: number;
    likes: number;
  };
  createdAt: string;
}

export default function ZoraExplore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Mock data - replace with real API calls to your Zora contracts
  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['zora-tokens', selectedType, sortBy, searchQuery],
    queryFn: async (): Promise<ZoraToken[]> => {
      // This would fetch from your backend API that queries the Zora factory contracts
      // For now, returning mock data
      return [
        {
          id: '1',
          address: '0x9339a481aA3067699899f72964a75dE36a528CC5',
          name: 'Creator Token',
          symbol: 'CREATOR',
          description: 'A creator coin for content monetization',
          type: 'creator',
          creator: '0x2f250c0440a48493719120BEb1A4f95ee3e72033',
          price: '0.001',
          marketCap: '10000',
          volume24h: '500',
          holders: 25,
          change24h: 12.5,
          imageUri: '/images/creator-token.png',
          socialLinks: {
            twitter: 'https://twitter.com/creator',
            discord: 'https://discord.gg/creator'
          },
          stats: {
            views: 1250,
            likes: 89
          },
          createdAt: '2025-01-15T10:30:00Z'
        },
        {
          id: '2',
          address: '0x1234567890123456789012345678901234567890',
          name: 'Music NFT Coin',
          symbol: 'MUSIC',
          description: 'Token for music content creators',
          type: 'content',
          creator: '0x9876543210987654321098765432109876543210',
          price: '0.0025',
          marketCap: '25000',
          volume24h: '1200',
          holders: 45,
          change24h: -5.2,
          stats: {
            views: 890,
            likes: 156
          },
          createdAt: '2025-01-14T15:45:00Z'
        }
      ];
    },
    refetchInterval: 10000,
  });

  const { data: trendingTokens = [] } = useQuery({
    queryKey: ['trending-zora-tokens'],
    queryFn: async () => {
      // Mock trending tokens
      return tokens.slice(0, 3);
    },
    refetchInterval: 30000,
  });

  const filteredTokens = tokens.filter((token: ZoraToken) => {
    const matchesSearch = !searchQuery || 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || token.type === selectedType;

    return matchesSearch && matchesType;
  });

  const formatPrice = (price: string) => {
    return `${parseFloat(price).toFixed(6)} ETH`;
  };

  const formatMarketCap = (marketCap: string) => {
    const value = parseFloat(marketCap);
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Search className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Zora Explore
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover and trade tokens created with Zora's bonding curve technology
          </p>
        </div>

        {/* Trending Section */}
        {trendingTokens.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Trending Zora Tokens
              </CardTitle>
              <CardDescription>
                Most active tokens in the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trendingTokens.map((token: ZoraToken) => (
                  <Card 
                    key={token.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:scale-105 bg-white dark:bg-gray-800"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{token.name}</h3>
                          <p className="text-sm text-muted-foreground">{token.symbol}</p>
                        </div>
                        <Badge className={tokenTypes.find(t => t.value === token.type)?.color}>
                          {tokenTypes.find(t => t.value === token.type)?.label}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium">{formatPrice(token.price)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">24h:</span>
                          {formatChange(token.change24h)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tokens by name, symbol, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tokenTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type.value)}
                    className="whitespace-nowrap"
                  >
                    {type.label}
                  </Button>
                ))}
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tokens Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTokens.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tokens found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `No tokens match your search "${searchQuery}"`
                  : "No Zora tokens available yet"
                }
              </p>
              <Link href="/zoracreate">
                <Button>
                  <Zap className="mr-2 h-4 w-4" />
                  Create First Token
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTokens.map((token: ZoraToken) => (
              <Link key={token.id} href={`/zora/${token.id}`}>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 group bg-white dark:bg-gray-800 border-2 hover:border-purple-200"
                >
                  <CardContent className="p-0">
                    {/* Token Header */}
                    <div className="relative p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                          {token.symbol.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate text-gray-900 dark:text-gray-100">
                            {token.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{token.symbol}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Type Badge */}
                      <Badge 
                        className={`absolute top-2 right-2 ${tokenTypes.find(t => t.value === token.type)?.color}`}
                      >
                        {tokenTypes.find(t => t.value === token.type)?.label}
                      </Badge>
                    </div>

                    <div className="p-4">
                      {/* Description */}
                      {token.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {token.description}
                        </p>
                      )}

                      {/* Price Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Price</span>
                          <span className="font-semibold">{formatPrice(token.price)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">24h Change</span>
                          {formatChange(token.change24h)}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Market Cap</span>
                          <span className="font-medium">{formatMarketCap(token.marketCap)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Holders</span>
                          <span className="font-medium">{token.holders}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      {token.stats && (
                        <div className="flex justify-between items-center mb-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {token.stats.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {token.stats.likes}
                          </div>
                        </div>
                      )}

                      {/* Creator Info */}
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Creator</span>
                          <span className="text-xs font-mono">
                            {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                          </span>
                        </div>
                      </div>

                      {/* Social Links */}
                      {token.socialLinks && (
                        <div className="mt-3 flex gap-2">
                          {token.socialLinks.twitter && (
                            <Button size="sm" variant="ghost" className="p-1 h-auto">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          {token.socialLinks.discord && (
                            <Button size="sm" variant="ghost" className="p-1 h-auto">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          {token.socialLinks.website && (
                            <Button size="sm" variant="ghost" className="p-1 h-auto">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Ready to Launch Your Token?</h3>
            <p className="text-muted-foreground mb-6">
              Create your own token with Zora's advanced bonding curve technology
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/zoracreate">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Zap className="h-5 w-5 mr-2" />
                  Create Token
                </Button>
              </Link>
              <Button variant="outline" size="lg" asChild>
                <a 
                  href="https://sepolia.basescan.org/address/0xa8452ec99ce0c64f20701db7dd3abdb607c00496" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Factory
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}