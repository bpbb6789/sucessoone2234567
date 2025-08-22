import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { WALLET_CONNECTORS, SUPPORTED_CHAINS } from "@/lib/walletConnect";
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut,
  Settings,
  RefreshCw 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WalletConnectButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function WalletConnectButton({ 
  className, 
  variant = "default",
  size = "default" 
}: WalletConnectButtonProps) {
  const { toast } = useToast();
  const [showConnectors, setShowConnectors] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowConnectors(false);
      }
    };

    if (showConnectors) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showConnectors]);
  
  const {
    isConnected,
    account,
    connector,
    isConnecting,
    connectWallet,
    disconnect,
    switchChain,
    shortenAddress,
    formatBalance
  } = useWallet();

  const handleCopyAddress = async () => {
    if (account?.address) {
      try {
        await navigator.clipboard.writeText(account.address);
        toast({
          title: "Address Copied",
          description: "Wallet address copied to clipboard",
          duration: 2000
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy address to clipboard",
          variant: "destructive"
        });
      }
    }
  };

  const handleViewOnExplorer = () => {
    if (account?.address && account.chainId) {
      const chain = Object.values(SUPPORTED_CHAINS).find(c => c.chainId === account.chainId);
      if (chain) {
        window.open(`${chain.blockExplorer}/address/${account.address}`, '_blank');
      }
    }
  };

  // Not connected - show connect button or connector selection
  if (!isConnected) {
    return (
      <>
        <div className={cn("relative", className)}>
          <Button
            onClick={() => setShowConnectors(true)}
            disabled={isConnecting}
            variant={variant}
            size={size}
            className="flex items-center gap-2"
            data-testid="connect-wallet-button"
          >
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </div>
        
        {showConnectors && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-black/20" 
              onClick={() => setShowConnectors(false)}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-sm" data-testid="wallet-connectors">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Connect Wallet</h3>
                    <Button
                      onClick={() => setShowConnectors(false)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => {
                      connectWallet(WALLET_CONNECTORS.METAMASK);
                      setShowConnectors(false);
                    }}
                    disabled={isConnecting}
                    variant="outline"
                    className="w-full justify-start h-12"
                    data-testid="connect-metamask"
                  >
                    🦊 MetaMask
                  </Button>
                  
                  <Button
                    onClick={() => {
                      connectWallet(WALLET_CONNECTORS.WALLETCONNECT);
                      setShowConnectors(false);
                    }}
                    disabled={isConnecting}
                    variant="outline"
                    className="w-full justify-start h-12"
                    data-testid="connect-walletconnect"
                  >
                    🔗 WalletConnect
                  </Button>
                  
                  <Button
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Coinbase Wallet support coming soon!",
                        duration: 3000
                      });
                    }}
                    disabled={true}
                    variant="outline"
                    className="w-full justify-start h-12 opacity-50"
                    data-testid="connect-coinbase"
                  >
                    🟦 Coinbase Wallet
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </>
    );
  }

  // Connected - show account dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("flex items-center gap-2", className)}
          data-testid="wallet-account-button"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">
            {shortenAddress(account?.address || '')}
          </span>
          <Badge variant="secondary" className="hidden md:inline-flex">
            {formatBalance(account?.balance)} ETH
          </Badge>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64" data-testid="wallet-dropdown">
        {/* Account Info */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Connected Account</span>
            <Badge variant="outline" className="text-xs">
              {connector === WALLET_CONNECTORS.METAMASK ? '🦊 MetaMask' : '🔗 WalletConnect'}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {account?.address}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Balance:</span>
              <span className="text-xs font-medium">
                {formatBalance(account?.balance)} ETH
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Network:</span>
              <span className="text-xs">
                {account?.chainId === 1 ? 'Ethereum' : `Chain ${account?.chainId}`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenuItem
          onClick={handleCopyAddress}
          className="flex items-center gap-2"
          data-testid="copy-address"
        >
          <Copy className="w-4 h-4" />
          Copy Address
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleViewOnExplorer}
          className="flex items-center gap-2"
          data-testid="view-explorer"
        >
          <ExternalLink className="w-4 h-4" />
          View on Explorer
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Network Switching */}
        <div className="p-2">
          <p className="text-xs text-gray-500 mb-2">Switch Network:</p>
          <div className="space-y-1">
            <Button
              onClick={() => switchChain(1)}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              disabled={account?.chainId === 1}
              data-testid="switch-ethereum"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
              Ethereum
              {account?.chainId === 1 && <span className="ml-auto text-xs">✓</span>}
            </Button>
            <Button
              onClick={() => switchChain(137)}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              disabled={account?.chainId === 137}
              data-testid="switch-polygon"
            >
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
              Polygon
              {account?.chainId === 137 && <span className="ml-auto text-xs">✓</span>}
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={disconnect}
          className="flex items-center gap-2 text-red-600 dark:text-red-400"
          data-testid="disconnect-wallet"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}