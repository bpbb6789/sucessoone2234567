// Advanced Trading Component with Zora Hook Integration
"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  BarChart3, 
  RefreshCw,
  Target,
  Coins,
  Activity
} from "lucide-react";

interface AdvancedTradingProps {
  coinId: string;
  coinData: {
    id: string;
    coinAddress: string;
    symbol: string;
    name: string;
    hookAddress?: string;
    uniswapV4Pool?: string;
  };
}

interface HookAnalytics {
  totalPools: number;
  totalVolume: string;
  totalRewardsDistributed: string;
  activeTraders: number;
  averageAPY: number;
}

interface TradingAnalytics {
  volume24h: string;
  volumeLastHour: string;
  priceChange24h: number;
  totalTrades: number;
  recentTrades: Array<{
    amount: string;
    price: string;
    tradeType: string;
    createdAt: string;
  }>;
  hookAnalytics?: HookAnalytics;
}

export function AdvancedTrading({ coinId, coinData }: AdvancedTradingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("trading");
  
  // Advanced Pool Creation State
  const [poolConfig, setPoolConfig] = useState({
    hookType: "CONTENT",
    minLiquidity: "0.1",
    maxSlippage: 5,
    autoRebalance: true,
    lpRewardPercentage: 33.33,
    marketRewardPercentage: 66.67
  });

  // Multi-Hop Trading State
  const [multiHopConfig, setMultiHopConfig] = useState({
    tradingPath: [coinData.coinAddress, ""],
    amountIn: "",
    minAmountOut: "",
    slippageTolerance: 2
  });

  // Fetch real-time trading analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/trading/analytics', coinId],
    queryFn: async () => {
      const response = await fetch(`/api/trading/analytics/${coinId}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json() as Promise<TradingAnalytics>;
    },
    refetchInterval: 30000 // Update every 30 seconds
  });

  // Fetch hook analytics dashboard
  const { data: hookDashboard, isLoading: hookLoading } = useQuery({
    queryKey: ['/api/trading/hooks/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/trading/hooks/analytics');
      if (!response.ok) throw new Error('Failed to fetch hook analytics');
      return response.json();
    },
    refetchInterval: 60000 // Update every minute
  });

  // Create Advanced Pool Mutation
  const createAdvancedPool = useMutation({
    mutationFn: async (config: typeof poolConfig) => {
      return apiRequest('POST', '/api/trading/pools/advanced', {
        coinId,
        ...config
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Advanced Pool Created!",
        description: `Pool created with automated features enabled. Pool ID: ${data.poolId?.slice(0, 8)}...`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/analytics', coinId] });
    },
    onError: (error) => {
      toast({
        title: "Pool Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create advanced pool",
        variant: "destructive"
      });
    }
  });

  // Multi-Hop Trading Mutation
  const executeMultiHop = useMutation({
    mutationFn: async (config: typeof multiHopConfig & { traderAddress: string }) => {
      return apiRequest('POST', '/api/trading/multihop', {
        tradingPath: config.tradingPath,
        amountIn: config.amountIn,
        minAmountOut: config.minAmountOut,
        traderAddress: config.traderAddress
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Multi-Hop Trade Executed!",
        description: `Trade completed successfully. Output: ${data.amountOut}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/analytics', coinId] });
    },
    onError: (error) => {
      toast({
        title: "Trade Failed",
        description: error instanceof Error ? error.message : "Multi-hop trade failed",
        variant: "destructive"
      });
    }
  });

  // Distribute Rewards Mutation
  const distributeRewards = useMutation({
    mutationFn: async () => {
      if (!coinData.uniswapV4Pool || !coinData.hookAddress) {
        throw new Error('Pool ID and hook address required');
      }
      return apiRequest('POST', `/api/trading/rewards/distribute/${coinData.uniswapV4Pool}`, {
        hookAddress: coinData.hookAddress
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Rewards Distributed!",
        description: `${data.rewardData.totalRewards} ETH distributed to participants`
      });
    },
    onError: (error) => {
      toast({
        title: "Reward Distribution Failed",
        description: error instanceof Error ? error.message : "Failed to distribute rewards",
        variant: "destructive"
      });
    }
  });

  const handleCreateAdvancedPool = () => {
    createAdvancedPool.mutate(poolConfig);
  };

  const handleMultiHopTrade = () => {
    // You would typically get this from wallet connection
    const traderAddress = "0x1234567890123456789012345678901234567890"; // Replace with actual connected address
    executeMultiHop.mutate({ ...multiHopConfig, traderAddress });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 h-12 w-full">
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="advanced-pool" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Advanced Pool
          </TabsTrigger>
          <TabsTrigger value="multi-hop" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Multi-Hop
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Real-Time Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Trading Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : analytics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.volume24h} ETH
                        </div>
                        <div className="text-sm text-muted-foreground">24h Volume</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className={`text-2xl font-bold ${analytics.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analytics.priceChange24h >= 0 ? '+' : ''}{analytics.priceChange24h.toFixed(2)}%
                        </div>
                        <div className="text-sm text-muted-foreground">24h Change</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Recent Trades</Label>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {analytics.recentTrades.map((trade, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded text-sm">
                            <Badge variant={trade.tradeType === 'buy' ? 'default' : 'destructive'}>
                              {trade.tradeType.toUpperCase()}
                            </Badge>
                            <span>{trade.amount} tokens</span>
                            <span>${trade.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">No analytics data available</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Hook Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hookLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : analytics?.hookAnalytics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.hookAnalytics.averageAPY.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Average APY</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {analytics.hookAnalytics.activeTraders}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Traders</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Rewards:</span>
                        <span className="text-sm font-medium">{analytics.hookAnalytics.totalRewardsDistributed} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Pools:</span>
                        <span className="text-sm font-medium">{analytics.hookAnalytics.totalPools}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Hook analytics not available
                    <div className="mt-2">
                      <Button 
                        size="sm" 
                        onClick={handleCreateAdvancedPool}
                        disabled={createAdvancedPool.isPending}
                      >
                        Create Advanced Pool
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Pool Creation Tab */}
        <TabsContent value="advanced-pool">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Create Advanced Pool with Automated Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hook-type">Hook Type</Label>
                    <Select value={poolConfig.hookType} onValueChange={(value) => 
                      setPoolConfig({...poolConfig, hookType: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONTENT">Content Coin Hook</SelectItem>
                        <SelectItem value="CREATOR">Creator Coin Hook</SelectItem>
                        <SelectItem value="CHANNEL">Channel Coin Hook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="min-liquidity">Minimum Liquidity (ETH)</Label>
                    <Input
                      id="min-liquidity"
                      type="number"
                      step="0.01"
                      value={poolConfig.minLiquidity}
                      onChange={(e) => setPoolConfig({...poolConfig, minLiquidity: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-slippage">Max Slippage (%)</Label>
                    <Input
                      id="max-slippage"
                      type="number"
                      step="0.1"
                      value={poolConfig.maxSlippage}
                      onChange={(e) => setPoolConfig({...poolConfig, maxSlippage: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-rebalance">Auto Rebalancing</Label>
                    <Switch
                      id="auto-rebalance"
                      checked={poolConfig.autoRebalance}
                      onCheckedChange={(checked) => setPoolConfig({...poolConfig, autoRebalance: checked})}
                    />
                  </div>

                  <div>
                    <Label>Reward Distribution</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">LP Providers</span>
                        <span className="text-sm font-medium">{poolConfig.lpRewardPercentage}%</span>
                      </div>
                      <Progress value={poolConfig.lpRewardPercentage} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Market Participants</span>
                        <span className="text-sm font-medium">{poolConfig.marketRewardPercentage}%</span>
                      </div>
                      <Progress value={poolConfig.marketRewardPercentage} className="h-2" />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/10">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Advanced Features</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Automated reward distribution</li>
                      <li>• Real-time liquidity optimization</li>
                      <li>• MEV protection</li>
                      <li>• Hook-based fee sharing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateAdvancedPool}
                disabled={createAdvancedPool.isPending}
                className="w-full"
                size="lg"
              >
                {createAdvancedPool.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Advanced Pool...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Create Advanced Pool
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Multi-Hop Trading Tab */}
        <TabsContent value="multi-hop">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Multi-Hop Trading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Trading Path</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      placeholder="Token A Address"
                      value={multiHopConfig.tradingPath[0]}
                      onChange={(e) => setMultiHopConfig({
                        ...multiHopConfig,
                        tradingPath: [e.target.value, multiHopConfig.tradingPath[1]]
                      })}
                    />
                    <Input
                      placeholder="Token B Address"
                      value={multiHopConfig.tradingPath[1]}
                      onChange={(e) => setMultiHopConfig({
                        ...multiHopConfig,
                        tradingPath: [multiHopConfig.tradingPath[0], e.target.value]
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount-in">Amount In (ETH)</Label>
                    <Input
                      id="amount-in"
                      type="number"
                      step="0.001"
                      value={multiHopConfig.amountIn}
                      onChange={(e) => setMultiHopConfig({...multiHopConfig, amountIn: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-amount-out">Min Amount Out</Label>
                    <Input
                      id="min-amount-out"
                      type="number"
                      step="0.001"
                      value={multiHopConfig.minAmountOut}
                      onChange={(e) => setMultiHopConfig({...multiHopConfig, minAmountOut: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleMultiHopTrade}
                disabled={executeMultiHop.isPending || !multiHopConfig.amountIn || !multiHopConfig.minAmountOut}
                className="w-full"
                size="lg"
              >
                {executeMultiHop.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing Trade...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Execute Multi-Hop Trade
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Trading Tab (Enhanced) */}
        <TabsContent value="trading">
          <div className="space-y-4">
            {coinData.hookAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Automated Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        This token has automated reward distribution enabled
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Hook: {coinData.hookAddress.slice(0, 8)}...{coinData.hookAddress.slice(-6)}
                      </p>
                    </div>
                    <Button 
                      onClick={() => distributeRewards.mutate()}
                      disabled={distributeRewards.isPending}
                      variant="outline"
                    >
                      {distributeRewards.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Distribute Rewards'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="text-center text-muted-foreground">
              Use the enhanced BuySell component for standard trading operations
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}