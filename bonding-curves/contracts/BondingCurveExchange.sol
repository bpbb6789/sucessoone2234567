// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Bonding curve exchange for a single ContentCoin token.
/// - Non-burn model: tokens are stored in the exchange vault and transferred to/from users.
/// - Square/quadratic curve: cost = k * ((S + n)^2 - S^2)
contract BondingCurveExchange is ReentrancyGuard, Ownable {
    IERC20 public immutable token;
    address public creator;
    address public admin;

    // reserves tracked in ETH wei
    uint256 public reserveBalance;
    // tracked supply used for curve math - equals amount sold (i.e. circulating from vault)
    uint256 public totalSupply; // this represents tokens sold via this exchange (in token base units)

    // Fees: basis points (BPS). TOTAL = 8 => 0.08%
    uint16 public constant TOTAL_FEE_BPS = 8;
    uint16 public constant CREATOR_FEE_BPS = 5; // 0.05%
    uint16 public constant ADMIN_FEE_BPS   = 3; // 0.03%
    uint16 public constant BPS_DENOMINATOR = 10000;

    // curve constant k (scale). Tune this to set initial price.
    // price (wei) = k * supply^2 derivative behavior
    uint256 public immutable k;

    event Bought(address indexed buyer, uint256 tokensOut, uint256 ethPaid, uint256 creatorFee, uint256 adminFee);
    event Sold(address indexed seller, uint256 tokensIn, uint256 ethPayout, uint256 creatorFee, uint256 adminFee);
    event ReserveWithdrawn(address indexed to, uint256 amount);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event CreatorChanged(address indexed oldCreator, address indexed newCreator);

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

    // --------------------------
    // Public view helpers
    // --------------------------

    /// @notice Quadratic cost to mint `amountOut` tokens given current supply S:
    /// cost = k * ( (S + n)^2 - S^2 ) = k * (2*S*n + n^2)
    function buyCost(uint256 amountOut) public view returns (uint256) {
        if (amountOut == 0) return 0;
        uint256 s = totalSupply;
        // cost = k * ( (s + n)^2 - s^2 ) = k*(2*s*n + n*n)
        // compute (2*s*n + n*n) first as uint256
        uint256 term1 = 2 * s * amountOut;
        uint256 term2 = amountOut * amountOut;
        uint256 sum = term1 + term2;
        return k * sum;
    }

    /// @notice Payout (in ETH wei) returned for burning/selling `amountIn` tokens:
    /// payout = k * ( S^2 - (S - n)^2 ) = k * (2*S*n - n^2)
    function sellReward(uint256 amountIn) public view returns (uint256) {
        require(amountIn <= totalSupply, "sell > supply");
        if (amountIn == 0) return 0;
        uint256 s = totalSupply;
        uint256 term1 = 2 * s * amountIn;
        uint256 term2 = amountIn * amountIn;
        uint256 sum = term1 - term2;
        return k * sum;
    }

    // Marginal price approximation for 1 token (useful for UI)
    function currentPricePerToken() public view returns (uint256) {
        return buyCost(1);
    }

    // --------------------------
    // Trade: buy (ETH -> tokens)
    // --------------------------
    /// @notice Buy `amountOut` tokens by sending ETH.
    /// - Caller sends ETH >= buyCost(amountOut)
    /// - Contract transfers tokens from vault to buyer
    function buy(uint256 amountOut) external payable nonReentrant {
        require(amountOut > 0, "amountOut 0");

        uint256 cost = buyCost(amountOut);
        require(msg.value >= cost, "insufficient ETH");

        // calculate fees (on cost)
        uint256 totalFee = (cost * TOTAL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorFee = (cost * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 adminFee   = (cost * ADMIN_FEE_BPS) / BPS_DENOMINATOR;

        // update bookkeeping
        totalSupply += amountOut;
        reserveBalance += (cost - totalFee);

        // transfer fees immediately
        if (creatorFee > 0) {
            (bool sentC,) = payable(creator).call{value: creatorFee}("");
            require(sentC, "creator fee send failed");
        }
        if (adminFee > 0) {
            (bool sentA,) = payable(admin).call{value: adminFee}("");
            require(sentA, "admin fee send failed");
        }

        // transfer tokens from this exchange's vault to buyer
        require(token.transfer(msg.sender, amountOut), "token transfer failed");

        // refund any excess ETH
        if (msg.value > cost) {
            (bool refund,) = payable(msg.sender).call{value: msg.value - cost}("");
            require(refund, "refund failed");
        }

        emit Bought(msg.sender, amountOut, cost, creatorFee, adminFee);
    }

    // --------------------------
    // Trade: sell (tokens -> ETH)
    // --------------------------
    /// @notice Sell `amountIn` tokens and receive ETH payout.
    /// - Caller must approve token transfer to this contract prior to calling.
    function sell(uint256 amountIn) external nonReentrant {
        require(amountIn > 0, "amountIn 0");
        require(amountIn <= totalSupply, "sell too big");

        uint256 payout = sellReward(amountIn);
        require(reserveBalance >= payout, "insufficient reserve");

        // compute fees on payout
        uint256 totalFee = (payout * TOTAL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorFee = (payout * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 adminFee   = (payout * ADMIN_FEE_BPS) / BPS_DENOMINATOR;

        // pull tokens into vault
        require(token.transferFrom(msg.sender, address(this), amountIn), "transferFrom failed");

        // update bookkeeping
        totalSupply -= amountIn;
        reserveBalance -= payout;

        // send fees
        if (creatorFee > 0) {
            (bool sentC,) = payable(creator).call{value: creatorFee}("");
            require(sentC, "creator fee send failed");
        }
        if (adminFee > 0) {
            (bool sentA,) = payable(admin).call{value: adminFee}("");
            require(sentA, "admin fee send failed");
        }

        // pay seller payout minus totalFee
        uint256 netPayout = payout - totalFee;
        (bool paid,) = payable(msg.sender).call{value: netPayout}("");
        require(paid, "pay seller failed");

        emit Sold(msg.sender, amountIn, payout, creatorFee, adminFee);
    }

    // --------------------------
    // Admin utilities
    // --------------------------
    /// @notice Withdraw excess ETH (reserve leftover not required by curve) — owner only.
    function withdrawReserve(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to 0");
        require(amount <= address(this).balance, "not enough ETH");
        (bool sent,) = payable(to).call{value: amount}("");
        require(sent, "withdraw failed");
        emit ReserveWithdrawn(to, amount);
    }

    function setAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "admin 0");
        emit AdminChanged(admin, newAdmin);
        admin = newAdmin;
    }

    function setCreator(address newCreator) external onlyOwner {
        require(newCreator != address(0), "creator 0");
        emit CreatorChanged(creator, newCreator);
        creator = newCreator;
    }

    // Allow contract to receive ETH (e.g. refunds)
    receive() external payable {
        reserveBalance += msg.value;
    }
}