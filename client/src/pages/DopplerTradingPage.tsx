
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, Clock, Zap } from 'lucide-react';

interface DopplerTokenInfo {
  address: string;
  name: string;
  symbol: string;
  currentPrice: string;
  isActive: boolean;
  timeRemaining: number;
  totalSupply: string;
  tokensForSale: string;
  tokensSold: string;
  auctionAddress: string;
}

export default function DopplerTradingPage() {
  const { address } = useParams<{ address: string }>();
  const [tokenInfo, setTokenInfo] = useState<DopplerTokenInfo | null>(null);
  const [ethAmount, setEthAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState('0');
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);

  useEffect(() => {
    if (address) {
      fetchTokenInfo();
    }
  }, [address]);

  const fetchTokenInfo = async () => {
    try {
      setLoading(true);
      // Fetch token info from your API
      const response = await fetch(`/api/doppler/tokens/${address}`);
      const data = await response.json();
      setTokenInfo(data);
    } catch (error) {
      console.error('Failed to fetch token info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEthAmountChange = async (value: string) => {
    setEthAmount(value);
    if (value && tokenInfo) {
      try {
        const response = await fetch(`/api/doppler/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenAddress: address,
            auctionAddress: tokenInfo.auctionAddress,
            ethAmount: value
          })
        });
        const { tokens } = await response.json();
        setEstimatedTokens(tokens);
      } catch (error) {
        console.error('Failed to get quote:', error);
      }
    }
  };

  const handleBuyTokens = async () => {
    if (!ethAmount || !tokenInfo) return;
    
    try {
      setTrading(true);
      const response = await fetch(`/api/doppler/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionAddress: tokenInfo.auctionAddress,
          ethAmount
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Trade successful!');
        fetchTokenInfo(); // Refresh data
        setEthAmount('');
        setEstimatedTokens('0');
      } else {
        alert(`Trade failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Trade failed:', error);
      alert('Trade failed');
    } finally {
      setTrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Token Not Found</h2>
          <p className="text-gray-600">The token you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Token Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{tokenInfo.name}</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">${tokenInfo.symbol}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={tokenInfo.isActive ? "default" : "secondary"}>
                  {tokenInfo.isActive ? "Active Auction" : "Ended"}
                </Badge>
                {tokenInfo.isActive && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {Math.floor(tokenInfo.timeRemaining / 3600)}h {Math.floor((tokenInfo.timeRemaining % 3600) / 60)}m left
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${tokenInfo.currentPrice}</div>
                <div className="text-sm text-gray-600">Current Price</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{tokenInfo.tokensSold}%</div>
                <div className="text-sm text-gray-600">Tokens Sold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{tokenInfo.tokensForSale}</div>
                <div className="text-sm text-gray-600">For Sale</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Interface */}
        {tokenInfo.isActive && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Buy Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ETH Amount</label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="0.0"
                  value={ethAmount}
                  onChange={(e) => handleEthAmountChange(e.target.value)}
                />
              </div>
              
              <div className="flex items-center justify-center">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Tokens</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-semibold">{estimatedTokens} {tokenInfo.symbol}</div>
                </div>
              </div>

              <Separator />

              <Button 
                onClick={handleBuyTokens} 
                disabled={!ethAmount || trading}
                className="w-full"
                size="lg"
              >
                {trading ? "Processing..." : `Buy ${tokenInfo.symbol}`}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
