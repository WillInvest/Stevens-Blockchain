# Lending Feature - Comprehensive Implementation Plan

## Executive Summary

This document outlines the implementation plan for a Peer-to-Peer Lending system where students can lend Duck Coin (DC) to other students. Lenders must stake Proof of Reputation (PoR) as collateral to demonstrate credibility. The system includes dynamic interest rate calculation based on supply/demand and comprehensive monitoring metrics.

---

## 1. Core Concept

### 1.1 Lending Mechanism
- **Lenders**: Students who lend Duck Coin (no PoR staking required)
- **Borrowers**: Students who borrow Duck Coin (require PoR collateral)
- **Collateral**: PoR (Proof of Reputation) - required only for borrowers
- **Asset**: Duck Coin (DC) - the currency being lent

### 1.2 Key Principles
- Lenders can lend DC without staking PoR
- Borrowers must provide PoR collateral to borrow
- Interest rates adjust dynamically based on market conditions
- Transparent metrics for monitoring lending health

---

## 2. Key Metrics & Terminology

### 2.1 Primary Metrics

#### **Total PoR Staked (Borrower Collateral)**
- **Name**: **Total PoR Staked** or **Borrower Collateral**
- **Formula**: `Sum of all PoR staked by borrowers as collateral`
- **Purpose**: Measures the total collateral backing borrowed DC
- **Display**: 
  - Total PoR amount (e.g., 25,000 PoR)
  - Shows security of the lending pool
- **Interpretation**:
  - Higher PoR staked = More secure lending pool
  - Lower PoR staked = Higher risk (less collateral backing loans)

#### **Interest Rate**
- **Name**: **Lending Interest Rate** or **APY (Annual Percentage Yield)**
- **Calculation**: Dynamic rate based on utilization
- **Purpose**: Determines returns for lenders and costs for borrowers
- **Display**: Percentage (e.g., 5.25% APY)

### 2.2 Interest Rate Model (DeFi-Inspired)

Based on DeFi platforms like Aave and Compound, interest rates are calculated using:

```
Utilization Rate = Total DC Borrowed / Total DC Supplied

Interest Rate = Base Rate + (Utilization Rate × Slope)
```

**Dynamic Interest Rate Formula:**
```
Supply Interest Rate = Base Rate + (Utilization × Supply Slope)
Borrow Interest Rate = Base Rate + (Utilization × Borrow Slope) + Spread
```

**Where:**
- **Base Rate**: Minimum interest rate (e.g., 2%)
- **Utilization Rate**: Percentage of supplied DC that's borrowed (0-100%)
- **Supply Slope**: Rate increase per utilization point for lenders
- **Borrow Slope**: Rate increase per utilization point for borrowers
- **Spread**: Additional fee for borrowers (e.g., 1-2%)

**Example:**
- Total DC Supplied: 10,000 DC
- Total DC Borrowed: 7,000 DC
- Utilization Rate: 70%
- Base Rate: 2%
- Supply Slope: 0.05 (5% per 100% utilization)
- Borrow Slope: 0.08 (8% per 100% utilization)
- Spread: 1.5%

**Supply Interest Rate** = 2% + (70% × 5%) = 2% + 3.5% = **5.5% APY**
**Borrow Interest Rate** = 2% + (70% × 8%) + 1.5% = 2% + 5.6% + 1.5% = **9.1% APY**

**Key Characteristics:**
- Low utilization (<30%): Low interest rates (incentivizes borrowing)
- Medium utilization (30-70%): Moderate interest rates
- High utilization (>70%): High interest rates (incentivizes more lending)

---

## 3. Frontend Architecture

### 3.1 Component Structure

