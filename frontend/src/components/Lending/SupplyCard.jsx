import { cardStyle, stevensRed, stevensTextGrey, buttonStyle } from "../../styles/constants";

export default function SupplyCard({ supply, onWithdraw }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      ...cardStyle,
      borderLeft: `4px solid #10B981`
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 16,
        marginBottom: 16
      }}>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            DC Supplied
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#3B82F6" }}>
            {supply.dcSupplied} DC
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Current APY
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#10B981" }}>
            {(supply.currentAPY * 100).toFixed(2)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Total Earned
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#10B981" }}>
            {supply.totalEarned} DC
          </div>
        </div>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 16,
        borderTop: "1px solid #E5E7EB"
      }}>
        <div style={{ fontSize: 11, color: stevensTextGrey }}>
          Supplied: {formatDate(supply.suppliedAt)}
        </div>
        <button
          onClick={onWithdraw}
          style={{
            ...buttonStyle,
            background: "#6B7280",
            color: "white",
            padding: "8px 16px",
            fontSize: 12
          }}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}

