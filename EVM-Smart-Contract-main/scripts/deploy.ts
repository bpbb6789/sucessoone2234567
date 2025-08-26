import { ethers, run } from "hardhat";

async function main() {
  console.log("Starting deployment to Base Sepolia...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy TokenFactory first
  console.log("\n1. Deploying TokenFactory...");
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.waitForDeployment();
  const tokenFactoryAddress = await tokenFactory.getAddress();
  console.log("TokenFactory deployed to:", tokenFactoryAddress);

  // Deploy PumpFun contract
  console.log("\n2. Deploying PumpFun...");
  const PumpFun = await ethers.getContractFactory("PumpFun");
  
  // Constructor parameters for PumpFun
  const feeRecipient = deployer.address; // Use deployer as fee recipient for now
  const feePercentage = 100; // 1% fee (100 basis points)
  const mcapLimit = ethers.parseEther("69420"); // 69,420 ETH market cap limit
  
  const pumpFun = await PumpFun.deploy(feeRecipient, feePercentage, mcapLimit);
  await pumpFun.waitForDeployment();
  const pumpFunAddress = await pumpFun.getAddress();
  console.log("PumpFun deployed to:", pumpFunAddress);

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("TokenFactory:", tokenFactoryAddress);
  console.log("PumpFun:", pumpFunAddress);
  console.log("Network: Base Sepolia (84532)");
  console.log("Deployer:", deployer.address);
  
  console.log("\n=== UPDATE THESE ADDRESSES IN YOUR CODE ===");
  console.log(`export const TOKEN_FACTORY_ADDRESS = "${tokenFactoryAddress}";`);
  console.log(`export const PUMP_FUN_ADDRESS = "${pumpFunAddress}";`);

  // Verify contracts on Etherscan if API key is provided
  if (process.env.BASESCAN_API_KEY) {
    console.log("\n=== VERIFYING CONTRACTS ===");
    
    try {
      console.log("Verifying TokenFactory...");
      await run("verify:verify", {
        address: tokenFactoryAddress,
        constructorArguments: [],
      });
      console.log("TokenFactory verified!");
    } catch (error) {
      console.log("TokenFactory verification failed:", error);
    }

    try {
      console.log("Verifying PumpFun...");
      await run("verify:verify", {
        address: pumpFunAddress,
        constructorArguments: [feeRecipient, feePercentage, mcapLimit],
      });
      console.log("PumpFun verified!");
    } catch (error) {
      console.log("PumpFun verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });