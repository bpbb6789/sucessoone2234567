import React, { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAccount, useReadContract } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { 
  Play,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  MessageCircle,
  Share2,
  Heart,
  Copy,
  ExternalLink,
  Eye,
  Hash,
  Clock,
  DollarSign,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PUMP_FUN_ADDRESS } from "@/lib/addresses";
import { PUMP_FUN_ABI } from "../../../abi/PumpFunAbi";
import TransactionComponent from "@/components/Transaction";
import { formatUnits, parseUnits, Address, erc20Abi } from "viem";
import { useGetAllSales } from "@/hooks/useGetAllSales";
import { useCreatorCoin } from "@/hooks/useCreatorCoins";

interface ContentCoinData {
  id: string;
  name: string;
  symbol: string;
  description: string;
  address: string;
  creator: string;
  price: string;
  marketCap: string;
  volume24h: string;
  holders: number;
  change24h?: number;
  createdAt: Date;
  isOnBondingCurve?: boolean;
  progress?: number;
  bondingCurveAddress?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  contentType: 'image' | 'video' | 'audio' | 'text';
  creatorEarnings?: string;
}

interface Comment {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  avatar?: string;
}

interface Holder {
  address: string;
  balance: string;
  percentage: number;
}

interface ActivityItem {
  id: string;
  type: 'buy' | 'sell' | 'comment' | 'like';
  user: string;
  amount?: string;
  price?: string;
  timestamp: Date;
}

