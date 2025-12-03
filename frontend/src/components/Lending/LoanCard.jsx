import { cardStyle, stevensRed, stevensTextGrey } from "../../styles/constants";

export default function LoanCard({ loan, wallet }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const isLender = wallet && loan.lender?.toLowerCase() === wallet?.toLowerCase();
  const isBorrower = wallet && loan.borrower?.toLowerCase() === wallet?.toLowerCase();

  return (
    <div style={{
      ...cardStyle,
      borderLeft: `4px solid ${isLender ? "#10B981" : isBorrower ? "#F59E0B" : "#3B82F6"}`
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16
      }}>
        <div>
          <h4 style={{
            margin: 0,
            marginBottom: 8,
            color: stevensRed,
            fontSize: 16,
            fontWeight: 700
          }}>
            Loan #{loan.loanId}
          </h4>
          {(isLender || isBorrower) && (
            <div style={{
              display: "inline-block",
              padding: "4px 8px",
              borderRadius: 12,
              background: isLender ? "#10B981" : "#F59E0B",
              color: "white",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              marginTop: 4
            }}>
              {isLender ? "Your Loan" : "Your Borrow"}
            </div>
          )}
        </div>
        <div style={{
          padding: "4px 12px",
          borderRadius: 12,
          background: "#E8F4F8",
          color: "#1E40AF",
          fontSize: 11,
          fontWeight: 600
        }}>
          {loan.status}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 16,
        marginBottom: 16
      }}>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Lender
          </div>
          <div style={{ fontSize: 13, fontFamily: "monospace" }}>
            {loan.lender?.slice(0, 6)}...{loan.lender?.slice(-4)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Borrower
          </div>
          <div style={{ fontSize: 13, fontFamily: "monospace" }}>
            {loan.borrower?.slice(0, 6)}...{loan.borrower?.slice(-4)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            SRPC Collateral
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: stevensRed }}>
            {loan.porStaked} SRPC
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            DC Amount
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6" }}>
            {loan.dcAmount} DC
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Interest Rate
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>
            {(loan.interestRate * 100).toFixed(2)}% APY
          </div>
        </div>
      </div>

      <div style={{
        fontSize: 11,
        color: stevensTextGrey,
        paddingTop: 12,
        borderTop: "1px solid #E5E7EB"
      }}>
        Created: {formatDate(loan.createdAt)}
      </div>
    </div>
  );
}

