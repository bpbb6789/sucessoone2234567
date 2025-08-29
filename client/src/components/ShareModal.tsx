
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
import { Share2, Copy, Twitter, MessageCircle, Mail, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
    children: React.ReactNode;
    url?: string;
    title?: string;
    description?: string;
}

export function ShareModal({ 
    children, 
    url = window.location.href, 
    title = "Check this out!",
    description = ""
}: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast({
                title: "Link copied!",
                description: "The link has been copied to your clipboard.",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: "Failed to copy",
                description: "Please copy the link manually.",
                variant: "destructive",
            });
        }
    };

    const handleTwitterShare = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank');
    };

    const handleEmailShare = () => {
        const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`;
        window.open(emailUrl);
    };

    const handleWhatsAppShare = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Copy Link */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Copy Link</label>
                        <div className="flex gap-2">
                            <Input
                                value={url}
                                readOnly
                                className="text-sm"
                            />
                            <Button
                                onClick={handleCopy}
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Share Options */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Share via</label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                onClick={handleTwitterShare}
                                className="flex flex-col gap-2 h-auto py-3"
                            >
                                <Twitter className="h-5 w-5" />
                                <span className="text-xs">Twitter</span>
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={handleWhatsAppShare}
                                className="flex flex-col gap-2 h-auto py-3"
                            >
                                <MessageCircle className="h-5 w-5" />
                                <span className="text-xs">WhatsApp</span>
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={handleEmailShare}
                                className="flex flex-col gap-2 h-auto py-3"
                            >
                                <Mail className="h-5 w-5" />
                                <span className="text-xs">Email</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
