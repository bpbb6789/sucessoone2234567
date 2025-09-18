import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity, 
  Clock,
  Zap,
  Target,
  BarChart3
} from "lucide-react";

interface TokenStatsProps {
  tokenData: {
    price: string;
    marketCap: string;
    volume24h: string;
    holders: number;
    change24h?: number;
  };
}

export default function TokenStats({ tokenData }: TokenStatsProps) {
  const formatNumber = (num: string | number): string => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value) || value === 0) return 'No data';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getPriceChangeColor = (change?: number) => {
    if (!change) return "text-gray-500";
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  const getPriceChangeIcon = (change?: number) => {
    if (!change) return null;
    return change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Price */}
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-xl font-bold text-green-500">
                ${tokenData.price}
              </p>
              {tokenData.change24h !== undefined && (
                <div className={`flex items-center gap-1 text-xs ${getPriceChangeColor(tokenData.change24h)}`}>
                  {getPriceChangeIcon(tokenData.change24h)}
                  <span>{Math.abs(tokenData.change24h).toFixed(2)}%</span>
                </div>
              )}
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Market Cap */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-xl font-bold">
                {tokenData.marketCap === '0' || tokenData.marketCap === '0.00' ? 'No data' : `$${formatNumber(tokenData.marketCap)}`}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* 24h Volume */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-xl font-bold">${formatNumber(tokenData.volume24h)}</p>
              <p className="text-xs text-orange-500">Last 24h</p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      {/* Holders */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Holders</p>
              <p className="text-xl font-bold">{tokenData.holders}</p>
              <p className="text-xs text-purple-500">Unique wallets</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}