
"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Coins,
  ExternalLink,
  ShoppingCart,
  Wallet,
  BarChart3,
  Info,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { contentCoinAbi } from '@/lib/contracts';
import { Link } from 'wouter';

interface ZoraTokenDetails {
  address: string;
  name: string;
  symbol: string;
  description: string;
  type: 'creator' | 'content' | 'basic';
  creator: string;
  price: string;
  marketCap: string;
  volume24h: string;
  holders: number;
  change24h: number;
  totalSupply: string;
  createdAt: string;
}

export default function ZoraTokenDetail() {
  const params = useParams();
  const { address: userAddress, isConnected } = useAccount();
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');

  const tokenAddress = params?.address as Address;

  // Fetch token details
  const { data: tokenDetails, isLoading } = useQuery({
    queryKey: ['zora-token-detail', tokenAddress],
    queryFn: async (): Promise<ZoraTokenDetails> => {
      const response = await fetch(`/api/zora-token/${tokenAddress}`);
      if (!response.ok) throw new Error('Failed to fetch token details');
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Read token balance for connected user
  const { data: userBalance } = useReadContract({
    address: tokenAddress,
    abi: contentCoinAbi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    enabled: !!userAddress && !!tokenAddress,
  });

  // Get buy price quote
  const { data: buyQuote } = useReadContract({
    address: tokenAddress,
    abi: contentCoinAbi,
    functionName: 'getBuyPrice',
    args: buyAmount ? [parseEther(buyAmount)] : [BigInt(0)],
    enabled: !!tokenAddress && !!buyAmount,
  });

  // Get sell price quote
  const { data: sellQuote } = useReadContract({
    address: tokenAddress,
    abi: contentCoinAbi,
    functionName: 'getSellPrice',
    args: sellAmount ? [parseEther(sellAmount)] : [BigInt(0)],
    enabled: !!tokenAddress && !!sellAmount && !!userBalance && userBalance > 0,
  });

  // Buy transaction
  const { writeContract: buyToken, data: buyHash, isPending: isBuyPending } = useWriteContract();
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash,
  });

  // Sell transaction
  const { writeContract: sellToken, data: sellHash, isPending: isSellPending } = useWriteContract();
  const { isLoading: isSellConfirming, isSuccess: isSellSuccess } = useWaitForTransactionReceipt({
    hash: sellHash,
  });

  const handleBuy = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to buy tokens",
        variant: "destructive",
      });
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid ETH amount",
        variant: "destructive",
      });
      return;
    }

    try {
      await buyToken({
        address: tokenAddress,
        abi: contentCoinAbi,
        functionName: 'buyWithEth',
        args: [userAddress!, BigInt(0)], // minTokensOut = 0 for now
        value: parseEther(buyAmount),
      });
    } catch (error) {
      console.error('Buy error:', error);
      toast({
        title: "Buy Failed",
        description: "Failed to buy tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSell = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to sell tokens",
        variant: "destructive",
      });
      return;
    }

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid token amount",
        variant: "destructive",
      });
      return;
    }

    try {
      await sellToken({
        address: tokenAddress,
        abi: contentCoinAbi,
        functionName: 'sellForEth',
        args: [parseEther(sellAmount), BigInt(0)], // minEthOut = 0 for now
      });
    } catch (error) {
      console.error('Sell error:', error);
      toast({
        title: "Sell Failed",
        description: "Failed to sell tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!tokenDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Token Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The requested Zora token could not be found.
              </p>
              <Link href="/zoraexplore">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Explore
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/zoraexplore">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explore
            </Button>
          </Link>
        </div>

        {/* Token Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {tokenDetails.symbol.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{tokenDetails.name}</h1>
                  <p className="text-xl text-muted-foreground">{tokenDetails.symbol}</p>
                  <Badge className="mt-2">
                    {tokenDetails.type === 'creator' ? 'Creator Coin' : 'Content Coin'}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold">{parseFloat(tokenDetails.price).toFixed(6)} ETH</div>
                <div className={`flex items-center gap-1 text-lg ${tokenDetails.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tokenDetails.change24h >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {Math.abs(tokenDetails.change24h).toFixed(1)}% 24h
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">{tokenDetails.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Market Cap</div>
                <div className="font-semibold">${parseFloat(tokenDetails.marketCap).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">24h Volume</div>
                <div className="font-semibold">${parseFloat(tokenDetails.volume24h).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Holders</div>
                <div className="font-semibold">{tokenDetails.holders.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Your Balance</div>
                <div className="font-semibold">
                  {userBalance ? formatEther(userBalance) : '0.00'} {tokenDetails.symbol}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Trade {tokenDetails.symbol}</CardTitle>
                <CardDescription>
                  Buy and sell {tokenDetails.name} with ETH using Zora's bonding curve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy">Buy</TabsTrigger>
                    <TabsTrigger value="sell">Sell</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="buy" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">ETH Amount</label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    {buyQuote && buyAmount && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">You will receive</div>
                        <div className="font-semibold">
                          {formatEther(buyQuote)} {tokenDetails.symbol}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleBuy} 
                      disabled={isBuyPending || isBuyConfirming || !buyAmount}
                      className="w-full"
                    >
                      {isBuyPending || isBuyConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isBuyPending ? 'Confirming...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Buy {tokenDetails.symbol}
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="sell" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Token Amount</label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        className="mt-1"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Balance: {userBalance ? formatEther(userBalance) : '0.00'} {tokenDetails.symbol}
                      </div>
                    </div>
                    
                    {sellQuote && sellAmount && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">You will receive</div>
                        <div className="font-semibold">
                          {formatEther(sellQuote)} ETH
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleSell} 
                      disabled={isSellPending || isSellConfirming || !sellAmount || !userBalance || userBalance <= 0}
                      className="w-full"
                      variant="outline"
                    >
                      {isSellPending || isSellConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isSellPending ? 'Confirming...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Sell {tokenDetails.symbol}
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Token Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Contract Address</div>
                  <div className="font-mono text-sm break-all">{tokenDetails.address}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Creator</div>
                  <div className="font-mono text-sm break-all">{tokenDetails.creator}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="text-sm">
                    {new Date(tokenDetails.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
