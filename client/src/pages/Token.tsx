import { useState } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
// import { useAccount } from 'wagmi'; // Temporarily disabled due to import issues
import { parseEther, formatEther } from 'viem';
import { uniPumpCreatorConfig, type TokenCreationParams } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Loader2, Coins, TrendingUp, Users, DollarSign } from 'lucide-react';
import { TokenTrading } from '@/components/TokenTrading';

interface TokenFormData {
  name: string;
  symbol: string;
  twitter: string;
  discord: string;
  bio: string;
  imageUri: string;
}

export default function Token() {
  // Temporarily mock wallet connection until wagmi imports are fixed
  // TODO: Replace with real useAccount hook once wagmi is properly configured
  const isConnected = true; // Set to true for testing
  const address = '0x1234567890123456789012345678901234567890'; // Mock address
  
  // Smart contract interaction hooks
  const { writeContract, isPending: isWritePending, error: writeError } = useWriteContract();
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>();
  
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: currentTxHash,
  });
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<TokenFormData>({
    name: '',
    symbol: '',
    twitter: '',
    discord: '',
    bio: '',
    imageUri: ''
  });

  // const { writeContract } = useWriteContract();

  const handleInputChange = (field: keyof TokenFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateToken = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a token",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name || !formData.symbol) {
      toast({
        title: "Missing required fields",
        description: "Please fill in at least the token name and symbol",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Call the smart contract to create token
      const hash = await writeContract({
        ...uniPumpCreatorConfig,
        functionName: 'createTokenSale',
        args: [
          formData.name,
          formData.symbol,
          formData.twitter || '',
          formData.discord || '',
          formData.bio || '',
          formData.imageUri || ''
        ],
      });

      setCurrentTxHash(hash);
      
      toast({
        title: "Transaction submitted",
        description: `Creating ${formData.name} (${formData.symbol})... Transaction: ${hash.slice(0, 10)}...`,
      });

    } catch (error) {
      console.error('Token creation failed:', error);
      toast({
        title: "Token creation failed",
        description: error instanceof Error ? error.message : "There was an error creating your token. Please try again.",
        variant: "destructive"
      });
      setIsCreating(false);
    }
  };

  // Handle transaction completion
  React.useEffect(() => {
    if (isTxSuccess) {
      toast({
        title: "Token created successfully!",
        description: `${formData.name} (${formData.symbol}) has been deployed to the blockchain.`,
      });
      
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        twitter: '',
        discord: '',
        bio: '',
        imageUri: ''
      });
      
      setIsCreating(false);
      setCurrentTxHash(undefined);
    }
  }, [isTxSuccess, formData.name, formData.symbol, toast]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Coins className="h-10 w-10 text-emerald-600" />
            Launch Your Token
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create your own meme token on Base network with UniPump's bonding curve mechanism
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="flex items-center space-x-2 p-6">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tokens</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-2 p-6">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Traders</p>
                <p className="text-2xl font-bold">56.7K</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-2 p-6">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume 24h</p>
                <p className="text-2xl font-bold">$2.1M</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Token</CardTitle>
            <CardDescription>
              Fill in the details below to launch your token on the UniPump platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="token-name">Token Name *</Label>
                <Input
                  id="token-name"
                  placeholder="My Awesome Token"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  data-testid="input-token-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token-symbol">Token Symbol *</Label>
                <Input
                  id="token-symbol"
                  placeholder="MAT"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                  data-testid="input-token-symbol"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token-bio">Description</Label>
              <Textarea
                id="token-bio"
                placeholder="Tell people about your token..."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                data-testid="textarea-token-bio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token-image">Image URL</Label>
              <Input
                id="token-image"
                placeholder="https://example.com/my-token-image.png"
                value={formData.imageUri}
                onChange={(e) => handleInputChange('imageUri', e.target.value)}
                data-testid="input-token-image"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="token-twitter">Twitter (Optional)</Label>
                <Input
                  id="token-twitter"
                  placeholder="@mytoken"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  data-testid="input-token-twitter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token-discord">Discord (Optional)</Label>
                <Input
                  id="token-discord"
                  placeholder="https://discord.gg/mytoken"
                  value={formData.discord}
                  onChange={(e) => handleInputChange('discord', e.target.value)}
                  data-testid="input-token-discord"
                />
              </div>
            </div>

            {!isConnected ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Connect your wallet to create a token</p>
                {/* WalletConnectButton will be shown in header */}
              </div>
            ) : (
              <Button
                onClick={handleCreateToken}
                disabled={(isCreating || isWritePending || isTxLoading) || !formData.name || !formData.symbol}
                className="w-full"
                size="lg"
                data-testid="button-create-token"
              >
                {(isCreating || isWritePending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing Transaction...
                  </>
                ) : isTxLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming Transaction...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Create Token
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Demo Trading Interface - Would normally show for existing tokens */}
        <TokenTrading 
          tokenAddress="0x0000000000000000000000000000000000000000"
          tokenName="Demo Token"
          tokenSymbol="DEMO"
          currentPrice="0.0001"
          supply="1000000"
          marketCap="100"
          holders={42}
        />

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Token Launch Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <Badge variant="secondary" className="text-lg px-3 py-1">1</Badge>
                <h3 className="font-semibold">Create</h3>
                <p className="text-sm text-muted-foreground">
                  Launch your token with initial metadata and social links
                </p>
              </div>
              <div className="text-center space-y-2">
                <Badge variant="secondary" className="text-lg px-3 py-1">2</Badge>
                <h3 className="font-semibold">Bonding Curve</h3>
                <p className="text-sm text-muted-foreground">
                  Price increases automatically as more tokens are bought
                </p>
              </div>
              <div className="text-center space-y-2">
                <Badge variant="secondary" className="text-lg px-3 py-1">3</Badge>
                <h3 className="font-semibold">Uniswap</h3>
                <p className="text-sm text-muted-foreground">
                  At market cap target, liquidity moves to Uniswap V4
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}