# Task List Feature - Architecture Summary

## Quick Reference

### Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TaskManager.sol                          │
│  (Single Contract - Recommended Approach)                 │
├─────────────────────────────────────────────────────────────┤
│  • Task Creation & Management                               │
│  • Live Bidding System (PoR tasks only)                   │
│  • Task Assignment & Completion                           │
│  • Dispute Handling                                         │
│  • Credit Score Queries                                     │
└─────────────────────────────────────────────────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │StudentMgmt│   │DuckCoin  │   │   PoR    │
    │  .sol    │   │  .sol    │   │  .sol    │
    └──────────┘   └──────────┘   └──────────┘
```

### Frontend Component Hierarchy

```
App.jsx
└── TaskList.jsx (Main Tab)
    ├── CreateTask.jsx (Modal/Form)
    ├── UnassignedTasks.jsx
    │   └── TaskCard.jsx (with BidModal.jsx)
    ├── OngoingTasks.jsx
    │   └── TaskCard.jsx
    └── MyTasks.jsx
        └── TaskCard.jsx (with action buttons)
```

### Task Lifecycle

```
CREATE → UNASSIGNED → (LIVE BIDDING) → ONGOING → COMPLETED
                              ↓
                          DISPUTED → (RESOLVED)
```

**Live Bidding:**
- Users see current highest bid
- New bids must be higher
- Previous bidder automatically refunded
- **24-hour acceptance deadline** (resets on each new bid)
- Creator must accept within 24 hours of last bid
- Countdown timer visible to all users

### Key Data Structures

**Task:**
- taskId, creator, description, fileHash
- rewardType (DuckCoin | PoR), rewardAmount
- assignedTo, bidAmount, status
- timestamps (created, assigned, completed)
- bidDeadline (24 hours from last bid - resets on new bid)

**Bid (Current Highest):**
- bidder (current highest bidder)
- amount (current highest bid - Duck Coin staked)
- timestamp (when bid was placed)

**Dispute:**
- reporter, reason, timestamp
- resolved, creatorAtFault

### Access Control Matrix

| Action                    | Professor        | Student          | Admin |
|---------------------------|------------------|------------------|-------|
| Create PoR Task           | ✅               | ❌               | ✅     |
| Create DC Task            | ✅               | ✅               | ✅     |
| Place Bid (Live Auction) | ✅               | ✅               | ❌     |
| Accept Current Bid        | ✅ (own task)    | ❌               | ❌     |
| Complete Task             | ✅ (own task)    | ❌               | ❌     |
| Report Dispute            | ❌               | ✅ (assigned)    | ❌     |
| Resolve Dispute           | ❌               | ❌               | ✅     |

### Color Coding

- **PoR Tasks:** Gold/Amber (#FFD700 / #FFA500) - High Priority
- **Duck Coin Tasks:** Standard (White/Light Gray)
- **Status Badges:**
  - Unassigned: Blue
  - Ongoing: Green  
  - Completed: Gray
  - Disputed: Red

### Credit Score System

- **Display:** PoR balance of task creator
- **Professors:** Show "Professor" badge + PoR amount
- **Students:** Show PoR amount only
- **Slashing:** Admin can slash PoR on dispute resolution if creator at fault

### File Upload Strategy

**Recommended: IPFS**
- Upload file → Get IPFS hash
- Store hash in contract (string)
- Display: `https://ipfs.io/ipfs/{hash}`

### Gas Optimization Notes

- Single contract = Lower gas for queries
- Use events for off-chain indexing
- Batch operations where possible
- Efficient struct packing

---

## Implementation Priority

1. **Phase 1:** Core Smart Contract (TaskManager)
2. **Phase 2:** Role Management (Professor/Student)
3. **Phase 3:** Frontend - Basic UI
4. **Phase 4:** Bidding & Assignment
5. **Phase 5:** Task Management (Ongoing, My Tasks)
6. **Phase 6:** Dispute System
7. **Phase 7:** Polish & Testing

---

## Critical Decisions Made

1. ✅ **Single Contract** (not Factory) - Simpler, more efficient
2. ✅ **Explicit Professor Role** - More flexible than PoR threshold
3. ✅ **IPFS for Files** - Decentralized, cost-effective
4. ✅ **Manual Dispute Resolution** - Admin resolves (can automate later)
5. ✅ **Automatic Bid Refunds** - Refund all except accepted bid

---

## Next Steps

1. Review this plan
2. Decide on PoR transfer mechanism (recommend: add taskManager role)
3. Start Phase 1: Core Smart Contract implementation
4. Set up IPFS integration for file uploads
5. Begin frontend component structure

