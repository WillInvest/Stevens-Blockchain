// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { AMM } from "../src/applications/AMM.sol";
import { console } from "forge-std/console.sol";

contract DeployAMM is Script {

    function run() external {
        // Load your private key from environment variable or use default Anvil key
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));

        // Get token addresses from environment or use defaults (Anvil addresses)
        address sdcAddress = vm.envOr("SDC_ADDRESS", address(0xe7f1725e7734ce288f8367e1bb143e90bb3f0512));
        address sbcAddress = vm.envOr("SBC_ADDRESS", address(0x5fbdb2315678afecb367f032d93f642f64180aa3));

        require(sdcAddress != address(0), "SDC_ADDRESS not set");
        require(sbcAddress != address(0), "SBC_ADDRESS not set");
        require(sdcAddress < sbcAddress, "Token addresses must be ordered (SDC < SBC)");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy AMM contract
        console.log("Deploying AMM contract...");
        console.log("SDC Address:", sdcAddress);
        console.log("SBC Address:", sbcAddress);
        
        AMM amm = new AMM(sdcAddress, sbcAddress);
        console.log("AMM deployed to:", address(amm));

        // Print summary
        console.log("\n=== AMM Deployment Summary ===");
        console.log("AMM Contract Address:", address(amm));
        console.log("Token0 (SDC) Address:", sdcAddress);
        console.log("Token1 (SBC) Address:", sbcAddress);
        console.log("\nCopy the AMM address to frontend/src/contracts/config.js as AMM_ADDRESS");
        console.log("\nTo add initial liquidity:");
        console.log("1. Approve SDC and SBC tokens to the AMM contract");
        console.log("2. Call addLiquidity() with equal value amounts");

        vm.stopBroadcast();
    }
}

