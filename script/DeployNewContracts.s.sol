// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { DuckCoin } from "../src/DuckCoin.sol";
import { ProveOfReputation } from "../src/ProveOfReputation.sol";
import { StudentManagement } from "../src/StudentManagement.sol";
import { console } from "forge-std/console.sol";

contract DeployNewContracts is Script {

    function run() external {
        // Load your private key from environment variable or use default Anvil key
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy DuckCoin (ERC20)
        console.log("Deploying DuckCoin...");
        DuckCoin duckCoin = new DuckCoin();
        console.log("DuckCoin deployed to:", address(duckCoin));

        // Step 2: Deploy ProveOfReputation (ERC721)
        console.log("Deploying ProveOfReputation...");
        ProveOfReputation proveOfReputation = new ProveOfReputation();
        console.log("ProveOfReputation deployed to:", address(proveOfReputation));

        // Step 3: Deploy StudentManagement (main contract)
        console.log("Deploying StudentManagement...");
        StudentManagement studentManagement = new StudentManagement(
            address(duckCoin),
            address(proveOfReputation)
        );
        console.log("StudentManagement deployed to:", address(studentManagement));

        // Step 4: Link the contracts
        console.log("Linking contracts...");
        duckCoin.setStudentManagement(address(studentManagement));
        console.log("DuckCoin linked to StudentManagement");

        proveOfReputation.setStudentManagement(address(studentManagement));
        console.log("ProveOfReputation linked to StudentManagement");

        // Print summary
        console.log("\n=== Deployment Summary ===");
        console.log("DuckCoin Address:", address(duckCoin));
        console.log("ProveOfReputation Address:", address(proveOfReputation));
        console.log("StudentManagement Address:", address(studentManagement));
        console.log("\nCopy these addresses to sbc-frontend/src/contracts/config.js");

        vm.stopBroadcast();
    }
}