```
Lending.jsx (Main Component)
├── LendingDashboard.jsx (Top Section - Metrics)
│   ├── MetricCard.jsx (Reusable metric card)
│   │   - PoR Collateralization Ratio
│   │   - Total DC Supplied
│   │   - Total DC Borrowed
│   │   - Utilization Rate
│   │   - Supply Interest Rate (APY)
│   │   - Borrow Interest Rate (APY)
│   └── InterestRateChart.jsx (Visual interest rate over time)
│
├── LendingTabs.jsx (Tab Navigation)
│   ├── SupplyTab.jsx (Lend DC)
│   │   ├── SupplyForm.jsx
│   │   │   - PoR Balance Display
│   │   │   - PoR Staking Input (required to lend)
│   │   │   - DC Amount to Lend Input
│   │   │   - Expected APY Display
│   │   │   - Supply Button
│   │   └── MySupplies.jsx
│   │       └── SupplyCard.jsx
│   │           - Lending Details
│   │           - Current APY
│   │           - Total Earned
│   │           - Withdraw Option
│   │
│   ├── BorrowTab.jsx (Borrow DC)
│   │   ├── BorrowForm.jsx
│   │   │   - PoR Balance Display
│   │   │   - PoR Collateral Input
│   │   │   - DC Amount to Borrow Input
│   │   │   - Borrow Interest Rate Display
│   │   │   - Max Borrowable Amount (based on PoR)
│   │   │   - Borrow Button
│   │   └── MyBorrows.jsx
│   │       └── BorrowCard.jsx
│   │           - Borrowing Details
│   │           - Current Interest Rate
│   │           - Repayment Schedule
│   │           - Repay Button
│   │
│   └── MarketTab.jsx (Market Overview)
│       ├── MarketStats.jsx
│       └── ActiveLoansList.jsx
│           └── LoanCard.jsx
```

### 3.2 Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    LENDING DASHBOARD                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PoR-to-DC    │  │ Utilization  │  │ Supply APY   │      │
│  │ Ratio        │  │ Rate         │  │              │      │
│  │ 2.5:1 (250%) │  │ 70%          │  │ 5.5%         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Total DC      │  │ Total DC     │  │ Borrow APY   │      │
│  │ Supplied      │  │ Borrowed     │  │              │      │
│  │ 10,000 DC     │  │ 7,000 DC     │  │ 9.1%         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  [Supply] [Borrow] [Market]                                 │
├─────────────────────────────────────────────────────────────┤
│  [Tab Content Based on Selection]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Key Features & User Flows

### 4.1 Supply (Lend) Flow

**User Journey:**
1. User navigates to "Supply" tab
2. System displays:
   - Current PoR balance
   - Current DC balance
   - Current Supply APY
   - Total DC already supplied (if any)
3. User inputs:
   - Amount of PoR to stake (required)
   - Amount of DC to lend
4. System calculates:
   - Maximum DC they can lend (based on PoR staked)
   - Expected APY based on current utilization
   - Estimated earnings
5. User confirms and supplies
6. PoR is locked, DC is transferred to lending pool
7. User sees their active supply in "My Supplies"

**Validation Rules:**
- Must stake PoR to lend DC
- PoR staked must be >= minimum threshold (e.g., 10 PoR)
- DC amount must be <= available DC balance
- DC amount must be within limits based on PoR staked (e.g., 1:1 ratio minimum)

### 4.2 Borrow Flow

**User Journey:**
1. User navigates to "Borrow" tab
2. System displays:
   - Current PoR balance
   - Current DC balance
   - Current Borrow APY
   - Total DC already borrowed (if any)
3. User inputs:
   - Amount of PoR to use as collateral
   - Amount of DC to borrow
4. System calculates:
   - Maximum borrowable amount (based on PoR collateral)
   - Borrow interest rate
   - Total repayment amount
   - Repayment schedule
5. User confirms and borrows
6. PoR is locked as collateral, DC is transferred to user
7. User sees their active borrow in "My Borrows"

**Validation Rules:**
- Must provide PoR collateral to borrow
- Borrow amount must be within collateral limits (e.g., 50% of PoR value)
- Cannot exceed maximum utilization rate (e.g., 95%)
- Must have sufficient PoR balance

### 4.3 Interest Rate Calculation Display

**Real-time Updates:**
- Interest rates update based on current utilization
- Visual indicator showing rate changes (up/down arrows)
- Historical chart showing rate trends

