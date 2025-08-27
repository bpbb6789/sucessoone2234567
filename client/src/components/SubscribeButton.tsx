import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState } from "react";

interface SubscribeButtonProps {
  subscriberChannelId?: string;
  subscribedToChannelId: string;
  className?: string;
  showIcon?: boolean;
}

export function SubscribeButton({ 
  subscriberChannelId, 
  subscribedToChannelId, 
  className,
  showIcon = false
}: SubscribeButtonProps) {
  const { 
    isSubscribed, 
    isLoading, 
    toggleSubscription, 
    isToggling,
    subscribeError,
    unsubscribeError
  } = useSubscription(subscriberChannelId, subscribedToChannelId);

  const [showError, setShowError] = useState(false);

  // Don't show button if user is not logged in or trying to subscribe to themselves
  if (!subscriberChannelId || subscriberChannelId === subscribedToChannelId) {
    return null;
  }

  const handleClick = async () => {
    setShowError(false);
    try {
      await toggleSubscription();
    } catch (error) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const error = subscribeError || unsubscribeError;

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        onClick={handleClick}
        disabled={isLoading || isToggling}
        variant={isSubscribed ? "outline" : "default"}
        className={className}
        size="sm"
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : showIcon ? (
          isSubscribed ? (
            <Bell className="h-4 w-4 mr-1" />
          ) : (
            <BellOff className="h-4 w-4 mr-1" />
          )
        ) : null}
        {isToggling 
          ? (isSubscribed ? "Unsubscribing..." : "Subscribing...") 
          : isSubscribed 
            ? "Subscribed" 
            : "Subscribe"
        }
      </Button>

      {showError && error && (
        <span className="text-xs text-red-500 text-center max-w-xs">
          {error}
        </span>
      )}
    </div>
  );
}