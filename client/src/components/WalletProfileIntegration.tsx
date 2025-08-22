import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { Link, Wallet, CheckCircle, AlertCircle, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletProfileIntegrationProps {
  channelId: string;
  className?: string;
}

// Mock NFT and Token data (in a real app, this would come from blockchain APIs)
interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  tokenId: string;
}

interface Token {
  symbol: string;
  name: string;
  balance: string;
  value: string;
}

export function WalletProfileIntegration({ channelId, className }: WalletProfileIntegrationProps) {
  const { toast } = useToast();
  const { isConnected, account, formatBalance } = useWallet();
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  
  // Mock data - in real app, fetch from blockchain
  const [nfts] = useState<NFT[]>([
    {
      id: "1",
      name: "Bored Ape #1234",
      collection: "Bored Ape Yacht Club",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=center",
      tokenId: "1234"
    },
    {
      id: "2", 
      name: "Cool Cat #5678",
      collection: "Cool Cats NFT",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=center",
      tokenId: "5678"
    }
  ]);

  const [tokens] = useState<Token[]>([
    { symbol: "USDC", name: "USD Coin", balance: "1,250.50", value: "$1,250.50" },
    { symbol: "WETH", name: "Wrapped Ether", balance: "0.85", value: "$2,125.00" },
    { symbol: "UNI", name: "Uniswap", balance: "45.2", value: "$315.40" }
  ]);

  // Check if current wallet is already linked
  useEffect(() => {
    // In a real app, check database for linked wallet
    const savedWallet = localStorage.getItem(`linked-wallet-${channelId}`);
    if (savedWallet) {
      setLinkedWallet(savedWallet);
    }
  }, [channelId]);

  const linkWallet = async () => {
    if (!isConnected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setIsLinking(true);
    
    try {
      // In a real app, you'd verify wallet ownership and save to database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      localStorage.setItem(`linked-wallet-${channelId}`, account.address);
      setLinkedWallet(account.address);
      
      toast({
        title: "Wallet Linked Successfully",
        description: "Your wallet has been linked to your channel profile",
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Linking Failed",
        description: "Failed to link wallet to profile",
        variant: "destructive"
      });
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkWallet = () => {
    localStorage.removeItem(`linked-wallet-${channelId}`);
    setLinkedWallet(null);
    
    toast({
      title: "Wallet Unlinked",
      description: "Your wallet has been unlinked from your profile",
      duration: 3000
    });
  };

  return (
    <div className={cn("space-y-4", className)} data-testid="wallet-profile-integration">
      {/* Wallet Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Connected: {account?.address && account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">No wallet connected</span>
                </>
              )}
            </div>
            
            {isConnected && account && (
              <Badge variant="secondary">
                {formatBalance(account.balance || '0')} ETH
              </Badge>
            )}
          </div>

          {/* Link/Unlink Actions */}
          <div className="flex gap-2">
            {isConnected && !linkedWallet && (
              <Button
                onClick={linkWallet}
                disabled={isLinking}
                size="sm"
                data-testid="link-wallet-button"
              >
                <Link className="w-4 h-4 mr-2" />
                {isLinking ? "Linking..." : "Link to Profile"}
              </Button>
            )}
            
            {linkedWallet && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Linked
                </Badge>
                <Button
                  onClick={unlinkWallet}
                  variant="outline"
                  size="sm"
                  data-testid="unlink-wallet-button"
                >
                  Unlink
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Assets Display (only when connected and linked) */}
      {isConnected && linkedWallet && (
        <div className="space-y-4">
          {/* NFT Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded" />
                NFT Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {nfts.map((nft) => (
                  <div key={nft.id} className="space-y-2" data-testid={`nft-${nft.id}`}>
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <div>
                      <p className="text-xs font-medium truncate">{nft.name}</p>
                      <p className="text-xs text-gray-500 truncate">{nft.collection}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-center aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <span className="text-xs text-gray-500">+{Math.floor(Math.random() * 20)} more</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Holdings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Token Holdings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    data-testid={`token-${token.symbol}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{token.symbol[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{token.symbol}</p>
                        <p className="text-xs text-gray-500">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{token.balance}</p>
                      <p className="text-xs text-gray-500">{token.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}