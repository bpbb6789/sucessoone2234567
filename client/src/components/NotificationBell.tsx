
import { useState } from "react";
import { useAccount } from "wagmi";
import { useLocation } from "wouter";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistance } from "date-fns";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification
} from "@/hooks/useNotifications";

export default function NotificationBell() {
  const { address } = useAccount();
  const [, setLocation] = useLocation();
  const { data: notifications = [], isLoading } = useNotifications(address);
  const { data: unreadCount = 0 } = useUnreadCount(address);
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const handleMarkAsRead = (notificationId: string, actionUrl?: string) => {
    markAsReadMutation.mutate(notificationId);
    
    // Navigate to the action URL if provided
    if (actionUrl) {
      setLocation(actionUrl);
    }
  };

  const handleMarkAllAsRead = () => {
    if (address) {
      markAllAsReadMutation.mutate(address);
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "trade":
        return "💰";
      case "subscription":
        return "👤";
      case "comment":
        return "💬";
      case "like":
        return "❤️";
      case "content_coin":
        return "🎬";
      case "follow":
        return "👥";
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-zinc-800"
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-xs text-white"
              data-testid="unread-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-zinc-900 border-zinc-800"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
              data-testid="mark-all-read"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-zinc-500">
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-4 cursor-pointer hover:bg-zinc-800 flex-col items-start"
                onClick={() => handleMarkAsRead(notification.id, notification.actionUrl)}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <span className="font-medium text-white text-sm truncate">
                        {notification.title}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        {formatDistance(new Date(notification.createdAt), new Date(), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actor info */}
                  {notification.actorName && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                      {notification.actorAvatar && (
                        <img 
                          src={notification.actorAvatar} 
                          alt={notification.actorName}
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span>by {notification.actorName}</span>
                    </div>
                  )}
                  
                  {/* Read indicator */}
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-8 w-8 text-zinc-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notification.id);
                  }}
                  disabled={deleteNotificationMutation.isPending}
                  data-testid={`delete-notification-${notification.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-zinc-500">
              {address ? "No notifications yet" : "Connect wallet to see notifications"}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
