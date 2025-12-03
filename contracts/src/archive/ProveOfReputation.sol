// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProveOfReputation
 * @dev ERC20 fungible token contract for Proof of Reputation (non-transferable)
 */
contract ProveOfReputation is ERC20, Ownable {
    
    // Reference to StudentManagement contract for whitelist checks
    address public studentManagement;

    event StudentManagementUpdated(address indexed oldAddress, address indexed newAddress);
    event TokenMinted(address indexed to, uint256 amount);
    event TokenBurned(address indexed from, uint256 amount);

    constructor() ERC20("Proof of Reputation", "SRPC") Ownable(msg.sender) {}

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
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == studentManagement, "Only StudentManagement can mint");
        _mint(to, amount);
        emit TokenMinted(to, amount);
    }

    /**
     * @dev Burn tokens (only callable by StudentManagement contract)
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        require(msg.sender == studentManagement, "Only StudentManagement can burn");
        _burn(from, amount);
        emit TokenBurned(from, amount);
    }

    /**
     * @dev Override transfer to prevent transfers (soulbound token)
     * @notice Proof of Reputation tokens cannot be transferred
     */
    function transfer(address, uint256) public pure override returns (bool) {
        revert("Proof of Reputation tokens are non-transferable (soulbound)");
    }

    /**
     * @dev Override transferFrom to prevent transfers (soulbound token)
     * @notice Proof of Reputation tokens cannot be transferred
     */
    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("Proof of Reputation tokens are non-transferable (soulbound)");
    }
}
