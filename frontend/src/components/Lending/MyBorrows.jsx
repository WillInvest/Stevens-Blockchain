import { useState, useEffect } from "react";
import BorrowCard from "./BorrowCard";
import { cardStyle, stevensTextGrey } from "../../styles/constants";

// Mock data
const MOCK_BORROWS = [
  {
    borrowId: 1,
    porCollateral: "200",
    dcBorrowed: "100",
    currentAPY: 0.091,
    totalOwed: "109.1",
    interestAccrued: "9.1",
    borrowedAt: Date.now() - 86400000 * 20, // 20 days ago
    lastUpdated: Date.now()
  }
];

export default function MyBorrows({ wallet, refreshTrigger }) {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrows = async () => {
      setLoading(true);
      try {
        // TODO: Fetch from contract
        // const userBorrows = await lendingContract.getUserBorrows(wallet);
        // setBorrows(userBorrows);

        // Mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setBorrows(MOCK_BORROWS);
      } catch (error) {
        console.error("Error fetching borrows:", error);
        setBorrows([]);
      } finally {
        setLoading(false);
      }
    };

    if (wallet) {
      fetchBorrows();
    }
  }, [wallet, refreshTrigger]);

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          Loading your borrows...
        </div>
      </div>
    );
  }

  if (borrows.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          You don't have any active borrows.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gap: 16
    }}>
      {borrows.map(borrow => (
        <BorrowCard
          key={borrow.borrowId}
          borrow={borrow}
          onRepay={() => {
            // Refresh borrows after repayment
            setBorrows([...MOCK_BORROWS]);
          }}
        />
      ))}
    </div>
  );
}


