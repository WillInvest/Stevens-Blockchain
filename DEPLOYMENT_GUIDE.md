# Deployment Guide for New Contracts

## Step 1: Deploy the Contracts

Run the deployment script:

```bash
cd /home/stevensbc/SBC-Project-Full
forge script script/DeployNewContracts.s.sol:DeployNewContracts --rpc-url http://localhost:8545 --broadcast
```

Or for a specific network:

```bash
forge script script/DeployNewContracts.s.sol:DeployNewContracts --rpc-url <YOUR_RPC_URL> --broadcast --private-key <YOUR_PRIVATE_KEY>
```

## Step 2: Get the Contract Addresses

After deployment, the script will output the addresses. Copy them:

```
DuckCoin Address: 0x...
ProveOfReputation Address: 0x...
StudentManagement Address: 0x...
```

## Step 3: Update Frontend Config

Edit `sbc-frontend/src/contracts/config.js` and update the addresses:

```javascript
export const STUDENT_MANAGEMENT_ADDRESS = "0x..."; // Copy from deployment output
export const DUCK_COIN_ADDRESS = "0x..."; // Copy from deployment output
export const PROVE_OF_REPUTATION_ADDRESS = "0x..."; // Copy from deployment output
```

## Step 4: Restart Frontend

Restart your frontend to load the new contracts:

```bash
cd sbc-frontend
npm run dev
```

## Verification

1. Connect your wallet
2. Go to "Stevens Coin" tab
3. Check that Duck Coin and Prove of Reputation show different contract addresses
4. Go to "Student Info" → "Show All"
5. Verify that balances are displayed correctly:
   - Duck Coin Balance should show from DuckCoin contract
   - Prove of Reputation should show NFT count from ProveOfReputation contract

## Troubleshooting

### If contracts show "Not deployed"
- Make sure you've updated the addresses in `config.js`
- Restart the frontend
- Check browser console for errors

### If balances show 0
- Make sure the contracts are linked (StudentManagement should be set in both token contracts)
- Check that you're using the correct contract addresses
- Verify the contracts are deployed on the same network as your wallet

### If mint/burn/transfer fails
- Make sure you're the owner of StudentManagement contract
- Check that students are whitelisted before minting
- Verify the contract addresses are correct

