import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { cardStyle, stevensRed, stevensTextGrey, buttonStyle, inputStyle } from "../../styles/constants";
import { SDC_ADDRESS, SBC_ADDRESS } from "../../contracts/config";

// AMM Contract ABI (simplified - you'll need to add the full ABI after deployment)
const AMM_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint256, uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256)",
  "function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) pure returns (uint256)",
  "function addLiquidity(uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address to) returns (uint256)",
  "function removeLiquidity(uint256 liquidity, uint256 amount0Min, uint256 amount1Min, address to) returns (uint256, uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
  "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
  "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)"
];

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export default function AMMExchange({ wallet, ammAddress, sdcContract, sbcContract }) {
  const [activeTab, setActiveTab] = useState("swap");
  const [ammContract, setAmmContract] = useState(null);
  const [token0Contract, setToken0Contract] = useState(null);
  const [token1Contract, setToken1Contract] = useState(null);
  
  // Pool data
  const [reserves, setReserves] = useState({ reserve0: "0", reserve1: "0" });
  const [lpBalance, setLpBalance] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  
  // Swap state
  const [swapDirection, setSwapDirection] = useState("sdcToSbc"); // "sdcToSbc" or "sbcToSdc"
  const [swapAmount, setSwapAmount] = useState("");
  const [swapOutput, setSwapOutput] = useState("");
  const [sdcBalance, setSdcBalance] = useState("0");
  const [sbcBalance, setSbcBalance] = useState("0");
  
  // Liquidity state
  const [liquidityAmount0, setLiquidityAmount0] = useState("");
  const [liquidityAmount1, setLiquidityAmount1] = useState("");
  const [removeLiquidityAmount, setRemoveLiquidityAmount] = useState("");

  // Initialize contracts
  useEffect(() => {
    if (!wallet || !ammAddress) return;

    const initContracts = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // AMM contract
        const amm = new ethers.Contract(ammAddress, AMM_ABI, signer);
        setAmmContract(amm);

        // Get token addresses from AMM
        const token0Addr = await amm.token0();
        const token1Addr = await amm.token1();

        // Token contracts
        const token0 = new ethers.Contract(token0Addr, ERC20_ABI, signer);
        const token1 = new ethers.Contract(token1Addr, ERC20_ABI, signer);
        setToken0Contract(token0);
        setToken1Contract(token1);

        // Load initial data
        await loadPoolData(amm, token0, token1, signer.address);
      } catch (error) {
        console.error("Error initializing contracts:", error);
      }
    };

    initContracts();
  }, [wallet, ammAddress]);

  // Load pool data
  const loadPoolData = async (amm, token0, token1, userAddress) => {
    try {
      // Get reserves
      const [reserve0, reserve1] = await amm.getReserves();
      setReserves({
        reserve0: ethers.formatEther(reserve0),
        reserve1: ethers.formatEther(reserve1)
      });

      // Get LP balance
      const lpBal = await amm.balanceOf(userAddress);
      setLpBalance(ethers.formatEther(lpBal));

      // Get total supply
      const supply = await amm.totalSupply();
      setTotalSupply(ethers.formatEther(supply));

      // Get token balances
      const sdcBal = await token0.balanceOf(userAddress);
      const sbcBal = await token1.balanceOf(userAddress);
      setSdcBalance(ethers.formatEther(sdcBal));
      setSbcBalance(ethers.formatEther(sbcBal));
    } catch (error) {
      console.error("Error loading pool data:", error);
    }
  };

  // Refresh pool data
  const refreshData = async () => {
    if (!ammContract || !token0Contract || !token1Contract || !wallet) return;
    await loadPoolData(ammContract, token0Contract, token1Contract, wallet);
  };

  // Calculate swap output
  useEffect(() => {
    if (!ammContract || !swapAmount || parseFloat(swapAmount) <= 0) {
      setSwapOutput("");
      return;
    }

    const calculateOutput = async () => {
      try {
        const [reserve0, reserve1] = await ammContract.getReserves();
        const amountIn = ethers.parseEther(swapAmount);
        
        let amountOut;
        if (swapDirection === "sdcToSbc") {
          // Swapping SDC (token0) for SBC (token1)
          amountOut = await ammContract.getAmountOut(amountIn, reserve0, reserve1);
        } else {
          // Swapping SBC (token1) for SDC (token0)
          amountOut = await ammContract.getAmountOut(amountIn, reserve1, reserve0);
        }
        
        setSwapOutput(ethers.formatEther(amountOut));
      } catch (error) {
        console.error("Error calculating output:", error);
        setSwapOutput("");
      }
    };

    calculateOutput();
  }, [swapAmount, swapDirection, ammContract]);

  // Handle swap
  const handleSwap = async () => {
    if (!ammContract || !swapAmount || parseFloat(swapAmount) <= 0) {
      return alert("Please enter an amount");
    }

    try {
      const [reserve0, reserve1] = await ammContract.getReserves();
      const amountIn = ethers.parseEther(swapAmount);
      
      let amountOut;
      let tokenIn, tokenOut;
      
      if (swapDirection === "sdcToSbc") {
        tokenIn = token0Contract;
        amountOut = await ammContract.getAmountOut(amountIn, reserve0, reserve1);
        
        // Approve if needed
        const allowance = await tokenIn.allowance(wallet, ammAddress);
        if (allowance < amountIn) {
          const approveTx = await tokenIn.approve(ammAddress, ethers.MaxUint256);
          await approveTx.wait();
        }
        
        // Swap: SDC -> SBC
        const swapTx = await ammContract.swap(0, amountOut, wallet, "0x");
        await swapTx.wait();
      } else {
        tokenIn = token1Contract;
        amountOut = await ammContract.getAmountOut(amountIn, reserve1, reserve0);
        
        // Approve if needed
        const allowance = await tokenIn.allowance(wallet, ammAddress);
        if (allowance < amountIn) {
          const approveTx = await tokenIn.approve(ammAddress, ethers.MaxUint256);
          await approveTx.wait();
        }
        
        // Swap: SBC -> SDC
        const swapTx = await ammContract.swap(amountOut, 0, wallet, "0x");
        await swapTx.wait();
      }

      alert(`✅ Swap successful!`);
      setSwapAmount("");
      setSwapOutput("");
      await refreshData();
    } catch (error) {
      alert("❌ Swap failed: " + (error.reason || error.message));
    }
  };

  // Handle add liquidity
  const handleAddLiquidity = async () => {
    if (!ammContract || !liquidityAmount0 || !liquidityAmount1) {
      return alert("Please enter amounts for both tokens");
    }

    try {
      const amount0 = ethers.parseEther(liquidityAmount0);
      const amount1 = ethers.parseEther(liquidityAmount1);
      
      // Approve tokens if needed
      const allowance0 = await token0Contract.allowance(wallet, ammAddress);
      const allowance1 = await token1Contract.allowance(wallet, ammAddress);
      
      if (allowance0 < amount0) {
        const approveTx0 = await token0Contract.approve(ammAddress, ethers.MaxUint256);
        await approveTx0.wait();
      }
      
      if (allowance1 < amount1) {
        const approveTx1 = await token1Contract.approve(ammAddress, ethers.MaxUint256);
        await approveTx1.wait();
      }
      
      // Add liquidity (with 1% slippage tolerance)
      const amount0Min = amount0 * 99n / 100n;
      const amount1Min = amount1 * 99n / 100n;
      
      const addTx = await ammContract.addLiquidity(
        amount0,
        amount1,
        amount0Min,
        amount1Min,
        wallet
      );
      await addTx.wait();
      
      alert(`✅ Liquidity added successfully!`);
      setLiquidityAmount0("");
      setLiquidityAmount1("");
      await refreshData();
    } catch (error) {
      alert("❌ Add liquidity failed: " + (error.reason || error.message));
    }
  };

  // Handle remove liquidity
  const handleRemoveLiquidity = async () => {
    if (!ammContract || !removeLiquidityAmount || parseFloat(removeLiquidityAmount) <= 0) {
      return alert("Please enter LP token amount");
    }

    const confirmRemove = confirm(`Are you sure you want to remove ${removeLiquidityAmount} LP tokens?`);
    if (!confirmRemove) return;

    try {
      const liquidity = ethers.parseEther(removeLiquidityAmount);
      
      // The AMM contract is the LP token itself (extends ERC20)
      // We need to approve the AMM contract to burn our LP tokens
      const allowance = await ammContract.allowance(wallet, ammAddress);
      if (allowance < liquidity) {
        const approveTx = await ammContract.approve(ammAddress, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      // Remove liquidity (with 1% slippage tolerance)
      const [reserve0, reserve1] = await ammContract.getReserves();
      const totalSupply = await ammContract.totalSupply();
      const amount0Min = (reserve0 * liquidity * 99n) / (totalSupply * 100n);
      const amount1Min = (reserve1 * liquidity * 99n) / (totalSupply * 100n);
      
      const removeTx = await ammContract.removeLiquidity(
        liquidity,
        amount0Min,
        amount1Min,
        wallet
      );
      await removeTx.wait();
      
      alert(`✅ Liquidity removed successfully!`);
      setRemoveLiquidityAmount("");
      await refreshData();
    } catch (error) {
      alert("❌ Remove liquidity failed: " + (error.reason || error.message));
    }
  };

  // Calculate optimal liquidity amounts
  const calculateOptimalLiquidity = () => {
    if (!liquidityAmount0 || parseFloat(liquidityAmount0) <= 0) {
      setLiquidityAmount1("");
      return;
    }

    const reserve0 = parseFloat(reserves.reserve0);
    const reserve1 = parseFloat(reserves.reserve1);
    
    if (reserve0 > 0 && reserve1 > 0) {
      const ratio = reserve1 / reserve0;
      const optimalAmount1 = (parseFloat(liquidityAmount0) * ratio).toFixed(6);
      setLiquidityAmount1(optimalAmount1);
    }
  };

  useEffect(() => {
    calculateOptimalLiquidity();
  }, [liquidityAmount0, reserves]);

  return (
    <div>
      {/* Contract Address */}
      {ammAddress && (
        <div style={{
          marginBottom: 16,
          padding: "12px 16px",
          background: "#f8f9fa",
          borderRadius: 6,
          border: "1px solid #e9ecef"
        }}>
          <span style={{ fontSize: 12, color: stevensTextGrey, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            AMM Contract Address:{" "}
          </span>
          <span style={{ fontSize: 12, fontFamily: "monospace", color: stevensRed, fontWeight: 600 }}>
            {ammAddress}
          </span>
        </div>
      )}

      {/* Pool Info */}
      <div style={cardStyle}>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: 16, 
          color: stevensRed,
          fontSize: 18,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          📊 Pool Information
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 12, color: stevensTextGrey }}>SDC Reserve:</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>{parseFloat(reserves.reserve0).toFixed(4)} SDC</div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: stevensTextGrey }}>SBC Reserve:</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>{parseFloat(reserves.reserve1).toFixed(4)} SBC</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 12, color: stevensTextGrey }}>Your LP Tokens:</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>{parseFloat(lpBalance).toFixed(4)} LP</div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: stevensTextGrey }}>Total LP Supply:</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>{parseFloat(totalSupply).toFixed(4)} LP</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <span style={{ fontSize: 12, color: stevensTextGrey }}>Your SDC Balance:</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>{parseFloat(sdcBalance).toFixed(4)} SDC</div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: stevensTextGrey }}>Your SBC Balance:</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>{parseFloat(sbcBalance).toFixed(4)} SBC</div>
          </div>
        </div>
        <button
          onClick={refreshData}
          style={{
            ...buttonStyle,
            marginTop: 12,
            width: "100%",
            background: "#666",
            fontSize: 12
          }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
        borderBottom: `2px solid ${stevensRed}`,
        paddingBottom: 0
      }}>
        {[
          { id: "swap", label: "🔄 Swap" },
          { id: "add", label: "➕ Add Liquidity" },
          { id: "remove", label: "➖ Remove Liquidity" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px",
              border: "none",
              background: activeTab === tab.id ? stevensRed : "transparent",
              color: activeTab === tab.id ? "white" : stevensRed,
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 12,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: activeTab === tab.id ? `3px solid ${stevensRed}` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
              borderRadius: "6px 6px 0 0"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Swap Tab */}
      {activeTab === "swap" && (
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
            🔄 Swap Tokens
          </h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: stevensTextGrey, fontSize: 14, fontWeight: 600 }}>
              Swap Direction
            </label>
            <select
              value={swapDirection}
              onChange={(e) => {
                setSwapDirection(e.target.value);
                setSwapAmount("");
                setSwapOutput("");
              }}
              style={inputStyle}
            >
              <option value="sdcToSbc">SDC → SBC</option>
              <option value="sbcToSdc">SBC → SDC</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: stevensTextGrey, fontSize: 14, fontWeight: 600 }}>
              Amount In ({swapDirection === "sdcToSbc" ? "SDC" : "SBC"})
            </label>
            <input
              type="number"
              placeholder="0.0"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: 12, color: stevensTextGrey, marginTop: 4 }}>
              Balance: {swapDirection === "sdcToSbc" ? parseFloat(sdcBalance).toFixed(4) : parseFloat(sbcBalance).toFixed(4)} {swapDirection === "sdcToSbc" ? "SDC" : "SBC"}
            </div>
          </div>

          {swapOutput && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, color: stevensTextGrey, fontSize: 14, fontWeight: 600 }}>
                Amount Out ({swapDirection === "sdcToSbc" ? "SBC" : "SDC"})
              </label>
              <div style={{
                padding: "12px 16px",
                background: "#f8f9fa",
                borderRadius: 6,
                border: "2px solid #e0e0e0",
                fontSize: 16,
                fontWeight: 600,
                color: "#333"
              }}>
                {parseFloat(swapOutput).toFixed(6)} {swapDirection === "sdcToSbc" ? "SBC" : "SDC"}
              </div>
            </div>
          )}

          <button
            onClick={handleSwap}
            disabled={!swapAmount || parseFloat(swapAmount) <= 0 || !swapOutput}
            style={{
              ...buttonStyle,
              width: "100%",
              background: stevensRed,
              opacity: (!swapAmount || parseFloat(swapAmount) <= 0 || !swapOutput) ? 0.5 : 1,
              cursor: (!swapAmount || parseFloat(swapAmount) <= 0 || !swapOutput) ? "not-allowed" : "pointer"
            }}
          >
            Swap
          </button>
        </div>
      )}

      {/* Add Liquidity Tab */}
      {activeTab === "add" && (
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
            ➕ Add Liquidity
          </h3>
          <p style={{ marginBottom: 20, color: stevensTextGrey, fontSize: 14 }}>
            Add equal value of SDC and SBC to the liquidity pool. The second amount will be calculated automatically based on the current pool ratio.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: stevensTextGrey, fontSize: 14, fontWeight: 600 }}>
              SDC Amount
            </label>
            <input
              type="number"
              placeholder="0.0"
              value={liquidityAmount0}
              onChange={(e) => setLiquidityAmount0(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: 12, color: stevensTextGrey, marginTop: 4 }}>
              Balance: {parseFloat(sdcBalance).toFixed(4)} SDC
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: stevensTextGrey, fontSize: 14, fontWeight: 600 }}>
              SBC Amount
            </label>
            <input
              type="number"
              placeholder="0.0"
              value={liquidityAmount1}
              onChange={(e) => setLiquidityAmount1(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: 12, color: stevensTextGrey, marginTop: 4 }}>
              Balance: {parseFloat(sbcBalance).toFixed(4)} SBC
            </div>
          </div>

          <button
            onClick={handleAddLiquidity}
            disabled={!liquidityAmount0 || !liquidityAmount1 || parseFloat(liquidityAmount0) <= 0 || parseFloat(liquidityAmount1) <= 0}
            style={{
              ...buttonStyle,
              width: "100%",
              background: stevensRed,
              opacity: (!liquidityAmount0 || !liquidityAmount1 || parseFloat(liquidityAmount0) <= 0 || parseFloat(liquidityAmount1) <= 0) ? 0.5 : 1,
              cursor: (!liquidityAmount0 || !liquidityAmount1 || parseFloat(liquidityAmount0) <= 0 || parseFloat(liquidityAmount1) <= 0) ? "not-allowed" : "pointer"
            }}
          >
            Add Liquidity
          </button>
        </div>
      )}

      {/* Remove Liquidity Tab */}
      {activeTab === "remove" && (
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
            ➖ Remove Liquidity
          </h3>
          <p style={{ marginBottom: 20, color: stevensTextGrey, fontSize: 14 }}>
            Remove liquidity by burning your LP tokens. You'll receive SDC and SBC back proportional to your share of the pool.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: stevensTextGrey, fontSize: 14, fontWeight: 600 }}>
              LP Token Amount
            </label>
            <input
              type="number"
              placeholder="0.0"
              value={removeLiquidityAmount}
              onChange={(e) => setRemoveLiquidityAmount(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: 12, color: stevensTextGrey, marginTop: 4 }}>
              Your LP Balance: {parseFloat(lpBalance).toFixed(4)} LP
            </div>
          </div>

          {removeLiquidityAmount && parseFloat(removeLiquidityAmount) > 0 && parseFloat(totalSupply) > 0 && (
            <div style={{ marginBottom: 16, padding: 12, background: "#f8f9fa", borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: stevensTextGrey, marginBottom: 8 }}>You will receive approximately:</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
                {((parseFloat(removeLiquidityAmount) / parseFloat(totalSupply)) * parseFloat(reserves.reserve0)).toFixed(4)} SDC
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
                {((parseFloat(removeLiquidityAmount) / parseFloat(totalSupply)) * parseFloat(reserves.reserve1)).toFixed(4)} SBC
              </div>
            </div>
          )}

          <button
            onClick={handleRemoveLiquidity}
            disabled={!removeLiquidityAmount || parseFloat(removeLiquidityAmount) <= 0 || parseFloat(removeLiquidityAmount) > parseFloat(lpBalance)}
            style={{
              ...buttonStyle,
              width: "100%",
              background: "#8B1E2E",
              opacity: (!removeLiquidityAmount || parseFloat(removeLiquidityAmount) <= 0 || parseFloat(removeLiquidityAmount) > parseFloat(lpBalance)) ? 0.5 : 1,
              cursor: (!removeLiquidityAmount || parseFloat(removeLiquidityAmount) <= 0 || parseFloat(removeLiquidityAmount) > parseFloat(lpBalance)) ? "not-allowed" : "pointer"
            }}
          >
            Remove Liquidity
          </button>
        </div>
      )}
    </div>
  );
}

