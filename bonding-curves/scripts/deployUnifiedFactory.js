import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Unified Content Coin Factory to Base Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Details:");
  console.log("- Deployer address:", deployer.address);
  console.log("- Network:", hre.network.name);
  
  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("- Deployer balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    throw new Error("❌ Deployer has no ETH balance. Please add testnet ETH.");
  }

  // Configuration parameters
  const adminAddress = process.env.PLATFORM_ADMIN_ADDRESS || deployer.address;
  const defaultK = ethers.parseUnits("1", 12); // 1e12 - good starting value for Base Sepolia
  
  console.log("⚙️  Configuration:");
  console.log("- Admin address:", adminAddress);
  console.log("- Default K:", defaultK.toString());
  console.log("- Expected gas cost: ~0.01 ETH");
  
  // Deploy BondingCurveFactory
  const BondingCurveFactory = await ethers.getContractFactory("BondingCurveFactory");
  
  console.log("\n📦 Deploying BondingCurveFactory...");
  const factory = await BondingCurveFactory.deploy(adminAddress, defaultK);
  
  console.log("⏳ Waiting for deployment transaction...");
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  
  console.log("\n✅ Deployment Successful!");
  console.log("📍 Factory Address:", factoryAddress);
  
  // Test the deployment by reading configuration
  console.log("\n🔍 Verifying deployment...");
  const deployedAdmin = await factory.admin();
  const deployedK = await factory.defaultK();
  
  console.log("- Admin address (deployed):", deployedAdmin);
  console.log("- Default K (deployed):", deployedK.toString());
  
  if (deployedAdmin !== adminAddress || deployedK !== defaultK) {
    throw new Error("❌ Deployment verification failed!");
  }
  
  console.log("✅ Deployment verification passed!");
  
  // Contract verification on Basescan (if API key is available)
  if (process.env.BASESCAN_API_KEY) {
    console.log("\n🔐 Waiting for block confirmations before verification...");
    await factory.deploymentTransaction().wait(5);
    
    try {
      console.log("📋 Verifying contract on Basescan...");
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [adminAddress, defaultK],
      });
      console.log("✅ Contract verified on Basescan!");
    } catch (error) {
      console.log("⚠️  Verification failed (this is optional):", error.message);
    }
  } else {
    console.log("⚠️  BASESCAN_API_KEY not set, skipping contract verification");
  }
  
  console.log("\n🎯 === DEPLOYMENT SUMMARY ===");
  console.log("Contract: BondingCurveFactory");
  console.log("Address:", factoryAddress);
  console.log("Network: Base Sepolia");
  console.log("Admin:", adminAddress);
  console.log("Default K:", defaultK.toString());
  console.log("Block Explorer: https://sepolia.basescan.org/address/" + factoryAddress);
  
  console.log("\n🛠️  Next Steps:");
  console.log("1. Save factory address:", factoryAddress);
  console.log("2. Update frontend with this address");
  console.log("3. Test token creation via factory");
  
  // Return the address for scripts that might import this
  return factoryAddress;
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });

export default main;