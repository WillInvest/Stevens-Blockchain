# Scripts Directory

This directory contains utility scripts for setting up and running the SBC project.

## Available Scripts

### `run-with-pm2.sh`

Starts the entire SBC application stack using PM2 process manager.

**Usage:**
```bash
./scripts/run-with-pm2.sh
```

**What it does:**
1. Checks and installs PM2 if needed
2. Stops any existing PM2 processes
3. Builds Solidity contracts
4. Starts Anvil (local blockchain) with PM2
5. Deploys contracts to Anvil
6. Updates frontend config with deployed addresses
7. Installs frontend dependencies
8. Starts frontend with PM2

**Requirements:**
- Foundry (for contract deployment)
- Node.js and npm (for PM2)
- pnpm or npm (for frontend dependencies)
- jq (for parsing JSON deployment files)

**Note:** This script automatically detects the project root, so it works regardless of where you clone the repository.

---

### `setup-nginx.sh`

Sets up nginx to proxy port 80 to the frontend on port 5173.

**Usage:**
```bash
sudo ./scripts/setup-nginx.sh
```

**What it does:**
1. Checks for root privileges
2. Installs nginx if not present
3. Copies nginx configuration from `infrastructure/nginx/`
4. Enables the nginx site
5. Tests and reloads nginx

**Requirements:**
- sudo/root privileges
- nginx configuration file at `infrastructure/nginx/sbc-frontend.conf`

**Note:** This script automatically detects the project root, so it works regardless of where you clone the repository.

---

## How It Works

All scripts use relative path detection to work on any machine:

```bash
# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is the parent directory of scripts/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
```

This ensures that:
- ✅ Scripts work regardless of where the repo is cloned
- ✅ No hardcoded paths
- ✅ Works on any user's machine
- ✅ Works on any operating system (Linux, macOS, WSL)

---

## Troubleshooting

### Script fails with "No such file or directory"
- Make sure you're running the script from the project root
- Or use: `./scripts/run-with-pm2.sh` from the project root

### PM2 not found
- The script will attempt to install PM2 globally
- Or install manually: `npm install -g pm2`

### Frontend dependencies fail
- Make sure pnpm or npm is installed
- Try installing manually: `cd frontend/sbc-frontend && pnpm install`

### Contract deployment fails
- Make sure Anvil is running: `pm2 logs anvil`
- Check RPC URL: Should be `http://localhost:8545`
- Verify Foundry is installed: `forge --version`

