import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown, Share, Download, Plus, MoreHorizontal, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { type VideoWithChannel, type CommentWithChannel } from "@shared/schema";
import { formatViewCount, formatTimeAgo } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const navigate = useNavigate();

  const { data: video, isLoading: videoLoading, error: videoError } = useQuery<VideoWithChannel>({
    queryKey: ["/api/videos", id],
    enabled: !!id,
  });

  const { data: recommendedVideos = [], isLoading: recommendedLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos"],
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithChannel[]>({
    queryKey: ["/api/comments", { videoId: id }],
    enabled: !!id,
  });

  const updateViewsMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/videos/${id}/views`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", id] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", "/api/comments", {
        content,
        videoId: id,
        channelId: "1", // Mock current user channel
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      setCommentText("");
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update views when component mounts
  useState(() => {
    if (id && !videoLoading && !videoError) {
      updateViewsMutation.mutate();
    }
  });

  if (videoError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Video not found</h2>
          <p className="text-gray-500 dark:text-gray-400">
            The video you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (videoLoading || !video) {
    return (
      <div className="p-4" data-testid="watch-page-loading">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-xl video-aspect animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex space-x-3 animate-pulse">
                <div className="w-40 h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText.trim());
    }
  };

  const handleAvatarClick = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${channelId}`);
  };

  return (
    <div className="p-4" data-testid="page-watch">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="relative bg-black rounded-xl overflow-hidden mb-4">
            <div className="video-aspect">
              <iframe
                src={video.videoUrl}
                title={video.title}
                className="w-full h-full"
                allowFullScreen
                data-testid="video-player"
              />
            </div>
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <h1 className="text-xl font-bold" data-testid="video-title">
              {video.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Channel Info */}
              <div className="flex items-center space-x-3">
                <img
                  src={video.channel.avatarUrl}
                  alt={video.channel.name}
                  className="w-10 h-10 rounded-full cursor-pointer"
                  onClick={(e) => handleAvatarClick(video.channel.id, e)}
                />
                <div>
                  <h3 className="font-medium flex items-center" data-testid="channel-name">
                    {video.channel.name}
                    {video.channel.verified && <span className="ml-1">✓</span>}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="channel-subscribers">
                    {formatViewCount(video.channel.subscriberCount || 0)} subscribers
                  </p>
                </div>
                <Button 
                  className="bg-youtube-red hover:bg-red-600 text-white ml-4"
                  data-testid="button-subscribe"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center rounded-full bg-gray-100 dark:bg-youtube-dark-secondary">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-l-full px-4"
                    data-testid="button-like"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {formatViewCount(video.likeCount || 0)}
                  </Button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-r-full px-4"
                    data-testid="button-dislike"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>

                <Button variant="outline" size="sm" data-testid="button-share">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>

                <Button variant="outline" size="sm" data-testid="button-download">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                <Button variant="outline" size="sm" data-testid="button-save">
                  <Plus className="h-4 w-4 mr-2" />
                  Save
                </Button>

                <Button variant="outline" size="icon" data-testid="button-more">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Video Stats & Description */}
            <div className="bg-gray-100 dark:bg-youtube-dark-secondary rounded-xl p-4">
              <div className="flex items-center space-x-4 text-sm font-medium mb-2">
                <span data-testid="video-views">
                  {formatViewCount(video.viewCount || 0)} views
                </span>
                <span data-testid="video-date">
                  {formatTimeAgo(video.publishedAt || new Date())}
                </span>
                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {video.tags.map((tag) => (
                      <span key={tag} className="text-blue-600 dark:text-blue-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {video.description && (
                <div className="text-sm">
                  <p className={`${!isDescriptionExpanded ? 'line-clamp-3' : ''}`} data-testid="video-description">
                    {video.description}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-2 font-medium"
                    data-testid="button-description-toggle"
                  >
                    {isDescriptionExpanded ? 'Show less' : 'Show more'}
                  </button>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" data-testid="comments-title">
                {formatViewCount(video.commentCount || 0)} Comments
              </h2>

              {/* Add Comment */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
                    alt="Your Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-comment"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCommentText("")}
                        data-testid="button-cancel-comment"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleCommentSubmit}
                        disabled={!commentText.trim() || addCommentMutation.isPending}
                        data-testid="button-post-comment"
                      >
                        {addCommentMutation.isPending ? "Posting..." : "Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex space-x-3 animate-pulse" data-testid={`comment-skeleton-${i}`}>
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                      <img
                        src={comment.channel.avatarUrl}
                        alt={comment.channel.name}
                        className="w-10 h-10 rounded-full flex-shrink-0 cursor-pointer"
                        onClick={(e) => handleAvatarClick(comment.channel.id, e)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm" data-testid={`comment-author-${comment.id}`}>
                            {comment.channel.name}
                            {comment.channel.verified && <span className="ml-1">✓</span>}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400" data-testid={`comment-date-${comment.id}`}>
                            {formatTimeAgo(comment.createdAt || new Date())}
                          </span>
                        </div>
                        <p className="text-sm mb-2" data-testid={`comment-content-${comment.id}`}>
                          {comment.content}
                        </p>
                        <div className="flex items-center space-x-4 text-xs">
                          <button className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-youtube-dark-secondary rounded px-2 py-1">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{formatViewCount(comment.likeCount || 0)}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-youtube-dark-secondary rounded px-2 py-1">
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                          <button className="hover:bg-gray-100 dark:hover:bg-youtube-dark-secondary rounded px-2 py-1">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Videos Sidebar */}
        <div className="space-y-4">
          <h2 className="font-semibold">Recommended</h2>

          {recommendedLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex space-x-3 animate-pulse" data-testid={`recommended-skeleton-${i}`}>
                  <div className="w-40 h-24 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recommendedVideos
                .filter(v => v.id !== video.id)
                .slice(0, 20)
                .map((recommendedVideo) => (
                <div
                  key={recommendedVideo.id}
                  className="flex space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-youtube-dark-secondary rounded-lg p-2 -m-2"
                  onClick={() => window.location.href = `/watch/${recommendedVideo.id}`}
                  data-testid={`recommended-video-${recommendedVideo.id}`}
                >
                  <img
                    src={recommendedVideo.thumbnailUrl}
                    alt={recommendedVideo.title}
                    className="w-40 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium line-clamp-2 mb-1" data-testid={`recommended-title-${recommendedVideo.id}`}>
                      {recommendedVideo.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1" data-testid={`recommended-channel-${recommendedVideo.id}`}>
                      {recommendedVideo.channel.name}
                      {recommendedVideo.channel.verified && <span className="ml-1">✓</span>}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`recommended-stats-${recommendedVideo.id}`}>
                      {formatViewCount(recommendedVideo.viewCount || 0)} views • {formatTimeAgo(recommendedVideo.publishedAt || new Date())}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}