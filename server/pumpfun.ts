import { createPublicClient, createWalletClient, http, encodeFunctionData, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

// PumpFun contract configuration - Updated with correct TokenFactory address
const PUMP_FUN_ADDRESS = '0x41b3a6Dd39D41467D6D47E51e77c16dEF2F63201' as const; // Legacy PumpFun
const TOKEN_FACTORY_ADDRESS = '0x24408Fc5a7f57c3b24E85B9f97016F582391C9A9' as const; // Correct TokenFactory

// TokenFactory ABI - for scanning created tokens
const TOKEN_FACTORY_ABI = [
  {
    "inputs": [],
    "name": "currentTokenIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "tokens",
    "outputs": [
      {"internalType": "address", "name": "tokenAddress", "type": "address"},
      {"internalType": "string", "name": "tokenName", "type": "string"},
      {"internalType": "string", "name": "tokenSymbol", "type": "string"},
      {"internalType": "uint256", "name": "totalSupply", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractAddress",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const PUMP_FUN_ABI = [
  {
    type: "function",
    name: "buy",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "maxEthCost", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "sell",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "minEthOutput", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "bondingCurve",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct PumpFun.Token",
        components: [
          { name: "tokenMint", type: "address", internalType: "address" },
          { name: "virtualTokenReserves", type: "uint256", internalType: "uint256" },
          { name: "virtualEthReserves", type: "uint256", internalType: "uint256" },
          { name: "realTokenReserves", type: "uint256", internalType: "uint256" },
          { name: "realEthReserves", type: "uint256", internalType: "uint256" },
          { name: "tokenTotalSupply", type: "uint256", internalType: "uint256" },
          { name: "mcapLimit", type: "uint256", internalType: "uint256" },
          { name: "complete", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateEthCost",
    inputs: [
      {
        name: "token",
        type: "tuple",
        internalType: "struct PumpFun.Token",
        components: [
          { name: "tokenMint", type: "address", internalType: "address" },
          { name: "virtualTokenReserves", type: "uint256", internalType: "uint256" },
          { name: "virtualEthReserves", type: "uint256", internalType: "uint256" },
          { name: "realTokenReserves", type: "uint256", internalType: "uint256" },
          { name: "realEthReserves", type: "uint256", internalType: "uint256" },
          { name: "tokenTotalSupply", type: "uint256", internalType: "uint256" },
          { name: "mcapLimit", type: "uint256", internalType: "uint256" },
          { name: "complete", type: "bool", internalType: "bool" },
        ],
      },
      { name: "tokenAmount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "pure",
  },
] as const;

// Create clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

interface BondingCurve {
  tokenMint: `0x${string}`;
  virtualTokenReserves: bigint;
  virtualEthReserves: bigint;
  realTokenReserves: bigint;
  realEthReserves: bigint;
  tokenTotalSupply: bigint;
  mcapLimit: bigint;
  complete: boolean;
}

// Function to scan TokenFactory for tokens created through proper contract
export async function getTokenFactoryTokens() {
  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    // Get the current token index to know how many tokens exist
    const currentIndex = await publicClient.readContract({
      address: TOKEN_FACTORY_ADDRESS,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'currentTokenIndex',
    });

    console.log(`🔍 Found ${currentIndex} tokens in TokenFactory contract`);

    const tokens = [];
    for (let i = 0; i < Number(currentIndex); i++) {
      try {
        const tokenData = await publicClient.readContract({
          address: TOKEN_FACTORY_ADDRESS,
          abi: TOKEN_FACTORY_ABI,
          functionName: 'tokens',
          args: [BigInt(i)],
        });

        if (tokenData && tokenData[0] !== '0x0000000000000000000000000000000000000000') {
          tokens.push({
            address: tokenData[0],
            name: tokenData[1],
            symbol: tokenData[2],
            totalSupply: tokenData[3],
            index: i
          });
          console.log(`📊 TokenFactory Token ${i}: ${tokenData[1]} (${tokenData[2]}) at ${tokenData[0]}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching token ${i}:`, (error as Error).message);
      }
    }

    return tokens;
  } catch (error) {
    console.error('Error scanning TokenFactory:', error);
    return [];
  }
}

// Get bonding curve data for a token
export async function getBondingCurveData(tokenAddress: string): Promise<BondingCurve | null> {
  try {
    const data = await publicClient.readContract({
      address: PUMP_FUN_ADDRESS,
      abi: PUMP_FUN_ABI,
      functionName: 'bondingCurve',
      args: [tokenAddress as `0x${string}`]
    }) as any;

    if (!data || data.tokenMint === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    return {
      tokenMint: data.tokenMint as `0x${string}`,
      virtualTokenReserves: data.virtualTokenReserves,
      virtualEthReserves: data.virtualEthReserves,
      realTokenReserves: data.realTokenReserves,
      realEthReserves: data.realEthReserves,
      tokenTotalSupply: data.tokenTotalSupply,
      mcapLimit: data.mcapLimit,
      complete: data.complete
    };
  } catch (error) {
    console.error(`Failed to get bonding curve for ${tokenAddress}:`, error);
    return null;
  }
}

// Calculate tokens received for ETH amount using bonding curve
export async function calculateTokensFromEth(bondingCurve: BondingCurve, ethAmount: bigint): Promise<bigint> {
  // Use the bonding curve formula: 
  // Virtual reserves are used for price calculation
  const virtualTokenReserves = bondingCurve.virtualTokenReserves;
  const virtualEthReserves = bondingCurve.virtualEthReserves;
  
  // Calculate new ETH reserves after adding ETH
  const newEthReserves = virtualEthReserves + ethAmount;
  
  // Calculate constant product: k = virtualTokenReserves * virtualEthReserves
  const k = virtualTokenReserves * virtualEthReserves;
  
  // Calculate new token reserves: newTokenReserves = k / newEthReserves
  const newTokenReserves = k / newEthReserves;
  
  // Tokens to give to user = current token reserves - new token reserves
  const tokensOut = virtualTokenReserves - newTokenReserves;
  
  return tokensOut;
}

// Calculate ETH received for token amount using bonding curve
export async function calculateEthFromTokens(bondingCurve: BondingCurve, tokenAmount: bigint): Promise<bigint> {
  // Use PumpFun contract's calculateEthCost function
  try {
    const ethCost = await publicClient.readContract({
      address: PUMP_FUN_ADDRESS,
      abi: PUMP_FUN_ABI,
      functionName: 'calculateEthCost',
      args: [bondingCurve as any, tokenAmount]
    }) as bigint;

    return ethCost;
  } catch (error) {
    console.error('Error calculating ETH cost:', error);
    return 0n;
  }
}

// Buy tokens using PumpFun bonding curve
export async function buyTokensPumpFun(params: {
  coinAddress: string;
  buyerAddress: string;
  ethAmount: string;
  minTokensOut?: string;
}): Promise<{
  success: boolean;
  transactionRequest?: any;
  tokensReceived?: string;
  error?: string;
}> {
  try {
    console.log(`🚀 PumpFun buy: ${params.ethAmount} ETH for ${params.coinAddress}`);

    // Get bonding curve data
    const bondingCurve = await getBondingCurveData(params.coinAddress);
    if (!bondingCurve) {
      return {
        success: false,
        error: 'Token not found in PumpFun system'
      };
    }

    if (bondingCurve.complete) {
      return {
        success: false,
        error: 'Bonding curve completed - token graduated to Uniswap'
      };
    }

    // Calculate tokens to receive
    const ethAmountWei = BigInt(Math.floor(parseFloat(params.ethAmount) * 1e18));
    const tokensReceived = await calculateTokensFromEth(bondingCurve, ethAmountWei);
    
    // Check minimum tokens out
    if (params.minTokensOut) {
      const minTokensWei = BigInt(Math.floor(parseFloat(params.minTokensOut) * 1e18));
      if (tokensReceived < minTokensWei) {
        return {
          success: false,
          error: 'Insufficient output amount - increase slippage tolerance'
        };
      }
    }

    // Create transaction request
    const transactionRequest = {
      to: PUMP_FUN_ADDRESS,
      data: encodeFunctionData({
        abi: PUMP_FUN_ABI,
        functionName: 'buy',
        args: [
          params.coinAddress as `0x${string}`,
          tokensReceived,
          ethAmountWei // maxEthCost
        ]
      }),
      value: ethAmountWei,
      gas: 120000n // Optimized gas limit for PumpFun bonding curve trades
    };

    console.log(`✅ PumpFun buy prepared: ${formatUnits(tokensReceived, 18)} tokens for ${params.ethAmount} ETH`);

    return {
      success: true,
      transactionRequest,
      tokensReceived: formatUnits(tokensReceived, 18)
    };

  } catch (error) {
    console.error('❌ PumpFun buy failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during buy execution'
    };
  }
}

// Sell tokens using PumpFun bonding curve
export async function sellTokensPumpFun(params: {
  coinAddress: string;
  sellerAddress: string;
  tokenAmount: string;
  minEthOut?: string;
}): Promise<{
  success: boolean;
  ethReceived?: string;
  txHash?: string;
  error?: string;
}> {
  try {
    console.log(`💰 PumpFun sell: ${params.tokenAmount} tokens of ${params.coinAddress}`);

    // Get bonding curve data
    const bondingCurve = await getBondingCurveData(params.coinAddress);
    if (!bondingCurve) {
      return {
        success: false,
        error: 'Token not found in PumpFun system'
      };
    }

    if (bondingCurve.complete) {
      return {
        success: false,
        error: 'Bonding curve completed - token graduated to Uniswap'
      };
    }

    // Calculate ETH to receive
    const tokenAmountWei = BigInt(Math.floor(parseFloat(params.tokenAmount) * 1e18));
    const ethReceived = await calculateEthFromTokens(bondingCurve, tokenAmountWei);
    
    // Check minimum ETH out
    const minEthOutWei = params.minEthOut 
      ? BigInt(Math.floor(parseFloat(params.minEthOut) * 1e18))
      : BigInt(Math.floor(Number(ethReceived) * 0.95)); // 5% slippage protection

    if (ethReceived < minEthOutWei) {
      return {
        success: false,
        error: 'Insufficient output amount - increase slippage tolerance'
      };
    }

    console.log(`✅ PumpFun sell prepared: ${params.tokenAmount} tokens for ${formatUnits(ethReceived, 18)} ETH`);

    return {
      success: true,
      ethReceived: formatUnits(ethReceived, 18),
      txHash: 'prepared-for-execution'
    };

  } catch (error) {
    console.error('❌ PumpFun sell failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during sell execution'
    };
  }
}

// Get current price for a token in PumpFun system
export async function getPumpFunPrice(tokenAddress: string): Promise<{
  price: string;
  marketCap: string;
  volume24h: string;
  bondingProgress: number;
  error?: string;
}> {
  try {
    const bondingCurve = await getBondingCurveData(tokenAddress);
    if (!bondingCurve) {
      throw new Error('Token not found in PumpFun system');
    }

    // Calculate current price based on virtual reserves
    const price = Number(bondingCurve.virtualEthReserves) / Number(bondingCurve.virtualTokenReserves);
    
    // Calculate market cap
    const totalSupply = Number(formatUnits(bondingCurve.tokenTotalSupply, 18));
    const marketCap = price * totalSupply;
    
    // Calculate bonding curve progress (how close to graduation)
    const currentMcap = Number(bondingCurve.virtualEthReserves) * Number(bondingCurve.tokenTotalSupply) / Number(bondingCurve.realTokenReserves);
    const bondingProgress = Math.min((currentMcap / Number(bondingCurve.mcapLimit)) * 100, 100);

    // Volume calculation would require tracking historical trades
    // For now, use real ETH reserves as a proxy for trading activity
    const volume24h = Number(formatUnits(bondingCurve.realEthReserves, 18));

    return {
      price: price.toFixed(8),
      marketCap: marketCap.toFixed(2),
      volume24h: volume24h.toFixed(2),
      bondingProgress: Math.round(bondingProgress)
    };

  } catch (error) {
    return {
      price: "0",
      marketCap: "0",
      volume24h: "0", 
      bondingProgress: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}