export default function ContentCoinDetail() {
  const params = useParams();
  // Extract address from network:address format (e.g., "base:0x123..." -> "0x123...")
  const tokenAddress = params.address;
  const { address } = useAccount();
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [comment, setComment] = useState("");

  // Try to get content coin data first (from creator coins API)
  const { data: creatorCoin, isLoading: creatorCoinLoading } = useCreatorCoin(tokenAddress || '');
  
  // Get token data from GraphQL as fallback
  const { data: salesData, loading: salesLoading } = useGetAllSales();

  const tokenData = React.useMemo(() => {
    // First, try to use creator coin data if available
    if (creatorCoin) {
      return {
        id: creatorCoin.memeTokenAddress || creatorCoin.id,
        address: creatorCoin.memeTokenAddress || creatorCoin.id,
        name: creatorCoin.title || creatorCoin.coinName,
        symbol: creatorCoin.coinSymbol,
        description: creatorCoin.description || `${creatorCoin.coinName} content coin`,
        creator: creatorCoin.creatorAddress,
        price: creatorCoin.currentPrice || '0.001',
        marketCap: '1870',
        volume24h: '2.30', 
        holders: 42,
        change24h: 15.3,
        createdAt: new Date(creatorCoin.createdAt),
        isOnBondingCurve: creatorCoin.status === 'deployed',
        progress: creatorCoin.status === 'deployed' ? 100 : 56,
        bondingCurveAddress: creatorCoin.memeTokenAddress,
        imageUrl: `https://gateway.pinata.cloud/ipfs/${creatorCoin.mediaCid}`,
        contentType: creatorCoin.contentType as 'image' | 'video' | 'audio' | 'text',
        creatorEarnings: '0.02'
      } as ContentCoinData;
    }

    // Fallback to GraphQL sales data
    if (!salesData || !Array.isArray(salesData) || !tokenAddress) return null;

    const token = salesData.find((t: any) => 
      t.memeTokenAddress?.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!token) return null;

    return {
      id: token.memeTokenAddress,
      address: token.memeTokenAddress,
      name: token.name || token.symbol || 'Unknown Token',
      symbol: token.symbol || 'UNKNOWN',
      description: token.bio || token.description || 'Created via pump.fun mechanics',
      creator: token.createdBy || 'No Creator Found',
      price: '0.00187076',
      marketCap: '1870',
      volume24h: '2.30',
      holders: 42,
      change24h: 15.3,
      createdAt: new Date(token.createdAt || token.blockTimestamp || Date.now()),
      isOnBondingCurve: true,
      progress: 56,
      bondingCurveAddress: token.bondingCurve,
      imageUrl: token.imageUri || '/placeholder-content.png',
      contentType: 'image' as const,
      creatorEarnings: '0.02'
    } as ContentCoinData;
  }, [creatorCoin, salesData, tokenAddress]);

  // Mock data for comments, holders, and activity
  const [comments] = useState<Comment[]>([
    {
      id: '1',
      user: 'cryptowhale',
      message: 'This is going to the moon! 🚀',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      avatar: '/placeholder-avatar.png'
    },
    {
      id: '2',
      user: 'diamondhands',
      message: 'Just bought more, love this project',
      timestamp: new Date(Date.now() - 15 * 60 * 1000)
    }
  ]);

  const [holders] = useState<Holder[]>([
    { address: '0x742d35Cc6ab6C', balance: '1,234,567', percentage: 12.3 },
    { address: '0x8f3b2c1e9d7a5', balance: '987,654', percentage: 9.8 },
    { address: '0x5a9c8e2f1b4d7', balance: '765,432', percentage: 7.6 }
  ]);

  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'buy',
      user: '0x742d35Cc6ab6C',
      amount: '0.1',
      price: '$0.00187',
      timestamp: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
      id: '2',
      type: 'sell',
      user: '0x8f3b2c1e9d7a5',
      amount: '0.05',
      price: '$0.00185',
      timestamp: new Date(Date.now() - 20 * 60 * 1000)
    }
  ]);

  // Get user's token balance
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as Address],
    query: {
      enabled: !!address && !!tokenAddress
    }
  });

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    // TODO: Implement comment functionality
    setComment("");
    toast({
      title: "Comment posted",
      description: "Your comment has been added",
    });
  };

  if (creatorCoinLoading || salesLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <Link to="/contentcoin">
            <Button>Back to Content Coins</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <Link to="/contentcoin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Side - Media */}
        <div className="flex-1 lg:max-w-2xl">
          <div className="relative aspect-square lg:aspect-video bg-black">
            {tokenData.contentType === 'video' && tokenData.videoUrl ? (
              <video
                src={tokenData.videoUrl}
                className="w-full h-full object-cover"
                controls
                poster={tokenData.imageUrl}
              />
            ) : tokenData.contentType === 'audio' && tokenData.audioUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
                <audio src={tokenData.audioUrl} controls className="w-4/5" />
              </div>
            ) : (
              <img
                src={tokenData.imageUrl}
                alt={tokenData.name}
                className="w-full h-full object-cover"
              />
            )}
            {tokenData.contentType === 'video' && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-black/70 text-white">
                  <Play className="w-3 h-3 mr-1" />
                  Video
                </Badge>
              </div>
            )}
          </div>

          {/* Mobile Trading Interface */}
          <div className="lg:hidden p-4 border-b border-gray-800">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400">Market Cap</p>
                  <p className="text-green-400 font-bold">${tokenData.marketCap}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">24H Volume</p>
                  <p className="font-bold">${tokenData.volume24h}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Creator Earnings</p>
                  <p className="font-bold">${tokenData.creatorEarnings}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold">
                  Buy
                </Button>
                <Button variant="outline" className="flex-1">
                  Sell
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Token Info & Trading */}
        <div className="flex-1 lg:max-w-md lg:border-l border-gray-800">
          {/* Token Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${tokenData.creator}`} />
                <AvatarFallback>{tokenData.creator.slice(2, 4)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-gray-400">
                  {tokenData.creator !== 'No Creator Found' 
                    ? `${tokenData.creator.slice(0, 6)}...${tokenData.creator.slice(-4)}`
                    : 'No Creator Found'
                  }
                </p>
                <p className="text-xs text-gray-500">{formatTimeAgo(tokenData.createdAt)}</p>
              </div>
            </div>
            <h1 className="text-xl font-bold mb-2">{tokenData.name}</h1>

            {/* Stats Row - Desktop */}
            <div className="hidden lg:grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-xs text-gray-400">Market Cap</p>
                <p className="text-green-400 font-bold">${tokenData.marketCap}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">24H Volume</p>
                <p className="font-bold">${tokenData.volume24h}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Creator Earnings</p>
                <p className="font-bold">${tokenData.creatorEarnings}</p>
              </div>
            </div>

            {/* Balance */}
            <div className="text-right">
              <p className="text-xs text-gray-400">Balance</p>
              <p className="font-bold">
                {tokenBalance ? formatUnits(tokenBalance, 18) : '0'} ETH
              </p>
            </div>
          </div>

          {/* Trading Interface */}
          <div className="hidden lg:block p-4 border-b border-gray-800">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.000111"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="pr-16 bg-gray-800 border-gray-700"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-sm">ETH</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    ▼
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                {['0.001 ETH', '0.01 ETH', '0.1 ETH', 'Max'].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      if (amount !== 'Max') {
                        setBuyAmount(amount.split(' ')[0]);
                      }
                    }}
                  >
                    {amount}
                  </Button>
                ))}
              </div>

              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-gray-800 border-gray-700 resize-none"
                rows={2}
              />

              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold h-12"
                onClick={() => {
                  // TODO: Implement buy with comment
                  handleComment();
                }}
              >
                Buy
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="comments" className="flex-1">
            <TabsList className="w-full bg-gray-800 p-1">
              <TabsTrigger value="comments" className="flex-1 text-xs">
                Comments
              </TabsTrigger>
              <TabsTrigger value="holders" className="flex-1 text-xs">
                Holders {holders.length}
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 text-xs">
                Activity
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1 text-xs">
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="p-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.avatar} />
                    <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{comment.user}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(comment.timestamp)}</p>
                    </div>
                    <p className="text-sm">{comment.message}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="holders" className="p-4 space-y-3">
              {holders.map((holder, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${holder.address}`} />
                      <AvatarFallback>{index + 1}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                      </p>
                      <p className="text-xs text-gray-400">{holder.percentage}%</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{holder.balance}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="activity" className="p-4 space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      activity.type === 'buy' ? "bg-green-500 text-black" : "bg-red-500 text-white"
                    )}>
                      {activity.type === 'buy' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.user.slice(0, 6)}...{activity.user.slice(-4)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {activity.type} {activity.amount} ETH at {activity.price}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="details" className="p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm">{tokenData.description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Contract Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                      {tokenData.address.slice(0, 10)}...{tokenData.address.slice(-4)}
                    </code>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Creator</p>
                  <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                    {tokenData.creator !== 'No Creator Found' 
                      ? `${tokenData.creator.slice(0, 10)}...${tokenData.creator.slice(-4)}`
                      : 'No Creator Found'
                    }
                  </code>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Created</p>
                  <p className="text-sm">{tokenData.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}