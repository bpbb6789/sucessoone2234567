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
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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
  ChevronDown,
  Crown,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
// Using Zora SDK via API routes instead of direct contract calls
import TransactionComponent from "@/components/Transaction";
import { formatUnits, parseUnits, Address, erc20Abi } from "viem";
import { useState, useMemo } from "react";

// Creator coin related hooks
import { useBuyCreatorCoin, useSellCreatorCoin, type CreatorCoin } from "@/hooks/useCreatorCoins";

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
  // Extract address from network:address format (e.g., "base:0x123..." -> "0x123...")
  const tokenAddress = params.address;
  const { address } = useAccount();
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [comment, setComment] = useState("");
  const [currentView, setCurrentView] = useState<"image" | "chart">("chart");
  const [selectedPeriod, setSelectedPeriod] = useState<"1H" | "1D" | "1W" | "1M" | "All">("1D");
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");

  const handleAmountSelect = (newAmount: string) => {
    setBuyAmount(newAmount);
  };

  const handleMaxAmount = () => {
    setBuyAmount("0"); // Would calculate max based on balance
  };

  // Trading mutations
  const buyMutation = useBuyCreatorCoin();
  const sellMutation = useSellCreatorCoin();

  // Direct contract interaction for onchain trading
  const {
    data: hash,
    error: writeError,
    writeContract
  } = useWriteContract();

  const { 
    isLoading: isTxConfirming, 
    isSuccess: isTxSuccess,
    error: txError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  const isWritePending = false; // writeContract pending state

  // Fetch creator coin data
  const { data: tokenData, isLoading: creatorCoinLoading, error: creatorCoinError } = useQuery({
    queryKey: [`/api/creator-coins/${tokenAddress}`],
    enabled: !!tokenAddress,
  });

  // Fetch comments
  const { data: commentData, isLoading: commentsLoading } = useQuery<CommentData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/comments`],
    enabled: !!tokenAddress,
  });

  // Fetch trade activity
  const { data: tradesData, isLoading: tradesLoading } = useQuery<TradeData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/trades`],
    enabled: !!tokenAddress,
  });

  // Fetch holders
  const { data: holdersData, isLoading: holdersLoading } = useQuery<HolderData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/holders`],
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
      // Use the proper API endpoint for buying creator coins
      const response = await fetch(`/api/creator-coins/${tokenData.id}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerAddress: address,
          ethAmount: buyAmount,
          minTokensOut: '0' // No minimum for now
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Buy transaction failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If response isn't JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      toast({
        title: "Buy order submitted!",
        description: `Buying ${buyAmount} ETH worth of ${tokenData.symbol} tokens`,
      });

      // Record the trade comment if provided
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
        // Parse the error message to provide more specific feedback
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

  // Only show loading spinner for the main coin data - secondary data loads independently
  if (creatorCoinLoading) {
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

  // Chart data for trading view - defined after tokenData is available
  const chartData = {
    "1H": { points: "M50,150 L100,140 L150,130 L200,120 L250,110 L300,100 L350,90", price: tokenData.price || "$0" },
    "1D": { points: "M50,160 L100,150 L150,140 L200,125 L250,105 L300,85 L350,65", price: tokenData.price || "$0" },
    "1W": { points: "M50,170 L100,160 L150,155 L200,135 L250,115 L300,95 L350,75", price: tokenData.price || "$0" },
    "1M": { points: "M50,180 L100,170 L150,165 L200,145 L250,125 L300,105 L350,85", price: tokenData.price || "$0" },
    All: { points: "M50,190 L100,180 L150,175 L200,155 L250,135 L300,115 L350,95", price: tokenData.price || "$0" },
  };

  const currentData = chartData[selectedPeriod];

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

      {/* Modern Trading Interface Layout */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6 min-h-[600px]">
          {/* Left Side - Chart and Media */}
          <div className="flex-1">
            <div className="h-64 bg-gray-800 rounded-lg mb-6 relative overflow-hidden border border-gray-700">
              {currentView === "chart" ? (
                <>
                  <svg className="w-full h-full" viewBox="0 0 400 220">
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path d={`${currentData.points} L350,200 L50,200 Z`} fill="url(#areaGradient)" />

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

                  <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-semibold border shadow-sm">
                    {currentData.price}
                    <span className="text-green-600 ml-2 text-xs">+48%</span>
                  </div>
                </>
              ) : tokenData.contentType === 'video' && tokenData.videoUrl ? (
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
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <Button
                  variant={selectedPeriod === "1H" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPeriod("1H")}
                >
                  1H
                </Button>
                <Button
                  variant={selectedPeriod === "1D" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPeriod("1D")}
                >
                  1D
                </Button>
                <Button
                  variant={selectedPeriod === "1W" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPeriod("1W")}
                >
                  1W
                </Button>
                <Button
                  variant={selectedPeriod === "1M" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPeriod("1M")}
                >
                  1M
                </Button>
                <Button
                  variant={selectedPeriod === "All" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPeriod("All")}
                >
                  All
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={currentView === "chart" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("chart")}
                >
                  Chart
                </Button>
                <Button
                  variant={currentView === "image" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("image")}
                >
                  Media
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side - Trading Panel */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            {/* Token Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${tokenData.creator || 'default'}`} />
                  <AvatarFallback>{tokenData.creator?.slice(2, 4) || 'UN'}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-lg">{tokenData.name}</h2>
                  <p className="text-sm text-muted-foreground">{tokenData.symbol}</p>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-2xl font-bold">{currentData.price}</div>
                <div className="text-green-600 text-sm">+48% (24h)</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <div className="text-muted-foreground">Market Cap</div>
                  <div className="font-semibold">${tokenData.marketCap}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Volume 24h</div>
                  <div className="font-semibold">${tokenData.volume24h}</div>
                </div>
              </div>
            </div>

            {/* Buy/Sell Toggle */}
            <div className="flex bg-muted rounded-lg p-1 mb-4">
              <Button
                variant={tradeMode === "buy" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setTradeMode("buy")}
              >
                Buy
              </Button>
              <Button
                variant={tradeMode === "sell" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setTradeMode("sell")}
              >
                Sell
              </Button>
            </div>

            {/* Amount Input */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.000111"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-sm font-medium">ETH</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>

              <div className="flex gap-2">
                {["0.001", "0.01", "0.1", "Max"].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAmountSelect(amount)}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Comment Input */}
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none mb-4"
              rows={3}
            />

            {/* Trade Button */}
            <Button
              className={cn(
                "w-full font-semibold py-6 text-lg",
                tradeMode === "buy" 
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              )}
              onClick={tradeMode === "buy" ? handleBuy : handleSell}
              disabled={isWritePending || isTxConfirming || !address || !buyAmount || parseFloat(buyAmount) <= 0}
            >
              {isWritePending ? 'Signing...' : 
               isTxConfirming ? 'Confirming...' :
               !address ? 'Connect Wallet' :
               !buyAmount ? 'Enter Amount' :
               `${tradeMode === "buy" ? "Buy" : "Sell"} ${buyAmount} ETH worth`}
            </Button>

            {/* Token Tabs */}
            <div className="mt-6">
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 mb-4">
                <Button variant="ghost" size="sm" className="gap-2 bg-background shadow-sm">
                  <MessageCircle className="h-4 w-4" />
                  Comments
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Crown className="h-4 w-4" />
                  Holders
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{processedHolders.length}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Activity
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  Details
                </Button>
              </div>

              {/* Comments Section */}
              <div className="max-h-64 overflow-y-auto">
                {commentData && commentData.length > 0 ? (
                  <div className="space-y-3">
                    {commentData.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.userAddress}`} />
                          <AvatarFallback>{comment.userAddress.slice(2, 4)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {comment.userAddress.slice(0, 6)}...{comment.userAddress.slice(-4)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {comment.timestamp && formatTimeAgo(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}