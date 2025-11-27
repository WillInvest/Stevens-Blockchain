# Stevens Blockchain Tokenomics Refinement Report

## Executive Summary

This document outlines the refined tokenomics model for the Stevens Blockchain ecosystem, introducing three distinct tokens with clear economic roles and distribution mechanisms.

---

## Token Architecture

### Three-Token System

```
┌─────────────────────────────────────────────────────────────┐
│              Stevens Reputation Proof Coin (SRPC)           │
│                    (Demand Engine)                          │
│  • ERC721 Soulbound Token (Non-transferable)                │
│  • Distributed only by Professor On-Chain Address (POCA)    │
│  • Represents professor "thumbs up" / recognition           │
│  • Scarcity through controlled distribution                 │
│  • Real-world value: connections, opportunities             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Earned through
                            │ SRPC-rewarded tasks
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Stevens Banana Coin (SBC)                      │
│                      (The Fuel & Governance)                │
│  • White-listed ERC20 Fungible Token (Transferable)         │
│  • Used for bidding on SRPC-rewarded tasks                  │
│  • Burned after task completion (deflationary)              │
│  • Time-locked redemption to SDC (30-90 days)               │
│  • Governance token (voting on system parameters)           │
│  • Economic engine of the task marketplace                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Can be purchased by SDC
                            │ Can be redeemed to SDC (with time lock)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Stevens Duck Coin (SDC)                        │
│                    (Stevens Cash)                           │
│  • ERC20 Fungible Token (Transferable)                      │
│  • Redeemable anytime (cash equivalent)                     │
│  • Stable value representation                              │
│  • Used to purchase SBC through exchange                    │
│  • Entry/exit point for the ecosystem                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Token Roles & Economics

### 1. Stevens Reputation Proof Coin (SRPC) - The Demand Engine

**Type**: ERC721 Soulbound Token (Non-transferable)

**Purpose**: 
- On-chain representation of professor recognition
- Quantified "thumbs up" from professors
- Performance metric and credibility indicator

**Distribution**:
- **Only** distributed by Professor On-Chain Address (POCA)
- Through SRPC-rewarded tasks in TaskManager
- Scarcity maintained through controlled professor distribution system

**Key Characteristics**:
- **Non-transferable**: Ensures authenticity and earned reputation
- **Scarce**: Limited by professor distribution capacity
- **Valuable**: Higher SRPC = More opportunities (connections, research, jobs)
- **Demand Driver**: Creates demand for SBC (needed to bid on SRPC tasks)

**Real-World Value**:
- Professors provide resources to high-SRPC students:
  - Research opportunities
  - Industry connections
  - Recommendation letters
  - Internship referrals
  - Job market signaling

**Economic Function**: Creates demand for SBC (the fuel)

---

### 2. Stevens Banana Coin (SBC) - The Fuel & Governance

**Type**: ERC20 Fungible Token (Transferable)

**Purpose**:
- Primary bidding currency for SRPC-rewarded tasks
- Deflationary token burned after task completion
- Governance token for ecosystem parameter voting
- Economic engine of the task marketplace

**Supply Model**: Deflationary
- Initial distribution via StudentManagement
- **Burned** when tasks are completed (staked SBC is destroyed)
- Creates scarcity and maintains value
- Time-locked redemption to SDC (prevents immediate exit, maintains commitment)

**Use Cases**:
1. **Task Bidding** (Primary Use)
   - Bidding on SRPC-rewarded tasks
   - Rewards for SBC-rewarded tasks

2. **Governance** (Voting Rights)
   - Vote on redemption lock period (30-90 days)
   - Vote on lending interest rates
   - Vote on Professor Token Distribution System parameters:
     - SRPC distribution limits per POCA
     - Task creation limits
     - Reward allocation rules
     - Scarcity mechanisms

3. **Lending and Borrowing**
   - Collateral for borrowing
   - Supply liquidity to lending pools

4. **Exchange Trading**
   - Trade SBC ↔ SDC on AMM/CEX
   - Market-making and liquidity provision

5. **Time-Locked Redemption**
   - Redeem SBC to SDC after lock period (30-90 days, governance-controlled)
   - Provides exit mechanism while maintaining commitment during task periods

**Economic Function**: 
- **Fuel** for the SRPC demand engine
- **Governance** token for ecosystem parameter control
- Students need SBC to compete for SRPC
- Burning mechanism creates deflationary pressure
- Time-locked redemption balances commitment with exit flexibility

**Redemption Mechanism**:
- **Time Lock**: 30-90 days (governance-controlled)
- **Purpose**: Prevents immediate exit after bidding, maintains commitment during task periods
- **Process**: 
  1. User initiates redemption request
  2. SBC is locked for the governance-determined period
  3. After lock period, SBC can be redeemed to SDC at a 1:1 ratio (or slight discount, governance-controlled)
- **Benefits**:
  - Maintains deflationary pressure (SBC still primarily consumed/burned)
  - Provides eventual exit path for unused SBC
  - Prevents speculation and quick trading
  - Balances commitment with flexibility

**Governance Parameters** (Voted on by SBC holders):
1. **Redemption Lock Period**: 30-90 days (adjustable)
2. **Lending Interest Rates**: Supply APY, Borrow APY
3. **Professor Token Distribution System**:
   - Maximum SRPC per POCA per period
   - Task creation limits per POCA
   - Reward allocation formulas
   - Scarcity adjustment mechanisms

**Demand Sources**:
1. **Task Bidding**: Primary demand driver
2. **Governance**: Voting rights and ecosystem control
3. **Lending Market**: Borrowing needs and collateral
4. **Exchange Trading**: SBC ↔ SDC swaps
5. **Redemption Option**: Time-locked exit mechanism increases confidence

---

### 3. Stevens Duck Coin (SDC) - Stevens Cash

**Type**: ERC20 Fungible Token (Transferable, Redeemable)

**Purpose**:
- Cash equivalent in the Stevens ecosystem
- Redeemable anytime (stable value)
- Entry/exit point for the ecosystem

**Characteristics**:
- **Redeemable**: Can be converted to cash/fiat anytime
- **Stable**: Represents cash value
- **Transferable**: Can be traded freely
- **Liquid**: Easy entry/exit from ecosystem

**Use Cases**:
- Purchase SBC through exchange (SDC → SBC)
- Cash redemption (SDC → Cash/Fiat)
- Payment for services
- Ecosystem entry/exit
- Receive SBC redemption proceeds (after time lock)

**Economic Function**:
- Provides liquidity bridge
- Enables SBC ↔ Cash conversion
- Supports exchange mechanisms (AMM/CEX)

---

## Task System Architecture

### Task Types

#### 1. SRPC-Rewarded Tasks
- **Creator**: Only Professor On-Chain Address (POCA)
- **Reward**: SRPC (Stevens Reputation Proof Coin)
- **Bidding**: Students bid SBC to compete
- **Assignment**: Highest bidder wins (with time constraints)
- **Completion**: SBC burned, SRPC awarded

**Flow**:
```
POCA creates SRPC task
    ↓
