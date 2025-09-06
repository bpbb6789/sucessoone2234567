// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Simple ERC20 used as Content Coin. Minted once at construction (by the factory).
contract ContentCoin is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply, // expressed in token units (including decimals)
        uint8 decimals_,
        address owner_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _mint(address(this), initialSupply); // mint to this contract for the factory to transfer to the curve
        _transferOwnership(owner_);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /// @notice Allow owner (factory) to transfer token held by this contract
    function withdrawTo(address to, uint256 amount) external onlyOwner {
        _transfer(address(this), to, amount);
    }
}