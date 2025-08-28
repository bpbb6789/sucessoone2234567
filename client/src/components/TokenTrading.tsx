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
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { pumpFunConfig, CONTRACTS, PUMP_FUN_ABI } from '@/lib/contracts';
import { formatUnits, parseUnits } from 'viem';
import { useWallet } from '@/hooks/useWallet';

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
  currentPrice = "0.0001",
  supply = "1000000",
  marketCap = "100",
  holders = 42
}: TokenTradingProps) {
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
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

  const handleBuy = async () => {
    if (!isConnected) {
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

    setIsLoading(true);

    try {
      // Call the smart contract to buy tokens
      const hash = await writeContract({
        ...pumpFunConfig,
        functionName: 'buy',
        args: [tokenAddress as `0x${string}`, parseUnits(buyAmount, 18), BigInt(0)], // amount in wei, minTokensOut = 0 for now
        value: parseEther(buyAmount), // Send ETH with the transaction
      });

      setCurrentTxHash(hash);

      toast({
        title: "Buy transaction submitted",
        description: `Buying ${buyAmount} ETH worth of ${tokenSymbol}... Transaction: ${hash?.slice(0, 10)}...`,
      });

      setBuyAmount('');
    } catch (error: any) {
      console.error('Buy failed:', error);
      toast({
        title: "Buy failed",
        description: error.shortMessage || "Failed to place buy order",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!isConnected) {
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

    setIsLoading(true);

    try {
      // Call the smart contract to sell tokens
      const hash = await writeContract({
        ...pumpFunConfig,
        functionName: 'sell',
        args: [tokenAddress as `0x${string}`, parseUnits(sellAmount, 18), BigInt(0)], // amount in wei, minEthOut = 0 for now
      });

      setCurrentTxHash(hash);

      toast({
        title: "Sell transaction submitted",
        description: `Selling ${sellAmount} ${tokenSymbol}... Transaction: ${hash?.slice(0, 10)}...`,
      });

      setSellAmount('');
    } catch (error: any) {
      console.error('Sell failed:', error);
      toast({
        title: "Sell failed",
        description: error.shortMessage || "Failed to place sell order",
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
          </CardTitle>
          <CardDescription>
            Buy and sell {tokenName} tokens using the bonding curve pricing
          </CardDescription>
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
                <Label htmlFor="buy-amount">Amount (ETH)</Label>
                <Input
                  id="buy-amount"
                  placeholder="0.1"
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
                <Label htmlFor="sell-amount">Amount ({tokenSymbol})</Label>
                <Input
                  id="sell-amount"
                  placeholder="100"
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
              <Badge variant="secondary" className="text-sm">Bonding Curve</Badge>
              <p className="text-sm text-muted-foreground">
                Prices increase automatically as more tokens are bought, following a mathematical bonding curve
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">Instant Trading</Badge>
              <p className="text-sm text-muted-foreground">
                Buy and sell instantly without waiting for order matches
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}