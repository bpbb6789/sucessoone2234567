import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base, baseSepolia } from 'wagmi/chains';

// RainbowKit configuration
export const config = getDefaultConfig({
  appName: 'UniPump',
  projectId: import.meta.env.VITE_WC_PROJECT_ID || "8b2d0dd39c1cced02ecce163a96a8cb5",
  chains: [mainnet, base, baseSepolia],
  ssr: true,
});

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

// Chain configurations
export const SUPPORTED_CHAINS = {
  ETHEREUM: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io'
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/o3VW3WRXrsXXMRX3l7jZxLUqhWyZzXBy',
    blockExplorer: 'https://sepolia.basescan.org'
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