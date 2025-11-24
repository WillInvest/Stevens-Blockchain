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
echo "=== Deploying SBC to Anvil ==="
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast

echo ""
echo "=== Getting latest deployed SBC address ==="
RUN_FILE="$PROJECT_ROOT/broadcast/Deploy.s.sol/31337/run-latest.json"
SBC_ADDRESS=$(jq -r '.transactions[0].contractAddress' $RUN_FILE)

if [ -z "$SBC_ADDRESS" ] || [ "$SBC_ADDRESS" = "null" ]; then
    echo "ERROR: Could not extract SBC address!"
    exit 1
fi

echo "SBC deployed to: $SBC_ADDRESS"

echo ""
echo "=== Updating frontend config.js with new SBC address ==="
cat > "$CONFIG_JS" <<EOF
// IMPORTANT:
// Automatically updated after every forge deploy
export const SBC_ADDRESS = "$SBC_ADDRESS";
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

