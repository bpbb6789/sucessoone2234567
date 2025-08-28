
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Heart, MessageSquare, UserPlus, Video, Settings } from "lucide-react";
import { formatDistance } from "date-fns";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";

export default function Notifications() {
  const { address } = useAccount();
  const { data: notifications = [], isLoading } = useNotifications(address);
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    if (address) {
      markAllAsReadMutation.mutate(address);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "subscription":
      case "follow":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "content_coin":
      case "trade":
        return <Video className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderNotification = (notification: any) => (
    <Card
      key={notification.id}
      className={`cursor-pointer transition-colors ${
        !notification.read ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : ""
      }`}
      onClick={() => markAsRead(notification.id)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative">
            <img
              src={notification.actorAvatar || "/images/unipump.png"}
              alt={notification.actorName || "User"}
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
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {formatDistance(new Date(notification.createdAt), new Date(), { addSuffix: true })}
                  </span>
                  {!notification.read && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      New
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!address) {
    return (
      <div className="p-4 max-w-4xl mx-auto" data-testid="page-notifications">
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please connect your wallet to view notifications.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 max-w-4xl mx-auto" data-testid="page-notifications">
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Loading...</h3>
        </div>
      </div>
    );
  }

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
          <div className="space-y-3">
            {notifications.filter(n => n.type === "mention").length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No mentions</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  When someone mentions you, it will appear here.
                </p>
              </div>
            ) : (
              notifications
                .filter(n => n.type === "mention")
                .map(renderNotification)
            )}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <div className="space-y-3">
            {notifications.filter(n => n.type === "subscription" || n.type === "follow").length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No subscription activity</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Subscription and follow notifications will appear here.
                </p>
              </div>
            ) : (
              notifications
                .filter(n => n.type === "subscription" || n.type === "follow")
                .map(renderNotification)
            )}
          </div>
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="space-y-3">
            {notifications.filter(n => n.type === "like" || n.type === "comment" || n.type === "trade" || n.type === "content_coin").length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No other activity</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Likes, comments, and other activity will appear here.
                </p>
              </div>
            ) : (
              notifications
                .filter(n => n.type === "like" || n.type === "comment" || n.type === "trade" || n.type === "content_coin")
                .map(renderNotification)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
