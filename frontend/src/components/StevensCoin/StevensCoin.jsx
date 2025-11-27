import { useState } from "react";
import StevensDuckCoin from "./StevensDuckCoin";
import StevensBananaCoin from "./StevensBananaCoin";
import StevensReputationProofCoin from "./StevensReputationProofCoin";
import { stevensRed, stevensTextGrey } from "../../styles/constants";
import { SBC_ADDRESS } from "../../contracts/config";

export default function StevensCoin({ contract, sbcContract, sdcContract, srpcContract, wallet }) {
  const [activeSubTab, setActiveSubTab] = useState("sdc");

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
          { id: "sdc", label: "🦆 SDC", icon: "🦆" },
          { id: "sbc", label: "🍌 SBC", icon: "🍌" },
          { id: "srpc", label: "🏆 SRPC", icon: "🏆" }
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
              fontSize: 18,
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

      {activeSubTab === "sdc" && (
        <StevensDuckCoin 
          contract={contract} 
          sdcContract={sdcContract}
          wallet={wallet} 
        />
      )}
      {activeSubTab === "sbc" && (
        <StevensBananaCoin 
          contract={contract} 
          sbcContract={sbcContract}
          wallet={wallet} 
        />
      )}
      {activeSubTab === "srpc" && (
        <StevensReputationProofCoin 
          contract={contract}
          srpcContract={srpcContract}
        />
      )}
    </div>
  );
}
