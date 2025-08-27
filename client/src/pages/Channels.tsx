import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, MoreHorizontal, Plus, Filter, FileText } from "lucide-react";
import { useGetAllChannels } from '@/hooks/useGetAllChannels';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';

export default function Channels() {
  const { data: channels, isLoading, error } = useGetAllChannels();

  const filteredChannels = channels || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-6 w-[500px]" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading channels: {error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Channels
              </h1>
              <p className="text-gray-400 text-lg">
                Discover trending channels • {filteredChannels.length} channels
              </p>
            </div>
            <Link to="/create-channel">
              <Button 
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-full"
              >
                + Create Channel
              </Button>
            </Link>
          </div>
        </div>

        {/* Channels Grid */}
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">No channels found</h3>
              <p className="text-gray-400 mb-6">
                No channels available yet
              </p>
              <Link to="/create-channel">
                <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-3 rounded-full">
                  Create First Channel
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filteredChannels.map((channel) => (
              <Link to={`/channel/${channel.slug}`} key={channel.id}>
                <Card className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer group">
                  <CardContent className="p-0">
                    {/* Compact Channel Cover/Banner */}
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      {channel.coverUrl ? (
                        <img
                          src={channel.coverUrl?.startsWith('baf') 
                            ? `https://gateway.pinata.cloud/ipfs/${channel.coverUrl}` 
                            : channel.coverUrl
                          }
                          alt={`${channel.name} cover`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=200&background=6366f1&color=fff&format=png`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">{channel.name.charAt(0)}</span>
                        </div>
                      )}
                      
                      {/* Overlay Avatar */}
                      <div className="absolute bottom-2 left-2">
                        <img
                          src={channel.avatarUrl?.startsWith('baf') 
                            ? `https://gateway.pinata.cloud/ipfs/${channel.avatarUrl}` 
                            : channel.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=32&background=6366f1&color=fff`
                          }
                          alt={channel.name}
                          className="w-6 h-6 rounded-full border border-white/50 object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=32&background=6366f1&color=fff`;
                          }}
                        />
                      </div>
                    </div>

                    {/* Compact Channel Info */}
                    <div className="p-2 space-y-2">
                      {/* Name */}
                      <div>
                        <h3 className="font-semibold text-white text-xs truncate">
                          {channel.name}
                        </h3>
                        <p className="text-gray-400 text-xs truncate">
                          @{channel.creatorUsername || 'unknown'}
                        </p>
                      </div>

                      {/* Stats with Icons */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            <span>📄</span>
                            <span className="text-gray-400">{channel.postsCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span>👥</span>
                            <span className="text-gray-400">{channel.holderCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span>💎</span>
                            <span className="text-green-400">
                              {channel.marketCap !== undefined ? `$${Math.floor(channel.marketCap/1000)}K` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Subscribe Button - Compact */}
                      <Button
                        size="sm"
                        className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold text-xs h-5 py-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement subscribe functionality
                          console.log("Subscribe button clicked for:", channel.id);
                        }}
                      >
                        ➕ Sub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}