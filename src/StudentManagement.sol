// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "./DuckCoin.sol";
import "./ProveOfReputation.sol";

/**
 * @title StudentManagement
 * @dev Main contract that manages student information and coordinates with DuckCoin and ProveOfReputation contracts
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
    DuckCoin public duckCoin;
    ProveOfReputation public proveOfReputation;

    // Events
    event StudentAdded(address indexed wallet, string name, uint256 indexed studentId);
    event StudentRemoved(uint256 indexed studentId, address indexed wallet);
    event DuckCoinMinted(address indexed to, uint256 amount);
    event DuckCoinBurned(address indexed from, uint256 amount);
    event DuckCoinTransferred(address indexed from, address indexed to, uint256 amount);
    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event NFTBurned(address indexed from, uint256 indexed tokenId);

    constructor(address _duckCoinAddress, address _nftAddress) Ownable(msg.sender) {
        duckCoin = DuckCoin(_duckCoinAddress);
        proveOfReputation = ProveOfReputation(_nftAddress);
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

    // ============ DUCK COIN FUNCTIONS ============

    /**
     * @dev Mint Duck Coin tokens to a whitelisted student
     */
    function mintDuckCoin(address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        duckCoin.mint(to, amount);
        emit DuckCoinMinted(to, amount);
    }

    /**
     * @dev Burn Duck Coin tokens from a wallet
     */
    function burnDuckCoin(address from, uint256 amount) external onlyOwner {
        duckCoin.burn(from, amount);
        emit DuckCoinBurned(from, amount);
    }

    /**
     * @dev Transfer Duck Coin tokens (only for whitelisted addresses)
     */
    function transferDuckCoin(address from, address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        duckCoin.transferFrom(from, to, amount);
        emit DuckCoinTransferred(from, to, amount);
    }

    // ============ PROVE OF REPUTATION FUNCTIONS ============

    /**
     * @dev Mint Prove of Reputation tokens to a whitelisted student
     * @param to The address to mint tokens to
     * @param amount The amount of PoR tokens to mint
     */
    function mintPoR(address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        proveOfReputation.mint(to, amount);
        emit NFTMinted(to, amount);
    }

    /**
     * @dev Burn Prove of Reputation tokens from a student
     * @param from The address to burn tokens from
     * @param amount The amount of PoR tokens to burn
     */
    function burnPoR(address from, uint256 amount) external onlyOwner {
        proveOfReputation.burn(from, amount);
        emit NFTBurned(from, amount);
    }

    /**
     * @dev Legacy function name for backward compatibility (calls mintPoR)
     * @param to The address to mint tokens to
     * @param amount The amount of PoR tokens to mint (previously tokenId)
     */
    function mintNFT(address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        proveOfReputation.mint(to, amount);
        emit NFTMinted(to, amount);
    }

    /**
     * @dev Legacy function name for backward compatibility (calls burnPoR)
     * @param from The address to burn tokens from
     * @param amount The amount of PoR tokens to burn (previously tokenId)
     */
    function burnNFT(address from, uint256 amount) external onlyOwner {
        proveOfReputation.burn(from, amount);
        emit NFTBurned(from, amount);
    }

    /**
     * @dev Update token contract addresses (in case of upgrade)
     */
    function updateTokenContracts(address _duckCoinAddress, address _nftAddress) external onlyOwner {
        duckCoin = DuckCoin(_duckCoinAddress);
        proveOfReputation = ProveOfReputation(_nftAddress);
    }
}

