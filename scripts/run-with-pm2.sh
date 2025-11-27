#!/bin/bash

# Run SBC application with PM2 process manager

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is the parent directory of scripts/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Detect frontend directory (could be frontend/ or frontend/sbc-frontend/)
if [ -d "$PROJECT_ROOT/frontend" ] && [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
    FRONTEND_DIR="$PROJECT_ROOT/frontend"
elif [ -d "$PROJECT_ROOT/frontend/sbc-frontend" ] && [ -f "$PROJECT_ROOT/frontend/sbc-frontend/package.json" ]; then
    FRONTEND_DIR="$PROJECT_ROOT/frontend/sbc-frontend"
else
    echo "WARNING: Frontend directory not found. Trying default location..."
    FRONTEND_DIR="$PROJECT_ROOT/frontend"
fi

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
# Ensure the directory exists
CONFIG_DIR="$(dirname "$CONFIG_JS")"
if [ ! -d "$CONFIG_DIR" ]; then
    echo "Creating directory: $CONFIG_DIR"
    mkdir -p "$CONFIG_DIR"
fi

if [ ! -f "$CONFIG_JS" ]; then
    echo "Creating config.js file: $CONFIG_JS"
fi

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

echo "✓ Updated $CONFIG_JS"

echo ""
echo "=== Installing frontend dependencies ==="
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "ERROR: Frontend directory not found at: $FRONTEND_DIR"
    echo "Please ensure the frontend is set up correctly."
    exit 1
fi

cd "$FRONTEND_DIR"
if [ -f "package.json" ]; then
    # Check for pnpm-lock.yaml first (preferred)
    if [ -f "pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
        echo "Using pnpm (pnpm-lock.yaml detected)..."
        pnpm install --silent || pnpm install
    # Check for package-lock.json (npm)
    elif [ -f "package-lock.json" ] && command -v npm &> /dev/null; then
        echo "Using npm (package-lock.json detected)..."
        npm install --silent || npm install
    # Check for yarn.lock (yarn)
    elif [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
        echo "Using yarn (yarn.lock detected)..."
        yarn install --silent || yarn install
    # Fallback: try pnpm, then npm
    elif command -v pnpm &> /dev/null; then
        echo "Using pnpm (fallback)..."
        pnpm install --silent || pnpm install
    elif command -v npm &> /dev/null; then
        echo "Using npm (fallback)..."
        npm install --silent || npm install
    else
        echo "WARNING: No package manager found. Please install pnpm, npm, or yarn."
        echo "  Install pnpm: npm install -g pnpm"
        echo "  Or use npm/yarn if available"
    fi
else
    echo "WARNING: package.json not found in $FRONTEND_DIR"
fi

echo ""
echo "=== Detecting package manager for frontend ==="
cd "$FRONTEND_DIR"
PACKAGE_MANAGER="pnpm"  # default
# Check for lock files in the frontend directory (not home directory)
if [ -f "$FRONTEND_DIR/pnpm-lock.yaml" ] && command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    echo "Detected pnpm (pnpm-lock.yaml found)"
elif [ -f "$FRONTEND_DIR/package-lock.json" ] && command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    echo "Detected npm (package-lock.json found)"
elif [ -f "$FRONTEND_DIR/yarn.lock" ] && command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    echo "Detected yarn (yarn.lock found)"
# Fallback: check what's available
elif command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    echo "Using pnpm (fallback - no lock file found)"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    echo "Using npm (fallback - no lock file found)"
elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    echo "Using yarn (fallback - no lock file found)"
else
    echo "WARNING: No package manager found. Frontend may not start correctly."
    echo "Please install pnpm, npm, or yarn."
fi
echo "Package manager: $PACKAGE_MANAGER"

echo ""
echo "=== Starting Frontend with PM2 ==="
cd "$PROJECT_ROOT"
export PROJECT_ROOT="$PROJECT_ROOT"
export FRONTEND_DIR="$FRONTEND_DIR"
export PACKAGE_MANAGER="$PACKAGE_MANAGER"
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
