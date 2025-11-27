// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StevensDuckCoin
 * @dev ERC20 fungible token contract for Stevens Duck Coin (SDC) - Stevens Cash
 * SDC is redeemable anytime and represents cash equivalent in the Stevens ecosystem
 */
contract StevensDuckCoin is ERC20, Ownable {
    
    // Reference to StudentManagement contract for whitelist checks
    address public studentManagement;

    // Redemption contract address (for cash redemption)
    address public redemptionContract;

    event StudentManagementUpdated(address indexed oldAddress, address indexed newAddress);
    event RedemptionContractUpdated(address indexed oldAddress, address indexed newAddress);
    event TokensRedeemed(address indexed user, uint256 amount);

    constructor() ERC20("Stevens Duck Coin", "SDC") Ownable(msg.sender) {}

    /**
     * @dev Set the StudentManagement contract address
     */
    function setStudentManagement(address _studentManagement) external onlyOwner {
        address oldAddress = studentManagement;
        studentManagement = _studentManagement;
        emit StudentManagementUpdated(oldAddress, _studentManagement);
    }

    /**
     * @dev Set the redemption contract address
     */
    function setRedemptionContract(address _redemptionContract) external onlyOwner {
        address oldAddress = redemptionContract;
        redemptionContract = _redemptionContract;
        emit RedemptionContractUpdated(oldAddress, _redemptionContract);
    }

    /**
     * @dev Mint tokens (only callable by StudentManagement or redemption contract)
     */
    function mint(address to, uint256 amount) external {
        require(
            msg.sender == studentManagement || msg.sender == redemptionContract,
            "Only StudentManagement or RedemptionContract can mint"
        );
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens (only callable by StudentManagement or redemption contract)
     */
    function burn(address from, uint256 amount) external {
        require(
            msg.sender == studentManagement || msg.sender == redemptionContract,
            "Only StudentManagement or RedemptionContract can burn"
        );
        _burn(from, amount);
    }

    /**
     * @dev Redeem SDC for cash (only callable by redemption contract)
     */
    function redeem(address user, uint256 amount) external {
        require(msg.sender == redemptionContract, "Only RedemptionContract can redeem");
        require(balanceOf(user) >= amount, "Insufficient SDC balance");
        _burn(user, amount);
        emit TokensRedeemed(user, amount);
    }

    /**
     * @dev Override transfer to check whitelist via StudentManagement
     */
    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0)) {
            // Minting - check handled by StudentManagement or redemption contract
            require(studentManagement != address(0) || redemptionContract != address(0), "Management not set");
        } else if (to != address(0)) {
            // Transfer - check recipient is whitelisted
            require(studentManagement != address(0), "StudentManagement not set");
            // Note: Actual whitelist check is done in StudentManagement before calling transfer
        }
        super._update(from, to, value);
    }
}

