// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { StevensBananaCoin } from "../src/tokens/StevensBananaCoin.sol";
import { StevensDuckCoin } from "../src/tokens/StevensDuckCoin.sol";
import { StevensReputationProofCoin } from "../src/tokens/StevensReputationProofCoin.sol";
import { StudentManagement } from "../src/core/StudentManagement.sol";
import { console } from "forge-std/console.sol";

contract DeployNewContracts is Script {

    function run() external {
        // Load your private key from environment variable or use default Anvil key
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy StevensBananaCoin (SBC) - The Fuel
        console.log("Deploying StevensBananaCoin (SBC)...");
        StevensBananaCoin sbc = new StevensBananaCoin();
        console.log("StevensBananaCoin (SBC) deployed to:", address(sbc));

        // Step 2: Deploy StevensDuckCoin (SDC) - Stevens Cash
        console.log("Deploying StevensDuckCoin (SDC)...");
        StevensDuckCoin sdc = new StevensDuckCoin();
        console.log("StevensDuckCoin (SDC) deployed to:", address(sdc));

        // Step 3: Deploy StevensReputationProofCoin (SRPC) - The Demand Engine
        console.log("Deploying StevensReputationProofCoin (SRPC)...");
        StevensReputationProofCoin srpc = new StevensReputationProofCoin();
        console.log("StevensReputationProofCoin (SRPC) deployed to:", address(srpc));

        // Step 4: Deploy StudentManagement (main contract)
        console.log("Deploying StudentManagement...");
        StudentManagement studentManagement = new StudentManagement(
            address(sbc),
            address(sdc),
            address(srpc)
        );
        console.log("StudentManagement deployed to:", address(studentManagement));

        // Step 5: Link the contracts
        console.log("Linking contracts...");
        sbc.setStudentManagement(address(studentManagement));
        console.log("StevensBananaCoin (SBC) linked to StudentManagement");

        sdc.setStudentManagement(address(studentManagement));
        console.log("StevensDuckCoin (SDC) linked to StudentManagement");

        srpc.setStudentManagement(address(studentManagement));
        console.log("StevensReputationProofCoin (SRPC) linked to StudentManagement");

        // Print summary
        console.log("\n=== Deployment Summary ===");
        console.log("StevensBananaCoin (SBC) Address:", address(sbc));
        console.log("StevensDuckCoin (SDC) Address:", address(sdc));
        console.log("StevensReputationProofCoin (SRPC) Address:", address(srpc));
        console.log("StudentManagement Address:", address(studentManagement));
        console.log("\nCopy these addresses to sbc-frontend/src/contracts/config.js");
        console.log("\nToken Roles:");
        console.log("- SBC: The Fuel (used for bidding on SRPC-rewarded tasks)");
        console.log("- SDC: Stevens Cash (redeemable anytime)");
        console.log("- SRPC: The Demand Engine (non-transferable, distributed by POCA)");

        vm.stopBroadcast();
    }
}
