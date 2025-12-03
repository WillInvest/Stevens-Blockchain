import { cardStyle, stevensRed, stevensTextGrey, buttonStyle } from "../../styles/constants";

export default function BorrowCard({ borrow, onRepay }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      ...cardStyle,
      borderLeft: `4px solid #F59E0B`
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 16,
        marginBottom: 16
      }}>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            SRPC Collateral
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: stevensRed }}>
            {borrow.porCollateral} SRPC
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            DC Borrowed
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#F59E0B" }}>
            {borrow.dcBorrowed} DC
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Current APY
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#F59E0B" }}>
            {(borrow.currentAPY * 100).toFixed(2)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Total Owed
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#EF4444" }}>
            {borrow.totalOwed} DC
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 12,
        padding: 12,
        background: "#FEF2F2",
        borderRadius: 6,
        fontSize: 12,
        color: "#991B1B"
      }}>
        Interest Accrued: {borrow.interestAccrued} DC
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 16,
        marginTop: 16,
        borderTop: "1px solid #E5E7EB"
      }}>
        <div style={{ fontSize: 11, color: stevensTextGrey }}>
          Borrowed: {formatDate(borrow.borrowedAt)}
        </div>
        <button
          onClick={onRepay}
          style={{
            ...buttonStyle,
            background: "#10B981",
            color: "white",
            padding: "8px 16px",
            fontSize: 12
          }}
        >
          Repay
        </button>
      </div>
    </div>
  );
}


