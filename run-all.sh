#!/bin/bash

set -e

PROJECT_ROOT="/home/stevensbc/SBC-Project-Full"
FRONTEND_DIR="$PROJECT_ROOT/sbc-frontend"
CONFIG_JS="$FRONTEND_DIR/src/contracts/config.js"
RPC_URL="http://localhost:8545"

echo "=== Killing old Anvil instances ==="
pkill anvil || true
sleep 1

echo "=== Starting new silent Anvil on 0.0.0.0:8545 ==="
anvil --host 0.0.0.0 --port 8545 --chain-id 31337 >> /tmp/anvil.log 2>&1 &

sleep 3
echo "Anvil started."
head -72  /tmp/anvil.log

echo "=== Building Solidity Contracts ==="
cd "$PROJECT_ROOT"
forge build

echo "=== Deploying SBC to Anvil ==="
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast

echo "=== Getting latest deployed SBC address ==="
RUN_FILE="$PROJECT_ROOT/broadcast/Deploy.s.sol/31337/run-latest.json"
SBC_ADDRESS=$(jq -r '.transactions[0].contractAddress' $RUN_FILE)

if [ -z "$SBC_ADDRESS" ] || [ "$SBC_ADDRESS" = "null" ]; then
    echo "ERROR: Could not extract SBC address!"
    exit 1
fi

echo "SBC deployed to: $SBC_ADDRESS"

echo "=== Updating frontend config.js with new SBC address ==="
cat > "$CONFIG_JS" <<EOF
// IMPORTANT:
// Automatically updated after every forge deploy
export const SBC_ADDRESS = "$SBC_ADDRESS";
EOF

echo "=== Fetching Contract Owner ==="
OWNER=$(cast call $SBC_ADDRESS "owner()" --rpc-url $RPC_URL)
echo "Contract owner: $OWNER"
echo ""

echo "Updated $CONFIG_JS"
echo ""

echo "=== Starting SBC Frontend Dev Server ==="
cd "$FRONTEND_DIR"

echo "Installing dependencies (if needed)..."
pnpm install --silent || true

echo ""
echo "Starting Vite dev server on 0.0.0.0:5173 ..."
echo ""

pnpm run dev --host 0.0.0.0 --port 5173