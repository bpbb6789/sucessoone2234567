import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useSubscription(subscriberChannelId?: string, subscribedToChannelId?: string) {
  const queryClient = useQueryClient();
  
  // Check subscription status
  const { data: isSubscribed, isLoading, error } = useQuery({
    queryKey: ["/api/subscriptions/check", subscriberChannelId, subscribedToChannelId],
    enabled: !!subscriberChannelId && !!subscribedToChannelId,
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/check/${subscriberChannelId}/${subscribedToChannelId}`);
      if (!response.ok) {
        throw new Error('Failed to check subscription status');
      }
      const data = await response.json();
      return data.isSubscribed;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscriptions', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberChannelId,
          subscribedToChannelId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to subscribe');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate subscription status
      queryClient.invalidateQueries({
        queryKey: ["/api/subscriptions/check", subscriberChannelId, subscribedToChannelId]
      });
      
      // Invalidate channel data to update subscriber count
      queryClient.invalidateQueries({
        queryKey: ["/api/channels", subscribedToChannelId]
      });
      
      // Invalidate user's subscription list
      queryClient.invalidateQueries({
        queryKey: ["/api/user", subscriberChannelId, "subscriptions"]
      });
      
      // Invalidate feed
      queryClient.invalidateQueries({
        queryKey: ["/api/user", subscriberChannelId, "feed"]
      });
    },
    onError: (error) => {
      console.error('Subscribe error:', error);
    }
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscriptions', {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberChannelId,
          subscribedToChannelId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unsubscribe');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate subscription status
      queryClient.invalidateQueries({
        queryKey: ["/api/subscriptions/check", subscriberChannelId, subscribedToChannelId]
      });
      
      // Invalidate channel data to update subscriber count
      queryClient.invalidateQueries({
        queryKey: ["/api/channels", subscribedToChannelId]
      });
      
      // Invalidate user's subscription list
      queryClient.invalidateQueries({
        queryKey: ["/api/user", subscriberChannelId, "subscriptions"]
      });
      
      // Invalidate feed
      queryClient.invalidateQueries({
        queryKey: ["/api/user", subscriberChannelId, "feed"]
      });
    },
    onError: (error) => {
      console.error('Unsubscribe error:', error);
    }
  });

  const toggleSubscription = () => {
    if (!subscriberChannelId || !subscribedToChannelId) {
      console.error('Missing channel IDs for subscription toggle');
      return;
    }

    if (isSubscribed) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate();
    }
  };

  return {
    isSubscribed: !!isSubscribed,
    isLoading,
    error,
    toggleSubscription,
    isToggling: subscribeMutation.isPending || unsubscribeMutation.isPending,
    subscribeError: subscribeMutation.error?.message,
    unsubscribeError: unsubscribeMutation.error?.message
  };
}

// Hook to get user's subscriptions
export function useUserSubscriptions(channelId?: string) {
  return useQuery({
    queryKey: ["/api/user", channelId, "subscriptions"],
    enabled: !!channelId,
    queryFn: async () => {
      const response = await fetch(`/api/user/${channelId}/subscriptions`);
      if (!response.ok) {
        throw new Error('Failed to fetch user subscriptions');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}

// Hook to get subscription feed
export function useSubscriptionFeed(channelId?: string, limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: ["/api/user", channelId, "feed", limit, offset],
    enabled: !!channelId,
    queryFn: async () => {
      const response = await fetch(`/api/user/${channelId}/feed?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription feed');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2 // 2 minutes
  });
}