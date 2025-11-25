# Stevens Blockchain: A Decentralized Academic Performance and Task Management System

## Abstract

Stevens Blockchain (SBC) is an innovative blockchain-based platform designed to gamify academic performance, facilitate peer-to-peer task management, and create a sustainable token economy within educational institutions. The system introduces **Proof of Reputation (PoR)** as an on-chain, non-transferable performance metric that students earn through completing tasks, and **Duck Coin (DC)** as a transferable fungible token that powers the task economy through a bidding mechanism. This whitepaper outlines the architecture, tokenomics, and economic model of the Stevens Blockchain ecosystem.

---

## 1. Introduction

### 1.1 Vision

Stevens Blockchain aims to create a transparent, decentralized ecosystem where academic performance is quantified on-chain, task completion is incentivized through a competitive bidding system, and students can leverage their reputation to create rewarded task publicly, i.e., research, tutoring, conference, survey, etc.

### 1.2 Core Principles

- **Transparency**: All performance metrics and transactions are recorded on-chain
- **Meritocracy**: Reputation is earned through demonstrated performance
- **Economic Sustainability**: Token supply is managed through burning mechanisms
- **Decentralization**: No single point of control over student records or token economics

---

## 2. System Architecture

### 2.1 Core Components

The Stevens Blockchain ecosystem consists of three primary smart contracts:

```
┌─────────────────────────────────────────────────────────────┐
│              StudentManagement.sol                           │
│              (Central Coordinator)                           │
│  - Student whitelist management                              │
│  - Token operation coordination                             │
│  - Role-based access control                                │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ DuckCoin.sol │  │ ProveOfReputation │
│ (ERC20)      │  │ .sol (ERC721)      │
│              │  │                   │
│ Transferable │  │ Non-transferable  │
│ Fungible     │  │ Performance Metric │
└──────────────┘  └──────────────────┘
```

### 2.2 Token Types

#### **Duck Coin (DC)** - ERC20 Fungible Token
- **Type**: Transferable, fungible token
- **Purpose**: Medium of exchange for task bidding and rewards
- **Supply Model**: Deflationary (burned after task completion)
- **Use Cases**:
  - Bidding on Proof of Reputation (PoR) tasks
  - Task rewards (for Duck Coin tasks)
  - Lending and borrowing
  - Exchange transactions

#### **Proof of Reputation (PoR)** - ERC721 Non-Fungible Token
- **Type**: Non-transferable, on-chain performance metric
- **Purpose**: Quantified academic reputation and credibility
- **Earning Mechanism**: Awarded upon task completion
- **Use Cases**:
  - Credit score indicator
  - Collateral for borrowing Duck Coin
  - Access control (professors have higher PoR)
  - Task creation eligibility (PoR tasks require professor status)

---

## 3. Token Economics

### 3.1 Duck Coin (DC) Economics

#### **Supply Dynamics**

Duck Coin follows a **deflationary model** where tokens are burned after task completion:

1. **Initial Distribution**: Admin mints Duck Coin to whitelisted students
2. **Task Bidding**: Students stake Duck Coin to bid on PoR tasks
3. **Task Completion**: Staked Duck Coin is **burned** (removed from supply)
4. **Result**: Decreasing supply creates scarcity and value

#### **Demand Generation**

Duck Coin demand is primarily driven by:

- **Task Bidding System**: Students compete by bidding Duck Coin on PoR-rewarded tasks
  - Higher bids = Higher chance of task assignment
  - Bidding creates immediate demand for Duck Coin
  - Live auction mechanism with 24-hour acceptance deadlines

- **Lending Market**: Students borrow Duck Coin using PoR as collateral
  - Borrowers need Duck Coin for bidding or other purposes
  - Creates sustained demand for the token

- **Task Rewards**: Some tasks pay rewards in Duck Coin
  - Incentivizes participation
  - Creates circular economy

#### **Economic Flow**

```
Student receives DC
    ↓
Student bids DC on PoR task
    ↓
Task assigned (DC staked)
    ↓
Task completed
    ↓
DC burned (supply decreases)
    ↓
PoR awarded to task taker
```

