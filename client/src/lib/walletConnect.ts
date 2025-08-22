
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WalletConnectModal } from '@walletconnect/modal';
import { SignClient } from '@walletconnect/sign-client';

// WalletConnect configuration and utilities
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || "8b2d0dd39c1cced02ecce163a96a8cb5";

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

// WalletConnect v2 implementation
export class WalletConnectManager {
  private projectId: string;
  private signClient: SignClient | null = null;
  private modal: WalletConnectModal | null = null;
  private session: any = null;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.init();
  }

  private async init() {
    try {
      // Initialize WalletConnect Modal
      this.modal = new WalletConnectModal({
        projectId: this.projectId,
        chains: [1, 84532], // Ethereum and Base Sepolia
        themeMode: 'light'
      });

      // Initialize Sign Client
      this.signClient = await SignClient.init({
        projectId: this.projectId,
        metadata: {
          name: 'UniPump',
          description: 'Decentralized video platform with token creation',
          url: window.location.origin,
          icons: ['/logo.svg']
        }
      });

      // Set up event listeners
      this.signClient.on('session_proposal', this.handleSessionProposal.bind(this));
      this.signClient.on('session_request', this.handleSessionRequest.bind(this));
      this.signClient.on('session_delete', this.handleSessionDelete.bind(this));

      // Check for existing sessions
      const sessions = this.signClient.session.getAll();
      if (sessions.length > 0) {
        this.session = sessions[0];
      }

    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
    }
  }

  private handleSessionProposal(event: any) {
    // Auto-approve session proposal
    const { id, params } = event;
    const { proposer, requiredNamespaces } = params;

    // Approve the session
    this.signClient?.approve({
      id,
      namespaces: {
        eip155: {
          accounts: [
            "eip155:1:0x0000000000000000000000000000000000000000", // Placeholder
            "eip155:84532:0x0000000000000000000000000000000000000000"
          ],
          methods: [
            "eth_sendTransaction",
            "eth_signTransaction",
            "eth_sign",
            "personal_sign",
            "eth_signTypedData"
          ],
          events: ["chainChanged", "accountsChanged"]
        }
      }
    });
  }

  private handleSessionRequest(event: any) {
    console.log('Session request:', event);
  }

  private handleSessionDelete() {
    this.session = null;
  }

  async connect(): Promise<WalletAccount | null> {
    try {
      if (!this.signClient) {
        await this.init();
      }

      // Check for existing session
      if (this.session) {
        const accounts = this.session.namespaces.eip155?.accounts || [];
        if (accounts.length > 0) {
          const account = accounts[0].split(':')[2];
          return {
            address: account,
            chainId: parseInt(accounts[0].split(':')[1])
          };
        }
      }

      // Create new connection
      const { uri, approval } = await this.signClient!.connect({
        requiredNamespaces: {
          eip155: {
            methods: [
              "eth_sendTransaction",
              "eth_signTransaction", 
              "eth_sign",
              "personal_sign",
              "eth_signTypedData"
            ],
            chains: ["eip155:1", "eip155:84532"],
            events: ["chainChanged", "accountsChanged"]
          }
        }
      });

      // Open modal with URI
      if (uri && this.modal) {
        this.modal.openModal({ uri });
      }

      // Wait for session approval
      this.session = await approval();
      
      if (this.modal) {
        this.modal.closeModal();
      }

      const accounts = this.session.namespaces.eip155?.accounts || [];
      if (accounts.length > 0) {
        const account = accounts[0].split(':')[2];
        return {
          address: account,
          chainId: parseInt(accounts[0].split(':')[1])
        };
      }

      return null;
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      if (this.modal) {
        this.modal.closeModal();
      }
      return null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.session && this.signClient) {
        await this.signClient.disconnect({
          topic: this.session.topic,
          reason: {
            code: 6000,
            message: "User disconnected"
          }
        });
      }
      this.session = null;
    } catch (error) {
      console.error('Failed to disconnect WalletConnect:', error);
    }
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.session || !this.signClient) {
      throw new Error('No active WalletConnect session');
    }

    const result = await this.signClient.request({
      topic: this.session.topic,
      chainId: "eip155:1",
      request: {
        method: "eth_sendTransaction",
        params: [transaction]
      }
    });

    return result;
  }

  isConnected(): boolean {
    return !!this.session;
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
