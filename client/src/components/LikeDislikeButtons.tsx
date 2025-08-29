import { Button } from "@/components/ui/button";
import { useVideoLike, useShortsLike } from "@/hooks/useLikes";
import { ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ShareModal } from "./ShareModal";

interface LikeDislikeButtonsProps {
  videoId?: string;
  shortsId?: string;
  channelId: string;
  likeCount?: number;
  dislikeCount?: number;
  className?: string;
  onShare?: () => void;
}

export function LikeDislikeButtons({
  videoId,
  shortsId,
  channelId,
  likeCount,
  dislikeCount,
  className,
  onShare
}: LikeDislikeButtonsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Use appropriate hook based on content type
  const videoLike = useVideoLike(videoId, channelId);
  const shortsLike = useShortsLike(shortsId, channelId);

  const { likeStatus, likeVideo, dislikeVideo, likeShorts, dislikeShorts, removeLike, isLoading } =
    videoId ? videoLike : shortsLike;

  const handleLike = () => {
    if (likeStatus?.isLike) {
      removeLike();
    } else {
      videoId ? likeVideo() : likeShorts();
    }
  };

  const handleDislike = () => {
    if (likeStatus && !likeStatus.isLike) {
      removeLike();
    } else {
      videoId ? dislikeVideo() : dislikeShorts();
    }
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
  };

  const handleCopyLink = async () => {
    const url = videoId
      ? `${window.location.origin}/watch/${videoId}`
      : `${window.location.origin}/shorts/${shortsId}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Video link has been copied to clipboard",
        duration: 2000
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Like Button */}
      <Button
        onClick={handleLike}
        disabled={isLoading}
        variant="ghost"
        size="sm"
        className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full transition-colors",
          likeStatus?.isLike
            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        data-testid="button-like"
      >
        <ThumbsUp className={cn(
          "w-4 h-4",
          likeStatus?.isLike && "fill-current"
        )} />
        <span className="text-sm">
          {likeCount ? likeCount.toLocaleString() : "0"}
        </span>
      </Button>

      {/* Dislike Button */}
      <Button
        onClick={handleDislike}
        disabled={isLoading}
        variant="ghost"
        size="sm"
        className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full transition-colors",
          likeStatus && !likeStatus.isLike
            ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        data-testid="button-dislike"
      >
        <ThumbsDown className={cn(
          "w-4 h-4",
          likeStatus && !likeStatus.isLike && "fill-current"
        )} />
        <span className="text-sm">
          {dislikeCount ? dislikeCount.toLocaleString() : "0"}
        </span>
      </Button>

      {/* Share Button */}
      <Button
        onClick={handleShare}
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        data-testid="button-share"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm">{copied ? "Copied!" : "Share"}</span>
      </Button>

      <ShareModal isOpen={isShareModalOpen} onClose={handleCloseShareModal} onCopyLink={handleCopyLink} url={videoId ? `${window.location.origin}/watch/${videoId}` : `${window.location.origin}/shorts/${shortsId}`} />
    </div>
  );
}