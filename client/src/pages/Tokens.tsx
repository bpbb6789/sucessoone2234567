import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Clock, DollarSign, Loader2, Coins, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetAllSales } from '../hooks/useGetAllSales';

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

  // Get token sales data from GraphQL
  const { data: salesData, loading, error } = useGetAllSales();

  useEffect(() => {
    const processTokensData = () => {
      if (!salesData?.uniPumpCreatorSaless?.items) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const processedTokens: Token[] = salesData.uniPumpCreatorSaless.items.map((token: any) => ({
          id: token.memeTokenAddress,
          address: token.memeTokenAddress,
          name: token.name || `Token ${token.memeTokenAddress?.slice(0, 8)}`,
          symbol: token.symbol || 'TKN',
          price: '0.0000', // Will be fetched separately or calculated
          marketCap: '0', // Will be calculated from price and supply
          volume24h: '0', // Will be fetched from trading data
          holders: 0, // Will be calculated from blockchain data
          change24h: 0,
          createdAt: new Date(), // Could be derived from blockchain creation time
          description: token.bio || 'No description available'
        }));

        setTokens(processedTokens);
      } catch (error) {
        console.error('Error processing tokens data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      processTokensData();
    }
  }, [salesData, loading]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>Loading tokens from blockchain...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading tokens: {error.message}</p>
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
            <h1 className="text-3xl font-bold">Discover Tokens</h1>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTokens.map((token) => (
                  <Card key={token.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{token.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">${token.symbol}</Badge>
                              {token.change24h !== undefined && (
                                <Badge variant={token.change24h >= 0 ? "default" : "destructive"}>
                                  {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {formatTimeAgo(token.createdAt)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {token.description || 'No description available'}
                        </p>

                        {/* Token Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Price</span>
                            <div className="font-medium">${token.price}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Market Cap</span>
                            <div className="font-medium">${token.marketCap}K</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Volume 24h</span>
                            <div className="font-medium">${token.volume24h}K</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Holders</span>
                            <div className="font-medium">{token.holders}</div>
                          </div>
                        </div>

                        {/* Creator */}
                        <div className="text-xs">
                          <span className="text-muted-foreground">Creator: </span>
                          <code className="bg-muted px-1 py-0.5 rounded text-xs">
                            {token.address?.slice(0, 6)}...{token.address?.slice(-4)}
                          </code>
                        </div>

                        {/* Social Links - Removed placeholder for creator, using address for consistency */}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <Link to={`/token/${token.address}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Trade
                        </Button>
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