
import React from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Coins, 
  Activity, 
  Calendar,
  ExternalLink,
  Twitter,
  Globe,
  Copy,
  CheckCircle
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';

interface CreatorProfile {
  address: string;
  name: string;
  avatar: string;
  bio?: string;
  isVerified: boolean;
  memberSince: string;
  
  // Stats
  totalEarnings: string;
  totalMarketCap: string;
  coinsCreated: number;
  totalHolders: number;
  
  // Social
  socialLinks: {
    x?: string;
    website?: string;
    farcaster?: boolean;
  };
  
  // Recent activity
  recentCoins: Array<{
    id: string;
    name: string;
    symbol: string;
    marketCap: string;
    price: string;
    change24h: number;
    createdAt: string;
  }>;
}

const CreatorProfile: React.FC = () => {
  const params = useParams();
  const creatorAddress = params.address as string;
  const [copied, setCopied] = React.useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['creator-profile', creatorAddress],
    queryFn: async () => {
      const response = await fetch(`/api/creators/${creatorAddress}/profile`);
      if (!response.ok) throw new Error('Failed to fetch creator profile');
      return response.json() as CreatorProfile;
    },
    enabled: !!creatorAddress
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(creatorAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="w-full h-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
        <Link to="/leaderboard">
          <Button>← Back to Leaderboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <img 
                src={profile.avatar} 
                alt={profile.name}
                className="w-20 h-20 rounded-full border-4 border-background"
              />
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  {profile.isVerified && (
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  )}
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <span className="font-mono text-sm">{creatorAddress}</span>
                  <Button variant="ghost" size="sm" onClick={copyAddress}>
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(profile.memberSince).toLocaleDateString()}</span>
                  </div>
                </div>
                {profile.bio && (
                  <p className="mt-2 text-muted-foreground">{profile.bio}</p>
                )}
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-2">
              {profile.socialLinks.website && (
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </Button>
              )}
              {profile.socialLinks.x && (
                <Button variant="outline" size="sm">
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">${profile.totalEarnings}</div>
            <div className="text-sm text-muted-foreground">Total Earnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">${profile.totalMarketCap}</div>
            <div className="text-sm text-muted-foreground">Market Cap</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{profile.coinsCreated}</div>
            <div className="text-sm text-muted-foreground">Coins Created</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{profile.totalHolders}</div>
            <div className="text-sm text-muted-foreground">Total Holders</div>
          </CardContent>
        </Card>
      </div>

      {/* Creator's Coins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Created Coins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.recentCoins.length > 0 ? (
            <div className="space-y-3">
              {profile.recentCoins.map((coin) => (
                <div key={coin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold">{coin.name}</div>
                      <div className="text-sm text-muted-foreground">{coin.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${coin.marketCap}</div>
                    <div className="text-sm text-muted-foreground">${coin.price}</div>
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {coin.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-medium">{Math.abs(coin.change24h).toFixed(1)}%</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(coin.createdAt).toLocaleDateString()}
                  </div>
                  <Link to={`/content-coin/${coin.id}`}>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No coins created yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorProfile;
