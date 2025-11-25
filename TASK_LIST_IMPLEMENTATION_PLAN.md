# Task List Feature - Comprehensive Implementation Plan

## Executive Summary

This document outlines the implementation plan for a Task List system that allows administrators/professors and students to create tasks with rewards (Duck Coin or Proof of Reputation), with a bidding mechanism for PoR tasks and a credit score system based on PoR holdings.

---

## 1. Architecture Decision: Single Contract vs Factory Pattern

### **Decision: Single Contract (TaskManager.sol)** ✅

**Rationale:**
- ✅ Simpler to query all tasks (Unassigned, Ongoing, My Tasks)
- ✅ Lower gas costs (no contract deployment per task)
- ✅ Easier to implement cross-task features (credit scores, reporting)
- ✅ Better for frontend integration (single contract address)
- ✅ Sufficient for current requirements

**Factory Pattern would be better if:**
- Each task needed complex independent logic
- Tasks needed to be upgradable independently
- We needed to support thousands of concurrent tasks with different rules

**For this use case, a single contract is more appropriate.**

---

## 2. Smart Contract Architecture

### 2.1 Core Contract: `TaskManager.sol`

**Location:** `src/TaskManager.sol`

**Dependencies:**
- `StudentManagement.sol` - For checking whitelist and PoR balances
- `DuckCoin.sol` - For Duck Coin rewards and bidding
- `ProveOfReputation.sol` - For PoR rewards

**Key Structures:**

```solidity
enum TaskStatus {
    Unassigned,    // Task created, waiting for bids/assignment
    Ongoing,       // Task assigned, in progress
    Completed,    // Task finished by creator
    Disputed,      // Task reported/disputed
    Cancelled      // Task cancelled
}

enum RewardType {
    DuckCoin,     // Reward in Duck Coin
    PoR           // Reward in Proof of Reputation
}

struct Task {
    uint256 taskId;
    address creator;
    string description;
    string fileHash;        // IPFS hash or file reference
    RewardType rewardType;
    uint256 rewardAmount;
    address assignedTo;     // Task taker (set when bid accepted)
    uint256 bidAmount;     // Staked Duck Coin (for PoR tasks)
    TaskStatus status;
    uint256 createdAt;
    uint256 assignedAt;
    uint256 completedAt;
    uint256 bidDeadline;    // Deadline to accept current bid (24 hours from last bid)
    bool hasDispute;
}

struct Bid {
    address bidder;        // Current highest bidder
    uint256 amount;        // Current highest bid (Duck Coin staked)
    uint256 timestamp;     // When this bid was placed
}

struct Dispute {
    address reporter;      // Task taker who reported
    string reason;
    uint256 timestamp;
    bool resolved;
    bool creatorAtFault;
}
```

**Key Mappings:**
```solidity
mapping(uint256 => Task) public tasks;
mapping(uint256 => Bid) public taskBids;       // taskId => current highest bid
mapping(address => uint256[]) public creatorTasks;  // creator => taskIds
mapping(address => uint256[]) public takerTasks;    // taker => taskIds
mapping(uint256 => Dispute) public disputes;    // taskId => dispute
uint256 public nextTaskId;
```

**Key Functions:**

1. **Task Creation:**
   - `createTask(string description, string fileHash, RewardType rewardType, uint256 rewardAmount)`
   - Validates creator has sufficient PoR (if PoR reward)
   - Locks PoR in contract (if PoR reward)
   - Emits `TaskCreated` event

2. **Live Bidding (PoR tasks only):**
   - `placeBid(uint256 taskId, uint256 duckCoinAmount)`
   - Must be higher than current highest bid
   - Automatically refunds previous highest bidder's Duck Coin
   - Transfers new bidder's Duck Coin to contract (staked)
   - Updates task with new highest bidder and bid amount
   - **Sets/resets bid deadline to 24 hours from now** (if first bid, sets deadline; if new bid, resets deadline)
   - Emits `BidPlaced` event with new highest bid and deadline

3. **Accept Current Bid:**
   - `acceptBid(uint256 taskId)`
   - Only task creator can call
   - **Must be called within 24 hours of last bid** (checks `bidDeadline`)
   - Accepts the current highest bid (if any)
   - Moves task to Ongoing
   - Assigns task to highest bidder
   - Emits `TaskAssigned` event

