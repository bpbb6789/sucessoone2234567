import { useState } from 'react';
import { Search, Filter, TrendingUp, Clock, DollarSign, Users, Play, Image as ImageIcon, Music, FileText, Sparkles, ExternalLink, ShoppingCart, Eye, Heart, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLocation } from 'wouter';
import { ContentPreview } from '@/components/ContentPreview';
import { apiRequest } from '@/lib/queryClient';
import { formatEther, formatUnits } from 'viem';

const contentTypeFilters = [
  { id: 'all', name: 'All Content', icon: Sparkles, color: 'text-gray-500' },
  { id: 'image', name: 'Images', icon: ImageIcon, color: 'text-blue-500' },
  { id: 'video', name: 'Videos', icon: Play, color: 'text-red-500' },
  { id: 'audio', name: 'Audio', icon: Music, color: 'text-purple-500' },
  { id: 'gif', name: 'Animations', icon: Sparkles, color: 'text-green-500' },
  { id: 'document', name: 'Documents', icon: FileText, color: 'text-orange-500' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'market-cap', label: 'Market Cap' },
  { value: 'volume', label: 'Trading Volume' },
  { value: 'trending', label: 'Trending' },
];

interface ContentToken {
  id: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  description?: string;
  contentType: string;
  mediaCid: string;
  thumbnailCid?: string;
  creator: string;
  createdAt: string;
  currentPrice: string;
  marketCap: string;
  volume24h: string;
  holders: number;
  totalSupply: string;
  socialLinks?: {
    twitter?: string;
    website?: string;
    discord?: string;
  };
  stats?: {
    views: number;
    likes: number;
    comments: number;
  };
}

