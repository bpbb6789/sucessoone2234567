"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotificationStore } from "@/stores/notificationStore";
import { Check, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const {
    notifications,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const typeColors = {
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="min-h-screen bg-site-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
            <Button
              variant="destructive"
              onClick={clearAll}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`bg-zinc-900/50 border-zinc-800 p-4 ${
                  !notification.read ? "ring-1 ring-blue-500/50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          typeColors[notification.type]
                        }`}
                      >
                        {notification.type.toUpperCase()}
                      </span>
                      <span className="text-zinc-400 text-sm">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-zinc-400">{notification.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.link && (
                      <Link href={notification.link}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotification(notification.id)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-zinc-900/50 border-zinc-800 p-8">
              <div className="text-center">
                <p className="text-lg text-zinc-400">No notifications yet</p>
                <p className="text-sm text-zinc-500 mt-1">
                  When you get notifications, they'll show up here
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
