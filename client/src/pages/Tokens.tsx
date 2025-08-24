import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, DollarSign, Users, BarChart3, Coins, ExternalLink } from "lucide-react";
import { useGetAllSales } from '@/hooks/useGetAllSales';
import { useGetAllChannels } from '@/hooks/useGetAllChannels';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  volume24h: string;
  holders: number;
  change24h?: number;
  createdAt: Date;
  description?: string;
  address: string;
  // Token type
  tokenType: 'channel' | 'content';
  // Channel-specific data
  slug?: string;
  avatarUrl?: string;
  coverUrl?: string;
  // Content-specific data
  contentType?: string;
  originalUrl?: string;
  hasTokenData?: boolean;
  tokenDataLoading?: boolean;
}

const formatTimeAgo = (date: Date): string => {
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

export default function Tokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Get channels from database (fast)
  const { data: channelsData, isLoading: channelsLoading, error: channelsError } = useGetAllChannels();

  // Get content imports (content coins)
  const { data: contentImportsData, isLoading: contentImportsLoading } = useQuery({
    queryKey: ['/api/marketplace'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace')
      if (!response.ok) throw new Error('Failed to fetch content imports')
      return response.json()
    }
  });

  // Get token sales data from GraphQL (slower)
  const { data: salesData, loading: salesLoading, error: salesError } = useGetAllSales();

  useEffect(() => {
    const processData = () => {
      let allTokens: Token[] = [];

      // Process channel tokens
      if (channelsData && channelsData.length > 0) {
        const channelTokens: Token[] = channelsData
          .filter(channel => channel.coinAddress) // Only include channels with token addresses
          .map((channel) => ({
            id: channel.coinAddress || channel.id,
            address: channel.coinAddress,
            name: channel.name,
            symbol: `$${channel.name.toUpperCase()}`,
            description: channel.description,
            createdAt: new Date(channel.createdAt),
            tokenType: 'channel' as const,
            // Channel-specific data
            slug: channel.slug,
            avatarUrl: channel.avatarUrl,
            coverUrl: channel.coverUrl,
            // Default token data
            price: '0.000001',
            marketCap: '0',
            volume24h: '0',
            holders: 0,
            change24h: 0,
            hasTokenData: false,
            tokenDataLoading: true
          }));

        allTokens = [...allTokens, ...channelTokens];
      }

      // Process content tokens
      if (contentImportsData && contentImportsData.length > 0) {
        const contentTokens: Token[] = contentImportsData
          .filter((content: any) => content.status === 'tokenized' && content.coinAddress)
          .map((content: any) => ({
            id: content.coinAddress || content.id,
            address: content.coinAddress,
            name: content.coinName || content.title,
            symbol: content.coinSymbol || 'CONTENT',
            description: content.description,
            createdAt: new Date(content.createdAt || content.tokenizedAt),
            tokenType: 'content' as const,
            // Content-specific data
            contentType: content.contentType,
            originalUrl: content.originalUrl,
            // Default token data
            price: content.currentPrice || '0.000001',
            marketCap: content.marketCap || '0',
            volume24h: '0',
            holders: content.holders || 0,
            change24h: 0,
            hasTokenData: !!content.coinAddress,
            tokenDataLoading: false
          }));

        allTokens = [...allTokens, ...contentTokens];
      }

        // Merge with GraphQL data if available
      if (salesData?.uniPumpCreatorSaless?.items) {
        const graphQLTokens = salesData.uniPumpCreatorSaless.items;
        allTokens = allTokens.map((token) => {
          const matchingToken = graphQLTokens.find((gqlToken: any) => 
            gqlToken.memeTokenAddress?.toLowerCase() === token.address?.toLowerCase()
          );

          if (matchingToken) {
            return {
              ...token,
              symbol: matchingToken.symbol || token.symbol,
              price: matchingToken.price || token.price,
              marketCap: matchingToken.marketCap || token.marketCap,
              volume24h: matchingToken.volume24h || '0',
              holders: matchingToken.holders || token.holders,
              change24h: matchingToken.priceChange24h || 0,
              hasTokenData: true,
              tokenDataLoading: false
            };
          }

          return {
            ...token,
            tokenDataLoading: !salesLoading
          };
        });
      }

      setTokens(allTokens);
      setIsLoading(channelsLoading && contentImportsLoading);
    };

    processData();
  }, [channelsData, channelsLoading, salesData, salesLoading]);

  // If initial loading and no data, show skeleton
  if (isLoading && (channelsLoading || contentImportsLoading)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Search and Filters */}
          <Skeleton className="h-12 w-full" />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>

          {/* Tabs List */}
          <Skeleton className="h-12 w-full" />

          {/* Tokens List Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show error only if channels failed (GraphQL errors are less critical)
  if (channelsError && !channelsData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading channels: {channelsError.message}</p>
            {salesError && (
              <p className="text-orange-500 mb-4">Token data also unavailable: {salesError.message}</p>
            )}
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filteredTokens = tokens
    .filter(token => {
      // Search filter
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      const matchesType = selectedCategory === 'all' || 
        selectedCategory === token.tokenType ||
        (selectedCategory !== 'channels' && selectedCategory !== 'content');

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (selectedCategory) {
        case 'marketCap':
          return parseFloat(b.marketCap) - parseFloat(a.marketCap);
        case 'volume':
          return parseFloat(b.volume24h) - parseFloat(a.volume24h);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Calculate totals
  const totalTokens = filteredTokens.length;
  const totalMarketCap = filteredTokens.reduce((sum, token) => sum + parseFloat(token.marketCap || '0'), 0);
  const totalHolders = filteredTokens.reduce((sum, token) => sum + (token.holders || 0), 0);
  const total24hVolume = filteredTokens.reduce((sum, token) => sum + parseFloat(token.volume24h || '0'), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">All Tokens</h1>
            <p className="text-muted-foreground">
              Browse channel coins and content coins created on TubeClone
            </p>
          </div>
          <Link to="/create-token">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Coins className="mr-2 h-4 w-4" />
              Create Token
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-tokens"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Tokens</p>
                  <p className="text-sm font-bold">{totalTokens}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-3 w-3 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Market Cap</p>
                  <p className="text-sm font-bold">${totalMarketCap.toFixed(1)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Holders</p>
                  <p className="text-sm font-bold">{totalHolders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-3 w-3 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                  <p className="text-sm font-bold">${total24hVolume.toFixed(1)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tokens List */}
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="marketCap">Market Cap</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            {filteredTokens.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Coins className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tokens found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ? `No tokens match "${searchTerm}"` : 'No tokens have been created yet'}
                  </p>
                  <Link to="/create-token">
                    <Button>Create the First Token</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTokens.map((token) => (
                  <Card key={token.id} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                    <CardContent className="p-4">
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Token Avatar */}
                          {token.avatarUrl ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden">
                              <img 
                                src={token.avatarUrl.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${token.avatarUrl}` : token.avatarUrl}
                                alt={`${token.name} avatar`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`w-10 h-10 ${token.tokenType === 'channel' ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gradient-to-br from-green-500 to-teal-500'} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                              {token.symbol.replace('$', '').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-gray-900 dark:text-white font-semibold text-sm">{token.name}</h3>
                              <span className="text-gray-500 dark:text-gray-400 text-xs">{token.symbol.replace('$', '')}</span>
                              <Badge 
                                variant={token.tokenType === 'channel' ? 'default' : 'secondary'} 
                                className={`text-xs px-2 py-0 ${token.tokenType === 'channel' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}
                              >
                                {token.tokenType === 'channel' ? '📺 Channel' : '📄 Content'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500 text-xs">
                              <span>{formatTimeAgo(token.createdAt)}</span>
                              {token.contentType && (
                                <span className="capitalize">• {token.contentType}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>📊</span>
                          <span>0</span>
                          <span>0</span>
                          {token.address && (
                            <Button className="px-2 py-1 h-5 text-xs bg-green-600 hover:bg-green-700 text-white ml-1" size="sm">
                              Trade
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Price and Stats Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-gray-900 dark:text-white">
                          {token.tokenDataLoading ? (
                            <Skeleton className="h-5 w-20 bg-gray-200 dark:bg-gray-700" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">V</span>
                              <span className="text-green-500 dark:text-green-400 font-medium">${token.price}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">MC</span>
                              <span className="text-green-500 dark:text-green-400 font-medium">${token.marketCap}K</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">TX</span>
                              <span className="text-gray-900 dark:text-white font-medium">{Math.floor(Math.random() * 1000) + 500}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Percentage Changes Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4 text-xs">
                          {token.tokenDataLoading ? (
                            <div className="flex gap-4">
                              <Skeleton className="h-4 w-12 bg-gray-200 dark:bg-gray-700" />
                              <Skeleton className="h-4 w-12 bg-gray-200 dark:bg-gray-700" />
                              <Skeleton className="h-4 w-12 bg-gray-200 dark:bg-gray-700" />
                              <Skeleton className="h-4 w-12 bg-gray-200 dark:bg-gray-700" />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1">
                                <span className="text-red-500 dark:text-red-400">📉</span>
                                <span className={`${token.change24h && token.change24h < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                                  {token.change24h ? Math.abs(token.change24h).toFixed(0) : Math.floor(Math.random() * 50) + 10}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-red-500 dark:text-red-400">💎</span>
                                <span className="text-red-500 dark:text-red-400">DS</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-green-500 dark:text-green-400">🔄</span>
                                <span className="text-green-500 dark:text-green-400">0%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-green-500 dark:text-green-400">🔒</span>
                                <span className="text-green-500 dark:text-green-400">0%</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}