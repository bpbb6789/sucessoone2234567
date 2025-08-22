
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Edit, Share2, Bell, Shield } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import { ShortsCard } from "@/components/ShortsCard";

interface ProfileData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  isVerified: boolean;
  joinedDate: string;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    id: "1",
    name: "Your Channel",
    handle: "@yourchannel",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
    banner: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300",
    description: "Welcome to my channel! I create content about technology, gaming, and more.",
    subscriberCount: 12500,
    videoCount: 45,
    isVerified: true,
    joinedDate: "Jan 15, 2020"
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["profile-videos"],
    queryFn: async () => {
      const response = await fetch("/api/videos?channelId=1");
      return response.json();
    },
  });

  const { data: shorts = [], isLoading: shortsLoading } = useQuery({
    queryKey: ["profile-shorts"],
    queryFn: async () => {
      const response = await fetch("/api/shorts?channelId=1");
      return response.json();
    },
  });

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-profile">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600">
        <img
          src={profileData.banner}
          alt="Channel Banner"
          className="w-full h-full object-cover"
        />
        {isEditing && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Banner
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative">
            <img
              src={profileData.avatar}
              alt={profileData.name}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-800"
            />
            {isEditing && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-0 right-0 rounded-full p-2"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isEditing ? (
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-2xl font-bold max-w-md"
                />
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold">{profileData.name}</h1>
              )}
              {profileData.isVerified && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-2">{profileData.handle}</p>
            
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span>{formatCount(profileData.subscriberCount)} subscribers</span>
              <span>{profileData.videoCount} videos</span>
              <span>Joined {profileData.joinedDate}</span>
            </div>

            {isEditing ? (
              <Textarea
                value={profileData.description}
                onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                className="mb-4"
                rows={3}
              />
            ) : (
              <p className="text-sm mb-4">{profileData.description}</p>
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
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline">
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
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={(id) => console.log("Video clicked:", id)}
                  />
                ))}
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
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {shorts.map((short) => (
                  <ShortsCard
                    key={short.id}
                    shorts={short}
                    onClick={(id) => console.log("Short clicked:", id)}
                  />
                ))}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                      <div className="font-medium">{profileData.joinedDate}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total views:</span>
                      <div className="font-medium">1.2M views</div>
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
