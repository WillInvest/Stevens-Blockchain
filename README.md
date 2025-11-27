# Stevens Blockchain - Onchain Performance Metric System (OPMS)

> Turning real work, character, and collaboration into on-chain reputation.

This project is an on-chain performance metric system for the Stevens community.  
Professors and students are whitelisted by their Stevens identity, and every task, bid, and reward becomes part of a transparent, tamper-resistant record of performance.

Grades fade. A resume can be embellished.  
But a history of **real work done, stakes taken, and reputation earned** on-chain is hard to fake.

---

## 🏗️ Project Structure

```
SBC-Project-Full/
├── contracts/          # Smart Contracts (Foundry)
├── frontend/          # Frontend dApp (React + Vite)
├── docs/              # Documentation
├── deployments/       # Deployment artifacts
├── scripts/           # Utility scripts
└── infrastructure/    # Infrastructure configs
```

See [docs/STRUCTURE.md](docs/STRUCTURE.md) for detailed structure documentation.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (for smart contracts)
- MetaMask or compatible wallet

### Smart Contracts

```bash
cd contracts
forge install
forge build
forge test
```

### Frontend

```bash
cd frontend/sbc-frontend
npm install
npm run dev
```

---

## 📚 Documentation

- **[Architecture](docs/architecture/)** - System architecture and design
- **[Guides](docs/guides/)** - Implementation and deployment guides
- **[Tokenomics](docs/tokenomics/)** - Token economics and distribution
- **[Structure](docs/STRUCTURE.md)** - Project organization

---

## 🪙 Token System

### Three-Token Architecture

1. **SRPC (Stevens Reputation Proof Coin)** - The Demand Engine
   - Non-transferable soulbound token
   - Distributed by Professor On-Chain Address (POCA)
   - Represents professor recognition

2. **SBC (Stevens Banana Coin)** - The Fuel & Governance
   - ERC20 fungible token
   - Used for bidding on SRPC-rewarded tasks
   - Governance token for ecosystem parameters
   - Time-locked redemption to SDC

3. **SDC (Stevens Duck Coin)** - Stevens Cash
   - ERC20 fungible token
   - Redeemable anytime (cash equivalent)
   - Entry/exit point for the ecosystem

See [docs/tokenomics/TOKENOMICS_REFINEMENT.md](docs/tokenomics/TOKENOMICS_REFINEMENT.md) for detailed tokenomics.

---

## 🏛️ Architecture

```
                   +===============================================+
                   ||   Onchain Performance Metric System (OPMS)  ||
                   ||   Stevens on-chain work & reputation layer  ||
                   +===============================================+
                                      |
                       Whitelisting, Roles, Stevens IDs
                            StudentManagement.sol
                                      |
                 +--------------------+--------------------+
                 |                                         |
          Professors (whitelisted)               Students (whitelisted)
                 |                                         |
                 |  Professor On-Chain Address (POCA)      |
                 +--------------------+--------------------+
                                      |
                                      v

    +-----------------------+   +------------------------+   +----------------------+
    | StevensReputationProof |   |     TaskManager.sol    |   | StevensBananaCoin    |
    |      Coin (SRPC)       |<->|  Core Work Marketplace |<->|      (SBC)           |
    |   (The Demand Engine)  |   |                        |   |    (The Fuel)        |
    |   ERC20 Soulbound      |   |  • SRPC-rewarded tasks |   |  ERC20 Fungible      |
    |   Non-transferable     |   |    (POCA only)         |   |  Deflationary        |
    +-----------+-----------+   |  • SBC-rewarded tasks  |   +-----------+----------+
                ^               |    (all whitelisted)   |               |
                |               |  • Students bid SBC    |               |
                |               |  • SBC burned on task |               |
                |               |    completion          |               |
                |               |  • Winners earn SRPC  |               |
                |               +------------------------+               |
                |                                                    SBC used to:
                |                                                    • bid on SRPC tasks
                |                                                    • trade / borrow
                |                                                    • repay loans
                |                                                        
                |                                                        
                |                                                        
                v                                                         v

    +-----------------------+                                   +----------------------+
    |    LendingPool.sol    |                                   |   Liquidity Layer    |
    |  • Stake SRPC as      |                                   |  • AMM.sol  (DEX)    |
    |    collateral         |<---------------------------------->|  • SHIFT.sol (CEX)   |
    |  • Borrow SBC to      |           SBC for bidding /      |  Swap SBC ↔ SDC     |
    |    bid on tasks       |           liquidity / repayment   +----------------------+
    +-----------------------+                                            |
                                                                          |
                                                                          v
                                                              +----------------------+
                                                              | StevensDuckCoin (SDC)|
                                                              |   (Stevens Cash)     |
                                                              |   ERC20 Fungible     |
                                                              |   Redeemable Anytime |
                                                              +----------------------+
```

---

## 🔧 Development

### Smart Contracts

```bash
cd contracts
forge build          # Compile contracts
forge test           # Run tests
forge script script/DeployNewContracts.s.sol  # Deploy
```

### Frontend

```bash
cd frontend/sbc-frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
```

---

## 📖 Core Features

### 1. Whitelisted Academic Community
- `StudentManagement.sol` binds **Stevens IDs** to on-chain addresses
- Only whitelisted users can hold, transfer, and interact with tokens

### 2. Task System
- **SRPC-rewarded tasks**: Created by POCA, students bid SBC
- **SBC-rewarded tasks**: Created by all whitelisted users

### 3. Governance
- SBC holders vote on ecosystem parameters:
  - Redemption lock period
  - Lending interest rates
  - Professor Token Distribution System parameters

### 4. Lending & Exchange
- Borrow SBC using SRPC as collateral
- Swap SBC ↔ SDC via AMM/CEX
- Redeem SDC to cash anytime

---

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity 0.8.24, Foundry
- **Frontend**: React, Vite, Ethers.js
- **Infrastructure**: Nginx, PM2

---

## Summary

The refined tokenomics model creates a sustainable economic ecosystem:

1. **SRPC (Demand Engine)**: Creates demand through scarcity and real-world value
2. **SBC (The Fuel & Governance)**: Powers the system through deflationary bidding mechanism and governance voting
3. **SDC (Stevens Cash)**: Provides liquidity and cash bridge

The system ensures:
- **Authenticity**: Non-transferable SRPC
- **Scarcity**: Controlled distribution and burning
- **Value**: Real-world opportunities for high-SRPC students
- **Liquidity**: SDC enables easy entry/exit
- **Governance**: SBC holders control ecosystem parameters
- **Commitment**: Time-locked redemption maintains engagement while providing exit path

**Key Innovation**: Time-locked redemption mechanism balances the need for commitment (deflationary model) with user flexibility (exit option), while governance ensures the system remains adaptable and community-controlled.

---

*This refinement maintains the core economic principles while adding governance capabilities and a balanced redemption mechanism that preserves the deflationary model.*

*Edited by Cursor, with reference in Cursor_Chats/Cursor_Chat_README.md*

---

