import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAccount } from "wagmi";
import { TrendingUp, Users, DollarSign, Settings, Upload, BarChart3, Crown } from "lucide-react";

export default function ChannelManager() {
  const { slug } = useParams();
  const { address } = useAccount();

  // Get channel data
  const { data: channel, isLoading } = useQuery({
    queryKey: ["channel", slug],
    queryFn: async () => {
      const response = await fetch(`/api/web3-channels`);
      const channels = await response.json();
      return channels.find((c: any) => c.slug === slug);
    },
  });

  // Get real token data
  const { data: tokenData } = useQuery({
    queryKey: ["token-data", channel?.coinAddress],
    queryFn: async () => {
      if (!channel?.coinAddress) return null;
      
      try {
        const [holdersRes, creationRes] = await Promise.all([
          fetch('/api/token-holders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenAddress: channel.coinAddress })
          }),
          fetch('/api/token-creation-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenAddress: channel.coinAddress })
          })
        ]);

        const [holdersData, creationData] = await Promise.all([
          holdersRes.ok ? holdersRes.json() : { holderCount: 0 },
          creationRes.ok ? creationRes.json() : null
        ]);

        return {
          price: '0.000001',
          marketCap: '0.00',
          volume24h: '0.00',
          holders: holdersData.holderCount || 0,
          change24h: 0,
          creationTime: creationData?.creationTime
        };
      } catch (error) {
        return {
          price: '0.000001',
          marketCap: '0.00', 
          volume24h: '0.00',
          holders: 0,
          change24h: 0
        };
      }
    },
    enabled: !!channel?.coinAddress
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading channel data...</div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Channel not found</h2>
          <p className="text-gray-600 dark:text-gray-400">This channel does not exist or has been removed.</p>
          <Button 
            onClick={() => window.location.href = '/profile'}
            className="mt-4"
          >
            Back to Profile
          </Button>
        </div>
      </div>
    );
  }

  // Check if current user is the owner
  const isOwner = address?.toLowerCase() === channel.owner?.toLowerCase();

  if (!isOwner) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this channel manager.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Channel Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              {channel.avatarCid ? (
                <img
                  src={`https://ipfs.io/ipfs/${channel.avatarCid}`}
                  alt={channel.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Crown className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{channel.name}</h1>
                <Badge variant="secondary" className="bg-white/20">
                  ${channel.ticker}
                </Badge>
                <Badge variant="secondary" className="bg-white/20">
                  {channel.category}
                </Badge>
              </div>
              <p className="text-white/80 mb-2">
                Channel Coin Address: <code className="text-sm">{channel.coinAddress}</code>
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span>Created: {new Date(channel.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>Status: {channel.status}</span>
              </div>
            </div>
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30">
              <Settings className="w-4 h-4 mr-2" />
              Channel Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Manager Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reels">Reels</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Token Price</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${tokenData?.price || '0.000001'}</div>
                  <p className="text-xs text-muted-foreground">
                    {tokenData?.change24h ? 
                      `${tokenData.change24h > 0 ? '+' : ''}${tokenData.change24h}% from last hour` : 
                      'No price change data'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Holders</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tokenData?.holders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {tokenData?.holders > 0 ? 'Total token holders' : 'No holders yet'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${tokenData?.marketCap || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">Volume: ${tokenData?.volume24h || '0.00'} (24h)</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8 text-gray-500">
                      No recent activity
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Reels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    No reels uploaded yet
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reels" className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Manage Reels</CardTitle>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Reel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No reels yet</h3>
                  <p className="text-gray-500 mb-4">
                    Upload your first reel to start engaging with your community
                  </p>
                  <Button>Upload First Reel</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Community Members & Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Community Features Coming Soon</h3>
                  <p className="text-gray-500">
                    Member management and role assignments will be available soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Creator Earnings & Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-6 border rounded-lg">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-sm text-gray-500">Available to withdraw</p>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-sm text-gray-500">Total earned</p>
                  </div>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Start earning from your channel activity and token appreciation
                  </p>
                  <Button disabled>Withdraw Earnings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Channel Settings</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Note: Ticker/symbol cannot be changed after creation
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium">Channel Name</label>
                    <input
                      type="text"
                      value={channel.name}
                      className="w-full mt-1 p-2 border rounded-md"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ticker (Cannot be changed)</label>
                    <input
                      type="text"
                      value={channel.ticker}
                      className="w-full mt-1 p-2 border rounded-md bg-gray-100 dark:bg-gray-800"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <input
                      type="text"
                      value={channel.category}
                      className="w-full mt-1 p-2 border rounded-md"
                      disabled
                    />
                  </div>
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">
                      Full settings management coming soon
                    </p>
                    <Button disabled>Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}