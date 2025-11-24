// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract StevensBananaCoin is ERC20, Ownable {

    struct Student {
        string name;
        uint256 studentId;
        bool isWhitelisted;
        address wallet;
        uint256 priority;
        uint256 total_amount_outstanding;
    }

    mapping(address => Student) public students;
    mapping(uint256 => address) public idToWallet;

    uint256[] public allStudentIds;

    // Events
    event StudentAdded(address indexed wallet, string name, uint256 indexed studentId);
    event StudentRemoved(uint256 indexed studentId, address indexed wallet);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event AmountDistributed(address indexed to, uint256 amount, uint256 remainingOutstanding);

    constructor() ERC20("Stevens Banana Coin", "SBC") Ownable(msg.sender) {}

    function addStudent(
    address wallet,
    string memory name,
    uint256 studentId,
    uint256 priority,
    uint256 total_amount_outstanding
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
            wallet: wallet,
            priority: priority,
            total_amount_outstanding: total_amount_outstanding
        });

        idToWallet[studentId] = wallet;
        allStudentIds.push(studentId);

        emit StudentAdded(wallet, name, studentId);
    }


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
                wallet: address(0),
                priority: 0,
                total_amount_outstanding: 0
            });
        }
        return students[wallet];
    }

    function getAllStudents() external view returns (Student[] memory) {
        Student[] memory out = new Student[](allStudentIds.length);
        for (uint256 i = 0; i < allStudentIds.length; i++) {
            out[i] = students[idToWallet[allStudentIds[i]]];
        }
        return out;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(students[to].isWhitelisted, "Recipient not whitelisted");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    function distribute(uint256 totalAmount) external onlyOwner {
        require(totalAmount > 0, "Amount must be greater than 0");
        
        // Get all students and sort by priority (lower number = higher priority)
        Student[] memory allStudents = new Student[](allStudentIds.length);
        for (uint256 i = 0; i < allStudentIds.length; i++) {
            address wallet = idToWallet[allStudentIds[i]];
            allStudents[i] = students[wallet];
        }
        
        // Simple bubble sort by priority (ascending - lower priority number = higher priority)
        for (uint256 i = 0; i < allStudents.length; i++) {
            for (uint256 j = 0; j < allStudents.length - i - 1; j++) {
                if (allStudents[j].priority > allStudents[j + 1].priority) {
                    Student memory temp = allStudents[j];
                    allStudents[j] = allStudents[j + 1];
                    allStudents[j + 1] = temp;
                }
            }
        }
        
        uint256 remaining = totalAmount;
        
        // Distribute to students in priority order
        for (uint256 i = 0; i < allStudents.length && remaining > 0; i++) {
            address wallet = allStudents[i].wallet;
            uint256 outstanding = students[wallet].total_amount_outstanding;
            
            if (outstanding > 0) {
                // Calculate how much to give this student
                uint256 amountToGive = remaining < outstanding ? remaining : outstanding;
                
                // Mint tokens to student
                _mint(wallet, amountToGive);
                emit TokensMinted(wallet, amountToGive);
                
                // Update outstanding amount
                students[wallet].total_amount_outstanding = outstanding - amountToGive;
                
                // Emit distribution event
                emit AmountDistributed(wallet, amountToGive, students[wallet].total_amount_outstanding);
                
                remaining -= amountToGive;
            }
        }
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0)) {
            require(students[to].isWhitelisted, "Mint recipient not whitelisted");
        } else if (to != address(0)) {
            require(students[to].isWhitelisted, "Recipient not whitelisted");
        }
        super._update(from, to, value);
    }
}
