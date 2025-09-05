const { ethers } = require("ethers");
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
  console.log("🚀 Deploying BondingCurveFactory to Base Sepolia");
  console.log("================================================");
  
  // Environment variables
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const platformAdmin = process.env.PLATFORM_ADMIN_ADDRESS;
  
  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY environment variable not set");
  }
  
  if (!platformAdmin) {
    throw new Error("PLATFORM_ADMIN_ADDRESS environment variable not set");
  }
  
  // Setup provider and wallet using ethers v6
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org", {
    name: "base-sepolia",
    chainId: 84532
  });
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("🔗 Connected to Base Sepolia");
  console.log("💼 Deployer address:", wallet.address);
  console.log("📋 Platform admin:", platformAdmin);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    throw new Error("Deployer account has no ETH balance");
  }
  
  // Get contract artifact
  const factoryArtifact = getContractArtifact("BondingCurveFactory");
  
  // Create contract factory
  const ContractFactory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    wallet
  );
  
  console.log("\n⚡ Deploying BondingCurveFactory...");
  
  // Estimate gas
  const gasEstimate = await ContractFactory.getDeployTransaction(platformAdmin).then(tx => 
    provider.estimateGas(tx)
  );
  console.log("⛽ Estimated gas:", gasEstimate.toString());
  
  // Deploy with platform admin address
  const factory = await ContractFactory.deploy(platformAdmin, {
    gasLimit: gasEstimate + 100000n // Add buffer
  });
  
  console.log("📤 Transaction sent:", factory.deploymentTransaction().hash);
  console.log("⏳ Waiting for confirmation...");
  
  // Wait for deployment
  const receipt = await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("✅ BondingCurveFactory deployed successfully!");
  console.log("📍 Factory address:", factoryAddress);
  console.log("🔗 BaseScan URL:", `https://sepolia.basescan.org/address/${factoryAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  try {
    const storedAdmin = await factory.platformAdmin();
    if (storedAdmin.toLowerCase() === platformAdmin.toLowerCase()) {
      console.log("✅ Platform admin correctly set:", storedAdmin);
    } else {
      console.error("❌ Platform admin mismatch!");
    }
    
    const curveCount = await factory.getCurveCount();
    console.log("📊 Initial curve count:", curveCount.toString());
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📝 Update your .env file with:");
  console.log(`BONDING_CURVE_FACTORY_ADDRESS="${factoryAddress}"`);
  
  return {
    factoryAddress: factoryAddress,
    transactionHash: factory.deploymentTransaction().hash,
    platformAdmin: platformAdmin
  };
}

// Run deployment
deployFactory()
  .then((result) => {
    console.log("\n✅ Deployment successful!");
    console.log("Factory Address:", result.factoryAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment failed:", error.message);
    process.exit(1);
  });