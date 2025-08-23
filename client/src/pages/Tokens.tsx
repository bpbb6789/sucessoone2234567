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
              <div className="space-y-2">
                {filteredTokens.map((token) => (
                  <Card key={token.id} className="hover:bg-muted/50 transition-colors border border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        {/* Left side - Token info */}
                        <div className="flex items-center space-x-4">
                          {/* Token Avatar */}
                          <div className="flex-shrink-0">
                            {token.avatarUrl ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                                <img 
                                  src={token.avatarUrl.startsWith('baf') ? `https://gateway.pinata.cloud/ipfs/${token.avatarUrl}` : token.avatarUrl}
                                  alt={`${token.name} avatar`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {token.symbol.charAt(1) || token.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Token Name and Symbol */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">{token.name}</h3>
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">{token.symbol}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {token.description || 'No description available'}
                            </p>
                          </div>
                        </div>

                        {/* Center - Token Stats */}
                        <div className="hidden md:flex items-center space-x-8">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Price</div>
                            {token.tokenDataLoading ? (
                              <Skeleton className="h-4 w-16" />
                            ) : (
                              <div className="font-semibold text-sm">${token.price}</div>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">24h Change</div>
                            {token.tokenDataLoading ? (
                              <Skeleton className="h-4 w-16" />
                            ) : token.hasTokenData && token.change24h !== undefined ? (
                              <div className={`font-semibold text-sm ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">New</div>
                            )}
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                            {token.tokenDataLoading ? (
                              <Skeleton className="h-4 w-16" />
                            ) : (
                              <div className="font-semibold text-sm">${token.marketCap}K</div>
                            )}
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Volume</div>
                            {token.tokenDataLoading ? (
                              <Skeleton className="h-4 w-16" />
                            ) : (
                              <div className="font-semibold text-sm">${token.volume24h}K</div>
                            )}
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Holders</div>
                            {token.tokenDataLoading ? (
                              <Skeleton className="h-4 w-16" />
                            ) : (
                              <div className="font-semibold text-sm">{token.holders}</div>
                            )}
                          </div>
                        </div>

                        {/* Right side - Actions and Time */}
                        <div className="flex items-center space-x-3">
                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-muted-foreground">
                              {formatTimeAgo(token.createdAt)}
                            </div>
                            {token.tokenDataLoading && (
                              <div className="text-xs text-blue-500 mt-1">Loading...</div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            {/* Channel Management Button (if it's a channel) */}
                            {token.slug && (
                              <Link to={`/channel/${token.slug}/manager`}>
                                <Button variant="outline" size="sm" className="text-xs px-3">
                                  Manage
                                </Button>
                              </Link>
                            )}
                            
                            {/* Token View/Trade Buttons */}
                            {token.address ? (
                              <>
                                <Link to={`/token/${token.address}`}>
                                  <Button variant="outline" size="sm" className="text-xs px-3">
                                    View
                                  </Button>
                                </Link>
                                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                                  Trade
                                </Button>
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground px-3 py-2">
                                Deploying...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Stats - Show on smaller screens */}
                      <div className="md:hidden mt-3 pt-3 border-t border-border/50">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Price</div>
                            {token.tokenDataLoading ? (
                              <Skeleton className="h-4 w-full" />
                            ) : (
                              <div className="font-semibold text-sm">${token.price}</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Change</div>
                            {token.tokenDataLoading ? (
                              <Skeleton className="h-4 w-full" />
                            ) : token.hasTokenData && token.change24h !== undefined ? (
                              <div className={`font-semibold text-sm ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">New</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                            {token.tokenDataLoading ? (
                              <Skeleton className="h-4 w-full" />
                            ) : (
                              <div className="font-semibold text-sm">${token.marketCap}K</div>
                            )}
                          </div>
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