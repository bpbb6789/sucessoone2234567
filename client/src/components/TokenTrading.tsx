import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Loader2, TrendingDown } from 'lucide-react';
import { formatEther, parseEther, type Address, formatUnits, parseUnits } from 'viem';
import { useAccount, useBalance, useWalletClient, usePublicClient } from 'wagmi';
import { tradeCoin } from '@zoralabs/coins-sdk';

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
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
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

  const refetchBalances = () => {
    refetchEthBalance();
    refetchTokenBalance();
  };

  const handleTrade = async () => {
    if (!isConnected || !account || !walletClient || !publicClient) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        variant: "destructive"
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    const supportedChainIds = [8453, 84532];
    const currentChainId = walletClient.chain?.id || 0;

    if (!supportedChainIds.includes(currentChainId)) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Base Mainnet or Base Sepolia",
        variant: "destructive"
      });
      return;
    }

    setIsTrading(true);

    try {
      const tradeParameters = tradeMode === 'buy' ? {
        sell: { type: "eth" as const },
        buy: { type: "erc20" as const, address: tokenAddress },
        amountIn: parseEther(amount),
        slippage: 0.05,
        sender: account,
      } : {
        sell: { type: "erc20" as const, address: tokenAddress },
        buy: { type: "eth" as const },
        amountIn: parseUnits(amount, tokenBalance?.decimals || 18),
        slippage: 0.15,
        sender: account,
      };

      toast({
        title: "Preparing trade...",
        description: "Please confirm the transaction in your wallet",
      });

      // Assuming tradeCoin is an async function that handles the transaction
      await tradeCoin({
        tradeParameters,
        walletClient,
        account: walletClient.account!,
        publicClient,
      });

      toast({
        title: `${tradeMode === 'buy' ? 'Purchase' : 'Sale'} Successful! 🎉`,
        description: `Successfully ${tradeMode === 'buy' ? 'bought' : 'sold'} ${tokenSymbol}`,
      });

      setAmount('');
      setComment('');
      setTimeout(refetchBalances, 2000);

    } catch (error: any) {
      console.error('Trade failed:', error);
      toast({
        title: "Trade failed",
        description: error.shortMessage || error.message || "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setIsTrading(false);
    }
  };

  const setPresetAmount = (preset: string) => {
    setAmount(preset);
  };

  const setMaxAmount = () => {
    if (tradeMode === 'buy' && ethBalance) {
      // Reserve some ETH for gas fees
      const maxAmount = ethBalance.value - parseEther('0.001');
      if (maxAmount > 0) {
        setAmount(formatEther(maxAmount));
      }
    } else if (tradeMode === 'sell' && tokenBalance) {
      setAmount(formatUnits(tokenBalance.value, tokenBalance.decimals));
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6 space-y-6">
        {/* Stats Section */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Market Cap</span>
            <span className="text-green-500">▲ ${marketCap}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">24H Volume</span>
            <span>⏰ $0</span> {/* Placeholder for 24H Volume */}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Creator Earnings</span>
            <span>$0</span> {/* Placeholder for Creator Earnings */}
          </div>
        </div>

        {/* Buy/Sell Toggle */}
        <div className="flex space-x-2">
          <Button
            className={`flex-1 ${tradeMode === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-muted hover:bg-muted/80'}`}
            onClick={() => setTradeMode('buy')}
          >
            Buy
          </Button>
          <Button
            variant="outline"
            className={`flex-1 ${tradeMode === 'sell' ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : ''}`}
            onClick={() => setTradeMode('sell')}
          >
            Sell
          </Button>
        </div>

        {/* Balance Display */}
        <div className="text-center text-sm text-muted-foreground">
          Balance: {tradeMode === 'buy'
            ? (ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : "0") + " ETH"
            : (tokenBalance ? parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals)).toFixed(4) : "0") + " " + tokenSymbol
          }
        </div>

        {/* Amount Input */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg border">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium p-0 h-auto"
              placeholder="0.000111"
              step="0.000001"
              min="0"
            />
            <Badge variant="outline" className="text-xs">
              {tradeMode === 'buy' ? 'ETH' : tokenSymbol}
            </Badge>
          </div>

          {/* Preset Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setPresetAmount(tradeMode === 'buy' ? '0.001' : '1000')}
            >
              {tradeMode === 'buy' ? '0.001 ETH' : '1K'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setPresetAmount(tradeMode === 'buy' ? '0.01' : '10000')}
            >
              {tradeMode === 'buy' ? '0.01 ETH' : '10K'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setPresetAmount(tradeMode === 'buy' ? '0.1' : '100000')}
            >
              {tradeMode === 'buy' ? '0.1 ETH' : '100K'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={setMaxAmount}
            >
              Max
            </Button>
          </div>
        </div>

        {/* Comment Box */}
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="resize-none h-20"
        />

        {/* Trade Button */}
        <Button
          onClick={handleTrade}
          disabled={isTrading || !amount || !isConnected}
          className={`w-full ${tradeMode === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isTrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Trading...
            </>
          ) : (
            tradeMode === 'buy' ? 'Buy' : 'Sell'
          )}
        </Button>

        {/* Network Warning */}
        {walletClient?.chain?.id !== 8453 && (
          <div className="text-xs text-yellow-600 text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
            ⚠️ Switch to Base Mainnet for optimal trading
          </div>
        )}
      </CardContent>
    </Card>
  );
}