import { Address } from 'viem'
import { UniPumpCreatorAbi } from '../../../abi/UniPumpCreatorAbi'
import { UniPumpAbi } from '../../../abi/UniPumpAbi.s'

// Contract addresses on Base Sepolia network
// TODO: Replace with actual deployed addresses
export const CONTRACTS = {
  UNIPUMP_CREATOR: '0x0000000000000000000000000000000000000000' as Address, // Replace with real address
  UNIPUMP: '0x0000000000000000000000000000000000000000' as Address, // Replace with real address
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