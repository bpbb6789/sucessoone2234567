"use client";

import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
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
  DollarSign,
  Loader2,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentPreview } from "@/components/ContentPreview";
import { TokenTrading } from "@/components/TokenTrading";
import { Address } from "viem";
import { useState, useMemo } from "react";
import { useAccount, useWalletClient } from "wagmi";

type HolderData = {
  address: string;
  balance: string;
  percentage?: number;
};

type TradeData = {
  id: string;
  userAddress: string;
  ethAmount: string;
  tokenAmount: string;
  timestamp: Date;
  type: "buy" | "sell";
  pricePerToken: string;
};

type CommentData = {
  id: string;
  userAddress: string;
  content: string;
  timestamp: Date;
  ethAmount?: string;
  type?: "buy" | "sell" | "comment";
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export default function ContentCoinDetail() {
  const params = useParams();
  const tokenAddress = params.address;
  const { toast } = useToast();
  const { isConnected, address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  const [selectedPeriod, setSelectedPeriod] = useState<"1H" | "1D" | "1W" | "1M">("1D");
  const [newComment, setNewComment] = useState("");

  // Fetch creator coin data
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: [`/api/creator-coins/${tokenAddress}`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}`);
      if (!response.ok) throw new Error("Failed to fetch creator coin");
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch real-time price data from DexScreener
  const { data: priceData, refetch: refetchPrice } = useQuery({
    queryKey: [`/api/dexscreener/${tokenAddress}`],
    queryFn: async () => {
      const response = await fetch(`/api/dexscreener/${tokenAddress}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    },
    enabled: !!tokenData?.coinAddress,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch holders data
  const { data: holdersData, isLoading: holdersLoading } = useQuery<HolderData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/holders`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}/holders`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch trade activity
  const { data: tradesData, isLoading: tradesLoading } = useQuery<TradeData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/trades`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}/trades`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery<CommentData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}/comments`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText,
          userAddress: userAddress,
        }),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/creator-coins/${tokenAddress}/comments`] });
      toast({ title: "Comment added!", description: "Your comment has been posted." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim() || !isConnected) return;
    addCommentMutation.mutate(newComment);
  };

  const handleCopyAddress = () => {
    if (tokenData?.coinAddress) {
      navigator.clipboard.writeText(tokenData.coinAddress);
      toast({ title: "Copied!", description: "Contract address copied to clipboard" });
    }
  };

  // Calculate current stats
  const currentPrice = useMemo(() => {
    if (priceData?.price) return parseFloat(priceData.price).toFixed(8);
    if (tokenData?.currentPrice) return parseFloat(tokenData.currentPrice).toFixed(8);
    return "0.00000000";
  }, [priceData, tokenData]);

  const marketCap = useMemo(() => {
    if (priceData?.marketCap) return priceData.marketCap;
    if (tokenData?.marketCap) return tokenData.marketCap;
    return "0";
  }, [priceData, tokenData]);

  const priceChange24h = useMemo(() => {
    return priceData?.priceChange24h || 0;
  }, [priceData]);

  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (tokenError || !tokenData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Content Coin Not Found</h1>
          <Link to="/contentcoin">
            <Button>Back to Content Coins</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/contentcoin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 p-6 min-h-[calc(100vh-140px)]">
        {/* Left Side - Content & Chart */}
        <div className="flex-1 space-y-6">
          {/* Price Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    ${currentPrice}
                    {priceChange24h !== 0 && (
                      <Badge
                        className={cn(
                          priceChange24h >= 0 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        )}
                      >
                        {priceChange24h >= 0 ? "+" : ""}{priceChange24h.toFixed(2)}%
                      </Badge>
                    )}
                    {priceData?.price && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Live
                      </Badge>
                    )}
                  </h1>
                  <p className="text-muted-foreground">
                    {tokenData.coinName} ({tokenData.coinSymbol})
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Market Cap</div>
                  <div className="text-xl font-semibold">${parseFloat(marketCap).toLocaleString()}</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{holdersData?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Holders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{tradesData?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Trades 24h</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {tokenData.totalSupply ? (parseInt(tokenData.totalSupply) / 1e6).toFixed(1) + "M" : "1000M"}
                  </div>
                  <div className="text-sm text-muted-foreground">Supply</div>
                </div>
              </div>

              {/* External Links */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://sepolia.basescan.org/token/${tokenData.coinAddress}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Basescan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://dexscreener.com/base-sepolia/${tokenData.coinAddress}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  DEX Screener
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Tokenized Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                {tokenData.mediaCid ? (
                  <ContentPreview
                    mediaCid={tokenData.mediaCid}
                    thumbnailCid={tokenData.thumbnailCid}
                    contentType={tokenData.contentType}
                    title={tokenData.title || tokenData.coinName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <Coins className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>No content preview available</p>
                    </div>
                  </div>
                )}
              </div>
              {tokenData.description && (
                <p className="text-sm text-muted-foreground">{tokenData.description}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Trading Panel */}
        <div className="w-96">
          <Card className="h-fit">
            <Tabs defaultValue="trade" className="w-full">
              <div className="border-b border-border px-4 py-3">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="trade" className="flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    Trade
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="flex items-center gap-1 text-xs">
                    <MessageCircle className="h-3 w-3" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="holders" className="flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    Holders
                    <Badge variant="secondary" className="text-xs ml-1">
                      {holdersData?.length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-1 text-xs">
                    <Activity className="h-3 w-3" />
                    Activity
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {/* Trading Tab */}
                <TabsContent value="trade" className="p-0">
                  {tokenData.coinAddress ? (
                    <div className="p-4">
                      <TokenTrading
                        tokenAddress={tokenData.coinAddress as Address}
                        tokenName={tokenData.coinName || tokenData.name || "Token"}
                        tokenSymbol={tokenData.coinSymbol || tokenData.symbol || "TOKEN"}
                        currentPrice={currentPrice}
                        supply={tokenData.totalSupply || "1000000000"}
                        marketCap={marketCap}
                        holders={holdersData?.length || 0}
                      />
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg mb-3">
                        <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                          ⚠️ Token not yet deployed
                        </p>
                      </div>
                      <p>This content coin needs to be deployed before trading</p>
                    </div>
                  )}
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="p-4 space-y-4">
                  {/* Add Comment */}
                  {isConnected && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <Button 
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        size="sm"
                        className="w-full"
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Post Comment"
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3">
                    {commentsData && commentsData.length > 0 ? (
                      commentsData.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.userAddress}`}
                            />
                            <AvatarFallback>
                              {comment.userAddress?.slice(2, 4) || "XX"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {comment.userAddress?.slice(0, 6)}...{comment.userAddress?.slice(-4)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(comment.timestamp)}
                              </span>
                              {comment.type && comment.type !== 'comment' && (
                                <Badge 
                                  variant={comment.type === 'buy' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {comment.type.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{comment.content}</p>
                            {comment.ethAmount && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {comment.ethAmount} ETH
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No comments yet</p>
                        <p className="text-xs">Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Holders Tab */}
                <TabsContent value="holders" className="p-4 space-y-3">
                  {holdersData && holdersData.length > 0 ? (
                    holdersData.map((holder, index) => (
                      <div key={holder.address || index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${holder.address}`}
                            />
                            <AvatarFallback>
                              {holder.address?.slice(2, 4) || "XX"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-mono">
                            {holder.address?.slice(0, 6)}...{holder.address?.slice(-4)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{holder.balance}</div>
                          {holder.percentage && (
                            <div className="text-xs text-muted-foreground">{holder.percentage.toFixed(2)}%</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No holders yet</p>
                    </div>
                  )}
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="p-4 space-y-3">
                  {tradesData && tradesData.length > 0 ? (
                    tradesData.map((trade) => (
                      <div key={trade.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            trade.type === "buy" ? "bg-green-400" : "bg-red-400"
                          )} />
                          <span className="text-sm font-mono">
                            {trade.userAddress?.slice(0, 6)}...{trade.userAddress?.slice(-4)}
                          </span>
                          <Badge variant={trade.type === "buy" ? "default" : "destructive"} className="text-xs">
                            {trade.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{trade.ethAmount} ETH</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(trade.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No activity yet</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}