a# Tuition ABS - Phase 1: Foundation Implementation

## Overview

Phase 1 implements the foundation for tracking student tuition obligations and payments on-chain. This is the first step towards building a full Asset-Backed Security (ABS) structure for student tuition receivables.

## Architecture

### Contracts

1. **TuitionReceivable.sol** - Core contract for tracking tuition obligations
   - Tracks individual student tuition obligations
   - Manages payments via SDC (Stevens Duck Coin)
   - Records payment history
   - Handles overdue tracking

2. **StudentManagement.sol** (Extended) - Integration layer
   - Added tuition management functions
   - Provides convenient access to tuition data via student ID
   - Maintains integration with existing student management

### Key Features

#### Tuition Obligation Tracking
- Create tuition obligations for students
- Track total amount, paid amount, and remaining balance
- Set due dates and track overdue status
- Store descriptions (e.g., "Fall 2024 Tuition")

#### Payment Processing
- Students pay tuition using SDC (Stevens Duck Coin)
- Payments are recorded with timestamps
- Automatic tracking of payment progress
- Full payment detection

#### Query Functions
- Get obligations by student wallet or student ID
- Get payment history for any obligation
- Calculate total outstanding balance per student
- Check contract's collected SDC balance

## Contract Details

### TuitionReceivable.sol

#### Key Structures

```solidity
struct TuitionObligation {
    uint256 obligationId;      // Unique ID
    address studentWallet;     // Student's wallet
    uint256 studentId;          // Student's ID
    uint256 totalAmount;        // Total tuition (SDC wei)
    uint256 paidAmount;         // Amount paid so far
    uint256 dueDate;            // Unix timestamp
    uint256 createdAt;          // Creation timestamp
    bool isPaid;                // Fully paid flag
    bool isOverdue;             // Overdue flag
    string description;         // Description
}

struct Payment {
    uint256 obligationId;
    uint256 amount;
    uint256 timestamp;
    address payer;
}
```

#### Main Functions

**Owner Functions:**
- `createObligation()` - Create new tuition obligation
- `updateObligation()` - Update amount or due date
- `setStudentManagement()` - Set StudentManagement address
- `setSDCToken()` - Set SDC token address
- `markOverdue()` - Mark obligations as overdue
- `withdrawSDC()` - Withdraw collected payments

**Student Functions:**
- `makePayment()` - Pay towards an obligation using SDC

**View Functions:**
- `getObligation()` - Get obligation details
- `getStudentObligations()` - Get all obligations for a student
- `getPaymentHistory()` - Get payment history
- `getTotalOutstanding()` - Get total outstanding balance

### StudentManagement.sol Extensions

#### New Functions

**Owner Functions:**
- `setTuitionReceivable()` - Set TuitionReceivable contract address
- `createTuitionObligation()` - Create obligation via student ID
- `updateTuitionObligation()` - Update obligation
- `markTuitionOverdue()` - Mark obligations overdue

**View Functions:**
- `getStudentTuitionObligations()` - Get obligations by student ID
- `getStudentTuitionObligationsByWallet()` - Get obligations by wallet
- `getStudentTotalOutstandingTuition()` - Get total outstanding

## Usage Flow

### 1. Setup (Owner)
```solidity
// Deploy TuitionReceivable
TuitionReceivable tuition = new TuitionReceivable(
    address(studentManagement),
    address(sdcToken)
);

// Link to StudentManagement
studentManagement.setTuitionReceivable(address(tuition));
```

### 2. Create Tuition Obligation (Owner)
```solidity
// Create obligation for student ID 12345
uint256 obligationId = studentManagement.createTuitionObligation(
    12345,                          // studentId
    10000 * 1e18,                   // $10,000 in SDC wei
    block.timestamp + 90 days,       // Due in 90 days
    "Fall 2024 Tuition"              // Description
);
```

### 3. Student Payment
```solidity
// Student approves SDC spending
sdcToken.approve(address(tuitionReceivable), 5000 * 1e18);

// Student makes payment
tuitionReceivable.makePayment(obligationId, 5000 * 1e18);
```

### 4. Query Obligations
```solidity
// Get all obligations for a student
(uint256[] memory ids, TuitionObligation[] memory obligations) = 
    studentManagement.getStudentTuitionObligations(12345);

// Get total outstanding
uint256 outstanding = studentManagement.getStudentTotalOutstandingTuition(12345);
```

## Events

### TuitionReceivable Events
- `TuitionObligationCreated` - New obligation created
- `TuitionObligationUpdated` - Obligation updated
- `TuitionPaymentMade` - Payment received
- `TuitionObligationPaid` - Obligation fully paid
- `TuitionObligationMarkedOverdue` - Obligation marked overdue

### StudentManagement Events
- `TuitionReceivableUpdated` - TuitionReceivable address updated
- `TuitionObligationCreatedViaManagement` - Obligation created via StudentManagement

## Security Features

1. **Access Control**: Only owner can create/update obligations
2. **Payment Validation**: Only student can pay their own obligations
3. **Safe Transfers**: Uses OpenZeppelin SafeERC20 for token transfers
4. **Balance Checks**: Validates sufficient SDC balance and allowance
5. **Overdue Tracking**: Separate function to mark overdue (can be automated)

## Integration Points

### With Existing System
- **SDC Token**: Used as payment currency
- **StudentManagement**: Provides student whitelist and ID mapping
- **Future ABS**: Foundation for Phase 2 securitization

## Deployment Notes

1. Deploy TuitionReceivable first (requires StudentManagement and SDC addresses)
2. Deploy/update StudentManagement with TuitionReceivable address (can be address(0) initially)
3. Link contracts: `studentManagement.setTuitionReceivable(address(tuition))`
4. Set TuitionReceivable's StudentManagement: `tuition.setStudentManagement(address(studentManagement))`

## Next Steps (Phase 2)

Phase 2 will add:
- Pooling of receivables into tranches
- ABS token issuance
- Payment waterfall to investors
- Credit scoring integration with SRPC
- Default handling and reserve funds

## Testing

Run tests with:
```bash
cd contracts
forge test
```

## Files Modified/Created

**New Files:**
- `contracts/src/core/TuitionReceivable.sol`

**Modified Files:**
- `contracts/src/core/StudentManagement.sol` - Added tuition management functions
- `contracts/script/DeployNewContracts.s.sol` - Updated constructor
- `contracts/test/SBC.t.sol` - Updated constructor

## Notes

- TuitionReceivable constructor accepts `address(0)` for StudentManagement initially
- All tuition functions check if TuitionReceivable is set before executing
- Payments are stored in the TuitionReceivable contract (can be withdrawn by owner)
- Overdue marking is manual (can be automated with keeper network)

