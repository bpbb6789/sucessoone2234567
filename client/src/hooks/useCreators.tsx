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

      // Transform the data for frontend and include profile avatars
      const creators = creatorsData.map((creator, index) => {
        // Try to get saved profile data from localStorage
        let profileData = { name: '', avatarUrl: '' };
        try {
          const savedProfile = localStorage.getItem(`profile_${creator.creatorAddress}`);
          if (savedProfile) {
            profileData = JSON.parse(savedProfile);
          }
        } catch (error) {
          console.warn('Failed to load profile data for', creator.creatorAddress);
        }

        return {
          id: creator.creatorAddress,
          address: creator.creatorAddress,
          name: profileData.name || `Creator ${creator.creatorAddress.slice(0, 6)}...${creator.creatorAddress.slice(-4)}`,
          username: `@${creator.creatorAddress.slice(0, 8)}`,
          avatarUrl: profileData.avatarUrl || null,
          contentCoins: parseInt(creator.creatorCoinsCount as string),
          totalLikes: parseInt(creator.totalLikes as string) || 0,
          totalComments: parseInt(creator.totalComments as string) || 0,
          memberSince: creator.firstCreated,
          lastActive: creator.latestCreated,
          rank: index + 1
        };
      });
      return creators as Creator[];
    },
    refetchInterval: 300000 // Refetch every 5 minutes
  });
}