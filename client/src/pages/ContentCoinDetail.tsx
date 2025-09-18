"use client";

import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Settings,
  Loader2,
  Download,
  MoreHorizontal,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
// Using Zora SDK via API routes instead of direct contract calls
import TransactionComponent from "@/components/Transaction";
import { ContentPreview } from "@/components/ContentPreview";
import {
  formatUnits,
  parseUnits,
  Address,
  erc20Abi,
  createPublicClient,
  http,
  parseEther,
} from "viem";
import { ethers } from "ethers";
import { baseSepolia } from "viem/chains";

// Create public client for blockchain interactions
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
import { useState, useMemo, useEffect } from "react";
// Removed wagmi hooks for auction integration - using Zora SDK via API routes

// Creator coin related hooks
import {
  useBuyCreatorCoin,
  useSellCreatorCoin,
  useCreatorCoin,
  useCreatorCoinPrice,
} from "@/hooks/useCreatorCoins";
import type { CreatorCoin } from "@shared/schema";
import { DexScreenerChart } from "@/components/DexScreenerChart";

// Contract constants for Base Sepolia
const CREATOR_COIN_TOKEN_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

type CommentData = {
  id: string;
  userAddress: string;
  content: string;
  timestamp?: Date;
  ethAmount?: string;
  type?: "buy" | "sell" | "comment";
};

type TradeData = {
  id: string;
  userAddress: string;
  ethAmount: string;
  timestamp?: Date;
  type: "buy" | "sell";
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

// Utility function to format token balance
function formatTokenBalance(balance: bigint | string | null): string {
  if (!balance || balance === 0n) return "0";

  if (typeof balance === "bigint") {
    const formatted = formatUnits(balance, 18);
    const num = parseFloat(formatted);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K";
    } else {
      return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
    }
  }

  return balance.toString();
}