**Rate Display:**
```
Supply Interest Rate: 5.5% APY ↑ 0.2%
Borrow Interest Rate: 9.1% APY ↑ 0.3%
Utilization: 70% (7,000 DC / 10,000 DC)
```

---

## 5. Data Structures (Frontend)

### 5.1 Lending Pool State

```javascript
const lendingPool = {
  // Metrics
  totalPoRStaked: "25000",      // Total PoR locked as collateral
  totalDCSupplied: "10000",      // Total DC in lending pool
  totalDCBorrowed: "7000",       // Total DC currently borrowed
  utilizationRate: 0.70,          // 70% (borrowed / supplied)
  
  // Ratios
  porToDCRatio: 2.5,             // 2.5:1 ratio
  collateralizationRatio: 2.5,   // Same as above (250%)
  
  // Interest Rates
  supplyAPY: 0.055,              // 5.5% APY
  borrowAPY: 0.091,              // 9.1% APY
  
  // Rate Parameters
  baseRate: 0.02,                // 2% base rate
  supplySlope: 0.05,             // 5% per 100% utilization
  borrowSlope: 0.08,             // 8% per 100% utilization
  spread: 0.015,                 // 1.5% spread
};
```

### 5.2 User Supply Position

```javascript
const userSupply = {
  supplyId: 1,
  lender: "0x1234...5678",
  porStaked: "100",              // PoR staked
  dcSupplied: "500",             // DC supplied
  currentAPY: 0.055,             // Current APY
  totalEarned: "25.5",           // Total interest earned
  suppliedAt: timestamp,
  lastUpdated: timestamp
};
```

### 5.3 User Borrow Position

```javascript
const userBorrow = {
  borrowId: 1,
  borrower: "0xABCD...EFGH",
  porCollateral: "200",          // PoR used as collateral
  dcBorrowed: "100",             // DC borrowed
  currentAPY: 0.091,             // Current borrow APY
  totalOwed: "109.1",            // Principal + interest
  interestAccrued: "9.1",        // Interest accrued so far
  borrowedAt: timestamp,
  lastUpdated: timestamp
};
```

---

## 6. UI/UX Design

### 6.1 Color Coding

