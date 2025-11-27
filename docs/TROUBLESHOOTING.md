# Troubleshooting Guide

## Frontend Fails to Start in PM2

If you see the frontend showing as "errored" in PM2, check the following:

### 1. Check PM2 Logs
```bash
pm2 logs sbc-frontend
```

This will show you the actual error message.

### Common Issues:

#### Package Manager Detection
The script detects the package manager based on lock files in the frontend directory:
- `pnpm-lock.yaml` → uses pnpm
- `package-lock.json` → uses npm
- `yarn.lock` → uses yarn

If you have a `package.json` in your home directory with a "packageManager" field, it might interfere. The script now checks the frontend directory specifically.

#### Missing Dependencies
If dependencies aren't installed:
```bash
cd frontend
pnpm install  # or npm install / yarn install
```

#### Port Already in Use
If port 5173 is already in use:
```bash
# Find what's using the port
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill the process or change the port in ecosystem.config.js
```

#### Node Version
Make sure you have Node.js 18+ installed:
```bash
node --version
```

### 2. Manual Frontend Start
To test the frontend manually:
```bash
cd frontend
pnpm run dev  # or npm run dev / yarn dev
```

### 3. PM2 Restart
After fixing issues:
```bash
pm2 restart sbc-frontend
# or
pm2 delete sbc-frontend
./scripts/run-with-pm2.sh  # Run the script again
```

## Contract Deployment Issues

### Anvil Not Running
```bash
pm2 logs anvil
pm2 restart anvil
```

### Contract Addresses Not Extracted
Check the deployment file:
```bash
cat contracts/broadcast/DeployNewContracts.s.sol/31337/run-latest.json | jq '.transactions[] | {name: .contractName, address: .contractAddress}'
```

## Package Manager Issues

### Wrong Package Manager Detected
The script now checks the frontend directory specifically. If it's still wrong:

1. Check what lock files exist:
```bash
ls -la frontend/ | grep -E "(pnpm-lock|package-lock|yarn.lock)"
```

2. Install the correct package manager:
```bash
# For pnpm
npm install -g pnpm

# For yarn
npm install -g yarn
```

3. Install dependencies with the correct manager:
```bash
cd frontend
pnpm install  # or npm install / yarn install
```

## macOS Specific Issues

### Permission Issues
If you get permission errors:
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.pnpm
```

### Home Directory package.json Interference
If yarn is detected from your home directory:
- The script now checks the frontend directory specifically
- You can ignore the warning about yarn if pnpm-lock.yaml exists in frontend

## Quick Fixes

### Reset Everything
```bash
pm2 stop all
pm2 delete all
pkill anvil
cd frontend && rm -rf node_modules && pnpm install
cd ../contracts && forge clean && forge build
./scripts/run-with-pm2.sh
```

### Check All Services
```bash
pm2 status
pm2 logs
```

### View Specific Logs
```bash
pm2 logs anvil        # Blockchain
pm2 logs sbc-frontend # Frontend
```

