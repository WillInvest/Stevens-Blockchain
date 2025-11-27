import { useState } from "react";
import { ethers } from "ethers";
import { cardStyle, stevensRed, stevensTextGrey, stevensDarkGrey, buttonStyle } from "../../styles/constants";

export default function AvailableAddresses({ contract }) {
  const [available, setAvailable] = useState([]);

  // ---------------- AVAILABLE ADDRESSES ----------------
  async function loadAvailableAddresses() {
    const res = await fetch("/addresses.txt");
    const text = await res.text();

    const raw = text.match(/0x[a-fA-F0-9]{40}/g) || [];
    const publicAddresses = raw.filter(addr => ethers.isAddress(addr));

    const onchain = await contract.getAllStudents();
    const used = onchain.map(s => s.wallet.toLowerCase());

    const unused = publicAddresses.filter(
      addr => !used.includes(addr.toLowerCase())
    );

    setAvailable(unused.slice(0, 3)); // show only top 3
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
        📇 Show Available Addresses
      </h3>
      <p style={{ marginBottom: 20, color: stevensTextGrey }}>
        Display wallet addresses that are available but not yet registered as students.
      </p>
      <button 
        onClick={loadAvailableAddresses} 
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
        Load Available Addresses
      </button>
      {available.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ color: stevensRed, marginBottom: 16 }}>Unused Wallet Addresses</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white"
            }}>
              <thead>
                <tr style={{ background: stevensRed }}>
                  <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>#</th>
                  <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Address</th>
                </tr>
              </thead>
              <tbody>
                {available.map((addr, i) => (
                  <tr 
                    key={i}
                    style={{
                      borderBottom: "1px solid #e9ecef"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#fafafa"}
                    onMouseLeave={(e) => e.target.style.background = "white"}
                  >
                    <td style={{ padding: 10, fontSize: 13, color: stevensDarkGrey, fontWeight: 500 }}>{i + 1}</td>
                    <td style={{ padding: 10, fontSize: 14, color: stevensTextGrey, fontFamily: "monospace", wordBreak: "break-all" }}>{addr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

