// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "../tokens/StevensBananaCoin.sol";
import "../tokens/StevensDuckCoin.sol";
import "../tokens/StevensReputationProofCoin.sol";

/**
 * @title StudentManagement
 * @dev Main contract that manages student information and coordinates with Stevens tokens
 * Manages three tokens: SBC (Stevens Banana Coin), SDC (Stevens Duck Coin), SRPC (Stevens Reputation Proof Coin)
 */
contract StudentManagement is Ownable {
    
    struct Student {
        string name;
        uint256 studentId;
        bool isWhitelisted;
        address wallet;
    }

    mapping(address => Student) public students;
    mapping(uint256 => address) public idToWallet;
    uint256[] public allStudentIds;

    // Token contracts
    StevensBananaCoin public stevensBananaCoin;  // SBC - The Fuel
    StevensDuckCoin public stevensDuckCoin;      // SDC - Stevens Cash
    StevensReputationProofCoin public stevensReputationProofCoin;  // SRPC - The Demand Engine

    // Events
    event StudentAdded(address indexed wallet, string name, uint256 indexed studentId);
    event StudentRemoved(uint256 indexed studentId, address indexed wallet);
    event SBCMinted(address indexed to, uint256 amount);
    event SBCBurned(address indexed from, uint256 amount);
    event SBCTransferred(address indexed from, address indexed to, uint256 amount);
    event SDCMinted(address indexed to, uint256 amount);
    event SDCBurned(address indexed from, uint256 amount);
    event SDCTransferred(address indexed from, address indexed to, uint256 amount);
    event SRPCMinted(address indexed to, uint256 amount);
    event SRPCBurned(address indexed from, uint256 amount);

    constructor(
        address _sbcAddress,
        address _sdcAddress,
        address _srpcAddress
    ) Ownable(msg.sender) {
        stevensBananaCoin = StevensBananaCoin(_sbcAddress);
        stevensDuckCoin = StevensDuckCoin(_sdcAddress);
        stevensReputationProofCoin = StevensReputationProofCoin(_srpcAddress);
    }

    /**
     * @dev Add or update a student
     */
    function addStudent(
        address wallet,
        string memory name,
        uint256 studentId
    ) external onlyOwner {
        // If ID exists → delete first
        address oldWallet = idToWallet[studentId];
        if (oldWallet != address(0)) {
            delete students[oldWallet];

            for (uint256 i = 0; i < allStudentIds.length; i++) {
                if (allStudentIds[i] == studentId) {
                    allStudentIds[i] = allStudentIds[allStudentIds.length - 1];
                    allStudentIds.pop();
                    break;
                }
            }
        }

        // Add new student
        students[wallet] = Student({
            name: name,
            studentId: studentId,
            isWhitelisted: true,
            wallet: wallet
        });

        idToWallet[studentId] = wallet;
        allStudentIds.push(studentId);

        emit StudentAdded(wallet, name, studentId);
    }

    /**
     * @dev Remove a student from the whitelist
     */
    function removeStudent(uint256 studentId) external onlyOwner {
        address wallet = idToWallet[studentId];
        require(wallet != address(0), "Student does not exist");

        delete students[wallet];
        delete idToWallet[studentId];

        // Remove from array
        for (uint256 i = 0; i < allStudentIds.length; i++) {
            if (allStudentIds[i] == studentId) {
                allStudentIds[i] = allStudentIds[allStudentIds.length - 1];
                allStudentIds.pop();
                break;
            }
        }

        emit StudentRemoved(studentId, wallet);
    }

    /**
     * @dev Get student information by ID
     */
    function getStudentById(uint256 studentId)
        external
        view
        returns (Student memory)
    {
        address wallet = idToWallet[studentId];
        if (wallet == address(0)) {
            return Student({
                name: "",
                studentId: 0,
                isWhitelisted: false,
                wallet: address(0)
            });
        }
        return students[wallet];
    }

    /**
     * @dev Get all students
     */
    function getAllStudents() external view returns (Student[] memory) {
        Student[] memory out = new Student[](allStudentIds.length);
        for (uint256 i = 0; i < allStudentIds.length; i++) {
            out[i] = students[idToWallet[allStudentIds[i]]];
        }
        return out;
    }

    // ============ STEVENS BANANA COIN (SBC) FUNCTIONS ============

    /**
     * @dev Mint Stevens Banana Coin (SBC) tokens to a whitelisted student
     */
    function mintSBC(address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        stevensBananaCoin.mint(to, amount);
        emit SBCMinted(to, amount);
    }

    /**
     * @dev Burn Stevens Banana Coin (SBC) tokens from a wallet
     */
    function burnSBC(address from, uint256 amount) external onlyOwner {
        stevensBananaCoin.burn(from, amount);
        emit SBCBurned(from, amount);
    }

    /**
     * @dev Transfer Stevens Banana Coin (SBC) tokens (only for whitelisted addresses)
     */
    function transferSBC(address from, address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        stevensBananaCoin.transferFrom(from, to, amount);
        emit SBCTransferred(from, to, amount);
    }

    // ============ STEVENS DUCK COIN (SDC) FUNCTIONS ============

    /**
     * @dev Mint Stevens Duck Coin (SDC) tokens to a whitelisted student
     */
    function mintSDC(address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        stevensDuckCoin.mint(to, amount);
        emit SDCMinted(to, amount);
    }

    /**
     * @dev Burn Stevens Duck Coin (SDC) tokens from a wallet
     */
    function burnSDC(address from, uint256 amount) external onlyOwner {
        stevensDuckCoin.burn(from, amount);
        emit SDCBurned(from, amount);
    }

    /**
     * @dev Transfer Stevens Duck Coin (SDC) tokens (only for whitelisted addresses)
     */
    function transferSDC(address from, address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        stevensDuckCoin.transferFrom(from, to, amount);
        emit SDCTransferred(from, to, amount);
    }

    // ============ STEVENS REPUTATION PROOF COIN (SRPC) FUNCTIONS ============

    /**
     * @dev Mint Stevens Reputation Proof Coin (SRPC) tokens to a whitelisted student
     * @param to The address to mint tokens to
     * @param amount The amount of SRPC tokens to mint
     * @notice SRPC should typically be distributed through TaskManager by POCA
     */
    function mintSRPC(address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        stevensReputationProofCoin.mint(to, amount);
        emit SRPCMinted(to, amount);
    }

    /**
     * @dev Burn Stevens Reputation Proof Coin (SRPC) tokens from a student
     * @param from The address to burn tokens from
     * @param amount The amount of SRPC tokens to burn
     */
    function burnSRPC(address from, uint256 amount) external onlyOwner {
        stevensReputationProofCoin.burn(from, amount);
        emit SRPCBurned(from, amount);
    }

    /**
     * @dev Legacy function names for backward compatibility
     */
    function mintPoR(address to, uint256 amount) external onlyOwner {
        this.mintSRPC(to, amount);
    }

    function burnPoR(address from, uint256 amount) external onlyOwner {
        this.burnSRPC(from, amount);
    }

    function mintNFT(address to, uint256 amount) external onlyOwner {
        this.mintSRPC(to, amount);
    }

    function burnNFT(address from, uint256 amount) external onlyOwner {
        this.burnSRPC(from, amount);
    }

    // Legacy DuckCoin functions for backward compatibility
    function mintDuckCoin(address to, uint256 amount) external onlyOwner {
        this.mintSBC(to, amount);
    }

    function burnDuckCoin(address from, uint256 amount) external onlyOwner {
        this.burnSBC(from, amount);
    }

    function transferDuckCoin(address from, address to, uint256 amount) external onlyOwner {
        this.transferSBC(from, to, amount);
    }

    /**
     * @dev Update token contract addresses (in case of upgrade)
     */
    function updateTokenContracts(
        address _sbcAddress,
        address _sdcAddress,
        address _srpcAddress
    ) external onlyOwner {
        stevensBananaCoin = StevensBananaCoin(_sbcAddress);
        stevensDuckCoin = StevensDuckCoin(_sdcAddress);
        stevensReputationProofCoin = StevensReputationProofCoin(_srpcAddress);
    }
}


