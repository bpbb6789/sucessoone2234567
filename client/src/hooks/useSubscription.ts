import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useSubscription(subscriberChannelId?: string, subscribedToChannelId?: string) {
  const queryClient = useQueryClient();
  
  // Check subscription status
  const { data: isSubscribed, isLoading } = useQuery({
    queryKey: ["/api/subscriptions/check", subscriberChannelId, subscribedToChannelId],
    enabled: !!subscriberChannelId && !!subscribedToChannelId,
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/check/${subscriberChannelId}/${subscribedToChannelId}`);
      const data = await response.json();
      return data.isSubscribed;
    }
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
      if (!response.ok) throw new Error('Failed to subscribe');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/subscriptions/check", subscriberChannelId, subscribedToChannelId]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/channels", subscribedToChannelId]
      });
    }
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/subscriptions/${subscriberChannelId}/${subscribedToChannelId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to unsubscribe");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/subscriptions/check", subscriberChannelId, subscribedToChannelId]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/channels", subscribedToChannelId]
      });
    }
  });

  const toggleSubscription = () => {
    if (isSubscribed) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate();
    }
  };

  return {
    isSubscribed,
    isLoading,
    toggleSubscription,
    isToggling: subscribeMutation.isPending || unsubscribeMutation.isPending
  };
}