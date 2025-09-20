import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, DollarSign, Users, Loader2 } from 'lucide-react';
import { formatEther, parseEther, type Address, formatUnits, parseUnits } from 'viem';
import { useAccount, useBalance, useWalletClient, usePublicClient } from 'wagmi';
import { tradeCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';

interface TokenTradingProps {
  tokenAddress: Address;
  tokenName: string;
  tokenSymbol: string;
  currentPrice?: string;
  supply?: string;
  marketCap?: string;
  holders?: number;
}

export function TokenTrading({
  tokenAddress,
  tokenName,
  tokenSymbol,
  currentPrice = "0",
  supply = "0",
  marketCap = "0",
  holders = 0
}: TokenTradingProps) {
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);

  const { isConnected, address: account } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Get user's ETH balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: account,
  });

  // Get user's token balance
  const { data: tokenBalance, refetch: refetchTokenBalance } = useBalance({
    address: account,
    token: tokenAddress,
  });

  // Refetch balances after trades
  const refetchBalances = () => {
    refetchEthBalance();
    refetchTokenBalance();
  };

  const handleBuy = async () => {
    if (!isConnected || !account || !walletClient || !publicClient) {
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
        description: "Please enter a valid buy amount",
        variant: "destructive"
      });
      return;
    }

    // Check if we're on a supported network (Base Mainnet or Base Sepolia)
    const supportedChainIds = [8453, 84532]; // Base Mainnet, Base Sepolia
    const currentChainId = walletClient.chain?.id || 0;

    if (!supportedChainIds.includes(currentChainId)) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Base Mainnet or Base Sepolia to trade tokens",
        variant: "destructive"
      });
      return;
    }

    // Note: For Base Sepolia, we'll use our own trading implementation
    if (currentChainId === 84532) {
      toast({
        title: "Base Sepolia Trading",
        description: "Trading on Base Sepolia testnet - some features may be limited",
      });
    }

    // Check if user has enough ETH
    const buyAmountWei = parseEther(buyAmount);
    if (ethBalance && buyAmountWei > ethBalance.value) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough ETH for this trade",
        variant: "destructive"
      });
      return;
    }

    setIsTrading(true);

    try {
      const tradeParameters = {
        sell: { type: "eth" as const },
        buy: {
          type: "erc20" as const,
          address: tokenAddress,
        },
        amountIn: buyAmountWei,
        slippage: 0.05, // 5% slippage
        sender: account,
      };

      toast({
        title: "Preparing trade...",
        description: "Please confirm the transaction in your wallet",
      });

      const receipt = await tradeCoin({
        tradeParameters,
        walletClient,
        account: walletClient.account!,
        publicClient,
      });

      toast({
        title: "Purchase Successful! 🎉",
        description: `Successfully bought ${tokenSymbol} tokens for ${buyAmount} ETH`,
      });

      // Clear input and refresh balances
      setBuyAmount('');
      setTimeout(refetchBalances, 2000);

    } catch (error: any) {
      console.error('Buy failed:', error);
      toast({
        title: "Buy failed",
        description: error.shortMessage || error.message || "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setIsTrading(false);
    }
  };

  const handleSell = async () => {
    if (!isConnected || !account || !walletClient || !publicClient) {
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
        description: "Please enter a valid sell amount",
        variant: "destructive"
      });
      return;
    }

    // Check if we're on a supported network (Base Mainnet or Base Sepolia)
    const supportedChainIds = [8453, 84532]; // Base Mainnet, Base Sepolia
    const currentChainId = walletClient.chain?.id || 0;

    if (!supportedChainIds.includes(currentChainId)) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Base Mainnet or Base Sepolia to trade tokens",
        variant: "destructive"
      });
      return;
    }

    // Note: For Base Sepolia, we'll use our own trading implementation
    if (currentChainId === 84532) {
      toast({
        title: "Base Sepolia Trading",
        description: "Trading on Base Sepolia testnet - some features may be limited",
      });
    }

    // Check if user has enough tokens
    const sellAmountWei = parseUnits(sellAmount, tokenBalance?.decimals || 18);
    if (tokenBalance && sellAmountWei > tokenBalance.value) {
      toast({
        title: "Insufficient balance",
        description: `You don't have enough ${tokenSymbol} tokens`,
        variant: "destructive"
      });
      return;
    }

    setIsTrading(true);

    try {
      const tradeParameters = {
        sell: { 
          type: "erc20" as const, 
          address: tokenAddress
        },
        buy: { type: "eth" as const },
        amountIn: sellAmountWei,
        slippage: 0.15, // 15% slippage for sells
        sender: account,
      };

      toast({
        title: "Preparing trade...",
        description: "Please confirm the transaction in your wallet",
      });

      const receipt = await tradeCoin({
        tradeParameters,
        walletClient,
        account: walletClient.account!,
        publicClient,
      });

      toast({
        title: "Sale Successful! 🎉",
        description: `Successfully sold ${sellAmount} ${tokenSymbol}`,
      });

      // Clear input and refresh balances
      setSellAmount('');
      setTimeout(refetchBalances, 2000);

    } catch (error: any) {
      console.error('Sell failed:', error);
      toast({
        title: "Sell failed",
        description: error.shortMessage || error.message || "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setIsTrading(false);
    }
  };

  const setMaxEth = () => {
    if (ethBalance) {
      // Reserve some ETH for gas fees
      const maxAmount = ethBalance.value - parseEther('0.001');
      if (maxAmount > 0) {
        setBuyAmount(formatEther(maxAmount));
      }
    }
  };

  const setMaxTokens = () => {
    if (tokenBalance) {
      setSellAmount(formatUnits(tokenBalance.value, tokenBalance.decimals));
    }
  };

  return (
    <div className="space-y-6">
      {/* Token Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center space-x-2 p-4">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Price</p>
              <p className="text-lg font-bold">${currentPrice}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-2 p-4">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Market Cap</p>
              <p className="text-lg font-bold">${marketCap}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-2 p-4">
            <Users className="h-6 w-6 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Holders</p>
              <p className="text-lg font-bold">{holders}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-2 p-4">
            <TrendingDown className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Supply</p>
              <p className="text-lg font-bold">{parseInt(supply).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trade {tokenSymbol}
            <Badge variant="outline" className="text-xs">Zora SDK</Badge>
          </CardTitle>
          <CardDescription>
            Buy and sell tokens using Zora's advanced trading infrastructure on Base Mainnet
          </CardDescription>
          {walletClient?.chain?.id !== 8453 && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                ⚠️ Zora Trading requires Base Mainnet. Please switch networks in your wallet.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="text-green-600 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="text-red-600 data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="buy-amount">Amount (ETH)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 hover:text-white h-auto p-1"
                    onClick={setMaxEth}
                    disabled={!ethBalance}
                  >
                    Balance: {ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : "0"} ETH
                  </Button>
                </div>
                <Input
                  id="buy-amount"
                  placeholder="0.001"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  disabled={isTrading}
                />
              </div>

              {buyAmount && parseFloat(buyAmount) > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Trading {buyAmount} ETH for {tokenSymbol} tokens
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    Slippage: 5% • Network fees apply
                  </p>
                </div>
              )}

              <Button
                onClick={handleBuy}
                disabled={isTrading || !buyAmount || !isConnected || walletClient?.chain?.id !== 8453}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isTrading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Trading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Buy {tokenSymbol}
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sell-amount">Amount ({tokenSymbol})</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 hover:text-white h-auto p-1"
                    onClick={setMaxTokens}
                    disabled={!tokenBalance}
                  >
                    Balance: {tokenBalance ? parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals)).toFixed(4) : "0"} {tokenSymbol}
                  </Button>
                </div>
                <Input
                  id="sell-amount"
                  placeholder="0"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  disabled={isTrading}
                />
              </div>

              {sellAmount && parseFloat(sellAmount) > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Trading {sellAmount} {tokenSymbol} for ETH
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                    Slippage: 15% • Network fees apply
                  </p>
                </div>
              )}

              <Button
                onClick={handleSell}
                disabled={isTrading || !sellAmount || !isConnected || walletClient?.chain?.id !== 8453 || !tokenBalance || parseUnits(sellAmount || "0", tokenBalance?.decimals || 18) > (tokenBalance?.value || 0n)}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isTrading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Trading...
                  </>
                ) : (
                  <>
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Sell {tokenSymbol}
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Trading Info */}
      <Card>
        <CardHeader>
          <CardTitle>Real Trading with Zora SDK</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">✅ Live Trading</Badge>
              <p className="text-sm text-muted-foreground">
                Real trades executed on Base Mainnet using Zora's trading infrastructure
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">🛡️ Secure Permits</Badge>
              <p className="text-sm text-muted-foreground">
                Gasless approvals with permit signatures for ERC20 token trades
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">📊 Slippage Protection</Badge>
              <p className="text-sm text-muted-foreground">
                Automatic slippage protection: 5% for buys, 15% for sells
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">🔄 Auto-routing</Badge>
              <p className="text-sm text-muted-foreground">
                Semi-automatic routing for optimal trade execution
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}