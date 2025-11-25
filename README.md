# Onchain Performance Metric System (OPMS)

> Turning real work, character, and collaboration into on-chain reputation.

This project is an on-chain performance metric system for the Stevens community.  
Professors and students are whitelisted by their Stevens identity, and every task, bid, and reward becomes part of a transparent, tamper-resistant record of performance.

Grades fade. A resume can be embellished.  
But a history of **real work done, stakes taken, and reputation earned** on-chain is hard to fake.

---

## Architecture Overview

```mermaid
flowchart TD
    A[StudentManagement.sol<br>Whitelisting / Roles / Stevens IDs]
    P[Professors (whitelisted)]
    S[Students (whitelisted)]
    POR[ProofOfReputation (ERC721 SBT)]
    TM[TaskManager.sol]
    DC[DuckCoin (ERC20)]
    LP[LendingPool.sol]
    LQ[Liquidity Layer<br>AMM.sol + SHIFT.sol]

    A --> P
    A --> S
    P --> TM
    S --> TM
    TM --> POR
    TM --> DC
    DC --> TM
    POR --> LP
    LP --> DC
    DC --> LQ
    LQ --> DC


---

## Core Ideas

### 1. Whitelisted Academic Community

- `StudentManagement.sol` binds **Stevens IDs** to on-chain addresses.
- Professors and students are explicitly whitelisted.
- Roles are enforced on-chain: only professors can grant **Proof of Reputation (PoR)**.

This keeps the system **closed, accountable, and academically grounded**.

---

### 2. Proof of Reputation (PoR): Performance as a Soulbound Asset

- `ProofOfReputation.sol` is an **ERC721 soulbound token**:
  - Non-transferable.
  - Minted / adjusted under professor authority.
- Each student accumulates PoR by:
  - Winning task bids.
  - Delivering quality work.
  - Being recognized by professors and peers.

High PoR is meant to matter **beyond the chain**:
- Research opportunities.
- Internships, job market signaling.
- A quiet but powerful form of dignity and earned trust.

---

### 3. DuckCoin (DC): Skin in the Game

- `DuckCoin.sol` is an ERC20 token used to **bid on tasks** and create economic signals.
- When students bid on a task, the DC they bid is **burned whether they win or lose**.

This burning mechanism serves three purposes:

1. **Commitment signal**  
   Higher bids show seriousness and confidence in doing the work.

2. **Supply control**  
   Bidding constantly removes DC from circulation.

3. **Real demand**  
   Because DC is needed to participate in the task economy, students seek it out, earn it, buy it, or borrow it.

Without this demand, there is no real reason for exchanges or lending to exist.

---

### 4. TaskManager.sol: The Heart of the Economy

- Professors and students can create tasks (homework, projects, research help, peer-review, micro-tasks, etc.).
- Students bid DuckCoin to apply.
- Bids are burned, so every attempt leaves a trace of commitment.
- Once work is delivered, **professors allocate PoR** to the selected student(s).

This is where **effort turns into reputation**, and where **tokens meet meaning**.

---

### 5. Liquidity & Credit: AMM, CEX, and Lending

Since DuckCoin is needed to bid, students may:

- **Swap** into DC via:
  - `AMM.sol` – a decentralized exchange (DEX) using an automated market maker.
  - `SHIFT.sol` – a centralized exchange (CEX) with an order book.

- **Borrow DC** via:
  - `LendingPool.sol` – students stake their PoR to borrow DuckCoin.
  - Higher PoR can unlock better borrowing conditions, so your **history of good work literally backs your credit**.

This makes PoR more than a badge: it becomes **economic gravity**.

---

## Smart Contract Summary

- `StudentManagement.sol` – Whitelisting, roles, mappings to Stevens IDs.
- `ProofOfReputation.sol` – ERC721 SBT, non-transferable student reputation.
- `DuckCoin.sol` – ERC20 token used for bids, burned on bidding.
- `TaskManager.sol` – Task creation, bidding, PoR reward routing.
- `AMM.sol` – On-chain DEX for DuckCoin liquidity.
- `SHIFT.sol` – CEX-style exchange for DuckCoin.
- `LendingPool.sol` – Borrow DuckCoin against staked PoR.

---

## Why It Matters

This system is not “just another token stack.”  
It’s an attempt to encode something we actually care about:

- **Doing the work.**
- **Standing behind your effort with real stakes.**
- **Building a reputation that follows you because you earned it, not because you said so.**

If you’re a professor, you get a transparent, programmable way to recognize real performance.  
If you’re a student, every task becomes a chance to prove who you are – in a way that outlives a single semester.

Welcome to the on-chain performance metric system.  
Where work, risk, and reputation finally live in the same place.
