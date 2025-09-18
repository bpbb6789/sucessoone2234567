import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount, useReadContract } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Clock,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink,
  BarChart3,
  Zap,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
// Using Zora SDK via API routes instead of direct contract calls
import TransactionComponent from "@/components/Transaction";
import TradingChart from "@/components/TradingChart";
import TokenStats from "@/components/TokenStats";
import TokenActivity from "@/components/TokenActivity";
import { formatUnits, parseUnits, Address, erc20Abi } from "viem";
import { useGetAllSales } from "@/hooks/useGetAllSales";

interface TokenData {
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
}

export default function TokenDetail() {
  const params = useParams();
  const tokenAddress = params.id;
  const { address } = useAccount();
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");

  // Get token data from GraphQL
  const { data: salesData, loading: salesLoading } = useGetAllSales();

  const tokenData = React.useMemo(() => {
    if (!salesData || !Array.isArray(salesData) || !tokenAddress) return null;

    const token = salesData.find((t: any) => 
      t.memeTokenAddress?.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!token) return null;

    console.log('Token data from GraphQL:', token);

    return {
      id: token.memeTokenAddress,
      address: token.memeTokenAddress,
      name: token.name || token.symbol || 'Unknown Token',
      symbol: token.symbol || 'UNKNOWN',
      description: token.bio || token.description || 'Content tokenized on the platform',
      creator: token.createdBy || 'No Creator Found',
      price: '0',
      marketCap: '0',
      volume24h: '0',
      holders: 0,
      change24h: 0,
      createdAt: new Date(token.createdAt || token.blockTimestamp || Date.now())
    } as TokenData;
  }, [salesData, tokenAddress]);

  // Get user's token balance
  const { data: ethBalance } = useReadContract({
    address: tokenAddress as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as Address],
    query: {
      enabled: !!address && !!tokenAddress
    }
  });

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

  // Bonding curve system has been removed - now using Zora Trading SDK

  const copyAddress = () => {
    if (tokenAddress) {
      navigator.clipboard.writeText(tokenAddress);
      toast({
        title: "Address Copied",
        description: "Token address copied to clipboard",
      });
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (salesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-300 rounded"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-80 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <p className="text-muted-foreground mb-6">The token you're looking for doesn't exist or hasn't been indexed yet.</p>
          <Link to="/creatorcoins">
            <Button>View All Creator Coins</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {tokenData.symbol.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{tokenData.name}</h1>
                <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-200">
                  🚀 Creator Coin
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="font-mono">{tokenData.symbol}</span>
                <span>•</span>
                <span>Created {formatTimeAgo(tokenData.createdAt)}</span>
                <span>•</span>
                <button 
                  onClick={copyAddress}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <span className="font-mono">{tokenAddress?.slice(0, 6)}...{tokenAddress?.slice(-4)}</span>
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
          <Link to="/creatorcoins">
            <Button variant="outline">Back to Creator Coins</Button>
          </Link>
        </div>

        {/* Token Stats */}
        <TokenStats tokenData={tokenData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart & Info */}
          <div className="lg:col-span-2 space-y-6">


            {/* TradingView Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Price Chart
                  <Badge variant="secondary" className="ml-2">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradingChart 
                  tokenAddress={tokenAddress || ""} 
                  symbol={tokenData.symbol} 
                />
              </CardContent>
            </Card>

            {/* Token Info */}
            <Card>
              <CardHeader>
                <CardTitle>About {tokenData.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{tokenData.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Creator:</span>
                    <p className="font-mono">{tokenData.creator !== 'No Creator Found' ? `${tokenData.creator.slice(0, 10)}...${tokenData.creator.slice(-4)}` : 'No Creator Found'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contract:</span>
                    <p className="font-mono">{tokenAddress?.slice(0, 10)}...{tokenAddress?.slice(-4)}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => window.open(`https://sepolia.basescan.org/token/${tokenAddress}`, '_blank')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    BaseScan
                  </button>
                  <button
                    onClick={() => window.open(`https://dexscreener.com/base/${tokenAddress}`, '_blank')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    DexScreener
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Token Activity */}
            <TokenActivity tokenAddress={tokenAddress || ""} symbol={tokenData.symbol} />
          </div>

          {/* Right Column - Trading */}
          <div className="space-y-6">
            {/* Trading Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  Trade {tokenData.symbol}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger 
                      value="buy" 
                      className="text-green-600 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30"
                    >
                      🚀 Buy
                    </TabsTrigger>
                    <TabsTrigger 
                      value="sell" 
                      className="text-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/30"
                    >
                      💰 Sell
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="buy" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Amount (ETH)</label>
                        <div className="text-xs text-muted-foreground">
                          Balance: {address ? '0.0 ETH' : 'Connect Wallet'}
                        </div>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          className="pr-12"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                          ETH
                        </div>
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="flex gap-2">
                        {['0.001', '0.01', '0.1'].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setBuyAmount(amount)}
                            className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {amount} ETH
                          </button>
                        ))}
                      </div>
                    </div>

                    <TransactionComponent
                      contractAddress={"0x0000000000000000000000000000000000000000"}
                      contractAbi={[]}
                      functionName="buy"
                      args={[tokenAddress as Address, parseUnits(buyAmount, 18), BigInt(0)]}
                      value={buyAmount ? parseUnits(buyAmount, 18) : BigInt(0)}
                      cta={`Buy ${tokenData.symbol}`}
                      disabled={!buyAmount || parseFloat(buyAmount) <= 0}
                      handleOnStatus2={(status) => {
                        if (status?.statusName === 'success') {
                          setBuyAmount("");
                          toast({
                            title: "Purchase Successful!",
                            description: `Successfully bought ${tokenData.symbol}`,
                          });
                        }
                      }}
                    />

                    {buyAmount && parseFloat(buyAmount) > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>You pay:</span>
                          <span>{buyAmount} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>You receive:</span>
                          <span>~{(parseFloat(buyAmount) / parseFloat(tokenData.price)).toFixed(2)} {tokenData.symbol}</span>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="sell" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Amount ({tokenData.symbol})</label>
                        <div className="text-xs text-muted-foreground">
                          Balance: {tokenBalance ? formatUnits(tokenBalance, 18) : '0.0'} {tokenData.symbol}
                        </div>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                          className="pr-20"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                          {tokenData.symbol}
                        </div>
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="flex gap-2">
                        {['25%', '50%', '100%'].map((percentage) => (
                          <button
                            key={percentage}
                            onClick={() => {
                              if (tokenBalance) {
                                const balance = formatUnits(tokenBalance, 18);
                                const percent = parseInt(percentage) / 100;
                                setSellAmount((parseFloat(balance) * percent).toString());
                              }
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {percentage}
                          </button>
                        ))}
                      </div>
                    </div>

                    <TransactionComponent
                      contractAddress={"0x0000000000000000000000000000000000000000"}
                      contractAbi={[]}
                      functionName="sell"
                      args={[tokenAddress as Address, sellAmount ? parseUnits(sellAmount, 18) : BigInt(0), BigInt(0)]}
                      cta={`Sell ${tokenData.symbol}`}
                      disabled={!sellAmount || parseFloat(sellAmount) <= 0}
                      handleOnStatus2={(status) => {
                        if (status?.statusName === 'success') {
                          setSellAmount("");
                          toast({
                            title: "Sale Successful!",
                            description: `Successfully sold ${tokenData.symbol}`,
                          });
                        }
                      }}
                    />

                    {sellAmount && parseFloat(sellAmount) > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>You sell:</span>
                          <span>{sellAmount} {tokenData.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>You receive:</span>
                          <span>~{(parseFloat(sellAmount) * parseFloat(tokenData.price)).toFixed(6)} ETH</span>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <strong className="text-foreground">Step 1:</strong> Pick a token you like
                </div>
                <div>
                  <strong className="text-foreground">Step 2:</strong> Buy the token on the bonding curve
                </div>
                <div>
                  <strong className="text-foreground">Step 3:</strong> Sell at any time to lock in profits or losses
                </div>
                <div className="text-xs pt-2 border-t">
                  Tokens graduate to Uniswap when they reach a market cap of $69K. 
                  This creates permanent liquidity and enables decentralized trading.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}