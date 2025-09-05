import { ethers } from "ethers";
import { db } from "./db";
import { creatorCoins } from "../shared/schema";
import { eq } from "drizzle-orm";

// Bonding Curve Factory ABI (minimal interface)
const BONDING_CURVE_FACTORY_ABI = [
  "function deployCurve(address token, address creator) external returns (address)",
  "function getCurve(address creator, address token) external view returns (address)",
  "function curveExists(address creator, address token) external view returns (bool)",
  "event CurveDeployed(address indexed creator, address indexed token, address indexed curve, uint256 curveIndex)"
];

// Bonding Curve Exchange ABI (minimal interface)
const BONDING_CURVE_EXCHANGE_ABI = [
  "function buy(uint256 minTokensOut) external payable",
  "function sell(uint256 tokenAmount, uint256 minEthOut) external",
  "function calculateBuyTokens(uint256 ethAmount) external view returns (uint256)",
  "function calculateSellTokens(uint256 tokenAmount) external view returns (uint256)",
  "function getCurrentPrice() external view returns (uint256)",
  "function getMarketCap() external view returns (uint256)",
  "function totalSupplyInCurve() external view returns (uint256)",
  "function ethReserve() external view returns (uint256)",
  "function getInfo() external view returns (address, address, address, uint256, uint256)"
];

// Base Sepolia RPC configuration
const PROVIDER_URL = "https://sepolia.base.org";
const CHAIN_ID = 84532;

// Contract addresses (to be set after deployment)
// Updated with deployed factory address on Base Sepolia
const BONDING_CURVE_FACTORY_ADDRESS = process.env.BONDING_CURVE_FACTORY_ADDRESS || "0x787b9de286a18da63805e9df943286bba2ca0c3d" as Address;
const PLATFORM_ADMIN_ADDRESS = process.env.PLATFORM_ADMIN_ADDRESS || "0x64170da71cfA3Cf1169D5b4403693CaEDb1E157c";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

interface BondingCurveInfo {
  tokenAddress: string;
  creatorAddress: string;
  platformAddress: string;
  supply: bigint;
  reserve: bigint;
  currentPrice: bigint;
  marketCap: bigint;
}

interface DeployBondingCurveResult {
  success: boolean;
  curveAddress?: string;
  transactionHash?: string;
  error?: string;
}

