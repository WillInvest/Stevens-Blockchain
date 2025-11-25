import { useState } from "react";
import { ethers } from "ethers";
import { cardStyle, stevensRed, stevensTextGrey, buttonStyle, inputStyle } from "../../styles/constants";

export default function TransferCoin({ contract, wallet }) {
  const [transferData, setTransferData] = useState({
    wallet: "",
    amount: ""
  });

  // ---------------- TRANSFER ----------------
  async function transferTokens() {
    if (!transferData.wallet) return alert("Please enter a recipient wallet address");
    if (!transferData.amount) return alert("Please enter an amount");
    
    if (!ethers.isAddress(transferData.wallet)) return alert("Invalid address");
    if (isNaN(transferData.amount) || parseFloat(transferData.amount) <= 0) {
      return alert("Invalid amount");
    }

    try {
      const tx = await contract.transfer(transferData.wallet, ethers.parseEther(transferData.amount));
      await tx.wait();
      alert(`✅ Transferred ${transferData.amount} SBC to ${transferData.wallet}`);
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
    <div style={cardStyle}>
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: 20, 
        color: stevensRed,
        fontSize: 20,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}>
        💸 Transfer Coin
      </h3>
      <p style={{ marginBottom: 20, color: stevensTextGrey }}>
        Transfer SBC tokens from your wallet to another whitelisted address.
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
    </div>
  );
}