4. **Complete Task:**
   - `completeTask(uint256 taskId)`
   - Only task creator can call
   - Transfers PoR to task taker (if PoR reward)
   - Burns staked Duck Coin
   - Moves task to Completed
   - Emits `TaskCompleted` event

5. **Report Dispute:**
   - `reportDispute(uint256 taskId, string reason)`
   - Only task taker can call
   - Moves task to Disputed
   - Emits `DisputeReported` event

6. **Resolve Dispute (Admin only):**
   - `resolveDispute(uint256 taskId, bool creatorAtFault, uint256 slashAmount)`
   - Only owner can call
   - If creator at fault: slash PoR
   - Refund or burn Duck Coin based on resolution
   - Emits `DisputeResolved` event

7. **Query Functions:**
   - `getUnassignedTasks() returns (Task[] memory)`
   - `getOngoingTasks() returns (Task[] memory)`
   - `getMyTasks(address user) returns (Task[] memory)` - Returns both created and assigned tasks
   - `getCurrentBid(uint256 taskId) returns (Bid memory)` - Returns current highest bid
   - `getCreatorCreditScore(address creator) returns (uint256)` - Returns PoR balance

**Access Control:**
- Uses `StudentManagement` to check if user is whitelisted
- Uses `Ownable` for admin functions (dispute resolution)
- PoR balance check via `ProveOfReputation.balanceOf()`

---

## 3. Role Management Enhancement

### 3.1 Add Professor/Admin Role to StudentManagement

**Modification to `StudentManagement.sol`:**

```solidity
mapping(address => bool) public isProfessor;  // Admin/Professor flag
mapping(address => bool) public isStudent;     // Student flag

function setProfessor(address professor, bool status) external onlyOwner {
    isProfessor[professor] = status;
    if (status) {
        isStudent[professor] = false;  // Can't be both
    }
}

function setStudent(address student, bool status) external onlyOwner {
    isStudent[student] = status;
    if (status) {
        isProfessor[student] = false;  // Can't be both
    }
}
```

**Alternative:** Use PoR threshold (e.g., > 100 PoR = Professor)

---

## 4. Frontend Architecture

### 4.1 Component Structure

```
sbc-frontend/src/components/
├── TaskList/
│   ├── TaskList.jsx          # Main component with 3 subtabs
│   ├── UnassignedTasks.jsx   # List of unassigned tasks
│   ├── OngoingTasks.jsx      # List of ongoing tasks
│   ├── MyTasks.jsx          # User's created/assigned tasks
│   ├── CreateTask.jsx       # Task creation form
│   ├── TaskCard.jsx         # Reusable task display component
│   └── BidModal.jsx         # Bidding interface
```

### 4.2 Main Tab Integration

**Update `App.jsx`:**
- Add "Task List" tab after "Lending", before "Student Info"
- Pass required contracts: `taskManagerContract`, `studentManagementContract`, `duckCoinContract`, `nftContract`

### 4.3 Component Details

#### **TaskList.jsx** (Main Component)
- Three subtabs: Unassigned, Ongoing, My Tasks
- "Create Task" button (always visible)
- Fetches and displays tasks based on active subtab
- Handles task filtering and sorting

#### **CreateTask.jsx**
- Form fields:
  - Description (textarea)
  - File Upload (optional - stores IPFS hash or file reference)
  - Reward Type (radio: Duck Coin / PoR)
  - Reward Amount (number input)
- Validation:
  - Check if PoR reward requires professor role
  - Check if creator has sufficient PoR
  - Validate all fields
- Calls `taskManagerContract.createTask()`

#### **TaskCard.jsx**
- Displays task information
- Color coding:
  - **PoR tasks:** Gold/Amber background (`#FFD700` or `#FFA500`)
  - **Duck Coin tasks:** Standard white/light gray
- Shows:
  - Task ID, Description, Creator, Reward Type/Amount
  - Credit Score (PoR balance of creator)
  - **Current Highest Bid** (for PoR tasks) - Live display
  - Status badge
  - Action buttons (Place Bid, Accept Bid, Complete, Report)

