import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { useAccount } from 'wagmi';
import { 
  useIsSubscribed, 
  useEnhancedSubscribe, 
  useEnhancedUnsubscribe,
  useChannelSubscriberCount 
} from "@/hooks/useEnhancedSubscriptions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface SubscribeButtonProps {
  channelId?: string;
  web3ChannelId?: string;
  className?: string;
  showIcon?: boolean;
  showSubscriberCount?: boolean;
}

export function SubscribeButton({ 
  channelId,
  web3ChannelId, 
  className,
  showIcon = false,
  showSubscriberCount = false
}: SubscribeButtonProps) {
  const { address, isConnected } = useAccount();
  const { isSubscribed, subscription } = useIsSubscribed(channelId, web3ChannelId);
  const { data: subscriberCount = 0 } = useChannelSubscriberCount(channelId, web3ChannelId);
  
  const subscribeMutation = useEnhancedSubscribe();
  const unsubscribeMutation = useEnhancedUnsubscribe();

  const [showError, setShowError] = useState(false);

  // Don't show button if wallet not connected
  if (!isConnected || !address) {
    return null;
  }

  const handleSubscribe = async (preferences = {}) => {
    setShowError(false);
    try {
      await subscribeMutation.mutateAsync({
        channelId,
        web3ChannelId,
        subscriptionType: 'free',
        tier: 'basic',
        preferences: {
          notificationsEnabled: true,
          pushNotifications: true,
          contentNotifications: true,
          tradingNotifications: false,
          ...preferences
        }
      });
    } catch (error: any) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleUnsubscribe = async () => {
    setShowError(false);
    try {
      await unsubscribeMutation.mutateAsync({
        channelId,
        web3ChannelId
      });
    } catch (error: any) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const isLoading = subscribeMutation.isPending || unsubscribeMutation.isPending;
  const error = subscribeMutation.error || unsubscribeMutation.error;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => isSubscribed ? handleUnsubscribe() : handleSubscribe()}
          disabled={isLoading}
          variant={isSubscribed ? "outline" : "default"}
          className={className}
          size="sm"
          data-testid={isSubscribed ? "unsubscribe-button" : "subscribe-button"}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : showIcon ? (
            isSubscribed ? (
              <Bell className="h-4 w-4 mr-1" />
            ) : (
              <BellOff className="h-4 w-4 mr-1" />
            )
          ) : null}
          {isLoading 
            ? (isSubscribed ? "Unsubscribing..." : "Subscribing...") 
            : isSubscribed 
              ? "Subscribed" 
              : "Subscribe"
          }
        </Button>

        {/* Subscription Settings Dropdown */}
        {isSubscribed && subscription && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="subscription-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => handleSubscribe({
                  tier: 'premium',
                  notificationsEnabled: true,
                  tradingNotifications: true,
                  contentNotifications: true
                })}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Upgrade to Premium
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleSubscribe({
                  notificationsEnabled: !subscription.notificationsEnabled
                })}
                className="flex items-center gap-2"
              >
                {subscription.notificationsEnabled ? (
                  <BellOff className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {subscription.notificationsEnabled ? 'Disable' : 'Enable'} Notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Subscriber Count */}
      {showSubscriberCount && (
        <span className="text-xs text-zinc-500" data-testid="subscriber-count">
          {subscriberCount.toLocaleString()} subscribers
        </span>
      )}

      {/* Error Message */}
      {showError && error && (
        <span className="text-xs text-red-500 text-center max-w-xs">
          {error.message || 'An error occurred'}
        </span>
      )}
    </div>
  );
}