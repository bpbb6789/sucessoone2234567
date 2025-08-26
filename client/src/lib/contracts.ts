import { Address } from 'viem'
import { TOKEN_FACTORY_ABI } from '../../../abi/TokenFactoryAbi'
import { PUMP_FUN_ABI } from '../../../abi/PumpFunAbi'
import { TOKEN_ABI } from '../../../abi/TokenAbi'

// Contract addresses on Base Sepolia network - TO BE DEPLOYED!
export const CONTRACTS = {
  PUMP_FUN: '0x0000000000000000000000000000000000000000' as Address, // PumpFun - main bonding curve contract (TO BE DEPLOYED)
  TOKEN_FACTORY: '0x0000000000000000000000000000000000000000' as Address, // TokenFactory - token factory (TO BE DEPLOYED)
  WETH: '0x4267d742e4fd1c03805083b087deb575203e9b19' as Address, // WETH token for Base Sepolia
} as const

// Contract configurations for wagmi
export const tokenFactoryConfig = {
  address: CONTRACTS.TOKEN_FACTORY,
  abi: TOKEN_FACTORY_ABI,
} as const

export const pumpFunConfig = {
  address: CONTRACTS.PUMP_FUN,
  abi: PUMP_FUN_ABI,
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

// Export the ABIs for direct use
export { PUMP_FUN_ABI, TOKEN_FACTORY_ABI, TOKEN_ABI }