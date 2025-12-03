import { useState, useEffect } from "react";
import { cardStyle, stevensRed, stevensTextGrey, inputStyle, buttonStyle } from "../../styles/constants";

// Mock pool data
const MOCK_POOL = {
  borrowAPY: 0.091,
  totalDCSupplied: "10000",
  totalDCBorrowed: "7000",
  maxUtilization: 0.95
};

export default function BorrowForm({ 
  wallet, 
  porBalance, 
  dcBalance, 
  duckCoinContract, 
  nftContract,
  onBorrowCreated 
}) {
  const [porCollateral, setPorCollateral] = useState("");
  const [dcAmount, setDcAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentAPY, setCurrentAPY] = useState(MOCK_POOL.borrowAPY);

  useEffect(() => {
    // TODO: Fetch current APY from contract
    setCurrentAPY(MOCK_POOL.borrowAPY);
  }, []);

  const handleMaxPor = () => {
    setPorCollateral(porBalance);
  };

  const calculateMaxBorrowable = () => {
    if (!porCollateral || parseFloat(porCollateral) <= 0) return 0;
    // 50% collateralization ratio (can borrow up to 50% of SRPC value)
    return parseFloat(porCollateral) * 0.5;
  };

  const calculateTotalRepayment = () => {
    if (!dcAmount || parseFloat(dcAmount) <= 0) return "0";
    const principal = parseFloat(dcAmount);
    const annualInterest = principal * currentAPY;
    // Assuming 1 year term for demo
    return (principal + annualInterest).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!porCollateral || parseFloat(porCollateral) <= 0) {
        throw new Error("Please enter SRPC amount for collateral");
      }
      if (parseFloat(porCollateral) > parseFloat(porBalance)) {
        throw new Error("Insufficient SRPC balance");
      }
      if (!dcAmount || parseFloat(dcAmount) <= 0) {
        throw new Error("Please enter DC amount to borrow");
      }
      if (parseFloat(dcAmount) > calculateMaxBorrowable()) {
        throw new Error(`Maximum borrowable amount is ${calculateMaxBorrowable().toFixed(2)} DC (50% of SRPC collateral)`);
      }

      // Check utilization
      const currentUtilization = parseFloat(MOCK_POOL.totalDCBorrowed) / parseFloat(MOCK_POOL.totalDCSupplied);
      const newUtilization = (parseFloat(MOCK_POOL.totalDCBorrowed) + parseFloat(dcAmount)) / parseFloat(MOCK_POOL.totalDCSupplied);
      if (newUtilization > MOCK_POOL.maxUtilization) {
        throw new Error(`Borrowing this amount would exceed maximum utilization rate (${(MOCK_POOL.maxUtilization * 100).toFixed(0)}%)`);
      }

      // TODO: Call contract method
      // await lendingContract.borrow(porCollateral, dcAmount);

      // For demo, simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Borrow created (demo):", {
        porCollateral,
        dcAmount,
        borrowAPY: currentAPY
      });

      // Reset form
      setPorCollateral("");
      setDcAmount("");

      if (onBorrowCreated) onBorrowCreated();
    } catch (err) {
      setError(err.message || "Failed to borrow");
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
        🟠 Borrow Duck Coin
      </h3>

      {/* Balance Display */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 24,
        padding: 16,
        background: "#F8F9FA",
        borderRadius: 6
      }}>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Your SRPC Balance
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: stevensRed }}>
            {porBalance} SRPC
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Your DC Balance
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#3B82F6" }}>
            {dcBalance} DC
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* SRPC Collateral Input */}
        <label style={{
          display: "block",
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 600,
          color: "#333333",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          SRPC Collateral (Required) *
        </label>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type="number"
            value={porCollateral}
            onChange={(e) => setPorCollateral(e.target.value)}
            required
            min="0"
            step="0.000001"
            placeholder="Enter SRPC amount for collateral"
            style={{
              ...inputStyle,
              paddingRight: 80
            }}
          />
          <button
            type="button"
            onClick={handleMaxPor}
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
        <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 16 }}>
          ⚠️ SRPC will be locked as collateral. You can borrow up to 50% of your SRPC value.
        </div>

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
          Duck Coin Amount to Borrow *
        </label>
        <input
          type="number"
          value={dcAmount}
          onChange={(e) => setDcAmount(e.target.value)}
          required
          min="0"
          step="0.000001"
          placeholder="Enter DC amount to borrow"
          style={inputStyle}
        />
        {porCollateral && parseFloat(porCollateral) > 0 && (
          <div style={{ fontSize: 11, color: "#F59E0B", marginBottom: 16 }}>
            💡 Maximum borrowable: {calculateMaxBorrowable().toFixed(2)} DC (50% of SRPC collateral)
          </div>
        )}

        {/* Current APY Display */}
        <div style={{
          marginTop: 16,
          padding: 16,
          background: "#FFF8DC",
          borderRadius: 6,
          border: "1px solid #F59E0B"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#856404" }}>
              Current Borrow APY:
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#F59E0B" }}>
              {(currentAPY * 100).toFixed(2)}%
            </span>
          </div>
          {dcAmount && parseFloat(dcAmount) > 0 && (
            <div style={{
              fontSize: 11,
              color: "#856404",
              marginTop: 8
            }}>
              Total Repayment (1 year): {calculateTotalRepayment()} DC
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
            background: "#F59E0B",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Borrowing..." : "Borrow Duck Coin"}
        </button>
      </form>
    </div>
  );
}