export default function ExploreContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();

  // Fetch content tokens
  const { data: contentTokens = [], isLoading, error } = useQuery({
    queryKey: ['content-tokens', selectedType, sortBy, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (sortBy) params.append('sort', sortBy);
      if (searchQuery) params.append('search', searchQuery);
      
      return await apiRequest(`/api/content-tokens?${params.toString()}`);
    },
    refetchInterval: 10000, // Refresh every 10 seconds for live prices
  });

  // Fetch trending tokens
  const { data: trendingTokens = [] } = useQuery({
    queryKey: ['trending-content-tokens'],
    queryFn: async () => {
      return await apiRequest('/api/content-tokens?sort=trending&limit=6');
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredTokens = contentTokens.filter((token: ContentToken) => {
    const matchesSearch = !searchQuery || 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || token.contentType === selectedType;
    
    return matchesSearch && matchesType;
  });

  const getContentTypeIcon = (type: string) => {
    const typeConfig = contentTypeFilters.find(t => t.id === type);
    return typeConfig?.icon || Sparkles;
  };

  const getContentTypeColor = (type: string) => {
    const typeConfig = contentTypeFilters.find(t => t.id === type);
    return typeConfig?.color || 'text-gray-500';
  };

  const formatPrice = (price: string) => {
    try {
      const formatted = formatEther(BigInt(price));
      return `${parseFloat(formatted).toFixed(6)} ETH`;
    } catch {
      return '0 ETH';
    }
  };

  const formatMarketCap = (marketCap: string) => {
    try {
      const value = parseFloat(formatEther(BigInt(marketCap)));
      if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
      return `$${value.toFixed(2)}`;
    } catch {
      return '$0';
    }
  };

  const handleTokenClick = (token: ContentToken) => {
    setLocation(`/content-token/${token.tokenAddress}`);
  };

  const handleTradeClick = (e: React.MouseEvent, tokenAddress: string) => {
    e.stopPropagation();
    setLocation(`/content-token/${tokenAddress}?tab=trade`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Explore Content Tokens
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover, trade, and invest in tokenized content with bonding curve pricing
          </p>
        </div>

        {/* Trending Section */}
        {trendingTokens.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Trending Content Tokens
              </CardTitle>
              <CardDescription>
                Most active tokens in the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingTokens.slice(0, 6).map((token: ContentToken) => (
                  <Card 
                    key={token.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
                    onClick={() => handleTokenClick(token)}
                    data-testid={`trending-token-${token.symbol}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                          <ContentPreview
                            mediaCid={token.mediaCid}
                            thumbnailCid={token.thumbnailCid}
                            contentType={token.contentType}
                            title={token.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{token.name}</h3>
                          <p className="text-sm text-muted-foreground">{token.symbol}</p>
                        </div>
                        <div className={`p-1 rounded ${getContentTypeColor(token.contentType)}`}>
                          {React.createElement(getContentTypeIcon(token.contentType), { className: "h-4 w-4" })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium">{formatPrice(token.currentPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Market Cap:</span>
                          <span className="font-medium">{formatMarketCap(token.marketCap)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
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
                    data-testid="search-input"
                  />
                </div>
              </div>

              {/* Content Type Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {contentTypeFilters.map((type) => (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type.id)}
                    className="flex items-center gap-2 whitespace-nowrap"
                    data-testid={`filter-${type.id}`}
                  >
                    <type.icon className={`h-4 w-4 ${type.color}`} />
                    {type.name}
                  </Button>
                ))}
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content Tokens Grid */}
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
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Failed to load content tokens. Please try again.</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                data-testid="retry-button"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
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
                  : "No content tokens available yet"
                }
              </p>
              <Button 
                onClick={() => setLocation('/contentnew')}
                data-testid="create-first-token-button"
              >
                Create First Token
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTokens.map((token: ContentToken) => (
              <Card 
                key={token.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 group"
                onClick={() => handleTokenClick(token)}
                data-testid={`content-token-${token.symbol}`}
              >
                <CardContent className="p-0">
                  {/* Content Preview */}
                  <div className="relative w-full h-48 rounded-t-lg overflow-hidden bg-muted">
                    <ContentPreview
                      mediaCid={token.mediaCid}
                      thumbnailCid={token.thumbnailCid}
                      contentType={token.contentType}
                      title={token.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Content Type Badge */}
                    <Badge 
                      className={`absolute top-2 left-2 ${getContentTypeColor(token.contentType)} bg-black/50 backdrop-blur-sm`}
                    >
                      {React.createElement(getContentTypeIcon(token.contentType), { className: "h-3 w-3 mr-1" })}
                      {contentTypeFilters.find(t => t.id === token.contentType)?.name}
                    </Badge>

                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
                        onClick={(e) => handleTradeClick(e, token.tokenAddress)}
                        data-testid={`trade-button-${token.symbol}`}
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Stats Overlay */}
                    {token.stats && (
                      <div className="absolute bottom-2 left-2 flex gap-2 text-xs text-white">
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                          <Eye className="h-3 w-3" />
                          {token.stats.views}
                        </div>
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                          <Heart className="h-3 w-3" />
                          {token.stats.likes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Token Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{token.name}</h3>
                        <p className="text-sm text-muted-foreground">{token.symbol}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {token.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {token.description}
                      </p>
                    )}

                    {/* Price Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Price</span>
                        <span className="font-semibold">{formatPrice(token.currentPrice)}</span>
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

                    {/* Creator Info */}
                    <div className="mt-3 pt-3 border-t">
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(token.socialLinks!.twitter, '_blank');
                            }}
                            data-testid={`twitter-link-${token.symbol}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        {token.socialLinks.website && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(token.socialLinks!.website, '_blank');
                            }}
                            data-testid={`website-link-${token.symbol}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {!isConnected && (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Ready to Create Your Own Content Token?</h3>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to start tokenizing your content and building your community
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        )}

        {isConnected && filteredTokens.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Create Your Content Token</h3>
              <p className="text-muted-foreground mb-6">
                Join the creator economy by tokenizing your unique content
              </p>
              <Button 
                onClick={() => setLocation('/contentnew')}
                size="lg"
                data-testid="create-content-token-button"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Create Content Token
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}