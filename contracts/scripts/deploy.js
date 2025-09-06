const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy BondingCurveFactory
  const BondingCurveFactory = await ethers.getContractFactory("BondingCurveFactory");
  
  // Configuration parameters
  const adminAddress = process.env.PLATFORM_ADMIN_ADDRESS || deployer.address;
  const defaultK = ethers.utils.parseUnits("1", 12); // 1e12 - adjust as needed for price tuning
  
  console.log("Deploying BondingCurveFactory...");
  console.log("Admin address:", adminAddress);
  console.log("Default K:", defaultK.toString());
  
  const factory = await BondingCurveFactory.deploy(adminAddress, defaultK);
  await factory.deployed();
  
  console.log("BondingCurveFactory deployed to:", factory.address);
  
  // Verify on Basescan if API key is provided
  if (process.env.BASESCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await factory.deployTransaction.wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: factory.address,
        constructorArguments: [adminAddress, defaultK],
      });
      console.log("Contract verified on Basescan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
  
  console.log("\n=== Deployment Summary ===");
  console.log("BondingCurveFactory:", factory.address);
  console.log("Admin address:", adminAddress);
  console.log("Default K:", defaultK.toString());
  console.log("Network:", hre.network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });