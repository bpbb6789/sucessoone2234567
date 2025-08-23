
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ExternalLink, TrendingUp, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import useGetAllSales from '@/hooks/useGetAllSales';

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  price?: string;
  marketCap?: string;
  change24h?: number;
  volume24h?: string;
  holders?: number;
  description: string;
  creator: string;
  imageUri?: string;
  twitter?: string;
  discord?: string;
  createdAt: string;
}

export default function Tokens() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'marketCap' | 'volume' | 'gainers' | 'losers'>('newest');
  const { data: tokensData, isLoading } = useGetAllSales();

  // Transform the token data from your API to match the TokenInfo interface
  const tokens: TokenInfo[] = tokensData?.map((token: any) => ({
    address: token.memeTokenAddress || token.address,
    name: token.name,
    symbol: token.symbol,
    price: '0.00001', // You'll need to get actual price data
    marketCap: '0', // Calculate based on supply and price
    change24h: 0, // You'll need to track price changes
    volume24h: '0', // You'll need to track trading volume
    holders: 0, // You'll need to get holder count
    description: token.bio || token.description || '',
    creator: token.createdBy || token.creator,
    imageUri: token.imageUri,
    twitter: token.twitter,
    discord: token.discord,
    createdAt: token.timestamp ? new Date(Number(token.timestamp) * 1000).toISOString() : new Date().toISOString()
  })) || [];

  const filteredTokens = tokens
    .filter(token => 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return parseFloat(b.marketCap || '0') - parseFloat(a.marketCap || '0');
        case 'volume':
          return parseFloat(b.volume24h || '0') - parseFloat(a.volume24h || '0');
        case 'gainers':
          return (b.change24h || 0) - (a.change24h || 0);
        case 'losers':
          return (a.change24h || 0) - (b.change24h || 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

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
          <Link to="/token">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="marketCap">Market Cap</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
          </TabsList>

          <TabsContent value={sortBy} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTokens.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Coins className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tokens found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery ? `No tokens match "${searchQuery}"` : 'No tokens have been created yet'}
                  </p>
                  <Link to="/token">
                    <Button>Create the First Token</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTokens.map((token) => (
                  <Card key={token.address} className="hover:shadow-lg transition-shadow">
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
                            {token.creator?.slice(0, 6)}...{token.creator?.slice(-4)}
                          </code>
                        </div>

                        {/* Social Links */}
                        {(token.twitter || token.discord) && (
                          <div className="flex gap-2 pt-1">
                            {token.twitter && (
                              <a
                                href={token.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600"
                              >
                                Twitter
                              </a>
                            )}
                            {token.discord && (
                              <a
                                href={token.discord}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:text-indigo-600"
                              >
                                Discord
                              </a>
                            )}
                          </div>
                        )}
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
