// WalletConnect configuration and utilities
export const WALLETCONNECT_PROJECT_ID = "8b2d0dd39c1cced02ecce163a96a8cb5";

export interface WalletAccount {
  address: string;
  chainId: number;
  balance?: string;
}

export interface WalletState {
  isConnected: boolean;
  account: WalletAccount | null;
  connector: string | null;
}

// Supported wallet connectors
export const WALLET_CONNECTORS = {
  METAMASK: 'metamask',
  WALLETCONNECT: 'walletconnect',
  COINBASE: 'coinbase_wallet'
} as const;

// Chain configurations
export const SUPPORTED_CHAINS = {
  ETHEREUM: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io'
  },
  POLYGON: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  }
} as const;

// Utility functions
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance: string, decimals: number = 18): string {
  const value = parseFloat(balance) / Math.pow(10, decimals);
  return value.toFixed(4);
}

// MetaMask connection utilities
export async function connectMetaMask(): Promise<WalletAccount | null> {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16)
    };
  } catch (error) {
    console.error('MetaMask connection failed:', error);
    return null;
  }
}

export async function getBalance(address: string): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error('No ethereum provider');
    }

    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });

    return balance;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0x0';
  }
}

// WalletConnect utilities (basic implementation)
export class WalletConnectManager {
  private projectId: string;
  
  constructor(projectId: string) {
    this.projectId = projectId;
  }

  async connect(): Promise<WalletAccount | null> {
    // Basic WalletConnect implementation
    // In a real app, you'd use @walletconnect/web3wallet
    try {
      // Placeholder for WalletConnect logic
      console.log('WalletConnect with project ID:', this.projectId);
      
      // For now, fallback to MetaMask if available
      if (window.ethereum) {
        return connectMetaMask();
      }
      
      // Show WalletConnect QR code modal (placeholder)
      alert('WalletConnect integration requires additional setup. Using MetaMask fallback.');
      return null;
    } catch (error) {
      console.error('WalletConnect failed:', error);
      return null;
    }
  }

  disconnect(): void {
    // Disconnect logic
    console.log('Disconnecting WalletConnect');
  }
}

// Global wallet connect manager instance
export const walletConnectManager = new WalletConnectManager(WALLETCONNECT_PROJECT_ID);

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}