#### **UnassignedTasks.jsx**
- Lists all tasks with status `Unassigned`
- For PoR tasks:
  - Shows **current highest bid** (live, updates automatically)
  - Shows **bid deadline countdown** (24 hours from last bid, resets on new bid)
  - Shows "Place Bid" button
  - Validates new bid must be higher than current
  - Visual indicator when deadline is approaching
- Shows task details and creator credit score
- Real-time bid updates (polling or event listening)

#### **OngoingTasks.jsx**
- Lists all tasks with status `Ongoing`
- Read-only view for most users
- Shows progress information

#### **MyTasks.jsx**
- Shows tasks where user is creator OR assigned taker
- For creators:
  - Shows **current highest bid** (for unassigned PoR tasks)
  - Shows **countdown timer** until bid deadline (24 hours from last bid)
  - "Accept Bid" button (PoR tasks with current bid, disabled if deadline passed)
  - Warning if deadline is approaching (< 1 hour remaining)
  - "Complete Task" button (Ongoing tasks)
- For takers:
  - "Report Dispute" button (if creator not completing)
  - View task details

#### **BidModal.jsx**
- Modal for placing bids on PoR tasks
- Displays **current highest bid** prominently
- Input: Duck Coin amount to stake
- Validation: Must be higher than current bid
- Shows minimum bid amount (current + 1 wei minimum)
- Calls `taskManagerContract.placeBid(taskId, amount)`
- Automatically refunds previous bidder on successful bid

---

## 5. Data Flow Diagrams

### 5.1 Task Creation Flow (PoR Reward)

```
User (Professor) → CreateTask.jsx
  ↓
Check: isProfessor? && PoR balance >= reward?
  ↓
TaskManager.createTask()
  ↓
Lock PoR in contract
  ↓
Emit TaskCreated event
  ↓
Task appears in UnassignedTasks
```

### 5.2 Live Bidding Flow (PoR Task)

```
Student → UnassignedTasks → See current bid (e.g., 50 DC)
  ↓
Click "Place Bid" button
  ↓
BidModal.jsx opens
  ↓
Enter Duck Coin amount (must be > current bid)
  ↓
TaskManager.placeBid(taskId, newAmount)
  ↓
Check: newAmount > currentBid.amount
  ↓
Refund previous bidder's Duck Coin
  ↓
Transfer new bidder's Duck Coin to contract
  ↓
Update task with new highest bidder
  ↓
Set/reset bid deadline to 24 hours from now
  ↓
Emit BidPlaced event (with deadline)
  ↓
All users see updated bid amount + new countdown timer
```

### 5.3 Task Assignment Flow

```
Professor → MyTasks → See task with current highest bid
  ↓
See countdown timer (e.g., "18h 23m remaining")
  ↓
Click "Accept Bid" button (disabled if deadline passed)
  ↓
TaskManager.acceptBid(taskId)
  ↓
Check: block.timestamp <= bidDeadline
  ↓
Accept current highest bid (if exists)
  ↓
Move task to Ongoing
  ↓
Task appears in:
  - OngoingTasks (all users)
  - MyTasks (creator)
  - MyTasks (taker)
```

**Note:** If deadline passes without acceptance:
- Task remains in Unassigned status
- Current bidder can still be outbid
- New bids reset the 24-hour deadline

### 5.4 Task Completion Flow

```
Professor → MyTasks → Ongoing task
  ↓
Click "Complete Task"
  ↓
TaskManager.completeTask()
  ↓
Transfer PoR to taker
  ↓
Burn staked Duck Coin
  ↓
Move task to Completed
  ↓
Update credit scores
```

### 5.5 Dispute Flow

```
Student (Taker) → MyTasks → Ongoing task
  ↓
Click "Report Dispute"
  ↓
TaskManager.reportDispute(taskId, reason)
  ↓
Task moves to Disputed
  ↓
Admin reviews → resolveDispute()
  ↓
If creator at fault: Slash PoR
```

---

## 6. Smart Contract Implementation Details

### 6.1 PoR Locking Mechanism

