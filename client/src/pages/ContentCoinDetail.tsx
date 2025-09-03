
"use client"

import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Image,
  MessageCircle,
  Share2,
  Heart,
  Copy,
  ExternalLink,
  Eye,
  Hash,
  Clock,
  DollarSign,
  ChevronDown,
  Crown,
  Sparkles,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
// Using Zora SDK via API routes instead of direct contract calls
import TransactionComponent from "@/components/Transaction";
import { ContentPreview } from "@/components/ContentPreview";
import { formatUnits, parseUnits, Address, erc20Abi } from "viem";
import { useState, useMemo } from "react";

// Creator coin related hooks
import { useBuyCreatorCoin, useSellCreatorCoin, useCreatorCoin, useCreatorCoinPrice } from "@/hooks/useCreatorCoins";
import type { CreatorCoin } from "@shared/schema";

// Contract constants for Base Sepolia
const CREATOR_COIN_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

type CommentData = {
  id: string;
  userAddress: string;
  content: string;
  timestamp?: Date;
  ethAmount?: string;
  type?: 'buy' | 'sell' | 'comment';
};

type TradeData = {
  id: string;
  userAddress: string;
  ethAmount: string;
  timestamp?: Date;
  type: 'buy' | 'sell';
};

type HolderData = {
  address: string;
  balance: string;
};

