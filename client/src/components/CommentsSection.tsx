import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useComments } from "@/hooks/useComments";
import { formatTimeAgo } from "@/lib/constants";
import { ThumbsUp, Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CommentModal } from "./CommentModal";

interface CommentsSectionProps {
  videoId?: string;
  shortsId?: string;
  currentChannelId: string;
  className?: string;
}

export function CommentsSection({ 
  videoId, 
  shortsId, 
  currentChannelId,
  className 
}: CommentsSectionProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { comments, isLoading, addComment, likeComment, isAddingComment } = useComments(
    videoId,
    shortsId
  );

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    addComment({ 
      content: newComment.trim(), 
      channelId: currentChannelId 
    });
    setNewComment("");
    toast({
      title: "Comment posted!",
      description: "Your comment has been added",
      duration: 2000
    });
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim()) return;

    addComment({ 
      content: replyText.trim(), 
      channelId: currentChannelId,
      parentId 
    });
    setReplyText("");
    setReplyingTo(null);
    toast({
      title: "Reply posted!",
      description: "Your reply has been added",
      duration: 2000
    });
  };

  const handleLikeComment = (commentId: string) => {
    likeComment({ commentId, channelId: currentChannelId });
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="comments-title">
          Comments ({comments.length})
        </h3>

        {/* Add new comment */}
        <div className="flex gap-3 mb-6">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
            alt="Your avatar"
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
              className="flex-1"
              data-testid="input-new-comment"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isAddingComment}
              size="sm"
              data-testid="button-post-comment"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4" data-testid={`comment-${comment.id}`}>
              <div className="flex gap-3">
                <img
                  src={comment.channel.avatarUrl}
                  alt={comment.channel.name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" data-testid={`comment-author-${comment.id}`}>
                      {comment.channel.name}
                    </span>
                    {comment.channel.verified && (
                      <span className="text-blue-500">✓</span>
                    )}
                    <span className="text-xs text-gray-500" data-testid={`comment-date-${comment.id}`}>
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2 whitespace-pre-wrap" data-testid={`comment-content-${comment.id}`}>
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <Button
                      onClick={() => handleLikeComment(comment.id)}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto hover:bg-transparent"
                      data-testid={`button-like-comment-${comment.id}`}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {comment.likeCount || 0}
                    </Button>
                    
                    <CommentModal
                      title={`Reply to ${comment.author}`}
                      comments={comment.replies || []}
                      onAddComment={(content, parentId) => {
                        // Handle reply logic here
                        console.log('Reply:', content, 'to:', parentId || comment.id);
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto hover:bg-transparent text-gray-500"
                        data-testid={`button-reply-comment-${comment.id}`}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                    </CommentModal>
                  </div>

                  {/* Reply input */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitReply(comment.id)}
                        className="flex-1 text-sm"
                        data-testid={`input-reply-${comment.id}`}
                      />
                      <Button
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyText.trim()}
                        size="sm"
                        data-testid={`button-post-reply-${comment.id}`}
                      >
                        Reply
                      </Button>
                      <Button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Show replies count */}
                  {comment.replyCount && comment.replyCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 p-1 h-auto text-blue-600 hover:bg-transparent"
                    >
                      ↳ View {comment.replyCount} replies
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {comments.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}