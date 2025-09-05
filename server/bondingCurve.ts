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
const BONDING_CURVE_FACTORY_ADDRESS = process.env.BONDING_CURVE_FACTORY_ADDRESS || "";
const PLATFORM_ADMIN_ADDRESS = process.env.PLATFORM_ADMIN_ADDRESS || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

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
  private provider: ethers.JsonRpcProvider;
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

      const ethAmountWei = ethers.parseEther(ethAmount);
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

      const tokenAmountWei = ethers.parseUnits(tokenAmount, 18);
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

// Helper function to format bonding curve info for API responses
export function formatBondingCurveInfo(info: BondingCurveInfo) {
  return {
    tokenAddress: info.tokenAddress,
    creatorAddress: info.creatorAddress,
    platformAddress: info.platformAddress,
    supply: ethers.formatUnits(info.supply, 18),
    reserve: ethers.formatEther(info.reserve),
    currentPrice: ethers.formatEther(info.currentPrice),
    marketCap: ethers.formatEther(info.marketCap)
  };
}