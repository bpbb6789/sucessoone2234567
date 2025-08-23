import { Address } from 'viem'
import { UniPumpCreatorAbi } from '../../../abi/UniPumpCreatorAbi'
import { UniPumpAbi } from '../../../abi/UniPumpAbi.s'

// Contract addresses on Base Sepolia network - DEPLOYED!
export const CONTRACTS = {
  UNIPUMP_CREATOR: '0xada0ff7c8f108e311ca7c82845a1b8ef26e90e11' as Address, // UniPumpCreator - token factory
  UNIPUMP: '0xe7f06cc969f37958bcaf6af7c9f93b251338ea80' as Address, // UniPump - main bonding curve contract
  WETH: '0x4267d742e4fd1c03805083b087deb575203e9b19' as Address, // WETH token for Base Sepolia
  POOL_MANAGER: '0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829' as Address, // Uniswap V4 Pool Manager
  FEE_HOOK: '0xb65b299f330bbf4c0d4115737388dd3b61cc50c0' as Address, // Dynamic Fee Hook
} as const

// Contract configurations for wagmi
export const uniPumpCreatorConfig = {
  address: CONTRACTS.UNIPUMP_CREATOR,
  abi: UniPumpCreatorAbi,
} as const

export const uniPumpConfig = {
  address: CONTRACTS.UNIPUMP,
  abi: UniPumpAbi,
} as const

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