// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StevensReputationProofCoin
 * @dev ERC20 fungible token contract for Stevens Reputation Proof Coin (SRPC) - The Demand Engine
 * SRPC is non-transferable (soulbound) and represents professor recognition/thumbs up
 * Only distributed by Professor On-Chain Address (POCA) through tasks
 */
contract StevensReputationProofCoin is ERC20, Ownable {
    
    // Reference to StudentManagement contract for whitelist checks
    address public studentManagement;

    // Reference to TaskManager contract (for SRPC distribution through tasks)
    address public taskManager;

    event StudentManagementUpdated(address indexed oldAddress, address indexed newAddress);
    event TaskManagerUpdated(address indexed oldAddress, address indexed newAddress);
    event TokenMinted(address indexed to, uint256 amount);
    event TokenBurned(address indexed from, uint256 amount);

    constructor() ERC20("Stevens Reputation Proof Coin", "SRPC") Ownable(msg.sender) {}

    /**
     * @dev Set the StudentManagement contract address
     */
    function setStudentManagement(address _studentManagement) external onlyOwner {
        address oldAddress = studentManagement;
        studentManagement = _studentManagement;
        emit StudentManagementUpdated(oldAddress, _studentManagement);
    }

    /**
     * @dev Set the TaskManager contract address (for SRPC distribution)
     */
    function setTaskManager(address _taskManager) external onlyOwner {
        address oldAddress = taskManager;
        taskManager = _taskManager;
        emit TaskManagerUpdated(oldAddress, _taskManager);
    }

    /**
     * @dev Mint tokens (only callable by StudentManagement or TaskManager)
     * TaskManager can mint when distributing SRPC rewards from tasks
     */
    function mint(address to, uint256 amount) external {
        require(
            msg.sender == studentManagement || msg.sender == taskManager,
            "Only StudentManagement or TaskManager can mint"
        );
        _mint(to, amount);
        emit TokenMinted(to, amount);
    }

    /**
     * @dev Burn tokens (only callable by StudentManagement or TaskManager)
     * TaskManager can burn when slashing SRPC in dispute resolution
     */
    function burn(address from, uint256 amount) external {
        require(
            msg.sender == studentManagement || msg.sender == taskManager,
            "Only StudentManagement or TaskManager can burn"
        );
        _burn(from, amount);
        emit TokenBurned(from, amount);
    }

    /**
     * @dev Override transfer to prevent transfers (soulbound token)
     * @notice Stevens Reputation Proof Coin tokens cannot be transferred
     */
    function transfer(address, uint256) public pure override returns (bool) {
        revert("Stevens Reputation Proof Coin tokens are non-transferable (soulbound)");
    }

    /**
     * @dev Override transferFrom to prevent transfers (soulbound token)
     * @notice Stevens Reputation Proof Coin tokens cannot be transferred
     */
    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("Stevens Reputation Proof Coin tokens are non-transferable (soulbound)");
    }
}