**Key Insight**: The burning mechanism ensures that Duck Coin maintains value through scarcity, while the bidding system creates continuous demand.

### 3.2 Proof of Reputation (PoR) Economics

#### **Earning Mechanism**

Proof of Reputation is earned exclusively through task completion:

1. **Task Creation**: Professors create tasks with PoR rewards
2. **Bidding Phase**: Students bid Duck Coin to compete for task assignment
3. **Task Assignment**: Highest bidder wins (Duck Coin staked)
4. **Task Completion**: 
   - PoR transferred to task taker
   - Staked Duck Coin burned
   - Creator's PoR locked during task (if PoR reward)

#### **Non-Transferability**

PoR is **non-transferable** by design:
- Prevents reputation trading
- Ensures reputation reflects actual performance
- Creates genuine value through earned achievement
- Can only be lost through slashing (dispute resolution)

#### **Value Proposition**

PoR serves multiple functions:

1. **Performance Metric**: On-chain record of academic achievements
2. **Credit Score**: Higher PoR = Higher credibility
3. **Collateral Asset**: Can be used to borrow Duck Coin
4. **Access Control**: Determines eligibility for certain actions (e.g., creating PoR tasks)

---

## 4. Core Features

### 4.1 Task Management System

#### **Task Types**

1. **Duck Coin Tasks**
   - Reward: Duck Coin
   - Can be created by: Professors, Students, Admins
   - Assignment: Direct assignment (no bidding)

2. **Proof of Reputation Tasks**
   - Reward: PoR
   - Can be created by: Professors only
   - Assignment: Live bidding system with Duck Coin

#### **Task Lifecycle**

```
CREATE → UNASSIGNED → (LIVE BIDDING) → ONGOING → COMPLETED
                              ↓
                          DISPUTED → (RESOLVED)
```

#### **Live Bidding Mechanism**

For PoR tasks, a competitive bidding system operates:

- **Bidding Process**:
  1. Students place bids using Duck Coin
  2. Each new bid must be higher than the current highest
  3. Previous bidder's Duck Coin is automatically refunded
  4. 24-hour acceptance deadline (resets on each new bid)
  5. Creator must accept within deadline

- **Economic Impact**:
  - Creates immediate demand for Duck Coin
  - Ensures fair competition
  - Rewards commitment (higher bids = more stake)

- **Completion**:
  - Staked Duck Coin is **burned** (deflationary)
  - PoR transferred to task taker
  - Reputation earned on-chain

### 4.2 Lending System

#### **Peer-to-Peer Lending**

Students can lend and borrow Duck Coin within the platform:

**Lenders**:
- Lend Duck Coin to earn interest
- No PoR staking required
- Earn APY based on utilization rate

**Borrowers**:
- Borrow Duck Coin using PoR as collateral
- Must stake PoR (typically 50% collateralization ratio)
- Pay interest based on dynamic rates

#### **Interest Rate Model**

Dynamic interest rates based on DeFi principles:

```
Utilization Rate = Total DC Borrowed / Total DC Supplied

Supply APY = Base Rate + (Utilization × Supply Slope)
Borrow APY = Base Rate + (Utilization × Borrow Slope) + Spread
```

**Key Features**:
- Self-balancing supply and demand
- Low utilization = Lower rates (incentivizes borrowing)
- High utilization = Higher rates (incentivizes lending)
- Transparent and predictable

#### **PoR as Collateral**

- PoR serves as the primary collateral asset
- Higher PoR = Higher borrowing capacity
- Creates utility for earned reputation
- Links academic performance to financial access

### 4.3 Exchange Platform

The platform includes exchange functionality with two mechanisms:

1. **AMM (Automated Market Maker)**: Decentralized exchange for token swaps
2. **SHIFT**: Alternative exchange mechanism (to be implemented)

---

## 5. Economic Model Analysis

### 5.1 Deflationary Pressure

**Duck Coin Burning Mechanism**:
- Every completed PoR task burns the staked Duck Coin
- Creates permanent supply reduction
- Scarcity increases over time
- Value preservation through deflation

