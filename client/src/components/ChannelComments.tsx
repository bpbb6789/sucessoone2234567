"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { MessageCircle, Heart, Pin, Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChannelComment {
  id: string;
  channelId?: string;
  web3ChannelId?: string;
  authorAddress: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: Date;
}

interface ChannelCommentsProps {
  channelId?: string;
  web3ChannelId?: string;
  className?: string;
}

// Hook to fetch channel comments
function useChannelComments(channelId?: string, web3ChannelId?: string) {
  return useQuery({
    queryKey: ['channel-comments', channelId, web3ChannelId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (channelId) params.set('channelId', channelId);
      if (web3ChannelId) params.set('web3ChannelId', web3ChannelId);
      
      const response = await fetch(`/api/channel-comments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json() as ChannelComment[];
    },
    enabled: !!(channelId || web3ChannelId),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

// Hook to create a comment
function useCreateComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      channelId?: string;
      web3ChannelId?: string;
      authorAddress: string;
      authorName?: string;
      authorAvatar?: string;
      content: string;
    }) => {
      const response = await fetch('/api/channel-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create comment');
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ 
        queryKey: ['channel-comments', variables.channelId, variables.web3ChannelId] 
      });
    },
  });
}

// Hook to like a comment
function useLikeComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/channel-comments/${commentId}/like`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to like comment');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate comments queries
      queryClient.invalidateQueries({ queryKey: ['channel-comments'] });
    },
  });
}

// Hook to pin/unpin a comment
function usePinComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { commentId: string; isPinned: boolean }) => {
      const response = await fetch(`/api/channel-comments/${data.commentId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: data.isPinned }),
      });
      
      if (!response.ok) throw new Error('Failed to pin comment');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate comments queries
      queryClient.invalidateQueries({ queryKey: ['channel-comments'] });
    },
  });
}

// Hook to delete a comment
function useDeleteComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/channel-comments/${commentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete comment');
    },
    onSuccess: () => {
      // Invalidate comments queries
      queryClient.invalidateQueries({ queryKey: ['channel-comments'] });
    },
  });
}

export function ChannelComments({ channelId, web3ChannelId, className }: ChannelCommentsProps) {
  const { address, isConnected } = useAccount();
  const [newComment, setNewComment] = useState('');
  
  // Queries and mutations
  const { data: comments = [], isLoading } = useChannelComments(channelId, web3ChannelId);
  const createCommentMutation = useCreateComment();
  const likeCommentMutation = useLikeComment();
  const pinCommentMutation = usePinComment();
  const deleteCommentMutation = useDeleteComment();

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !address) return;
    
    try {
      await createCommentMutation.mutateAsync({
        channelId,
        web3ChannelId,
        authorAddress: address,
        authorName: `${address.slice(0, 6)}...${address.slice(-4)}`,
        content: newComment.trim(),
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleLikeComment = (commentId: string) => {
    likeCommentMutation.mutate(commentId);
  };

  const handlePinComment = (commentId: string, currentlyPinned: boolean) => {
    pinCommentMutation.mutate({ commentId, isPinned: !currentlyPinned });
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  // Sort comments: pinned first, then by creation date
  const sortedComments = comments.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-zinc-400" />
        <h3 className="text-lg font-semibold text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      {isConnected ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 resize-none"
            rows={3}
            maxLength={500}
            data-testid="comment-input"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {newComment.length}/500 characters
            </span>
            <Button
              type="submit"
              disabled={!newComment.trim() || createCommentMutation.isPending}
              size="sm"
              data-testid="submit-comment"
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-zinc-800 rounded-lg text-center text-zinc-400">
          Connect your wallet to join the conversation
        </div>
      )}

      {/* Comments List */}
      <ScrollArea className="h-[400px] space-y-4">
        {isLoading ? (
          <div className="text-center text-zinc-500 py-8">
            Loading comments...
          </div>
        ) : sortedComments.length > 0 ? (
          <div className="space-y-4">
            {sortedComments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "bg-zinc-800 rounded-lg p-4 space-y-3",
                  comment.isPinned && "border border-yellow-500/30 bg-yellow-500/5"
                )}
                data-testid={`comment-${comment.id}`}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.authorAvatar} />
                      <AvatarFallback className="bg-zinc-700 text-zinc-300">
                        {comment.authorName?.slice(0, 2).toUpperCase() || 
                         comment.authorAddress.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {comment.authorName || `${comment.authorAddress.slice(0, 6)}...${comment.authorAddress.slice(-4)}`}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {comment.isPinned && (
                      <Pin className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  
                  {/* Comment Actions */}
                  {address === comment.authorAddress && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-yellow-500"
                        onClick={() => handlePinComment(comment.id, comment.isPinned)}
                        disabled={pinCommentMutation.isPending}
                        data-testid={`pin-comment-${comment.id}`}
                      >
                        <Pin className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-red-500"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                        data-testid={`delete-comment-${comment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {comment.content}
                </p>

                {/* Comment Footer */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-red-400 h-8"
                    onClick={() => handleLikeComment(comment.id)}
                    disabled={likeCommentMutation.isPending}
                    data-testid={`like-comment-${comment.id}`}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {comment.likes}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-8">
            No comments yet. Be the first to comment!
          </div>
        )}
      </ScrollArea>
    </div>
  );
}