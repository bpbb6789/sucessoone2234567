// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BondingCurveExchange.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BondingCurveFactory
 * @dev Factory contract to deploy BondingCurveExchange contracts for Content Coins
 * @notice Creates automated trading markets for Zora-created tokens
 */
contract BondingCurveFactory is Ownable {
    address public platformAdmin;
    
    // creator → token → curve
    mapping(address => mapping(address => address)) public curves;
    
    // Array to track all deployed curves
    address[] public allCurves;
    
    // Events
    event CurveDeployed(
        address indexed creator,
        address indexed token, 
        address indexed curve,
        uint256 curveIndex
    );
    
    event PlatformAdminUpdated(
        address indexed oldAdmin,
        address indexed newAdmin
    );
    
    constructor(address _platformAdmin) Ownable(msg.sender) {
        require(_platformAdmin != address(0), "Invalid platform admin address");
        platformAdmin = _platformAdmin;
        
        emit PlatformAdminUpdated(address(0), _platformAdmin);
    }
    
    /**
     * @dev Deploy a new bonding curve for a content coin
     * @param token Address of the ERC20 token (Content Coin)
     * @param creator Address of the content creator
     * @return curveAddress Address of the deployed BondingCurveExchange
     */
    function deployCurve(address token, address creator) external returns (address curveAddress) {
        require(token != address(0), "Invalid token address");
        require(creator != address(0), "Invalid creator address");
        require(curves[creator][token] == address(0), "Curve already exists for this creator/token pair");
        
        // Deploy new BondingCurveExchange
        BondingCurveExchange curve = new BondingCurveExchange(
            token,
            creator,
            platformAdmin
        );
        
        curveAddress = address(curve);
        
        // Store the mapping
        curves[creator][token] = curveAddress;
        
        // Add to all curves array
        allCurves.push(curveAddress);
        
        emit CurveDeployed(creator, token, curveAddress, allCurves.length - 1);
    }
    
    /**
     * @dev Get curve address for a specific creator/token pair
     * @param creator Creator address
     * @param token Token address
     * @return curveAddress Address of bonding curve, or zero address if not exists
     */
    function getCurve(address creator, address token) external view returns (address curveAddress) {
        return curves[creator][token];
    }
    
    /**
     * @dev Check if a curve exists for creator/token pair
     * @param creator Creator address
     * @param token Token address
     * @return exists True if curve exists
     */
    function curveExists(address creator, address token) external view returns (bool exists) {
        return curves[creator][token] != address(0);
    }
    
    /**
     * @dev Get total number of deployed curves
     * @return count Number of curves deployed
     */
    function getCurveCount() external view returns (uint256 count) {
        return allCurves.length;
    }
    
    /**
     * @dev Get curve address by index
     * @param index Index in the allCurves array
     * @return curveAddress Address of the curve
     */
    function getCurveByIndex(uint256 index) external view returns (address curveAddress) {
        require(index < allCurves.length, "Index out of bounds");
        return allCurves[index];
    }
    
    /**
     * @dev Get info for multiple curves
     * @param startIndex Starting index
     * @param count Number of curves to fetch
     * @return curveAddresses Array of curve addresses
     * @return tokenAddresses Array of token addresses
     * @return creatorAddresses Array of creator addresses
     */
    function getCurvesBatch(
        uint256 startIndex, 
        uint256 count
    ) external view returns (
        address[] memory curveAddresses,
        address[] memory tokenAddresses,
        address[] memory creatorAddresses
    ) {
        require(startIndex < allCurves.length, "Start index out of bounds");
        
        uint256 endIndex = startIndex + count;
        if (endIndex > allCurves.length) {
            endIndex = allCurves.length;
        }
        
        uint256 actualCount = endIndex - startIndex;
        curveAddresses = new address[](actualCount);
        tokenAddresses = new address[](actualCount);
        creatorAddresses = new address[](actualCount);
        
        for (uint256 i = 0; i < actualCount; i++) {
            address curveAddress = allCurves[startIndex + i];
            BondingCurveExchange curve = BondingCurveExchange(curveAddress);
            
            curveAddresses[i] = curveAddress;
            
            // Get token and creator info from the curve
            (address tokenAddr, address creatorAddr, , , ) = curve.getInfo();
            tokenAddresses[i] = tokenAddr;
            creatorAddresses[i] = creatorAddr;
        }
    }
    
    /**
     * @dev Update platform admin address (only current admin)
     * @param newAdmin New platform admin address
     */
    function updatePlatformAdmin(address newAdmin) external {
        require(msg.sender == platformAdmin, "Only platform admin can update");
        require(newAdmin != address(0), "Invalid new admin address");
        
        address oldAdmin = platformAdmin;
        platformAdmin = newAdmin;
        
        emit PlatformAdminUpdated(oldAdmin, newAdmin);
    }
    
    /**
     * @dev Emergency function to get curve info (view only)
     * @param curveAddress Address of the bonding curve
     * @return tokenAddress Token being traded
     * @return creatorAddress Creator receiving fees
     * @return supply Current token supply in curve
     * @return reserve Current ETH reserve
     * @return currentPrice Current token price
     */
    function getCurveInfo(address curveAddress) external view returns (
        address tokenAddress,
        address creatorAddress,
        uint256 supply,
        uint256 reserve,
        uint256 currentPrice
    ) {
        require(curveAddress != address(0), "Invalid curve address");
        
        BondingCurveExchange curve = BondingCurveExchange(curveAddress);
        
        (tokenAddress, creatorAddress, , supply, reserve) = curve.getInfo();
        currentPrice = curve.getCurrentPrice();
    }
}