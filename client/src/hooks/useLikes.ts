import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface LikeData {
  id: string;
  isLike: boolean;
  createdAt: string;
}

export function useVideoLike(videoId?: string, channelId?: string) {
  const queryClient = useQueryClient();
  
  // Get current like status
  const { data: likeStatus } = useQuery<LikeData | null>({
    queryKey: ["/api/videos", videoId, "like", channelId],
    enabled: !!videoId && !!channelId,
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/like/${channelId}`);
      return response.json();
    }
  });

  // Like/dislike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ isLike }: { isLike: boolean }) => {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, isLike })
      });
      if (!response.ok) throw new Error('Failed to like video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/videos", videoId, "like", channelId]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/videos", videoId]
      });
    }
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/like/${channelId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to unlike");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/videos", videoId, "like", channelId]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/videos", videoId]
      });
    }
  });

  const likeVideo = () => likeMutation.mutate({ isLike: true });
  const dislikeVideo = () => likeMutation.mutate({ isLike: false });
  const removeLike = () => unlikeMutation.mutate();

  return {
    likeStatus,
    likeVideo,
    dislikeVideo,
    removeLike,
    isLoading: likeMutation.isPending || unlikeMutation.isPending
  };
}

export function useShortsLike(shortsId?: string, channelId?: string) {
  const queryClient = useQueryClient();
  
  // Get current like status
  const { data: likeStatus } = useQuery<LikeData | null>({
    queryKey: ["/api/shorts", shortsId, "like", channelId],
    enabled: !!shortsId && !!channelId,
    queryFn: async () => {
      const response = await fetch(`/api/shorts/${shortsId}/like/${channelId}`);
      return response.json();
    }
  });

  // Like/dislike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ isLike }: { isLike: boolean }) => {
      const response = await fetch(`/api/shorts/${shortsId}/like`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, isLike })
      });
      if (!response.ok) throw new Error('Failed to like shorts');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/shorts", shortsId, "like", channelId]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/shorts", shortsId]
      });
    }
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/shorts/${shortsId}/like/${channelId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to unlike");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/shorts", shortsId, "like", channelId]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/shorts", shortsId]
      });
    }
  });

  const likeShorts = () => likeMutation.mutate({ isLike: true });
  const dislikeShorts = () => likeMutation.mutate({ isLike: false });
  const removeLike = () => unlikeMutation.mutate();

  return {
    likeStatus,
    likeShorts,
    dislikeShorts,
    removeLike,
    isLoading: likeMutation.isPending || unlikeMutation.isPending
  };
}