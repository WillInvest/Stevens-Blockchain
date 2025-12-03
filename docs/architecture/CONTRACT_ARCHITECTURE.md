# Contract Architecture

## Overview

The system is now split into **4 separate smart contracts** for better modularity and separation of concerns:

1. **StudentManagement.sol** - Main contract managing student information
2. **StevensBananaCoin.sol (SBC)** - ERC20 fungible token contract (The Fuel)
3. **StevensDuckCoin.sol (SDC)** - ERC20 fungible token contract (Stevens Cash)
4. **StevensReputationProofCoin.sol (SRPC)** - ERC20 soulbound token contract (The Demand Engine)

## Architecture Diagram

```
┌─────────────────────────────────────┐
│   StudentManagement.sol             │
│   (Main Contract)                   │
│   - Student CRUD operations         │
│   - Coordinates token operations     │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┬──────────────┐
       │                │               │
       ▼                ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ StevensBanana│  │ StevensDuck  │  │ StevensReputation│
│ Coin (SBC)   │  │ Coin (SDC)   │  │ ProofCoin (SRPC) │
│ (ERC20)      │  │ (ERC20)      │  │ (ERC20 SBT)      │
│              │  │              │  │                  │
│ - Mint       │  │ - Mint       │  │ - Mint           │
│ - Burn       │  │ - Burn       │  │ - Burn           │
│ - Transfer   │  │ - Transfer   │  │ - Non-transferable│
│              │  │ - Redeemable │  │                  │
│ The Fuel     │  │ Stevens Cash │  │ Demand Engine    │
└──────────────┘  └──────────────┘  └──────────────────┘
```

## Contract Details

### 1. StudentManagement.sol

**Purpose**: Central contract that manages all student information and coordinates with token contracts.

**Key Features**:
- Student add/update/delete operations
- Whitelist management
- Delegates mint/burn/transfer operations to token contracts
- Only owner can perform admin operations

**Main Functions**:
- `addStudent(address wallet, string name, uint256 studentId)` - Add or update a student
- `removeStudent(uint256 studentId)` - Remove a student
- `getStudentById(uint256 studentId)` - Get student info by ID
- `getAllStudents()` - Get all students
- `mintSBC(address to, uint256 amount)` - Mint Stevens Banana Coin (SBC) tokens
- `burnSBC(address from, uint256 amount)` - Burn Stevens Banana Coin (SBC) tokens
- `transferSBC(address from, address to, uint256 amount)` - Transfer Stevens Banana Coin (SBC)
- `mintSDC(address to, uint256 amount)` - Mint Stevens Duck Coin (SDC) tokens
- `burnSDC(address from, uint256 amount)` - Burn Stevens Duck Coin (SDC) tokens
- `transferSDC(address from, address to, uint256 amount)` - Transfer Stevens Duck Coin (SDC)
- `mintSRPC(address to, uint256 amount)` - Mint Stevens Reputation Proof Coin (SRPC) tokens
- `burnSRPC(address from, uint256 amount)` - Burn Stevens Reputation Proof Coin (SRPC) tokens

**Legacy Functions** (for backward compatibility):
- `mintDuckCoin()` → calls `mintSBC()`
- `burnDuckCoin()` → calls `burnSBC()`
- `transferDuckCoin()` → calls `transferSBC()`
- `mintSRPC()` / `mintNFT()` → calls `mintSRPC()`
- `burnSRPC()` / `burnNFT()` → calls `burnSRPC()`

### 2. StevensBananaCoin.sol (SBC)

**Purpose**: ERC20 fungible token contract for Stevens Banana Coin - The Fuel.

**Key Features**:
- Standard ERC20 implementation
- Only StudentManagement can mint/burn
- Whitelist checks enforced via StudentManagement
- Used for bidding on SRPC-rewarded tasks
- Burned after task completion (deflationary)

**Main Functions**:
- `mint(address to, uint256 amount)` - Mint tokens (only StudentManagement)
- `burn(address from, uint256 amount)` - Burn tokens (only StudentManagement)
- `setStudentManagement(address)` - Set the StudentManagement contract address

**Token Role**: The Fuel - Primary bidding currency for SRPC-rewarded tasks.

### 3. StevensDuckCoin.sol (SDC)

**Purpose**: ERC20 fungible token contract for Stevens Duck Coin - Stevens Cash.

**Key Features**:
- Standard ERC20 implementation
- Only StudentManagement or RedemptionContract can mint/burn
- Whitelist checks enforced via StudentManagement
- Redeemable anytime (cash equivalent)
- Used in exchanges (AMM/CEX)

**Main Functions**:
- `mint(address to, uint256 amount)` - Mint tokens (only StudentManagement or RedemptionContract)
- `burn(address from, uint256 amount)` - Burn tokens (only StudentManagement or RedemptionContract)
- `redeem(address user, uint256 amount)` - Redeem SDC for cash (only RedemptionContract)
- `setStudentManagement(address)` - Set the StudentManagement contract address
- `setRedemptionContract(address)` - Set the redemption contract address

**Token Role**: Stevens Cash - Redeemable cash equivalent, provides liquidity bridge.

### 4. StevensReputationProofCoin.sol (SRPC)

**Purpose**: ERC20 soulbound token contract for Stevens Reputation Proof Coin - The Demand Engine.

**Key Features**:
- ERC20 implementation with transfer prevention (soulbound)
- Only StudentManagement or TaskManager can mint/burn
- Non-transferable (soulbound token)
- Distributed by Professor On-Chain Address (POCA) through tasks
- Represents professor recognition ("thumbs up")

**Main Functions**:
- `mint(address to, uint256 amount)` - Mint tokens (only StudentManagement or TaskManager)
- `burn(address from, uint256 amount)` - Burn tokens (only StudentManagement or TaskManager)
- `setStudentManagement(address)` - Set the StudentManagement contract address
- `setTaskManager(address)` - Set the TaskManager contract address (for SRPC distribution)
- `transfer()` - Reverted (non-transferable)
- `transferFrom()` - Reverted (non-transferable)

**Token Role**: The Demand Engine - Creates demand for SBC through scarcity and real-world value.

## Deployment Order

1. **Deploy StevensBananaCoin.sol (SBC)**
   - Deploy with constructor: `StevensBananaCoin()`
   - Save the contract address

2. **Deploy StevensDuckCoin.sol (SDC)**
   - Deploy with constructor: `StevensDuckCoin()`
   - Save the contract address

3. **Deploy StevensReputationProofCoin.sol (SRPC)**
   - Deploy with constructor: `StevensReputationProofCoin()`
   - Save the contract address

4. **Deploy StudentManagement.sol**
   - Deploy with constructor: `StudentManagement(address sbc, address sdc, address srpc)`
   - Pass addresses of all three token contracts
   - Save the contract address

5. **Link the contracts**
   - Call `setStudentManagement(address)` on each token contract
   - Pass the StudentManagement contract address
   - For SRPC, also call `setTaskManager(address)` when TaskManager is deployed

## Token Economics

### Stevens Banana Coin (SBC) - The Fuel
- **Type**: ERC20 Fungible Token
- **Supply Model**: Deflationary (burned after task completion)
- **Primary Use**: Bidding on SRPC-rewarded tasks
- **Exchange**: Can be swapped for SDC via AMM/CEX

### Stevens Duck Coin (SDC) - Stevens Cash
- **Type**: ERC20 Fungible Token
- **Supply Model**: Stable (redeemable)
- **Primary Use**: Cash equivalent, liquidity bridge
- **Exchange**: Can be swapped for SBC via AMM/CEX
- **Redemption**: Can be redeemed for cash/fiat anytime

### Stevens Reputation Proof Coin (SRPC) - The Demand Engine
- **Type**: ERC20 Soulbound Token (Non-transferable)
- **Supply Model**: Controlled by POCA distribution
- **Primary Use**: Reputation metric, creates demand for SBC
- **Distribution**: Only by Professor On-Chain Address (POCA) through tasks
- **Value**: Real-world opportunities (connections, research, jobs)

## Notes

- All tokens require whitelisting via StudentManagement
- Only whitelisted users can hold, transfer, and interact with tokens
- SRPC is non-transferable (soulbound) to ensure authenticity
- SBC is burned after task completion to create deflationary pressure
- SDC is redeemable for cash/fiat to provide liquidity bridge
