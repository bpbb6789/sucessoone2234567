import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { CreatorCoin, InsertCreatorCoin } from '@shared/schema';

// Get all creator coins
export function useCreatorCoins() {
  return useQuery({
    queryKey: ['/api/creator-coins'],
    queryFn: async () => {
      const response = await fetch('/api/creator-coins');
      if (!response.ok) throw new Error('Failed to fetch creator coins');
      return response.json() as Promise<CreatorCoin[]>;
    }
  });
}

// Get a single creator coin
export function useCreatorCoin(id: string) {
  return useQuery({
    queryKey: ['/api/creator-coins', id],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${id}`);
      if (!response.ok) throw new Error('Failed to fetch creator coin');
      return response.json() as Promise<CreatorCoin>;
    },
    enabled: !!id
  });
}

// Upload content for creator coin
export function useCreatorCoinUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      file: File;
      creatorAddress: string;
      title: string;
      description?: string;
      contentType: string;
      coinName: string;
      coinSymbol: string;
      currency?: string;
      startingMarketCap?: string;
      twitter?: string;
      discord?: string;
      website?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('creatorAddress', data.creatorAddress);
      formData.append('title', data.title);
      formData.append('contentType', data.contentType);
      formData.append('coinName', data.coinName);
      formData.append('coinSymbol', data.coinSymbol);
      
      if (data.description) formData.append('description', data.description);
      if (data.currency) formData.append('currency', data.currency);
      if (data.startingMarketCap) formData.append('startingMarketCap', data.startingMarketCap);
      if (data.twitter) formData.append('twitter', data.twitter);
      if (data.discord) formData.append('discord', data.discord);
      if (data.website) formData.append('website', data.website);

      const response = await fetch('/api/creator-coins/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Upload failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins'] });
    }
  });
}

// Deploy creator coin
export function useDeployCreatorCoin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (coinId: string) => {
      const response = await apiRequest('POST', `/api/creator-coins/${coinId}/deploy`);
      return response;
    },
    onSuccess: (data, coinId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins', coinId] });
    }
  });
}

// Get creator coin price data
export function useCreatorCoinPrice(coinId: string) {
  return useQuery({
    queryKey: ['/api/creator-coins', coinId, 'price'],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${coinId}/price`);
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Token not deployed yet - no price data available');
        }
        throw new Error('Failed to fetch price data');
      }
      return response.json();
    },
    enabled: !!coinId,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error) => {
      // Don't retry if it's a 400 error (coin not deployed) or no trading data
      if (error && (error.message?.includes('400') || error.message?.includes('no active trading'))) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}

// Like creator coin
export function useLikeCreatorCoin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ coinId, userAddress }: { coinId: string; userAddress: string }) => {
      const response = await apiRequest('POST', `/api/creator-coins/${coinId}/like`, { userAddress });
      return response;
    },
    onSuccess: (data, { coinId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins', coinId] });
    }
  });
}

// Unlike creator coin
export function useUnlikeCreatorCoin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ coinId, userAddress }: { coinId: string; userAddress: string }) => {
      const response = await apiRequest('DELETE', `/api/creator-coins/${coinId}/like`, { userAddress });
      return response;
    },
    onSuccess: (data, { coinId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins', coinId] });
    }
  });
}

// Get creator coins by creator address
export function useCreatorCoinsByCreator(creatorAddress: string) {
  return useQuery({
    queryKey: ['/api/creator-coins', 'creator', creatorAddress],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins?creator=${creatorAddress}`);
      if (!response.ok) throw new Error('Failed to fetch creator coins');
      return response.json() as Promise<CreatorCoin[]>;
    },
    enabled: !!creatorAddress
  });
}

// Get creator coin comments
export function useCreatorCoinComments(coinId: string) {
  return useQuery({
    queryKey: ['/api/creator-coins', coinId, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${coinId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: !!coinId,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
}

// Get creator coin trades/activity
export function useCreatorCoinTrades(coinId: string) {
  return useQuery({
    queryKey: ['/api/creator-coins', coinId, 'trades'],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${coinId}/trades`);
      if (!response.ok) throw new Error('Failed to fetch trades');
      return response.json();
    },
    enabled: !!coinId,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
}

// Get creator coin holders
export function useCreatorCoinHolders(coinId: string) {
  return useQuery({
    queryKey: ['/api/creator-coins', coinId, 'holders'],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${coinId}/holders`);
      if (!response.ok) throw new Error('Failed to fetch holders');
      return response.json();
    },
    enabled: !!coinId,
    refetchInterval: 60000 // Refetch every 60 seconds
  });
}

// Get all creators who have deployed content coins
export function useCreators() {
  return useQuery({
    queryKey: ['/api/creators'],
    queryFn: async () => {
      const response = await fetch('/api/creators');
      if (!response.ok) throw new Error('Failed to fetch creators');
      return response.json();
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });
}

// Buy creator coin tokens
export function useBuyCreatorCoin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      coinId: string;
      userAddress: string;
      ethAmount: string;
      minTokensOut?: string;
      comment?: string;
    }) => {
      return apiRequest('POST', `/api/creator-coins/${data.coinId}/buy`, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins', variables.coinId] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins', variables.coinId, 'trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins', variables.coinId, 'holders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins'] });
    }
  });
}

// Sell creator coin tokens
export function useSellCreatorCoin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      coinId: string;
      userAddress: string;
      tokenAmount: string;
      minEthOut?: string;
    }) => {
      return apiRequest('POST', `/api/creator-coins/${data.coinId}/sell`, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins', variables.coinId] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins', variables.coinId, 'trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins', variables.coinId, 'holders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creator-coins'] });
    }
  });
}