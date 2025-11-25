import { useState } from "react";
import { ethers } from "ethers";
import { cardStyle, stevensRed, stevensTextGrey, stevensDarkGrey, buttonStyle, inputStyle } from "../../styles/constants";

export default function StudentInfo({ contract }) {
  const [searchStudentId, setSearchStudentId] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [studentList, setStudentList] = useState([]);

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

      const balance = await contract.balanceOf(info.wallet);

      setStudentInfo({
        name: info.name,
        studentId: info.studentId.toString(),
        wallet: info.wallet,
        isWhitelisted: info.isWhitelisted,
        balance: ethers.formatEther(balance)
      });
      setSearchStudentId("");
    } catch (err) {
      alert("❌ Student not found: " + (err.message || "Invalid student ID"));
      setSearchStudentId("");
    }
  }

  // ---------------- LOAD ALL STUDENTS ----------------
  async function loadAllStudents() {
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
      uniqueStudents.map(async (s) => ({
        name: s.name,
        id: s.studentId.toString(),
        wallet: s.wallet,
        balance: ethers.formatEther(await contract.balanceOf(s.wallet))
      }))
    );

    setStudentList(enriched);
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

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "2px solid #e0e0e0" }}>
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
                    <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Balance</th>
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
                      <td style={{ padding: 12, fontSize: 14, color: stevensRed, fontWeight: 600 }}>{s.balance} SBC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


