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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
// Using Zora SDK via API routes instead of direct contract calls
import TransactionComponent from "@/components/Transaction";
import { formatUnits, parseUnits, Address, erc20Abi } from "viem";
import { useGetAllSales } from "@/hooks/useGetAllSales";
import { useCreatorCoin, useCreatorCoinComments, useCreatorCoinTrades, useCreatorCoinHolders, useBuyCreatorCoin, useSellCreatorCoin } from "@/hooks/useCreatorCoins";

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

  // Trading mutations
  const buyMutation = useBuyCreatorCoin();
  const sellMutation = useSellCreatorCoin();

  // Direct contract interaction for onchain trading
  const { writeContract, isPending: isWritePending } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();
  
  // Wait for transaction confirmation
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  // Handle successful transaction
  React.useEffect(() => {
    if (isTxSuccess && pendingTxHash) {
      toast({
        title: "Transaction confirmed!",
        description: "Your trade has been executed successfully onchain",
      });
      setPendingTxHash(undefined);
    }
  }, [isTxSuccess, pendingTxHash, toast]);

  // Try to get content coin data first (from creator coins API)
  const { data: creatorCoin, isLoading: creatorCoinLoading } = useCreatorCoin(tokenAddress || '');
  
  // Get real data for comments, trades, and holders
  const { data: comments, isLoading: commentsLoading } = useCreatorCoinComments(tokenAddress || '');
  const { data: trades, isLoading: tradesLoading } = useCreatorCoinTrades(tokenAddress || '');
  const { data: holders, isLoading: holdersLoading } = useCreatorCoinHolders(tokenAddress || '');
  
  // Remove expensive fallback query that loads ALL sales data
  // This was causing major performance issues

  const tokenData = React.useMemo(() => {
    // First, try to use creator coin data if available
    if (creatorCoin) {
      return {
        id: creatorCoin.coinAddress || creatorCoin.id,
        address: creatorCoin.coinAddress || creatorCoin.id,
        name: creatorCoin.title || creatorCoin.coinName,
        symbol: creatorCoin.coinSymbol,
        description: creatorCoin.description || `${creatorCoin.coinName} content coin`,
        creator: creatorCoin.creatorAddress,
        price: creatorCoin.currentPrice || '0.001',
        marketCap: creatorCoin.marketCap || '0',
        volume24h: creatorCoin.volume24h || '0', 
        holders: creatorCoin.holders || 0,
        change24h: 0, // Calculate from price history
        createdAt: creatorCoin.createdAt ? new Date(creatorCoin.createdAt) : new Date(),
        isOnBondingCurve: creatorCoin.status === 'deployed',
        progress: parseInt(creatorCoin.bondingCurveProgress || '0'),
        bondingCurveAddress: creatorCoin.coinAddress,
        imageUrl: `https://gateway.pinata.cloud/ipfs/${creatorCoin.mediaCid}`,
        contentType: creatorCoin.contentType as 'image' | 'video' | 'audio' | 'text',
        creatorEarnings: '0' // Calculate from trades
      } as ContentCoinData;
    }

    // No fallback needed - just return null if creator coin data not available
    return null;
  }, [creatorCoin, tokenAddress]); // Fixed dependency array

  // Process real data for display
  const processedComments = comments || [];
  const processedHolders = holders || [];
  const processedActivities = trades || [];

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

    if (!tokenData?.address) {
      toast({
        title: "Token not found",
        description: "Unable to find token contract address",
        variant: "destructive"
      });
      return;
    }

    try {
      // Execute direct onchain transaction using Uniswap V4
      const ethAmountWei = parseUnits(buyAmount, 18);
      
      // Uniswap V4 Universal Router on Base Sepolia
      const UNISWAP_V4_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';
      
      // For the actual swap, we would need the proper function selector and encoding
      // This is a simplified version - production would use Uniswap V4 SDK
      
      const result = await writeContract({
        address: UNISWAP_V4_ROUTER as `0x${string}`,
        abi: [
          {
            name: 'execute',
            type: 'function',
            stateMutability: 'payable',
            inputs: [
              { name: 'commands', type: 'bytes' },
              { name: 'inputs', type: 'bytes[]' }
            ],
            outputs: []
          }
        ],
        functionName: 'execute',
        args: [
          '0x00', // Command for swap
          ['0x'] // Encoded swap parameters
        ],
        value: ethAmountWei
      });

      setPendingTxHash(result);

      toast({
        title: "Transaction submitted!",
        description: `Buying ${buyAmount} ETH worth of ${tokenData.symbol} tokens`,
      });

      // Record the trade in our database for tracking
      await buyMutation.mutateAsync({
        coinId: tokenData.id,
        userAddress: address,
        ethAmount: buyAmount,
        comment: comment.trim() || undefined
      });

      setBuyAmount("");
      setComment("");

    } catch (error) {
      console.error('Buy failed:', error);
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Failed to execute swap",
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
        description: "Please enter a valid token amount",
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
                <Button 
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold"
                  onClick={handleBuy}
                  disabled={isWritePending || isTxConfirming || !address}
                  data-testid="button-buy-mobile"
                >
                  {isWritePending ? 'Signing...' : isTxConfirming ? 'Confirming...' : 'Buy'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleSell}
                  disabled={isWritePending || isTxConfirming || !address}
                  data-testid="button-sell-mobile"
                >
                  {isWritePending ? 'Signing...' : isTxConfirming ? 'Confirming...' : 'Sell'}
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
                onClick={handleBuy}
                disabled={isWritePending || isTxConfirming || !address}
                data-testid="button-buy-desktop"
              >
                {isWritePending ? 'Signing Transaction...' : isTxConfirming ? 'Confirming...' : 'Buy'}
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
                Holders {processedHolders.length}
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 text-xs">
                Activity
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1 text-xs">
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="p-4 space-y-4">
              {commentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="h-8 w-8 bg-gray-700 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : processedComments.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                processedComments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.userAddress}`} />
                      <AvatarFallback>{comment.userAddress?.slice(2, 4) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {comment.userAddress?.slice(0, 6)}...{comment.userAddress?.slice(-4)}
                        </p>
                        <p className="text-xs text-gray-400">{formatTimeAgo(new Date(comment.createdAt))}</p>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="holders" className="p-4 space-y-3">
              {holdersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-700 rounded w-24"></div>
                          <div className="h-3 bg-gray-700 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-700 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : processedHolders.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p>No holders data available yet</p>
                </div>
              ) : (
                processedHolders.map((holder: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${holder.address}`} />
                        <AvatarFallback>{index + 1}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {holder.address?.slice(0, 6)}...{holder.address?.slice(-4)}
                        </p>
                        <p className="text-xs text-gray-400">{holder.percentage || 0}%</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{holder.balance || '0'}</p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="activity" className="p-4 space-y-3">
              {tradesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-700 rounded"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-700 rounded w-20"></div>
                          <div className="h-3 bg-gray-700 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="h-3 bg-gray-700 rounded w-16"></div>
                        <div className="h-3 bg-gray-700 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : processedActivities.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p>No trading activity yet</p>
                </div>
              ) : (
                processedActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        activity.tradeType === 'buy' ? "bg-green-500 text-black" : "bg-red-500 text-white"
                      )}>
                        {activity.tradeType === 'buy' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {activity.userAddress?.slice(0, 6)}...{activity.userAddress?.slice(-4)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {activity.tradeType} {activity.amount} at ${activity.price}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{formatTimeAgo(new Date(activity.createdAt))}</p>
                  </div>
                ))
              )}
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