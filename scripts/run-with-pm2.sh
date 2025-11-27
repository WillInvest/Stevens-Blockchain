#!/bin/bash

# Run SBC application with PM2 process manager

set -e

PROJECT_ROOT="/home/stevensbc/SBC-Project-Full"
FRONTEND_DIR="$PROJECT_ROOT/sbc-frontend"
CONFIG_JS="$FRONTEND_DIR/src/contracts/config.js"
RPC_URL="http://localhost:8545"

echo "=== SBC Application Startup with PM2 ==="
echo ""

# Check if pm2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2..."
    npm install -g pm2
    echo "PM2 installed successfully!"
fi

# Stop existing PM2 processes
echo "Stopping existing PM2 processes..."
pm2 stop all || true
pm2 delete all || true

# Kill any existing anvil instances
echo "Killing old Anvil instances..."
pkill anvil || true
sleep 1

# Build and deploy contracts
echo ""
echo "=== Building Solidity Contracts ==="
cd "$PROJECT_ROOT"
forge build

echo ""
echo "=== Starting Anvil with PM2 ==="
pm2 start ecosystem.config.js --only anvil

# Wait for Anvil to be ready
echo "Waiting for Anvil to start..."
sleep 5

echo ""
echo "=== Deploying Contracts to Anvil ==="
echo "Deploying new contracts (StudentManagement, DuckCoin, ProveOfReputation)..."
forge script script/DeployNewContracts.s.sol:DeployNewContracts --rpc-url $RPC_URL --broadcast

echo ""
echo "=== Getting latest deployed contract addresses ==="
RUN_FILE="$PROJECT_ROOT/broadcast/DeployNewContracts.s.sol/31337/run-latest.json"

# Extract addresses from deployment by contract name
DUCK_COIN_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "DuckCoin") | .contractAddress' $RUN_FILE 2>/dev/null | head -1)
PROVE_OF_REPUTATION_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "ProveOfReputation") | .contractAddress' $RUN_FILE 2>/dev/null | head -1)
STUDENT_MANAGEMENT_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "StudentManagement") | .contractAddress' $RUN_FILE 2>/dev/null | head -1)

# Fallback: try to extract from transaction order if contractName doesn't work
# Order: DuckCoin (0), ProveOfReputation (1), StudentManagement (2), then linking calls
if [ -z "$DUCK_COIN_ADDRESS" ] || [ "$DUCK_COIN_ADDRESS" = "null" ] || [ "$DUCK_COIN_ADDRESS" = "" ]; then
    DUCK_COIN_ADDRESS=$(jq -r '.transactions[0].contractAddress' $RUN_FILE 2>/dev/null)
fi
if [ -z "$PROVE_OF_REPUTATION_ADDRESS" ] || [ "$PROVE_OF_REPUTATION_ADDRESS" = "null" ] || [ "$PROVE_OF_REPUTATION_ADDRESS" = "" ]; then
    PROVE_OF_REPUTATION_ADDRESS=$(jq -r '.transactions[1].contractAddress' $RUN_FILE 2>/dev/null)
fi
if [ -z "$STUDENT_MANAGEMENT_ADDRESS" ] || [ "$STUDENT_MANAGEMENT_ADDRESS" = "null" ] || [ "$STUDENT_MANAGEMENT_ADDRESS" = "" ]; then
    STUDENT_MANAGEMENT_ADDRESS=$(jq -r '.transactions[2].contractAddress' $RUN_FILE 2>/dev/null)
fi

# Also deploy old SBC contract for backward compatibility
echo ""
echo "=== Deploying old SBC contract for backward compatibility ==="
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast
OLD_RUN_FILE="$PROJECT_ROOT/broadcast/Deploy.s.sol/31337/run-latest.json"
SBC_ADDRESS=$(jq -r '.transactions[0].contractAddress' $OLD_RUN_FILE)

if [ -z "$SBC_ADDRESS" ] || [ "$SBC_ADDRESS" = "null" ]; then
    echo "WARNING: Could not extract old SBC address!"
    SBC_ADDRESS="0x0000000000000000000000000000000000000000"
fi

echo "DuckCoin deployed to: $DUCK_COIN_ADDRESS"
echo "ProveOfReputation deployed to: $PROVE_OF_REPUTATION_ADDRESS"
echo "StudentManagement deployed to: $STUDENT_MANAGEMENT_ADDRESS"
echo "Old SBC deployed to: $SBC_ADDRESS"

echo ""
echo "=== Updating frontend config.js with new contract addresses ==="
cat > "$CONFIG_JS" <<EOF
// IMPORTANT:
// Automatically updated after every forge deploy
export const SBC_ADDRESS = "$SBC_ADDRESS";

// New contract addresses
export const STUDENT_MANAGEMENT_ADDRESS = "$STUDENT_MANAGEMENT_ADDRESS";
export const DUCK_COIN_ADDRESS = "$DUCK_COIN_ADDRESS";
export const PROVE_OF_REPUTATION_ADDRESS = "$PROVE_OF_REPUTATION_ADDRESS";
EOF

echo "Updated $CONFIG_JS"

echo ""
echo "=== Fetching Contract Owner ==="
OWNER=$(cast call $SBC_ADDRESS "owner()" --rpc-url $RPC_URL)
echo "Contract owner: $OWNER"

echo ""
echo "=== Installing frontend dependencies ==="
cd "$FRONTEND_DIR"
pnpm install --silent || true

echo ""
echo "=== Starting Frontend with PM2 ==="
cd "$PROJECT_ROOT"
pm2 start ecosystem.config.js --only sbc-frontend

echo ""
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Your applications are now running with PM2:"
echo "  - Anvil: http://localhost:8545"
echo "  - Frontend: http://localhost:5173"
echo "  - Public access: http://10.246.103.99 (via nginx)"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status              - View running processes"
echo "  pm2 logs                - View all logs"
echo "  pm2 logs anvil          - View Anvil logs"
echo "  pm2 logs sbc-frontend   - View frontend logs"
echo "  pm2 restart all         - Restart all processes"
echo "  pm2 stop all            - Stop all processes"
echo "  pm2 save                - Save current process list"
echo "  pm2 startup             - Setup PM2 to start on boot"
echo ""
echo "To save PM2 configuration for auto-start on reboot:"
echo "  pm2 save"
echo "  pm2 startup"

