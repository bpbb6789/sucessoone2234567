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
import { useAccount, useBalance } from "wagmi";
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

export default function ContentCoinDetail() {
  const params = useParams();
  const tokenAddress = params.address;
  const address = useAccount()?.address; // Use real wallet address
  // Removed unused wagmi hooks for auction integration
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [comment, setComment] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "1H" | "1D" | "1W" | "1M" | "All"
  >("1D");
  const [viewMode, setViewMode] = useState<"chart" | "image">("chart");
  const [slippage, setSlippage] = useState("2"); // 2% default slippage
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedTokens, setEstimatedTokens] = useState("");

  // Removed auction state - using instant trading now

  // Trading mutations
  const buyMutation = useBuyCreatorCoin();
  const sellMutation = useSellCreatorCoin();

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

  // Get real token balance from blockchain using publicClient
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  
  useEffect(() => {
    if (!address || !tokenData?.coinAddress) return;
    
    async function fetchBalance() {
      try {
        const balance = await publicClient.readContract({
          address: tokenData.coinAddress as Address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as Address],
        });
        setTokenBalance(balance);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setTokenBalance(0n);
      }
    }
    
    fetchBalance();
  }, [address, tokenData?.coinAddress]);

  // Process holders data with proper typing
  const processedHolders = useMemo(() => {
    if (!holdersData || !Array.isArray(holdersData)) return [];
    return holdersData.map((holder) => ({
      address: holder.address,
      balance: holder.balance,
    }));
  }, [holdersData]);

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

  const handleAmountSelect = (newAmount: string) => {
    setBuyAmount(newAmount);
    // Calculate estimated tokens when amount changes
    calculateEstimatedTokens(newAmount);
  };

  // Calculate estimated tokens based on current bonding curve price
  const calculateEstimatedTokens = async (ethAmount: string) => {
    if (!ethAmount) {
      setEstimatedTokens("");
      return;
    }

    try {
      // Use real-time bonding curve price calculation
      if (!priceData?.price) {
        setEstimatedTokens("");
        return;
      }
      const estimated = parseFloat(ethAmount) / parseFloat(priceData.price);
      setEstimatedTokens(estimated.toLocaleString());
    } catch (error) {
      console.error("Failed to calculate estimated tokens:", error);
      setEstimatedTokens("");
    }
  };

  const handleMaxAmount = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get user's ETH balance
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });
      const balanceInEth = formatUnits(balance, 18);
      // Leave some ETH for gas fees
      const maxAmount = Math.max(0, parseFloat(balanceInEth) - 0.01).toString();
      setBuyAmount(maxAmount);
      calculateEstimatedTokens(maxAmount);
    } catch (error) {
      console.error("Error getting balance:", error);
      toast({
        title: "Error",
        description: "Could not fetch wallet balance",
        variant: "destructive",
      });
    }
  };

  const handleBuy = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive",
      });
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid ETH amount",
        variant: "destructive",
      });
      return;
    }

    if (!tokenData?.id) {
      toast({
        title: "Token not found",
        description: "Unable to find token information",
        variant: "destructive",
      });
      return;
    }

    // Instant trading via Zora bonding curve - no auction

    // Check user's ETH balance
    try {
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });
      const balanceInEth = parseFloat(formatUnits(balance, 18));
      const requiredAmount = parseFloat(buyAmount) + 0.01; // Add gas estimate

      if (balanceInEth < requiredAmount) {
        toast({
          title: "Insufficient balance",
          description: `You need at least ${requiredAmount.toFixed(4)} ETH (including gas fees)`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Error checking balance:", error);
    }

    try {
      // Calculate minimum tokens with slippage protection
      const estimatedTokensNum =
        parseFloat(estimatedTokens.replace(/,/g, "")) || 0;
      const minTokensOut = (
        estimatedTokensNum *
        (1 - parseFloat(slippage) / 100)
      ).toString();

      // Use PumpFun bonding curve for all trading (much lower gas costs)
      const response = await fetch(`/api/creator-coins/${tokenData.id}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buyerAddress: address,
          ethAmount: buyAmount,
          minTokensOut,
          slippageTolerance: slippage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transaction failed");
      }

      const result = await response.json();
      
      toast({
        title: "Buy successful!",
        description: `Purchased ${result.trade?.tokensReceived || estimatedTokens} tokens`,
      });

      // Reset form
      setBuyAmount("");
      setEstimatedTokens("");

      // Refetch data
      window.location.reload();
    } catch (error) {
      console.error("Buy failed:", error);

      let errorMessage = "Failed to execute buy order";
      if (error instanceof Error) {
        if (error.message.includes("500")) {
          errorMessage = "Server error occurred. Please try again.";
        } else if (
          error.message.includes("replacement transaction underpriced")
        ) {
          errorMessage =
            "Transaction failed due to gas pricing. Please try again with higher gas.";
        } else if (error.message.includes("Pool doesn't exist")) {
          errorMessage =
            "Trading pool is being created. Please wait a moment and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Transaction failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSell = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive",
      });
      return;
    }

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid token amount to sell",
        variant: "destructive",
      });
      return;
    }

    if (!tokenData?.id) {
      toast({
        title: "Token not found",
        description: "Unable to find token information",
        variant: "destructive",
      });
      return;
    }

    // Check user's token balance
    if (tokenBalance && tokenBalance > 0n) {
      const balanceInTokens = parseFloat(formatUnits(tokenBalance, 18));
      if (balanceInTokens < parseFloat(sellAmount)) {
        toast({
          title: "Insufficient tokens",
          description: `You only have ${balanceInTokens.toFixed(4)} ${tokenData.coinSymbol} tokens`,
          variant: "destructive",
        });
        return;
      }
    } else {
      toast({
        title: "No tokens to sell",
        description: `You don't own any ${tokenData.coinSymbol} tokens`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Use PumpFun bonding curve for selling (much lower gas costs)
      const response = await fetch(`/api/creator-coins/${tokenData.id}/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress: address,
          tokenAmount: sellAmount,
          minEthOut: undefined, // Let backend calculate slippage protection
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Sell transaction failed");
      }

      const result = await response.json();

      toast({
        title: "Sell successful!",
        description: `Sold ${sellAmount} tokens for ${result.ethReceived || "unknown"} ETH`,
      });

      setSellAmount("");

      // Refetch data
      window.location.reload();
    } catch (error) {
      console.error("Sell failed:", error);
      toast({
        title: "Sell failed",
        description:
          error instanceof Error ? error.message : "Transaction failed",
        variant: "destructive",
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
                <h1 className="text-3xl font-bold">
                  {priceData?.price
                    ? `$${priceData.price}`
                    : tokenData?.currentPrice
                      ? `$${tokenData.currentPrice}`
                      : "$0"}
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
              <p className="text-muted-foreground">
                {tokenData?.coinName || tokenData?.name || "Loading..."} (
                {tokenData?.coinSymbol || tokenData?.symbol || "..."})
              </p>
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
            {/* Market Stats - Always Visible */}
            <div className="p-4 border-b border-border">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Market Cap
                  </span>
                  <span className="text-sm font-semibold text-green-400">
                    ${priceData?.marketCap || "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    24H Volume
                  </span>
                  <span className="text-sm font-semibold">
                    ${priceData?.volume24h || "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Creator Earnings
                  </span>
                  <span className="text-sm font-semibold">
                    $
                    {priceData?.volume24h
                      ? (parseFloat(priceData.volume24h) * 0.15).toFixed(4)
                      : "0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs Container */}
            <Tabs defaultValue="trading" className="flex flex-col">
              <div className="border-b border-border px-4 py-3">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger
                    value="trading"
                    className="flex items-center gap-1 text-xs"
                  >
                    <DollarSign className="h-3 w-3" />
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
                {/* Trading Tab Content */}
                <TabsContent value="trading" className="p-4 space-y-0">
                  <div className="space-y-4">
                    {/* Market Stats Banner */}
                    <div className="p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-sm font-semibold text-green-400">
                            Instant Trading
                          </span>
                        </div>
                        <div className="text-xs text-green-300">
                          Bonding Curve Active
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">
                            Current Price
                          </div>
                          <div className="font-semibold text-green-400">
                            ${priceData?.price || tokenData?.currentPrice || "0.00"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Market Cap
                          </div>
                          <div className="font-semibold">
                            ${priceData?.marketCap || tokenData?.marketCap || "0"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Buy/Sell Buttons - Instant Trading */}
                    <div className="flex space-x-2">
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        onClick={handleBuy}
                        disabled={
                          buyMutation.isPending ||
                          !address ||
                          !buyAmount ||
                          parseFloat(buyAmount) <= 0
                        }
                      >
                        {buyMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Buying...
                          </>
                        ) : (
                          "Buy"
                        )}
                      </Button>
                      <Button
                        className="flex-1 bg-red-500 hover:bg-red-600"
                        onClick={handleSell}
                        disabled={
                          sellMutation.isPending ||
                          !address ||
                          !sellAmount ||
                          parseFloat(sellAmount) <= 0
                        }
                      >
                        {sellMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Selling...
                          </>
                        ) : (
                          "Sell"
                        )}
                      </Button>
                    </div>


                    {/* Balance Display */}
                    <div className="text-center text-sm text-muted-foreground">
                      Balance{" "}
                      {tokenBalance ? formatUnits(BigInt(tokenBalance), 18) : "0"} ETH
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="number"
                          value={buyAmount}
                          onChange={(e) => {
                            setBuyAmount(e.target.value);
                            calculateEstimatedTokens(e.target.value);
                          }}
                          placeholder="Enter ETH amount to buy"
                          step="0.000001"
                          min="0"
                          className="bg-input border-input pr-12"
                        />
                        <div className="absolute right-3 top-2 text-xs text-muted-foreground">
                          ETH
                        </div>
                      </div>
                      {estimatedTokens && (
                        <div className="text-xs text-muted-foreground text-center">
                          You'll receive: ≈ {estimatedTokens}{" "}
                          {tokenData?.coinSymbol || "tokens"}
                        </div>
                      )}
                      
                      {/* Sell Amount Input */}
                      <div className="relative mt-4">
                        <Input
                          type="number"
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                          placeholder="Enter token amount to sell"
                          step="0.000001"
                          min="0"
                          className="bg-input border-input pr-16"
                        />
                        <div className="absolute right-3 top-2 text-xs text-muted-foreground">
                          {tokenData?.coinSymbol || "TOKENS"}
                        </div>
                      </div>
                      {sellAmount && (
                        <div className="text-xs text-muted-foreground text-center">
                          You'll receive: ≈ {(parseFloat(sellAmount) * parseFloat(priceData?.price || "0")).toFixed(6)} ETH
                        </div>
                      )}
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground">Quick Buy Amounts</div>
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
                      
                      <div className="text-xs font-medium text-muted-foreground">Quick Sell Amounts</div>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSellAmount(tokenBalance ? (parseFloat(formatUnits(BigInt(tokenBalance), 18)) * 0.25).toString() : "0")}
                          className="text-xs"
                        >
                          25%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSellAmount(tokenBalance ? (parseFloat(formatUnits(BigInt(tokenBalance), 18)) * 0.5).toString() : "0")}
                          className="text-xs"
                        >
                          50%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSellAmount(tokenBalance ? (parseFloat(formatUnits(BigInt(tokenBalance), 18)) * 0.75).toString() : "0")}
                          className="text-xs"
                        >
                          75%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSellAmount(tokenBalance ? formatUnits(BigInt(tokenBalance), 18) : "0")}
                          className="text-xs"
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs w-full justify-between"
                      >
                        Advanced Settings
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                        />
                      </Button>

                      {showAdvanced && (
                        <div className="space-y-3 p-3 border rounded-lg">
                          <div>
                            <label htmlFor="slippage" className="text-xs">
                              Slippage Tolerance (%)
                            </label>
                            <Input
                              id="slippage"
                              type="number"
                              value={slippage}
                              onChange={(e) => setSlippage(e.target.value)}
                              placeholder="2"
                              step="0.1"
                              min="0.1"
                              max="50"
                              className="mt-1 text-xs h-8"
                            />
                          </div>

                          {priceData && (
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Current Price:</span>
                                <span>${priceData.price}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Min. Price (with slippage):</span>
                                <span>
                                  $
                                  {(
                                    parseFloat(priceData.price) *
                                    (1 - parseFloat(slippage) / 100)
                                  ).toFixed(6)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comment Input */}
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white resize-none h-16 text-sm"
                    />

                    {/* Trade Confirmation */}
                    {buyAmount && parseFloat(buyAmount) > 0 && (
                      <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
                        <div className="text-xs font-medium">Trade Summary</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Buy Amount:</span>
                            <span>{buyAmount} ETH</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sell Amount:</span>
                            <span>{sellAmount} {tokenData?.coinSymbol}</span>
                          </div>
                          {estimatedTokens && (
                            <div className="flex justify-between">
                              <span>You receive:</span>
                              <span>
                                ≈ {estimatedTokens} {tokenData?.coinSymbol}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Slippage:</span>
                            <span>{slippage}%</span>
                          </div>
                          {priceData && (
                            <div className="flex justify-between">
                              <span>Price Impact:</span>
                              <span className="text-yellow-400">~0.1%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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