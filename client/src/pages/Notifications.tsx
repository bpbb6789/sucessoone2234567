
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Heart, MessageSquare, UserPlus, Video, Settings } from "lucide-react";
import { formatDistance } from "date-fns";

interface Notification {
  id: string;
  type: "like" | "comment" | "subscribe" | "upload" | "mention";
  title: string;
  description: string;
  thumbnail?: string;
  avatar: string;
  timestamp: Date;
  isRead: boolean;
  channelName: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "like",
      title: "New likes on your video",
      description: "5 people liked 'Amazing Tech Review'",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=56",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isRead: false,
      channelName: "Tech Explorer"
    },
    {
      id: "2",
      type: "comment",
      title: "New comment",
      description: "Gaming Pro commented: 'Great content! Keep it up!'",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=56",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isRead: false,
      channelName: "Gaming Pro"
    },
    {
      id: "3",
      type: "subscribe",
      title: "New subscriber",
      description: "Cooking Master subscribed to your channel",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      isRead: true,
      channelName: "Cooking Master"
    },
    {
      id: "4",
      type: "upload",
      title: "New video",
      description: "Tech Explorer uploaded 'Latest Smartphone Comparison'",
      thumbnail: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=56",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      isRead: true,
      channelName: "Tech Explorer"
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "subscribe":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "upload":
        return <Video className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderNotification = (notification: Notification) => (
    <Card
      key={notification.id}
      className={`cursor-pointer transition-colors ${
        !notification.isRead ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : ""
      }`}
      onClick={() => markAsRead(notification.id)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative">
            <img
              src={notification.avatar}
              alt={notification.channelName}
              className="w-10 h-10 rounded-full"
            />
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1">
              {getNotificationIcon(notification.type)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-medium text-sm">{notification.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {formatDistance(notification.timestamp, new Date(), { addSuffix: true })}
                  </span>
                  {!notification.isRead && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      New
                    </Badge>
                  )}
                </div>
              </div>

              {notification.thumbnail && (
                <img
                  src={notification.thumbnail}
                  alt=""
                  className="w-16 h-9 rounded object-cover ml-2"
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto" data-testid="page-notifications">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              notifications.map(renderNotification)
            )}
          </div>
        </TabsContent>

        <TabsContent value="mentions" className="mt-6">
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No mentions</h3>
            <p className="text-gray-500 dark:text-gray-400">
              When someone mentions you, it will appear here.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <div className="space-y-3">
            {notifications
              .filter(n => n.type === "upload" || n.type === "subscribe")
              .map(renderNotification)}
          </div>
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="space-y-3">
            {notifications
              .filter(n => n.type === "like" || n.type === "comment")
              .map(renderNotification)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
