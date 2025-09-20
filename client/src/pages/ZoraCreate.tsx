"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccount } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { Loader2, Coins, Zap, Rocket, Info, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zoraFactoryImplAbi } from '@/lib/contracts';

const currencies = [
  { value: 'ETH', label: 'ETH', description: 'Ethereum' },
  { value: 'ZORA', label: 'ZORA', description: 'Zora Protocol Token' },
];

const marketCaps = [
  { value: 'LOW', label: 'Low Market Cap', description: 'Starting at ~$1K market cap' },
  { value: 'HIGH', label: 'High Market Cap', description: 'Starting at ~$10K market cap' },
];

// Your deployed Zora Factory contract address on Base Sepolia
const ZORA_FACTORY_ADDRESS = "0xAe028301c7822F2c254A43451D22dB5Fe447a4a0" as Address;

export default function ZoraCreate() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    imageUri: '',
    twitter: '',
    discord: '',
    website: '',
    currency: 'ETH',
    startingMarketCap: 'LOW'
  });

  const [deployedTokenAddress, setDeployedTokenAddress] = useState<Address | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateToken = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to create a token",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.symbol) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the token name and symbol",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      toast({
        title: "Creating Token...",
        description: "Your Zora token is being deployed to the blockchain",
      });

      // Create metadata object
      const metadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        imageUri: formData.imageUri,
        social: {
          twitter: formData.twitter,
          discord: formData.discord,
          website: formData.website
        },
        currency: formData.currency,
        startingMarketCap: formData.startingMarketCap
      };

      // Call your backend API to create the Zora coin
      const response = await fetch('/api/creator-coins/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metadata,
          creatorAddress: address,
          contentType: 'token', // This is a token creation, not content
          mediaCid: 'none', // No media for pure tokens
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create token: ${errorData}`);
      }

      const result = await response.json();

      toast({
        title: "Token Created Successfully! 🚀",
        description: `${formData.name} (${formData.symbol}) deployed at ${result.coinAddress?.slice(0, 8)}...`,
      });

      // Reset form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        imageUri: '',
        twitter: '',
        discord: '',
        website: '',
        currency: 'ETH',
        startingMarketCap: 'LOW'
      });

      // Redirect to explore page or token detail
      if (result.coinAddress) {
        setTimeout(() => {
          window.location.href = `/zora-token/${result.coinAddress}`;
        }, 2000);
      }

    } catch (error) {
      console.error('Error creating token:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Zora Create
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deploy your token using Zora's advanced bonding curve technology with automatic liquidity and trading
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Powered by Zora Factory
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Your token will be deployed using Zora's battle-tested factory contracts with built-in bonding curves, 
                  automatic Uniswap V4 integration, and creator rewards. No coding required!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Basic Token
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Creator Coin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Basic Token</CardTitle>
                <CardDescription>
                  Deploy a standard ERC-20 token with Zora bonding curve mechanics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Token Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Token Name *</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome Token"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symbol">Token Symbol *</Label>
                    <Input
                      id="symbol"
                      placeholder="MAT"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your token and its purpose..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUri">Token Image URL</Label>
                  <Input
                    id="imageUri"
                    placeholder="https://example.com/token-image.png"
                    value={formData.imageUri}
                    onChange={(e) => handleInputChange('imageUri', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Base Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.value} value={currency.value}>
                            <div>
                              <div className="font-medium">{currency.label}</div>
                              <div className="text-xs text-muted-foreground">{currency.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Starting Market Cap</Label>
                    <Select value={formData.startingMarketCap} onValueChange={(value) => handleInputChange('startingMarketCap', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {marketCaps.map(cap => (
                          <SelectItem key={cap.value} value={cap.value}>
                            <div>
                              <div className="font-medium">{cap.label}</div>
                              <div className="text-xs text-muted-foreground">{cap.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Creator Coin</CardTitle>
                <CardDescription>
                  Deploy a creator coin with vesting schedule and enhanced features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Advanced Creator Coin Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="creator-name">Creator Name *</Label>
                    <Input
                      id="creator-name"
                      placeholder="Creator Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creator-symbol">Creator Symbol *</Label>
                    <Input
                      id="creator-symbol"
                      placeholder="CREATOR"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      maxLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creator-description">Creator Description</Label>
                  <Textarea
                    id="creator-description"
                    placeholder="Tell people about yourself and your creator coin..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Social Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <Input
                        id="twitter"
                        placeholder="@username"
                        value={formData.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discord">Discord</Label>
                      <Input
                        id="discord"
                        placeholder="Discord server invite"
                        value={formData.discord}
                        onChange={(e) => handleInputChange('discord', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Coin Features */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">
                  Creator Coin Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800 dark:text-green-200">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300">✓</Badge>
                    500M tokens to liquidity pool
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300">✓</Badge>
                    500M tokens vested over 5 years
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300">✓</Badge>
                    Automatic Uniswap V4 integration
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-300">✓</Badge>
                    Built-in rewards distribution
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-8">
          {!isConnected ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Connect your wallet to create tokens</p>
              <Button onClick={() => {/* Add wallet connection logic */}}>
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handleCreateToken}
                disabled={isLoading || !formData.name || !formData.symbol}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Token...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Create Token
                  </>
                )}
              </Button>

              <Button variant="outline" size="lg" asChild>
                <a href="/contents" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View All Content
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <Card className="mt-8 bg-gray-50 dark:bg-gray-800/50">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">How Zora Factory Works</h3>
            <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
              Your token will be deployed using your custom Zora factory at{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                0xAe028301c7822F2c254A43451D22dB5Fe447a4a0
              </code>{' '}
              on Base network. The factory automatically creates bonding curves, sets up Uniswap V4 hooks, 
              and enables decentralized trading with built-in creator rewards.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}