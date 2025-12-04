# AMM (Automated Market Maker) Implementation

## Overview

This document describes the Uniswap V2-style AMM implementation for exchanging SDC (Stevens Duck Coin) and SBC (Stevens Banana Coin) tokens.

## Architecture

### Smart Contract

**File**: `contracts/src/applications/AMM.sol`

The AMM contract implements a constant product formula (x * y = k) similar to Uniswap V2:

- **Liquidity Pools**: Users can add/remove liquidity by providing both SDC and SBC tokens
- **Swaps**: Users can swap SDC ↔ SBC tokens with a 0.3% fee
- **LP Tokens**: Liquidity providers receive LP (Liquidity Provider) tokens representing their share of the pool
- **Reserves**: Tracks SDC and SBC reserves in the pool

### Key Features

1. **Swap Functionality**
   - Swap SDC for SBC or vice versa
   - Automatic price calculation based on constant product formula
   - 0.3% trading fee

2. **Liquidity Management**
   - Add liquidity: Provide both tokens to earn LP tokens
   - Remove liquidity: Burn LP tokens to get back both tokens
   - First liquidity provider locks minimum liquidity permanently

3. **Price Discovery**
   - Price determined by ratio of reserves
   - Slippage protection via minimum amount parameters

## Deployment

### Step 1: Deploy the AMM Contract

```bash
cd contracts
forge script script/DeployAMM.s.sol:DeployAMM --rpc-url http://localhost:8545 --broadcast
```

Or set environment variables for custom addresses:

```bash
export SDC_ADDRESS=0x...
export SBC_ADDRESS=0x...
forge script script/DeployAMM.s.sol:DeployAMM --rpc-url http://localhost:8545 --broadcast
```

### Step 2: Update Frontend Config

After deployment, copy the AMM contract address to:

`frontend/src/contracts/config.js`

```javascript
export const AMM_ADDRESS = "0x..."; // Your deployed AMM address
```

### Step 3: Add Initial Liquidity

Before users can swap, someone needs to add initial liquidity:

1. Approve both SDC and SBC tokens to the AMM contract
2. Call `addLiquidity()` with equal value amounts of both tokens
3. Receive LP tokens representing your share

## Usage

### Frontend Interface

The AMM is accessible through the **Exchange** tab in the frontend:

1. **Swap Tab**: Exchange SDC ↔ SBC
   - Select swap direction (SDC → SBC or SBC → SDC)
   - Enter amount to swap
   - View estimated output amount
   - Execute swap

2. **Add Liquidity Tab**: Provide liquidity to the pool
   - Enter SDC amount (SBC amount calculated automatically based on pool ratio)
   - Or enter both amounts manually
   - Receive LP tokens

3. **Remove Liquidity Tab**: Withdraw your liquidity
   - Enter LP token amount to burn
   - Receive SDC and SBC back proportional to your share

### Pool Information

The interface displays:
- Current SDC and SBC reserves
- Your LP token balance
- Total LP token supply
- Your SDC and SBC balances

## Smart Contract Functions

### Swap

```solidity
function swap(
    uint256 amount0Out,  // Amount of token0 (SDC) to output (0 if swapping the other way)
    uint256 amount1Out,  // Amount of token1 (SBC) to output (0 if swapping the other way)
    address to,          // Recipient address
    bytes calldata data  // Unused (for compatibility)
)
```

### Add Liquidity

```solidity
function addLiquidity(
    uint256 amount0Desired,  // Desired amount of token0 (SDC)
    uint256 amount1Desired,  // Desired amount of token1 (SBC)
    uint256 amount0Min,      // Minimum amount of token0 (slippage protection)
    uint256 amount1Min,      // Minimum amount of token1 (slippage protection)
    address to               // Address to receive LP tokens
) returns (uint256 liquidity)
```

### Remove Liquidity

```solidity
function removeLiquidity(
    uint256 liquidity,   // Amount of LP tokens to burn
    uint256 amount0Min,   // Minimum amount of token0 (slippage protection)
    uint256 amount1Min,   // Minimum amount of token1 (slippage protection)
    address to            // Address to receive tokens
) returns (uint256 amount0, uint256 amount1)
```

### View Functions

```solidity
function getReserves() returns (uint256 reserve0, uint256 reserve1)
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) returns (uint256)
function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) returns (uint256)
```

## Security Features

1. **Slippage Protection**: Minimum amount parameters prevent unfavorable trades
2. **Constant Product Formula**: Ensures pool always maintains liquidity
3. **Minimum Liquidity Lock**: First liquidity provider locks minimum liquidity permanently
4. **Safe Transfers**: Uses OpenZeppelin SafeERC20 for token transfers
5. **Access Control**: Only owner can set token addresses (in constructor)

## Fees

- **Trading Fee**: 0.3% on all swaps (997/1000 of input amount)
- **LP Token Fees**: Fees accumulate in the pool, increasing the value of LP tokens

## Token Ordering

The contract ensures `token0 < token1` (SDC < SBC) for consistency. This is enforced in the constructor.

## Events

- `Swap`: Emitted on every swap
- `Mint`: Emitted when liquidity is added
- `Burn`: Emitted when liquidity is removed
- `Sync`: Emitted when reserves are updated

## Testing

To test the AMM contract:

```bash
cd contracts
forge test --match-contract AMM
```

## Integration with Existing System

- **SDC Token**: Stevens Duck Coin (cash equivalent)
- **SBC Token**: Stevens Banana Coin (governance and fuel token)
- **Exchange Tab**: Integrated into the main Exchange component
- **Wallet Connection**: Requires MetaMask or compatible wallet

## Next Steps

Potential enhancements:
- Router contract for multi-hop swaps
- Flash loans
- Fee distribution to LP providers
- Governance integration for fee parameters

