"use client"
// Zora SDK focused trading component - no PumpFun dependencies
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MOCK_WETH_ADDRESS } from "@/lib/addresses";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Address, erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { useBuyCreatorCoin, useSellCreatorCoin } from "@/hooks/useCreatorCoins";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface TokenData {
  id: string;
  coinAddress: string;
  symbol: string;
  name: string;
}

export function BuySell({ tokenData }: { tokenData: TokenData }) {
  const queryClient = useQueryClient()
  const { address: accountAddress } = useAccount() // Renamed to avoid conflict with tokenData.address
  const { toast } = useToast()
  const [buyAmount, setBuyAmount] = useState("")
  const [sellAmount, setSellAmount] = useState("")
  const [buyComment, setBuyComment] = useState("")

  // Assuming these are available from context or props, or need to be fetched/defined.
  // For the purpose of this edit, let's assume they are defined elsewhere or within this component's scope if needed.
  const tokenAddress = tokenData.coinAddress; // Assuming tokenAddress is the coinAddress from tokenData
  const tokenSymbol = tokenData.symbol; // Assuming tokenSymbol is the symbol from tokenData
  const slippage = 2; // Example slippage, replace with actual value if dynamic
  const [isLoading, setIsLoading] = useState(false); // Assuming isLoading state is needed for buy/sell operations
  const ethAmount = buyAmount; // Alias buyAmount to ethAmount for clarity in handleBuy
  const ethValue = parseFloat(buyAmount); // Parse buyAmount to float

  // Zora SDK trading hooks
  const buyMutation = useBuyCreatorCoin()
  const sellMutation = useSellCreatorCoin()

  // Read user balances
  const { data: wethBalance } = useReadContract({
    address: MOCK_WETH_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [accountAddress as Address]
  })

  const { data: tokenBalance } = useReadContract({
    address: tokenData.coinAddress as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [accountAddress as Address]
  })

  const handleBuy = async () => {
    if (!accountAddress || !tokenAddress) return;

    // Validate minimum ETH amount for Base Sepolia
    const ethValue = parseFloat(ethAmount);
    if (ethValue < 0.00001) {
      toast({
        title: "Amount Too Small",
        description: "Minimum buy amount is 0.00001 ETH on Base Sepolia",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const buyParams = {
        tokenAddress: tokenAddress as Address,
        ethAmount: ethAmount,
        buyerAddress: accountAddress,
        slippage: slippage
      };

      await buyMutation.mutateAsync(buyParams);

      // Refetch data
      queryClient.invalidateQueries({ queryKey: ['creator-coin-price'] });

      toast({
        title: "Purchase Successful! 🎉",
        description: `Successfully bought ${tokenSymbol} tokens`,
      });

      setBuyAmount("");
    } catch (error) {
      console.error('Buy failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Purchase Failed",
        description: errorMessage.includes('network') ? 
          "Network error. Please check your Base Sepolia connection." : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!accountAddress || !sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid token amount to sell",
        variant: "destructive"
      })
      return
    }

    try {
      await sellMutation.mutateAsync({
        coinId: tokenData.id,
        userAddress: accountAddress,
        tokenAmount: sellAmount
      })

      toast({
        title: "Sell successful!",
        description: `Sold ${sellAmount} ${tokenData.symbol} tokens`
      })

      setSellAmount("")
    } catch (error) {
      console.error('Sell failed:', error)
      toast({
        title: "Sell failed",
        description: error instanceof Error ? error.message : "Transaction failed",
        variant: "destructive"
      })
    }
  }

  const isBuyDisabled = !buyAmount || parseFloat(buyAmount) <= 0 || !accountAddress || buyMutation.isPending || isLoading
  const isSellDisabled = !sellAmount || parseFloat(sellAmount) <= 0 || !accountAddress || sellMutation.isPending
  const hasWethBalance = wethBalance && wethBalance > 0n
  const hasTokenBalance = tokenBalance && tokenBalance > 0n

  return (
    <Tabs defaultValue="Buy" className="w-[400px]">
      <TabsList className="grid h-[50px] w-full rounded-xl grid-cols-2">
        <TabsTrigger value="Buy" className="h-full rounded-xl flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Buy
        </TabsTrigger>
        <TabsTrigger value="Sell" className="h-full rounded-xl flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Sell
        </TabsTrigger>
      </TabsList>

      <TabsContent value="Buy">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Amount (ETH)</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBuyAmount(hasWethBalance ? formatUnits(wethBalance!, 18) : "0")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Max: {hasWethBalance ? formatUnits(wethBalance!, 18) : "0"} ETH
                </Button>
              </div>
              <div className="relative">
                <Input 
                  type="text" 
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.0"
                  className="pr-16 h-12 text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="text-sm text-muted-foreground">ETH</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {["0.001", "0.01", "0.1"].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBuyAmount(amount)}
                  className="flex-1"
                >
                  {amount} ETH
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (Optional)</label>
              <Textarea
                value={buyComment}
                onChange={(e) => setBuyComment(e.target.value)}
                placeholder="Add a comment with your purchase..."
                className="resize-none"
                rows={3}
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              onClick={handleBuy}
              disabled={isBuyDisabled}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {buyMutation.isPending || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buying...
                </>
              ) : (
                `Buy ${tokenData.symbol}`
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="Sell">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Amount ({tokenData.symbol})</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSellAmount(hasTokenBalance ? formatUnits(tokenBalance!, 18) : "0")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Max: {hasTokenBalance ? formatUnits(tokenBalance!, 18) : "0"} {tokenData.symbol}
                </Button>
              </div>
              <div className="relative">
                <Input 
                  type="text" 
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="0.0"
                  className="pr-20 h-12 text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="text-sm text-muted-foreground">{tokenData.symbol}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {["25%", "50%", "100%"].map((percent) => (
                <Button
                  key={percent}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!hasTokenBalance) return;
                    const balance = parseFloat(formatUnits(tokenBalance!, 18));
                    const percentage = parseInt(percent) / 100;
                    setSellAmount((balance * percentage).toString());
                  }}
                  className="flex-1"
                  disabled={!hasTokenBalance}
                >
                  {percent}
                </Button>
              ))}
            </div>

            {!hasTokenBalance && (
              <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                You don't own any {tokenData.symbol} tokens
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button 
              onClick={handleSell}
              disabled={isSellDisabled}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
              variant="destructive"
            >
              {sellMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Selling...
                </>
              ) : (
                `Sell ${tokenData.symbol}`
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}