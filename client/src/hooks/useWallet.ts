import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  connectMetaMask, 
  getBalance, 
  walletConnectManager,
  shortenAddress,
  formatBalance,
  WALLET_CONNECTORS,
  type WalletAccount,
  type WalletState 
} from '@/lib/walletConnect';

export function useWallet() {
  const { toast } = useToast();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    connector: null
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for existing connection on mount
  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          updateAccount(accounts[0]);
        }
      };

      const handleChainChanged = (chainId: string) => {
        // Reload page on chain change
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          });
          
          const balance = await getBalance(accounts[0]);

          setWalletState({
            isConnected: true,
            account: {
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              balance
            },
            connector: WALLET_CONNECTORS.METAMASK
          });
        }
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const updateAccount = async (address: string) => {
    try {
      const chainId = await window.ethereum!.request({
        method: 'eth_chainId'
      });
      
      const balance = await getBalance(address);

      setWalletState(prev => ({
        ...prev,
        account: {
          address,
          chainId: parseInt(chainId, 16),
          balance
        }
      }));
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const connectWallet = useCallback(async (connector: string = WALLET_CONNECTORS.METAMASK) => {
    setIsConnecting(true);

    try {
      let account: WalletAccount | null = null;

      switch (connector) {
        case WALLET_CONNECTORS.METAMASK:
          account = await connectMetaMask();
          break;
        case WALLET_CONNECTORS.WALLETCONNECT:
          account = await walletConnectManager.connect();
          if (!account) {
            throw new Error('WalletConnect connection was cancelled or failed');
          }
          break;
        default:
          throw new Error(`Unsupported connector: ${connector}`);
      }

      if (account) {
        const balance = await getBalance(account.address);
        account.balance = balance;

        setWalletState({
          isConnected: true,
          account,
          connector
        });

        toast({
          title: "Wallet Connected",
          description: `Connected to ${shortenAddress(account.address)}`,
          duration: 3000
        });
      } else {
        throw new Error('Failed to connect wallet');
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      account: null,
      connector: null
    });

    if (walletState.connector === WALLET_CONNECTORS.WALLETCONNECT) {
      await walletConnectManager.disconnect();
    }

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
      duration: 3000
    });
  }, [walletState.connector, toast]);

  const switchChain = useCallback(async (chainId: number) => {
    try {
      if (!window.ethereum) {
        throw new Error('No ethereum provider');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (error: any) {
      console.error('Failed to switch chain:', error);
      
      toast({
        title: "Chain Switch Failed",
        description: error.message || "Failed to switch network",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    ...walletState,
    isConnecting,
    connectWallet,
    disconnect,
    switchChain,
    // Utility functions
    shortenAddress,
    formatBalance: (balance?: string) => formatBalance(balance || '0')
  };
}