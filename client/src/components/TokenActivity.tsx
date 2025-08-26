import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock,
  ExternalLink,
  Activity
} from "lucide-react";

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  price: string;
  user: string;
  timestamp: Date;
  txHash?: string;
}

interface TokenActivityProps {
  tokenAddress: string;
  symbol: string;
}

export default function TokenActivity({ tokenAddress, symbol }: TokenActivityProps) {
  // In a real app, this would fetch from your GraphQL API or blockchain indexer
  // For now, we show a placeholder since no real transaction data is available yet
  const transactions: Transaction[] = [];

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const formatNumber = (num: string): string => {
    const value = parseFloat(num);
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Recent Activity
          <Badge variant="secondary" className="ml-2">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Trades will appear here once they happen</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    tx.type === 'buy' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                  }`}>
                    {tx.type === 'buy' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={tx.type === 'buy' ? 'default' : 'destructive'}
                        className={tx.type === 'buy' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                      >
                        {tx.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatNumber(tx.amount)} {symbol}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{tx.user}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(tx.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium">${tx.price}</p>
                  <p className="text-xs text-muted-foreground">
                    ~${(parseFloat(tx.amount) * parseFloat(tx.price)).toFixed(2)}
                  </p>
                  {tx.txHash && (
                    <button
                      onClick={() => window.open(`https://sepolia.basescan.org/tx/${tx.txHash}`, '_blank')}
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="pt-3 border-t">
          <button
            onClick={() => window.open(`https://sepolia.basescan.org/token/${tokenAddress}`, '_blank')}
            className="w-full text-sm text-blue-500 hover:text-blue-600 flex items-center justify-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            View all transactions on BaseScan
          </button>
        </div>
      </CardContent>
    </Card>
  );
}