When professor creates PoR reward task:
```solidity
// In createTask()
if (rewardType == RewardType.PoR) {
    require(proveOfReputation.balanceOf(msg.sender) >= rewardAmount, "Insufficient PoR");
    // Lock PoR by transferring to contract
    proveOfReputation.transferFrom(msg.sender, address(this), rewardAmount);
    // Note: Since PoR is non-transferable, we need a special mechanism
    // Alternative: Use allowance pattern or modify PoR contract
}
```

**Issue:** PoR is non-transferable! 

**Solution Options:**
1. **Modify PoR contract** to allow TaskManager to transfer (add `taskManager` role)
2. **Use escrow pattern** - Professor approves TaskManager, TaskManager can transfer on completion
3. **Track locked amounts** in TaskManager without actually transferring

**Recommended:** Option 1 - Add `taskManager` address to PoR contract with transfer permissions

### 6.2 Duck Coin Live Bidding & Burning

```solidity
// Place bid (must be higher than current)
function placeBid(uint256 taskId, uint256 amount) external {
    Task storage task = tasks[taskId];
    Bid storage currentBid = taskBids[taskId];
    
    require(amount > currentBid.amount, "Bid must be higher than current");
    require(task.status == TaskStatus.Unassigned, "Task not available");
    
    // Refund previous bidder if exists
    if (currentBid.bidder != address(0)) {
        duckCoin.transfer(currentBid.bidder, currentBid.amount);
    }
    
    // Transfer new bidder's Duck Coin to contract
    duckCoin.transferFrom(msg.sender, address(this), amount);
    
    // Update current bid
    currentBid.bidder = msg.sender;
    currentBid.amount = amount;
    currentBid.timestamp = block.timestamp;
    
    // Set/reset bid deadline to 24 hours from now
    task.bidDeadline = block.timestamp + 24 hours;
    
    emit BidPlaced(taskId, msg.sender, amount, task.bidDeadline);
}

// Accept current bid (must be within 24 hours)
function acceptBid(uint256 taskId) external {
    Task storage task = tasks[taskId];
    Bid storage currentBid = taskBids[taskId];
    
    require(task.creator == msg.sender, "Only creator can accept");
    require(task.status == TaskStatus.Unassigned, "Task not available");
    require(currentBid.bidder != address(0), "No bid to accept");
    require(block.timestamp <= task.bidDeadline, "Bid acceptance deadline passed");
    
    task.assignedTo = currentBid.bidder;
    task.bidAmount = currentBid.amount;
    task.status = TaskStatus.Ongoing;
    task.assignedAt = block.timestamp;
    
    emit TaskAssigned(taskId, currentBid.bidder, currentBid.amount);
}

// Check if bid deadline has passed
function isBidDeadlinePassed(uint256 taskId) external view returns (bool) {
    Task storage task = tasks[taskId];
    if (task.bidDeadline == 0) return false; // No bid yet
    return block.timestamp > task.bidDeadline;
}

// Get time remaining until deadline
function getTimeUntilDeadline(uint256 taskId) external view returns (uint256) {
    Task storage task = tasks[taskId];
    if (task.bidDeadline == 0) return 0; // No bid yet
    if (block.timestamp >= task.bidDeadline) return 0; // Deadline passed
    return task.bidDeadline - block.timestamp;
}

// Complete task - burn staked amount
duckCoin.burn(task.bidAmount);
```

### 6.3 Credit Score System

```solidity
function getCreatorCreditScore(address creator) external view returns (uint256) {
    return proveOfReputation.balanceOf(creator);
}

// In dispute resolution
if (creatorAtFault) {
    proveOfReputation.burn(creator, slashAmount);
}
```

---

## 7. File Upload Handling

### Option 1: IPFS Integration
- Upload file to IPFS via frontend
- Store IPFS hash in contract
- Display file link in frontend

### Option 2: Centralized Storage
- Upload to server/cloud storage
- Store file URL/reference in contract
- Display file link in frontend

### Option 3: On-chain Storage (Not Recommended)
- Store file data in contract (expensive, limited size)

**Recommendation:** Option 1 (IPFS) - Decentralized, cost-effective

**Implementation:**
- Use `ipfs-http-client` or `web3.storage` in frontend
- Store hash as `string` in contract
- Display IPFS gateway link: `https://ipfs.io/ipfs/{hash}`