Students bid SBC
    ↓
Highest bidder wins
    ↓
Task completed
    ↓
SBC burned, SRPC awarded
```

#### 2. SBC-Rewarded Tasks
- **Creator**: All whitelisted users (Professors, Students, Admins)
- **Reward**: SBC (Stevens Banana Coin)
- **Assignment**: Direct assignment (no bidding)
- **Completion**: SBC reward paid to task taker

**Flow**:
```
User creates SBC task
    ↓
Task assigned directly
    ↓
Task completed
    ↓
SBC reward paid
```

---

## Economic Model

### Demand Flow

```
SRPC (Demand Engine)
    ↓ Creates demand for
SBC (The Fuel & Governance)
    ↓ Can be purchased via exchange
SDC (Stevens Cash)
    ↓ Redeemable to
Cash/Fiat

SBC → SDC (Time-locked redemption, 30-90 days)
    ↓
SDC → Cash/Fiat (Immediate redemption)
```

### Supply Dynamics

**SRPC**:
- Supply controlled by POCA distribution
- Scarcity through professor allocation limits
- Non-transferable ensures earned reputation

**SBC**:
- Deflationary model
- Burned on task completion
- Time-locked redemption to SDC (30-90 days, governance-controlled)
- Scarcity increases over time
- Governance token (voting on system parameters)

**SDC**:
- Stable supply (redeemable)
- Backed by cash/fiat reserves
- Maintains liquidity

---

## Key Economic Principles

### 1. SRPC as Demand Engine
- **Scarcity**: Limited professor distribution
- **Value**: Real-world opportunities (connections, research)
- **Demand Creation**: Students compete for SRPC → Need SBC

### 2. SBC as Fuel & Governance
- **Deflationary**: Burning creates scarcity
- **Utility**: Required for SRPC task bidding
- **Governance**: Voting rights on system parameters
- **Redemption**: Time-locked conversion to SDC (30-90 days)
- **Exchange**: Can be purchased from SDC via AMM/CEX

### 3. SDC as Cash Bridge
- **Stability**: Cash-equivalent value
- **Liquidity**: Easy entry/exit
- **Redemption**: Convertible to fiat

---

## Distribution Mechanisms

### SRPC Distribution
- **Only by POCA**: Professors with on-chain addresses
- **Through Tasks**: SRPC-rewarded tasks in TaskManager
- **Controlled Scarcity**: System to reasonably distribute SRPC to professors
- **Real Resources**: Professors provide connections/opportunities to high-SRPC students

### SBC Distribution
- **Initial**: Admin-controlled via StudentManagement
- **Rewards**: Earned through SBC-rewarded tasks
- **Exchange**: Acquired through AMM/CEX (SDC → SBC)
- **Lending**: Borrowed using SRPC as collateral
- **Redemption**: Time-locked redemption from SDC (after lock period)

### SDC Distribution
- **Minting**: Backed by cash/fiat reserves
- **Exchange**: Acquired through AMM/CEX (SBC → SDC via time-locked redemption)
- **Redemption**: Convertible to cash anytime
- **Purchase**: Used to purchase SBC via AMM/CEX

---

## Professor On-Chain Address (POCA) System

### POCA Requirements
- Professors must have verified on-chain addresses
- Only POCA can create SRPC-rewarded tasks
- Distribution limits to maintain SRPC scarcity
- Real-world commitment: Provide resources to high-SRPC students

### POCA Responsibilities
- Create meaningful SRPC-rewarded tasks
- Distribute SRPC fairly and reasonably
- Provide real-world value (connections, opportunities) to students
- Maintain academic integrity

---

## Exchange Mechanisms

### AMM (DEX - Decentralized Exchange)
- Automated Market Maker
- SDC → SBC swaps (immediate purchase)
- SBC → SDC swaps (time-locked redemption initiation)
- Liquidity pools
- Incoming and outgoing fees

### SHIFT (CEX - Centralized Exchange)
- Centralized order book
- SDC → SBC trading (immediate purchase)
- SBC → SDC trading (time-locked redemption initiation)
- Alternative to AMM
- Traditional exchange model

### Redemption System
- **Time-Locked Redemption**: SBC can be redeemed to SDC after a governance-controlled lock period (30-90 days)
- **Process**: User initiates redemption → SBC locked → After lock period → Redeem to SDC
- **Purpose**: Maintains commitment during task periods while providing eventual exit path
- **Governance**: Lock period adjustable via SBC holder voting

---

## Whitelisting System

### Requirements
- **Stevens ID**: Official student/professor ID
- **Campus Email**: Verified Stevens email address
- **Personal Info**: Name, age, etc.
- **On-chain Verification**: Linked to blockchain address

### Access Control
- Only whitelisted users can:
  - Hold Stevens tokens
  - Transfer tokens
  - Create tasks
  - Participate in ecosystem

---

## Governance System

### SBC Governance Token

SBC holders have voting rights on critical ecosystem parameters:

#### 1. Redemption Lock Period
- **Parameter**: Time lock duration for SBC → SDC redemption
- **Range**: 30-90 days (adjustable)
- **Impact**: Balances commitment with exit flexibility
- **Voting**: Weighted by SBC holdings

#### 2. Lending Interest Rates
- **Parameters**: 
  - Supply APY (lender returns)
  - Borrow APY (borrower costs)
  - Utilization rate thresholds
- **Impact**: Controls lending market economics
- **Voting**: Weighted by SBC holdings

#### 3. Professor Token Distribution System Parameters
- **Parameters**:
  - Maximum SRPC per POCA per period
  - Task creation limits per POCA
  - Reward allocation formulas
  - Scarcity adjustment mechanisms
  - Distribution rate limits
- **Impact**: Maintains SRPC scarcity and fair distribution
- **Voting**: Weighted by SBC holdings

### Governance Process
1. **Proposal Creation**: Any SBC holder can create proposals
2. **Voting Period**: Typically 7-14 days
3. **Quorum**: Minimum SBC participation required
4. **Implementation**: Automatic execution if passed

### Governance Benefits
- **Decentralization**: Community controls ecosystem parameters
- **Adaptability**: System can evolve based on community needs
- **Alignment**: SBC holders incentivized to vote in ecosystem's best interest
- **Transparency**: All proposals and votes on-chain

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

