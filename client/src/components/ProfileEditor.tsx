import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Channel, type UserProfile } from "@shared/schema";

interface ProfileEditorProps {
  channelId: string;
  onClose?: () => void;
  className?: string;
}

export function ProfileEditor({ channelId, onClose, className }: ProfileEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    handle: '',
    avatarUrl: '',
    bannerUrl: '',
    // Profile-specific fields
    bio: '',
    location: '',
    website: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      tiktok: ''
    }
  });

  // Fetch channel data
  const { data: channel, isLoading: channelLoading } = useQuery<Channel>({
    queryKey: ["/api/channels", channelId],
    enabled: !!channelId
  });

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profiles", channelId],
    enabled: !!channelId,
    retry: false
  });

  // Update form when data loads
  useEffect(() => {
    if (channel) {
      setFormData(prev => ({
        ...prev,
        name: channel.name,
        description: channel.description || '',
        handle: channel.handle,
        avatarUrl: channel.avatarUrl || '',
        bannerUrl: channel.bannerUrl || ''
      }));
    }
  }, [channel]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        socialLinks: {
          twitter: profile.twitterUrl || '',
          instagram: profile.instagramUrl || '',
          tiktok: profile.tiktokUrl || ''
        }
      }));
    }
  }, [profile]);

  // Update channel mutation
  const updateChannelMutation = useMutation({
    mutationFn: async (data: Partial<Channel>) => {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update channel');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels", channelId] });
    }
  });

  // Update/create profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const method = profile ? 'PUT' : 'POST';
      const url = profile ? `/api/profiles/${channelId}` : '/api/profiles';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, channelId })
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles", channelId] });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update channel data
      await updateChannelMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        handle: formData.handle,
        avatarUrl: formData.avatarUrl,
        bannerUrl: formData.bannerUrl
      });

      // Update profile data
      await updateProfileMutation.mutateAsync({
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        twitterUrl: formData.socialLinks.twitter,
        instagramUrl: formData.socialLinks.instagram,
        tiktokUrl: formData.socialLinks.tiktok
      });

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
        duration: 3000
      });

      onClose?.();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  if (channelLoading || profileLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="profile-editor">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Profile</CardTitle>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            data-testid="button-close-editor"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture & Banner */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={formData.avatarUrl} alt="Profile" />
                <AvatarFallback>
                  {formData.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatarUrl">Profile Picture URL</Label>
                <Input
                  id="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  data-testid="input-avatar-url"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bannerUrl">Banner URL</Label>
              <Input
                id="bannerUrl"
                value={formData.bannerUrl}
                onChange={(e) => handleInputChange('bannerUrl', e.target.value)}
                placeholder="https://example.com/banner.jpg"
                data-testid="input-banner-url"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Channel Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                data-testid="input-channel-name"
              />
            </div>
            <div>
              <Label htmlFor="handle">Handle *</Label>
              <Input
                id="handle"
                value={formData.handle}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                placeholder="@channelname"
                required
                data-testid="input-handle"
              />
            </div>
          </div>

          {/* Description & Bio */}
          <div>
            <Label htmlFor="description">Channel Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="Tell viewers about your channel..."
              data-testid="textarea-description"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              placeholder="Tell people a bit about yourself..."
              data-testid="textarea-bio"
            />
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
                data-testid="input-location"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
                data-testid="input-website"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleSocialChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/username"
                  data-testid="input-twitter"
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleSocialChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/username"
                  data-testid="input-instagram"
                />
              </div>
              <div>
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={formData.socialLinks.tiktok}
                  onChange={(e) => handleSocialChange('tiktok', e.target.value)}
                  placeholder="https://tiktok.com/@username"
                  data-testid="input-tiktok"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={updateChannelMutation.isPending || updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              <Save className="w-4 h-4 mr-2" />
              {(updateChannelMutation.isPending || updateProfileMutation.isPending) ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}