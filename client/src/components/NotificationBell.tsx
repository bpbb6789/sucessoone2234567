"use client";

import { Bell, Check, ChevronRight, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNotificationStore } from "@/stores/notificationStore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ScrollArea } from "./ui/scroll-area";
import { useEffect } from "react";

// Add some example notifications for testing
const addExampleNotifications = (addNotification: Function) => {
  addNotification({
    title: "New Token Launch",
    message: "PEPE token has just launched! Check it out now.",
    type: "success",
    link: "/token/0x123",
  });
  addNotification({
    title: "Price Alert",
    message: "DOGE has increased by 20% in the last hour",
    type: "info",
    link: "/token/0x456",
  });
  addNotification({
    title: "Trending Token",
    message: "SHIB is trending! Don't miss out.",
    type: "warning",
    link: "/token/0x789",
  });
};

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
  } = useNotificationStore();

  // Add example notifications when component mounts (for testing)
  useEffect(() => {
    if (notifications.length === 0) {
      addExampleNotifications(addNotification);
    }
  }, [notifications.length, addNotification]);

  const typeColors = {
    success: "text-green-400",
    info: "text-blue-400",
    warning: "text-yellow-400",
    error: "text-red-400",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-zinc-800"
        >
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">
              {unreadCount}
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
              onClick={markAllAsRead}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
            <Link href="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white"
              >
                View all
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start p-4 border-b border-zinc-800 cursor-pointer",
                  !notification.read && "bg-zinc-800/50"
                )}
              >
                <div className="flex-1" onClick={() => markAsRead(notification.id)}>
                  <div className="flex items-center justify-between">
                    <h3
                      className={cn(
                        "font-medium",
                        typeColors[notification.type]
                      )}
                    >
                      {notification.title}
                    </h3>
                    <span className="text-xs text-zinc-500">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {notification.message}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-8 w-8 text-zinc-400 hover:text-white"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-zinc-500">
              No notifications yet
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
