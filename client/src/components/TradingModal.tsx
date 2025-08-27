import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface TradingModalProps {
  children: React.ReactNode;
  coinAddress: string;
  coinName: string;
  ticker: string;
  currentPrice?: string;
  marketCap?: string;
}

export default function TradingModal({
  children,
  coinAddress,
  coinName,
  ticker,
  currentPrice = "0.000001",
  marketCap = "0"
}: TradingModalProps) {
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBuy = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to buy",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate trading - in real implementation, this would connect to Zora/Uniswap V4
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Buy Order Executed",
        description: `Successfully bought ${buyAmount} ETH worth of ${ticker}`,
      });
      setBuyAmount("");
    } catch (error) {
      toast({
        title: "Trade Failed",
        description: "Failed to execute buy order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to sell",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate trading - in real implementation, this would connect to Zora/Uniswap V4
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sell Order Executed",
        description: `Successfully sold ${sellAmount} ${ticker} tokens`,
      });
      setSellAmount("");
    } catch (error) {
      toast({
        title: "Trade Failed",
        description: "Failed to execute sell order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md" data-testid="trading-modal">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Trade {ticker}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price Info */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">{coinName}</h3>
                <div className="text-2xl font-bold">{currentPrice} ETH</div>
                <div className="text-sm text-muted-foreground">
                  Market Cap: {marketCap} ETH
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Interface */}
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="buy" 
                className="flex items-center gap-1"
                data-testid="tab-buy"
              >
                <TrendingUp className="h-4 w-4" />
                Buy
              </TabsTrigger>
              <TabsTrigger 
                value="sell" 
                className="flex items-center gap-1"
                data-testid="tab-sell"
              >
                <TrendingDown className="h-4 w-4" />
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-3">
              <div>
                <label className="text-sm font-medium">Amount (ETH)</label>
                <Input
                  type="number"
                  placeholder="0.1"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  step="0.001"
                  min="0"
                  data-testid="input-buy-amount"
                />
              </div>
              <Button
                onClick={handleBuy}
                disabled={isLoading || !buyAmount}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-buy"
              >
                {isLoading ? "Processing..." : "Buy"}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-3">
              <div>
                <label className="text-sm font-medium">Amount ({ticker})</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  step="1"
                  min="0"
                  data-testid="input-sell-amount"
                />
              </div>
              <Button
                onClick={handleSell}
                disabled={isLoading || !sellAmount}
                className="w-full bg-red-600 hover:bg-red-700"
                data-testid="button-sell"
              >
                {isLoading ? "Processing..." : "Sell"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="text-xs text-muted-foreground text-center">
            Trading powered by Zora & Uniswap V4
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}