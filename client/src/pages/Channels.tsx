
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, TrendingUp } from "lucide-react";
import { useGetAllChannels } from '@/hooks/useGetAllChannels';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';

export default function Channels() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: channels, isLoading, error } = useGetAllChannels();

  // Filter channels based on search
  const filteredChannels = (channels || []).filter((channel) =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Channels Grid */}
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">No channels found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm ? `No channels match "${searchTerm}"` : 'No channels available yet'}
              </p>
              <Link to="/create-channel">
                <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-3 rounded-full">
                  Create First Channel
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredChannels.map((channel) => (
              <Link to={`/channel/${channel.slug}`} key={channel.id}>
                <Card className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer group">
                  <CardContent className="p-0">
                    {/* Channel Cover/Banner */}
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
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
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=400&background=6366f1&color=fff&format=png`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{channel.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>

                    {/* Channel Info */}
                    <div className="p-4 space-y-3">
                      {/* Avatar and Name */}
                      <div className="flex items-center gap-3">
                        <img
                          src={channel.avatarUrl?.startsWith('baf') 
                            ? `https://gateway.pinata.cloud/ipfs/${channel.avatarUrl}` 
                            : channel.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=40&background=6366f1&color=fff`
                          }
                          alt={channel.name}
                          className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&size=40&background=6366f1&color=fff`;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">
                            {channel.name}
                          </h3>
                          <p className="text-gray-400 text-xs">
                            Channel
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {channel.description && (
                        <p className="text-gray-400 text-xs line-clamp-2">
                          {channel.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-2 text-xs">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-400">0 subs</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Trending</span>
                          </div>
                        </div>
                      </div>

                      {/* Subscribe Button */}
                      <div className="pt-2">
                        <Button
                          size="sm"
                          className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement subscribe functionality
                            console.log("Subscribe button clicked for:", channel.id);
                          }}
                        >
                          Subscribe
                        </Button>
                      </div>
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
