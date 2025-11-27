import { useState } from "react";
import { ethers } from "ethers";
import { cardStyle, stevensRed, stevensTextGrey, stevensDarkGrey, buttonStyle, inputStyle } from "../../styles/constants";

export default function StudentInfo({ contract, sbcContract, sdcContract, srpcContract }) {
  const [activeSubTab, setActiveSubTab] = useState("addUpdate");
  const [newStudent, setNewStudent] = useState({
    wallet: "",
    name: "",
    id: ""
  });
  const [deleteStudentId, setDeleteStudentId] = useState("");
  const [searchStudentId, setSearchStudentId] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [studentList, setStudentList] = useState([]);

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

  // ---------------- SEARCH BY ID ----------------
  async function searchById() {
    if (!searchStudentId) return alert("Please enter a student ID");

    try {
      const studentId = BigInt(searchStudentId);
      const info = await contract.getStudentById(studentId);
      
      if (info.wallet === ethers.ZeroAddress) {
        alert("❌ Student not found");
        setSearchStudentId("");
        return;
      }

      // Get SBC (Stevens Banana Coin) balance
      let sbcBalance = BigInt(0);
      if (sbcContract) {
        try {
          sbcBalance = await sbcContract.balanceOf(info.wallet);
        } catch (err) {
          console.warn("Could not fetch SBC balance:", err);
          // Fallback to old contract
          if (contract && contract.balanceOf) {
            sbcBalance = await contract.balanceOf(info.wallet);
          }
        }
      } else if (contract && contract.balanceOf) {
        // Fallback to old contract
        sbcBalance = await contract.balanceOf(info.wallet);
      }
      
      // Get SDC (Stevens Duck Coin) balance
      let sdcBalance = BigInt(0);
      if (sdcContract) {
        try {
          sdcBalance = await sdcContract.balanceOf(info.wallet);
        } catch (err) {
          console.warn("Could not fetch SDC balance:", err);
        }
      }
      
      // Get SRPC (Stevens Reputation Proof Coin) balance
      let srpcBalance = BigInt(0);
      if (srpcContract) {
        try {
          srpcBalance = await srpcContract.balanceOf(info.wallet);
        } catch (err) {
          console.warn("Could not fetch SRPC balance:", err);
        }
      }

      // Format balances to show reasonable decimals (max 6 decimal places)
      const formattedSbcBalance = parseFloat(ethers.formatEther(sbcBalance)).toFixed(6).replace(/\.?0+$/, '');
      const formattedSdcBalance = parseFloat(ethers.formatEther(sdcBalance)).toFixed(6).replace(/\.?0+$/, '');
      const formattedSrpcBalance = parseFloat(ethers.formatEther(srpcBalance)).toFixed(6).replace(/\.?0+$/, '');

      setStudentInfo({
        name: info.name,
        studentId: info.studentId.toString(),
        wallet: info.wallet,
        isWhitelisted: info.isWhitelisted,
        sbcBalance: formattedSbcBalance,
        sdcBalance: formattedSdcBalance,
        srpcBalance: formattedSrpcBalance
      });
      setSearchStudentId("");
    } catch (err) {
      alert("❌ Student not found: " + (err.message || "Invalid student ID"));
      setSearchStudentId("");
    }
  }

  // ---------------- LOAD ALL STUDENTS ----------------
  async function loadAllStudents() {
    if (!contract) {
      alert("❌ Contract not connected. Please connect your wallet first.");
      return;
    }

    if (!contract.getAllStudents) {
      alert("❌ Contract does not have getAllStudents function. Please ensure StudentManagement contract is connected.");
      return;
    }

    try {
      const list = await contract.getAllStudents();

    // Filter out students with zero address
    const validStudents = list.filter(s => 
      s.wallet && s.wallet !== ethers.ZeroAddress && s.wallet !== "0x0000000000000000000000000000000000000000"
    );

    // Remove duplicates based on student ID (keep first occurrence)
    const seenIds = new Set();
    const uniqueStudents = validStudents.filter(s => {
      const studentId = s.studentId.toString();
      if (seenIds.has(studentId)) {
        return false;
      }
      seenIds.add(studentId);
      return true;
    });

    const enriched = await Promise.all(
      uniqueStudents.map(async (s) => {
        // Get SBC (Stevens Banana Coin) balance
        let sbcBalance = BigInt(0);
        if (sbcContract) {
          try {
            sbcBalance = await sbcContract.balanceOf(s.wallet);
          } catch (err) {
            console.warn(`Could not fetch SBC balance for ${s.wallet}:`, err);
            // Fallback to old contract
            if (contract && contract.balanceOf) {
              sbcBalance = await contract.balanceOf(s.wallet);
            }
          }
        } else if (contract && contract.balanceOf) {
          // Fallback to old contract
          sbcBalance = await contract.balanceOf(s.wallet);
        }
        
        // Get SDC (Stevens Duck Coin) balance
        let sdcBalance = BigInt(0);
        if (sdcContract) {
          try {
            sdcBalance = await sdcContract.balanceOf(s.wallet);
          } catch (err) {
            console.warn(`Could not fetch SDC balance for ${s.wallet}:`, err);
          }
        }
        
        // Get SRPC (Stevens Reputation Proof Coin) balance
        let srpcBalance = BigInt(0);
        if (srpcContract) {
          try {
            srpcBalance = await srpcContract.balanceOf(s.wallet);
          } catch (err) {
            console.warn(`Could not fetch SRPC balance for ${s.wallet}:`, err);
          }
        }

        // Format balances to show reasonable decimals (max 6 decimal places)
        const formattedSbcBalance = parseFloat(ethers.formatEther(sbcBalance)).toFixed(6).replace(/\.?0+$/, '');
        const formattedSdcBalance = parseFloat(ethers.formatEther(sdcBalance)).toFixed(6).replace(/\.?0+$/, '');
        const formattedSrpcBalance = parseFloat(ethers.formatEther(srpcBalance)).toFixed(6).replace(/\.?0+$/, '');

        return {
          name: s.name,
          id: s.studentId.toString(),
          wallet: s.wallet,
          sbcBalance: formattedSbcBalance,
          sdcBalance: formattedSdcBalance,
          srpcBalance: formattedSrpcBalance
        };
      })
    );

    setStudentList(enriched);
    } catch (err) {
      console.error("Error loading all students:", err);
      alert("❌ Failed to load students: " + (err.message || "Unknown error") + "\n\nMake sure StudentManagement contract is connected and has students registered.");
      setStudentList([]);
    }
  }

  return (
    <div>
      {/* STUDENT INFO SUB-TAB NAVIGATION */}
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
          { id: "search", label: "🔍 Search", icon: "🔍" },
          { id: "showAll", label: "📋 Show All", icon: "📋" }
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
        {/* ADD/UPDATE SUB-TAB */}
        {activeSubTab === "addUpdate" && (
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
        {activeSubTab === "delete" && (
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

        {/* SEARCH SUB-TAB */}
        {activeSubTab === "search" && (
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
              🔍 Search Student
            </h3>
            <input
              placeholder="Student ID"
              value={searchStudentId}
              onChange={(e) => setSearchStudentId(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = stevensRed}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <button 
              onClick={searchById} 
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
              Search by Student ID
            </button>
            {studentInfo && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ color: stevensRed, marginBottom: 12 }}>Student Details</h4>
                <pre style={{ 
                  background: "#f8f9fa", 
                  padding: 20,
                  borderRadius: 8,
                  border: "1px solid #e9ecef",
                  overflow: "auto",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#495057"
                }}>
                  {JSON.stringify(studentInfo, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}

        {/* SHOW ALL SUB-TAB */}
        {activeSubTab === "showAll" && (
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
              📋 Load All Students
            </h3>
            <p style={{ marginBottom: 20, color: stevensTextGrey }}>
              Load and display all registered students from the blockchain.
            </p>
            <button 
              onClick={loadAllStudents} 
              style={{
                ...buttonStyle,
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
              Load All Students
            </button>
            {studentList.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ color: stevensRed, marginBottom: 16 }}>All Students ({studentList.length})</h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "white"
                  }}>
                    <thead>
                      <tr style={{ background: stevensRed }}>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>ID</th>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</th>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Wallet</th>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>SDC</th>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>SBC</th>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>SRPC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentList.map((s, i) => (
                        <tr 
                          key={i}
                          style={{
                            borderBottom: "1px solid #e9ecef",
                            transition: "background 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#fafafa"}
                          onMouseLeave={(e) => e.target.style.background = "white"}
                        >
                          <td style={{ padding: 12, fontSize: 14, color: stevensDarkGrey }}>{s.id}</td>
                          <td style={{ padding: 12, fontSize: 14, color: stevensDarkGrey, fontWeight: 500 }}>{s.name}</td>
                          <td style={{ padding: 12, fontSize: 12, color: stevensTextGrey, fontFamily: "monospace", wordBreak: "break-all" }}>{s.wallet}</td>
                          <td style={{ padding: 12, fontSize: 14, color: stevensRed, fontWeight: 600 }}>{s.sdcBalance} SDC</td>
                          <td style={{ padding: 12, fontSize: 14, color: stevensRed, fontWeight: 600 }}>{s.sbcBalance} SBC</td>
                          <td style={{ padding: 12, fontSize: 14, color: stevensRed, fontWeight: 600 }}>{s.srpcBalance} SRPC</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}




