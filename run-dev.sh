
#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Starting SBC Frontend Dev Server ==="

# Navigate to the frontend directory
cd "$(dirname "$0")/sbc-frontend"

echo "Current directory:"
pwd
echo ""

echo "Installing dependencies if needed..."
pnpm install --silent || true

echo ""
echo "Running Vite Dev Server on 0.0.0.0:5173 ..."
echo ""

# Start Vite and expose to the network
pnpm run dev --host 0.0.0.0 --port 5173