import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Users, BarChart3, Coins, ExternalLink, Sparkles, Zap, Hash, Eye } from "lucide-react";
import { useGetAllSales } from '@/hooks/useGetAllSales';
import { useCreatorCoins } from '@/hooks/useCreatorCoins';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';
import { useCreators } from '@/hooks/useCreators';

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
  // Zora-specific fields
  txHash?: string;
  metadataUri?: string;
  status?: string;
  platform?: string;
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
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get token sales data from GraphQL (PumpFun tokens)
  const { data: salesData, loading: salesLoading, error: salesError } = useGetAllSales();

  // Get real creator coins from Zora
  const { data: zoraCoins, isLoading: zoraLoading, error: zoraError } = useCreatorCoins();

  // Get creators data from the creators page API
  const { data: creatorsData, isLoading: creatorsLoading, error: creatorsError } = useCreators();

  React.useEffect(() => {
    let allCreatorTokens: CreatorToken[] = [];

    // Add Zora creator coins (PRIORITY - show these first)
    if (zoraCoins && Array.isArray(zoraCoins) && zoraCoins.length > 0) {
      const zoraTokens = zoraCoins.map((coin: any) => ({
        id: coin.id,
        address: coin.coinAddress || 'Deploying...',
        name: coin.coinName || coin.title,
        symbol: coin.coinSymbol,
        description: coin.description || `Zora creator coin for ${coin.title}`,
        imageUri: coin.mediaCid ? `https://gateway.pinata.cloud/ipfs/${coin.mediaCid}` : '',
        createdAt: new Date(coin.createdAt),
        creator: coin.creatorAddress,
        price: coin.currentPrice || '0.000001',
        marketCap: coin.marketCap || '0',
        volume24h: coin.volume24h || '0',
        holders: coin.holders || 0,
        change24h: 0,
        isOnBondingCurve: coin.status === 'deployed',
        progress: parseFloat(coin.bondingCurveProgress || '0'),
        // Zora-specific fields
        txHash: coin.deploymentTxHash,
        metadataUri: coin.metadataUri,
        status: coin.status,
        platform: 'Zora'
      }));
      allCreatorTokens = [...allCreatorTokens, ...zoraTokens];
    }

    // Add GraphQL tokens if available (PumpFun tokens)
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
        progress: token.progress || 0,
        platform: 'PumpFun'
      }));
      allCreatorTokens = [...allCreatorTokens, ...pumpFunTokens];
    }

    // Show all real data - Zora coins and PumpFun tokens
    setCreatorTokens(allCreatorTokens);
  }, [salesData, salesLoading, zoraCoins, zoraLoading]);

  // Filter tokens
  const filteredTokens = creatorTokens
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

  if (salesLoading || zoraLoading || creatorsLoading) {
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

  if (salesError || zoraError || creatorsError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading data: {salesError || zoraError || creatorsError}</p>
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

  const creators = creatorsData ? creatorsData.creators : []; // Assuming creatorsData has a 'creators' array

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
              Discover creator coins from Zora and pump.fun - bonding curves, content tokenization, and community-driven tokens
            </p>
          </div>
          <Link to="/createtoken">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <Zap className="mr-2 h-4 w-4" />
              Create Creator Coin
            </Button>
          </Link>
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

        {/* Top Creators Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Top Creators</h2>
              <p className="text-gray-400">Discover trending content creators</p>
            </div>
            <Link to="/creators">
              <Button 
                variant="outline" 
                className="text-green-400 border-green-400 hover:bg-green-400 hover:text-black"
              >
                See All
              </Button>
            </Link>
          </div>

          {/* Top Creators Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creatorsLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="aspect-square bg-gray-600 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-2/3 mb-3"></div>
                    <div className="h-8 bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))
            ) : creators && creators.length > 0 ? (
              // Real creator data - show top 4
              creators.slice(0, 4).map((creator: any) => (
                <div key={creator.id} className="group cursor-pointer">
                  <div className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors rounded-lg p-4">
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{creator.name.charAt(0)}</span>
                      </div>
                      {creator.rank <= 3 && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">#{creator.rank}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="text-white font-semibold mb-1">{creator.name}</h3>
                      <p className="text-gray-400 text-sm mb-1">{creator.contentCoins} content coins</p>
                      <p className="text-gray-400 text-xs mb-3">{creator.totalLikes} likes • {creator.totalComments} comments</p>
                      <Link to={`/creators/${creator.address}`}>
                        <Button 
                          size="sm" 
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // No creators available
              <div className="col-span-full text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold text-white mb-2">No creators yet</h3>
                <p className="text-gray-400">Be the first to create content coins</p>
              </div>
            )}
          </div>
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
                    No creator tokens have been created yet
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredTokens.map((token) => (
                  <Card key={token.id} className="bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                    <CardContent className="p-3">
                      {/* Compact Header */}
                      <div className="flex items-center gap-2 mb-2">
                        {/* Token Avatar */}
                        {token.imageUri && token.imageUri.trim() !== '' ? (
                          <img 
                            src={token.imageUri}
                            alt={`${token.name} logo`}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              const fallback = target.nextElementSibling as HTMLElement;
                              target.style.display = 'none';
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${token.imageUri && token.imageUri.trim() !== '' ? 'hidden' : ''}`}>
                          {token.symbol.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 dark:text-white font-semibold text-xs truncate">{token.name}</h3>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{token.symbol}</span>
                            {token.isOnBondingCurve && <span className="text-green-500 text-xs">🟢</span>}
                            {token.platform === 'Zora' && <span className="text-purple-500 text-xs">🌊</span>}
                          </div>
                        </div>
                        {token.address && token.address !== 'Deploying...' && (
                          <Link to={`/token/${token.address}`}>
                            <Button 
                              className="px-1.5 py-0.5 h-5 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" 
                              size="sm"
                              data-testid={`trade-${token.id}`}
                            >
                              📈
                            </Button>
                          </Link>
                        )}
                      </div>

                      {/* Price Row with Icons */}
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-1">
                          <span>💰</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">${token.price}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>📊</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">${token.marketCap}K</span>
                        </div>
                      </div>

                      {/* Progress Bar for Bonding Curve - Compact */}
                      {token.isOnBondingCurve && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span className="flex items-center gap-1">⚡ {token.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-purple-600 to-pink-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(token.progress || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Stats Row with Icons */}
                      <div className="flex items-center justify-between text-xs border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            <span className={token.change24h && token.change24h < 0 ? '📉' : '📈'}>
                              {token.change24h && token.change24h < 0 ? '📉' : '📈'}
                            </span>
                            <span className={`${token.change24h && token.change24h < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                              {token.change24h ? Math.abs(token.change24h).toFixed(1) : '0.0'}%
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span>👥</span>
                            <span className="text-gray-600 dark:text-gray-400">{token.holders}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span>💧</span>
                            <span className="text-gray-600 dark:text-gray-400">{token.volume24h || '0'}K</span>
                          </div>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          ⏰ {formatTimeAgo(token.createdAt)}
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