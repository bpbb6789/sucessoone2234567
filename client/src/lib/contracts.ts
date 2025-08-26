import { Address } from 'viem'
import { TOKEN_FACTORY_ABI } from '../../../abi/TokenFactoryAbi'
import { PUMP_FUN_ABI } from '../../../abi/PumpFunAbi'
import { TOKEN_ABI } from '../../../abi/TokenAbi'

// Contract addresses on Base Sepolia network - DEPLOYED!
export const CONTRACTS = {
  PUMP_FUN: '0x41b3a6Dd39D41467D6D47E51e77c16dEF2F63201' as Address, // PumpFun - main bonding curve contract
  TOKEN_FACTORY: '0x24408Fc5a7f57c3b24E85B9f97016F582391C9A9' as Address, // TokenFactory - token factory
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