import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useTriggerNotification } from './useNotifications';

interface EnhancedSubscription {
  id: string;
  subscriberAddress: string;
  channelId?: string;
  web3ChannelId?: string;
  subscriptionType: 'free' | 'paid';
  tokenAmount?: number;
  tier: 'basic' | 'premium' | 'vip';
  isActive: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  tradingNotifications: boolean;
  contentNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SubscriptionPreferences {
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  tradingNotifications?: boolean;
  contentNotifications?: boolean;
  tier?: 'basic' | 'premium' | 'vip';
}

// Get user's subscriptions
export function useUserSubscriptions(userAddress?: string) {
  return useQuery({
    queryKey: ['subscriptions', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      
      const response = await fetch(`/api/subscriptions/${userAddress}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json() as EnhancedSubscription[];
    },
    enabled: !!userAddress,
  });
}

// Subscribe to a channel with enhanced preferences
export function useEnhancedSubscribe() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const triggerNotification = useTriggerNotification();
  
  return useMutation({
    mutationFn: async (data: {
      channelId?: string;
      web3ChannelId?: string;
      subscriptionType?: 'free' | 'paid';
      tokenAmount?: number;
      tier?: 'basic' | 'premium' | 'vip';
      preferences?: SubscriptionPreferences;
    }) => {
      if (!address) throw new Error('Wallet not connected');
      
      const subscriptionData = {
        subscriberAddress: address,
        channelId: data.channelId,
        web3ChannelId: data.web3ChannelId,
        subscriptionType: data.subscriptionType || 'free',
        tokenAmount: data.tokenAmount,
        tier: data.tier || 'basic',
        isActive: true,
        notificationsEnabled: data.preferences?.notificationsEnabled ?? true,
        emailNotifications: data.preferences?.emailNotifications ?? false,
        pushNotifications: data.preferences?.pushNotifications ?? true,
        tradingNotifications: data.preferences?.tradingNotifications ?? true,
        contentNotifications: data.preferences?.contentNotifications ?? true,
      };
      
      const response = await fetch('/api/subscriptions/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to subscribe');
      }
      
      return response.json();
    },
    onSuccess: (subscription) => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['subscriptions', address] });
      
      // Trigger a notification for successful subscription
      triggerNotification.mutate({
        type: 'subscription_created',
        data: {
          recipientAddress: address,
          channelId: subscription.channelId || subscription.web3ChannelId,
          subscriptionType: subscription.subscriptionType,
          tier: subscription.tier
        }
      });
    },
  });
}

// Unsubscribe from a channel
export function useEnhancedUnsubscribe() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  
  return useMutation({
    mutationFn: async (data: {
      channelId?: string;
      web3ChannelId?: string;
    }) => {
      if (!address) throw new Error('Wallet not connected');
      
      const params = new URLSearchParams({
        subscriberAddress: address,
        ...(data.channelId && { channelId: data.channelId }),
        ...(data.web3ChannelId && { web3ChannelId: data.web3ChannelId }),
      });
      
      const response = await fetch(`/api/subscriptions/enhanced?${params}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to unsubscribe');
    },
    onSuccess: () => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['subscriptions', address] });
    },
  });
}

// Update subscription preferences
export function useUpdateSubscriptionPreferences() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  
  return useMutation({
    mutationFn: async (data: {
      subscriptionId: string;
      preferences: SubscriptionPreferences;
    }) => {
      const response = await fetch(`/api/subscriptions/${data.subscriptionId}/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.preferences),
      });
      
      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['subscriptions', address] });
    },
  });
}

// Check if user is subscribed to a specific channel
export function useIsSubscribed(channelId?: string, web3ChannelId?: string) {
  const { address } = useAccount();
  const { data: subscriptions = [] } = useUserSubscriptions(address);
  
  const isSubscribed = subscriptions.some(sub => 
    sub.isActive && (
      (channelId && sub.channelId === channelId) ||
      (web3ChannelId && sub.web3ChannelId === web3ChannelId)
    )
  );
  
  const subscription = subscriptions.find(sub => 
    sub.isActive && (
      (channelId && sub.channelId === channelId) ||
      (web3ChannelId && sub.web3ChannelId === web3ChannelId)
    )
  );
  
  return { isSubscribed, subscription };
}

// Get channel subscriber count from analytics
export function useChannelSubscriberCount(channelId?: string, web3ChannelId?: string) {
  return useQuery({
    queryKey: ['analytics', 'subscribers', channelId, web3ChannelId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (channelId) params.set('channelId', channelId);
      if (web3ChannelId) params.set('web3ChannelId', web3ChannelId);
      
      const response = await fetch(`/api/analytics/subscribers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch subscriber count');
      const data = await response.json();
      return data.subscriberCount as number;
    },
    enabled: !!(channelId || web3ChannelId),
    refetchInterval: 60000, // Refetch every minute
  });
}