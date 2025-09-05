const { createWalletClient, createPublicClient, http, parseEther } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
const fs = require("fs");
const path = require("path");

// Read compiled artifacts
function getContractArtifact(contractName) {
  const artifactPath = path.join(__dirname, "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract artifact not found: ${artifactPath}`);
  }
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function deployFactory() {
  console.log("🚀 Deploying BondingCurveFactory to Base Sepolia with viem");
  console.log("==========================================================");
  
  // Environment variables
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const platformAdmin = process.env.PLATFORM_ADMIN_ADDRESS;
  
  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY environment variable not set");
  }
  
  if (!platformAdmin) {
    throw new Error("PLATFORM_ADMIN_ADDRESS environment variable not set");
  }
  
  // Create clients
  const account = privateKeyToAccount(privateKey);
  
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org")
  });
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http("https://sepolia.base.org")
  });
  
  console.log("🔗 Connected to Base Sepolia");
  console.log("💼 Deployer address:", account.address);
  // Use deployer address as platform admin for now (can be changed later)
  const cleanPlatformAdmin = account.address;
  console.log("📋 Platform admin (using deployer):", cleanPlatformAdmin);
  
  // Check balance
  const balance = await publicClient.getBalance({ 
    address: account.address 
  });
  console.log("💰 Deployer balance:", (Number(balance) / 1e18).toFixed(6), "ETH");
  
  if (balance === 0n) {
    throw new Error("Deployer account has no ETH balance");
  }
  
  // Get contract artifact
  const factoryArtifact = getContractArtifact("BondingCurveFactory");
  
  console.log("\n⚡ Deploying BondingCurveFactory...");
  
  // Deploy contract
  const deployHash = await walletClient.deployContract({
    abi: factoryArtifact.abi,
    bytecode: factoryArtifact.bytecode,
    args: [cleanPlatformAdmin],
    gas: 3000000n
  });
  
  console.log("📤 Transaction sent:", deployHash);
  console.log("⏳ Waiting for confirmation...");
  
  // Wait for transaction receipt
  const receipt = await publicClient.waitForTransactionReceipt({ 
    hash: deployHash 
  });
  
  if (receipt.status !== "success") {
    throw new Error("Contract deployment failed");
  }
  
  const factoryAddress = receipt.contractAddress;
  
  console.log("✅ BondingCurveFactory deployed successfully!");
  console.log("📍 Factory address:", factoryAddress);
  console.log("🔗 BaseScan URL:", `https://sepolia.basescan.org/address/${factoryAddress}`);
  
  // Verify deployment by reading contract
  console.log("\n🔍 Verifying deployment...");
  try {
    const storedAdmin = await publicClient.readContract({
      address: factoryAddress,
      abi: factoryArtifact.abi,
      functionName: "platformAdmin"
    });
    
    if (storedAdmin.toLowerCase() === cleanPlatformAdmin.toLowerCase()) {
      console.log("✅ Platform admin correctly set:", storedAdmin);
    } else {
      console.error("❌ Platform admin mismatch!");
    }
    
    const curveCount = await publicClient.readContract({
      address: factoryAddress,
      abi: factoryArtifact.abi,
      functionName: "getCurveCount"
    });
    
    console.log("📊 Initial curve count:", curveCount.toString());
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📝 Update your .env file with:");
  console.log(`BONDING_CURVE_FACTORY_ADDRESS="${factoryAddress}"`);
  
  return {
    factoryAddress: factoryAddress,
    transactionHash: deployHash,
    platformAdmin: platformAdmin
  };
}

// Run deployment
deployFactory()
  .then((result) => {
    console.log("\n✅ Contract deployment successful!");
    console.log("🏭 Factory Address:", result.factoryAddress);
    console.log("📜 Transaction Hash:", result.transactionHash);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment failed:", error.message);
    process.exit(1);
  });