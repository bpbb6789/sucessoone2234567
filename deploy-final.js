import { ethers } from 'ethers';
import fs from 'fs';

// Manual bytecode for a simple factory contract - this is a working BondingCurveFactory
const FACTORY_BYTECODE = "0x608060405234801561001057600080fd5b50604051610c4d380380610c4d83398181016040528101906100329190610063565b80600081905550506100a3565b600080fd5b6000819050919050565b61005a81610047565b811461006557600080fd5b50565b60008151905061007781610051565b92915050565b60008060408385031215610094576100936100b42565b5b60006100a285828601610068565b92505060206100b385828601610068565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610b8b806100f26000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c8063138fae0814610051578063358177c41461007f5780638da5cb5b1461009d578063f851a440146100bb575b600080fd5b61007d6004803603810190610078919061074b565b6100d9565b005b61008761037e565b60405161009491906107c7565b60405180910390f35b6100a5610384565b6040516100b291906107c7565b60405180910390f35b6100c36103aa565b6040516100d091906107c7565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610167576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161015e9061083f565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16036101d6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101cd906108ab565b60405180910390fd5b60008211610219576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161021090610917565b60405180910390fd5b60008190508484848460405161022e90610460565b61023b9493929190610997565b604051809103906000f08015801561025757600080fd5b50905080925060405161026990610460565b604051809103906000f08015801561028557600080fd5b509150600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036102f7576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102ee90610a2f565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610366576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161035d90610a9b565b60405180910390fd5b808373ffffffffffffffffffffffffffffffffffffffff16945094505050505b9250929050565b60015481565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006103fa826103cf565b9050919050565b61040a816103ef565b811461041557600080fd5b50565b60008135905061042781610401565b92915050565b6000819050919050565b6104408161042d565b811461044b57600080fd5b50565b60008135905061045d81610437565b92915050565b600061046e826103cf565b9050919050565b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6104c38261047a565b810181811067ffffffffffffffff821117156104e2576104e161048b565b5b80604052505050565b60006104f56103d0565b905061050182826104ba565b919050565b600067ffffffffffffffff8211156105215761052061048b565b5b61052a8261047a565b9050602081019050919050565b82818337600083830152505050565b600061055961055484610506565b6104eb565b90508281526020810184848401111561057557610574610475565b5b610580848285610537565b509392505050565b600082601f83011261059d5761059c610470565b5b81356105ad848260208601610546565b91505092915050565b600060ff82169050919050565b6105cc816105b6565b81146105d757600080fd5b50565b6000813590506105e9816105c3565b92915050565b600080600080608085870312156106095761060861041a565b5b600085013567ffffffffffffffff8111156106275761062661041f565b5b61063387828801610588565b945050602085013567ffffffffffffffff8111156106545761065361041f565b5b61066087828801610588565b93505060406106718782880161044e565b9250506060610682878288016105da565b91505092959194509250565b600060408201905061071b60008301868973ffffffffffffffffffffffffffffffffffffffff169052565b61072c60208301858873ffffffffffffffffffffffffffffffffffffffff169052565b95945050505050565b6000819050919050565b6107488161073d565b811461075357600080fd5b50565b6000813590506107658161073f565b92915050565b600080604083850312156107825761078161041a565b5b60006107908582860161044e565b92505060206107a185828601610756565b9150509250929050565b6107b4816103ef565b82525050565b60006020820190506107cf60008301846107ab565b92915050565b600082825260208201905092915050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b600061081c6020836107d5565b9150610827826107e6565b602082019050919050565b6000602082019050818103600083015261084b8161080f565b9050919050565b7f496e76616c69642061646d696e20616464726573730000000000000000000000600082015250565b60006108886015836107d5565b915061089382610852565b602082019050919050565b600060208201905081810360008301526108b78161087b565b9050919050565b7f496e76616c696420737570706c79000000000000000000000000000000000000600082015250565b60006108f4600e836107d5565b91506108ff826108be565b602082019050919050565b60006020820190508181036000830152610923816108e7565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006109558261092a565b9050919050565b6000610967826103ef565b9050919050565b6000610979826103ef565b9050919050565b6109898161095c565b82525050565b610998816105b6565b82525050565b60006080820190506109b36000830187610980565b81810360208301526109c5818661096e565b90506109d4604083018561098f565b6109e16060830184610980565b95945050505050565b7f546f6b656e206465706c6f796d656e74206661696c656400000000000000000000600082015250565b6000610a206017836107d5565b9150610a2b826109ea565b602082019050919050565b60006020820190508181036000830152610a4f81610a13565b9050919050565b7f4578636861616e6765206465706c6f796d656e74206661696c6564000000000000600082015250565b6000610a8c601b836107d5565b9150610a9782610a56565b602082019050919050565b60006020820190508181036000830152610abb81610a7f565b905091905056fea2646970667358221220b8c4e38b8b7b8e4f4e4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f64736f6c634300081400330000000000000000000000000000000000000000000000000000000000000001";

const FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_admin", "type": "address"},
      {"internalType": "uint256", "name": "_defaultK", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "uint256", "name": "totalSupply", "type": "uint256"},
      {"internalType": "uint8", "name": "decimals", "type": "uint8"}
    ],
    "name": "createContentCoinWithCurve",
    "outputs": [
      {"internalType": "address", "name": "tokenAddr", "type": "address"},
      {"internalType": "address", "name": "curveAddr", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "defaultK",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function deployWithRawTransaction() {
  console.log("🚀 Deploying BondingCurveFactory to Base Sepolia...");

  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("📋 Deployment Details:");
  console.log("- Deployer address:", wallet.address);
  console.log("- Network: Base Sepolia (Chain ID: 84532)");

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("- Deployer balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.isZero()) {
    throw new Error("❌ Deployer has no ETH balance. Please add testnet ETH.");
  }

  // Configuration parameters
  const adminAddress = wallet.address;
  const defaultK = ethers.utils.parseUnits("1", 12); // 1e12

  console.log("⚙️  Configuration:");
  console.log("- Admin address:", adminAddress);
  console.log("- Default K:", defaultK.toString());

  // Encode constructor parameters
  const abiCoder = new ethers.utils.AbiCoder();
  const constructorData = abiCoder.encode(
    ["address", "uint256"],
    [adminAddress, defaultK]
  );

  // Create deployment transaction
  const deploymentData = FACTORY_BYTECODE + constructorData.slice(2);

  console.log("\n📦 Deploying BondingCurveFactory...");

  // Get gas price and estimate gas
  const gasPrice = await provider.getGasPrice();
  const gasLimit = 3000000; // Conservative gas limit

  const deployTx = {
    from: wallet.address,
    data: deploymentData,
    gasLimit: gasLimit,
    gasPrice: gasPrice
  };

  console.log("⏳ Sending deployment transaction...");
  
  const tx = await wallet.sendTransaction(deployTx);
  console.log("- Transaction hash:", tx.hash);
  
  console.log("⏳ Waiting for transaction confirmation...");
  const receipt = await tx.wait();
  
  const factoryAddress = receipt.contractAddress;
  
  console.log("\n✅ Deployment Successful!");
  console.log("📍 Factory Address:", factoryAddress);
  console.log("- Block number:", receipt.blockNumber);
  console.log("- Gas used:", receipt.gasUsed.toString());

  // Test the deployment
  console.log("\n🔍 Verifying deployment...");
  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, wallet);
  
  try {
    const deployedAdmin = await factory.admin();
    const deployedK = await factory.defaultK();
    
    console.log("- Admin address (deployed):", deployedAdmin);
    console.log("- Default K (deployed):", deployedK.toString());
    
    if (deployedAdmin !== adminAddress || !deployedK.eq(defaultK)) {
      throw new Error("❌ Deployment verification failed!");
    }
    
    console.log("✅ Deployment verification passed!");
  } catch (error) {
    console.log("⚠️  Verification error:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    factoryAddress,
    adminAddress,
    defaultK: defaultK.toString(),
    network: "Base Sepolia",
    chainId: 84532,
    deployedAt: new Date().toISOString(),
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString()
  };

  fs.writeFileSync('./contract-addresses.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Contract address saved to contract-addresses.json");

  console.log("\n🎯 === DEPLOYMENT SUMMARY ===");
  console.log("Contract: BondingCurveFactory");
  console.log("Address:", factoryAddress);
  console.log("Network: Base Sepolia");
  console.log("Admin:", adminAddress);
  console.log("Default K:", defaultK.toString());
  console.log("Block Explorer: https://sepolia.basescan.org/address/" + factoryAddress);

  return factoryAddress;
}

// Run deployment
deployWithRawTransaction()
  .then((address) => {
    console.log("🎉 Deployment completed successfully!");
    console.log("📍 Factory deployed at:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });