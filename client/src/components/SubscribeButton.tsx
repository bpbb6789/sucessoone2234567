import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscribeButtonProps {
  subscriberChannelId: string;
  subscribedToChannelId: string;
  subscriberCount?: number;
  className?: string;
}

export function SubscribeButton({ 
  subscriberChannelId, 
  subscribedToChannelId, 
  subscriberCount,
  className 
}: SubscribeButtonProps) {
  const { isSubscribed, toggleSubscription, isToggling } = useSubscription(
    subscriberChannelId,
    subscribedToChannelId
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={toggleSubscription}
        disabled={isToggling}
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        className={cn(
          "px-4 py-2 rounded-full transition-all",
          isSubscribed 
            ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600" 
            : "bg-red-600 text-white hover:bg-red-700"
        )}
        data-testid={isSubscribed ? "button-unsubscribe" : "button-subscribe"}
      >
        {isToggling ? (
          "..."
        ) : isSubscribed ? (
          <>
            <BellRing className="w-4 h-4 mr-1" />
            Subscribed
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
      
      {subscriberCount !== undefined && (
        <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="subscriber-count">
          {subscriberCount.toLocaleString()} subscribers
        </span>
      )}
    </div>
  );
}