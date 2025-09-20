import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

interface DexScreenerChartProps {
  tokenAddress: string;
  tokenSymbol: string;
}

interface DexScreenerData {
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  pairUrl?: string;
  dexName?: string;
}

export function DexScreenerChart({ tokenAddress, tokenSymbol }: DexScreenerChartProps) {
  const [data, setData] = useState<DexScreenerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch DexScreener data
  useEffect(() => {
    const fetchDexScreenerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Only fetch if we have a valid contract address (starts with 0x)
        if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
          setError('Invalid contract address');
          setData(null);
          return;
        }

        const response = await fetch(`/api/dexscreener/${tokenAddress}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trading data');
        }

        const dexData = await response.json();
        setData(dexData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress) {
      fetchDexScreenerData();
    }
  }, [tokenAddress]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || !data.price) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Trading Data Available</h3>
            <p className="text-muted-foreground mb-4">
              {tokenSymbol} is not actively traded on decentralized exchanges yet.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Create a liquidity pool to enable trading</p>
              <p>• Token needs trading volume to appear on DexScreener</p>
              <p>• Check back once trading activity begins</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(2)}M`;
    if (marketCap >= 1000) return `$${(marketCap / 1000).toFixed(2)}K`;
    return `$${marketCap.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Live Trading Data</h3>
              <p className="text-sm text-muted-foreground">Real-time data from DexScreener</p>
            </div>
            {data.pairUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={data.pairUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on DexScreener
                </a>
              </Button>
            )}
          </div>

          {/* Price Display */}
          <div className="text-center py-4">
            <div className="text-3xl font-bold">
              {formatPrice(data.price)}
            </div>
            {data.priceChange24h !== null && (
              <div className={`flex items-center justify-center gap-1 mt-2 ${
                data.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data.priceChange24h >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {data.priceChange24h >= 0 ? '+' : ''}{data.priceChange24h.toFixed(2)}%
                </span>
                <span className="text-muted-foreground text-sm">24h</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {data.marketCap && (
              <div className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Market Cap</div>
                <div className="font-semibold">{formatMarketCap(data.marketCap)}</div>
              </div>
            )}
            {data.volume24h && (
              <div className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">24h Volume</div>
                <div className="font-semibold">{formatVolume(data.volume24h)}</div>
              </div>
            )}
          </div>

          {/* DEX Badge */}
          {data.dexName && (
            <div className="flex justify-center">
              <Badge variant="secondary">
                Trading on {data.dexName}
              </Badge>
            </div>
          )}

          {/* Chart Placeholder */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="text-center text-muted-foreground">
              <p className="text-sm mb-2">Live Chart Available on DexScreener</p>
              <p className="text-xs">Click "View on DexScreener" above for interactive charts</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}