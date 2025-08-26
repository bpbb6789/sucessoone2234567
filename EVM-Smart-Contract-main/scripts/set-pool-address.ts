import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Setting pool address with account:", deployer.address);

  // Contract addresses
  const TOKEN_FACTORY_ADDRESS = "0x24408Fc5a7f57c3b24E85B9f97016F582391C9A9";
  const PUMP_FUN_ADDRESS = "0x41b3a6Dd39D41467D6D47E51e77c16dEF2F63201";

  // Get the TokenFactory contract
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const tokenFactory = TokenFactory.attach(TOKEN_FACTORY_ADDRESS);

  console.log("Current contractAddress:", await tokenFactory.contractAddress());

  // Set the PumpFun address in TokenFactory
  console.log("Setting PumpFun address in TokenFactory...");
  const tx = await tokenFactory.setPoolAddress(PUMP_FUN_ADDRESS);
  await tx.wait();

  console.log("✅ Pool address set successfully!");
  console.log("Updated contractAddress:", await tokenFactory.contractAddress());
  console.log("Transaction hash:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});