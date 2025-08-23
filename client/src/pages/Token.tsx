
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
import { useReadContract } from 'wagmi';
import { CONTRACTS, UniPumpAbi } from '@/lib/contracts';
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
    const tokenIndex = pathParts.indexOf('token');
    if (tokenIndex !== -1 && pathParts[tokenIndex + 1]) {
      return pathParts[tokenIndex + 1];
    }
    return null;
  };

  const tokenAddress = getTokenAddressFromPath() as `0x${string}` | null;

  // Get token data from contract
  const { data: contractTokenData, isError: tokenDataError } = useReadContract({
    address: CONTRACTS.UNIPUMP,
    abi: UniPumpAbi,
    functionName: 'getTokenData',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });

  // Get market cap data
  const { data: capData } = useReadContract({
    address: CONTRACTS.UNIPUMP,
    abi: UniPumpAbi,
    functionName: 'cap',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });

  // Get current price (reserves for bonding curve)
  const { data: reserveData } = useReadContract({
    address: CONTRACTS.UNIPUMP,
    abi: UniPumpAbi,
    functionName: 'getReserve',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });

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

      if (tokenDataError || !contractTokenData) {
        toast({
          title: "Error loading token",
          description: "Failed to load token data from contract",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Calculate price based on bonding curve
        let price = "0.0000";
        if (reserveData) {
          const reserveInEth = parseFloat(formatUnits(reserveData, 18));
          const supply = parseFloat(formatUnits(contractTokenData.supply, 18));
          if (supply > 0) {
            // Simplified pricing calculation - in reality this would use the bonding curve formula
            price = (reserveInEth * 3000 / supply).toFixed(6); // Assume ETH = $3000
          }
        }

        // Calculate market cap
        let marketCapValue = "0";
        if (capData) {
          const capInEth = parseFloat(formatUnits(capData, 18));
          marketCapValue = (capInEth * 3000).toFixed(2); // Assume ETH = $3000
        }

        const processedTokenData: TokenData = {
          address: tokenAddress,
          name: contractTokenData.name,
          symbol: contractTokenData.symbol,
          price: price,
          marketCap: marketCapValue,
          volume24h: "0", // This would need to be calculated from events
          holders: 0, // This would need to be calculated from Transfer events
          supply: formatUnits(contractTokenData.supply, 18),
          createdBy: contractTokenData.createdBy,
          description: contractTokenData.description || 'No description available',
          imageUri: contractTokenData.imageUri || undefined
        };

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

    if (contractTokenData) {
      fetchTokenData();
    } else if (!tokenAddress) {
      setIsLoading(false);
    }
  }, [tokenAddress, contractTokenData, capData, reserveData, tokenDataError, toast]);

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
          <p className="text-muted-foreground">The requested token could not be found or loaded from the contract.</p>
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
                <p className="text-lg font-bold">${tokenData.price}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-2 p-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Cap</p>
                <p className="text-lg font-bold">${tokenData.marketCap}</p>
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
                <p className="text-lg font-bold">{parseFloat(tokenData.supply).toLocaleString()}</p>
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
                  <p className="text-sm">${tokenData.volume24h}K</p>
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
