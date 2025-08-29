import { useState, useEffect } from 'react';
import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Coins, TrendingUp, Users, DollarSign, ExternalLink, ArrowLeft } from 'lucide-react';
import { TokenTrading } from '@/components/TokenTrading';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PriceService } from '../../../lib/priceService';
// Using Zora SDK via API routes instead of direct contract calls
import { formatUnits } from 'viem';

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
    // Handle both /token/:address and /token routes
    const tokenIndex = pathParts.findIndex(part => part === 'token');
    if (tokenIndex !== -1 && tokenIndex + 1 < pathParts.length && pathParts[tokenIndex + 1]) {
      const address = pathParts[tokenIndex + 1];
      // Validate that it looks like an Ethereum address
      if (address.startsWith('0x') && address.length === 42) {
        return address;
      }
    }
    return null;
  };

  const tokenAddress = getTokenAddressFromPath() as `0x${string}` | null;

  // Get token bonding curve data from Zora API
  const { data: bondingCurveData, isError: tokenDataError, isLoading: contractLoading } = useQuery({
    queryKey: ['/api/zora/bonding-curve', tokenAddress],
    enabled: !!tokenAddress,
    retry: 2,
  });

  // Helper function to format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };


  useEffect(() => {
    const fetchTokenData = async () => {
      // Check if we have a valid token address
      if (!tokenAddress) {
        console.log("No token address found in URL");
        setIsLoading(false);
        return;
      }

      // Wait for contract data to load
      if (contractLoading) {
        setIsLoading(true);
        return;
      }

      // Handle contract errors
      if (tokenDataError) {
        console.error("Contract data error:", tokenDataError);
        toast({
          title: "Error loading token",
          description: "Failed to load token data from contract. The token may not exist.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Check if we have contract data
      if (!bondingCurveData) {
        console.log("No bonding curve data available");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Extract data from bonding curve struct
        const {
          tokenMint,
          virtualTokenReserves,
          virtualEthReserves,
          realTokenReserves,
          realEthReserves,
          tokenTotalSupply,
          mcapLimit,
          complete
        } = bondingCurveData;

        // Calculate basic metrics from bonding curve
        const virtualEthReservesEth = Number(formatUnits(virtualEthReserves, 18));
        const virtualTokenReservesNum = Number(formatUnits(virtualTokenReserves, 18));
        const totalSupplyNum = Number(formatUnits(tokenTotalSupply, 18));
        
        // Calculate current price (ETH per token)
        const pricePerTokenEth = virtualEthReservesEth / virtualTokenReservesNum;
        const priceUSD = pricePerTokenEth * 3000; // Approximate ETH price

        // Calculate market cap
        const marketCapValue = priceUSD * totalSupplyNum;

        // Real data will be fetched from indexing service when available
        const volume24h = "0";
        const holders = 0;

        const processedTokenData: TokenData = {
          address: tokenAddress,
          name: "Token", // Would fetch from token contract
          symbol: "TKN", // Would fetch from token contract
          price: priceUSD.toFixed(8),
          marketCap: marketCapValue.toFixed(2),
          volume24h: volume24h,
          holders: holders,
          supply: formatUnits(tokenTotalSupply, 18),
          createdBy: "0x0000000000000000000000000000000000000000", // Would get from indexer
          description: 'Token created through PumpFun bonding curve',
          imageUri: undefined
        };

        console.log("Processed token data:", processedTokenData);
        setTokenData(processedTokenData);
      } catch (error) {
        console.error('Error processing token data:', error);
        toast({
          title: "Error loading token",
          description: "Failed to process token data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenAddress, bondingCurveData, tokenDataError, contractLoading, toast]);

  if (isLoading || contractLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Navigation Skeleton */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-9 w-32" />
          </div>

          {/* Token Header Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center space-x-2 p-4">
                  <Skeleton className="h-6 w-6" />
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trading Interface Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Token Information Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!tokenData && !isLoading && !contractLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Token Not Found</h1>
          <p className="text-muted-foreground">
            {!tokenAddress
              ? "No token address provided in the URL. Please select a token from the tokens page."
              : `Token ${tokenAddress} could not be found or loaded from the contract.`
            }
          </p>
          <div className="space-x-2">
            <Link to="/tokens">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tokens
              </Button>
            </Link>
            {tokenAddress && (
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Guard against null tokenData
  if (!tokenData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link to="/tokens">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tokens
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Token data not available</p>
            </CardContent>
          </Card>
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
                {tokenData.imageUri ? (
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
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                    {tokenData.symbol.charAt(0)}
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
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://basescan.org/address/${tokenData.address}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Contract
                  </a>
                </Button>
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
                <Badge variant="outline">
                  Base Sepolia
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
                <p className="text-lg font-bold">${parseFloat(tokenData.price).toFixed(6)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Cap</p>
                <p className="text-lg font-bold">${formatNumber(parseFloat(tokenData.marketCap))}</p>
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
                <p className="text-sm font-medium text-muted-foreground">24h Volume</p>
                <p className="text-lg font-bold">${formatNumber(parseFloat(tokenData.volume24h))}</p>
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
                  <p className="font-mono text-sm break-all">{tokenData.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Supply</p>
                  <p className="text-sm">{parseFloat(tokenData.supply).toLocaleString()} {tokenData.symbol}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">24h Volume</p>
                  <p className="text-sm">${formatNumber(parseFloat(tokenData.volume24h))}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creator</p>
                  <p className="font-mono text-sm break-all">{tokenData.createdBy}</p>
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