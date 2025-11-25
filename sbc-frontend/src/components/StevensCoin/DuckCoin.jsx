import { useState } from "react";
import { ethers } from "ethers";
import { cardStyle, stevensRed, stevensTextGrey, buttonStyle, inputStyle } from "../../styles/constants";

export default function DuckCoin({ contract, duckCoinContract, wallet, contractAddress }) {
  const [activeSubTab, setActiveSubTab] = useState("mint");
  const [mintData, setMintData] = useState({
    wallet: "",
    amount: ""
  });
  const [burnData, setBurnData] = useState({
    wallet: "",
    amount: ""
  });
  const [transferData, setTransferData] = useState({
    wallet: "",
    amount: ""
  });

  // ---------------- MINT ----------------
  async function mintTokens() {
    if (!mintData.wallet) return alert("Please enter a recipient wallet address");
    if (!mintData.amount) return alert("Please enter an amount");
    
    if (!ethers.isAddress(mintData.wallet)) return alert("Invalid wallet address");
    if (isNaN(mintData.amount) || parseFloat(mintData.amount) <= 0) {
      return alert("Invalid amount");
    }

    try {
      // Use StudentManagement contract if available, otherwise use old contract
      const contractToUse = contract;
      const tx = await contractToUse.mintDuckCoin(mintData.wallet, ethers.parseEther(mintData.amount));
      await tx.wait();
      alert(`✅ Minted ${mintData.amount} Duck Coin to ${mintData.wallet}`);
      setMintData({ wallet: "", amount: "" });
    } catch (err) {
      const errorMsg = err.message || err.reason || String(err);
      if (errorMsg.includes("not whitelisted") || errorMsg.includes("Recipient not whitelisted")) {
        alert(`❌ Mint failed: Recipient ${mintData.wallet} is not whitelisted.\n\nPlease add them as a student first using "Add / Update Student".`);
      } else {
        alert("❌ Mint failed: " + errorMsg);
      }
    }
  }

  // ---------------- BURN ----------------
  async function burnTokens() {
    if (!burnData.wallet) return alert("Please enter a wallet address");
    if (!burnData.amount) return alert("Please enter an amount");
    
    if (!ethers.isAddress(burnData.wallet)) return alert("Invalid wallet address");
    if (isNaN(burnData.amount) || parseFloat(burnData.amount) <= 0) {
      return alert("Invalid amount");
    }

    const ok = confirm(`⚠️ Are you sure you want to burn ${burnData.amount} Duck Coin from ${burnData.wallet}?`);
    if (!ok) return;

    try {
      const contractToUse = contract;
      const tx = await contractToUse.burnDuckCoin(burnData.wallet, ethers.parseEther(burnData.amount));
      await tx.wait();
      alert(`🔥 Burned ${burnData.amount} Duck Coin from ${burnData.wallet}`);
      setBurnData({ wallet: "", amount: "" });
    } catch (err) {
      alert("❌ Burn failed: " + (err.message || "Insufficient balance"));
    }
  }

  // ---------------- TRANSFER ----------------
  async function transferTokens() {
    if (!transferData.wallet) return alert("Please enter a recipient wallet address");
    if (!transferData.amount) return alert("Please enter an amount");
    
    if (!ethers.isAddress(transferData.wallet)) return alert("Invalid address");
    if (isNaN(transferData.amount) || parseFloat(transferData.amount) <= 0) {
      return alert("Invalid amount");
    }

    try {
      // For transfer, use the DuckCoin contract directly if available, otherwise use StudentManagement
      if (duckCoinContract) {
        const tx = await duckCoinContract.transfer(transferData.wallet, ethers.parseEther(transferData.amount));
        await tx.wait();
        alert(`✅ Transferred ${transferData.amount} Duck Coin to ${transferData.wallet}`);
      } else {
        // Fallback to old contract
        const tx = await contract.transfer(transferData.wallet, ethers.parseEther(transferData.amount));
        await tx.wait();
        alert(`✅ Transferred ${transferData.amount} Duck Coin to ${transferData.wallet}`);
      }
      setTransferData({ wallet: "", amount: "" });
    } catch (err) {
      const errorMsg = err.message || err.reason || String(err);
      if (errorMsg.includes("not whitelisted") || errorMsg.includes("Recipient not whitelisted")) {
        alert(`❌ Transfer failed: Recipient ${transferData.wallet} is not whitelisted.\n\nPlease add them as a student first.`);
      } else {
        alert("❌ Transfer failed: " + errorMsg);
      }
    }
  }

  return (
    <div>
      {/* DUCK COIN SUB-TAB NAVIGATION */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
        borderBottom: `2px solid ${stevensRed}`,
        paddingBottom: 0
      }}>
        {[
          { id: "mint", label: "🪙 Mint", icon: "🪙" },
          { id: "burn", label: "🔥 Burn", icon: "🔥" },
          { id: "transfer", label: "💸 Transfer", icon: "💸" }
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

      {/* SUB-TAB CONTENT */}
      <div style={cardStyle}>
        {/* MINT SUB-TAB */}
        {activeSubTab === "mint" && (
          <>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: 20, 
              color: stevensRed,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              🪙 Mint Duck Coin
            </h3>
            <p style={{ marginBottom: 20, color: stevensTextGrey }}>
              Create new Duck Coin tokens and add them to a whitelisted student's wallet.
            </p>
            <input
              placeholder="Recipient Wallet Address"
              value={mintData.wallet}
              onChange={(e) => setMintData({ ...mintData, wallet: e.target.value })}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <input
              placeholder="Amount to Mint"
              value={mintData.amount}
              onChange={(e) => setMintData({ ...mintData, amount: e.target.value })}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <button 
              onClick={mintTokens} 
              style={{
                ...buttonStyle,
                marginTop: 8,
                width: "100%",
                background: stevensRed,
                color: "white"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
                e.target.style.background = "#8B1E2E";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
                e.target.style.background = stevensRed;
              }}
            >
              Mint Tokens
            </button>
          </>
        )}

        {/* BURN SUB-TAB */}
        {activeSubTab === "burn" && (
          <>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: 20, 
              color: stevensRed,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              🔥 Burn Duck Coin
            </h3>
            <p style={{ marginBottom: 20, color: stevensTextGrey }}>
              Permanently remove Duck Coin tokens from a wallet address.
            </p>
            <input
              placeholder="Wallet Address to Burn From"
              value={burnData.wallet}
              onChange={(e) => setBurnData({ ...burnData, wallet: e.target.value })}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <input
              placeholder="Amount to Burn"
              value={burnData.amount}
              onChange={(e) => setBurnData({ ...burnData, amount: e.target.value })}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <button 
              onClick={burnTokens} 
              style={{
                ...buttonStyle,
                marginTop: 8,
                width: "100%",
                background: "#8B1E2E",
                color: "white"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 8px rgba(139, 30, 46, 0.4)";
                e.target.style.background = "#6B151F";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(139, 30, 46, 0.3)";
                e.target.style.background = "#8B1E2E";
              }}
            >
              Burn Tokens
            </button>
          </>
        )}

        {/* TRANSFER SUB-TAB */}
        {activeSubTab === "transfer" && (
          <>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: 20, 
              color: stevensRed,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              💸 Transfer Duck Coin
            </h3>
            <p style={{ marginBottom: 20, color: stevensTextGrey }}>
              Transfer Duck Coin tokens from your wallet to another whitelisted address.
            </p>
            <input
              placeholder="Recipient Wallet Address"
              value={transferData.wallet}
              onChange={(e) => setTransferData({ ...transferData, wallet: e.target.value })}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <input
              placeholder="Amount"
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <button 
              onClick={transferTokens} 
              style={{
                ...buttonStyle,
                marginTop: 8,
                width: "100%",
                background: stevensRed,
                color: "white"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
                e.target.style.background = "#8B1E2E";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
                e.target.style.background = stevensRed;
              }}
            >
              Transfer Tokens
            </button>
          </>
        )}
      </div>

      {/* Contract Address */}
      <div style={{
        marginTop: 24,
        padding: "12px 16px",
        background: "#f8f9fa",
        borderRadius: 6,
        border: "1px solid #e9ecef"
      }}>
        <span style={{ fontSize: 12, color: stevensTextGrey, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Duck Coin Contract Address:{" "}
        </span>
        <span style={{ fontSize: 12, fontFamily: "monospace", color: stevensRed, fontWeight: 600 }}>
          {contractAddress || (duckCoinContract?.target || duckCoinContract?.address) || (contract?.target || contract?.address) || "Not deployed"}
        </span>
      </div>
    </div>
  );
}

