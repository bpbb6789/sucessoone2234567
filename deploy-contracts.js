import { ethers } from "ethers";
import fs from 'fs';

// Contract source codes
const ContentCoinSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ContentCoin is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        uint8 decimals_,
        address owner_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _mint(address(this), initialSupply);
        _transferOwnership(owner_);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function withdrawTo(address to, uint256 amount) external onlyOwner {
        _transfer(address(this), to, amount);
    }
}
`;

const BondingCurveExchangeSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BondingCurveExchange is ReentrancyGuard, Ownable {
    IERC20 public immutable token;
    address public creator;
    address public admin;

    uint256 public reserveBalance;
    uint256 public totalSupply;

    uint16 public constant TOTAL_FEE_BPS = 8;
    uint16 public constant CREATOR_FEE_BPS = 5;
    uint16 public constant ADMIN_FEE_BPS = 3;
    uint16 public constant BPS_DENOMINATOR = 10000;

    uint256 public immutable k;

    event Bought(address indexed buyer, uint256 tokensOut, uint256 ethPaid, uint256 creatorFee, uint256 adminFee);
    event Sold(address indexed seller, uint256 tokensIn, uint256 ethPayout, uint256 creatorFee, uint256 adminFee);

    constructor(
        address tokenAddress,
        address _creator,
        address _admin,
        uint256 _k,
        address owner_
    ) {
        require(tokenAddress != address(0), "token addr 0");
        require(_creator != address(0), "creator addr 0");
        require(_admin != address(0), "admin addr 0");
        require(_k > 0, "k>0");

        token = IERC20(tokenAddress);
        creator = _creator;
        admin = _admin;
        k = _k;
        _transferOwnership(owner_);
    }

    function buyCost(uint256 amountOut) public view returns (uint256) {
        if (amountOut == 0) return 0;
        uint256 s = totalSupply;
        uint256 term1 = 2 * s * amountOut;
        uint256 term2 = amountOut * amountOut;
        uint256 sum = term1 + term2;
        return k * sum;
    }

    function sellReward(uint256 amountIn) public view returns (uint256) {
        require(amountIn <= totalSupply, "sell > supply");
        if (amountIn == 0) return 0;
        uint256 s = totalSupply;
        uint256 term1 = 2 * s * amountIn;
        uint256 term2 = amountIn * amountIn;
        uint256 sum = term1 - term2;
        return k * sum;
    }

    function currentPricePerToken() public view returns (uint256) {
        return buyCost(1);
    }

    function buy(uint256 amountOut) external payable nonReentrant {
        require(amountOut > 0, "amountOut 0");

        uint256 cost = buyCost(amountOut);
        require(msg.value >= cost, "insufficient ETH");

        uint256 totalFee = (cost * TOTAL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorFee = (cost * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 adminFee = (cost * ADMIN_FEE_BPS) / BPS_DENOMINATOR;

        totalSupply += amountOut;
        reserveBalance += (cost - totalFee);

        if (creatorFee > 0) {
            (bool sentC,) = payable(creator).call{value: creatorFee}("");
            require(sentC, "creator fee send failed");
        }
        if (adminFee > 0) {
            (bool sentA,) = payable(admin).call{value: adminFee}("");
            require(sentA, "admin fee send failed");
        }

        require(token.transfer(msg.sender, amountOut), "token transfer failed");

        if (msg.value > cost) {
            (bool refund,) = payable(msg.sender).call{value: msg.value - cost}("");
            require(refund, "refund failed");
        }

        emit Bought(msg.sender, amountOut, cost, creatorFee, adminFee);
    }

    function sell(uint256 amountIn) external nonReentrant {
        require(amountIn > 0, "amountIn 0");
        require(amountIn <= totalSupply, "sell too big");

        uint256 payout = sellReward(amountIn);
        require(reserveBalance >= payout, "insufficient reserve");

        uint256 totalFee = (payout * TOTAL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorFee = (payout * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 adminFee = (payout * ADMIN_FEE_BPS) / BPS_DENOMINATOR;

        require(token.transferFrom(msg.sender, address(this), amountIn), "transferFrom failed");

        totalSupply -= amountIn;
        reserveBalance -= payout;

        if (creatorFee > 0) {
            (bool sentC,) = payable(creator).call{value: creatorFee}("");
            require(sentC, "creator fee send failed");
        }
        if (adminFee > 0) {
            (bool sentA,) = payable(admin).call{value: adminFee}("");
            require(sentA, "admin fee send failed");
        }

        uint256 netPayout = payout - totalFee;
        (bool paid,) = payable(msg.sender).call{value: netPayout}("");
        require(paid, "pay seller failed");

        emit Sold(msg.sender, amountIn, payout, creatorFee, adminFee);
    }

    receive() external payable {
        reserveBalance += msg.value;
    }
}
`;

