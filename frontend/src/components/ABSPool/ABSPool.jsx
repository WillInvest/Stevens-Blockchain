import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { cardStyle, stevensRed, stevensTextGrey, stevensDarkGrey, buttonStyle } from "../../styles/constants";

export default function ABSPool({ 
  contract, 
  sbcContract, 
  sdcContract, 
  srpcContract 
}) {
  const [activeSubTab, setActiveSubTab] = useState("absInvest");
  const [absPools, setAbsPools] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [absSeries, setAbsSeries] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [historicalSRPC, setHistoricalSRPC] = useState([]);
  const [showPoolPlot, setShowPoolPlot] = useState(false);

  // SRPC ranges for color coding
  const srpcRanges = [
    { min: 0, max: 10, color: "#dc3545", label: "Low (0-10)", risk: "High" },
    { min: 11, max: 50, color: "#ffc107", label: "Medium (11-50)", risk: "Medium" },
    { min: 51, max: 100, color: "#28a745", label: "High (51-100)", risk: "Low" },
    { min: 101, max: Infinity, color: "#007bff", label: "Very High (100+)", risk: "Very Low" }
  ];

  // Get color based on SRPC balance
  const getColorBySRPC = (srpcBalance) => {
    const balance = parseFloat(srpcBalance) || 0;
    for (const range of srpcRanges) {
      if (balance >= range.min && balance <= range.max) {
        return range;
      }
    }
    return srpcRanges[0]; // Default to low
  };

  // Load students with their data
  useEffect(() => {
    if (useMockData) {
      generateMockStudents(5000);
    } else {
      loadStudents();
    }
  }, [contract, sdcContract, srpcContract, useMockData]);

  // Generate mock student data with realistic distributions
  function generateMockStudents(count = 5000) {
    setLoading(true);
    
    // Realistic distributions
    // SRPC: Most students have low-medium SRPC, few have very high
    // Tuition: Most students have moderate tuition, some have high, few have very high
    
    const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Sage", "River", "Blake", "Cameron", "Dakota", "Emery", "Finley", "Harper", "Hayden", "Kai", "Logan", "Noah", "Parker", "Reese", "Rowan", "Skylar", "Zion"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez", "Clark"];
    
    const mockStudents = [];
    
    for (let i = 1; i <= count; i++) {
      // Generate realistic student ID (5-6 digits)
      const studentId = 10000 + i;
      
      // Random name
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      
      // Generate mock wallet address
      const wallet = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      // SRPC Distribution (skewed towards lower values, some high achievers)
      // 60% low (0-10), 25% medium (11-50), 10% high (51-100), 5% very high (100+)
      let srpcBalance;
      const srpcRand = Math.random();
      if (srpcRand < 0.60) {
        // Low SRPC: 0-10
        srpcBalance = Math.random() * 10;
      } else if (srpcRand < 0.85) {
        // Medium SRPC: 11-50
        srpcBalance = 11 + Math.random() * 39;
      } else if (srpcRand < 0.95) {
        // High SRPC: 51-100
        srpcBalance = 51 + Math.random() * 49;
      } else {
        // Very High SRPC: 100-200
        srpcBalance = 100 + Math.random() * 100;
      }
      
      // Tuition Distribution (most students have moderate tuition)
      // 50% have 5k-15k, 30% have 15k-25k, 15% have 25k-35k, 5% have 35k+
      let tuitionOutstanding;
      const tuitionRand = Math.random();
      if (tuitionRand < 0.50) {
        // Moderate: 5,000 - 15,000 SDC
        tuitionOutstanding = 5000 + Math.random() * 10000;
      } else if (tuitionRand < 0.80) {
        // Medium: 15,000 - 25,000 SDC
        tuitionOutstanding = 15000 + Math.random() * 10000;
      } else if (tuitionRand < 0.95) {
        // High: 25,000 - 35,000 SDC
        tuitionOutstanding = 25000 + Math.random() * 10000;
      } else {
        // Very High: 35,000 - 50,000 SDC
        tuitionOutstanding = 35000 + Math.random() * 15000;
      }
      
      // Round to 2 decimal places
      srpcBalance = parseFloat(srpcBalance.toFixed(2));
      tuitionOutstanding = parseFloat(tuitionOutstanding.toFixed(2));
      
      const student = {
        id: studentId.toString(),
        name: name,
        wallet: wallet,
        srpcBalance: srpcBalance.toString(),
        tuitionOutstanding: tuitionOutstanding.toString(),
        hasTuition: true, // All mock students have tuition
        colorRange: getColorBySRPC(srpcBalance.toString())
      };
      
      mockStudents.push(student);
    }
    
    // Sort by SRPC (highest first) for better visualization
    mockStudents.sort((a, b) => parseFloat(b.srpcBalance) - parseFloat(a.srpcBalance));
    
    setStudents(mockStudents);
    setLoading(false);
  }

  async function loadStudents() {
    if (!contract || !contract.getAllStudents) {
      return;
    }

    setLoading(true);
    try {
      const list = await contract.getAllStudents();
      const validStudents = list.filter(s => 
        s.wallet && s.wallet !== ethers.ZeroAddress
      );

      const enriched = await Promise.all(
        validStudents.map(async (s) => {
          // Get SRPC balance
          let srpcBalance = BigInt(0);
          if (srpcContract) {
            try {
              srpcBalance = await srpcContract.balanceOf(s.wallet);
            } catch (err) {
              console.warn(`Could not fetch SRPC balance:`, err);
            }
          }

          // Get tuition outstanding
          let tuitionOutstanding = BigInt(0);
          let hasTuition = false;
          if (contract && contract.getStudentTotalOutstandingTuition) {
            try {
              tuitionOutstanding = await contract.getStudentTotalOutstandingTuition(s.studentId);
              hasTuition = tuitionOutstanding > 0;
            } catch (err) {
              // TuitionReceivable not set or student has no obligations
            }
          }

          const formattedSrpc = parseFloat(ethers.formatEther(srpcBalance)).toFixed(2);
          const formattedTuition = parseFloat(ethers.formatEther(tuitionOutstanding)).toFixed(2);

          return {
            id: s.studentId.toString(),
            name: s.name,
            wallet: s.wallet,
            srpcBalance: formattedSrpc,
            tuitionOutstanding: formattedTuition,
            hasTuition: hasTuition,
            colorRange: getColorBySRPC(formattedSrpc)
          };
        })
      );

      // Filter to only students with tuition
      const studentsWithTuition = enriched.filter(s => s.hasTuition);
      setStudents(studentsWithTuition);
    } catch (err) {
      console.error("Error loading students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  // Create mock ABS pool (for now, frontend-only)
  function createMockABSPool() {
    if (students.length === 0) {
      alert("No students with tuition obligations found. Please add students and create tuition obligations first.");
      return;
    }

    const poolId = absPools.length + 1;
    const selectedStudents = students.filter(s => s.hasTuition);
    
    if (selectedStudents.length === 0) {
      alert("No students with outstanding tuition to include in pool.");
      return;
    }

    const totalValue = selectedStudents.reduce((sum, s) => 
      sum + parseFloat(s.tuitionOutstanding), 0
    );

    const avgSRPC = selectedStudents.reduce((sum, s) => 
      sum + parseFloat(s.srpcBalance), 0
    ) / selectedStudents.length;

    // Calculate risk distribution
    const riskDistribution = srpcRanges.map(range => ({
      ...range,
      count: selectedStudents.filter(s => s.colorRange.min === range.min).length
    }));

    const newPool = {
      id: poolId,
      name: `ABS Pool #${poolId}`,
      createdAt: new Date().toISOString(),
      students: selectedStudents,
      totalValue: totalValue.toFixed(2),
      studentCount: selectedStudents.length,
      avgSRPC: avgSRPC.toFixed(2),
      riskDistribution: riskDistribution,
      status: "Active"
    };

    setAbsPools([...absPools, newPool]);
    setSelectedPool(newPool);
    alert(`✅ ABS Pool #${poolId} created with ${selectedStudents.length} students!`);
  }

  // Calculate pool statistics
  function calculatePoolStats(pool) {
    if (!pool || !pool.students) return null;

    const totalValue = parseFloat(pool.totalValue);
    const studentCount = pool.students.length;
    const avgSRPC = parseFloat(pool.avgSRPC);
    
    // Calculate weighted average risk
    const totalRiskScore = pool.riskDistribution.reduce((sum, r) => {
      const riskValue = r.risk === "Very Low" ? 1 : r.risk === "Low" ? 2 : r.risk === "Medium" ? 3 : 4;
      return sum + (r.count * riskValue);
    }, 0);
    const avgRiskScore = totalRiskScore / studentCount;
    const riskLevel = avgRiskScore <= 1.5 ? "Very Low" : avgRiskScore <= 2.5 ? "Low" : avgRiskScore <= 3.5 ? "Medium" : "High";

    return {
      totalValue,
      studentCount,
      avgSRPC,
      riskLevel,
      estimatedDefaultRate: riskLevel === "Very Low" ? "1-2%" : riskLevel === "Low" ? "3-5%" : riskLevel === "Medium" ? "6-10%" : "11-15%"
    };
  }

  // Generate historical SRPC data (past 5 years)
  function generateHistoricalSRPC() {
    const historical = [];
    const currentDate = new Date();
    
    for (let year = 0; year < 5; year++) {
      const yearDate = new Date(currentDate);
      yearDate.setFullYear(yearDate.getFullYear() - year);
      
      // Generate realistic SRPC averages (trending slightly upward over time)
      const baseSRPC = 25 + (5 - year) * 2; // Higher in recent years
      const avgSRPC = baseSRPC + (Math.random() * 10 - 5); // ±5 variation
      
      historical.push({
        year: yearDate.getFullYear(),
        semester: year === 0 ? "Fall" : year === 1 ? "Spring" : year % 2 === 0 ? "Fall" : "Spring",
        avgSRPC: Math.max(10, Math.min(100, avgSRPC))
      });
    }
    
    setHistoricalSRPC(historical);
  }

  // Calculate demand based on students and SRPC
  function calculateDemand(studentCount, avgSRPC) {
    // Base demand from student count (more students = more demand)
    const studentDemand = studentCount * 100; // Base 100 SDC per student
    
    // SRPC multiplier (higher SRPC = higher demand, up to 2x)
    const srpcMultiplier = 0.5 + (avgSRPC / 100) * 1.5; // 0.5x to 2x
    
    // Total demand
    const totalDemand = studentDemand * srpcMultiplier;
    
    return totalDemand;
  }

  // Generate mock ABS series data with sequential selling logic
  function generateMockABSSeries() {
    const semesters = ["Fall 2023", "Spring 2024", "Fall 2024", "Spring 2025", "Fall 2025"];
    const currentDate = new Date();
    
    const series = semesters.map((semester, index) => {
      const issueDate = new Date(currentDate);
      issueDate.setMonth(issueDate.getMonth() - (semesters.length - index) * 6);
      
      // Payment date is typically 90-120 days after issue
      const paymentDate = new Date(issueDate);
      paymentDate.setDate(paymentDate.getDate() + 90 + Math.floor(Math.random() * 30));
      
      const daysUntilPayment = Math.ceil((paymentDate - currentDate) / (1000 * 60 * 60 * 24));
      
      // Generate tranche amounts (total pool value)
      const totalPoolValue = 5000000 + Math.random() * 10000000; // 5M - 15M SDC
      
      // Tranche structure: 70% Senior, 20% Mezzanine, 10% Equity
      const seniorAmount = totalPoolValue * 0.70;
      const mezzAmount = totalPoolValue * 0.20;
      const equityAmount = totalPoolValue * 0.10;
      
      // Generate student count and average SRPC
      const studentCount = Math.floor(500 + Math.random() * 1500); // 500-2000 students
      const avgSRPC = 20 + Math.random() * 60; // 20-80 SRPC average
      
      // Calculate demand
      const demand = calculateDemand(studentCount, avgSRPC);
      
      // Sequential selling: Senior must be 100% before Mezzanine, Mezzanine 100% before Equity
      // For this simulation: All Senior sold, 40% of Mezzanine sold
      let seniorSold = 0;
      let mezzSold = 0;
      let equitySold = 0;
      
      // Senior tranche: Always 100% sold
      seniorSold = seniorAmount;
      
      // Mezzanine tranche: 40% sold (only after Senior is 100%)
      mezzSold = mezzAmount * 0.40;
      
      // Equity tranche: Not sold yet (Mezzanine must be 100% first)
      equitySold = 0;
      
      // Repayment status: For past series (payment date in the past), calculate repayment percentages
      const isPastSeries = daysUntilPayment <= 0;
      let seniorRepaid = 0;
      let mezzRepaid = 0;
      let equityRepaid = 0;
      
      if (isPastSeries) {
        // Senior tranche: Typically gets 100% repayment (first priority)
        seniorRepaid = seniorSold; // 100% of sold amount repaid
        
        // Mezzanine tranche: Gets repaid after Senior, typically 100% if pool performs well
        // For this simulation, assume 85-100% repayment based on pool performance
        const mezzRepaymentRate = 0.85 + Math.random() * 0.15; // 85-100%
        mezzRepaid = mezzSold * mezzRepaymentRate;
        
        // Equity tranche: Only gets repaid if there's excess after Senior and Mezzanine
        // For series where Equity wasn't sold, show N/A
        if (equitySold > 0) {
          // Equity typically gets 50-100% repayment if pool performs well
          const equityRepaymentRate = 0.50 + Math.random() * 0.50; // 50-100%
          equityRepaid = equitySold * equityRepaymentRate;
        }
      }
      
      return {
        id: index + 1,
        seriesId: `ABS-${semester.replace(/\s+/g, '-').toUpperCase()}`,
        semester: semester,
        issueDate: issueDate.toISOString(),
        paymentDate: paymentDate.toISOString(),
        daysUntilPayment: daysUntilPayment,
        totalPoolValue: totalPoolValue,
        studentCount: studentCount,
        avgSRPC: avgSRPC,
        demand: demand,
        senior: {
          total: seniorAmount,
          sold: seniorSold,
          available: seniorAmount - seniorSold,
          soldPercentage: (seniorSold / seniorAmount) * 100
        },
        mezzanine: {
          total: mezzAmount,
          sold: mezzSold,
          available: mezzAmount - mezzSold,
          soldPercentage: (mezzSold / mezzAmount) * 100
        },
        equity: {
          total: equityAmount,
          sold: equitySold,
          available: equityAmount - equitySold,
          soldPercentage: (equitySold / equityAmount) * 100
        },
        status: daysUntilPayment > 0 ? "Active" : "Matured",
        repayment: {
          senior: {
            repaid: seniorRepaid,
            repaidPercentage: seniorSold > 0 ? (seniorRepaid / seniorSold) * 100 : 0
          },
          mezzanine: {
            repaid: mezzRepaid,
            repaidPercentage: mezzSold > 0 ? (mezzRepaid / mezzSold) * 100 : 0
          },
          equity: {
            repaid: equityRepaid,
            repaidPercentage: equitySold > 0 ? (equityRepaid / equitySold) * 100 : null // null means N/A
          }
        }
      };
    });
    
    // Sort by date (newest first)
    series.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
    
    setAbsSeries(series);
    generateHistoricalSRPC();
  }

  // Generate mock ABS series on component mount
  useEffect(() => {
    if (absSeries.length === 0) {
      generateMockABSSeries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* SUB-TAB NAVIGATION */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
        borderBottom: `2px solid ${stevensRed}`,
        paddingBottom: 0
      }}>
        {[
          { id: "absInvest", label: "💰 ABS Invest", icon: "💰" },
          { id: "absPool", label: "📊 ABS Pool", icon: "📊" },
          { id: "create", label: "➕ Create Pool", icon: "➕" }
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setActiveSubTab(subTab.id)}
            style={{
              padding: "10px 18px",
              border: "none",
              background: activeSubTab === subTab.id ? stevensRed : "transparent",
              color: activeSubTab === subTab.id ? "white" : stevensRed,
              fontWeight: activeSubTab === subTab.id ? 700 : 500,
              fontSize: 12,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: activeSubTab === subTab.id ? `3px solid ${stevensRed}` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
              borderRadius: "6px 6px 0 0"
            }}
            onMouseEnter={(e) => {
              if (activeSubTab !== subTab.id) {
                e.target.style.background = "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeSubTab !== subTab.id) {
                e.target.style.background = "transparent";
              }
            }}
          >
            {subTab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={cardStyle}>
        {/* ABS INVEST TAB */}
        {activeSubTab === "absInvest" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: 8, 
                color: stevensRed,
                fontSize: 24,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                💰 ABS Investment Opportunities
              </h3>
              <p style={{ margin: 0, color: stevensTextGrey, fontSize: 15 }}>
                Invest in Asset-Backed Securities backed by student tuition receivables. Each series represents a semester's tuition obligations with different risk-return profiles.
              </p>
            </div>

            {/* Summary Statistics - Current Series Only */}
            {absSeries.length > 0 && absSeries[0] && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 32
              }}>
                <div style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 12,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Available</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {(absSeries[0].senior.available + absSeries[0].mezzanine.available + absSeries[0].equity.available).toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                    Across all series
                  </div>
                </div>
                <div style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  borderRadius: 12,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Active Series</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {absSeries[0].status === "Active" ? 1 : 0}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                    Available for investment
                  </div>
                </div>
                <div style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  borderRadius: 12,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Students</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {absSeries[0].studentCount.toLocaleString('en-US')}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                    Underlying receivables
                  </div>
                </div>
                <div style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                  borderRadius: 12,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Pool Value</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {absSeries[0].totalPoolValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                    All series combined
                  </div>
                </div>
              </div>
            )}

            {absSeries.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: 40, 
                color: stevensTextGrey 
              }}>
                No ABS series available.
              </div>
            ) : (
              <>
                {/* Show only latest 2 series, or all if showAllHistory is true */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {(showAllHistory ? absSeries : absSeries.slice(0, 2)).map((series) => {
                  const issueDate = new Date(series.issueDate);
                  const paymentDate = new Date(series.paymentDate);
                  const totalAvailable = series.senior.available + series.mezzanine.available + series.equity.available;
                  const totalSold = series.senior.sold + series.mezzanine.sold + series.equity.sold;
                  
                  return (
                    <div
                      key={series.id}
                      style={{
                        padding: 24,
                        border: `2px solid ${series.status === "Active" ? stevensRed : "#6c757d"}`,
                        borderRadius: 12,
                        background: series.status === "Active" ? "#fff5f5" : "#f8f9fa",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
                        <div>
                          <h4 style={{ margin: "0 0 8px 0", color: stevensRed, fontSize: 22, fontWeight: 700 }}>
                            {series.seriesId}
                          </h4>
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: stevensTextGrey }}>
                            <div>
                              <strong>Semester:</strong> {series.semester}
                            </div>
                            <div>
                              <strong>Status:</strong> 
                              <span style={{ 
                                marginLeft: 8,
                                padding: "2px 8px",
                                background: series.status === "Active" ? "#28a745" : "#6c757d",
                                color: "white",
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600
                              }}>
                                {series.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", fontSize: 12, color: stevensTextGrey }}>
                          <div><strong>Students:</strong> {series.studentCount.toLocaleString()}</div>
                          <div><strong>Total Pool:</strong> {series.totalPoolValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC</div>
                        </div>
                      </div>

                      {/* Key Information */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 16,
                        marginBottom: 20,
                        padding: 16,
                        background: "#f8f9fa",
                        borderRadius: 8
                      }}>
                        <div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Date Issued</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: stevensDarkGrey }}>
                            {issueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Payment Date</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: stevensDarkGrey }}>
                            {paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Days Until Payment</div>
                          <div style={{ 
                            fontSize: 16, 
                            fontWeight: 600, 
                            color: series.daysUntilPayment > 30 ? "#28a745" : series.daysUntilPayment > 0 ? "#ffc107" : "#dc3545"
                          }}>
                            {series.daysUntilPayment > 0 ? `${series.daysUntilPayment} days` : "Overdue"}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Total Available</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: stevensRed }}>
                            {totalAvailable.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                          </div>
                        </div>
                      </div>

                      {/* Tranche Visualization */}
                      <div style={{ marginBottom: 24 }}>
                        <h5 style={{ margin: "0 0 16px 0", color: stevensDarkGrey, fontSize: 18, fontWeight: 600 }}>
                          Tranche Availability Visualization
                        </h5>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr",
                          gap: 20,
                          marginBottom: 20
                        }}>
                          {/* Bar Chart Visualization */}
                          <div style={{
                            padding: 20,
                            background: "#f8f9fa",
                            borderRadius: 12,
                            border: "1px solid #e9ecef"
                          }}>
                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: stevensDarkGrey }}>
                              Available vs Sold (SDC)
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                              {/* Senior */}
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: stevensTextGrey }}>
                                  <span style={{ fontWeight: 600, color: "#667eea" }}>Senior Tranche</span>
                                  <span>{series.senior.available.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {series.senior.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC</span>
                                </div>
                                <div style={{ height: 24, background: "#e9ecef", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${(series.senior.available / series.senior.total) * 100}%`,
                                    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: 11,
                                    fontWeight: 600
                                  }}>
                                    {((series.senior.available / series.senior.total) * 100).toFixed(1)}% Available
                                  </div>
                                  <div style={{
                                    position: "absolute",
                                    right: 0,
                                    top: 0,
                                    height: "100%",
                                    width: `${(series.senior.sold / series.senior.total) * 100}%`,
                                    background: "rgba(0,0,0,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    paddingRight: 8,
                                    fontSize: 11,
                                    color: "white",
                                    fontWeight: 600
                                  }}>
                                    {((series.senior.sold / series.senior.total) * 100).toFixed(1)}% Sold
                                  </div>
                                </div>
                              </div>
                              {/* Mezzanine */}
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: stevensTextGrey }}>
                                  <span style={{ fontWeight: 600, color: "#f5576c" }}>Mezzanine Tranche</span>
                                  <span>{series.mezzanine.available.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {series.mezzanine.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC</span>
                                </div>
                                <div style={{ height: 24, background: "#e9ecef", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${(series.mezzanine.available / series.mezzanine.total) * 100}%`,
                                    background: "linear-gradient(90deg, #f093fb 0%, #f5576c 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: 11,
                                    fontWeight: 600
                                  }}>
                                    {((series.mezzanine.available / series.mezzanine.total) * 100).toFixed(1)}% Available
                                  </div>
                                  <div style={{
                                    position: "absolute",
                                    right: 0,
                                    top: 0,
                                    height: "100%",
                                    width: `${(series.mezzanine.sold / series.mezzanine.total) * 100}%`,
                                    background: "rgba(0,0,0,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    paddingRight: 8,
                                    fontSize: 11,
                                    color: "white",
                                    fontWeight: 600
                                  }}>
                                    {((series.mezzanine.sold / series.mezzanine.total) * 100).toFixed(1)}% Sold
                                  </div>
                                </div>
                              </div>
                              {/* Equity */}
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: stevensTextGrey }}>
                                  <span style={{ fontWeight: 600, color: "#00f2fe" }}>Equity Tranche</span>
                                  <span>{series.equity.available.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {series.equity.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC</span>
                                </div>
                                <div style={{ height: 24, background: "#e9ecef", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${(series.equity.available / series.equity.total) * 100}%`,
                                    background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: 11,
                                    fontWeight: 600
                                  }}>
                                    {((series.equity.available / series.equity.total) * 100).toFixed(1)}% Available
                                  </div>
                                  <div style={{
                                    position: "absolute",
                                    right: 0,
                                    top: 0,
                                    height: "100%",
                                    width: `${(series.equity.sold / series.equity.total) * 100}%`,
                                    background: "rgba(0,0,0,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    paddingRight: 8,
                                    fontSize: 11,
                                    color: "white",
                                    fontWeight: 600
                                  }}>
                                    {((series.equity.sold / series.equity.total) * 100).toFixed(1)}% Sold
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Pie Chart / Summary */}
                          <div style={{
                            padding: 20,
                            background: "#f8f9fa",
                            borderRadius: 12,
                            border: "1px solid #e9ecef"
                          }}>
                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: stevensDarkGrey }}>
                              Distribution Summary
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#667eea" }} />
                                <div style={{ flex: 1, fontSize: 13 }}>
                                  <div style={{ fontWeight: 600, color: stevensDarkGrey }}>Senior</div>
                                  <div style={{ fontSize: 11, color: stevensTextGrey }}>
                                    {((series.senior.total / series.totalPoolValue) * 100).toFixed(1)}% of pool
                                  </div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: stevensRed }}>
                                  {series.senior.available.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#f5576c" }} />
                                <div style={{ flex: 1, fontSize: 13 }}>
                                  <div style={{ fontWeight: 600, color: stevensDarkGrey }}>Mezzanine</div>
                                  <div style={{ fontSize: 11, color: stevensTextGrey }}>
                                    {((series.mezzanine.total / series.totalPoolValue) * 100).toFixed(1)}% of pool
                                  </div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: stevensRed }}>
                                  {series.mezzanine.available.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#00f2fe" }} />
                                <div style={{ flex: 1, fontSize: 13 }}>
                                  <div style={{ fontWeight: 600, color: stevensDarkGrey }}>Equity</div>
                                  <div style={{ fontSize: 11, color: stevensTextGrey }}>
                                    {((series.equity.total / series.totalPoolValue) * 100).toFixed(1)}% of pool
                                  </div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: stevensRed }}>
                                  {series.equity.available.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tranche Information Cards */}
                      <div style={{ marginBottom: 20 }}>
                        <h5 style={{ margin: "0 0 16px 0", color: stevensDarkGrey, fontSize: 18, fontWeight: 600 }}>
                          Tranche Details & Investment Information
                        </h5>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: 16
                        }}>
                          {/* Senior Tranche */}
                          <div style={{
                            padding: 16,
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            borderRadius: 8,
                            color: "white"
                          }}>
                            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Senior Tranche</div>
                            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                              {series.senior.available.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>
                              Total: {series.senior.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                              <br />
                              Sold: {series.senior.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                              <br />
                              <strong>Available: {((series.senior.available / series.senior.total) * 100).toFixed(1)}%</strong>
                            </div>
                            <div style={{
                              marginTop: 8,
                              height: 6,
                              background: "rgba(255,255,255,0.3)",
                              borderRadius: 3,
                              overflow: "hidden"
                            }}>
                              <div style={{
                                height: "100%",
                                width: `${(series.senior.available / series.senior.total) * 100}%`,
                                background: "white"
                              }} />
                            </div>
                          </div>

                          {/* Mezzanine Tranche */}
                          <div style={{
                            padding: 16,
                            background: series.senior.soldPercentage === 100
                              ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                              : "linear-gradient(135deg, #cccccc 0%, #999999 100%)",
                            borderRadius: 8,
                            color: "white",
                            opacity: series.senior.soldPercentage === 100 ? 1 : 0.7
                          }}>
                            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
                              Mezzanine Tranche
                              {series.senior.soldPercentage < 100 && (
                                <div style={{ fontSize: 9, marginTop: 4, opacity: 0.8 }}>
                                  (Locked - Senior must be 100%)
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                              {series.mezzanine.available.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>
                              Total: {series.mezzanine.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                              <br />
                              Sold: {series.mezzanine.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                              <br />
                              <strong>Available: {((series.mezzanine.available / series.mezzanine.total) * 100).toFixed(1)}%</strong>
                            </div>
                            <div style={{
                              marginTop: 8,
                              height: 6,
                              background: "rgba(255,255,255,0.3)",
                              borderRadius: 3,
                              overflow: "hidden"
                            }}>
                              <div style={{
                                height: "100%",
                                width: `${(series.mezzanine.available / series.mezzanine.total) * 100}%`,
                                background: "white"
                              }} />
                            </div>
                          </div>

                          {/* Equity Tranche */}
                          <div style={{
                            padding: 16,
                            background: series.senior.soldPercentage === 100 && series.mezzanine.soldPercentage === 100
                              ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                              : "linear-gradient(135deg, #cccccc 0%, #999999 100%)",
                            borderRadius: 8,
                            color: "white",
                            opacity: series.senior.soldPercentage === 100 && series.mezzanine.soldPercentage === 100 ? 1 : 0.7
                          }}>
                            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
                              Equity Tranche
                              {(series.senior.soldPercentage < 100 || series.mezzanine.soldPercentage < 100) && (
                                <div style={{ fontSize: 9, marginTop: 4, opacity: 0.8 }}>
                                  (Locked - Senior & Mezz must be 100%)
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                              {series.equity.available.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>
                              Total: {series.equity.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                              <br />
                              Sold: {series.equity.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                              <br />
                              <strong>Available: {((series.equity.available / series.equity.total) * 100).toFixed(1)}%</strong>
                            </div>
                            <div style={{
                              marginTop: 8,
                              height: 6,
                              background: "rgba(255,255,255,0.3)",
                              borderRadius: 3,
                              overflow: "hidden"
                            }}>
                              <div style={{
                                height: "100%",
                                width: `${(series.equity.available / series.equity.total) * 100}%`,
                                background: "white"
                              }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Information */}
                      <div style={{
                        padding: 20,
                        background: "#f8f9fa",
                        borderRadius: 12,
                        border: "1px solid #e9ecef"
                      }}>
                        <h5 style={{ margin: "0 0 16px 0", color: stevensDarkGrey, fontSize: 16, fontWeight: 600 }}>
                          Series Information
                        </h5>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Issue Date</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: stevensDarkGrey }}>
                              {issueDate.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric'
                              })}
                            </div>
                            <div style={{ fontSize: 12, color: stevensTextGrey, marginTop: 2 }}>
                              {issueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Repayment Date</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: stevensDarkGrey }}>
                              {paymentDate.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric'
                              })}
                            </div>
                            <div style={{ fontSize: 12, color: stevensTextGrey, marginTop: 2 }}>
                              {paymentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Semester</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: stevensDarkGrey }}>
                              {series.semester}
                            </div>
                            <div style={{ fontSize: 12, color: stevensTextGrey, marginTop: 2 }}>
                              Tuition obligations period
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Maturity Period</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: stevensDarkGrey }}>
                              {Math.ceil((paymentDate - issueDate) / (1000 * 60 * 60 * 24))} days
                            </div>
                            <div style={{ fontSize: 12, color: stevensTextGrey, marginTop: 2 }}>
                              From issue to repayment
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          marginTop: 20, 
                          paddingTop: 20, 
                          borderTop: "1px solid #e9ecef",
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: 16
                        }}>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Total Pool Value</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: stevensRed }}>
                              {series.totalPoolValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Total Sold</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#6c757d" }}>
                              {totalSold.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                            </div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginTop: 2 }}>
                              ({((totalSold / series.totalPoolValue) * 100).toFixed(1)}% of pool)
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Total Available</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#28a745" }}>
                              {totalAvailable.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                            </div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginTop: 2 }}>
                              ({((totalAvailable / series.totalPoolValue) * 100).toFixed(1)}% of pool)
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Underlying Students</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: stevensDarkGrey }}>
                              {series.studentCount.toLocaleString('en-US')}
                            </div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginTop: 2 }}>
                              Average: {(series.totalPoolValue / series.studentCount).toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC/student
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Average SRPC</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: stevensDarkGrey }}>
                              {series.avgSRPC.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginTop: 2 }}>
                              Reputation score
                            </div>
                          </div>
                        </div>

                        {/* Repayment Status - Only show for past/matured series */}
                        {series.status === "Matured" && series.repayment && (
                          <div style={{ 
                            marginTop: 20, 
                            paddingTop: 20, 
                            borderTop: "1px solid #e9ecef"
                          }}>
                            <h5 style={{ margin: "0 0 16px 0", color: stevensDarkGrey, fontSize: 16, fontWeight: 600 }}>
                              Repayment Status
                            </h5>
                            <div style={{ 
                              display: "grid", 
                              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                              gap: 16 
                            }}>
                              {/* Senior Tranche Repayment */}
                              <div style={{
                                padding: 16,
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                borderRadius: 8,
                                color: "white"
                              }}>
                                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Senior Tranche</div>
                                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                                  {series.repayment.senior.repaidPercentage.toFixed(1)}%
                                </div>
                                <div style={{ fontSize: 11, opacity: 0.8 }}>
                                  {series.repayment.senior.repaid.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {series.senior.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                                </div>
                                <div style={{
                                  marginTop: 8,
                                  height: 6,
                                  background: "rgba(255,255,255,0.3)",
                                  borderRadius: 3,
                                  overflow: "hidden"
                                }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${series.repayment.senior.repaidPercentage}%`,
                                    background: "white"
                                  }} />
                                </div>
                              </div>

                              {/* Mezzanine Tranche Repayment */}
                              <div style={{
                                padding: 16,
                                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                borderRadius: 8,
                                color: "white"
                              }}>
                                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Mezzanine Tranche</div>
                                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                                  {series.repayment.mezzanine.repaidPercentage.toFixed(1)}%
                                </div>
                                <div style={{ fontSize: 11, opacity: 0.8 }}>
                                  {series.repayment.mezzanine.repaid.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {series.mezzanine.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                                </div>
                                <div style={{
                                  marginTop: 8,
                                  height: 6,
                                  background: "rgba(255,255,255,0.3)",
                                  borderRadius: 3,
                                  overflow: "hidden"
                                }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${series.repayment.mezzanine.repaidPercentage}%`,
                                    background: "white"
                                  }} />
                                </div>
                              </div>

                              {/* Equity Tranche Repayment */}
                              <div style={{
                                padding: 16,
                                background: series.repayment.equity.repaidPercentage !== null
                                  ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                                  : "linear-gradient(135deg, #cccccc 0%, #999999 100%)",
                                borderRadius: 8,
                                color: "white",
                                opacity: series.repayment.equity.repaidPercentage !== null ? 1 : 0.7
                              }}>
                                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Equity Tranche</div>
                                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                                  {series.repayment.equity.repaidPercentage !== null 
                                    ? `${series.repayment.equity.repaidPercentage.toFixed(1)}%`
                                    : "N/A"}
                                </div>
                                <div style={{ fontSize: 11, opacity: 0.8 }}>
                                  {series.repayment.equity.repaidPercentage !== null ? (
                                    <>
                                      {series.repayment.equity.repaid.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {series.equity.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                                    </>
                                  ) : (
                                    "Not sold"
                                  )}
                                </div>
                                {series.repayment.equity.repaidPercentage !== null && (
                                  <div style={{
                                    marginTop: 8,
                                    height: 6,
                                    background: "rgba(255,255,255,0.3)",
                                    borderRadius: 3,
                                    overflow: "hidden"
                                  }}>
                                    <div style={{
                                      height: "100%",
                                      width: `${series.repayment.equity.repaidPercentage}%`,
                                      background: "white"
                                    }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}

            {/* Show All History Button (Disabled) */}
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  disabled={true}
                  style={{
                    ...buttonStyle,
                    width: "100%",
                    marginTop: 24,
                    background: "#6c757d",
                    color: "white",
                    opacity: 0.6,
                    cursor: "not-allowed"
                  }}
                >
                  📜 Show All History (Coming Soon)
                </button>

                {/* Statistics Button */}
                <button
                  onClick={() => setShowStatistics(!showStatistics)}
                  style={{
                    ...buttonStyle,
                    width: "100%",
                    marginTop: 12,
                    background: stevensRed,
                    color: "white"
                  }}
                >
                  {showStatistics ? "🙈 Hide Statistics" : "📊 Show Statistics"}
                </button>

                {/* Statistics Panel */}
                {showStatistics && absSeries.length > 0 && (
                  <div style={{
                    marginTop: 24,
                    padding: 24,
                    background: "#f8f9fa",
                    borderRadius: 12,
                    border: "1px solid #e9ecef"
                  }}>
                    <h4 style={{ margin: "0 0 20px 0", color: stevensRed, fontSize: 18, fontWeight: 700 }}>
                      Detailed Statistics & Historical Comparison
                    </h4>

                    {/* Historical SRPC Comparison */}
                    {historicalSRPC.length > 0 && absSeries.length > 0 && (
                      <div style={{ marginBottom: 32 }}>
                        <h5 style={{ margin: "0 0 16px 0", color: stevensDarkGrey, fontSize: 16, fontWeight: 600 }}>
                          Average SRPC: Historical Comparison (Past 5 Years)
                        </h5>
                        <div style={{
                          padding: 20,
                          background: "white",
                          borderRadius: 8,
                          border: "1px solid #e9ecef"
                        }}>
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: stevensRed, marginBottom: 8 }}>
                              Current Series Average SRPC: {absSeries[0].avgSRPC.toFixed(2)}
                            </div>
                            <div style={{
                              height: 8,
                              background: "#e9ecef",
                              borderRadius: 4,
                              overflow: "hidden",
                              position: "relative"
                            }}>
                              <div style={{
                                height: "100%",
                                width: `${(absSeries[0].avgSRPC / 100) * 100}%`,
                                background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                                maxWidth: "100%"
                              }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {historicalSRPC.map((hist, i) => {
                              const comparison = absSeries[0].avgSRPC - hist.avgSRPC;
                              const isHigher = comparison > 0;
                              return (
                                <div key={i} style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "8px 12px",
                                  background: i % 2 === 0 ? "#f8f9fa" : "white",
                                  borderRadius: 6
                                }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: stevensDarkGrey }}>
                                    {hist.semester} {hist.year}
                                  </div>
                                  <div style={{ fontSize: 13, color: stevensTextGrey }}>
                                    {hist.avgSRPC.toFixed(2)} SRPC
                                  </div>
                                  <div style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: isHigher ? "#28a745" : "#dc3545",
                                    padding: "2px 8px",
                                    background: isHigher ? "#d4edda" : "#f8d7da",
                                    borderRadius: 4
                                  }}>
                                    {isHigher ? "+" : ""}{comparison.toFixed(2)} vs current
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tranche Sale Statistics */}
                    <div>
                      <h5 style={{ margin: "0 0 16px 0", color: stevensDarkGrey, fontSize: 16, fontWeight: 600 }}>
                        Tranche Sale Statistics by Series
                      </h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {absSeries.map((series) => (
                          <div key={series.id} style={{
                            padding: 20,
                            background: "white",
                            borderRadius: 8,
                            border: "1px solid #e9ecef"
                          }}>
                            <div style={{ marginBottom: 16 }}>
                              <h6 style={{ margin: "0 0 8px 0", color: stevensRed, fontSize: 14, fontWeight: 700 }}>
                                {series.seriesId} - {series.semester}
                              </h6>
                              <div style={{ fontSize: 12, color: stevensTextGrey }}>
                                Students: {series.studentCount.toLocaleString()} | 
                                Avg SRPC: {series.avgSRPC.toFixed(2)} | 
                                Demand: {series.demand.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                              {/* Senior Stats */}
                              <div style={{
                                padding: 12,
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                borderRadius: 8,
                                color: "white"
                              }}>
                                <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 6 }}>Senior Tranche</div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                                  {series.senior.soldPercentage.toFixed(1)}% Sold
                                </div>
                                <div style={{ fontSize: 10, opacity: 0.8 }}>
                                  {series.senior.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {series.senior.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                                </div>
                                <div style={{
                                  marginTop: 8,
                                  height: 4,
                                  background: "rgba(255,255,255,0.3)",
                                  borderRadius: 2,
                                  overflow: "hidden"
                                }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${series.senior.soldPercentage}%`,
                                    background: "white"
                                  }} />
                                </div>
                              </div>

                              {/* Mezzanine Stats */}
                              <div style={{
                                padding: 12,
                                background: series.senior.soldPercentage === 100 
                                  ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                                  : "linear-gradient(135deg, #cccccc 0%, #999999 100%)",
                                borderRadius: 8,
                                color: "white"
                              }}>
                                <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 6 }}>Mezzanine Tranche</div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                                  {series.mezzanine.soldPercentage.toFixed(1)}% Sold
                                </div>
                                <div style={{ fontSize: 10, opacity: 0.8 }}>
                                  {series.mezzanine.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {series.mezzanine.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                                </div>
                                {series.senior.soldPercentage < 100 && (
                                  <div style={{ fontSize: 9, opacity: 0.9, marginTop: 4 }}>
                                    (Senior must be 100% first)
                                  </div>
                                )}
                                <div style={{
                                  marginTop: 8,
                                  height: 4,
                                  background: "rgba(255,255,255,0.3)",
                                  borderRadius: 2,
                                  overflow: "hidden"
                                }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${series.mezzanine.soldPercentage}%`,
                                    background: "white"
                                  }} />
                                </div>
                              </div>

                              {/* Equity Stats */}
                              <div style={{
                                padding: 12,
                                background: series.senior.soldPercentage === 100 && series.mezzanine.soldPercentage === 100
                                  ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                                  : "linear-gradient(135deg, #cccccc 0%, #999999 100%)",
                                borderRadius: 8,
                                color: "white"
                              }}>
                                <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 6 }}>Equity Tranche</div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                                  {series.equity.soldPercentage.toFixed(1)}% Sold
                                </div>
                                <div style={{ fontSize: 10, opacity: 0.8 }}>
                                  {series.equity.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {series.equity.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                                </div>
                                {(series.senior.soldPercentage < 100 || series.mezzanine.soldPercentage < 100) && (
                                  <div style={{ fontSize: 9, opacity: 0.9, marginTop: 4 }}>
                                    (Senior & Mezz must be 100% first)
                                  </div>
                                )}
                                <div style={{
                                  marginTop: 8,
                                  height: 4,
                                  background: "rgba(255,255,255,0.3)",
                                  borderRadius: 2,
                                  overflow: "hidden"
                                }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${series.equity.soldPercentage}%`,
                                    background: "white"
                                  }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

        {/* ABS POOL TAB (formerly Visualization) */}
        {activeSubTab === "absPool" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ 
                  marginTop: 0, 
                  marginBottom: 8, 
                  color: stevensRed,
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  📊 ABS Pool Visualization
                </h3>
                <p style={{ margin: 0, color: stevensTextGrey, fontSize: 14 }}>
                  Current pool status aligned with ABS Investment Opportunities. Each dot represents a student with outstanding tuition. Color indicates SRPC-based credit risk.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  cursor: "pointer",
                  fontSize: 14,
                  color: stevensDarkGrey
                }}>
                  <input
                    type="checkbox"
                    checked={useMockData}
                    onChange={(e) => {
                      setUseMockData(e.target.checked);
                      if (e.target.checked) {
                        generateMockStudents(5000);
                      } else {
                        loadStudents();
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  Use Mock Data (5000 students)
                </label>
                {!useMockData && (
                  <button
                    onClick={() => generateMockStudents(5000)}
                    style={{
                      ...buttonStyle,
                      padding: "8px 16px",
                      fontSize: 12,
                      background: "#6c757d",
                      color: "white"
                    }}
                  >
                    🎲 Generate Mock Data
                  </button>
                )}
              </div>
            </div>

            {/* Current Series Information - Aligned with ABS Invest */}
            {absSeries.length > 0 && absSeries[0] && (
              <div style={{
                padding: 24,
                background: "#f8f9fa",
                borderRadius: 12,
                border: "1px solid #e9ecef",
                marginBottom: 24
              }}>
                <h4 style={{ margin: "0 0 16px 0", color: stevensRed, fontSize: 18, fontWeight: 700 }}>
                  Current Pool: {absSeries[0].seriesId} - {absSeries[0].semester}
                </h4>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                  marginBottom: 20
                }}>
                  {/* Total Pool Value */}
                  <div style={{
                    padding: 20,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: 12,
                    color: "white",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}>
                    <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Pool Value</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                      {absSeries[0].totalPoolValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                      {absSeries[0].studentCount.toLocaleString('en-US')} students
                    </div>
                  </div>

                  {/* Total Sold */}
                  <div style={{
                    padding: 20,
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    borderRadius: 12,
                    color: "white",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}>
                    <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Sold</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                      {(absSeries[0].senior.sold + absSeries[0].mezzanine.sold + absSeries[0].equity.sold).toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                      {(((absSeries[0].senior.sold + absSeries[0].mezzanine.sold + absSeries[0].equity.sold) / absSeries[0].totalPoolValue) * 100).toFixed(1)}% of pool
                    </div>
                  </div>

                  {/* Average SRPC */}
                  <div style={{
                    padding: 20,
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    borderRadius: 12,
                    color: "white",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}>
                    <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Average SRPC</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                      {absSeries[0].avgSRPC.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                      Reputation score
                    </div>
                  </div>

                </div>

                {/* Tranche Status */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 16
                }}>
                  {/* Senior Tranche */}
                  <div style={{
                    padding: 16,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: 8,
                    color: "white"
                  }}>
                    <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Senior Tranche</div>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                      {absSeries[0].senior.soldPercentage.toFixed(1)}% Sold
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>
                      {absSeries[0].senior.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {absSeries[0].senior.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                      Available: {absSeries[0].senior.available.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                    </div>
                    <div style={{
                      marginTop: 8,
                      height: 6,
                      background: "rgba(255,255,255,0.3)",
                      borderRadius: 3,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${absSeries[0].senior.soldPercentage}%`,
                        background: "white"
                      }} />
                    </div>
                  </div>

                  {/* Mezzanine Tranche */}
                  <div style={{
                    padding: 16,
                    background: absSeries[0].senior.soldPercentage === 100
                      ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                      : "linear-gradient(135deg, #cccccc 0%, #999999 100%)",
                    borderRadius: 8,
                    color: "white",
                    opacity: absSeries[0].senior.soldPercentage === 100 ? 1 : 0.7
                  }}>
                    <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Mezzanine Tranche</div>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                      {absSeries[0].mezzanine.soldPercentage.toFixed(1)}% Sold
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>
                      {absSeries[0].mezzanine.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {absSeries[0].mezzanine.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                      Available: {absSeries[0].mezzanine.available.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                    </div>
                    {absSeries[0].senior.soldPercentage < 100 && (
                      <div style={{ fontSize: 9, opacity: 0.9, marginTop: 4 }}>
                        (Senior must be 100% first)
                      </div>
                    )}
                    <div style={{
                      marginTop: 8,
                      height: 6,
                      background: "rgba(255,255,255,0.3)",
                      borderRadius: 3,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${absSeries[0].mezzanine.soldPercentage}%`,
                        background: "white"
                      }} />
                    </div>
                  </div>

                  {/* Equity Tranche */}
                  <div style={{
                    padding: 16,
                    background: absSeries[0].senior.soldPercentage === 100 && absSeries[0].mezzanine.soldPercentage === 100
                      ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                      : "linear-gradient(135deg, #cccccc 0%, #999999 100%)",
                    borderRadius: 8,
                    color: "white",
                    opacity: absSeries[0].senior.soldPercentage === 100 && absSeries[0].mezzanine.soldPercentage === 100 ? 1 : 0.7
                  }}>
                    <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Equity Tranche</div>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                      {absSeries[0].equity.soldPercentage.toFixed(1)}% Sold
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>
                      {absSeries[0].equity.sold.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {absSeries[0].equity.total.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                      Available: {absSeries[0].equity.available.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                    </div>
                    {(absSeries[0].senior.soldPercentage < 100 || absSeries[0].mezzanine.soldPercentage < 100) && (
                      <div style={{ fontSize: 9, opacity: 0.9, marginTop: 4 }}>
                        (Senior & Mezz must be 100% first)
                      </div>
                    )}
                    <div style={{
                      marginTop: 8,
                      height: 6,
                      background: "rgba(255,255,255,0.3)",
                      borderRadius: 3,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${absSeries[0].equity.soldPercentage}%`,
                        background: "white"
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div style={{ 
              marginBottom: 24, 
              padding: 16, 
              background: "#f8f9fa", 
              borderRadius: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: 16
            }}>
              <div style={{ fontWeight: 600, marginRight: 8 }}>SRPC Risk Levels:</div>
              {srpcRanges.map((range, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: range.color,
                    border: "2px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }} />
                  <span style={{ fontSize: 12 }}>{range.label} ({range.risk} Risk)</span>
                </div>
              ))}
            </div>

            {/* Statistics Section */}
            {students.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 24
              }}>
                {/* Total Value */}
                <div style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 12,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Receivables</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {students.reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                    ${(students.reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0) * 1).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Student Count */}
                <div style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  borderRadius: 12,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Students</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {students.length.toLocaleString('en-US')}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                    With outstanding tuition
                  </div>
                </div>

                {/* Average Tuition */}
                <div style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  borderRadius: 12,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Avg Tuition</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {(students.reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0) / students.length).toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                    Per student
                  </div>
                </div>

                {/* Average SRPC */}
                <div style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                  borderRadius: 12,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Avg SRPC</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {(students.reduce((sum, s) => sum + parseFloat(s.srpcBalance), 0) / students.length).toFixed(1)}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                    Reputation score
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Statistics */}
            {students.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                marginBottom: 24
              }}>
                {/* SRPC Distribution */}
                <div style={{
                  padding: 20,
                  background: "#f8f9fa",
                  borderRadius: 12,
                  border: "1px solid #e9ecef"
                }}>
                  <h4 style={{ margin: "0 0 16px 0", color: stevensRed, fontSize: 16 }}>SRPC Distribution</h4>
                  {srpcRanges.map((range, i) => {
                    const count = students.filter(s => s.colorRange.min === range.min).length;
                    const percentage = ((count / students.length) * 100).toFixed(1);
                    const totalValue = students
                      .filter(s => s.colorRange.min === range.min)
                      .reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0);
                    
                    return (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: range.color,
                              border: "2px solid white",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                            }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: stevensDarkGrey }}>
                              {range.label}
                            </span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: stevensDarkGrey }}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div style={{
                          height: 8,
                          background: "#e9ecef",
                          borderRadius: 4,
                          overflow: "hidden"
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${percentage}%`,
                            background: range.color,
                            transition: "width 0.3s ease"
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: stevensTextGrey, marginTop: 4 }}>
                          Value: {totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC ({((totalValue / students.reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0)) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tuition Distribution */}
                <div style={{
                  padding: 20,
                  background: "#f8f9fa",
                  borderRadius: 12,
                  border: "1px solid #e9ecef"
                }}>
                  <h4 style={{ margin: "0 0 16px 0", color: stevensRed, fontSize: 16 }}>Tuition Distribution</h4>
                  {[
                    { label: "Low ($5K-$15K)", min: 5000, max: 15000, color: "#28a745" },
                    { label: "Medium ($15K-$25K)", min: 15000, max: 25000, color: "#ffc107" },
                    { label: "High ($25K-$35K)", min: 25000, max: 35000, color: "#fd7e14" },
                    { label: "Very High ($35K+)", min: 35000, max: Infinity, color: "#dc3545" }
                  ].map((tier, i) => {
                    const count = students.filter(s => {
                      const tuition = parseFloat(s.tuitionOutstanding);
                      return tuition >= tier.min && tuition < tier.max;
                    }).length;
                    const percentage = ((count / students.length) * 100).toFixed(1);
                    const totalValue = students
                      .filter(s => {
                        const tuition = parseFloat(s.tuitionOutstanding);
                        return tuition >= tier.min && tuition < tier.max;
                      })
                      .reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0);
                    
                    return (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              background: tier.color
                            }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: stevensDarkGrey }}>
                              {tier.label}
                            </span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: stevensDarkGrey }}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div style={{
                          height: 8,
                          background: "#e9ecef",
                          borderRadius: 4,
                          overflow: "hidden"
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${percentage}%`,
                            background: tier.color,
                            transition: "width 0.3s ease"
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: stevensTextGrey, marginTop: 4 }}>
                          Value: {totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC ({((totalValue / students.reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0)) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Risk Metrics */}
            {students.length > 0 && (
              <div style={{
                padding: 20,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e9ecef",
                marginBottom: 24
              }}>
                <h4 style={{ margin: "0 0 16px 0", color: stevensRed, fontSize: 16 }}>Risk Metrics</h4>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 16
                }}>
                  {(() => {
                    const highRiskCount = students.filter(s => s.colorRange.risk === "High").length;
                    const mediumRiskCount = students.filter(s => s.colorRange.risk === "Medium").length;
                    const lowRiskCount = students.filter(s => s.colorRange.risk === "Low").length;
                    const veryLowRiskCount = students.filter(s => s.colorRange.risk === "Very Low").length;
                    
                    const totalValue = students.reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0);
                    const highRiskValue = students
                      .filter(s => s.colorRange.risk === "High")
                      .reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0);
                    
                    const estimatedDefaultRate = ((highRiskCount / students.length) * 0.15 + 
                                                   (mediumRiskCount / students.length) * 0.08 + 
                                                   (lowRiskCount / students.length) * 0.03 + 
                                                   (veryLowRiskCount / students.length) * 0.01) * 100;
                    
                    return (
                      <>
                        <div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>High Risk Exposure</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: "#dc3545" }}>
                            {((highRiskValue / totalValue) * 100).toFixed(1)}%
                          </div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginTop: 2 }}>
                            {highRiskValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Estimated Default Rate</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: estimatedDefaultRate > 8 ? "#dc3545" : estimatedDefaultRate > 5 ? "#ffc107" : "#28a745" }}>
                            {estimatedDefaultRate.toFixed(2)}%
                          </div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginTop: 2 }}>
                            Weighted average
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Portfolio Quality</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: estimatedDefaultRate < 5 ? "#28a745" : estimatedDefaultRate < 8 ? "#ffc107" : "#dc3545" }}>
                            {estimatedDefaultRate < 5 ? "Excellent" : estimatedDefaultRate < 8 ? "Good" : "Fair"}
                          </div>
                          <div style={{ fontSize: 11, color: stevensTextGrey, marginTop: 2 }}>
                            Based on SRPC
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Pot/Container Visualization - Smaller - Only show when showPoolPlot is true */}
            {showPoolPlot && (
              <div style={{
                position: "relative",
                width: "100%",
                height: "300px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                border: `2px solid ${stevensRed}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}>
                {loading ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: 20, 
                  color: "white",
                  fontSize: 14 
                }}>
                  Loading students...
                </div>
              ) : students.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: 20, 
                  color: "white",
                  fontSize: 14 
                }}>
                  {useMockData ? (
                    <>
                      Generating mock data...
                      <br />
                      <span style={{ fontSize: 11, opacity: 0.8 }}>
                        Please wait...
                      </span>
                    </>
                  ) : (
                    <>
                      No students with tuition obligations found.
                      <br />
                      <span style={{ fontSize: 11, opacity: 0.8 }}>
                        Add students and create tuition obligations to see them here, or enable mock data.
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: students.length > 1000 ? 4 : students.length > 500 ? 6 : 8,
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  overflow: "hidden"
                }}>
                  {students.map((student, i) => {
                    const range = student.colorRange;
                    // Scale dot size based on tuition (smaller dots for better visualization with many students)
                    const baseSize = students.length > 1000 ? 8 : students.length > 500 ? 12 : 20;
                    const size = Math.max(baseSize, Math.min(baseSize * 2, baseSize + (parseFloat(student.tuitionOutstanding) / 1000)));
                    
                    return (
                      <div
                        key={`${student.id}-${i}`}
                        title={`${student.name} (ID: ${student.id})\nSRPC: ${student.srpcBalance}\nTuition: ${student.tuitionOutstanding} SDC\nRisk: ${range.risk}`}
                        style={{
                          width: size,
                          height: size,
                          borderRadius: "50%",
                          background: range.color,
                          border: size > 10 ? "2px solid white" : "1px solid white",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 600,
                          fontSize: size > 15 ? 10 : 8,
                          position: "relative"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "scale(2)";
                          e.target.style.zIndex = 10;
                          e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "scale(1)";
                          e.target.style.zIndex = 1;
                          e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
                        }}
                      >
                        {size > 15 ? student.id.slice(-2) : ""}
                      </div>
                    );
                  })}
                </div>
              )}

                {/* Stats overlay */}
                {students.length > 0 && (
                  <div style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    background: "rgba(255,255,255,0.95)",
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: stevensDarkGrey
                  }}>
                    <div>{students.length} students</div>
                    <div>{students.reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} SDC</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <button
                onClick={() => useMockData ? generateMockStudents(5000) : loadStudents()}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  background: stevensRed,
                  color: "white"
                }}
              >
                🔄 Refresh Data
              </button>
              {useMockData && (
                <button
                  onClick={() => {
                    const counts = [100, 500, 1000, 2500, 5000];
                    const count = counts[Math.floor(Math.random() * counts.length)];
                    generateMockStudents(count);
                  }}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    background: "#6c757d",
                    color: "white"
                  }}
                >
                  🎲 Random Sample
                </button>
              )}
            </div>

            {/* Show Distribution Button */}
            <button
              onClick={() => setShowPoolPlot(!showPoolPlot)}
              style={{
                ...buttonStyle,
                width: "100%",
                background: showPoolPlot ? "#6c757d" : stevensRed,
                color: "white",
                fontSize: 16,
                padding: "14px 28px"
              }}
            >
              {showPoolPlot ? "🙈 Hide Distribution" : "📊 Show Distribution"}
            </button>
          </>
        )}

        {/* LEGACY POOLS TAB - Keep for backward compatibility but redirect to absPool */}
        {activeSubTab === "pools" && (
          <>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: 20, 
              color: stevensRed,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              🏦 ABS Pools
            </h3>

            {absPools.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: 40, 
                color: stevensTextGrey 
              }}>
                No ABS pools created yet.
                <br />
                <span style={{ fontSize: 14 }}>
                  Go to "Create Pool" tab to create your first ABS pool.
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {absPools.map((pool) => {
                  const stats = calculatePoolStats(pool);
                  return (
                    <div
                      key={pool.id}
                      onClick={() => setSelectedPool(pool)}
                      style={{
                        padding: 20,
                        border: `2px solid ${selectedPool?.id === pool.id ? stevensRed : "#e9ecef"}`,
                        borderRadius: 8,
                        background: selectedPool?.id === pool.id ? "#fff5f5" : "white",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPool?.id !== pool.id) {
                          e.target.style.borderColor = stevensRed;
                          e.target.style.background = "#fff5f5";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPool?.id !== pool.id) {
                          e.target.style.borderColor = "#e9ecef";
                          e.target.style.background = "white";
                        }
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                        <div>
                          <h4 style={{ margin: 0, color: stevensRed, fontSize: 18 }}>{pool.name}</h4>
                          <p style={{ margin: "4px 0 0 0", color: stevensTextGrey, fontSize: 12 }}>
                            Created: {new Date(pool.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span style={{
                          padding: "4px 12px",
                          background: pool.status === "Active" ? "#28a745" : "#6c757d",
                          color: "white",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {pool.status}
                        </span>
                      </div>

                      {stats && (
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: 16,
                          marginTop: 16
                        }}>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Total Value</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: stevensRed }}>
                              {stats.totalValue} SDC
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Students</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: stevensDarkGrey }}>
                              {stats.studentCount}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Avg SRPC</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: stevensDarkGrey }}>
                              {stats.avgSRPC}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: stevensTextGrey, marginBottom: 4 }}>Risk Level</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: stats.riskLevel === "Very Low" ? "#28a745" : stats.riskLevel === "Low" ? "#007bff" : stats.riskLevel === "Medium" ? "#ffc107" : "#dc3545" }}>
                              {stats.riskLevel}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Risk Distribution */}
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e9ecef" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: stevensDarkGrey }}>
                          Risk Distribution:
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {pool.riskDistribution.map((r, i) => (
                            r.count > 0 && (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  background: r.color
                                }} />
                                <span style={{ fontSize: 11 }}>{r.label}: {r.count}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* CREATE POOL TAB */}
        {activeSubTab === "create" && (
          <>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: 20, 
              color: stevensRed,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              ➕ Create ABS Pool
            </h3>
            <p style={{ marginBottom: 20, color: stevensTextGrey }}>
              Create a new ABS pool from students with outstanding tuition obligations.
              Students are automatically included based on their tuition receivables.
            </p>

            {!useMockData && students.length === 0 && (
              <div style={{
                padding: 16,
                background: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: 8,
                marginBottom: 20,
                color: "#856404"
              }}>
                💡 <strong>Tip:</strong> Enable "Use Mock Data" in the Visualization tab to generate 5000 sample students for testing.
              </div>
            )}

            <div style={{ 
              padding: 20, 
              background: "#f8f9fa", 
              borderRadius: 8,
              marginBottom: 20
            }}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: stevensDarkGrey }}>
                Available Students with Tuition:
              </div>
              {students.length === 0 ? (
                <div style={{ color: stevensTextGrey, fontSize: 14 }}>
                  No students with tuition obligations found. Please:
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>Add students in the Student Info tab</li>
                    <li>Create tuition obligations for them</li>
                    <li>Refresh the data</li>
                  </ul>
                </div>
              ) : (
                <div style={{ fontSize: 14, color: stevensDarkGrey }}>
                  <strong>{students.length}</strong> students with outstanding tuition
                  <br />
                  Total value: <strong style={{ color: stevensRed }}>
                    {students.reduce((sum, s) => sum + parseFloat(s.tuitionOutstanding), 0).toFixed(2)} SDC
                  </strong>
                </div>
              )}
            </div>

            <button
              onClick={createMockABSPool}
              disabled={students.length === 0}
              style={{
                ...buttonStyle,
                width: "100%",
                background: students.length === 0 ? "#ccc" : stevensRed,
                color: "white",
                cursor: students.length === 0 ? "not-allowed" : "pointer",
                opacity: students.length === 0 ? 0.6 : 1
              }}
            >
              ➕ Create New ABS Pool
            </button>

            {absPools.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ color: stevensRed, marginBottom: 12 }}>Created Pools: {absPools.length}</h4>
                <p style={{ color: stevensTextGrey, fontSize: 14 }}>
                  Go to "ABS Pools" tab to view and manage your pools.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

