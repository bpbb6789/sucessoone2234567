import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAccount } from "@/hooks/useWallet";
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
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TokenDetail() {
  const params = useParams();
  const padId = params.id;
  const { address, connect } = useAccount();
  const { toast } = useToast();
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");

  // Fetch pad data
  const { data: pad, isLoading } = useQuery({
    queryKey: [`/api/pads/${padId}`],
    enabled: !!padId,
  });

  // Mock data - in real app this would come from blockchain
  const tokenStats = {
    price: pad?.currentPrice || "0.000001",
    marketCap: pad?.marketCap || "0",
    volume24h: pad?.volume24h || "0",
    holders: pad?.holders || 0,
    change24h: Math.random() > 0.5 ? Math.random() * 50 : -(Math.random() * 30),
  };

  const handleTrade = async () => {
    if (!address) {
      await connect();
      return;
    }

    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid trade amount",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement actual trading logic with Doppler V4 SDK
    toast({
      title: "Trade Initiated",
      description: `${tradeType === 'buy' ? 'Buying' : 'Selling'} ${tradeAmount} ${pad?.tokenSymbol}`,
    });
  };

  const copyAddress = () => {
    if (pad?.tokenAddress) {
      navigator.clipboard.writeText(pad.tokenAddress);
      toast({
        title: "Address Copied",
        description: "Token address copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-800 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-96 bg-gray-800 rounded-lg"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-gray-800 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pad) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Token Not Found</h2>
          <p className="text-gray-400">The requested token does not exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" data-testid="token-detail">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={`https://gateway.pinata.cloud/ipfs/${pad.mediaCid}`}
              alt={pad.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold">{pad.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400">{pad.tokenSymbol}</span>
                <Badge className={cn(
                  "text-xs",
                  pad.status === 'graduated' ? 'bg-purple-500' : 'bg-green-500'
                )}>
                  {pad.status === 'graduated' ? 'GRADUATED' : 'DEPLOYED'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Token Address */}
          {pad.tokenAddress && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Token Address:</span>
              <code className="bg-gray-800 px-2 py-1 rounded text-xs">
                {pad.tokenAddress.slice(0, 6)}...{pad.tokenAddress.slice(-4)}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyAddress}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => window.open(`https://sepolia.basescan.org/token/${pad.tokenAddress}`, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart and Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-400">Price</span>
                  </div>
                  <div className="text-lg font-bold">${tokenStats.price}</div>
                  <div className={cn(
                    "text-xs flex items-center gap-1",
                    tokenStats.change24h > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {tokenStats.change24h > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(tokenStats.change24h).toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-400">Market Cap</span>
                  </div>
                  <div className="text-lg font-bold">
                    ${parseInt(tokenStats.marketCap).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-400">24h Volume</span>
                  </div>
                  <div className="text-lg font-bold">
                    ${parseInt(tokenStats.volume24h).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-gray-400">Holders</span>
                  </div>
                  <div className="text-lg font-bold">{tokenStats.holders}</div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Placeholder */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2" />
                    <p>Price chart coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {pad.description && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{pad.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Trading */}
          <div className="space-y-6">
            {/* Trading Card */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-green-500" />
                  Trade {pad.tokenSymbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={tradeType === "buy" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTradeType("buy")}
                    className={cn(
                      "flex-1",
                      tradeType === "buy" && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    Buy
                  </Button>
                  <Button
                    variant={tradeType === "sell" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTradeType("sell")}
                    className={cn(
                      "flex-1",
                      tradeType === "sell" && "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    Sell
                  </Button>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">
                    {tradeType === "buy" ? "ETH Amount" : `${pad.tokenSymbol} Amount`}
                  </label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                {/* Estimated Output */}
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">You will receive</div>
                  <div className="font-medium">
                    ~{tradeAmount ? (parseFloat(tradeAmount) / parseFloat(tokenStats.price)).toFixed(2) : "0.00"} {tradeType === "buy" ? pad.tokenSymbol : "ETH"}
                  </div>
                </div>

                {/* Trade Button */}
                <Button 
                  onClick={handleTrade}
                  className={cn(
                    "w-full",
                    tradeType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  )}
                  disabled={!tradeAmount}
                >
                  {!address ? "Connect Wallet" : `${tradeType === "buy" ? "Buy" : "Sell"} ${pad.tokenSymbol}`}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  Trading powered by pump.fun bonding curves
                </div>
              </CardContent>
            </Card>

            {/* Token Info */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Token Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name</span>
                  <span>{pad.tokenName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Symbol</span>
                  <span>{pad.tokenSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Supply</span>
                  <span>{pad.totalSupply}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <Badge className={cn(
                    pad.status === 'graduated' ? 'bg-purple-500' : 'bg-green-500'
                  )}>
                    {pad.status === 'graduated' ? 'GRADUATED' : 'DEPLOYED'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className="text-sm">
                      {new Date(pad.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}