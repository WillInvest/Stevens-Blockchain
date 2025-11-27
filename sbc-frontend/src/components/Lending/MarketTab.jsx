import { useState, useEffect } from "react";
import LoanCard from "./LoanCard";
import { cardStyle, stevensRed, stevensTextGrey } from "../../styles/constants";

// Mock data
const MOCK_ACTIVE_LOANS = [
  {
    loanId: 1,
    lender: "0x1234...5678",
    borrower: "0xABCD...EFGH",
    porStaked: "150",
    dcAmount: "750",
    interestRate: 0.055,
    status: "Active",
    createdAt: Date.now() - 86400000 * 10
  },
  {
    loanId: 2,
    lender: "0x9876...5432",
    borrower: "0xWXYZ...1234",
    porStaked: "80",
    dcAmount: "400",
    interestRate: 0.055,
    status: "Active",
    createdAt: Date.now() - 86400000 * 5
  },
  {
    loanId: 3,
    lender: "0x5555...6666",
    borrower: "0x7777...8888",
    porStaked: "200",
    dcAmount: "1000",
    interestRate: 0.055,
    status: "Active",
    createdAt: Date.now() - 86400000 * 15
  }
];

export default function MarketTab({ wallet, duckCoinContract, nftContract }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, lenders, borrowers

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      try {
        // TODO: Fetch from contract
        // const allLoans = await lendingContract.getAllActiveLoans();
        // setLoans(allLoans);

        // Mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoans(MOCK_ACTIVE_LOANS);
      } catch (error) {
        console.error("Error fetching loans:", error);
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [duckCoinContract, nftContract]);

  const filteredLoans = loans.filter(loan => {
    if (filter === "all") return true;
    if (filter === "lenders" && wallet) {
      return loan.lender?.toLowerCase() === wallet?.toLowerCase();
    }
    if (filter === "borrowers" && wallet) {
      return loan.borrower?.toLowerCase() === wallet?.toLowerCase();
    }
    return true;
  });

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          Loading market data...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{
        marginBottom: 20,
        color: stevensRed,
        fontSize: 18,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}>
        📊 Lending Market Overview
      </h3>

      {/* Market Stats */}
      <div style={{
        ...cardStyle,
        marginBottom: 24
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
              Total Active Loans
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: stevensRed }}>
              {loans.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
              Total Lenders
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#10B981" }}>
              {new Set(loans.map(l => l.lender)).size}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
              Total Borrowers
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#F59E0B" }}>
              {new Set(loans.map(l => l.borrower)).size}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      {wallet && (
        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 20
        }}>
          {[
            { id: "all", label: "All Loans" },
            { id: "lenders", label: "My Lendings" },
            { id: "borrowers", label: "My Borrowings" }
          ].map(option => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              style={{
                padding: "8px 16px",
                border: "none",
                background: filter === option.id ? stevensRed : "#E5E7EB",
                color: filter === option.id ? "white" : "#374151",
                fontWeight: filter === option.id ? 600 : 500,
                fontSize: 12,
                cursor: "pointer",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                transition: "all 0.2s ease"
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Active Loans List */}
      {filteredLoans.length === 0 ? (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
            No active loans found.
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gap: 16
        }}>
          {filteredLoans.map(loan => (
            <LoanCard
              key={loan.loanId}
              loan={loan}
              wallet={wallet}
            />
          ))}
        </div>
      )}
    </div>
  );
}


