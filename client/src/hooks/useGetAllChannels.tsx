import { useQuery } from "@tanstack/react-query";

export interface Channel {
  id: string;
  slug: string;
  name: string;
  description: string;
  avatarUrl: string;
  coverUrl: string;
  coinAddress: string;
  metadataUri: string;
  transactionHash: string;
  createdAt: string;
  updatedAt: string;
}

const fetchChannels = async (): Promise<Channel[]> => {
  const response = await fetch('/api/web3-channels');
  if (!response.ok) {
    throw new Error('Failed to fetch channels');
  }
  return response.json();
};

export const useGetAllChannels = () => {
  return useQuery({
    queryKey: ['/api/web3-channels'],
    queryFn: fetchChannels,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
};