// Utility function to format time ago
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
  const { address } = useAccount();
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [comment, setComment] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<"1H" | "1D" | "1W" | "1M" | "All">("1D");
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [viewMode, setViewMode] = useState<"chart" | "image">("chart");

  // Trading mutations
  const buyMutation = useBuyCreatorCoin();
  const sellMutation = useSellCreatorCoin();

  // Fetch creator coin data using the token address as ID
  const { data: creatorCoin, isLoading: isLoadingCoin } = useCreatorCoin(tokenAddress || '');
  const { data: priceData } = useCreatorCoinPrice(tokenAddress || '');


  // Fetch creator coin data
  const { data: tokenData, isLoading: creatorCoinLoading, error: creatorCoinError } = useQuery({
    queryKey: [`/api/creator-coins/${tokenAddress}`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}`);
      if (!response.ok) throw new Error('Failed to fetch creator coin');
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch comments
  const { data: commentData, isLoading: commentsLoading } = useQuery<CommentData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch trade activity
  const { data: tradesData, isLoading: tradesLoading } = useQuery<TradeData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/trades`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}/trades`);
      if (!response.ok) throw new Error('Failed to fetch trades');
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch holders
  const { data: holdersData, isLoading: holdersLoading } = useQuery<HolderData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/holders`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}/holders`);
      if (!response.ok) throw new Error('Failed to fetch holders');
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Get user token balance
  const { data: tokenBalance } = useReadContract({
    address: tokenData?.address as Address,
    abi: CREATOR_COIN_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address as Address],
    query: {
      enabled: !!(tokenData?.address && address),
    },
  });

  // Process holders data with proper typing
  const processedHolders = useMemo(() => {
    if (!holdersData || !Array.isArray(holdersData)) return [];
    return holdersData.map(holder => ({
      address: holder.address,
      balance: holder.balance
    }));
  }, [holdersData]);

  // Chart data for trading view
  const chartData = useMemo(() => {
    if (!tokenData) return null;
    
    const defaultPrice = tokenData?.currentPrice || tokenData?.price || "0";
    
    return {
      "1H": { points: "M50,150 L100,140 L150,130 L200,120 L250,110 L300,100 L350,90", price: defaultPrice },
      "1D": { points: "M50,160 L100,150 L150,140 L200,125 L250,105 L300,85 L350,65", price: defaultPrice },
      "1W": { points: "M50,170 L100,160 L150,155 L200,135 L250,115 L300,95 L350,75", price: defaultPrice },
      "1M": { points: "M50,180 L100,170 L150,165 L200,145 L250,125 L300,105 L350,85", price: defaultPrice },
      "All": { points: "M50,190 L100,180 L150,175 L200,155 L250,135 L300,115 L350,95", price: defaultPrice },
    };
  }, [tokenData]);

  // Get current chart data safely
  const currentData = chartData?.[selectedPeriod] || chartData?.["1D"] || { points: "M50,160 L350,160", price: "0" };

  const handleAmountSelect = (newAmount: string) => {
    setBuyAmount(newAmount);
  };

  const handleMaxAmount = () => {
    setBuyAmount("0");
  };

  const handleBuy = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive"
      });
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid ETH amount",
        variant: "destructive"
      });
      return;
    }

    if (!tokenData?.id) {
      toast({
        title: "Token not found",
        description: "Unable to find token information",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/creator-coins/${tokenData.id}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerAddress: address,
          ethAmount: buyAmount,
          minTokensOut: '0'
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Buy transaction failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      toast({
        title: "Buy order submitted!",
        description: `Buying ${buyAmount} ETH worth of ${tokenData.symbol} tokens`,
      });

      if (comment.trim()) {
        await buyMutation.mutateAsync({
          coinId: tokenData.id,
          userAddress: address,
          ethAmount: buyAmount,
          comment: comment.trim()
        });
      }

      setBuyAmount("");
      setComment("");

    } catch (error) {
      console.error('Buy failed:', error);

      let errorMessage = "Failed to execute buy order";
      if (error instanceof Error) {
        if (error.message.includes("500")) {
          errorMessage = "Server error occurred. Please try again.";
        } else if (error.message.includes("replacement transaction underpriced")) {
          errorMessage = "Transaction failed due to gas pricing. Please try again with higher gas.";
        } else if (error.message.includes("Pool doesn't exist")) {
          errorMessage = "Trading pool is being created. Please wait a moment and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Transaction failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleSell = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive"
      });
      return;
    }

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid token amount to sell",
        variant: "destructive"
      });
      return;
    }

    if (!tokenData?.id) {
      toast({
        title: "Token not found",
        description: "Unable to find token information",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await sellMutation.mutateAsync({
        coinId: tokenData.id,
        userAddress: address,
        tokenAmount: sellAmount
      });

      toast({
        title: "Sell successful!",
        description: `Sold ${sellAmount} tokens for ${(result as any)?.ethReceived || 'unknown'} ETH`
      });

      setSellAmount("");
    } catch (error) {
      console.error('Sell failed:', error);
      toast({
        title: "Sell failed",
        description: error instanceof Error ? error.message : "Transaction failed",
        variant: "destructive"
      });
    }
  };

  if (creatorCoinLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
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

      {/* Main Content - Card Layout */}
      <div className="flex gap-2 p-6 min-h-[calc(100vh-140px)]">
        {/* Left Side - Chart Area */}
        <Card className="flex-1">
          <CardContent className="p-4">
          {/* Price Display */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{priceData?.price ? `$${priceData.price}` : (tokenData?.currentPrice ? `$${tokenData.currentPrice}` : '$0')}</h1>
              {priceData?.priceChange24h !== undefined && (
                <Badge className={`${priceData.priceChange24h >= 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                  {priceData.priceChange24h >= 0 ? '+' : ''}{priceData.priceChange24h.toFixed(2)}%
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{tokenData?.coinName || tokenData?.name || 'Loading...'} ({tokenData?.coinSymbol || tokenData?.symbol || '...'})</p>
          </div>

          {/* Chart/Image Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={viewMode === "chart" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("chart")}
              className={`${viewMode === "chart" ? "bg-white text-black" : ""}`}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Chart
            </Button>
            <Button
              variant={viewMode === "image" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("image")}
              className={`${viewMode === "image" ? "bg-white text-black" : ""}`}
            >
              <Image className="h-4 w-4 mr-1" />
              Content
            </Button>
          </div>

          {/* Chart/Content Area */}
          <div className="h-80 bg-muted rounded-lg mb-4 relative overflow-hidden">
            {viewMode === "chart" ? (
              chartData && currentData ? (
                <svg className="w-full h-full" viewBox="0 0 400 320">
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <path d={`${currentData.points} L350,300 L50,300 Z`} fill="url(#areaGradient)" />

                  {/* Line */}
                  <path
                    d={currentData.points}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 opacity-50" />
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {tokenData?.mediaCid ? (
                  <ContentPreview
                    mediaCid={tokenData.mediaCid}
                    thumbnailCid={tokenData.thumbnailCid}
                    contentType={tokenData.contentType}
                    title={tokenData.title || tokenData.coinName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No content available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time Period Buttons - Only show when chart is active */}
          {viewMode === "chart" && (
            <div className="flex space-x-2 flex-wrap">
              {(['1H', '1D', '1W', '1M', 'All'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          )}
          </CardContent>
        </Card>

        {/* Right Side - Trading Panel */}
        <Card className="w-96">
          <CardContent className="p-0">
          {/* Market Stats - Always Visible */}
          <div className="p-4 border-b border-border">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Market Cap</span>
                <span className="text-sm font-semibold text-green-400">${priceData?.marketCap || tokenData?.marketCap || tokenData?.startingMarketCap || '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">24H Volume</span>
                <span className="text-sm font-semibold">${priceData?.volume24h || tokenData?.volume24h || '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Creator Earnings</span>
                <span className="text-sm font-semibold">${tokenData?.creatorEarnings || (priceData?.volume24h ? (parseFloat(priceData.volume24h) * 0.02).toFixed(4) : '0')}</span>
              </div>
            </div>
          </div>

          {/* Tabs Container */}
          <Tabs defaultValue="comments" className="flex flex-col">
            <div className="border-b border-border px-4 py-3">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="trading" className="flex items-center gap-1 text-xs">
                  <DollarSign className="h-3 w-3" />
                  Trading
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-1 text-xs">
                  <MessageCircle className="h-3 w-3" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="holders" className="flex items-center gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  Holders
                  <Badge variant="secondary" className="text-xs ml-1">{processedHolders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-1 text-xs">
                  <Activity className="h-3 w-3" />
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="max-h-[500px] overflow-y-auto">
              {/* Trading Tab Content */}
              <TabsContent value="trading" className="p-4 space-y-0">
                <div className="space-y-4">
                  {/* Buy/Sell Toggle */}
                  <div className="flex space-x-2">
                    <Button
                      className={`flex-1 ${tradeMode === "buy" ? "bg-green-500 hover:bg-green-600" : "bg-gray-700 hover:bg-gray-600"}`}
                      onClick={() => setTradeMode("buy")}
                    >
                      Buy
                    </Button>
                    <Button
                      className={`flex-1 ${tradeMode === "sell" ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}
                      onClick={() => setTradeMode("sell")}
                    >
                      Sell
                    </Button>
                  </div>

                  {/* Balance Display */}
                  <div className="text-center text-sm text-muted-foreground">
                    Balance {tokenBalance ? formatUnits(tokenBalance, 18) : '0'} ETH
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="0.000111"
                      step="0.000001"
                      min="0"
                      className="bg-input border-input"
                    />
                    <div className="flex justify-end text-xs text-muted-foreground">
                      ETH
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAmountSelect("0.001")}
                      className="text-xs"
                    >
                      0.001 ETH
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAmountSelect("0.01")}
                      className="text-xs"
                    >
                      0.01 ETH
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAmountSelect("0.1")}
                      className="text-xs"
                    >
                      0.1 ETH
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMaxAmount}
                      className="text-xs"
                    >
                      Max
                    </Button>
                  </div>

                  {/* Comment Input */}
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white resize-none h-20"
                  />

                  {/* Trade Button */}
                  <Button
                    className={`w-full ${tradeMode === "buy" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                    onClick={tradeMode === "buy" ? handleBuy : handleSell}
                    disabled={buyMutation.isPending || !address || !buyAmount || parseFloat(buyAmount) <= 0}
                  >
                    {buyMutation.isPending ? 'Processing...' :
                     !address ? 'Connect Wallet' :
                     !buyAmount ? 'Enter Amount' :
                     `${tradeMode === "buy" ? "Buy" : "Sell"}`}
                  </Button>
                </div>
              </TabsContent>

              {/* Comments Tab Content */}
              <TabsContent value="comments" className="p-4 space-y-0">
                {commentData && Array.isArray(commentData) && commentData.length > 0 ? (
                  <div className="space-y-3">
                    {commentData.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.userAddress || 'default'}`} />
                          <AvatarFallback>{comment.userAddress?.slice(2, 4) || 'XX'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {comment.userAddress ? 
                                `${comment.userAddress.slice(0, 6)}...${comment.userAddress.slice(-4)}` : 
                                'Anonymous'
                              }
                            </span>
                            <span className="text-xs text-gray-400">
                              {comment.timestamp && formatTimeAgo(new Date(comment.timestamp))}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="holders" className="p-4 space-y-0">
                {processedHolders && processedHolders.length > 0 ? (
                  <div className="space-y-3">
                    {processedHolders.map((holder, index) => (
                      <div key={holder.address || index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${holder.address || 'default'}`} />
                            <AvatarFallback>{holder.address?.slice(2, 4) || 'XX'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-mono">
                            {holder.address ? 
                              `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}` : 
                              'Unknown'
                            }
                          </span>
                        </div>
                        <span className="text-sm">{holder.balance || '0'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No holders yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="p-4 space-y-0">
                {tradesData && Array.isArray(tradesData) && tradesData.length > 0 ? (
                  <div className="space-y-3">
                    {tradesData.map((trade) => (
                      <div key={trade.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${trade.type === 'buy' ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="text-sm font-mono">
                            {trade.userAddress ? 
                              `${trade.userAddress.slice(0, 6)}...${trade.userAddress.slice(-4)}` : 
                              'Unknown'
                            }
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{trade.ethAmount || '0'} ETH</div>
                          <div className="text-xs text-gray-400">
                            {trade.timestamp && formatTimeAgo(new Date(trade.timestamp))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="p-4 space-y-0">
                <div className="text-center text-gray-400 py-8">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Details coming soon</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
