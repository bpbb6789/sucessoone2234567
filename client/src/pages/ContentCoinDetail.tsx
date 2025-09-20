
"use client";

import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Share2,
  Heart,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { ContentPreview } from "@/components/ContentPreview";
import { TokenTrading } from "@/components/TokenTrading";
import { Address } from "viem";
import { useState } from "react";
import { useAccount } from "wagmi";

export default function ContentCoinDetail() {
  const params = useParams();
  const tokenAddress = params.address;
  const { toast } = useToast();
  const { isConnected, address: userAddress } = useAccount();

  // Fetch creator coin data
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: [`/api/creator-coins/${tokenAddress}`],
    queryFn: async () => {
      const response = await fetch(`/api/creator-coins/${tokenAddress}`);
      if (!response.ok) throw new Error("Failed to fetch creator coin");
      return response.json();
    },
    enabled: !!tokenAddress,
  });

  // Fetch real-time price data
  const { data: priceData } = useQuery({
    queryKey: [`/api/dexscreener/${tokenAddress}`],
    queryFn: async () => {
      const response = await fetch(`/api/dexscreener/${tokenAddress}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    },
    enabled: !!tokenData?.coinAddress,
    refetchInterval: 30000,
  });

  const handleCopyAddress = () => {
    if (tokenData?.coinAddress) {
      navigator.clipboard.writeText(tokenData.coinAddress);
      toast({ title: "Copied!", description: "Contract address copied to clipboard" });
    }
  };

  const currentPrice = priceData?.price || tokenData?.currentPrice || "0.00000000";
  const marketCap = priceData?.marketCap || tokenData?.marketCap || "0";

  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (tokenError || !tokenData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Content Coin Not Found</h1>
          <Link to="/contentcoin">
            <Button>Back to Content Coins</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/contentcoin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex gap-6 p-6 min-h-[calc(100vh-140px)]">
        {/* Left Side - Content Preview */}
        <div className="flex-1">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                {tokenData.mediaCid ? (
                  <ContentPreview
                    mediaCid={tokenData.mediaCid}
                    thumbnailCid={tokenData.thumbnailCid}
                    contentType={tokenData.contentType}
                    title={tokenData.title || tokenData.coinName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <div className="text-6xl mb-4">🎯</div>
                      <p>No content preview available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Info */}
          {tokenData.description && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <p className="text-muted-foreground">{tokenData.description}</p>
              </CardContent>
            </Card>
          )}

          {/* External Links */}
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://sepolia.basescan.org/token/${tokenData.coinAddress}`, '_blank')}
              disabled={!tokenData.coinAddress}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Basescan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://dexscreener.com/base-sepolia/${tokenData.coinAddress}`, '_blank')}
              disabled={!tokenData.coinAddress}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              DEX Screener
            </Button>
          </div>
        </div>

        {/* Right Side - Token Info & Trading */}
        <div className="w-96 space-y-6">
          {/* Token Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{tokenData.title || tokenData.coinName}</h1>
            <div className="text-sm text-muted-foreground mb-4">
              {tokenData.coinSymbol} • {tokenData.creator?.slice(0, 6)}...{tokenData.creator?.slice(-4)}
            </div>
            <div className="text-3xl font-bold mb-1">${currentPrice}</div>
            {priceData?.priceChange24h !== undefined && (
              <div className={`text-sm ${priceData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceData.priceChange24h >= 0 ? '+' : ''}{priceData.priceChange24h.toFixed(2)}%
              </div>
            )}
          </div>

          {/* Trading Component */}
          {tokenData.coinAddress ? (
            <TokenTrading
              tokenAddress={tokenData.coinAddress as Address}
              tokenName={tokenData.coinName || tokenData.name || "Token"}
              tokenSymbol={tokenData.coinSymbol || tokenData.symbol || "TOKEN"}
              currentPrice={currentPrice}
              supply={tokenData.totalSupply || "1000000000"}
              marketCap={marketCap}
              holders={0}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-yellow-600 mb-4">⚠️ Token not yet deployed</div>
                <p className="text-sm text-muted-foreground">
                  This content coin needs to be deployed before trading
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
