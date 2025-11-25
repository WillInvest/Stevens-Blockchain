import { useState, useEffect } from "react";
import { cardStyle, stevensRed, stevensTextGrey, inputStyle, buttonStyle } from "../../styles/constants";

export default function BidModal({
  task,
  wallet,
  taskManagerContract,
  duckCoinContract,
  onClose,
  onBidPlaced
}) {
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentBid, setCurrentBid] = useState(task?.currentBid);
  const [duckCoinBalance, setDuckCoinBalance] = useState("0");

  useEffect(() => {
    // TODO: Fetch current bid from contract
    // TODO: Fetch Duck Coin balance
    if (task?.currentBid) {
      setCurrentBid(task.currentBid);
      setBidAmount((parseFloat(task.currentBid.amount) + 1).toString());
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const bidValue = parseFloat(bidAmount);
      const currentBidValue = currentBid ? parseFloat(currentBid.amount) : 0;

      // Validation
      if (!bidAmount || bidValue <= 0) {
        throw new Error("Bid amount must be greater than 0");
      }
      if (bidValue <= currentBidValue) {
        throw new Error(`Bid must be higher than current bid (${currentBidValue} DC)`);
      }
      if (parseFloat(duckCoinBalance) < bidValue) {
        throw new Error("Insufficient Duck Coin balance");
      }

      // TODO: Call contract method
      // await taskManagerContract.placeBid(task.taskId, bidValue);
      
      // For demo, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Bid placed (demo):", {
        taskId: task.taskId,
        amount: bidValue
      });

      if (onBidPlaced) onBidPlaced();
    } catch (err) {
      setError(err.message || "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  const minBid = currentBid ? (parseFloat(currentBid.amount) + 0.000001).toFixed(6) : "0.000001";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        ...cardStyle,
        maxWidth: 500,
        width: "100%",
        position: "relative"
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            color: stevensTextGrey,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#f0f0f0";
            e.target.style.color = stevensRed;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.color = stevensTextGrey;
          }}
        >
          ×
        </button>

        <h2 style={{
          marginTop: 0,
          marginBottom: 24,
          color: stevensRed,
          fontSize: 20,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Place Bid
        </h2>

        {/* Task Info */}
        <div style={{
          marginBottom: 24,
          padding: 16,
          background: "#F8F9FA",
          borderRadius: 6
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            Task #{task?.taskId}
          </div>
          <div style={{ fontSize: 12, color: stevensTextGrey }}>
            {task?.description}
          </div>
        </div>

        {/* Current Bid Display */}
        <div style={{
          marginBottom: 24,
          padding: 16,
          background: "#E8F4F8",
          borderRadius: 6,
          border: "1px solid #3B82F6"
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#1E40AF",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Current Highest Bid
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 700,
            color: stevensRed
          }}>
            {currentBid ? `${currentBid.amount} DC` : "No bids yet"}
          </div>
          {currentBid && (
            <div style={{
              fontSize: 11,
              color: stevensTextGrey,
              marginTop: 8
            }}>
              Bidder: {currentBid.bidder?.slice(0, 6)}...{currentBid.bidder?.slice(-4)}
            </div>
          )}
        </div>

        {/* Your Balance */}
        <div style={{
          marginBottom: 16,
          padding: 12,
          background: "#F0F0F0",
          borderRadius: 6,
          fontSize: 12
        }}>
          <span style={{ color: stevensTextGrey }}>Your Duck Coin Balance: </span>
          <span style={{ fontWeight: 600 }}>{duckCoinBalance} DC</span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Bid Amount */}
          <label style={{
            display: "block",
            marginBottom: 8,
            fontSize: 12,
            fontWeight: 600,
            color: stevensTextGrey,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Your Bid Amount (DC) *
          </label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            required
            min={minBid}
            step="0.000001"
            style={inputStyle}
            placeholder={`Minimum: ${minBid} DC`}
          />
          <div style={{
            fontSize: 11,
            color: stevensTextGrey,
            marginTop: 4
          }}>
            Minimum bid: {minBid} DC
          </div>

          {/* Info Note */}
          <div style={{
            marginTop: 16,
            padding: 12,
            background: "#FFF8DC",
            borderRadius: 6,
            fontSize: 11,
            color: "#856404"
          }}>
            ⚠️ Your previous bid (if any) will be automatically refunded when you place a new bid.
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: "#FEE2E2",
              borderRadius: 6,
              color: "#DC2626",
              fontSize: 12
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div style={{
            display: "flex",
            gap: 12,
            marginTop: 24
          }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Placing Bid..." : "Place Bid"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...buttonStyle,
                background: "#6B7280",
                color: "white"
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

