import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Edit, Share2, Wallet, Upload, FileText, Radio, Coins } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import ShortsCard from "@/components/ShortsCard";
import { useAccount } from "@/hooks/useWallet";

interface ProfileData {
  name: string;
  description: string;
}

export default function Profile() {
  const { address } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    description: ""
  });

  // Move all hooks before any conditional returns
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["profile-videos", address],
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(`/api/videos?address=${address}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!address,
  });

  const { data: shorts = [], isLoading: shortsLoading } = useQuery({
    queryKey: ["profile-shorts", address],
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(`/api/shorts?address=${address}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!address,
  });

  // Check if user has a Web3 channel
  const { data: channelData } = useQuery({
    queryKey: ["user-channel", address],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(`/api/me`, {
        headers: { 'x-wallet-address': address }
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!address,
  });

  // Get user's created channels count
  const { data: userChannels = [] } = useQuery({
    queryKey: ["user-channels", address],
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch('/api/web3-channels');
      if (!response.ok) return [];
      const allChannels = await response.json();
      return allChannels.filter((channel: any) => 
        channel.owner?.toLowerCase() === address.toLowerCase() ||
        channel.createdBy?.toLowerCase() === address.toLowerCase()
      );
    },
    enabled: !!address,
  });

  const displayName = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  const handle = address ? `@${address.slice(0, 6)}...${address.slice(-4)}` : "";

  // If no wallet connected, show connect prompt
  if (!address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="page-profile">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 mb-4">Please connect your wallet to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-profile">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600">
      </div>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`}
              alt="Profile Avatar"
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-800"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isEditing ? (
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={displayName}
                  className="text-2xl font-bold max-w-md"
                />
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold">{profileData.name || displayName}</h1>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-2">{handle}</p>

            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span>{videos.length} videos</span>
              <span>{shorts.length} shorts</span>
              <span>{userChannels.length} channel coins</span>
            </div>

            {isEditing ? (
              <Textarea
                value={profileData.description}
                onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell viewers about your channel..."
                className="mb-4"
                rows={3}
              />
            ) : (
              <p className="text-sm mb-4">{profileData.description || "No description yet."}</p>
            )}

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={() => setIsEditing(false)}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {userChannels.length > 0 ? (
                    <Button 
                      onClick={() => window.location.href = `/channel/${userChannels[0].slug}/manager`}
                      data-testid="button-manage-channels"
                    >
                      Manage Channels
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => window.location.href = '/create-channel'}
                      data-testid="button-create-channel"
                    >
                      Create Channel
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </>
              )}
            </div>

            {/* Content Management Dashboard */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Content Dashboard</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/create-channel'}
                  data-testid="button-create-channel"
                >
                  <Coins className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Create Channel</div>
                    <div className="text-xs text-muted-foreground">Launch new Zora channel</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/dashboard/import'}
                >
                  <Upload className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Import Content</div>
                    <div className="text-xs text-muted-foreground">Upload and tokenize content</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/dashboard/content'}
                >
                  <FileText className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">My Content</div>
                    <div className="text-xs text-muted-foreground">Manage imported content</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/subscriptions'}
                >
                  <Radio className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Subscriptions</div>
                    <div className="text-xs text-muted-foreground">Manage your subscriptions</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4">
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="shorts">Shorts</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="mt-6">
            {videosLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={(id) => console.log("Video clicked:", id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Upload your first video to get started
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shorts" className="mt-6">
            {shortsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[9/16]"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : shorts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {shorts.map((short) => (
                  <ShortsCard
                    key={short.id}
                    shorts={short}
                    onClick={(id) => console.log("Short clicked:", id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No shorts yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Create your first short video
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create your first playlist to organize your videos
              </p>
              <Button>Create Playlist</Button>
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About this channel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profileData.description || "No description provided."}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Wallet Information</h4>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Address:</span>
                      <div className="font-mono text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {address}
                      </div>
                    </div>
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