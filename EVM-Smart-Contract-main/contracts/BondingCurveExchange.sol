// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BondingCurveExchange
 * @dev Automated Market Maker using square-root bonding curve for Content Coins
 * @notice This contract provides instant liquidity for Zora-created Content Coins
 */
contract BondingCurveExchange is ReentrancyGuard, Ownable {
    IERC20 public immutable token;
    address public immutable creator;
    address public immutable platformAdmin;
    
    // Bonding curve parameters
    uint256 public constant CURVE_COEFFICIENT = 1e12; // Adjust for curve steepness
    uint256 public constant CREATOR_FEE_BPS = 50;     // 0.5% (50 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 30;    // 0.3% (30 basis points)
    uint256 public constant MAX_SUPPLY = 1000000000e18; // 1 billion tokens
    
    // State variables
    uint256 public totalSupplyInCurve;
    uint256 public ethReserve;
    
    // Events
    event TokensBought(
        address indexed buyer,
        uint256 ethSpent,
        uint256 tokensReceived,
        uint256 creatorFee,
        uint256 platformFee
    );
    
    event TokensSold(
        address indexed seller,
        uint256 tokensSold,
        uint256 ethReceived,
        uint256 creatorFee,
        uint256 platformFee
    );
    
    constructor(
        address _token,
        address _creator,
        address _platformAdmin
    ) {
        require(_token != address(0), "Invalid token address");
        require(_creator != address(0), "Invalid creator address");
        require(_platformAdmin != address(0), "Invalid platform admin address");
        
        token = IERC20(_token);
        creator = _creator;
        platformAdmin = _platformAdmin;
        
        // Transfer ownership to platform admin
        _transferOwnership(_platformAdmin);
    }
    
    /**
     * @dev Calculate tokens received for ETH using square-root bonding curve
     * @param ethAmount Amount of ETH to spend
     * @return tokensOut Amount of tokens to receive
     */
    function calculateBuyTokens(uint256 ethAmount) public view returns (uint256 tokensOut) {
        if (ethAmount == 0) return 0;
        
        uint256 ethAfterFees = ethAmount - calculateTotalFees(ethAmount);
        uint256 newReserve = ethReserve + ethAfterFees;
        
        // Square-root bonding curve: tokens = sqrt(newReserve) - sqrt(oldReserve)
        uint256 newSupply = sqrt(newReserve * CURVE_COEFFICIENT);
        
        if (newSupply > totalSupplyInCurve) {
            tokensOut = newSupply - totalSupplyInCurve;
            
            // Ensure we don't exceed max supply
            if (totalSupplyInCurve + tokensOut > MAX_SUPPLY) {
                tokensOut = MAX_SUPPLY - totalSupplyInCurve;
            }
        }
    }
    
    /**
     * @dev Calculate ETH received for tokens using square-root bonding curve
     * @param tokenAmount Amount of tokens to sell
     * @return ethOut Amount of ETH to receive
     */
    function calculateSellTokens(uint256 tokenAmount) public view returns (uint256 ethOut) {
        if (tokenAmount == 0 || tokenAmount > totalSupplyInCurve) return 0;
        
        uint256 newSupply = totalSupplyInCurve - tokenAmount;
        uint256 newReserve = (newSupply * newSupply) / CURVE_COEFFICIENT;
        
        if (newReserve < ethReserve) {
            uint256 ethBeforeFees = ethReserve - newReserve;
            ethOut = ethBeforeFees - calculateTotalFees(ethBeforeFees);
        }
    }
    
    /**
     * @dev Calculate total fees (creator + platform) for a given amount
     * @param amount Base amount to calculate fees on
     * @return totalFees Combined creator and platform fees
     */
    function calculateTotalFees(uint256 amount) public pure returns (uint256 totalFees) {
        uint256 creatorFee = (amount * CREATOR_FEE_BPS) / 10000;
        uint256 platformFee = (amount * PLATFORM_FEE_BPS) / 10000;
        totalFees = creatorFee + platformFee;
    }
    
    /**
     * @dev Buy tokens with ETH using bonding curve
     * @param minTokensOut Minimum tokens expected (slippage protection)
     */
    function buy(uint256 minTokensOut) external payable nonReentrant {
        require(msg.value > 0, "ETH amount must be greater than 0");
        
        uint256 tokensOut = calculateBuyTokens(msg.value);
        require(tokensOut >= minTokensOut, "Slippage protection: insufficient tokens out");
        require(totalSupplyInCurve + tokensOut <= MAX_SUPPLY, "Exceeds max supply");
        
        // Calculate fees
        uint256 creatorFee = (msg.value * CREATOR_FEE_BPS) / 10000;
        uint256 platformFee = (msg.value * PLATFORM_FEE_BPS) / 10000;
        uint256 ethForReserve = msg.value - creatorFee - platformFee;
        
        // Update state
        totalSupplyInCurve += tokensOut;
        ethReserve += ethForReserve;
        
        // Transfer tokens to buyer
        require(token.transfer(msg.sender, tokensOut), "Token transfer failed");
        
        // Send fees
        if (creatorFee > 0) {
            (bool creatorSuccess, ) = creator.call{value: creatorFee}("");
            require(creatorSuccess, "Creator fee transfer failed");
        }
        
        if (platformFee > 0) {
            (bool platformSuccess, ) = platformAdmin.call{value: platformFee}("");
            require(platformSuccess, "Platform fee transfer failed");
        }
        
        emit TokensBought(msg.sender, msg.value, tokensOut, creatorFee, platformFee);
    }
    
    /**
     * @dev Sell tokens for ETH using bonding curve
     * @param tokenAmount Amount of tokens to sell
     * @param minEthOut Minimum ETH expected (slippage protection)
     */
    function sell(uint256 tokenAmount, uint256 minEthOut) external nonReentrant {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(tokenAmount <= totalSupplyInCurve, "Cannot sell more than supply in curve");
        
        uint256 ethOut = calculateSellTokens(tokenAmount);
        require(ethOut >= minEthOut, "Slippage protection: insufficient ETH out");
        require(ethOut <= ethReserve, "Insufficient ETH reserve");
        
        // Calculate fees
        uint256 totalEthBeforeFees = ethReserve - ((totalSupplyInCurve - tokenAmount) * (totalSupplyInCurve - tokenAmount)) / CURVE_COEFFICIENT;
        uint256 creatorFee = (totalEthBeforeFees * CREATOR_FEE_BPS) / 10000;
        uint256 platformFee = (totalEthBeforeFees * PLATFORM_FEE_BPS) / 10000;
        
        // Update state
        totalSupplyInCurve -= tokenAmount;
        ethReserve -= totalEthBeforeFees;
        
        // Transfer tokens from seller
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        
        // Send ETH to seller
        (bool sellerSuccess, ) = msg.sender.call{value: ethOut}("");
        require(sellerSuccess, "ETH transfer to seller failed");
        
        // Send fees
        if (creatorFee > 0) {
            (bool creatorSuccess, ) = creator.call{value: creatorFee}("");
            require(creatorSuccess, "Creator fee transfer failed");
        }
        
        if (platformFee > 0) {
            (bool platformSuccess, ) = platformAdmin.call{value: platformFee}("");
            require(platformSuccess, "Platform fee transfer failed");
        }
        
        emit TokensSold(msg.sender, tokenAmount, ethOut, creatorFee, platformFee);
    }
    
    /**
     * @dev Get current price per token in ETH (18 decimals)
     * @return price Current price per token
     */
    function getCurrentPrice() external view returns (uint256 price) {
        if (totalSupplyInCurve == 0) {
            // Initial price based on curve coefficient
            price = (2 * sqrt(CURVE_COEFFICIENT)) / 1e18;
        } else {
            // Marginal price: derivative of square root curve
            price = sqrt(ethReserve / totalSupplyInCurve) * 2;
        }
    }
    
    /**
     * @dev Get market cap in ETH
     * @return marketCap Total market cap
     */
    function getMarketCap() external view returns (uint256 marketCap) {
        if (totalSupplyInCurve == 0) return 0;
        marketCap = (totalSupplyInCurve * this.getCurrentPrice()) / 1e18;
    }
    
    /**
     * @dev Emergency function to seed initial liquidity (only owner)
     * @param tokenAmount Amount of tokens to add to curve
     */
    function seedLiquidity(uint256 tokenAmount) external payable onlyOwner {
        require(totalSupplyInCurve == 0, "Can only seed when curve is empty");
        require(tokenAmount > 0 && msg.value > 0, "Both token and ETH amounts must be positive");
        
        totalSupplyInCurve = tokenAmount;
        ethReserve = msg.value;
        
        // Transfer tokens to this contract
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
    }
    
    /**
     * @dev Square root function using Babylonian method
     * @param x Number to find square root of
     * @return result Square root result
     */
    function sqrt(uint256 x) internal pure returns (uint256 result) {
        if (x == 0) return 0;
        
        // Initial guess
        result = x;
        uint256 k = (x + 1) / 2;
        
        // Babylonian method
        while (k < result) {
            result = k;
            k = (x / k + k) / 2;
        }
    }
    
    /**
     * @dev View function to get contract info
     * @return tokenAddress The token being traded
     * @return creatorAddress The creator receiving fees
     * @return platformAddress The platform admin address
     * @return supply Current supply in curve
     * @return reserve Current ETH reserve
     */
    function getInfo() external view returns (
        address tokenAddress,
        address creatorAddress,
        address platformAddress,
        uint256 supply,
        uint256 reserve
    ) {
        return (
            address(token),
            creator,
            platformAdmin,
            totalSupplyInCurve,
            ethReserve
        );
    }
}