import { useState, useEffect } from "react";
import MetricCard from "./MetricCard";
import { cardStyle, stevensRed } from "../../styles/constants";

// Mock data - will be replaced with contract calls
const MOCK_LENDING_POOL = {
  totalSRPCStaked: "25000",
  totalDCSupplied: "10000",
  totalDCBorrowed: "7000",
  utilizationRate: 0.70,
  porToDCRatio: 2.5,
  collateralizationRatio: 2.5,
  supplyAPY: 0.055,
  borrowAPY: 0.091,
  baseRate: 0.02,
  supplySlope: 0.05,
  borrowSlope: 0.08,
  spread: 0.015
};

export default function LendingDashboard({ wallet, duckCoinContract, nftContract }) {
  const [poolData, setPoolData] = useState(MOCK_LENDING_POOL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoolData = async () => {
      setLoading(true);
      try {
        // TODO: Fetch from contract
        // const totalSRPC = await lendingContract.getTotalSRPCStaked();
        // const totalDCSupplied = await lendingContract.getTotalDCSupplied();
        // const totalDCBorrowed = await lendingContract.getTotalDCBorrowed();
        // const utilizationRate = await lendingContract.getUtilizationRate();
        // const supplyAPY = await lendingContract.getSupplyAPY();
        // const borrowAPY = await lendingContract.getBorrowAPY();

        // For demo, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setPoolData(MOCK_LENDING_POOL);
      } catch (error) {
        console.error("Error fetching pool data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoolData();
  }, [duckCoinContract, nftContract]);

  const utilizationPercentage = (poolData.utilizationRate * 100).toFixed(1);
  const getUtilizationColor = () => {
    if (poolData.utilizationRate < 0.5) return "#10B981"; // Green
    if (poolData.utilizationRate < 0.8) return "#F59E0B"; // Yellow
    if (poolData.utilizationRate < 0.95) return "#EF4444"; // Orange
    return "#DC2626"; // Red
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
          Loading lending metrics...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{
        marginTop: 0,
        marginBottom: 24,
        color: stevensRed,
        fontSize: 24,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}>
        💰 Lending Pool Overview
      </h2>

      {/* Metrics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <MetricCard
          title="Utilization Rate"
          value={`${utilizationPercentage}%`}
          subtitle={`${poolData.totalDCBorrowed} / ${poolData.totalDCSupplied} DC`}
          color={getUtilizationColor()}
          icon="📊"
        />
        <MetricCard
          title="Supply APY"
          value={`${(poolData.supplyAPY * 100).toFixed(2)}%`}
          subtitle="Lender Interest Rate"
          color="#3B82F6"
          icon="💚"
        />
        <MetricCard
          title="Borrow APY"
          value={`${(poolData.borrowAPY * 100).toFixed(2)}%`}
          subtitle="Borrower Interest Rate"
          color="#F59E0B"
          icon="🟠"
        />
        <MetricCard
          title="Total DC Supplied"
          value={`${poolData.totalDCSupplied} DC`}
          subtitle="In Lending Pool"
          color="#3B82F6"
          icon="💰"
        />
        <MetricCard
          title="Total DC Borrowed"
          value={`${poolData.totalDCBorrowed} DC`}
          subtitle="Currently Borrowed"
          color="#F59E0B"
          icon="📈"
        />
        <MetricCard
          title="Total SRPC Staked"
          value={`${poolData.totalSRPCStaked} SRPC`}
          subtitle="As Collateral (Borrowers)"
          color={stevensRed}
          icon="🛡️"
        />
      </div>

      {/* Utilization Gauge */}
      <div style={{
        ...cardStyle,
        marginTop: 16
      }}>
        <div style={{
          marginBottom: 12,
          fontSize: 14,
          fontWeight: 600,
          color: "#333",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Pool Utilization Gauge
        </div>
        <div style={{
          width: "100%",
          height: 24,
          background: "#E5E7EB",
          borderRadius: 12,
          overflow: "hidden",
          position: "relative"
        }}>
          <div style={{
            width: `${utilizationPercentage}%`,
            height: "100%",
            background: getUtilizationColor(),
            transition: "width 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 8,
            color: "white",
            fontSize: 12,
            fontWeight: 600
          }}>
            {utilizationPercentage >= 10 && `${utilizationPercentage}%`}
          </div>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 11,
          color: "#666"
        }}>
          <span>0% (Safe)</span>
          <span>50% (Moderate)</span>
          <span>80% (High)</span>
          <span>95% (Critical)</span>
        </div>
      </div>
    </div>
  );
}