- **Supply/Lend**: Green (#10B981) - Positive action
- **Borrow**: Orange/Amber (#F59E0B) - Caution action
- **Metrics**: 
  - Healthy ratios: Green
  - Warning ratios: Yellow
  - Critical ratios: Red
- **Interest Rates**: 
  - Low rates: Blue
  - Medium rates: Yellow
  - High rates: Red

### 6.2 Visual Indicators

- **Utilization Rate Gauge**: Circular progress bar
  - 0-50%: Green (safe)
  - 50-80%: Yellow (moderate)
  - 80-95%: Orange (high)
  - 95-100%: Red (critical)

- **Interest Rate Trend**: Arrow indicators
  - ↑ (increasing)
  - ↓ (decreasing)
  - → (stable)

### 6.3 Information Hierarchy

1. **Top Level**: Key metrics (PoR-to-DC Ratio, Utilization, Interest Rates)
2. **Second Level**: Action forms (Supply/Borrow)
3. **Third Level**: User positions (My Supplies/My Borrows)
4. **Fourth Level**: Market overview (All active loans)

---

## 7. Implementation Phases

### Phase 1: Core Dashboard & Metrics (Week 1)
- [ ] Create Lending.jsx main component
- [ ] Create LendingDashboard with metric cards
- [ ] Implement PoR-to-DC Ratio calculation and display
- [ ] Implement Utilization Rate calculation and display
- [ ] Create interest rate calculation logic
- [ ] Display Supply and Borrow APY
- [ ] Mock data integration

### Phase 2: Supply (Lend) Functionality (Week 1-2)
- [ ] Create SupplyTab component
- [ ] Create SupplyForm with PoR staking input
- [ ] Create DC lending input
- [ ] Implement validation logic
- [ ] Create MySupplies component
- [ ] Create SupplyCard component
- [ ] Add withdraw functionality UI

### Phase 3: Borrow Functionality (Week 2)
- [ ] Create BorrowTab component
- [ ] Create BorrowForm with PoR collateral input
- [ ] Create DC borrow input
- [ ] Implement max borrowable calculation
- [ ] Create MyBorrows component
- [ ] Create BorrowCard component
- [ ] Add repay functionality UI

### Phase 4: Market Overview (Week 2-3)
- [ ] Create MarketTab component
- [ ] Create MarketStats component
- [ ] Create ActiveLoansList component
- [ ] Create LoanCard component
- [ ] Add filtering and sorting

### Phase 5: Interest Rate Visualization (Week 3)
- [ ] Create InterestRateChart component
- [ ] Implement historical rate tracking
- [ ] Add rate trend indicators
- [ ] Create utilization gauge visualization

### Phase 6: Polish & Integration (Week 3-4)
- [ ] Connect to smart contracts (when ready)
- [ ] Add loading states
- [ ] Error handling
- [ ] Responsive design
- [ ] Testing

---

## 8. Smart Contract Integration Points

### 8.1 Contract Methods Needed (Future)

```solidity
// Lending Pool Metrics
function getTotalPoRStaked() external view returns (uint256);
function getTotalDCSupplied() external view returns (uint256);
function getTotalDCBorrowed() external view returns (uint256);
function getUtilizationRate() external view returns (uint256); // in basis points
function getSupplyAPY() external view returns (uint256); // in basis points
function getBorrowAPY() external view returns (uint256); // in basis points

// Supply Functions
function supply(uint256 porAmount, uint256 dcAmount) external;
function withdrawSupply(uint256 supplyId, uint256 dcAmount) external;
function getUserSupplies(address user) external view returns (Supply[] memory);

// Borrow Functions
function borrow(uint256 porCollateral, uint256 dcAmount) external;
function repayBorrow(uint256 borrowId, uint256 dcAmount) external;
function getUserBorrows(address user) external view returns (Borrow[] memory);
```

---

## 9. Key Decisions & Rationale

### 9.1 Interest Rate Model
**Decision**: Dynamic interest rate based on utilization (DeFi-style)
**Rationale**: 
- Incentivizes optimal utilization
- Self-balancing supply and demand
- Transparent and predictable
- Industry-standard approach

### 9.2 PoR as Collateral
**Decision**: PoR must be staked to lend DC
**Rationale**:
- Demonstrates lender credibility
- Reduces risk in the system
- Creates value for PoR token
- Aligns with reputation-based system

### 9.3 Metrics Naming
**Decision**: 
- **PoR Collateralization Ratio** (primary metric)
- **Utilization Rate** (secondary metric)
**Rationale**:
- Clear and descriptive
- Aligns with DeFi terminology
- Easy to understand for users

---

## 10. Future Enhancements

1. **Liquidation Mechanism**: Automatic liquidation if collateral ratio drops
2. **Flash Loans**: Instant loans without collateral (advanced)
3. **Lending Pools**: Multiple pools with different risk levels
4. **Governance**: Community voting on interest rate parameters
5. **Insurance**: Optional insurance for lenders
6. **Credit Scoring**: Advanced credit scoring based on borrowing history

---

## 11. Questions & Considerations

1. **Minimum PoR Staking**: What's the minimum PoR required to lend?
2. **Collateral Ratio**: What's the minimum PoR-to-DC ratio required?
3. **Borrow Limits**: Maximum borrowable amount per user?
4. **Interest Accrual**: How often does interest accrue? (per block, per day?)
5. **Withdrawal**: Can lenders withdraw before loan term ends?
6. **Repayment**: Fixed term or open-ended borrowing?

---

## Conclusion

This plan provides a comprehensive roadmap for implementing the Lending feature with a focus on:
- PoR-based credibility system
- Dynamic interest rate calculation
- Clear metrics and monitoring
- User-friendly interface
- DeFi-inspired mechanics

**Estimated Timeline**: 3-4 weeks (frontend only)
**Complexity**: Medium-High
**Dependencies**: DuckCoin, ProveOfReputation contracts

