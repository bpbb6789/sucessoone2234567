import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Coins, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Search, 
  ExternalLink,
  Plus,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Link } from 'wouter';

interface PumpToken {
  id: string;
  address: string;
  name: string;
  symbol: string;
  description?: string;
  creator: string;
  price?: string;
  marketCap?: string;
  volume24h?: string;
  holders?: number;
  totalSupply?: string;
  createdAt: string;
  imageUri?: string;
}

type SortOption = 'name' | 'price' | 'marketCap' | 'volume' | 'created';
type SortDirection = 'asc' | 'desc';

export default function PumpTokens() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch tokens from the API
  const { data: tokens, isLoading, error } = useQuery<PumpToken[]>({
    queryKey: ['/api/tokens'],
    queryFn: async () => {
      const response = await fetch('/api/tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter and sort tokens
  const filteredAndSortedTokens = tokens ? tokens
    .filter(token => 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.price || '0');
          bValue = parseFloat(b.price || '0');
          break;
        case 'marketCap':
          aValue = parseFloat(a.marketCap || '0');
          bValue = parseFloat(b.marketCap || '0');
          break;
        case 'volume':
          aValue = parseFloat(a.volume24h || '0');
          bValue = parseFloat(b.volume24h || '0');
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }) : [];

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('desc');
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Error Loading Tokens</h1>
          <p className="text-muted-foreground">
            Failed to load PumpFun tokens. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">PumpFun Tokens</h1>
            <p className="text-muted-foreground">
              Discover and trade tokens created with PumpFun bonding curves
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/createtoken">
              <Button data-testid="button-create-token">
                <Plus className="mr-2 h-4 w-4" />
                Create Token
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && tokens && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center space-x-2 p-4">
                <Coins className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                  <p className="text-lg font-bold">{tokens.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center space-x-2 p-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Market Cap</p>
                  <p className="text-lg font-bold">
                    ${formatNumber(tokens.reduce((sum, token) => sum + parseFloat(token.marketCap || '0'), 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center space-x-2 p-4">
                <DollarSign className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">24h Volume</p>
                  <p className="text-lg font-bold">
                    ${formatNumber(tokens.reduce((sum, token) => sum + parseFloat(token.volume24h || '0'), 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center space-x-2 p-4">
                <Users className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Holders</p>
                  <p className="text-lg font-bold">
                    {tokens.reduce((sum, token) => sum + (token.holders || 0), 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens by name, symbol, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('name')}
                  data-testid="button-sort-name"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Name
                  {sortBy === 'name' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('price')}
                  data-testid="button-sort-price"
                >
                  Price
                  {sortBy === 'price' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('marketCap')}
                  data-testid="button-sort-market-cap"
                >
                  Market Cap
                  {sortBy === 'marketCap' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />)}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokens List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            [...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredAndSortedTokens.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Coins className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No tokens found' : 'No PumpFun tokens yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? `No tokens match "${searchTerm}". Try a different search term.`
                    : 'Be the first to create a token with PumpFun bonding curves!'
                  }
                </p>
                {!searchTerm && (
                  <Link to="/createtoken">
                    <Button data-testid="button-create-first-token">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Token
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedTokens.map((token) => (
              <Card key={token.id} className="hover:shadow-md transition-shadow" data-testid={`card-token-${token.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {token.imageUri ? (
                        <img
                          src={token.imageUri}
                          alt={token.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg" data-testid={`text-token-name-${token.id}`}>{token.name}</h3>
                          <Badge variant="outline" data-testid={`badge-token-symbol-${token.id}`}>{token.symbol}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>By {token.creator.slice(0, 6)}...{token.creator.slice(-4)}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(token.createdAt)}</span>
                        </div>
                        {token.description && (
                          <p className="text-sm text-muted-foreground mt-1 max-w-md truncate">
                            {token.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Price</p>
                        <p className="font-semibold" data-testid={`text-price-${token.id}`}>
                          ${token.price ? parseFloat(token.price).toFixed(6) : '0.000000'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Market Cap</p>
                        <p className="font-semibold" data-testid={`text-market-cap-${token.id}`}>
                          ${token.marketCap ? formatNumber(parseFloat(token.marketCap)) : '0'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Holders</p>
                        <p className="font-semibold" data-testid={`text-holders-${token.id}`}>{token.holders || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/token/${token.address}`}>
                          <Button size="sm" data-testid={`button-view-token-${token.id}`}>
                            View
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" asChild data-testid={`button-view-contract-${token.id}`}>
                          <a href={`https://basescan.org/address/${token.address}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load more button if needed */}
        {!isLoading && filteredAndSortedTokens.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedTokens.length} token{filteredAndSortedTokens.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}