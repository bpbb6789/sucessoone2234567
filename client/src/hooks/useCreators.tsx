
import { useQuery } from '@tanstack/react-query';

export interface Creator {
  id: string;
  name: string;
  username: string;
  address: string;
  contentCoins: number;
  totalLikes: number;
  totalComments: number;
  rank: number;
  createdAt: string;
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
