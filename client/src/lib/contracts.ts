import { Address } from 'viem'
import { TOKEN_ABI } from '../../../abi/TokenAbi'

// Network Contract addresses on Base Sepolia network
export const CONTRACTS = {
  WETH: '0x4267d742e4fd1c03805083b087deb575203e9b19' as Address, // WETH token for Base Sepolia
} as const

// Zora Factory contract address on Base Sepolia (your custom deployment)
export const ZORA_FACTORY_ADDRESS = "0xAe028301c7822F2c254A43451D22dB5Fe447a4a0" as Address;

// Zora Factory Implementation address
export const ZORA_FACTORY_IMPL = "0xb4ac7Bac55f22B88C43b848f3D6d1492C4C823f1" as Address;


// Custom bonding curve removed - using Zora's built-in system

// Types for token creation
export interface TokenCreationParams {
  name: string
  symbol: string
  twitter: string
  discord: string
  bio: string
  imageUri: string
}

// Types for token trading
export interface BuyTokenParams {
  tokenAddress: Address
  amount: bigint
}

export interface SellTokenParams {
  tokenAddress: Address
  amount: bigint
}

// Export the ABIs for direct use
export { TOKEN_ABI }
export const zoraFactoryImplAbi = [
  {
    type: "function",
    name: "createContentCoin",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "description", type: "string" },
      { name: "hooks", type: "address[]" },
      { name: "hookData", type: "bytes" }
    ],
    outputs: [{ name: "coin", type: "address" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "createCreatorCoin",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "creator", type: "address" },
      { name: "hooks", type: "address[]" },
      { name: "hookData", type: "bytes" }
    ],
    outputs: [{ name: "coin", type: "address" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "getAllCreatedCoins",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "CoinCreated",
    inputs: [
      { name: "coin", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false }
    ]
  }
] as const;

export const contentCoinAbi = [
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "buyWithEth",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "minTokensOut", type: "uint256" }
    ],
    outputs: [{ name: "tokensOut", type: "uint256" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "sellForEth",
    inputs: [
      { name: "tokensToSell", type: "uint256" },
      { name: "minEthOut", type: "uint256" }
    ],
    outputs: [{ name: "ethOut", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getBuyPrice",
    inputs: [{ name: "ethAmount", type: "uint256" }],
    outputs: [{ name: "tokenAmount", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getSellPrice",
    inputs: [{ name: "tokenAmount", type: "uint256" }],
    outputs: [{ name: "ethAmount", type: "uint256" }],
    stateMutability: "view"
  }
] as const;