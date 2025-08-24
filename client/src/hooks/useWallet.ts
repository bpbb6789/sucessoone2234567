
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';

// Export useAccount for compatibility
export { useAccount };
import { useCallback } from 'react';
import { useToast } from './use-toast';
import { shortenAddress, formatBalance } from '@/lib/walletConnect';

export function useWallet() {
  const { toast } = useToast();
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const { data: balance } = useBalance({
    address: address,
  });

  const connectWallet = useCallback((connectorType?: string) => {
    // RainbowKit handles connection through ConnectButton
    // This function is kept for compatibility but not used
    console.log('Use ConnectButton for wallet connection');
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected successfully.",
      duration: 3000
    });
  }, [disconnect, toast]);

  const switchNetwork = useCallback((chainId: number) => {
    switchChain({ chainId });
  }, [switchChain]);

  return {
    isConnected,
    account: address ? {
      address,
      chainId: 1, // This would come from useAccount chain info
      balance: balance?.formatted || '0'
    } : null,
    connector: connector?.name || null,
    isConnecting,
    connectWallet,
    disconnect: handleDisconnect,
    switchChain: switchNetwork,
    shortenAddress,
    formatBalance: (bal?: string) => formatBalance(bal || '0')
  };
}
