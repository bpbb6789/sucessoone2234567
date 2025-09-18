import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { formatEther, parseEther, type Address } from 'viem';
import { useAccount, useReadContract, useWalletClient, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { tradeCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';

// Zora Trading Status Hook
const useZoraTradingStatus = () => {
  const [status, setStatus] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/zora-trading/status')
      .then(res => res.json())
      .then(setStatus)
      .catch(console.error);
  }, []);
  
  return status;
};

// Zora Trading configuration via API endpoints
const ZORA_TRADING_API = {
  buy: '/api/zora-trading/buy',
  sell: '/api/zora-trading/sell',
  quote: '/api/zora-trading/quote',
  status: '/api/zora-trading/status'
};

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
  const tradingStatus = useZoraTradingStatus();
  const [isLoading, setIsLoading] = useState(false);

  // Smart contract interaction hooks
  const { writeContract, isPending: isWritePending, error: writeError } = useWriteContract();
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: currentTxHash,
  });

  // Get user's token balance
  const { isConnected, address: account } = useAccount();
  const { data: userBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: isConnected && account ? [account] : undefined,
    query: {
      enabled: isConnected && !!account,
    },
  });

  // Get user's ETH balance
  const { data: ethBalance } = useReadContract({
    address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: isConnected && account ? [account] : undefined,
    query: {
      enabled: false, // Disable this for now, will use wallet balance
    },
  });

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

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

    // Check if we're on Base Mainnet
    if (walletClient.chain?.id !== 8453) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Base Mainnet to use Zora Trading",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const tradeParameters = {
        sell: { type: "eth" as const },
        buy: {
          type: "erc20" as const,
          address: tokenAddress,
        },
        amountIn: parseEther(buyAmount),
        slippage: 0.05,
        sender: account,
      };

      const receipt = await tradeCoin({
        tradeParameters,
        walletClient,
        account: walletClient.account!,
        publicClient,
      });

      toast({
        title: "Purchase Successful! 🎉",
        description: `Successfully bought ${tokenSymbol} tokens`,
      });
      setBuyAmount('');
    } catch (error: any) {
      console.error('Buy failed:', error);
      toast({
        title: "Buy failed",
        description: error.message || "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

    // Check if we're on Base Mainnet
    if (walletClient.chain?.id !== 8453) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Base Mainnet to use Zora Trading",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const tradeParameters = {
        sell: { 
          type: "erc20" as const, 
          address: tokenAddress
        },
        buy: { type: "eth" as const },
        amountIn: parseUnits(sellAmount, 18),
        slippage: 0.15,
        sender: account,
      };

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
      setSellAmount('');
    } catch (error: any) {
      console.error('Sell failed:', error);
      toast({
        title: "Sell failed",
        description: error.message || "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
              <p className="text-lg font-bold">$0</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-2 p-4">
            <Users className="h-6 w-6 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Holders</p>
              <p className="text-lg font-bold">0</p>
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
            {tradingStatus && !tradingStatus.available && (
              <Badge variant="secondary" className="text-xs">Testnet Mode</Badge>
            )}
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
                    onClick={() => setBuyAmount("0.1")} // Set a reasonable default since we can't easily get ETH balance
                  >
                    Max Balance: Loading...
                  </Button>
                </div>
                <Input
                  id="buy-amount"
                  placeholder="0.001"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  data-testid="input-buy-amount"
                />
              </div>

              {buyAmount && (
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    You'll receive approximately {(parseFloat(buyAmount) / parseFloat(currentPrice)).toFixed(2)} {tokenSymbol}
                  </p>
                </div>
              )}

              <Button
                onClick={handleBuy}
                disabled={(isLoading || isWritePending || isTxLoading) || !buyAmount || !isConnected}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-buy-token"
              >
                {(isLoading || isWritePending || isTxLoading) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isWritePending ? 'Preparing...' : isTxLoading ? 'Confirming...' : 'Processing...'}
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
                    onClick={() => {
                      if (userBalance) {
                        setSellAmount(formatUnits(userBalance, 18));
                      }
                    }}
                  >
                    Balance: {userBalance ? formatUnits(userBalance, 18) : "0"} {tokenSymbol}
                  </Button>
                </div>
                <Input
                  id="sell-amount"
                  placeholder="0"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  data-testid="input-sell-amount"
                />
              </div>

              {sellAmount && (
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    You'll receive approximately {(parseFloat(sellAmount) * parseFloat(currentPrice)).toFixed(4)} ETH
                  </p>
                </div>
              )}

              <Button
                onClick={handleSell}
                disabled={(isLoading || isWritePending || isTxLoading) || !sellAmount || !isConnected || (userBalance !== undefined && BigInt(sellAmount) > userBalance)}
                className="w-full bg-red-600 hover:bg-red-700"
                data-testid="button-sell-token"
              >
                {(isLoading || isWritePending || isTxLoading) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isWritePending ? 'Preparing...' : isTxLoading ? 'Confirming...' : 'Processing...'}
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
          <CardTitle>How Trading Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">Zora Trading SDK</Badge>
              <p className="text-sm text-muted-foreground">
                Advanced trading with automatic routing and gasless approvals using Zora's infrastructure
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">Multi-Token Support</Badge>
              <p className="text-sm text-muted-foreground">
                Trade with ETH, USDC, ZORA and other tokens with built-in slippage protection
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}