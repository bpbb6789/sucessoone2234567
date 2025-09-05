import { Address } from 'viem'
import { TOKEN_ABI } from '../../../abi/TokenAbi'

// Bonding Curve Contract addresses on Base Sepolia network
export const CONTRACTS = {
  BONDING_CURVE_FACTORY: '0x787b9de286a18da63805e9df943286bba2ca0c3d' as Address, // Main bonding curve factory
  WETH: '0x4267d742e4fd1c03805083b087deb575203e9b19' as Address, // WETH token for Base Sepolia
} as const

// Bonding Curve Factory ABI (minimal interface for client)
export const BONDING_CURVE_FACTORY_ABI = [
  "function deployCurve(address token, address creator) external returns (address)",
  "function getCurve(address creator, address token) external view returns (address)",
  "function curveExists(address creator, address token) external view returns (bool)",
  "event CurveDeployed(address indexed creator, address indexed token, address indexed curve, uint256 curveIndex)"
] as const

// Bonding Curve Exchange ABI (minimal interface for client)
export const BONDING_CURVE_EXCHANGE_ABI = [
  "function buy(uint256 minTokensOut) external payable",
  "function sell(uint256 tokenAmount, uint256 minEthOut) external",
  "function calculateBuyTokens(uint256 ethAmount) external view returns (uint256)",
  "function calculateSellTokens(uint256 tokenAmount) external view returns (uint256)",
  "function getCurrentPrice() external view returns (uint256)",
  "function getMarketCap() external view returns (uint256)",
  "function totalSupplyInCurve() external view returns (uint256)",
  "function ethReserve() external view returns (uint256)",
  "function getInfo() external view returns (address, address, address, uint256, uint256)"
] as const

// Contract configurations for wagmi
export const bondingCurveFactoryConfig = {
  address: CONTRACTS.BONDING_CURVE_FACTORY,
  abi: BONDING_CURVE_FACTORY_ABI,
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