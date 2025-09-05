const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying BondingCurveFactory with account:", deployer.address);

  // Get deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ Deployer account has no ETH balance");
    console.error("Please add testnet ETH to:", deployer.address);
    process.exit(1);
  }

  // Platform admin address (same as deployer for now, can be changed later)
  const platformAdmin = deployer.address;

  console.log("📋 Deployment parameters:");
  console.log("  - Platform Admin:", platformAdmin);
  console.log("  - Network:", hre.network.name);
  console.log("  - Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);

  // Deploy the factory
  console.log("\n⚡ Deploying BondingCurveFactory...");
  const BondingCurveFactory = await hre.ethers.getContractFactory("BondingCurveFactory");
  const factory = await BondingCurveFactory.deploy(platformAdmin);

  await factory.waitForDeployment();
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

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📝 Save this factory address for integration:");
    console.log(`   BONDING_CURVE_FACTORY_ADDRESS="${factoryAddress}"`);

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }

  // Verify on BaseScan (if API key is available)
  if (process.env.BASESCAN_API_KEY) {
    console.log("\n🔍 Verifying contract on BaseScan...");
    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [platformAdmin],
      });
      console.log("✅ Contract verified on BaseScan");
    } catch (error) {
      console.warn("⚠️ BaseScan verification failed:", error.message);
      console.log("You can verify manually at:", `https://sepolia.basescan.org/address/${factoryAddress}#code`);
    }
  } else {
    console.log("⚠️ BASESCAN_API_KEY not set - skipping contract verification");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });