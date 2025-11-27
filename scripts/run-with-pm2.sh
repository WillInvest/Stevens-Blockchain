#!/bin/bash

# Run SBC application with PM2 process manager

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is the parent directory of scripts/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend/sbc-frontend"
CONFIG_JS="$FRONTEND_DIR/src/contracts/config.js"
RPC_URL="http://localhost:8545"

echo "=== SBC Application Startup with PM2 ==="
echo "Project root: $PROJECT_ROOT"
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
cd "$PROJECT_ROOT/contracts"
forge build

echo ""
echo "=== Starting Anvil with PM2 ==="
cd "$PROJECT_ROOT"
export PROJECT_ROOT="$PROJECT_ROOT"
export FRONTEND_DIR="$FRONTEND_DIR"
pm2 start ecosystem.config.js --only anvil

# Wait for Anvil to be ready
echo "Waiting for Anvil to start..."
sleep 5

echo ""
echo "=== Deploying Contracts to Anvil ==="
echo "Deploying new contracts (StudentManagement, SBC, SDC, SRPC)..."
cd "$PROJECT_ROOT/contracts"
forge script script/DeployNewContracts.s.sol:DeployNewContracts --rpc-url $RPC_URL --broadcast

echo ""
echo "=== Getting latest deployed contract addresses ==="
RUN_FILE="$PROJECT_ROOT/contracts/broadcast/DeployNewContracts.s.sol/31337/run-latest.json"

# Extract addresses from deployment by contract name
SBC_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "StevensBananaCoin") | .contractAddress' $RUN_FILE 2>/dev/null | head -1)
SDC_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "StevensDuckCoin") | .contractAddress' $RUN_FILE 2>/dev/null | head -1)
SRPC_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "StevensReputationProofCoin") | .contractAddress' $RUN_FILE 2>/dev/null | head -1)
STUDENT_MANAGEMENT_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "StudentManagement") | .contractAddress' $RUN_FILE 2>/dev/null | head -1)

# Fallback: try to extract from transaction order if contractName doesn't work
# Order: SBC (0), SDC (1), SRPC (2), StudentManagement (3), then linking calls
if [ -z "$SBC_ADDRESS" ] || [ "$SBC_ADDRESS" = "null" ] || [ "$SBC_ADDRESS" = "" ]; then
    SBC_ADDRESS=$(jq -r '.transactions[0].contractAddress' $RUN_FILE 2>/dev/null)
fi
if [ -z "$SDC_ADDRESS" ] || [ "$SDC_ADDRESS" = "null" ] || [ "$SDC_ADDRESS" = "" ]; then
    SDC_ADDRESS=$(jq -r '.transactions[1].contractAddress' $RUN_FILE 2>/dev/null)
fi
if [ -z "$SRPC_ADDRESS" ] || [ "$SRPC_ADDRESS" = "null" ] || [ "$SRPC_ADDRESS" = "" ]; then
    SRPC_ADDRESS=$(jq -r '.transactions[2].contractAddress' $RUN_FILE 2>/dev/null)
fi
if [ -z "$STUDENT_MANAGEMENT_ADDRESS" ] || [ "$STUDENT_MANAGEMENT_ADDRESS" = "null" ] || [ "$STUDENT_MANAGEMENT_ADDRESS" = "" ]; then
    STUDENT_MANAGEMENT_ADDRESS=$(jq -r '.transactions[3].contractAddress' $RUN_FILE 2>/dev/null)
fi

# Legacy contract names for backward compatibility (if old deployment exists)
DUCK_COIN_ADDRESS="$SBC_ADDRESS"  # SBC replaced DuckCoin
PROVE_OF_REPUTATION_ADDRESS="$SRPC_ADDRESS"  # SRPC replaced ProveOfReputation

if [ -z "$SBC_ADDRESS" ] || [ "$SBC_ADDRESS" = "null" ]; then
    echo "WARNING: Could not extract contract addresses!"
    SBC_ADDRESS="0x0000000000000000000000000000000000000000"
    SDC_ADDRESS="0x0000000000000000000000000000000000000000"
    SRPC_ADDRESS="0x0000000000000000000000000000000000000000"
    STUDENT_MANAGEMENT_ADDRESS="0x0000000000000000000000000000000000000000"
fi

echo "StevensBananaCoin (SBC) deployed to: $SBC_ADDRESS"
echo "StevensDuckCoin (SDC) deployed to: $SDC_ADDRESS"
echo "StevensReputationProofCoin (SRPC) deployed to: $SRPC_ADDRESS"
echo "StudentManagement deployed to: $STUDENT_MANAGEMENT_ADDRESS"

echo ""
echo "=== Updating frontend config.js with new contract addresses ==="
cat > "$CONFIG_JS" <<EOF
// IMPORTANT:
// Automatically updated after every forge deploy
export const SBC_ADDRESS = "$SBC_ADDRESS";
export const SDC_ADDRESS = "$SDC_ADDRESS";
export const SRPC_ADDRESS = "$SRPC_ADDRESS";

// New contract addresses
export const STUDENT_MANAGEMENT_ADDRESS = "$STUDENT_MANAGEMENT_ADDRESS";

// Legacy names for backward compatibility
export const DUCK_COIN_ADDRESS = "$DUCK_COIN_ADDRESS";
export const PROVE_OF_REPUTATION_ADDRESS = "$PROVE_OF_REPUTATION_ADDRESS";
EOF

echo "Updated $CONFIG_JS"

echo ""
echo "=== Installing frontend dependencies ==="
cd "$FRONTEND_DIR"
if [ -f "package.json" ]; then
    if command -v pnpm &> /dev/null; then
        pnpm install --silent || true
    elif command -v npm &> /dev/null; then
        npm install --silent || true
    else
        echo "WARNING: Neither pnpm nor npm found. Please install dependencies manually."
    fi
else
    echo "WARNING: package.json not found in $FRONTEND_DIR"
fi

echo ""
echo "=== Starting Frontend with PM2 ==="
cd "$PROJECT_ROOT"
export PROJECT_ROOT="$PROJECT_ROOT"
export FRONTEND_DIR="$FRONTEND_DIR"
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
