import { useState, useEffect } from 'react';
import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Coins, TrendingUp, Users, DollarSign, ExternalLink, ArrowLeft } from 'lucide-react';
import { TokenTrading } from '@/components/TokenTrading';
import { Link } from 'react-router-dom';

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  volume24h: string;
  holders: number;
  supply: string;
  createdBy: string;
  description: string;
  twitter?: string;
  discord?: string;
  imageUri?: string;
}

export default function Token() {
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  // Extract token address from URL path
  const getTokenAddressFromPath = (): string | null => {
    const pathParts = location.pathname.split('/');
    const tokenIndex = pathParts.indexOf('token');
    if (tokenIndex !== -1 && pathParts[tokenIndex + 1]) {
      return pathParts[tokenIndex + 1];
    }
    return null;
  };

  const tokenAddress = getTokenAddressFromPath();

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!tokenAddress) {
        toast({
          title: "Invalid token address",
          description: "No token address provided in the URL",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Mock data for now - replace with actual API call
        const mockTokenData: TokenData = {
          address: tokenAddress,
          name: tokenAddress === '0x0f1aa5058a58e56d99365fbab232bef578a0ad2d' ? 'TubeClone TV' : 'Sample Token',
          symbol: tokenAddress === '0x0f1aa5058a58e56d99365fbab232bef578a0ad2d' ? 'TUBE' : 'SAMPLE',
          price: '0.0023',
          marketCap: '45.6',
          volume24h: '12.3',
          holders: 156,
          supply: '1000000',
          createdBy: '0x742d35Cc6635C0532925a3b8D',
          description: 'A revolutionary token for the TubeClone ecosystem.',
          twitter: '@tubeclone',
          discord: 'https://discord.gg/tubeclone',
          imageUri: '/images/tv.jpeg'
        };

        setTokenData(mockTokenData);
      } catch (error) {
        console.error('Error fetching token data:', error);
        toast({
          title: "Error loading token",
          description: "Failed to load token data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenAddress, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading token data...</span>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Token Not Found</h1>
          <p className="text-muted-foreground">The requested token could not be found.</p>
          <Link to="/tokens">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tokens
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Link to="/tokens">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tokens
            </Button>
          </Link>
        </div>

        {/* Token Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                {tokenData.imageUri && (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <img 
                      src={tokenData.imageUri} 
                      alt={tokenData.name}
                      className="w-14 h-14 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div>
                  <CardTitle className="text-3xl">{tokenData.name}</CardTitle>
                  <CardDescription className="text-lg">
                    {tokenData.symbol} • {tokenData.address.slice(0, 6)}...{tokenData.address.slice(-4)}
                  </CardDescription>
                </div>
              </div>
              <div className="flex space-x-2">
                {tokenData.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://twitter.com/${tokenData.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Twitter
                    </a>
                  </Button>
                )}
                {tokenData.discord && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={tokenData.discord} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Discord
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">{tokenData.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Created by: {tokenData.createdBy.slice(0, 6)}...{tokenData.createdBy.slice(-4)}
                </Badge>
                <Badge variant="outline">
                  Contract: {tokenData.address.slice(0, 10)}...{tokenData.address.slice(-6)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price</p>
                <p className="text-lg font-bold">${tokenData.price}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Cap</p>
                <p className="text-lg font-bold">${tokenData.marketCap}K</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <Users className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Holders</p>
                <p className="text-lg font-bold">{tokenData.holders}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <Coins className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supply</p>
                <p className="text-lg font-bold">{parseInt(tokenData.supply).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Interface */}
        <TokenTrading 
          tokenAddress={tokenData.address}
          tokenName={tokenData.name}
          tokenSymbol={tokenData.symbol}
          currentPrice={tokenData.price}
          supply={tokenData.supply}
          marketCap={tokenData.marketCap}
          holders={tokenData.holders}
        />

        {/* Token Information */}
        <Card>
          <CardHeader>
            <CardTitle>Token Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contract Address</p>
                  <p className="font-mono text-sm">{tokenData.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Supply</p>
                  <p className="text-sm">{parseInt(tokenData.supply).toLocaleString()} {tokenData.symbol}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">24h Volume</p>
                  <p className="text-sm">${tokenData.volume24h}K</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creator</p>
                  <p className="font-mono text-sm">{tokenData.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Holders</p>
                  <p className="text-sm">{tokenData.holders} addresses</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Network</p>
                  <p className="text-sm">Base Sepolia</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}