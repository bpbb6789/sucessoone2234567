import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  DollarSign,
  ExternalLink,
  Copy,
  Loader2,
  ShoppingCart,
  ArrowUpDown,
  Wallet,
} from "lucide-react";
import { ContentPreview } from "@/components/ContentPreview";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CreatorCoin } from "@shared/schema";
import { useState } from "react";
import { formatUnits, parseEther, Address } from "viem";
import { useAccount, useConnect, useDisconnect, useSendTransaction } from "wagmi";
import { baseSepolia } from "wagmi/chains";

type HolderData = {
  address: string;
  balance: string;
  percentage: number;
};

type TradeData = {
  id: string;
  userAddress: string;
  tradeType: "buy" | "sell";
  amount: string;
  price: string;
  transactionHash?: string;
  createdAt: string;
};

export default function ContentCoinDetail() {
  const params = useParams();
  const tokenAddress = params.address;
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  
  // Wallet connection
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { sendTransaction, isPending: isTransactionPending } = useSendTransaction();

  // Fetch creator coin data
  const { data: coin, isLoading: coinLoading, error: coinError } = useQuery<CreatorCoin>({
    queryKey: [`/api/creator-coins/${tokenAddress}`],
    enabled: !!tokenAddress,
  });

  // Fetch holders data
  const { data: holders, isLoading: holdersLoading } = useQuery<HolderData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/holders`],
    enabled: !!tokenAddress && !!coin?.coinAddress,
  });

  // Fetch trading activity
  const { data: trades, isLoading: tradesLoading } = useQuery<TradeData[]>({
    queryKey: [`/api/creator-coins/${tokenAddress}/trades`],
    enabled: !!tokenAddress,
  });

  // Get transaction data for buy/sell
  const { data: buyTxData } = useQuery({
    queryKey: [`/api/creator-coins/${tokenAddress}/buy-tx`, buyAmount],
    queryFn: async () => {
      if (!buyAmount || !address) return null;
      const response = await fetch(`/api/creator-coins/${tokenAddress}/buy-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ethAmount: buyAmount, userAddress: address })
      });
      return response.json();
    },
    enabled: !!buyAmount && !!address && parseFloat(buyAmount) > 0,
  });

  const { data: sellTxData } = useQuery({
    queryKey: [`/api/creator-coins/${tokenAddress}/sell-tx`, sellAmount],
    queryFn: async () => {
      if (!sellAmount || !address) return null;
      const response = await fetch(`/api/creator-coins/${tokenAddress}/sell-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAmount: sellAmount, userAddress: address })
      });
      return response.json();
    },
    enabled: !!sellAmount && !!address && parseFloat(sellAmount) > 0,
  });

  const handleBuy = async () => {
    if (!isConnected) {
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

    if (!buyTxData?.to || !buyTxData?.data) {
      toast({
        title: "Transaction data unavailable",
        description: "Unable to prepare transaction",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendTransaction({
        to: buyTxData.to as Address,
        data: buyTxData.data as `0x${string}`,
        value: parseEther(buyAmount),
        chainId: baseSepolia.id,
      });

      toast({
        title: "Transaction submitted!",
        description: "Your buy order is being processed on-chain",
      });
      
      setBuyAmount("");
      
      // Invalidate queries after successful transaction
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/creator-coins/${tokenAddress}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/creator-coins/${tokenAddress}/holders`] });
        queryClient.invalidateQueries({ queryKey: [`/api/creator-coins/${tokenAddress}/trades`] });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to submit transaction",
        variant: "destructive",
      });
    }
  };

  const handleSell = async () => {
    if (!isConnected) {
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
        description: "Please enter a valid token amount",
        variant: "destructive",
      });
      return;
    }

    if (!sellTxData?.to || !sellTxData?.data) {
      toast({
        title: "Transaction data unavailable",
        description: "Unable to prepare transaction",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendTransaction({
        to: sellTxData.to as Address,
        data: sellTxData.data as `0x${string}`,
        value: 0n, // No ETH value for sell
        chainId: baseSepolia.id,
      });

      toast({
        title: "Transaction submitted!",
        description: "Your sell order is being processed on-chain",
      });
      
      setSellAmount("");
      
      // Invalidate queries after successful transaction
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/creator-coins/${tokenAddress}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/creator-coins/${tokenAddress}/holders`] });
        queryClient.invalidateQueries({ queryKey: [`/api/creator-coins/${tokenAddress}/trades`] });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to submit transaction",
        variant: "destructive",
      });
    }
  };

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (coinLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (coinError || !coin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This token may not exist or has not been deployed yet.
          </p>
          <Link to="/contentcoin">
            <Button>Back to Content Coins</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = coin.currentPrice ? parseFloat(coin.currentPrice) : 0;
  const marketCap = coin.marketCap ? parseFloat(coin.marketCap) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/contentcoin">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Content Coins
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              {coin.coinAddress && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyAddress(coin.coinAddress!)}
                    data-testid="button-copy-address"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Address
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://sepolia.basescan.org/token/${coin.coinAddress}`, '_blank')}
                    data-testid="button-explorer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Explorer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Token Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {coin.mediaCid ? (
                      <ContentPreview
                        mediaCid={coin.mediaCid}
                        thumbnailCid={coin.thumbnailCid}
                        contentType={coin.contentType}
                        title={coin.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {coin.coinSymbol?.[0] || 'T'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold" data-testid="text-token-name">
                        {coin.coinName}
                      </h1>
                      <Badge variant="secondary" data-testid="text-token-symbol">
                        ${coin.coinSymbol}
                      </Badge>
                      <Badge 
                        variant={coin.status === 'deployed' ? 'default' : 'secondary'}
                        data-testid="text-token-status"
                      >
                        {coin.status}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-4" data-testid="text-token-description">
                      {coin.description}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span data-testid="text-current-price">
                          ${currentPrice.toFixed(8)} ETH
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span data-testid="text-market-cap">
                          ${marketCap.toLocaleString()} Market Cap
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span data-testid="text-holders-count">
                          {coin.holders || 0} holders
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Preview */}
            {coin.mediaCid && (
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <ContentPreview
                      mediaCid={coin.mediaCid}
                      thumbnailCid={coin.thumbnailCid}
                      contentType={coin.contentType}
                      title={coin.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Trading */}
          <div className="space-y-6">
            {/* Trading Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Trade {coin.coinSymbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected ? (
                  <div className="text-center py-8 space-y-4">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium mb-2">Connect Wallet to Trade</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect your wallet to buy and sell {coin?.coinSymbol || 'tokens'}
                      </p>
                      <Button 
                        onClick={() => connect({ connector: connectors[0] })}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-connect-wallet"
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Connect Wallet
                      </Button>
                    </div>
                  </div>
                ) : coin?.status === 'deployed' && coin.coinAddress ? (
                  <>
                    <div className="text-center py-2 mb-4 text-sm text-green-600 bg-green-50 rounded-lg">
                      ✅ Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>

                    {/* Buy Section */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Buy with ETH</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0.001"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          data-testid="input-buy-amount"
                        />
                        <Button
                          onClick={handleBuy}
                          disabled={isTransactionPending || !buyAmount}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid="button-buy"
                        >
                          {isTransactionPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Buy"
                          )}
                        </Button>
                      </div>
                      {buyTxData && (
                        <p className="text-xs text-muted-foreground">
                          Est. tokens: {buyTxData.estimatedTokensReceived}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Sell Section */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Sell Tokens</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="1"
                          placeholder="100"
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                          data-testid="input-sell-amount"
                        />
                        <Button
                          onClick={handleSell}
                          disabled={isTransactionPending || !sellAmount}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          data-testid="button-sell"
                        >
                          {isTransactionPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Sell"
                          )}
                        </Button>
                      </div>
                      {sellTxData && (
                        <p className="text-xs text-muted-foreground">
                          Est. ETH: {sellTxData.estimatedEthReceived}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-2">Trading Not Available</p>
                    <p className="text-sm">
                      {coin.status === 'pending' 
                        ? 'Token is being deployed...' 
                        : 'Token deployment required for trading'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Tabs */}
            <Card>
              <Tabs defaultValue="holders" className="w-full">
                <CardHeader className="pb-3">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="holders" data-testid="tab-holders">
                      Holders ({holders?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="trades" data-testid="tab-trades">
                      Activity
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="max-h-80 overflow-y-auto">
                  <TabsContent value="holders" className="mt-0">
                    {holdersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : holders && holders.length > 0 ? (
                      <div className="space-y-3">
                        {holders.map((holder, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage 
                                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${holder.address}`} 
                                />
                                <AvatarFallback>
                                  {holder.address.slice(2, 4).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span 
                                className="font-mono text-sm cursor-pointer hover:text-blue-600"
                                onClick={() => copyAddress(holder.address)}
                                data-testid={`text-holder-${index}`}
                              >
                                {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                              </span>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">{holder.balance}</div>
                              <div className="text-muted-foreground">
                                {holder.percentage.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No holders yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="trades" className="mt-0">
                    {tradesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : trades && trades.length > 0 ? (
                      <div className="space-y-3">
                        {trades.map((trade) => (
                          <div key={trade.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                trade.tradeType === 'buy' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <span 
                                className="font-mono text-sm cursor-pointer hover:text-blue-600"
                                onClick={() => copyAddress(trade.userAddress)}
                                data-testid={`text-trader-${trade.id}`}
                              >
                                {trade.userAddress.slice(0, 6)}...{trade.userAddress.slice(-4)}
                              </span>
                            </div>
                            <div className="text-right text-sm">
                              <div className={`font-medium ${
                                trade.tradeType === 'buy' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {trade.tradeType === 'buy' ? '+' : '-'}{trade.amount}
                              </div>
                              <div className="text-muted-foreground">
                                {formatTimeAgo(trade.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No trading activity yet</p>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}