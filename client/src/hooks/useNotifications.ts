import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

interface Notification {
  id: string;
  recipientAddress: string;
  title: string;
  message: string;
  type: 'subscription' | 'comment' | 'trade' | 'content_coin' | 'follow' | 'like';
  entityType: 'channel' | 'web3_channel' | 'video' | 'token' | 'user' | 'content_coin';
  entityId: string;
  actorAddress?: string;
  actorName?: string;
  actorAvatar?: string;
  actionUrl?: string;
  metadata?: any;
  read: boolean;
  createdAt: Date;
}

// Fetch notifications for a user
export function useNotifications(userAddress?: string, unreadOnly: boolean = false) {
  return useQuery({
    queryKey: ['notifications', userAddress, unreadOnly],
    queryFn: async () => {
      if (!userAddress) return [];
      
      const params = new URLSearchParams({
        limit: '50',
        unreadOnly: unreadOnly.toString()
      });
      
      const response = await fetch(`/api/notifications/${userAddress}?${params}`);
      if (!response.ok) {
        console.error('Notification fetch failed:', response.status, response.statusText);
        return []; // Return empty array instead of throwing
      }
      const data = await response.json();
      console.log('Fetched notifications:', data.length);
      return data as Notification[];
    },
    enabled: !!userAddress,
    refetchInterval: 3000, // Poll every 3 seconds for new notifications
    staleTime: 0, // Always consider data stale to refetch
  });
}

// Get unread notification count
export function useUnreadCount(userAddress?: string) {
  return useQuery({
    queryKey: ['notifications', userAddress, 'unread-count'],
    queryFn: async () => {
      if (!userAddress) return 0;
      
      const response = await fetch(`/api/notifications/${userAddress}/unread-count`);
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data.count as number;
    },
    enabled: !!userAddress,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

// Mark notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications', address] });
    },
  });
}

// Mark all notifications as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  
  return useMutation({
    mutationFn: async (userAddress: string) => {
      const response = await fetch(`/api/notifications/${userAddress}/read-all`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications', address] });
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
    },
    onSuccess: () => {
      // Invalidate notifications queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications', address] });
    },
  });
}

// Trigger notification (for system events)
export function useTriggerNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { type: string; data: any }) => {
      const response = await fetch('/api/notifications/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to trigger notification');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}