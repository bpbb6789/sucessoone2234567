import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, DollarSign, Users, BarChart3, Coins, ExternalLink, Sparkles, Zap } from "lucide-react";
import { useGetAllSales } from '@/hooks/useGetAllSales';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';

interface CreatorToken {
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
  creator: string;
  isOnBondingCurve?: boolean;
  progress?: number;
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

export default function CreatorCoins() {
  const [creatorTokens, setCreatorTokens] = useState<CreatorToken[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get token sales data from GraphQL (PumpFun tokens)
  const { data: salesData, loading: salesLoading, error: salesError } = useGetAllSales();

  React.useEffect(() => {
    let allCreatorTokens: CreatorToken[] = [];

    // Add GraphQL tokens if available
    if (salesData && Array.isArray(salesData) && salesData.length > 0) {
      const pumpFunTokens = salesData.map((token: any) => ({
        id: token.memeTokenAddress || token.id,
        address: token.memeTokenAddress,
        name: token.name || token.symbol || 'Unknown Token',
        symbol: token.symbol || 'UNKNOWN',
        description: token.bio || token.description || 'Created via pump.fun mechanics',
        imageUri: token.imageUri || '',
        createdAt: new Date(token.createdAt || token.blockTimestamp || Date.now()),
        creator: token.createdBy || 'No Creator Found',
        price: token.price || '0.000001',
        marketCap: token.marketCap || '0',
        volume24h: token.volume24h || '0',
        holders: token.holders || 0,
        change24h: token.priceChange24h || 0,
        isOnBondingCurve: token.bondingCurve !== null,
        progress: token.progress || 0
      }));
      allCreatorTokens = [...allCreatorTokens, ...pumpFunTokens];
    }

    // Only show real data from GraphQL - no fallbacks or mock data
    setCreatorTokens(allCreatorTokens);
  }, [salesData, salesLoading]);

  // Filter tokens
  const filteredTokens = creatorTokens
    .filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (selectedCategory) {
        case 'marketCap':
          return parseFloat(b.marketCap) - parseFloat(a.marketCap);
        case 'volume':
          return parseFloat(b.volume24h) - parseFloat(a.volume24h);
        case 'bonding':
          return (b.isOnBondingCurve ? 1 : 0) - (a.isOnBondingCurve ? 1 : 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  if (salesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (salesError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading creator tokens: {salesError}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalTokens = filteredTokens.length;
  const totalMarketCap = filteredTokens.reduce((sum, token) => sum + parseFloat(token.marketCap || '0'), 0);
  const totalHolders = filteredTokens.reduce((sum, token) => sum + (token.holders || 0), 0);
  const total24hVolume = filteredTokens.reduce((sum, token) => sum + parseFloat(token.volume24h || '0'), 0);
  const bondingCurveTokens = filteredTokens.filter(t => t.isOnBondingCurve).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Creator Coins
              </h1>
            </div>
            <p className="text-muted-foreground">
              Discover tokens created with pump.fun mechanics - bonding curves, fair launches, and community-driven tokens
            </p>
          </div>
          <Link to="/createtoken">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <Zap className="mr-2 h-4 w-4" />
              Create Creator Coin
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creator coins by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-creator-tokens"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-3 w-3 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Creator Tokens</p>
                  <p className="text-sm font-bold">{totalTokens}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
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
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Holders</p>
                  <p className="text-sm font-bold">{totalHolders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-3 w-3 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Bonding Curve</p>
                  <p className="text-sm font-bold">{bondingCurveTokens}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tokens List */}
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="bonding">Bonding Curve</TabsTrigger>
            <TabsTrigger value="marketCap">Market Cap</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            {filteredTokens.length === 0 ? (
              <Card className="border-purple-200 dark:border-purple-800">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-12 w-12 text-purple-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No creator tokens found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ? `No creator tokens match "${searchTerm}"` : 'No creator tokens have been created yet'}
                  </p>
                  <Link to="/createtoken">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                      <Zap className="mr-2 h-4 w-4" />
                      Create First Creator Coin
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTokens.map((token) => (
                  <Card key={token.id} className="bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                    <CardContent className="p-4">
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Token Avatar */}
                          {token.imageUri && token.imageUri.trim() !== '' ? (
                            <img 
                              src={token.imageUri}
                              alt={`${token.name} logo`}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                const fallback = target.nextElementSibling as HTMLElement;
                                target.style.display = 'none';
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm ${token.imageUri && token.imageUri.trim() !== '' ? 'hidden' : ''}`}>
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-gray-900 dark:text-white font-semibold text-sm">{token.name}</h3>
                              <span className="text-gray-500 dark:text-gray-400 text-xs">{token.symbol}</span>
                              <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-200 text-xs px-2 py-0">
                                🚀 Creator
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500 text-xs">
                              <span>{formatTimeAgo(token.createdAt)}</span>
                              {token.isOnBondingCurve && (
                                <Badge variant="outline" className="text-xs px-1 py-0 border-green-500 text-green-600">
                                  Bonding
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {token.address && (
                            <Link to={`/token/${token.address}`}>
                              <Button 
                                className="px-2 py-1 h-6 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" 
                                size="sm"
                                data-testid={`trade-${token.id}`}
                              >
                                Trade
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Price and Stats Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Price</span>
                            <span className="text-purple-600 dark:text-purple-400 font-medium">${token.price}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">MC</span>
                            <span className="text-purple-600 dark:text-purple-400 font-medium">${token.marketCap}K</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar for Bonding Curve */}
                      {token.isOnBondingCurve && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Bonding Curve Progress</span>
                            <span>{token.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(token.progress || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-green-500 dark:text-green-400">📈</span>
                            <span className={`${token.change24h && token.change24h < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                              {token.change24h ? Math.abs(token.change24h).toFixed(1) : '0.0'}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-blue-500 dark:text-blue-400">👥</span>
                            <span className="text-gray-600 dark:text-gray-400">{token.holders}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-orange-500 dark:text-orange-400">💰</span>
                            <span className="text-gray-600 dark:text-gray-400">{token.volume24h || '0'}K</span>
                          </div>
                        </div>
                      </div>

                      {/* Creator Info */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 dark:text-gray-400">Creator:</span>
                            <span className="font-mono text-purple-600 dark:text-purple-400">
                              {token.creator !== 'No Creator Found' ? `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}` : 'No Creator Found'}
                            </span>
                          </div>
                          {token.address && (
                            <Link to={`/token/${token.address}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-2 text-xs text-gray-500 hover:text-purple-600"
                                data-testid={`view-${token.id}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
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