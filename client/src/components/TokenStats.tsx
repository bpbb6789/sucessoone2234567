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
    isOnBondingCurve?: boolean;
    progress?: number;
  };
}

export default function TokenStats({ tokenData }: TokenStatsProps) {
  const formatNumber = (num: string | number): string => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value) || value === 0) return '0';
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
              <p className="text-xl font-bold">${formatNumber(tokenData.marketCap)}</p>
              {tokenData.isOnBondingCurve && (
                <p className="text-xs text-blue-500">Bonding Curve</p>
              )}
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

      {/* Bonding Curve Progress - Full Width if applicable */}
      {tokenData.isOnBondingCurve && tokenData.progress !== undefined && (
        <Card className="col-span-2 md:col-span-4 border-gradient border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Bonding Curve Progress</h3>
              </div>
              <span className="text-lg font-bold text-purple-500">{tokenData.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-3">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-3"
                style={{ width: `${Math.min(tokenData.progress, 100)}%` }}
              >
                {tokenData.progress > 15 && (
                  <span className="text-white text-xs font-bold">
                    {tokenData.progress}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Current progress to graduation</span>
              <span className="font-medium">Target: $69K market cap</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              When the market cap reaches $69K, all liquidity from the bonding curve will be deposited into Uniswap and burned. 
              This creates permanent liquidity and enables decentralized trading.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}