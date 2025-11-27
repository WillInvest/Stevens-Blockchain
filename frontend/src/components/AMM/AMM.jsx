import { cardStyle, stevensRed, stevensTextGrey } from "../../styles/constants";
import { SBC_ADDRESS } from "../../contracts/config";

export default function AMM({ contract }) {
  return (
    <div>
      {/* Contract Address */}
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
      </div>

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
          🔄 AMM (Automated Market Maker)
        </h3>
        <p style={{ marginBottom: 20, color: stevensTextGrey }}>
          Coming soon...
        </p>
      </div>
    </div>
  );
}

