export const UniPumpAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_poolManager",
        type: "address",
        internalType: "contract IPoolManager",
      },
      { name: "_weth", type: "address", internalType: "address" },
      {
        name: "_create2Deployer",
        type: "address",
        internalType: "address",
      },
      { name: "_feeHook", type: "address", internalType: "address" },
      { name: "_entropy", type: "address", internalType: "address" },
      { name: "_provider", type: "address", internalType: "address" },
      { name: "_pyth", type: "address", internalType: "address" },
      {
        name: "_priceFeedWethId",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
  },
  { type: "receive", stateMutability: "payable" },
  {
    type: "function",
    name: "buyTokenFromSale",
    inputs: [
      { name: "_addr", type: "address", internalType: "address" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sellTokenFromSale",
    inputs: [
      { name: "_addr", type: "address", internalType: "address" },
      { name: "_amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "price",
    inputs: [{ name: "_addr", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "UD60x18" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPoolState",
    inputs: [{ name: "_addr", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct UniPump.PoolSaleState",
        components: [
          {
            name: "tokenAddress",
            type: "address",
            internalType: "address",
          },
          { name: "poolIsLive", type: "bool", internalType: "bool" },
          { name: "lastPrice", type: "uint256", internalType: "UD60x18" },
          { name: "supply", type: "uint256", internalType: "UD60x18" },
          { name: "locked", type: "uint256", internalType: "UD60x18" },
          { name: "isToken0weth", type: "bool", internalType: "bool" },
          { name: "beta", type: "uint256", internalType: "UD60x18" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "PriceChange",
    inputs: [
      {
        name: "tokenAddress",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "price",
        type: "uint256",
        indexed: false,
        internalType: "UD60x18",
      },
      {
        name: "supply",
        type: "uint256",
        indexed: false,
        internalType: "UD60x18",
      },
      {
        name: "oraclePrice",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;