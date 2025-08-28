"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Search, Filter, SortDesc, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface SearchFilter {
  id: string;
  userAddress: string;
  searchQuery: string;
  filterType: string;
  categoryFilter?: string;
  sortBy?: string;
  resultsFound: number;
  createdAt: Date;
}

interface Web3Channel {
  id: string;
  name: string;
  slug: string;
  ticker: string;
  description?: string;
  category?: string;
  avatarCid?: string;
  coinAddress: string;
  currentPrice?: number;
  marketCap?: number;
  holders?: number;
  volume24h?: number;
  createdAt: Date;
}

interface AdvancedSearchProps {
  onResultsChange?: (results: Web3Channel[]) => void;
  className?: string;
}

// Hook to search channels with filters
function useAdvancedChannelSearch(query: string, filters: {
  category?: string;
  sortBy?: string;
}, userAddress?: string) {
  return useQuery({
    queryKey: ['search', 'channels', query, filters, userAddress],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query,
        ...(filters.category && { category: filters.category }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(userAddress && { userAddress }),
      });
      
      const response = await fetch(`/api/search/channels?${params}`);
      if (!response.ok) throw new Error('Failed to search channels');
      return response.json() as {
        query: string;
        filters: any;
        results: Web3Channel[];
        count: number;
      };
    },
    enabled: query.length > 0,
  });
}

// Hook to get user search history
function useSearchHistory(userAddress?: string) {
  return useQuery({
    queryKey: ['search', 'history', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      
      const response = await fetch(`/api/search/history/${userAddress}`);
      if (!response.ok) throw new Error('Failed to fetch search history');
      return response.json() as SearchFilter[];
    },
    enabled: !!userAddress,
  });
}

export function AdvancedChannelSearch({ onResultsChange, className }: AdvancedSearchProps) {
  const { address } = useAccount();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'relevance'
  });
  const [showHistory, setShowHistory] = useState(false);

  // Search query
  const { data: searchResults, isLoading } = useAdvancedChannelSearch(
    query, 
    filters, 
    address
  );

  // Search history
  const { data: searchHistory = [] } = useSearchHistory(address);

  const categories = [
    'DeFi', 'Gaming', 'Art', 'Music', 'Social', 'Technology', 
    'Finance', 'Education', 'Entertainment', 'Sports'
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest' },
    { value: 'market_cap', label: 'Market Cap' },
    { value: 'volume', label: 'Volume' },
    { value: 'subscribers', label: 'Subscribers' }
  ];

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setShowHistory(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', sortBy: 'relevance' });
  };

  const handleHistoryClick = (historyItem: SearchFilter) => {
    setQuery(historyItem.searchQuery);
    setFilters({
      category: historyItem.categoryFilter || '',
      sortBy: historyItem.sortBy || 'relevance'
    });
    setShowHistory(false);
  };

  // Update parent component with results
  if (searchResults?.results && onResultsChange) {
    onResultsChange(searchResults.results);
  }

  const hasActiveFilters = filters.category || filters.sortBy !== 'relevance';

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowHistory(true)}
          placeholder="Search channels, creators, or tokens..."
          className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
          data-testid="search-input"
        />
        
        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-50">
            <div className="p-3 border-b border-zinc-700">
              <div className="flex items-center gap-2 text-zinc-400">
                <History className="h-4 w-4" />
                <span className="text-sm font-medium">Recent Searches</span>
              </div>
            </div>
            <ScrollArea className="max-h-48">
              {searchHistory.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="p-3 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700 last:border-0"
                  data-testid={`history-item-${item.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">{item.searchQuery}</span>
                    <span className="text-zinc-500 text-xs">
                      {item.resultsFound} results
                    </span>
                  </div>
                  {item.categoryFilter && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {item.categoryFilter}
                    </Badge>
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-400">Filters:</span>
        </div>
        
        {/* Category Filter */}
        <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="" className="text-white">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="text-white">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Filter */}
        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
            <SortDesc className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-white">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-zinc-400 hover:text-white"
            data-testid="clear-filters"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {filters.category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('category', '')}
              />
            </Badge>
          )}
          {filters.sortBy !== 'relevance' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Sort: {sortOptions.find(opt => opt.value === filters.sortBy)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('sortBy', 'relevance')}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Search Results Summary */}
      {searchResults && query && (
        <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
          <div className="text-white">
            <span className="font-medium">{searchResults.count}</span> channels found
            {query && (
              <span className="text-zinc-400 ml-2">for "{query}"</span>
            )}
          </div>
          {isLoading && (
            <div className="text-zinc-400 text-sm">Searching...</div>
          )}
        </div>
      )}

      {/* Quick Search Suggestions */}
      {!query && !showHistory && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {['DeFi', 'Gaming', 'Art', 'Music'].map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="cursor-pointer hover:bg-zinc-700 border-zinc-600 text-zinc-300"
                onClick={() => handleSearch(suggestion)}
                data-testid={`suggestion-${suggestion}`}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}