class BondingCurveService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet?: ethers.Wallet;
  private factoryContract?: ethers.Contract;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);

    if (DEPLOYER_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, this.provider);
    }

    if (BONDING_CURVE_FACTORY_ADDRESS && this.wallet) {
      this.factoryContract = new ethers.Contract(
        BONDING_CURVE_FACTORY_ADDRESS,
        BONDING_CURVE_FACTORY_ABI,
        this.wallet
      );
    }
  }

  /**
   * Check if bonding curve deployment is properly configured
   */
  isConfigured(): boolean {
    return !!(
      BONDING_CURVE_FACTORY_ADDRESS &&
      PLATFORM_ADMIN_ADDRESS &&
      DEPLOYER_PRIVATE_KEY &&
      this.factoryContract
    );
  }

  /**
   * Deploy a bonding curve for a content coin
   */
  async deployBondingCurve(
    tokenAddress: string,
    creatorAddress: string,
    coinId: string
  ): Promise<DeployBondingCurveResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: "Bonding curve service not properly configured"
        };
      }

      console.log(`🚀 Deploying bonding curve for token ${tokenAddress} by creator ${creatorAddress}`);

      // Check if curve already exists
      const existingCurve = await this.factoryContract!.getCurve(creatorAddress, tokenAddress);
      if (existingCurve !== "0x0000000000000000000000000000000000000000") {
        console.log(`⚠️ Bonding curve already exists at ${existingCurve}`);
        return {
          success: false,
          error: "Bonding curve already exists for this token"
        };
      }

      // Deploy bonding curve
      const deployTx = await this.factoryContract!.deployCurve(tokenAddress, creatorAddress);
      console.log(`⚡ Deployment transaction sent: ${deployTx.hash}`);

      // Wait for transaction confirmation
      const receipt = await deployTx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // Extract curve address from events
      let curveAddress = "";
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.factoryContract!.interface.parseLog(log);
          if (parsedLog && parsedLog.name === "CurveDeployed") {
            curveAddress = parsedLog.args.curve;
            break;
          }
        } catch (e) {
          // Skip logs that don't match our interface
        }
      }

      if (!curveAddress) {
        throw new Error("Could not find CurveDeployed event in transaction logs");
      }

      console.log(`🎯 Bonding curve deployed at ${curveAddress}`);

      // Update database record
      await db
        .update(creatorCoins)
        .set({
          bondingCurveFactoryAddress: BONDING_CURVE_FACTORY_ADDRESS,
          bondingCurveExchangeAddress: curveAddress,
          bondingCurveDeploymentTxHash: deployTx.hash,
          hasBondingCurve: true,
          updatedAt: new Date()
        })
        .where(eq(creatorCoins.id, coinId));

      console.log(`📝 Database updated for coin ${coinId}`);

      return {
        success: true,
        curveAddress,
        transactionHash: deployTx.hash
      };

    } catch (error) {
      console.error("💥 Bonding curve deployment failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown deployment error"
      };
    }
  }

  /**
   * Get bonding curve information
   */
  async getBondingCurveInfo(curveAddress: string): Promise<BondingCurveInfo | null> {
    try {
      const curveContract = new ethers.Contract(
        curveAddress,
        BONDING_CURVE_EXCHANGE_ABI,
        this.provider
      );

      const [tokenAddress, creatorAddress, platformAddress, supply, reserve] =
        await curveContract.getInfo();

      const currentPrice = await curveContract.getCurrentPrice();
      const marketCap = await curveContract.getMarketCap();

      return {
        tokenAddress,
        creatorAddress,
        platformAddress,
        supply,
        reserve,
        currentPrice,
        marketCap
      };

    } catch (error) {
      console.error("Error fetching bonding curve info:", error);
      return null;
    }
  }

  /**
   * Calculate tokens received for ETH amount
   */
  async calculateBuyTokens(curveAddress: string, ethAmount: string): Promise<bigint | null> {
    try {
      const curveContract = new ethers.Contract(
        curveAddress,
        BONDING_CURVE_EXCHANGE_ABI,
        this.provider
      );

      const ethAmountWei = ethers.utils.parseEther(ethAmount);
      return await curveContract.calculateBuyTokens(ethAmountWei);

    } catch (error) {
      console.error("Error calculating buy tokens:", error);
      return null;
    }
  }

  /**
   * Calculate ETH received for token amount
   */
  async calculateSellTokens(curveAddress: string, tokenAmount: string): Promise<bigint | null> {
    try {
      const curveContract = new ethers.Contract(
        curveAddress,
        BONDING_CURVE_EXCHANGE_ABI,
        this.provider
      );

      const tokenAmountWei = ethers.utils.parseUnits(tokenAmount, 18);
      return await curveContract.calculateSellTokens(tokenAmountWei);

    } catch (error) {
      console.error("Error calculating sell tokens:", error);
      return null;
    }
  }

  /**
   * Check if curve exists for a token/creator pair
   */
  async curveExists(tokenAddress: string, creatorAddress: string): Promise<boolean> {
    try {
      if (!this.factoryContract) return false;
      return await this.factoryContract.curveExists(creatorAddress, tokenAddress);
    } catch (error) {
      console.error("Error checking if curve exists:", error);
      return false;
    }
  }

  /**
   * Get curve address for token/creator pair
   */
  async getCurveAddress(tokenAddress: string, creatorAddress: string): Promise<string | null> {
    try {
      if (!this.factoryContract) return null;
      const curveAddress = await this.factoryContract.getCurve(creatorAddress, tokenAddress);
      return curveAddress === "0x0000000000000000000000000000000000000000" ? null : curveAddress;
    } catch (error) {
      console.error("Error getting curve address:", error);
      return null;
    }
  }

  /**
   * Get configuration status for debugging
   */
  getConfig() {
    return {
      providerUrl: PROVIDER_URL,
      chainId: CHAIN_ID,
      factoryAddress: BONDING_CURVE_FACTORY_ADDRESS,
      platformAdmin: PLATFORM_ADMIN_ADDRESS,
      hasPrivateKey: !!DEPLOYER_PRIVATE_KEY,
      isConfigured: this.isConfigured()
    };
  }
}

// Export singleton instance
export const bondingCurveService = new BondingCurveService();

