import { ethers } from 'ethers';
import fs from 'fs';

// Contract artifacts - I'll read the compiled JSON files
const factoryArtifact = JSON.parse(fs.readFileSync('./bonding-curves/artifacts/contracts/BondingCurveFactory.sol/BondingCurveFactory.json', 'utf8'));

async function main() {
  console.log("🚀 Deploying Unified Content Coin Factory to Base Sepolia...");

  // Setup provider and wallet (ethers v5 syntax)
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("📋 Deployment Details:");
  console.log("- Deployer address:", wallet.address);
  console.log("- Network: Base Sepolia");

  // Check deployer balance
  const balance = await provider.getBalance(wallet.address);
  console.log("- Deployer balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.isZero()) {
    throw new Error("❌ Deployer has no ETH balance. Please add testnet ETH.");
  }

  // Configuration parameters
  const adminAddress = wallet.address; // Use deployer as admin for now
  const defaultK = ethers.utils.parseUnits("1", 12); // 1e12 - good starting value

  console.log("⚙️  Configuration:");
  console.log("- Admin address:", adminAddress);
  console.log("- Default K:", defaultK.toString());

  // Deploy BondingCurveFactory
  const BondingCurveFactory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    wallet
  );

  console.log("\n📦 Deploying BondingCurveFactory...");
  
  const factory = await BondingCurveFactory.deploy(adminAddress, defaultK);

  console.log("⏳ Waiting for deployment transaction...");
  await factory.deployed();

  const factoryAddress = factory.address;

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

  console.log("\n🎯 === DEPLOYMENT SUMMARY ===");
  console.log("Contract: BondingCurveFactory");
  console.log("Address:", factoryAddress);
  console.log("Network: Base Sepolia");
  console.log("Admin:", adminAddress);
  console.log("Default K:", defaultK.toString());
  console.log("Block Explorer: https://sepolia.basescan.org/address/" + factoryAddress);

  // Save the address to a file for frontend use
  const deploymentInfo = {
    factoryAddress,
    adminAddress,
    defaultK: defaultK.toString(),
    network: "Base Sepolia",
    chainId: 84532,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync('./contract-addresses.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Contract address saved to contract-addresses.json");

  return factoryAddress;
}

// Run the deployment
main()
  .then(() => {
    console.log("🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });