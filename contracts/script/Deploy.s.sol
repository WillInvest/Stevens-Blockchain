pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { StevensBananaCoin } from "../src/tokens/StevensBananaCoin.sol";
import { console } from "forge-std/console.sol";

contract Deploy is Script {

    function run() external {
        // load your private key from environment variable
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        vm.startBroadcast(deployerPrivateKey);

        StevensBananaCoin token = new StevensBananaCoin();

        console.log("SBC deployed to:", address(token));

        vm.stopBroadcast();
    }
}
