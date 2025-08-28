
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ChevronRight, Trash2, Check, X } from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();

  const typeColors = {
    success: "bg-green-900/50 text-green-400",
    info: "bg-blue-900/50 text-blue-400",
    warning: "bg-yellow-900/50 text-yellow-400",
    error: "bg-red-900/50 text-red-400",
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
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
                <Bell className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
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
