import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type CommentWithChannel } from "@shared/schema";

export function useComments(videoId?: string, shortsId?: string) {
  const queryClient = useQueryClient();
  
  const endpoint = videoId ? `/api/videos/${videoId}/comments` : `/api/shorts/${shortsId}/comments`;
  const queryKey = videoId ? ["/api/videos", videoId, "comments"] : ["/api/shorts", shortsId, "comments"];
  
  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<CommentWithChannel[]>({
    queryKey,
    enabled: !!(videoId || shortsId),
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, channelId, parentId }: { content: string; channelId: string; parentId?: string }) => {
      const response = await fetch('/api/comments', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          channelId,
          videoId,
          shortsId,
          parentId
        })
      });
      if (!response.ok) throw new Error('Failed to add comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId, channelId }: { commentId: string; channelId: string }) => {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId })
      });
      if (!response.ok) throw new Error('Failed to like comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutate,
    likeComment: likeCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    isLikingComment: likeCommentMutation.isPending
  };
}