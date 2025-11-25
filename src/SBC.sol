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
    }

    mapping(address => Student) public students;
    mapping(uint256 => address) public idToWallet;

    uint256[] public allStudentIds;

    // Events
    event StudentAdded(address indexed wallet, string name, uint256 indexed studentId);
    event StudentRemoved(uint256 indexed studentId, address indexed wallet);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor() ERC20("Stevens Banana Coin", "SBC") Ownable(msg.sender) {}

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
                wallet: address(0)
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

    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0)) {
            require(students[to].isWhitelisted, "Mint recipient not whitelisted");
        } else if (to != address(0)) {
            require(students[to].isWhitelisted, "Recipient not whitelisted");
        }
        super._update(from, to, value);
    }
}