**Mathematical Model**:
```
Initial Supply: S₀
Tasks Completed: T
Average Bid per Task: B
Burned Supply: S_burned = Σ(B_i for i=1 to T)
Remaining Supply: S_remaining = S₀ - S_burned
```

### 5.2 Demand Drivers

1. **Bidding Demand**: 
   - Number of active PoR tasks
   - Competition intensity
   - Task reward values

2. **Borrowing Demand**:
   - Students needing DC for bidding
   - Utilization rate of lending pool
   - Interest rate attractiveness

3. **Reward Demand**:
   - Duck Coin tasks offering DC rewards
   - Incentive to participate

### 5.3 Reputation Economy

**PoR Value Creation**:
- Earned through demonstrated performance
- Non-transferable ensures authenticity
- Used as collateral creates financial utility
- Higher PoR = Better access and terms

**Reputation Accumulation**:
```
PoR Balance = Σ(PoR_rewarded from completed tasks) - Σ(PoR_slashed from disputes)
```

---

## 6. Technical Implementation

### 6.1 Smart Contract Architecture

#### **StudentManagement.sol**
- Central coordinator contract
- Manages student whitelist
- Coordinates token operations
- Role-based access control (Professor/Student/Admin)

#### **DuckCoin.sol (ERC20)**
- Standard ERC20 implementation
- Minting: Admin-controlled
- Burning: Automatic on task completion
- Transfer: Whitelist-enforced

#### **ProveOfReputation.sol (ERC721)**
- Standard ERC721 implementation
- Non-transferable (enforced in contract)
- Minting: Task completion rewards
- Burning: Dispute resolution slashing

#### **TaskManager.sol** (Planned)
- Task creation and management
- Live bidding system
- Task assignment and completion
- Dispute handling
- PoR transfer coordination

#### **LendingPool.sol** (Planned)
- Peer-to-peer lending
- Dynamic interest rate calculation
- PoR collateral management
- Utilization tracking

### 6.2 Frontend Architecture

**Component Structure**:
```
App.jsx
├── Stevens Coin (Token Management)
├── Exchange
│   ├── AMM
│   └── SHIFT
├── Lending
│   ├── Supply (Lend)
│   ├── Borrow
│   └── Market
├── Task List
│   ├── Unassigned Tasks
│   ├── Ongoing Tasks
│   ├── My Tasks
│   └── Search Tasks
└── Student Info
```

---

## 7. Use Cases

### 7.1 Academic Performance Tracking

- **On-Chain Reputation**: PoR provides immutable record of achievements
- **Transparency**: All task completions visible on blockchain
- **Credibility**: Non-transferable nature ensures authenticity
- **Credit Score**: PoR balance serves as academic credit indicator

### 7.2 Task Marketplace

- **Task Creation**: Professors create PoR-rewarded tasks
- **Competitive Bidding**: Students compete with Duck Coin bids
- **Fair Assignment**: Highest bidder wins (with time constraints)
- **Completion Tracking**: All tasks tracked on-chain

### 7.3 Financial Services

- **Lending**: Earn interest on Duck Coin
- **Borrowing**: Use PoR as collateral to borrow Duck Coin
- **Exchange**: Swap tokens through AMM or SHIFT
- **Reputation-Based Access**: Higher PoR = Better financial terms

### 7.4 Gamification

- **Achievement System**: PoR accumulation as achievement metric
- **Competition**: Bidding creates competitive environment
- **Rewards**: Both DC and PoR rewards incentivize participation
- **Status**: Higher PoR = Higher status in ecosystem

---

## 8. Security & Governance

### 8.1 Access Control

- **Whitelist System**: Only registered students can participate
- **Role-Based Permissions**: Professors, Students, Admins have different capabilities
- **Owner Controls**: Admin functions restricted to contract owner

### 8.2 Dispute Resolution

- **Reporting Mechanism**: Task takers can report disputes
- **Admin Resolution**: Manual review and resolution
- **PoR Slashing**: Creator's PoR can be slashed if at fault
- **Refund Mechanisms**: Fair handling of disputed tasks