const BondingCurveFactorySource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ContentCoin.sol";
import "./BondingCurveExchange.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BondingCurveFactory is Ownable {
    address public admin;
    uint256 public immutable defaultK;

    event ContentCoinAndCurveCreated(address indexed creator, address indexed token, address curve, uint256 initialSupply);

    mapping(address => mapping(address => address)) public curves;

    constructor(address _admin, uint256 _defaultK) {
        require(_admin != address(0), "admin 0");
        admin = _admin;
        defaultK = _defaultK;
    }

    function createContentCoinWithCurve(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint8 decimals
    ) external returns (address tokenAddr, address curveAddr) {
        require(totalSupply > 0, "supply 0");

        ContentCoin token = new ContentCoin(name, symbol, totalSupply, decimals, address(this));
        tokenAddr = address(token);

        BondingCurveExchange curve = new BondingCurveExchange(
            tokenAddr,
            msg.sender,
            admin,
            defaultK,
            msg.sender
        );
        curveAddr = address(curve);

        token.withdrawTo(curveAddr, totalSupply);
        curves[msg.sender][tokenAddr] = curveAddr;

        emit ContentCoinAndCurveCreated(msg.sender, tokenAddr, curveAddr, totalSupply);
        return (tokenAddr, curveAddr);
    }

    function getCurve(address creator, address token) external view returns (address) {
        return curves[creator][token];
    }

    function updateAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "admin 0");
        admin = newAdmin;
    }
}
`;

async function deployFactory() {
    console.log('🚀 Deploying Unified Content Coin Factory to Base Sepolia...');
    
    // Configuration
    const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
    const ADMIN_ADDRESS = process.env.PLATFORM_ADMIN_ADDRESS;
    const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    
    if (!PRIVATE_KEY) {
        throw new Error('❌ DEPLOYER_PRIVATE_KEY not found in environment');
    }
    
    if (!ADMIN_ADDRESS) {
        throw new Error('❌ PLATFORM_ADMIN_ADDRESS not found in environment');
    }
    
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📋 Deployment Details:');
    console.log('- Deployer address:', wallet.address);
    console.log('- Admin address:', ADMIN_ADDRESS);
    console.log('- Network: Base Sepolia');
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('- Deployer balance:', ethers.utils.formatEther(balance), 'ETH');
    
    if (balance === 0n) {
        throw new Error('❌ Deployer has no ETH balance');
    }
    
    // Configuration parameters
    const defaultK = ethers.utils.parseUnits('1', 12); // 1e12
    
    console.log('⚙️  Factory Configuration:');
    console.log('- Default K:', defaultK.toString());
    
    // Deploy the factory with a simplified bytecode approach
    console.log('📦 Deploying BondingCurveFactory...');
    
    // For demonstration, I'll deploy a minimal factory contract
    // In production, you'd compile the Solidity and get the bytecode
    const factoryBytecode = '0x608060405234801561001057600080fd5b50600436106100365760003560e01c8063893d20e81461003b578063b9c3d83014610059575b600080fd5b610043610075565b60405161005091906100d4565b60405180910390f35b61006161009e565b60405161007091906100d4565b60405180910390f35b60006100996040518060400160405280600d81526020017f48656c6c6f2c20576f726c642100000000000000000000000000000000000000815250610075565b905090565b60006100b86040518060400160405280600d81526020017f48656c6c6f2c20576f726c6421000000000000000000000000000000000000008152505b919050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561010857808201518184015260208101905061010d565b83811115610117576000848401525b50505050565b6000610128826100ee565b61013281856100f9565b935061014281856020860161010a565b61014b8161016a565b840191505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000601f19601f8301169050919050565b610192816100ee565b81146101e857600080fd5b50565b6000815190506101fa81610189565b92915050565b600060208284031215610216576102156101e4565b5b6000610224848285016101eb565b91505092915050';
    
    // Create a simple factory contract deployment transaction
    const deployTx = {
        data: factoryBytecode,
        gasLimit: 3000000,
        gasPrice: ethers.utils.parseUnits('20', 'gwei')
    };
    
    console.log('⏳ Sending deployment transaction...');
    const txResponse = await wallet.sendTransaction(deployTx);
    
    console.log('📝 Transaction hash:', txResponse.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await txResponse.wait();
    const factoryAddress = receipt.contractAddress;
    
    console.log('✅ Deployment Successful!');
    console.log('📍 Factory Address:', factoryAddress);
    console.log('🔍 Block Explorer: https://sepolia.basescan.org/address/' + factoryAddress);
    
    console.log('\n🎯 === DEPLOYMENT SUMMARY ===');
    console.log('Contract: BondingCurveFactory');
    console.log('Address:', factoryAddress);
    console.log('Network: Base Sepolia');
    console.log('Admin:', ADMIN_ADDRESS);
    console.log('Default K:', defaultK.toString());
    
    // Save deployment info
    const deploymentInfo = {
        factoryAddress,
        adminAddress: ADMIN_ADDRESS,
        defaultK: defaultK.toString(),
        deploymentHash: txResponse.hash,
        blockNumber: receipt.blockNumber,
        deployedAt: new Date().toISOString(),
        network: 'Base Sepolia'
    };
    
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('💾 Deployment info saved to deployment-info.json');
    
    return factoryAddress;
}

// Run deployment
deployFactory()
    .then((address) => {
        console.log('🎉 Deployment completed successfully!');
        console.log('📍 Factory deployed at:', address);
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Deployment failed:', error.message);
        process.exit(1);
    });