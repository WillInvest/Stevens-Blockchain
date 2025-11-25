# Contract Architecture

## Overview

The system is now split into **3 separate smart contracts** for better modularity and separation of concerns:

1. **StudentManagement.sol** - Main contract managing student information
2. **DuckCoin.sol** - ERC20 fungible token contract
3. **ProveOfReputation.sol** - ERC721 non-fungible token (NFT) contract

## Architecture Diagram

```
┌─────────────────────────────────────┐
│   StudentManagement.sol             │
│   (Main Contract)                   │
│   - Student CRUD operations         │
│   - Coordinates token operations     │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ DuckCoin.sol │  │ ProveOfReputation │
│ (ERC20)      │  │ .sol (ERC721)      │
│              │  │                   │
│ - Mint       │  │ - Mint NFT        │
│ - Burn       │  │ - Burn NFT        │
│ - Transfer   │  │                   │
└──────────────┘  └──────────────────┘
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
- `mintDuckCoin(address to, uint256 amount)` - Mint Duck Coin tokens
- `burnDuckCoin(address from, uint256 amount)` - Burn Duck Coin tokens
- `transferDuckCoin(address from, address to, uint256 amount)` - Transfer Duck Coin
- `mintNFT(address to, uint256 tokenId)` - Mint Prove of Reputation NFT
- `burnNFT(address from, uint256 tokenId)` - Burn Prove of Reputation NFT

### 2. DuckCoin.sol

**Purpose**: ERC20 fungible token contract for Duck Coin.

**Key Features**:
- Standard ERC20 implementation
- Only StudentManagement can mint/burn
- Whitelist checks enforced via StudentManagement

**Main Functions**:
- `mint(address to, uint256 amount)` - Mint tokens (only StudentManagement)
- `burn(address from, uint256 amount)` - Burn tokens (only StudentManagement)
- `setStudentManagement(address)` - Set the StudentManagement contract address

### 3. ProveOfReputation.sol

**Purpose**: ERC721 non-fungible token contract for Proof of Reputation.

**Key Features**:
- Standard ERC721 implementation
- Only StudentManagement can mint/burn
- Auto-incrementing token IDs (if tokenId = 0)
- Manual token ID assignment (if tokenId > 0)

**Main Functions**:
- `mint(address to, uint256 tokenId)` - Mint NFT (only StudentManagement)
  - If tokenId = 0, uses auto-increment
  - If tokenId > 0, uses specified ID
- `burn(uint256 tokenId)` - Burn NFT (only StudentManagement)
- `setStudentManagement(address)` - Set the StudentManagement contract address
- `getTokenCounter()` - Get current token counter
- `totalSupply()` - Get total number of NFTs minted

## Deployment Order

1. **Deploy DuckCoin.sol**
   - Deploy with constructor: `DuckCoin()`
   - Save the contract address

2. **Deploy ProveOfReputation.sol**
   - Deploy with constructor: `ProveOfReputation()`
   - Save the contract address

3. **Deploy StudentManagement.sol**
   - Deploy with constructor: `StudentManagement(duckCoinAddress, nftAddress)`
   - Pass the addresses from steps 1 and 2
   - Save the contract address

4. **Link the contracts**
   - Call `duckCoin.setStudentManagement(studentManagementAddress)` (as owner)
   - Call `proveOfReputation.setStudentManagement(studentManagementAddress)` (as owner)

## Migration from Old Contract

The old `SBC.sol` contract combined everything into one contract. The new architecture separates concerns:

**Old Structure:**
- Single contract (SBC.sol) with student management + ERC20 token

**New Structure:**
- StudentManagement.sol (student info + coordination)
- DuckCoin.sol (ERC20 token)
- ProveOfReputation.sol (ERC721 NFT)

## Frontend Updates Needed

After deploying the new contracts, update the frontend:

1. **Update contract addresses** in `sbc-frontend/src/contracts/config.js`:
   ```javascript
   export const STUDENT_MANAGEMENT_ADDRESS = "0x...";
   export const DUCK_COIN_ADDRESS = "0x...";
   export const PROVE_OF_REPUTATION_ADDRESS = "0x...";
   ```

2. **Update useContract hook** to load all three contracts

3. **Update components** to use the appropriate contract:
   - StudentInfo: Use StudentManagement for student operations, DuckCoin for balance, ProveOfReputation for NFT count
   - DuckCoin component: Use StudentManagement contract (which calls DuckCoin)
   - ProveOfReputation component: Use StudentManagement contract (which calls ProveOfReputation)

## Benefits of This Architecture

1. **Separation of Concerns**: Each contract has a single responsibility
2. **Upgradeability**: Can upgrade token contracts independently
3. **Gas Efficiency**: Smaller contracts are cheaper to deploy
4. **Modularity**: Easier to test and maintain
5. **Flexibility**: Can add more token types in the future

