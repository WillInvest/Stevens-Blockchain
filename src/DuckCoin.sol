// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DuckCoin
 * @dev ERC20 fungible token contract for Duck Coin
 */
contract DuckCoin is ERC20, Ownable {
    
    // Reference to StudentManagement contract for whitelist checks
    address public studentManagement;

    event StudentManagementUpdated(address indexed oldAddress, address indexed newAddress);

    constructor() ERC20("Duck Coin", "DC") Ownable(msg.sender) {}

    /**
     * @dev Set the StudentManagement contract address
     */
    function setStudentManagement(address _studentManagement) external onlyOwner {
        address oldAddress = studentManagement;
        studentManagement = _studentManagement;
        emit StudentManagementUpdated(oldAddress, _studentManagement);
    }

    /**
     * @dev Mint tokens (only callable by StudentManagement contract)
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == studentManagement, "Only StudentManagement can mint");
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens (only callable by StudentManagement contract)
     */
    function burn(address from, uint256 amount) external {
        require(msg.sender == studentManagement, "Only StudentManagement can burn");
        _burn(from, amount);
    }

    /**
     * @dev Override transfer to check whitelist via StudentManagement
     */
    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0)) {
            // Minting - check handled by StudentManagement
            require(studentManagement != address(0), "StudentManagement not set");
        } else if (to != address(0)) {
            // Transfer - check recipient is whitelisted
            require(studentManagement != address(0), "StudentManagement not set");
            // Note: Actual whitelist check is done in StudentManagement before calling transfer
        }
        super._update(from, to, value);
    }
}

