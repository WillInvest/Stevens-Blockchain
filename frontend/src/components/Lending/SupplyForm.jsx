import { useState, useEffect } from "react";
import { cardStyle, stevensRed, stevensTextGrey, inputStyle, buttonStyle } from "../../styles/constants";

// Mock pool data
const MOCK_POOL = {
  supplyAPY: 0.055,
  totalDCSupplied: "10000",
  totalDCBorrowed: "7000"
};

export default function SupplyForm({ 
  wallet, 
  dcBalance, 
  duckCoinContract,
  onSupplyCreated 
}) {
  const [dcAmount, setDcAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentAPY, setCurrentAPY] = useState(MOCK_POOL.supplyAPY);

  useEffect(() => {
    // TODO: Fetch current APY from contract
    setCurrentAPY(MOCK_POOL.supplyAPY);
  }, []);

  const handleMaxDc = () => {
    setDcAmount(dcBalance);
  };

  const calculateEstimatedEarnings = () => {
    if (!dcAmount || parseFloat(dcAmount) <= 0) return "0";
    const annualEarnings = parseFloat(dcAmount) * currentAPY;
    return annualEarnings.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

      try {
      // Validation
      if (!dcAmount || parseFloat(dcAmount) <= 0) {
        throw new Error("Please enter DC amount to lend");
      }
      if (parseFloat(dcAmount) > parseFloat(dcBalance)) {
        throw new Error("Insufficient DC balance");
      }

      // TODO: Call contract method
      // await lendingContract.supply(dcAmount);

      // For demo, simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Supply created (demo):", {
        dcAmount,
        expectedAPY: currentAPY
      });

      // Reset form
      setDcAmount("");

      if (onSupplyCreated) onSupplyCreated();
    } catch (err) {
      setError(err.message || "Failed to supply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={{
        marginTop: 0,
        marginBottom: 20,
        color: stevensRed,
        fontSize: 18,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}>
        💚 Supply (Lend) Duck Coin
      </h3>

      {/* Balance Display */}
      <div style={{
        marginBottom: 24,
        padding: 16,
        background: "#F8F9FA",
        borderRadius: 6
      }}>
        <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
          Your DC Balance
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#3B82F6" }}>
          {dcBalance} DC
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* DC Amount Input */}
        <label style={{
          display: "block",
          marginTop: 16,
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 600,
          color: "#333333",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Duck Coin Amount to Lend *
        </label>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            type="number"
            value={dcAmount}
            onChange={(e) => setDcAmount(e.target.value)}
            required
            min="0"
            step="0.000001"
            placeholder="Enter DC amount to lend"
            style={{
              ...inputStyle,
              paddingRight: 80
            }}
          />
          <button
            type="button"
            onClick={handleMaxDc}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              padding: "4px 12px",
              background: "#E5E7EB",
              border: "none",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              color: "#333"
            }}
          >
            MAX
          </button>
        </div>

        {/* Current APY Display */}
        <div style={{
          marginTop: 16,
          padding: 16,
          background: "#E8F4F8",
          borderRadius: 6,
          border: "1px solid #3B82F6"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1E40AF" }}>
              Current Supply APY:
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#3B82F6" }}>
              {(currentAPY * 100).toFixed(2)}%
            </span>
          </div>
          {dcAmount && parseFloat(dcAmount) > 0 && (
            <div style={{
              fontSize: 11,
              color: "#1E40AF",
              marginTop: 8
            }}>
              Estimated Annual Earnings: {calculateEstimatedEarnings()} DC
            </div>
          )}
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
        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            marginTop: 24,
            width: "100%",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Supplying..." : "Supply Duck Coin"}
        </button>
      </form>
    </div>
  );
}