### 8.3 Economic Security

- **Collateral Requirements**: Borrowers must provide PoR collateral
- **Utilization Limits**: Maximum borrowing to prevent over-leverage
- **Interest Rate Caps**: Dynamic rates prevent extreme scenarios
- **Burning Verification**: All burns are on-chain and verifiable

---

## 9. Future Enhancements

### 9.1 Planned Features

1. **Task Categories**: Categorization system for better organization
2. **Task Ratings**: Review system for completed tasks
3. **Recurring Tasks**: Automated recurring task creation
4. **Multi-party Tasks**: Tasks requiring multiple participants
5. **Governance**: DAO-style governance for parameter changes
6. **Analytics Dashboard**: Comprehensive analytics for students and admins

### 9.2 Advanced Lending Features

1. **Liquidation Mechanism**: Automatic liquidation if collateral ratio drops
2. **Flash Loans**: Instant loans without collateral
3. **Multiple Pools**: Different risk-level lending pools
4. **Insurance**: Optional insurance for lenders

### 9.3 Exchange Enhancements

1. **AMM Implementation**: Full automated market maker
2. **SHIFT Mechanism**: Alternative exchange protocol
3. **Liquidity Pools**: Token liquidity provision
4. **Price Oracles**: External price feeds

---

## 10. Tokenomics Summary

### 10.1 Duck Coin (DC)

| Property | Value |
|----------|-------|
| Type | ERC20 Fungible Token |
| Transferability | Transferable |
| Supply Model | Deflationary (burned) |
| Primary Use | Task bidding, rewards, lending |
| Demand Driver | Bidding system, borrowing needs |
| Value Mechanism | Scarcity through burning |

### 10.2 Proof of Reputation (PoR)

| Property | Value |
|----------|-------|
| Type | ERC721 Non-Fungible Token |
| Transferability | Non-transferable |
| Earning | Task completion rewards |
| Primary Use | Performance metric, collateral |
| Value Mechanism | Earned achievement, utility as collateral |
| Loss Mechanism | Slashing (dispute resolution) |

---

## 11. Conclusion

Stevens Blockchain represents a novel approach to academic performance tracking and incentivization through blockchain technology. By combining:

- **Non-transferable reputation** (PoR) as an authentic performance metric
- **Deflationary token economics** (DC) through burning mechanisms
- **Competitive bidding** to create demand
- **Reputation-based financial services** to create utility

The system creates a sustainable, transparent, and engaging ecosystem that gamifies academic achievement while providing real economic value to participants.

The platform's architecture ensures:
- **Transparency**: All transactions and achievements on-chain
- **Authenticity**: Non-transferable reputation prevents gaming
- **Sustainability**: Deflationary model maintains token value
- **Utility**: Reputation has real financial and social value

---

## 12. Technical Specifications

### 12.1 Smart Contracts

- **Solidity Version**: ^0.8.24
- **Framework**: Foundry
- **Standards**: ERC20, ERC721 (OpenZeppelin)
- **Network**: Ethereum-compatible (testnet/mainnet)

### 12.2 Frontend

- **Framework**: React.js
- **Build Tool**: Vite
- **Web3 Library**: Ethers.js
- **Styling**: Inline styles with design system

### 12.3 Deployment

- **Local Development**: Anvil (Foundry)
- **Network**: Custom local network (Chain ID: 31337)
- **Wallet Integration**: MetaMask

---

## 13. References & Documentation

- **Contract Architecture**: See `CONTRACT_ARCHITECTURE.md`
- **Task List Implementation**: See `TASK_LIST_IMPLEMENTATION_PLAN.md`
- **Task List Architecture**: See `TASK_LIST_ARCHITECTURE_SUMMARY.md`
- **Lending Implementation**: See `LENDING_IMPLEMENTATION_PLAN.md`

---

## 14. License

MIT License - See LICENSE file for details

---

## 15. Contact & Support

**Stevens Institute of Technology**  
**Hanlon Financial Systems Lab**

For technical support, deployment guides, and setup instructions, refer to the project documentation.

---

*Last Updated: 2025*
