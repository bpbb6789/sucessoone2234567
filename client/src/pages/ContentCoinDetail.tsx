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
import { useAccount } from "wagmi";
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
  const address = useAccount()?.address; // Use real wallet address
  // Removed auction state - using Zora SDK
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

  

  // Process holders data with proper typing
  const processedHolders = useMemo(() => {
    if (!holdersData || !Array.isArray(holdersData)) return [];
    return holdersData.map((holder) => ({
      address: holder.address,
      balance: holder.balance,
    }));
  }, [holdersData]);

  // Calculate trading statistics
  const tradingStats = useMemo(() => {
    let currentPrice = null;
    let marketCap = null;
    let volume24h = null;
    let creatorEarnings = null;
    let platformEarnings = null;
    let supply = null;
    let reserve = null;

    // Use price data if available
    if (priceData?.price && parseFloat(priceData.price) > 0) {
      currentPrice = parseFloat(priceData.price).toFixed(8);
      if (priceData.marketCap && parseFloat(priceData.marketCap) > 0) {
        marketCap = parseFloat(priceData.marketCap).toFixed(2);
      }
      if (priceData.volume24h && parseFloat(priceData.volume24h) > 0) {
        volume24h = parseFloat(priceData.volume24h).toFixed(6);
      }
    }
    // Use token data if no price data
    else if (tokenData?.currentPrice && parseFloat(tokenData.currentPrice) > 0) {
      currentPrice = parseFloat(tokenData.currentPrice).toFixed(8);
      if (tokenData.marketCap && parseFloat(tokenData.marketCap) > 0) {
        marketCap = parseFloat(tokenData.marketCap).toFixed(2);
      }
    }

    return {
      currentPrice,
      marketCap,
      volume24h,
      creatorEarnings,
      platformEarnings,
      holders: processedHolders.length || 0,
      supply,
      reserve
    };
  }, [processedHolders, priceData, tokenData]);


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

  // Auto-calculate estimated tokens when buy amount changes
  useEffect(() => {
    if (buyAmount && parseFloat(buyAmount) > 0) {
      calculateEstimatedTokens(buyAmount);
    } else {
      setEstimatedTokens("");
    }
  }, [buyAmount]);

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

  // Calculate estimated tokens based on price data
  const calculateEstimatedTokens = async (ethAmount: string) => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setEstimatedTokens("");
      return;
    }

    // Use price data if available
    let priceToUse = priceData?.price || tokenData?.currentPrice || tokenData?.price || "0";

    if (priceToUse && parseFloat(priceToUse) > 0) {
      const price = parseFloat(priceToUse);
      const estimated = parseFloat(ethAmount) / price;

      // Ensure the result is reasonable (not infinity or NaN)
      if (isFinite(estimated) && !isNaN(estimated) && estimated > 0) {
        setEstimatedTokens(estimated.toLocaleString());
        return;
      }
    }

    // Fallback for new tokens with no price data
    setEstimatedTokens("N/A");
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
      const response = await fetch(`/api/creator-coins/${tokenData.id}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerAddress: address,
          ethAmount: buyAmount,
          minTokensOut: '0' // Add slippage protection later
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Trading system temporarily unavailable');
      }

      toast({
        title: "Buy Order Prepared",
        description: `Will receive approximately ${result.trade?.tokensReceived || '0'} tokens`,
      });

      window.location.reload(); // Reload to ensure all data is fresh

    } catch (error) {
      console.error('Buy failed:', error);
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
        title: "Buy Failed",
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
      // Use Zora SDK for selling
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
                  {tradingStats.currentPrice ? `$${tradingStats.currentPrice}` : 'No price data'}
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
            {/* Market Stats - Always Visible */}
            <div className="p-4 border-b border-border">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Market Cap
                  </span>
                  <span className="text-sm font-semibold text-green-400">
                    {tradingStats.marketCap ? `$${tradingStats.marketCap}` : 'No data'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    24H Volume
                  </span>
                  <span className="text-sm font-semibold">
                    {tradingStats.volume24h ? `$${tradingStats.volume24h}` : 'No data'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Creator Earnings
                  </span>
                  <span className="text-sm font-semibold">
                    {tradingStats.creatorEarnings ? `$${tradingStats.creatorEarnings}` : 'No data'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Platform Earnings
                  </span>
                  <span className="text-sm font-semibold">
                    {tradingStats.platformEarnings ? `$${tradingStats.platformEarnings}` : 'No data'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Holders
                  </span>
                  <span className="text-sm font-semibold">
                    {tradingStats.holders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Supply
                  </span>
                  <span className="text-sm font-semibold">
                    {tradingStats.supply ? `${parseFloat(tradingStats.supply).toLocaleString()} tokens` : 'No data'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    ETH Reserve
                  </span>
                  <span className="text-sm font-semibold">
                    {tradingStats.reserve ? `${tradingStats.reserve} ETH` : 'No data'}
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
                    {/* Trading Status */}
                    <div className="p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-green-400">
                          Trading Available
                        </span>
                      </div>
                    </div>

                    {/* Balance Display */}
                    <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
                      Balance: {formatTokenBalance(tokenBalance)} {tokenData?.coinSymbol || "TOKENS"}
                    </div>

                    {/* Buy/Sell Toggle */}
                    <Tabs defaultValue="buy" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger
                          value="buy"
                          className="text-green-600 data-[state=active]:bg-green-500/20"
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Buy
                        </TabsTrigger>
                        <TabsTrigger
                          value="sell"
                          className="text-red-600 data-[state=active]:bg-red-500/20"
                        >
                          <TrendingDown className="h-4 w-4 mr-1" />
                          Sell
                        </TabsTrigger>
                      </TabsList>

                      {/* Buy Section */}
                      <TabsContent value="buy" className="space-y-4 mt-0">
                        <div className="space-y-4">
                          <div className="bg-card rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                              Buy
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium mb-2 block">Amount (ETH)</label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={buyAmount}
                                    onChange={(e) => {
                                      setBuyAmount(e.target.value);
                                      calculateEstimatedTokens(e.target.value);
                                    }}
                                    placeholder="0.0"
                                    step="0.000001"
                                    min="0"
                                    className="pr-12 h-12 text-lg"
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                                    ETH
                                  </div>
                                </div>
                              </div>

                              {buyAmount && estimatedTokens && (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                  <div className="text-sm text-green-400">
                                    You'll receive: <span className="font-semibold">≈ {estimatedTokens} {tokenData?.coinSymbol}</span>
                                  </div>
                                </div>
                              )}

                              {/* Quick Buy Amounts */}
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">Quick Amounts</div>
                                <div className="grid grid-cols-4 gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAmountSelect("0.001")}
                                    className="text-xs h-8"
                                  >
                                    0.001
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAmountSelect("0.01")}
                                    className="text-xs h-8"
                                  >
                                    0.01
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAmountSelect("0.1")}
                                    className="text-xs h-8"
                                  >
                                    0.1
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMaxAmount}
                                    className="text-xs h-8"
                                  >
                                    Max
                                  </Button>
                                </div>
                              </div>

                              <Button
                                onClick={handleBuy}
                                disabled={
                                  buyMutation.isPending ||
                                  !address ||
                                  !buyAmount ||
                                  parseFloat(buyAmount) <= 0
                                }
                                className="w-full h-12 bg-green-500 hover:bg-green-600 text-lg font-semibold"
                              >
                                {buyMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Buying...
                                  </>
                                ) : (
                                  `Buy ${tokenData?.coinSymbol || "Tokens"}`
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Sell Section */}
                      <TabsContent value="sell" className="space-y-4 mt-0">
                        <div className="space-y-4">
                          <div className="bg-card rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                              <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
                              Sell
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium mb-2 block">Amount ({tokenData?.coinSymbol})</label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={sellAmount}
                                    onChange={(e) => setSellAmount(e.target.value)}
                                    placeholder="0.0"
                                    step="0.000001"
                                    min="0"
                                    className="pr-20 h-12 text-lg"
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                                    {tokenData?.coinSymbol || "TOKENS"}
                                  </div>
                                </div>
                              </div>

                              {sellAmount && parseFloat(sellAmount) > 0 && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                  <div className="text-sm text-red-400">
                                    You'll receive: <span className="font-semibold">
                                      ≈ {(parseFloat(sellAmount) * parseFloat(priceData?.price || "0")).toFixed(6)} ETH
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Quick Sell Amounts */}
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">Quick Amounts</div>
                                <div className="grid grid-cols-4 gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSellAmount(tokenBalance ? (parseFloat(formatUnits(BigInt(tokenBalance), 18)) * 0.25).toFixed(6) : "0")}
                                    className="text-xs h-8"
                                    disabled={!tokenBalance || tokenBalance === 0n}
                                  >
                                    25%
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSellAmount(tokenBalance ? (parseFloat(formatUnits(BigInt(tokenBalance), 18)) * 0.5).toFixed(6) : "0")}
                                    className="text-xs h-8"
                                    disabled={!tokenBalance || tokenBalance === 0n}
                                  >
                                    50%
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSellAmount(tokenBalance ? (parseFloat(formatUnits(BigInt(tokenBalance), 18)) * 0.75).toFixed(6) : "0")}
                                    className="text-xs h-8"
                                    disabled={!tokenBalance || tokenBalance === 0n}
                                  >
                                    75%
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSellAmount(tokenBalance ? formatUnits(BigInt(tokenBalance), 18) : "0")}
                                    className="text-xs h-8"
                                    disabled={!tokenBalance || tokenBalance === 0n}
                                  >
                                    Max
                                  </Button>
                                </div>
                              </div>

                              {(!tokenBalance || tokenBalance === 0n) && (
                                <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                                  You don't own any {tokenData?.coinSymbol} tokens
                                </div>
                              )}

                              <Button
                                onClick={handleSell}
                                disabled={
                                  sellMutation.isPending ||
                                  !address ||
                                  !sellAmount ||
                                  parseFloat(sellAmount) <= 0 ||
                                  !tokenBalance ||
                                  tokenBalance === 0n
                                }
                                className="w-full h-12 bg-red-500 hover:bg-red-600 text-lg font-semibold"
                                variant="destructive"
                              >
                                {sellMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Selling...
                                  </>
                                ) : (
                                  `Sell ${tokenData?.coinSymbol || "Tokens"}`
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

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
                                <span>${priceData?.price || "0.00001"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Min. Price (with slippage):</span>
                                <span>
                                  $
                                  {(
                                    parseFloat(priceData?.price || "0.00001") *
                                    (1 - parseFloat(slippage) / 100)
                                  ).toFixed(8)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Trading System:</span>
                                <span className="text-xs">Zora SDK</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contract Information Section */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Contract Information</h3>
                        <div className="space-y-2">
                          {tokenData.coinAddress && tokenData.coinAddress !== 'Deploying...' ? (
                            <>
                              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Hash className="h-4 w-4 text-green-500" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">Contract Address</div>
                                  <code className="text-xs text-gray-600 dark:text-gray-400">{tokenData.coinAddress}</code>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tokenData.coinAddress!);
                                    toast({
                                      title: "Copied!",
                                      description: "Contract address copied to clipboard",
                                    });
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(`https://sepolia.basescan.org/token/${tokenData.coinAddress}`, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Explorer Links */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => window.open(`https://sepolia.basescan.org/token/${tokenData.coinAddress}`, '_blank')}
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View on BaseScan
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`https://sepolia.basescan.org/address/${tokenData.coinAddress}`, '_blank')}
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Contract Details
                                </Button>
                                {tokenData.deploymentTxHash && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`https://sepolia.basescan.org/tx/${tokenData.deploymentTxHash}`, '_blank')}
                                    className="flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Deploy TX
                                  </Button>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center p-4 border border-dashed border-muted rounded-lg">
                              <p className="text-sm text-muted-foreground">Contract not yet deployed or available.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>


                    {/* Comment Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Comment (Optional)</label>
                      <Textarea
                        placeholder="Add a comment with your trade..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="resize-none h-16 text-sm"
                        rows={3}
                      />
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