---

## 8. Frontend State Management

### 8.1 Task State

```javascript
const [tasks, setTasks] = useState({
  unassigned: [],
  ongoing: [],
  myTasks: []
});

const [loading, setLoading] = useState(false);
const [selectedTask, setSelectedTask] = useState(null);
const [showCreateModal, setShowCreateModal] = useState(false);
const [showBidModal, setShowBidModal] = useState(false);
```

### 8.2 Data Fetching

```javascript
// Fetch unassigned tasks
const fetchUnassignedTasks = async () => {
  const allTasks = await taskManagerContract.getUnassignedTasks();
  setTasks(prev => ({ ...prev, unassigned: allTasks }));
};

// Fetch ongoing tasks
const fetchOngoingTasks = async () => {
  const allTasks = await taskManagerContract.getOngoingTasks();
  setTasks(prev => ({ ...prev, ongoing: allTasks }));
};

// Fetch my tasks
const fetchMyTasks = async () => {
  const created = await taskManagerContract.getCreatorTasks(wallet);
  const assigned = await taskManagerContract.getTakerTasks(wallet);
  setTasks(prev => ({ 
    ...prev, 
    myTasks: [...created, ...assigned] 
  }));
};

// Fetch current bid for a task (for live display)
const fetchCurrentBid = async (taskId) => {
  const bid = await taskManagerContract.getCurrentBid(taskId);
  return bid;
};

// Fetch time until deadline (for countdown timer)
const fetchTimeUntilDeadline = async (taskId) => {
  const secondsRemaining = await taskManagerContract.getTimeUntilDeadline(taskId);
  return secondsRemaining;
};

// Format countdown timer
const formatCountdown = (seconds) => {
  if (seconds === 0) return "Deadline Passed";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// Fetch current bid for a task (for live display)
const fetchCurrentBid = async (taskId) => {
  const bid = await taskManagerContract.getCurrentBid(taskId);
  return bid;
};

// Fetch current bid for a task (for live display)
const fetchCurrentBid = async (taskId) => {
  const bid = await taskManagerContract.getCurrentBid(taskId);
  return bid;
};
```

---

## 9. UI/UX Considerations

### 9.1 Color Scheme
- **PoR Tasks:** Gold/Amber (`#FFD700`, `#FFA500`) - High priority
- **Duck Coin Tasks:** Standard white/light gray
- **Status Badges:**
  - Unassigned: Blue
  - Ongoing: Green
  - Completed: Gray
  - Disputed: Red
  - Cancelled: Dark gray

### 9.2 Credit Score Display
- Show PoR balance as "Credit Score"
- Professors: Show "Professor" badge + PoR amount
- Students: Show PoR amount only
- Format: "Credit: 50 PoR" or "Professor (100 PoR)"

### 9.3 Task Card Layout
```
┌─────────────────────────────────────┐
│ [PoR Badge] Task #123              │
│ Description: ...                   │
│ Creator: 0x... (Credit: 50 PoR)   │
│ Reward: 10 PoR                     │
│ Current Bid: 50 DC                │ ← Live display
│ ⏰ Accept Deadline: 18h 23m       │ ← Countdown timer
│ Status: Unassigned                 │
│ [Place Bid] [View Details]         │
└─────────────────────────────────────┘
```

---

## 10. Implementation Phases

### Phase 1: Core Smart Contract (Week 1)
- [ ] Create `TaskManager.sol`
- [ ] Implement task creation
- [ ] Implement bidding system
- [ ] Implement task assignment
- [ ] Implement task completion
- [ ] Add PoR transfer permissions to `ProveOfReputation.sol`
- [ ] Write tests

### Phase 2: Role Management (Week 1)
- [ ] Add professor/student roles to `StudentManagement.sol`
- [ ] Update access control
- [ ] Test role-based permissions

### Phase 3: Frontend - Basic UI (Week 2)
- [ ] Create TaskList component structure
- [ ] Implement CreateTask form
- [ ] Implement TaskCard component
- [ ] Implement UnassignedTasks view
- [ ] Basic styling and color coding

### Phase 4: Frontend - Bidding & Assignment (Week 2)
- [ ] Implement BidModal
- [ ] Implement bid placement
- [ ] Implement bid acceptance
- [ ] Update task status display

