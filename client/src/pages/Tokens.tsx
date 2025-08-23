import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Search, Filter, Coins, Users, DollarSign, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  change24h: number;
  volume24h: string;
  holders: number;
  description: string;
  creator: string;
  imageUri?: string;
  twitter?: string;
  discord?: string;
  createdAt: string;
}

// Mock data - in a real app this would come from the indexer API
const mockTokens: TokenInfo[] = [
  {
    address: '0x1234567890123456789012345678901234567890',
    name: 'PumpCat',
    symbol: 'PCAT',
    price: '0.00012',
    marketCap: '120.5K',
    change24h: 45.2,
    volume24h: '8.7K',
    holders: 156,
    description: 'The cutest pump token on Base',
    creator: '0xabcd...1234',
    imageUri: '',
    twitter: 'https://twitter.com/pumpcat',
    createdAt: '2024-08-23T10:30:00Z'
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    name: 'MoonDoge',
    symbol: 'MDOGE',
    price: '0.00089',
    marketCap: '89.2K',
    change24h: -12.3,
    volume24h: '12.1K',
    holders: 203,
    description: 'Taking doge to the moon via bonding curves',
    creator: '0xefgh...5678',
    discord: 'https://discord.gg/moondoge',
    createdAt: '2024-08-23T09:15:00Z'
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    name: 'BaseApe',
    symbol: 'BAPE',
    price: '0.00034',
    marketCap: '67.8K',
    change24h: 23.1,
    volume24h: '5.4K',
    holders: 89,
    description: 'Apes together strong on Base network',
    creator: '0xijkl...9012',
    createdAt: '2024-08-23T08:45:00Z'
  }
];

export default function Tokens() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'marketCap' | 'volume' | 'gainers' | 'losers'>('newest');

  const filteredTokens = mockTokens
    .filter(token => 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return parseFloat(b.marketCap) - parseFloat(a.marketCap);
        case 'volume':
          return parseFloat(b.volume24h) - parseFloat(a.volume24h);
        case 'gainers':
          return b.change24h - a.change24h;
        case 'losers':
          return a.change24h - b.change24h;
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

        {/* Sort Tabs */}
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="marketCap">Market Cap</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
          </TabsList>

          <TabsContent value={sortBy} className="space-y-4">
            {filteredTokens.length === 0 ? (
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
                            <CardDescription className="font-medium">${token.symbol}</CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={token.change24h >= 0 ? "default" : "destructive"}
                          className={token.change24h >= 0 ? "bg-green-600" : ""}
                        >
                          {token.change24h >= 0 ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {Math.abs(token.change24h).toFixed(1)}%
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Price and Market Data */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-semibold">${token.price}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Market Cap</p>
                          <p className="font-semibold">${token.marketCap}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Volume 24h</p>
                          <p className="font-semibold">${token.volume24h}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Holders</p>
                          <p className="font-semibold">{token.holders}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {token.description}
                      </p>

                      {/* Social Links */}
                      <div className="flex items-center space-x-2">
                        {token.twitter && (
                          <Badge variant="outline" className="text-xs">
                            Twitter
                          </Badge>
                        )}
                        {token.discord && (
                          <Badge variant="outline" className="text-xs">
                            Discord
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatTimeAgo(token.createdAt)}
                        </span>
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

        {/* Stats Footer */}
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{mockTokens.length}</p>
              <p className="text-sm text-muted-foreground">Total Tokens</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">$277K</p>
              <p className="text-sm text-muted-foreground">Total Market Cap</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">448</p>
              <p className="text-sm text-muted-foreground">Total Holders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">$26.2K</p>
              <p className="text-sm text-muted-foreground">24h Volume</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}