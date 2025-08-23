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
  // Channel-specific data
  slug?: string;
  avatarUrl?: string;
  coverUrl?: string;
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
  
  // Get token sales data from GraphQL (slower)
  const { data: salesData, loading: salesLoading, error: salesError } = useGetAllSales();

  useEffect(() => {
    const processData = () => {
      // Start with channels data (fast, always show these)
      if (channelsData && channelsData.length > 0) {
        const channelTokens: Token[] = channelsData.map((channel) => ({
          id: channel.coinAddress || channel.id,
          address: channel.coinAddress,
          name: channel.name,
          symbol: `$${channel.name.toUpperCase()}`, // Default symbol from name
          description: channel.description,
          createdAt: new Date(channel.createdAt),
          // Channel-specific data
          slug: channel.slug,
          avatarUrl: channel.avatarUrl,
          coverUrl: channel.coverUrl,
          // Default token data (will be updated when GraphQL loads)
          price: '0.000001',
          marketCap: '0',
          volume24h: '0',
          holders: 0,
          change24h: 0,
          hasTokenData: false,
          tokenDataLoading: true
        }));

        // If we have GraphQL data, merge it with channel data
        if (salesData?.uniPumpCreatorSaless?.items) {
          const graphQLTokens = salesData.uniPumpCreatorSaless.items;
          const mergedTokens = channelTokens.map((channelToken) => {
            // Find matching token in GraphQL data by address
            const matchingToken = graphQLTokens.find((gqlToken: any) => 
              gqlToken.memeTokenAddress?.toLowerCase() === channelToken.address?.toLowerCase()
            );
            
            if (matchingToken) {
              return {
                ...channelToken,
                symbol: matchingToken.symbol || channelToken.symbol,
                price: matchingToken.price || '0.000001',
                marketCap: matchingToken.marketCap || '0',
                volume24h: matchingToken.volume24h || '0',
                holders: matchingToken.holders || 0,
                change24h: matchingToken.priceChange24h || 0,
                hasTokenData: true,
                tokenDataLoading: false
              };
            }
            
            return {
              ...channelToken,
              tokenDataLoading: !salesLoading // Stop loading if GraphQL is done
            };
          });
          
          setTokens(mergedTokens);
        } else {
          // Just show channels without token data
          setTokens(channelTokens);
        }
        
        setIsLoading(false);
      } else if (!channelsLoading && (!channelsData || channelsData.length === 0)) {
        // No channels, fall back to GraphQL only if available
        if (salesData?.uniPumpCreatorSaless?.items && !salesLoading) {
          const graphQLTokens: Token[] = salesData.uniPumpCreatorSaless.items.map((token: any) => ({
            id: token.memeTokenAddress,
            address: token.memeTokenAddress,
            name: token.name || `Token ${token.memeTokenAddress?.slice(0, 8)}`,
            symbol: token.symbol || 'TKN',
            price: token.price || '0.000001',
            marketCap: token.marketCap || '0',
            volume24h: token.volume24h || '0',
            holders: token.holders || 0,
            change24h: token.priceChange24h || 0,
            createdAt: token.createdAt || new Date(),
            description: token.bio || 'No description available',
            hasTokenData: true,
            tokenDataLoading: false
          }));
          setTokens(graphQLTokens);
        }
        setIsLoading(false);
      }
    };

    processData();
  }, [channelsData, channelsLoading, salesData, salesLoading]);

  // If initial loading and no data, show skeleton
  if (isLoading && channelsLoading) {
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

          {/* Tokens Grid Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-border/50">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="w-4 h-4" />
                  </div>
                  
                  {/* Price */}
                  <div className="flex justify-between mb-3">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <Skeleton className="h-2 w-full mb-4" />
                  
                  {/* Buttons */}
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
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
    .filter(token => 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Placeholder for sorting logic, currently defaulting to newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
            <h1 className="text-3xl font-bold">Channels</h1>
            <p className="text-muted-foreground">
              Browse and trade tokens created on TubeClone
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{totalTokens}</div>
              <div className="text-sm text-muted-foreground">Total Tokens</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">${totalMarketCap.toFixed(1)}K</div>
              <div className="text-sm text-muted-foreground">Total Market Cap</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{totalHolders}</div>
              <div className="text-sm text-muted-foreground">Total Holders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">${total24hVolume.toFixed(1)}K</div>
              <div className="text-sm text-muted-foreground">24h Volume</div>
            </CardContent>
          </Card>
        </div>

        {/* Tokens List */}
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="marketCap">Market Cap</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
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
              // Binance-style Dark Grid Layout
              <div className="space-y-1">
                {filteredTokens.map((token) => (
                  <div key={token.id} className="bg-gray-900/50 border border-gray-800/60 rounded-sm hover:bg-gray-800/40 transition-colors cursor-pointer">
                    <div className="p-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {/* Token Avatar */}
                          <div className="flex-shrink-0">
                            {token.avatarUrl ? (
                              <div className="w-8 h-8 rounded-sm overflow-hidden border border-gray-700">
                                <img 
                                  src={token.avatarUrl.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${token.avatarUrl}` : token.avatarUrl}
                                  alt={`${token.name} avatar`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-sm flex items-center justify-center text-white font-bold text-xs">
                                {token.symbol.charAt(1) || token.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Token Name and Symbol */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-white text-sm truncate">{token.name}</span>
                              <span className="text-gray-400 text-xs">/</span>
                              <span className="text-gray-300 text-xs font-medium">{token.symbol}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="text-right">
                          {token.tokenDataLoading ? (
                            <Skeleton className="h-4 w-16 bg-gray-700" />
                          ) : (
                            <div className="text-white font-semibold text-sm">${token.price}</div>
                          )}
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-5 gap-3 text-xs">
                        {/* Market Cap */}
                        <div>
                          <div className="text-gray-500 mb-1">Market Cap</div>
                          {token.tokenDataLoading ? (
                            <Skeleton className="h-3 w-full bg-gray-700" />
                          ) : (
                            <div className="text-gray-300 font-medium">${token.marketCap}K</div>
                          )}
                        </div>

                        {/* 24h Volume */}
                        <div>
                          <div className="text-gray-500 mb-1">24h Volume</div>
                          {token.tokenDataLoading ? (
                            <Skeleton className="h-3 w-full bg-gray-700" />
                          ) : (
                            <div className="text-gray-300 font-medium">${token.volume24h}K</div>
                          )}
                        </div>

                        {/* 24h Change */}
                        <div>
                          <div className="text-gray-500 mb-1">24h Change</div>
                          {token.tokenDataLoading ? (
                            <Skeleton className="h-3 w-full bg-gray-700" />
                          ) : token.hasTokenData && token.change24h !== undefined ? (
                            <div className={`font-medium ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                            </div>
                          ) : (
                            <div className="text-yellow-400 font-medium">New</div>
                          )}
                        </div>

                        {/* Holders */}
                        <div>
                          <div className="text-gray-500 mb-1">Holders</div>
                          {token.tokenDataLoading ? (
                            <Skeleton className="h-3 w-full bg-gray-700" />
                          ) : (
                            <div className="text-gray-300 font-medium">{token.holders}</div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-1">
                          {/* Channel Management Button (if it's a channel) */}
                          {token.slug && (
                            <Link to={`/channel/${token.slug}/manager`}>
                              <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-6 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
                                Manage
                              </Button>
                            </Link>
                          )}
                          
                          {/* Token View/Trade Buttons */}
                          {token.address ? (
                            <>
                              <Link to={`/token/${token.address}`}>
                                <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-6 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
                                  View
                                </Button>
                              </Link>
                              <Button className="bg-yellow-600 hover:bg-yellow-700 text-black text-xs px-2 py-1 h-6 font-medium">
                                Trade
                              </Button>
                            </>
                          ) : (
                            <div className="text-xs text-gray-500 py-1 px-2 bg-gray-800 rounded text-center">
                              Deploying...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}