### Phase 5: Frontend - Task Management (Week 3)
- [ ] Implement OngoingTasks view
- [ ] Implement MyTasks view
- [ ] Implement task completion
- [ ] Add file upload (IPFS)

### Phase 6: Dispute System (Week 3)
- [ ] Implement dispute reporting
- [ ] Implement dispute resolution (admin)
- [ ] Add PoR slashing logic
- [ ] Update UI for disputes

### Phase 7: Polish & Testing (Week 4)
- [ ] Credit score display
- [ ] Error handling
- [ ] Loading states
- [ ] Integration testing
- [ ] UI/UX refinements

---

## 11. Security Considerations

### 11.1 Access Control
- ✅ Only whitelisted users can create tasks
- ✅ Only professors can create PoR reward tasks
- ✅ Only task creator can accept bids
- ✅ Only task creator can complete task
- ✅ Only task taker can report dispute
- ✅ Only owner can resolve disputes

### 11.2 Reentrancy Protection
- Use `ReentrancyGuard` for critical functions
- Follow checks-effects-interactions pattern

### 11.3 Input Validation
- Validate all string inputs (description, fileHash)
- Validate reward amounts > 0
- Validate PoR balance before task creation

### 11.4 Frontend Validation
- Client-side validation before contract calls
- Show clear error messages
- Prevent double submissions

---

## 12. Gas Optimization

### 12.1 Batch Operations
- Consider batch functions for multiple queries
- Use events for off-chain indexing

### 12.2 Storage Optimization
- Use `uint256` for timestamps (not `uint256` for everything)
- Pack structs efficiently
- Use mappings instead of arrays where possible

### 12.3 View Functions
- All query functions should be `view` or `pure`
- No state changes in query functions

---

## 13. Testing Strategy

### 13.1 Unit Tests
- Task creation (both reward types)
- Bidding mechanism
- Bid acceptance
- Task completion
- Dispute reporting and resolution

### 13.2 Integration Tests
- End-to-end task flow
- Role-based access control
- PoR locking and transfer
- Duck Coin staking and burning

### 13.3 Frontend Tests
- Component rendering
- Form validation
- Contract interaction
- Error handling

---

## 14. Deployment Checklist

### Smart Contracts
- [ ] Deploy `TaskManager.sol`
- [ ] Update `ProveOfReputation.sol` with taskManager role
- [ ] Update `StudentManagement.sol` with professor roles
- [ ] Link contracts
- [ ] Verify contracts on block explorer
- [ ] Extract ABIs

### Frontend
- [ ] Update `config.js` with TaskManager address
- [ ] Update `useContract.js` to include TaskManager
- [ ] Update `App.jsx` with TaskList tab
- [ ] Deploy frontend
- [ ] Test all flows

---

## 15. Future Enhancements

1. **Task Categories/Tags**
2. **Task Ratings/Reviews**
3. **Recurring Tasks**
4. **Task Templates**
5. **Multi-party Tasks**
6. **Task Escalation System**
7. **Analytics Dashboard**

---

## 16. Questions & Decisions Needed

1. **PoR Transfer Mechanism:** How to handle PoR locking since it's non-transferable?
   - **Decision:** Add `taskManager` role to PoR contract

2. **Professor Identification:** Use PoR threshold or explicit role?
   - **Decision:** Explicit role in StudentManagement (more flexible)

3. **File Storage:** IPFS, centralized, or on-chain?
   - **Decision:** IPFS (decentralized, cost-effective)

4. **Dispute Resolution:** Automated or manual?
   - **Decision:** Manual (admin resolves) - can be automated later

5. **Bid Refund:** Automatic on accept or manual?
   - **Decision:** Automatic (refund all except accepted)

---

## Conclusion

This plan provides a comprehensive roadmap for implementing the Task List feature. The single contract approach is recommended for simplicity and efficiency. The implementation should be done in phases, starting with core smart contract functionality and gradually building out the frontend features.

**Estimated Timeline:** 4 weeks
**Complexity:** Medium-High
**Dependencies:** StudentManagement, DuckCoin, ProveOfReputation contracts

