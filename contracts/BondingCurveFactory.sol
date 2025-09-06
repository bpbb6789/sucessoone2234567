// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ContentCoin.sol";
import "./BondingCurveExchange.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Factory that deploys a ContentCoin and its BondingCurveExchange.
/// The factory mints initial supply into the ContentCoin contract (constructor),
/// then transfers token supply to the exchange vault.
contract BondingCurveFactory is Ownable {
    // configuration params for new exchanges
    address public admin;       // platform treasury
    uint256 public immutable defaultK; // default curve constant k

    event ContentCoinAndCurveCreated(address indexed creator, address indexed token, address curve, uint256 initialSupply);

    mapping(address => mapping(address => address)) public curves; // creator -> token -> curve

    constructor(address _admin, uint256 _defaultK) {
        require(_admin != address(0), "admin 0");
        admin = _admin;
        defaultK = _defaultK;
    }

    /// @notice Deploy a ContentCoin and its BondingCurveExchange.
    /// @param name name of token
    /// @param symbol symbol
    /// @param totalSupply total supply (including decimals)
    /// @param decimals token decimals (usually 18)
    /// @return tokenAddr deployed token address
    /// @return curveAddr deployed curve address
    function createContentCoinWithCurve(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint8 decimals
    ) external returns (address tokenAddr, address curveAddr) {
        require(totalSupply > 0, "supply 0");

        // 1) Deploy token; owner is this factory (so we can transfer tokens)
        ContentCoin token = new ContentCoin(name, symbol, totalSupply, decimals, address(this));
        tokenAddr = address(token);

        // 2) Deploy exchange
        BondingCurveExchange curve = new BondingCurveExchange(
            tokenAddr,
            msg.sender,         // creator
            admin,              // admin treasury
            defaultK,
            msg.sender          // owner of exchange is creator so they can change creator/admin if needed
        );
        curveAddr = address(curve);

        // 3) Transfer full supply from token contract to the curve vault
        // token was minted to token contract itself; factory is owner and can call withdrawTo
        token.withdrawTo(curveAddr, totalSupply);

        // 4) Save mapping
        curves[msg.sender][tokenAddr] = curveAddr;

        emit ContentCoinAndCurveCreated(msg.sender, tokenAddr, curveAddr, totalSupply);
        return (tokenAddr, curveAddr);
    }

    /// @notice Deploy only curve for existing token (useful if tokens are minted separately)
    function deployCurveForExistingToken(address tokenAddr) external returns (address curveAddr) {
        require(tokenAddr != address(0), "token 0");
        require(curves[msg.sender][tokenAddr] == address(0), "curve exists");

        BondingCurveExchange curve = new BondingCurveExchange(
            tokenAddr,
            msg.sender,
            admin,
            defaultK,
            msg.sender
        );
        curveAddr = address(curve);

        // Transfer tokens must be done by token owner externally to curve
        curves[msg.sender][tokenAddr] = curveAddr;
        emit ContentCoinAndCurveCreated(msg.sender, tokenAddr, curveAddr, 0);
    }

    function updateAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "admin 0");
        admin = newAdmin;
    }

    /// Helper: read curve for creator+token
    function getCurve(address creator, address token) external view returns (address) {
        return curves[creator][token];
    }
}