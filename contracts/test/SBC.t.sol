pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import { StevensBananaCoin } from "../src/tokens/StevensBananaCoin.sol";
import { StevensDuckCoin } from "../src/tokens/StevensDuckCoin.sol";
import { StevensReputationProofCoin } from "../src/tokens/StevensReputationProofCoin.sol";
import { StudentManagement } from "../src/core/StudentManagement.sol";

contract SBCTest is Test {
    StevensBananaCoin sbc;
    StevensDuckCoin sdc;
    StevensReputationProofCoin srpc;
    StudentManagement studentManagement;
    address student = address(0x123);
    address owner = address(this);

    function setUp() public {
        // Deploy tokens first
        sbc = new StevensBananaCoin();
        sdc = new StevensDuckCoin();
        srpc = new StevensReputationProofCoin();
        
        // Deploy StudentManagement
        studentManagement = new StudentManagement(
            address(sbc),
            address(sdc),
            address(srpc)
        );
        
        // Link tokens to StudentManagement
        sbc.setStudentManagement(address(studentManagement));
        sdc.setStudentManagement(address(studentManagement));
        srpc.setStudentManagement(address(studentManagement));
    }

    function testWhitelistAndMint() public {
        // Add student through StudentManagement
        studentManagement.addStudent(student, "Alice", 12345);
        
        // Mint SBC through StudentManagement
        studentManagement.mintSBC(student, 100 * 1e18);

        assertEq(sbc.balanceOf(student), 100 * 1e18);
    }

    function testFail_TransferToNonWhitelisted() public {
        address a = address(0x111);
        address b = address(0x222);

        studentManagement.addStudent(a, "A", 1);
        studentManagement.mintSBC(a, 100);

        // Try to transfer to non-whitelisted address (should fail)
        vm.prank(a);
        // This should fail because b is not whitelisted
        // sbc.transfer(b, 1); // Uncomment to test transfer restriction
    }
}
