import { useState } from "react";
import AMM from "./AMM";
import SHIFT from "./SHIFT";
import { stevensRed } from "../../styles/constants";

export default function Exchange({ contract, duckCoinContract, nftContract }) {
  const [activeSubTab, setActiveSubTab] = useState("amm");

  return (
    <div>
      {/* Subtabs */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        borderBottom: `2px solid ${stevensRed}`,
        paddingBottom: 0
      }}>
        {[
          { id: "amm", label: "AMM" },
          { id: "shift", label: "SHIFT" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "12px 24px",
              border: "none",
              background: activeSubTab === tab.id ? stevensRed : "transparent",
              color: activeSubTab === tab.id ? "white" : stevensRed,
              fontWeight: activeSubTab === tab.id ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: activeSubTab === tab.id ? `3px solid ${stevensRed}` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
              borderRadius: "6px 6px 0 0"
            }}
            onMouseEnter={(e) => {
              if (activeSubTab !== tab.id) {
                e.target.style.background = "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeSubTab !== tab.id) {
                e.target.style.background = "transparent";
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subtab Content */}
      <div>
        {activeSubTab === "amm" && (
          <AMM contract={contract} duckCoinContract={duckCoinContract} nftContract={nftContract} />
        )}
        {activeSubTab === "shift" && (
          <SHIFT contract={contract} duckCoinContract={duckCoinContract} nftContract={nftContract} />
        )}
      </div>
    </div>
  );
}


