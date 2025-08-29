
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Heart, ArrowLeft } from "lucide-react";
import { formatTimeAgo } from "@/lib/constants";

interface Comment {
    id: string;
    content: string;
    author: string;
    authorAvatar?: string;
    createdAt: string;
    likeCount: number;
    replies?: Comment[];
}

interface CommentModalProps {
    children: React.ReactNode;
    comments?: Comment[];
    onAddComment?: (content: string, parentId?: string) => void;
    title?: string;
}

export function CommentModal({ 
    children, 
    comments = [], 
    onAddComment, 
    title = "Comments" 
}: CommentModalProps) {
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");

    const handleSubmit = () => {
        if (newComment.trim() && onAddComment) {
            onAddComment(newComment);
            setNewComment("");
        }
    };

    const handleReply = (parentId: string) => {
        if (replyContent.trim() && onAddComment) {
            onAddComment(replyContent, parentId);
            setReplyContent("");
            setReplyingTo(null);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] p-0">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <MessageCircle className="h-4 w-4" />
                        {title} ({comments.length})
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col h-[60vh]">
                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto px-4">
                        {comments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No comments yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {comments.map((comment) => (
                                    <Card key={comment.id} className="border-0 shadow-none bg-gray-50 dark:bg-gray-900">
                                        <CardContent className="p-3">
                                            <div className="flex gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={comment.authorAvatar} />
                                                    <AvatarFallback className="text-xs">
                                                        {comment.author.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm">{comment.author}</span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatTimeAgo(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                                        {comment.content}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-xs"
                                                        >
                                                            <Heart className="h-3 w-3 mr-1" />
                                                            {comment.likeCount || 0}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-xs"
                                                            onClick={() => setReplyingTo(comment.id)}
                                                        >
                                                            <MessageCircle className="h-3 w-3 mr-1" />
                                                            Reply
                                                        </Button>
                                                    </div>
                                                    
                                                    {/* Reply Input */}
                                                    {replyingTo === comment.id && (
                                                        <div className="mt-2 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setReplyingTo(null)}
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    <ArrowLeft className="h-3 w-3" />
                                                                </Button>
                                                                <span className="text-xs text-gray-500">
                                                                    Replying to {comment.author}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    placeholder="Write a reply..."
                                                                    value={replyContent}
                                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                                    className="h-8 text-sm"
                                                                    onKeyPress={(e) => 
                                                                        e.key === 'Enter' && handleReply(comment.id)
                                                                    }
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleReply(comment.id)}
                                                                    disabled={!replyContent.trim()}
                                                                    className="h-8 px-3"
                                                                >
                                                                    <Send className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Comment */}
                    <div className="border-t p-4">
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[60px] resize-none text-sm"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleSubmit}
                                disabled={!newComment.trim()}
                                className="self-end"
                                size="sm"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
