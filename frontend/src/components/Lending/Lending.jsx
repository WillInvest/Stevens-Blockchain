import { useState } from "react";
import LendingDashboard from "./LendingDashboard";
import SupplyTab from "./SupplyTab";
import BorrowTab from "./BorrowTab";
import MarketTab from "./MarketTab";
import { stevensRed } from "../../styles/constants";

export default function Lending({ 
  wallet, 
  contract, 
  duckCoinContract, 
  nftContract,
  studentManagementContract 
}) {
  const [activeTab, setActiveTab] = useState("supply");

  return (
    <div>
      {/* Dashboard Metrics */}
      <LendingDashboard
        wallet={wallet}
        duckCoinContract={duckCoinContract}
        nftContract={nftContract}
      />

      {/* Tabs Navigation */}
      <div style={{
        display: "flex",
        gap: 8,
        marginTop: 32,
        marginBottom: 24,
        borderBottom: `2px solid ${stevensRed}`,
        paddingBottom: 0
      }}>
        {[
          { id: "supply", label: "💚 Supply (Lend)", icon: "💚" },
          { id: "borrow", label: "🟠 Borrow", icon: "🟠" },
          { id: "market", label: "📊 Market", icon: "📊" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 24px",
              border: "none",
              background: activeTab === tab.id ? stevensRed : "transparent",
              color: activeTab === tab.id ? "white" : stevensRed,
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: activeTab === tab.id ? `3px solid ${stevensRed}` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
              borderRadius: "6px 6px 0 0"
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.background = "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.background = "transparent";
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "supply" && (
          <SupplyTab
            wallet={wallet}
            duckCoinContract={duckCoinContract}
            nftContract={nftContract}
          />
        )}
        {activeTab === "borrow" && (
          <BorrowTab
            wallet={wallet}
            duckCoinContract={duckCoinContract}
            nftContract={nftContract}
          />
        )}
        {activeTab === "market" && (
          <MarketTab
            wallet={wallet}
            duckCoinContract={duckCoinContract}
            nftContract={nftContract}
          />
        )}
      </div>
    </div>
  );
}
