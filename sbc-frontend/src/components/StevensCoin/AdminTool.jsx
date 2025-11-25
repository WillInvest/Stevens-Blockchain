import { useState } from "react";
import { ethers } from "ethers";
import { cardStyle, stevensRed, stevensTextGrey, buttonStyle, inputStyle } from "../../styles/constants";

export default function AdminTool({ contract }) {
  const [newStudent, setNewStudent] = useState({
    wallet: "",
    name: "",
    id: ""
  });
  const [deleteStudentId, setDeleteStudentId] = useState("");
  const [mintData, setMintData] = useState({
    wallet: "",
    amount: ""
  });
  const [burnData, setBurnData] = useState({
    wallet: "",
    amount: ""
  });
  const [activeAdminSubTab, setActiveAdminSubTab] = useState("addUpdate");

  // ---------------- ADD STUDENT ----------------
  async function addStudent() {
    if (!ethers.isAddress(newStudent.wallet)) return alert("Invalid wallet address");
    if (!newStudent.name || !newStudent.id) return alert("Please fill all fields");

    try {
      const studentId = BigInt(newStudent.id);
      const existing = await contract.getStudentById(studentId);
      if (existing.wallet !== ethers.ZeroAddress) {
        const ok = confirm(
          `⚠️ Student exists:\nName: ${existing.name}\nWallet: ${existing.wallet}\n\nOverwrite?`
        );
        if (!ok) return;
      }

      const tx = await contract.addStudent(
        newStudent.wallet,
        newStudent.name,
        studentId
      );
      await tx.wait();

      alert("✅ Student added!");
      setNewStudent({ wallet: "", name: "", id: "" });
    } catch (err) {
      alert("❌ Failed to add student: " + (err.message || "Unknown error"));
    }
  }

  // ---------------- DELETE STUDENT ----------------
  async function deleteStudent() {
    if (!deleteStudentId) return alert("Please enter a student ID");

    const ok = confirm(`⚠️ Are you sure you want to delete student ID ${deleteStudentId}?`);
    if (!ok) return;

    try {
      const tx = await contract.removeStudent(BigInt(deleteStudentId));
      await tx.wait();
      alert("🗑️ Student removed!");
      setDeleteStudentId("");
    } catch (err) {
      alert("❌ Delete failed: " + (err.message || "Unknown error"));
    }
  }

  // ---------------- MINT ----------------
  async function mintTokens() {
    if (!mintData.wallet) return alert("Please enter a recipient wallet address");
    if (!mintData.amount) return alert("Please enter an amount");
    
    if (!ethers.isAddress(mintData.wallet)) return alert("Invalid wallet address");
    if (isNaN(mintData.amount) || parseFloat(mintData.amount) <= 0) {
      return alert("Invalid amount");
    }

    try {
      const tx = await contract.mint(mintData.wallet, ethers.parseEther(mintData.amount));
      await tx.wait();
      alert(`✅ Minted ${mintData.amount} SBC to ${mintData.wallet}`);
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

    const ok = confirm(`⚠️ Are you sure you want to burn ${burnData.amount} SBC from ${burnData.wallet}?`);
    if (!ok) return;

    try {
      const tx = await contract.burn(burnData.wallet, ethers.parseEther(burnData.amount));
      await tx.wait();
      alert(`🔥 Burned ${burnData.amount} SBC from ${burnData.wallet}`);
      setBurnData({ wallet: "", amount: "" });
    } catch (err) {
      alert("❌ Burn failed: " + (err.message || "Insufficient balance"));
    }
  }

  return (
    <div>
      {/* ADMIN SUB-TAB NAVIGATION */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
        borderBottom: `2px solid ${stevensRed}`,
        paddingBottom: 0
      }}>
        {[
          { id: "addUpdate", label: "➕ Add/Update", icon: "➕" },
          { id: "delete", label: "🗑️ Delete", icon: "🗑️" },
          { id: "mint", label: "🪙 Mint", icon: "🪙" },
          { id: "burn", label: "🔥 Burn", icon: "🔥" }
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setActiveAdminSubTab(subTab.id)}
            style={{
              padding: "10px 18px",
              border: "none",
              background: activeAdminSubTab === subTab.id ? stevensRed : "transparent",
              color: activeAdminSubTab === subTab.id ? "white" : stevensRed,
              fontWeight: activeAdminSubTab === subTab.id ? 700 : 500,
              fontSize: 12,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: activeAdminSubTab === subTab.id ? `3px solid ${stevensRed}` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
              borderRadius: "6px 6px 0 0"
            }}
            onMouseEnter={(e) => {
              if (activeAdminSubTab !== subTab.id) {
                e.target.style.background = "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeAdminSubTab !== subTab.id) {
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
        {/* ADD/UPDATE SUB-TAB */}
        {activeAdminSubTab === "addUpdate" && (
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
              Add / Update Student
            </h3>

            <input
              placeholder="Wallet Address"
              value={newStudent.wallet}
              onChange={(e) =>
                setNewStudent({ ...newStudent, wallet: e.target.value })
              }
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />

            <input
              placeholder="Student Name"
              value={newStudent.name}
              onChange={(e) =>
                setNewStudent({ ...newStudent, name: e.target.value })
              }
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />

            <input
              placeholder="Student ID"
              value={newStudent.id}
              onChange={(e) =>
                setNewStudent({ ...newStudent, id: e.target.value })
              }
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />

            <button 
              onClick={addStudent} 
              style={{
                ...buttonStyle,
                marginTop: 8,
                marginRight: 0,
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
              Add Student
            </button>
          </>
        )}

        {/* DELETE SUB-TAB */}
        {activeAdminSubTab === "delete" && (
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
              🗑️ Delete Student
            </h3>
            <p style={{ marginBottom: 20, color: stevensTextGrey }}>
              Remove a student from the whitelist by their Student ID.
            </p>
            <input
              placeholder="Student ID"
              value={deleteStudentId}
              onChange={(e) => setDeleteStudentId(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <button 
              onClick={deleteStudent} 
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
              Delete Student
            </button>
          </>
        )}

        {/* MINT SUB-TAB */}
        {activeAdminSubTab === "mint" && (
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
              🪙 Mint Tokens
            </h3>
            <p style={{ marginBottom: 20, color: stevensTextGrey }}>
              Create new SBC tokens and add them to a whitelisted student's wallet.
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
        {activeAdminSubTab === "burn" && (
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
              🔥 Burn Tokens
            </h3>
            <p style={{ marginBottom: 20, color: stevensTextGrey }}>
              Permanently remove SBC tokens from a wallet address.
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
      </div>
    </div>
  );
}