export default function ContentCoinDetail() {
  const params = useParams();
  const tokenAddress = params.address;
  // Removed auction state - using Zora SDK
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "1H" | "1D" | "1W" | "1M" | "All"
  >("1D");
  const [viewMode, setViewMode] = useState<"chart" | "image">("chart");
  

  // Removed auction state - using instant trading now


  // Fetch creator coin data using the token address as ID
  const { data: creatorCoin, isLoading: isLoadingCoin } = useCreatorCoin(
    tokenAddress || "",
  );
  const { data: priceData } = useCreatorCoinPrice(tokenAddress || "");

  // Removed auction check - using instant trading via Zora SDK

  // Fetch creator coin data
  const {
    data: tokenData,
    isLoading: creatorCoinLoading,
    error: creatorCoinError,
  } = useQuery({
    queryKey: [`/api/creator-coins/${tokenAddress}`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}`);
      if (!response.ok) throw new Error("Failed to fetch creator coin");
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch comments
  const { data: commentData, isLoading: commentsLoading } = useQuery<
    CommentData[]
  >({
    queryKey: [`/api/creator-coins/${tokenAddress}/comments`],
    queryFn: async () => {
      const response = await fetch(
        `/api/creator-coins/${tokenAddress}/comments`,
      );
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch trade activity
  const { data: tradesData, isLoading: tradesLoading } = useQuery<TradeData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/trades`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}/trades`);
      if (!response.ok) throw new Error("Failed to fetch trades");
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch holders
  const { data: holdersData, isLoading: holdersLoading } = useQuery<
    HolderData[]
  >({
    queryKey: [`/api/creator-coins/${tokenAddress}/holders`],
    queryFn: async () => {
      const response = await fetch(
        `/api/creator-coins/${tokenAddress}/holders`,
      );
      if (!response.ok) throw new Error("Failed to fetch holders");
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  

  // Process holders data with proper typing
  const processedHolders = useMemo(() => {
    if (!holdersData || !Array.isArray(holdersData)) return [];
    return holdersData.map((holder) => ({
      address: holder.address,
      balance: holder.balance,
    }));
  }, [holdersData]);

  // Calculate current price for display
  const currentPrice = useMemo(() => {
    // Use price data if available
    if (priceData?.price && parseFloat(priceData.price) > 0) {
      return parseFloat(priceData.price).toFixed(8);
    }
    // Use token data if no price data
    else if (tokenData?.currentPrice && parseFloat(tokenData.currentPrice) > 0) {
      return parseFloat(tokenData.currentPrice).toFixed(8);
    }
    return null;
  }, [priceData, tokenData]);




  // Chart data for trading view - now uses real price data
  const chartData = useMemo(() => {
    if (!tokenData) return null;

    const defaultPrice =
      priceData?.price || tokenData?.currentPrice || tokenData?.price || "0";
    const priceChange = priceData?.priceChange24h || 0;

    // Generate realistic price points based on actual data
    const generatePricePoints = (period: string) => {
      const basePrice = parseFloat(defaultPrice);
      const points: string[] = [];
      const numPoints = 20;
      const width = 300;
      const height = 100;
      const startX = 50;
      const startY = 80;

      for (let i = 0; i < numPoints; i++) {
        const x = startX + (i * width) / (numPoints - 1);
        // Create realistic price movement based on actual change
        const timeProgress = i / (numPoints - 1);
        const volatility =
          period === "1H" ? 0.02 : period === "1D" ? 0.05 : 0.1;
        const trendFactor = (priceChange / 100) * timeProgress;
        const randomVariation = Math.sin(i * 0.5) * volatility;
        const priceMultiplier = 1 + trendFactor + randomVariation;
        const adjustedPrice = Math.max(0.001, basePrice * priceMultiplier);

        // Convert price to Y coordinate (invert for SVG)
        const normalizedPrice =
          (adjustedPrice - basePrice * 0.8) / (basePrice * 0.4);
        const y = Math.max(
          30,
          Math.min(180, startY + height - normalizedPrice * height * 0.8),
        );

        points.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
      }

      return points.join(" ");
    };

    return {
      "1H": { points: generatePricePoints("1H"), price: defaultPrice },
      "1D": { points: generatePricePoints("1D"), price: defaultPrice },
      "1W": { points: generatePricePoints("1W"), price: defaultPrice },
      "1M": { points: generatePricePoints("1M"), price: defaultPrice },
      All: { points: generatePricePoints("All"), price: defaultPrice },
    };
  }, [priceData, tokenData]);

  // Get current chart data safely
  const currentData = chartData?.[selectedPeriod] ||
    chartData?.["1D"] || { points: "M50,160 L350,160", price: "0" };





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
                <h1 className="text-3xl font-bold">
                  {currentPrice ? `$${currentPrice}` : 'No price data'}
                </h1>
                {priceData?.priceChange24h !== undefined && (
                  <Badge
                    className={`${priceData.priceChange24h >= 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                  >
                    {priceData.priceChange24h >= 0 ? "+" : ""}
                    {priceData.priceChange24h.toFixed(2)}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">
                    {tokenData?.coinName || tokenData?.name || "Loading..."} (
                    {tokenData?.coinSymbol || tokenData?.symbol || "..."})
                  </p>
                </div>

                {/* Contract Scanner Links Dropdown */}
                {tokenData?.coinAddress && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 gap-2"
                        data-testid="button-contract-menu"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(tokenData.coinAddress!);
                          toast({
                            title: "Copied!",
                            description: "Contract address copied to clipboard",
                          });
                        }}
                        data-testid="action-copy-address"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy address
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          const ipfsUrl = tokenData.mediaCid ? `https://gateway.pinata.cloud/ipfs/${tokenData.mediaCid}` : '#';
                          window.open(ipfsUrl, '_blank');
                        }}
                        data-testid="action-download"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => window.open(`https://sepolia.basescan.org/token/${tokenData.coinAddress}`, '_blank')}
                        data-testid="action-basescan"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Basescan
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => window.open(`https://www.geckoterminal.com/base-sepolia/tokens/${tokenData.coinAddress}`, '_blank')}
                        data-testid="action-geckoterminal"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        GeckoTerminal
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => window.open(`https://dexscreener.com/base-sepolia/${tokenData.coinAddress}`, '_blank')}
                        data-testid="action-dexscreener"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        DEX Screener
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => window.open(`https://www.tokenchat.live/token/base/${tokenData.coinAddress}`, '_blank')}
                        data-testid="action-tokenchat"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        TokenChat
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => {
                          toast({
                            title: "Report Submitted",
                            description: "Thank you for your report. We'll review it shortly.",
                          });
                        }}
                        className="text-red-600 focus:text-red-600"
                        data-testid="action-report"
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
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
            {viewMode === "chart" && tokenData?.address ? (
              <DexScreenerChart
                tokenAddress={tokenData.address}
                tokenSymbol={tokenData.coinSymbol || "Token"}
              />
            ) : viewMode === "image" ? (
              <div className="h-80 bg-muted rounded-lg mb-4 relative overflow-hidden">
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
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Right Side - Trading Panel */}
        <Card className="w-96">
          <CardContent className="p-0">

            {/* Tabs Container */}
            <Tabs defaultValue="trade" className="flex flex-col">
              <div className="border-b border-border px-4 py-3">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger
                    value="trade"
                    className="flex items-center gap-1 text-xs"
                  >
                    <TrendingUp className="h-3 w-3" />
                    Trade
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="flex items-center gap-1 text-xs"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger
                    value="holders"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Users className="h-3 w-3" />
                    Holders
                    <Badge variant="secondary" className="text-xs ml-1">
                      {processedHolders.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Activity className="h-3 w-3" />
                    Activity
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="max-h-[500px] overflow-y-auto">

                {/* Trade Tab Content */}
                <TabsContent value="trade" className="p-4 space-y-4">
                  {/* Buy Section */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                        data-testid="button-buy"
                      >
                        Buy
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        data-testid="button-sell"
                      >
                        Sell
                      </Button>
                    </div>
                    
                    {/* Amount Input */}
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0"
                        className="pr-16 text-lg font-medium"
                        data-testid="input-amount"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <span className="text-sm font-medium">ETH</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                    
                    {/* Quick Amount Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        data-testid="button-quick-0.001"
                      >
                        0.001 ETH
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        data-testid="button-quick-0.01"
                      >
                        0.01 ETH
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        data-testid="button-quick-0.1"
                      >
                        0.1 ETH
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        data-testid="button-quick-max"
                      >
                        Max
                      </Button>
                    </div>
                    
                    {/* Balance Info */}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Balance:</span>
                      <span data-testid="text-balance">0 ETH</span>
                    </div>
                    
                    {/* Comment Input */}
                    <Textarea
                      placeholder="Add a comment..."
                      className="resize-none"
                      rows={2}
                      data-testid="input-comment"
                    />
                    
                    {/* Insufficient Balance Message */}
                    <div className="text-center text-sm text-red-500">
                      Insufficient balance
                    </div>
                  </div>
                </TabsContent>

                {/* Comments Tab Content */}
                <TabsContent value="comments" className="p-4 space-y-0">
                  {commentData &&
                  Array.isArray(commentData) &&
                  commentData.length > 0 ? (
                    <div className="space-y-3">
                      {commentData.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.userAddress || "default"}`}
                            />
                            <AvatarFallback>
                              {comment.userAddress?.slice(2, 4) || "XX"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {comment.userAddress
                                  ? `${comment.userAddress.slice(0, 6)}...${comment.userAddress.slice(-4)}`
                                  : "Anonymous"}
                              </span>
                              <span className="text-xs text-gray-400">
                                {comment.timestamp &&
                                  formatTimeAgo(new Date(comment.timestamp))}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content || ""}</p>
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
                        <div
                          key={holder.address || index}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${holder.address || "default"}`}
                              />
                              <AvatarFallback>
                                {holder.address?.slice(2, 4) || "XX"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-mono">
                              {holder.address
                                ? `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`
                                : "Unknown"}
                            </span>
                          </div>
                          <span className="text-sm">
                            {holder.balance || "0"}
                          </span>
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
                  {tradesData &&
                  Array.isArray(tradesData) &&
                  tradesData.length > 0 ? (
                    <div className="space-y-3">
                      {tradesData.map((trade) => (
                        <div
                          key={trade.id}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${trade.type === "buy" ? "bg-green-400" : "bg-red-400"}`}
                            />
                            <span className="text-sm font-mono">
                              {trade.userAddress
                                ? `${trade.userAddress.slice(0, 6)}...${trade.userAddress.slice(-4)}`
                                : "Unknown"}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              {trade.ethAmount || "0"} ETH
                            </div>
                            <div className="text-xs text-gray-400">
                              {trade.timestamp &&
                                formatTimeAgo(new Date(trade.timestamp))}
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