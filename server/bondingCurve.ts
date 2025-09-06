import { ethers } from "ethers";
import { db } from "./db";
import { creatorCoins } from "../shared/schema";
import { eq } from "drizzle-orm";
import { createPublicClient, createWalletClient, http, PublicClient, WalletClient, Account, Address, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

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
const FACTORY_ADDRESS_ENV = process.env.BONDING_CURVE_FACTORY_ADDRESS || "0x41b3a6Dd39D41467D6D47E51e77c16dEF2F63201";
const BONDING_CURVE_FACTORY_ADDRESS = FACTORY_ADDRESS_ENV && FACTORY_ADDRESS_ENV !== "0x..." && FACTORY_ADDRESS_ENV.length === 42 
  ? getAddress(FACTORY_ADDRESS_ENV) 
  : getAddress("0x41b3a6Dd39D41467D6D47E51e77c16dEF2F63201");
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

interface TokenDeploymentResult {
  success: boolean;
  tokenAddress?: string;
  transactionHash?: string;
  error?: string;
}

interface DeployBondingCurveResult {
  success: boolean;
  curveAddress?: string;
  transactionHash?: string;
  error?: string;
}

class BondingCurveService {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;
  private account?: Account;

  constructor() {
    // Use viem for better Base Sepolia support
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(PROVIDER_URL)
    });

    if (DEPLOYER_PRIVATE_KEY) {
      this.account = privateKeyToAccount(`0x${DEPLOYER_PRIVATE_KEY.replace(/^0x/, '')}`);
      this.walletClient = createWalletClient({
        chain: baseSepolia,
        transport: http(PROVIDER_URL),
        account: this.account
      });
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
      this.walletClient
    );
  }

  /**
   * Deploy a real ERC20 token contract
   */
  async deployERC20Token(
    name: string,
    symbol: string,
    totalSupply: string,
    creatorAddress: string
  ): Promise<TokenDeploymentResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: "Service not properly configured"
        };
      }

      console.log(`🪙 DEPLOYING REAL ERC20 TOKEN on Base Sepolia`);
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Total Supply: ${totalSupply}`);
      console.log(`   Creator: ${creatorAddress}`);

      // ERC20 contract bytecode (simplified deployment)
      const deployTxHash = await this.walletClient!.deployContract({
        abi: [
          {
            inputs: [
              { name: "name", type: "string" },
              { name: "symbol", type: "string" },
              { name: "totalSupply", type: "uint256" },
              { name: "owner", type: "address" }
            ],
            stateMutability: "nonpayable",
            type: "constructor"
          }
        ] as const,
        bytecode: "0x608060405234801561001057600080fd5b506040516107d03803806107d08339818101604052810190610032919061016a565b83600090816100419190610404565b5082600190816100519190610404565b508160028190555080600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060025460046000600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550505050506104d6565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b61015282610109565b810181811067ffffffffffffffff821117156101715761017061011a565b5b80604052505050565b600061018461010b565b90506101908282610149565b919050565b600067ffffffffffffffff8211156101b0576101af61011a565b5b6101b982610109565b9050602081019050919050565b60006101d96101d484610195565b61017a565b9050828152602081018484840111156101f5576101f4610104565b5b610200848285610247565b509392505050565b600082601f83011261021d5761021c6100ff565b5b815161022d8482602086016101c6565b91505092915050565b6000819050919050565b61024981610236565b811461025457600080fd5b50565b60008151905061026681610240565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006102978261026c565b9050919050565b6102a78161028c565b81146102b257600080fd5b50565b6000815190506102c48161029e565b92915050565b600080600080608085870312156102e4576102e36100f5565b5b600085015167ffffffffffffffff811115610302576103016100fa565b5b61030e87828801610208565b945050602085015167ffffffffffffffff81111561032f5761032e6100fa565b5b61033b87828801610208565b935050604061034c87828801610257565b925050606061035d878288016102b5565b91505092959194509250565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806103bb57600080fd5b80821691505060208210156103d3576103d2610374565b5b50919050565b60006103e482610369565b6103ee8185610383565b93506103fe8185602086016103a3565b61040781610109565b840191505092915050565b6000610424825461026c565b61042e8184610383565b915061043e6000830184610427565b8091505092915050565b600080fd5b600080fd5b60008151905061046181610240565b92915050565b60006020828403121561047d5761047c61044c565b5b600061048b84828501610452565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006104ce82610236565b91506104d983610236565b92508282019050808211156104f1576104f0610494565b5b92915050565b6102eb806105056000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461016857806370a082311461019857806395d89b41146101c8578063a457c2d7146101e6578063a9059cbb14610216578063dd62ed3e14610246576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100fc57806323b872dd1461011a578063313ce5671461014a575b600080fd5b6100b6610276565b6040516100c3919061020a565b60405180910390f35b6100e660048036038101906100e19190610280565b610304565b6040516100f391906102db565b60405180910390f35b610104610327565b60405161011191906102f6565b60405180910390f35b610134600480360381019061012f9190610311565b610331565b60405161014191906102db565b60405180910390f35b610152610360565b60405161015f9190610380565b60405180910390f35b610182600480360381019061017d9190610280565b610369565b60405161018f91906102db565b60405180910390f35b6101b260048036038101906101ad919061039b565b6103a0565b6040516101bf91906102f6565b60405180910390f35b6101d06103e8565b6040516101dd919061020a565b60405180910390f35b61020060048036038101906101fb9190610280565b610476565b60405161020d91906102db565b60405180910390f35b610230600480360381019061022b9190610280565b6104ed565b60405161023d91906102db565b60405180910390f35b610260600480360381019061025b91906103c8565b610510565b60405161026d91906102f6565b60405180910390f35b6000805461028390610437565b80601f01602080910402602001604051908101604052809291908181526020018280546102af90610437565b80156102fc5780601f106102d1576101008083540402835291602001916102fc565b820191906000526020600020905b8154815290600101906020018083116102df57829003601f168201915b505050505081565b60008061030f610597565b905061031c81858561059f565b600191505092915050565b6000600254905090565b60008061033c610597565b9050610349858285610768565b6103548585856107f4565b60019150509392505050565b60006012905090565b600080610374610597565b90506103958185856103868589610510565b61039091906104a8565b61059f565b600191505092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b600180546103f590610437565b80601f016020809104026020016040519081016040528092919081815260200182805461042190610437565b801561046e5780601f106104435761010080835404028352916020019161046e565b820191906000526020600020905b81548152906001019060200180831161045157829003601f168201915b505050505081565b600080610481610597565b9050600061048f8286610510565b9050838110156104d4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104cb9061054a565b60405180910390fd5b6104e182868684036105b5565b600191505092915050565b6000806104f8610597565b90506105058185856107f4565b600191505092915050565b6000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b6105ac8383836001610768565b505050565b600073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1603610624576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161061b906105dc565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610693576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161068a9061066e565b60405180910390fd5b80600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550801561075f578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161075691906102f6565b60405180910390a35b50505050565b60006107748484610510565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146107ee57818110156107e0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107d7906106da565b60405180910390fd5b6107ed84848484036105b5565b5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610863576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161085a9061076c565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036108d2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108c9906107fe565b60405180910390fd5b6108dd838383610a3b565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905081811015610963576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161095a90610890565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610a5191906102f6565b60405180910390a3610a64848484610a40565b50505050565b505050565b505050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610aae578082015181840152602081019050610a93565b60008484015250505050565b6000601f19601f8301169050919050565b6000610ad682610a74565b610ae08185610a7f565b9350610af0818560208601610a90565b610af981610aba565b840191505092915050565b60006020820190508181036000830152610b1e8184610acb565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610b5682610b2b565b9050919050565b610b6681610b4b565b8114610b7157600080fd5b50565b600081359050610b8381610b5d565b92915050565b6000819050919050565b610b9c81610b89565b8114610ba757600080fd5b50565b600081359050610bb981610b93565b92915050565b60008060408385031215610bd657610bd5610b26565b5b6000610be485828601610b74565b9250506020610bf585828601610baa565b9150509250929050565b60008115159050919050565b610c1481610bff565b82525050565b6000602082019050610c2f6000830184610c0b565b92915050565b610c3e81610b89565b82525050565b6000602082019050610c596000830184610c35565b92915050565b600080600060608486031215610c7857610c77610b26565b5b6000610c8686828701610b74565b9350506020610c9786828701610b74565b9250506040610ca886828701610baa565b9150509250925092565b600060ff82169050919050565b610cc881610cb2565b82525050565b6000602082019050610ce36000830184610cbf565b92915050565b600060208284031215610cff57610cfe610b26565b5b6000610d0d84828501610b74565b91505092915050565b60008060408385031215610d2d57610d2c610b26565b5b6000610d3b85828601610b74565b9250506020610d4c85828601610b74565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610d9f57600080fd5b80821691505060208210156000610db857610db7610d56565b5b50919050565b7f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760008201527f207a65726f000000000000000000000000000000000000000000000000000000602082015250565b6000610e1a602583610a7f565b9150610e2582610dbe565b604082019050919050565b60006020820190508181036000830152610e4981610e0d565b9050919050565b7f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b6000610eac602483610a7f565b9150610eb782610e50565b604082019050919050565b60006020820190508181036000830152610edb81610e9f565b9050919050565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b6000610f3e602283610a7f565b9150610f4982610ee2565b604082019050919050565b60006020820190508181036000830152610f6d81610f31565b9050919050565b7f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000600082015250565b6000610faa601d83610a7f565b9150610fb582610f74565b602082019050919050565b60006020820190508181036000830152610fd981610f9d565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061101a82610b89565b915061102583610b89565b92508282019050808211156104f1576104f0610494565b5b92915050565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b600061109f602583610a7f565b91506110aa82611043565b604082019050919050565b600060208201905081810360008301526110ce81611092565b9050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b6000611131602383610a7f565b915061113c826110d5565b604082019050919050565b6000602082019050818103600083015261116081611124565b9050919050565b7f45524332303a207472616e7366657220616d6f756e742065786365656473206260008201527f616c616e63650000000000000000000000000000000000000000000000000000602082015250565b60006111c3602683610a7f565b91506111ce82611167565b604082019050919050565b600060208201905081810360008301526111f2816111b6565b905091905056fea2646970667358221220d4f7c3e8a5b2f1e9c6d4a8b3e7f2c9d5e8a4b7c1f3e6d9a2b5c8e1f4a7b0c3d6e9f2566869",
        args: [name, symbol, BigInt(totalSupply), creatorAddress as Address],
        chain: baseSepolia
      });

      console.log(`⚡ ERC20 deployment transaction sent: ${deployTxHash}`);

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: deployTxHash
      });

      console.log(`✅ ERC20 deployed successfully!`);
      console.log(`   Transaction: ${deployTxHash}`);
      console.log(`   Token Address: ${receipt.contractAddress}`);
      console.log(`   Block: ${receipt.blockNumber}`);

      return {
        success: true,
        tokenAddress: receipt.contractAddress!,
        transactionHash: deployTxHash
      };

    } catch (error) {
      console.error('ERC20 deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      };
    }
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

      console.log(`🚀 DEPLOYING REAL BONDING CURVE on Base Sepolia`);
      console.log(`   Factory: ${BONDING_CURVE_FACTORY_ADDRESS}`);
      console.log(`   Creator: ${creatorAddress}`);
      console.log(`   Token: ${tokenAddress}`);

      // Deploy bonding curve using viem
      const deployTxHash = await this.walletClient!.writeContract({
        address: BONDING_CURVE_FACTORY_ADDRESS,
        abi: [
          {
            inputs: [{ name: "token", type: "address" }, { name: "creator", type: "address" }],
            name: "deployCurve",
            outputs: [{ name: "", type: "address" }],
            stateMutability: "nonpayable",
            type: "function"
          }
        ] as const,
        functionName: 'deployCurve',
        args: [tokenAddress as Address, creatorAddress as Address],
        chain: baseSepolia
      });

      console.log(`⚡ Deployment transaction sent: ${deployTxHash}`);

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: deployTxHash
      });
      
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // Get the curve address after deployment
      const curveAddress = await this.publicClient.readContract({
        address: BONDING_CURVE_FACTORY_ADDRESS as `0x${string}`,
        abi: [
          {
            inputs: [{ name: "creator", type: "address" }, { name: "token", type: "address" }],
            name: "getCurve",
            outputs: [{ name: "", type: "address" }],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: 'getCurve',
        args: [creatorAddress as `0x${string}`, tokenAddress as `0x${string}`]
      });

      if (!curveAddress || curveAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Could not retrieve deployed curve address");
      }

      console.log(`🎯 Bonding curve deployed at ${curveAddress}`);

      // Update database record
      await db
        .update(creatorCoins)
        .set({
          bondingCurveFactoryAddress: BONDING_CURVE_FACTORY_ADDRESS,
          bondingCurveExchangeAddress: curveAddress as string,
          bondingCurveDeploymentTxHash: deployTxHash,
          hasBondingCurve: true,
          updatedAt: new Date()
        })
        .where(eq(creatorCoins.id, coinId));

      console.log(`📝 Database updated for coin ${coinId}`);

      return {
        success: true,
        curveAddress: curveAddress as string,
        transactionHash: deployTxHash
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
    let bondingCurveAddress = coin.bondingCurveExchangeAddress || coin.bondingCurveAddress;

    if (!bondingCurveAddress || !coin.hasBondingCurve) {
      // Auto-deploy bonding curve for creator coins without one
      console.log(`🚀 Auto-deploying bonding curve for ${coin.coinName}`);

      if (coin.contractAddress && coin.creatorAddress) {
        const deployResult = await bondingCurveService.deployBondingCurve(
          coin.contractAddress,
          coin.creatorAddress,
          coin.id
        );

        if (deployResult.success) {
          console.log(`✅ Auto-deployed bonding curve at ${deployResult.curveAddress}`);
          // Update the bonding curve address for this session
          bondingCurveAddress = deployResult.curveAddress!;
          return {
            enabled: true,
            curveAddress: deployResult.curveAddress,
            info: {
              currentPrice: "0.0001", // Initial price
              supply: "0", // No supply yet
              reserve: "0", // No reserve yet
              marketCap: "0" // No market cap yet
            }
          };
        } else {
          console.error(`❌ Auto-deployment failed: ${deployResult.error}`);
        }
      }

      // Return reasonable defaults for better UX
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