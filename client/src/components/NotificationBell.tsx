"use client";

import { Bell, Check, ChevronRight, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { useAccount } from 'wagmi';
import { 
  useNotifications, 
  useUnreadCount, 
  useMarkAsRead, 
  useMarkAllAsRead, 
  useDeleteNotification 
} from "@/hooks/useNotifications";
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { address } = useAccount();
  
  // Fetch notifications and unread count
  const { data: notifications = [], isLoading } = useNotifications(address);
  const { data: unreadCount = 0 } = useUnreadCount(address);
  
  // Mutation hooks
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const typeColors = {
    subscription: "text-green-400",
    comment: "text-blue-400", 
    trade: "text-purple-400",
    content_coin: "text-yellow-400",
    follow: "text-pink-400",
    like: "text-red-400",
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (address) {
      markAllAsReadMutation.mutate(address);
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
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
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start p-4 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/30",
                  !notification.read && "bg-zinc-800/50"
                )}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex-1" onClick={() => handleMarkAsRead(notification.id)}>
                  <div className="flex items-center justify-between">
                    <h3
                      className={cn(
                        "font-medium",
                        typeColors[notification.type] || "text-blue-400"
                      )}
                    >
                      {notification.title}
                    </h3>
                    <span className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {notification.message}
                  </p>
                  
                  {/* Show actor info if available */}
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
