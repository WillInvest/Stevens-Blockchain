import { cardStyle, stevensTextGrey } from "../../styles/constants";

export default function SHIFT({ contract, duckCoinContract, nftContract }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: 20, 
        color: "#333",
        fontSize: 20,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}>
        🔄 SHIFT
      </h3>
      <p style={{ marginBottom: 20, color: stevensTextGrey }}>
        Coming soon...
      </p>
    </div>
  );
}