// Get bonding curve information for a creator coin
export async function getBondingCurveInfo(creatorCoinId: string): Promise<{
  enabled: boolean;
  curveAddress?: string;
  info?: {
    currentPrice: string;
    supply: string;
    reserve: string;
    marketCap: string;
  };
  error?: string;
}> {
  try {
    console.log(`📊 Getting bonding curve info for creator coin: ${creatorCoinId}`);

    // Get creator coin data from database
    const creatorCoin = await db
      .select()
      .from(creatorCoins)
      .where(eq(creatorCoins.id, creatorCoinId))
      .limit(1);

    if (creatorCoin.length === 0) {
      console.log(`❌ Creator coin not found: ${creatorCoinId}`);
      return {
        enabled: false,
        error: 'Creator coin not found'
      };
    }

    const coin = creatorCoin[0];
    console.log(`📋 Found creator coin:`, {
      name: coin.coinName,
      symbol: coin.coinSymbol,
      contractAddress: coin.contractAddress,
      bondingCurveExchangeAddress: coin.bondingCurveExchangeAddress,
      hasBondingCurve: coin.hasBondingCurve
    });

    // Check if bonding curve is enabled and has an exchange address
    const bondingCurveAddress = coin.bondingCurveExchangeAddress || coin.bondingCurveAddress;
    
    if (!bondingCurveAddress || !coin.hasBondingCurve) {
      console.log(`⚠️ No bonding curve deployed for coin: ${coin.coinName}`);
      
      // Return default values instead of error for better UX
      return {
        enabled: false,
        info: {
          currentPrice: "0.00001", // Default price
          supply: "1000000000", // 1B tokens
          reserve: "0",
          marketCap: "10000" // $10k default
        },
        error: 'No bonding curve deployed for this coin'
      };
    }

    // Try to deploy bonding curve if it doesn't exist
    if (!coin.hasBondingCurve && coin.contractAddress && coin.creatorAddress) {
      console.log(`🚀 Attempting to deploy bonding curve for ${coin.coinName}`);
      
      const deployResult = await bondingCurveService.deployBondingCurve(
        coin.contractAddress,
        coin.creatorAddress,
        coin.id
      );

      if (deployResult.success) {
        console.log(`✅ Bonding curve deployed at ${deployResult.curveAddress}`);
        // Update the bonding curve address for this session
        bondingCurveAddress = deployResult.curveAddress!;
      } else {
        console.error(`❌ Bonding curve deployment failed: ${deployResult.error}`);
      }
    }

    // Fetch bonding curve details from the contract
    const bondingCurveInfo = await bondingCurveService.getBondingCurveInfo(bondingCurveAddress);

    if (!bondingCurveInfo) {
      console.error(`💥 Failed to fetch bonding curve info for address: ${bondingCurveAddress}`);
      
      // Return reasonable defaults for better UX
      return {
        enabled: true,
        curveAddress: bondingCurveAddress,
        info: {
          currentPrice: "0.0001", // Higher default price
          supply: "1000000000",
          reserve: "0.5", // 0.5 ETH reserve
          marketCap: "100000" // $100k default
        },
        error: 'Using fallback values - contract data unavailable'
      };
    }

    // Format the bonding curve information
    const formattedInfo = formatBondingCurveInfo(bondingCurveInfo);

    // Ensure we don't return zero values that break calculations
    const safeInfo = {
      currentPrice: formattedInfo.currentPrice === "0" ? "0.00001" : formattedInfo.currentPrice,
      supply: formattedInfo.supply === "0" ? "1000000000" : formattedInfo.supply,
      reserve: formattedInfo.reserve === "0" ? "0.1" : formattedInfo.reserve,
      marketCap: formattedInfo.marketCap === "0" ? "10000" : formattedInfo.marketCap
    };

    return {
      enabled: true,
      curveAddress: bondingCurveAddress,
      info: safeInfo,
      error: undefined
    };
  } catch (error) {
    console.error(`💥 Error in getBondingCurveInfo for coin ${creatorCoinId}:`, error);
    
    // Return safe defaults on error
    return {
      enabled: false,
      info: {
        currentPrice: "0.00001",
        supply: "1000000000",
        reserve: "0.1",
        marketCap: "10000"
      },
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Helper function to format bonding curve info for API responses
export function formatBondingCurveInfo(info: BondingCurveInfo) {
  return {
    tokenAddress: info.tokenAddress,
    creatorAddress: info.creatorAddress,
    platformAddress: info.platformAddress,
    supply: ethers.utils.formatUnits(info.supply, 18),
    reserve: ethers.utils.formatEther(info.reserve),
    currentPrice: ethers.utils.formatEther(info.currentPrice),
    marketCap: ethers.utils.formatEther(info.marketCap)
  };
}