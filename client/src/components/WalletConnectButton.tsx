// import { ConnectButton } from '@rainbow-me/rainbowkit'; // Temporarily disabled
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

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
  const handleConnect = () => {
    alert("Wallet connection is being configured. This will connect to MetaMask, Coinbase Wallet, and other Web3 wallets soon!");
  };

  return (
    <Button
      onClick={handleConnect}
      variant={variant}
      size={size}
      className={cn("flex items-center gap-2", className)}
      data-testid="connect-wallet-button"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}