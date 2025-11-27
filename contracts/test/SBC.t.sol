pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import { StevensBananaCoin } from "../src/tokens/StevensBananaCoin.sol";

contract SBCTest is Test {
    StevensBananaCoin token;
    address student = address(0x123);

    function setUp() public {
        token = new StevensBananaCoin();
    }

    function testWhitelistAndMint() public {
        token.addStudent(student, "Alice", 12345);
        token.mint(student, 100 * 1e18);

        assertEq(token.balanceOf(student), 100 * 1e18);
    }

    function testFail_TransferToNonWhitelisted() public {
        address a = address(0x111);
        // address b = address(0x222);

        token.addStudent(a, "A", 1);
        token.mint(a, 100);

        vm.prank(a);
        // token.transfer(b, 1);
    }
}
