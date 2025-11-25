import { useState, useEffect } from "react";
import SupplyCard from "./SupplyCard";
import { cardStyle, stevensTextGrey } from "../../styles/constants";

// Mock data
const MOCK_SUPPLIES = [
  {
    supplyId: 1,
    dcSupplied: "500",
    currentAPY: 0.055,
    totalEarned: "25.5",
    suppliedAt: Date.now() - 86400000 * 30, // 30 days ago
    lastUpdated: Date.now()
  },
  {
    supplyId: 2,
    dcSupplied: "200",
    currentAPY: 0.055,
    totalEarned: "10.2",
    suppliedAt: Date.now() - 86400000 * 15, // 15 days ago
    lastUpdated: Date.now()
  }
];

export default function MySupplies({ wallet, refreshTrigger }) {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplies = async () => {
      setLoading(true);
      try {
        // TODO: Fetch from contract
        // const userSupplies = await lendingContract.getUserSupplies(wallet);
        // setSupplies(userSupplies);

        // Mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setSupplies(MOCK_SUPPLIES);
      } catch (error) {
        console.error("Error fetching supplies:", error);
        setSupplies([]);
      } finally {
        setLoading(false);
      }
    };

    if (wallet) {
      fetchSupplies();
    }
  }, [wallet, refreshTrigger]);

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          Loading your supplies...
        </div>
      </div>
    );
  }

  if (supplies.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          You don't have any active supplies yet. Start lending to earn interest!
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gap: 16
    }}>
      {supplies.map(supply => (
        <SupplyCard
          key={supply.supplyId}
          supply={supply}
          onWithdraw={() => {
            // Refresh supplies after withdrawal
            setSupplies([...MOCK_SUPPLIES]);
          }}
        />
      ))}
    </div>
  );
}

