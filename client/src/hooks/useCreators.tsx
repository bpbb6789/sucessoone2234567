import { useQuery } from '@tanstack/react-query';

export interface Creator {
  id: string;
  name: string;
  username: string;
  address: string;
  avatarUrl?: string | null; // Added avatarUrl to the interface
  contentCoins: number;
  totalLikes: number;
  totalComments: number;
  rank: number;
  memberSince: string;
  lastActive: string;
}

// Get all creators who have deployed content coins
export function useCreators() {
  return useQuery({
    queryKey: ['/api/creators'],
    queryFn: async () => {
      const response = await fetch('/api/creators');
      if (!response.ok) throw new Error('Failed to fetch creators');
      const creatorsData = await response.json();

      // The backend now provides all the data including profile info and avatars
      return creatorsData as Creator[];
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });
}