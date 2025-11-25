import { useState } from "react";
import DuckCoin from "./DuckCoin";
import ProveOfReputation from "./ProveOfReputation";
import { stevensRed, stevensTextGrey } from "../../styles/constants";
import { SBC_ADDRESS } from "../../contracts/config";

export default function StevensCoin({ contract, duckCoinContract, nftContract, wallet }) {
  const [activeSubTab, setActiveSubTab] = useState("duckCoin");

  return (
    <div>
      {/* STEVENS COIN SUB-TAB NAVIGATION */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
        borderBottom: `2px solid ${stevensRed}`,
        paddingBottom: 0
      }}>
        {[
          { id: "duckCoin", label: "🦆 Duck Coin", icon: "🦆" },
          { id: "proveOfReputation", label: "🏆 Prove of Reputation", icon: "🏆" }
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setActiveSubTab(subTab.id)}
            style={{
              padding: "10px 18px",
              border: "none",
              background: activeSubTab === subTab.id ? stevensRed : "transparent",
              color: activeSubTab === subTab.id ? "white" : stevensRed,
              fontWeight: activeSubTab === subTab.id ? 700 : 500,
              fontSize: 12,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: activeSubTab === subTab.id ? `3px solid ${stevensRed}` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
              borderRadius: "6px 6px 0 0"
            }}
            onMouseEnter={(e) => {
              if (activeSubTab !== subTab.id) {
                e.target.style.background = "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeSubTab !== subTab.id) {
                e.target.style.background = "transparent";
              }
            }}
          >
            {subTab.label}
          </button>
        ))}
      </div>

      {/* Contract Address
      <div style={{
        marginBottom: 16,
        padding: "12px 16px",
        background: "#f8f9fa",
        borderRadius: 6,
        border: "1px solid #e9ecef"
      }}>
        <span style={{ fontSize: 12, color: stevensTextGrey, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Contract Address:{" "}
        </span>
        <span style={{ fontSize: 12, fontFamily: "monospace", color: stevensRed, fontWeight: 600 }}>
          {SBC_ADDRESS}
        </span>
      </div> */}

      {activeSubTab === "duckCoin" && (
        <DuckCoin 
          contract={contract} 
          duckCoinContract={duckCoinContract}
          wallet={wallet} 
        />
      )}
      {activeSubTab === "proveOfReputation" && (
        <ProveOfReputation 
          contract={contract}
          nftContract={nftContract}
        />
      )}
    </div>
  );
}

