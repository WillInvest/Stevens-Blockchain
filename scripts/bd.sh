#!/bin/bash

# Build and Deploy Stevens Banana Coin to local Anvil instance

forge build
forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --broadcast