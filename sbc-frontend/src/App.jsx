import { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import { SBC_ABI } from "./contracts/abi";
import { SBC_ADDRESS } from "./contracts/config";

export default function App() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState(null);

  const [newStudent, setNewStudent] = useState({
    wallet: "",
    name: "",
    id: ""
  });

  const [studentInfo, setStudentInfo] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [available, setAvailable] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // ---------------- CONNECT WALLET ----------------
  async function connectWallet() {
    const provider = await detectEthereumProvider();
    if (!provider) return alert("MetaMask not found!");

    await provider.request({ method: "eth_requestAccounts" });
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();

    setWallet(await signer.getAddress());
    setContract(new ethers.Contract(SBC_ADDRESS, SBC_ABI, signer));
  }

  // ---------------- ADD STUDENT ----------------
  async function addStudent() {
    if (!ethers.isAddress(newStudent.wallet)) return alert("Invalid wallet address");
    if (!newStudent.name || !newStudent.id) return alert("Please fill all fields");

    try {
      const studentId = BigInt(newStudent.id);
      const existing = await contract.getStudentById(studentId);
      if (existing.wallet !== ethers.ZeroAddress) {
        const ok = confirm(
          `⚠️ Student exists:\nName: ${existing.name}\nWallet: ${existing.wallet}\n\nOverwrite?`
        );
        if (!ok) return;
      }

    const tx = await contract.addStudent(
      newStudent.wallet,
      newStudent.name,
        studentId
    );
    await tx.wait();

    alert("✅ Student added!");
    setNewStudent({ wallet: "", name: "", id: "" });
    } catch (err) {
      alert("❌ Failed to add student: " + (err.message || "Unknown error"));
    }
  }

  // ---------------- DELETE STUDENT ----------------
  async function deleteStudent() {
    const sid = prompt("Enter student ID to delete:");
    if (!sid) return;

    const ok = confirm(`⚠️ Are you sure you want to delete student ID ${sid}?`);
    if (!ok) return;

    try {
      const tx = await contract.removeStudent(BigInt(sid));
      await tx.wait();
      alert("🗑️ Student removed!");
    } catch (err) {
      alert("❌ Delete failed");
    }
  }

  // ---------------- SEARCH BY ID ----------------
  async function searchById() {
    const sid = prompt("Enter student ID:");
    if (!sid) return;

    try {
      const studentId = BigInt(sid);
      const info = await contract.getStudentById(studentId);
      
      if (info.wallet === ethers.ZeroAddress) {
        alert("❌ Student not found");
        return;
      }

      const balance = await contract.balanceOf(info.wallet);

      setStudentInfo({
        name: info.name,
        studentId: info.studentId.toString(),
        wallet: info.wallet,
        isWhitelisted: info.isWhitelisted,
        balance: ethers.formatEther(balance)
      });
    } catch (err) {
      alert("❌ Student not found: " + (err.message || "Invalid student ID"));
    }
  }

  // ---------------- LOAD ALL STUDENTS ----------------
  async function loadAllStudents() {
    const list = await contract.getAllStudents();

    // Filter out students with zero address
    const validStudents = list.filter(s => 
      s.wallet && s.wallet !== ethers.ZeroAddress && s.wallet !== "0x0000000000000000000000000000000000000000"
    );

    // Remove duplicates based on student ID (keep first occurrence)
    const seenIds = new Set();
    const uniqueStudents = validStudents.filter(s => {
      const studentId = s.studentId.toString();
      if (seenIds.has(studentId)) {
        return false;
      }
      seenIds.add(studentId);
      return true;
    });

    const enriched = await Promise.all(
      uniqueStudents.map(async (s) => ({
        name: s.name,
        id: s.studentId.toString(),
        wallet: s.wallet,
        balance: ethers.formatEther(await contract.balanceOf(s.wallet))
      }))
    );

    setStudentList(enriched);
  }

  // ---------------- AVAILABLE ADDRESSES ----------------
  async function loadAvailableAddresses() {
    const res = await fetch("/addresses.txt");
    const text = await res.text();

    const raw = text.match(/0x[a-fA-F0-9]{40}/g) || [];
    const publicAddresses = raw.filter(addr => ethers.isAddress(addr));

    const onchain = await contract.getAllStudents();
    const used = onchain.map(s => s.wallet.toLowerCase());

    const unused = publicAddresses.filter(
      addr => !used.includes(addr.toLowerCase())
    );

    setAvailable(unused.slice(0, 3)); // show only top 3
  }

  // ---------------- TRANSFER ----------------
  async function transferTokens() {
    const to = prompt("Recipient wallet:");
    if (!to) return;
    const amount = prompt("Amount:");
    if (!amount) return;
    
    if (!ethers.isAddress(to)) return alert("Invalid address");
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return alert("Invalid amount");
    }

    try {
    const tx = await contract.transfer(to, ethers.parseEther(amount));
    await tx.wait();
      alert(`✅ Transferred ${amount} SBC to ${to}`);
    } catch (err) {
      const errorMsg = err.message || err.reason || String(err);
      if (errorMsg.includes("not whitelisted") || errorMsg.includes("Recipient not whitelisted")) {
        alert(`❌ Transfer failed: Recipient ${to} is not whitelisted.\n\nPlease add them as a student first.`);
      } else {
        alert("❌ Transfer failed: " + errorMsg);
      }
    }
  }

  // ---------------- MINT ----------------
  async function mintTokens() {
    const to = prompt("Recipient wallet address:");
    if (!to) return;
    if (!ethers.isAddress(to)) return alert("Invalid wallet address");
    
    const amount = prompt("Amount to mint:");
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return alert("Invalid amount");
    }

    try {
      const tx = await contract.mint(to, ethers.parseEther(amount));
      await tx.wait();
      alert(`✅ Minted ${amount} SBC to ${to}`);
    } catch (err) {
      const errorMsg = err.message || err.reason || String(err);
      if (errorMsg.includes("not whitelisted") || errorMsg.includes("Recipient not whitelisted")) {
        alert(`❌ Mint failed: Recipient ${to} is not whitelisted.\n\nPlease add them as a student first using "Add / Update Student".`);
      } else {
        alert("❌ Mint failed: " + errorMsg);
      }
    }
  }

  // ---------------- BURN ----------------
  async function burnTokens() {
    const from = prompt("Wallet address to burn from:");
    if (!from || !ethers.isAddress(from)) return alert("Invalid wallet address");
    
    const amount = prompt("Amount to burn:");
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return alert("Invalid amount");
    }

    const ok = confirm(`⚠️ Are you sure you want to burn ${amount} SBC from ${from}?`);
    if (!ok) return;

    try {
      const tx = await contract.burn(from, ethers.parseEther(amount));
      await tx.wait();
      alert(`🔥 Burned ${amount} SBC from ${from}`);
    } catch (err) {
      alert("❌ Burn failed: " + (err.message || "Insufficient balance"));
    }
  }

  // ---------------- TRANSACTION HISTORY ----------------
  async function loadTransactionHistory() {
    if (!contract) return alert("Please connect wallet first");
    
    setIsLoadingTransactions(true);
    setTransactionHistory([]);

    try {
      const provider = await detectEthereumProvider();
      if (!provider) return alert("Provider not found");
      
      const ethersProvider = new ethers.BrowserProvider(provider);
      const contractWithProvider = new ethers.Contract(SBC_ADDRESS, SBC_ABI, ethersProvider);
      
      // Get current block number to limit search range
      const currentBlock = await ethersProvider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000); // Last 1000 blocks

      // Get all events (Transfer, StudentAdded, StudentRemoved, TokensMinted, TokensBurned)
      const transferFilter = contractWithProvider.filters.Transfer();
      const studentAddedFilter = contractWithProvider.filters.StudentAdded();
      const studentRemovedFilter = contractWithProvider.filters.StudentRemoved();
      const tokensMintedFilter = contractWithProvider.filters.TokensMinted();
      const tokensBurnedFilter = contractWithProvider.filters.TokensBurned();

      const [transferEvents, studentAddedEvents, studentRemovedEvents, tokensMintedEvents, tokensBurnedEvents] = await Promise.all([
        contractWithProvider.queryFilter(transferFilter, fromBlock, currentBlock),
        contractWithProvider.queryFilter(studentAddedFilter, fromBlock, currentBlock),
        contractWithProvider.queryFilter(studentRemovedFilter, fromBlock, currentBlock),
        contractWithProvider.queryFilter(tokensMintedFilter, fromBlock, currentBlock),
        contractWithProvider.queryFilter(tokensBurnedFilter, fromBlock, currentBlock)
      ]);

      // Get all transactions sent to the contract address
      const allTransactions = [];
      const seenHashes = new Set();

      // Process all events
      const allEvents = [
        ...transferEvents.map(e => ({ ...e, eventType: "Transfer" })),
        ...studentAddedEvents.map(e => ({ ...e, eventType: "StudentAdded" })),
        ...studentRemovedEvents.map(e => ({ ...e, eventType: "StudentRemoved" })),
        ...tokensMintedEvents.map(e => ({ ...e, eventType: "TokensMinted" })),
        ...tokensBurnedEvents.map(e => ({ ...e, eventType: "TokensBurned" }))
      ];

      for (const event of allEvents) {
        if (seenHashes.has(event.transactionHash)) continue;
        seenHashes.add(event.transactionHash);

        const tx = await ethersProvider.getTransaction(event.transactionHash);
        const receipt = await ethersProvider.getTransactionReceipt(event.transactionHash);
        const block = await ethersProvider.getBlock(receipt.blockNumber);
        const date = new Date(Number(block.timestamp) * 1000);

        // Process different event types
        let functionName = event.eventType || "Unknown";
        let functionParams = "";
        let transferFrom = null;
        let transferTo = null;
        let transferAmount = "0";

        if (event.eventType === "Transfer") {
          transferFrom = event.args.from;
          transferTo = event.args.to;
          transferAmount = ethers.formatEther(event.args.value);
          functionParams = `From: ${event.args.from.substring(0, 6)}...${event.args.from.substring(38)}, To: ${event.args.to.substring(0, 6)}...${event.args.to.substring(38)}, Amount: ${ethers.formatEther(event.args.value)} SBC`;
        } else if (event.eventType === "StudentAdded") {
          transferTo = event.args.wallet;
          functionParams = `Wallet: ${event.args.wallet.substring(0, 6)}...${event.args.wallet.substring(38)}, Name: ${event.args.name}, ID: ${event.args.studentId}`;
        } else if (event.eventType === "StudentRemoved") {
          transferFrom = event.args.wallet;
          functionParams = `Student ID: ${event.args.studentId}, Wallet: ${event.args.wallet.substring(0, 6)}...${event.args.wallet.substring(38)}`;
        } else if (event.eventType === "TokensMinted") {
          transferTo = event.args.to;
          transferAmount = ethers.formatEther(event.args.amount);
          functionParams = `To: ${event.args.to.substring(0, 6)}...${event.args.to.substring(38)}, Amount: ${ethers.formatEther(event.args.amount)} SBC`;
        } else if (event.eventType === "TokensBurned") {
          transferFrom = event.args.from;
          transferAmount = ethers.formatEther(event.args.amount);
          functionParams = `From: ${event.args.from.substring(0, 6)}...${event.args.from.substring(38)}, Amount: ${ethers.formatEther(event.args.amount)} SBC`;
        }

        allTransactions.push({
          hash: event.transactionHash,
          blockNumber: receipt.blockNumber,
          timestamp: block.timestamp,
          date: date.toLocaleString(),
          from: tx.from,
          to: tx.to || SBC_ADDRESS,
          value: ethers.formatEther(tx.value || 0),
          gasUsed: receipt.gasUsed.toString(),
          gasPrice: tx.gasPrice ? tx.gasPrice.toString() : "0",
          status: receipt.status === 1 ? "Success" : "Failed",
          transferFrom: transferFrom || tx.from,
          transferTo: transferTo || tx.to,
          transferAmount: transferAmount,
          functionName: functionName,
          functionParams: functionParams,
          type: event.eventType || "Unknown"
        });
      }

      // Get all other transactions to the contract (non-Transfer)
      // We'll scan blocks for transactions to our contract
      for (let blockNum = currentBlock; blockNum >= fromBlock && blockNum >= 0; blockNum--) {
        try {
          const block = await ethersProvider.getBlock(blockNum, true);
          if (!block || !block.transactions) continue;

          for (const txHash of block.transactions) {
            if (seenHashes.has(txHash)) continue;

            try {
              const tx = await ethersProvider.getTransaction(txHash);
              if (!tx || tx.to?.toLowerCase() !== SBC_ADDRESS.toLowerCase()) continue;

              seenHashes.add(txHash);
              const receipt = await ethersProvider.getTransactionReceipt(txHash);
              const date = new Date(Number(block.timestamp) * 1000);

              // Decode function call
              let functionName = "Unknown";
              let functionParams = "";
              let type = "Contract Call";
              let transferFrom = null;
              let transferTo = null;
              let transferAmount = "0";

              try {
                if (tx.data && tx.data.length >= 10) {
                  const iface = new ethers.Interface(SBC_ABI);
                  const decoded = iface.parseTransaction({ data: tx.data });
                  if (decoded) {
                    functionName = decoded.name;
                    type = decoded.name;
                    
                    // Format parameters
                    functionParams = decoded.args.map((arg, i) => {
                      if (typeof arg === 'string' && arg.startsWith('0x') && arg.length === 42) {
                        return `${arg.substring(0, 6)}...${arg.substring(38)}`;
                      }
                      if (typeof arg === 'bigint') {
                        return arg.toString();
                      }
                      return String(arg);
                    }).join(", ");

                    // Extract info for addStudent/removeStudent
                    if (decoded.name === "addStudent") {
                      transferTo = decoded.args[0]; // wallet address
                      functionParams = `Wallet: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Name: ${decoded.args[1]}, ID: ${decoded.args[2]}`;
                    } else if (decoded.name === "removeStudent") {
                      functionParams = `Student ID: ${decoded.args[0]}`;
                    } else if (decoded.name === "mint") {
                      transferTo = decoded.args[0];
                      transferAmount = ethers.formatEther(decoded.args[1]);
                      functionParams = `To: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Amount: ${ethers.formatEther(decoded.args[1])} SBC`;
                    } else if (decoded.name === "burn") {
                      transferFrom = decoded.args[0];
                      transferAmount = ethers.formatEther(decoded.args[1]);
                      functionParams = `From: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Amount: ${ethers.formatEther(decoded.args[1])} SBC`;
                    }
                  }
                }
              } catch (e) {
                // Decoding failed, keep defaults
              }

              allTransactions.push({
                hash: txHash,
                blockNumber: blockNum,
                timestamp: block.timestamp,
                date: date.toLocaleString(),
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value || 0),
                gasUsed: receipt.gasUsed.toString(),
                gasPrice: tx.gasPrice ? tx.gasPrice.toString() : "0",
                status: receipt.status === 1 ? "Success" : "Failed",
                transferFrom: transferFrom || tx.from,
                transferTo: transferTo || tx.to,
                transferAmount: transferAmount,
                functionName: functionName,
                functionParams: functionParams,
                type: type
              });
            } catch (e) {
              // Skip if transaction fetch fails
              continue;
            }
          }
        } catch (e) {
          // Skip if block fetch fails
          continue;
        }
      }

      // Sort by block number (newest first)
      allTransactions.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
      
      setTransactionHistory(allTransactions);
      if (allTransactions.length === 0) {
        alert("No transactions found");
      }
    } catch (err) {
      alert("❌ Failed to load transaction history: " + (err.message || "Unknown error"));
    } finally {
      setIsLoadingTransactions(false);
    }
  }

  // ---------------- SEARCH TRANSACTION BY HASH ----------------
  async function searchTransactionByHash() {
    const txHash = prompt("Enter transaction hash:");
    if (!txHash) return;

    try {
      const provider = await detectEthereumProvider();
      if (!provider) return alert("Provider not found");
      
      const ethersProvider = new ethers.BrowserProvider(provider);
      const tx = await ethersProvider.getTransaction(txHash);
      
      if (!tx) {
        alert("❌ Transaction not found");
        return;
      }

      const receipt = await ethersProvider.getTransactionReceipt(txHash);
      const block = await ethersProvider.getBlock(receipt.blockNumber);
      const contractWithProvider = new ethers.Contract(SBC_ADDRESS, SBC_ABI, ethersProvider);

      // Check if it's a Transfer event
      const filter = contractWithProvider.filters.Transfer();
      const events = await contractWithProvider.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
      const transferEvent = events.find(e => e.transactionHash === txHash);

      const txDetails = {
        hash: txHash,
        blockNumber: receipt.blockNumber,
        timestamp: block.timestamp,
        from: tx.from,
        to: tx.to,
        value: tx.value ? ethers.formatEther(tx.value) : "0",
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice ? tx.gasPrice.toString() : "0",
        status: receipt.status === 1 ? "Success" : "Failed",
        transferFrom: transferEvent ? transferEvent.args.from : null,
        transferTo: transferEvent ? transferEvent.args.to : null,
        transferAmount: transferEvent ? ethers.formatEther(transferEvent.args.value) : null
      };

      setTransactionHistory([txDetails]);
    } catch (err) {
      alert("❌ Failed to search transaction: " + (err.message || "Invalid transaction hash"));
    }
  }

  // Stevens Institute of Technology Brand Colors
  const stevensRed = "#A32638"; // Primary red
  const stevensDarkGrey = "#222222"; // Dark grey/charcoal
  const stevensLightGrey = "#f5f5f5"; // Light background
  const stevensTextGrey = "#666666"; // Text grey

  const buttonStyle = {
    padding: "12px 24px",
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "none",
    background: stevensRed,
    color: "white",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(163, 38, 56, 0.3)",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    marginBottom: 12,
    borderRadius: 6,
    border: "2px solid #e0e0e0",
    fontSize: 14,
    fontFamily: "inherit",
    transition: "border-color 0.3s ease",
    boxSizing: "border-box"
  };

  const cardStyle = {
    background: "white",
    padding: 24,
    marginBottom: 24,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e8e8e8"
  };

  return (
    <div style={{ 
      minHeight: "100vh",
      background: stevensLightGrey,
      padding: 0,
      margin: 0,
      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      width: "100%",
      overflow: "hidden"
    }}>
      {/* STEVENS HEADER */}
      <div style={{
        background: stevensDarkGrey,
        color: "white",
        padding: "12px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 13,
        position: "relative",
        zIndex: 10,
        width: "100%"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontWeight: 600 }}>Stevens Institute of Technology</span>
          <span style={{ opacity: 0.7 }}>|</span>
          <span style={{ opacity: 0.9 }}>Hanlon Financial Systems Lab</span>
        </div>
      </div>

      {/* RED NAVIGATION BAR */}
      <div style={{
        background: stevensRed,
        color: "white",
        padding: "16px 40px",
        display: "flex",
        alignItems: "center",
        gap: 30,
        position: "relative",
        zIndex: 10,
        width: "100%"
      }}>
        <div style={{ 
          fontSize: 24, 
          fontWeight: 700,
          letterSpacing: "1px"
        }}>
          🍌 STEVENS BANANA COIN
        </div>
        <div style={{ 
          fontSize: 14, 
          opacity: 0.95,
          fontWeight: 500,
          marginLeft: "auto"
        }}>
          Admin Panel
        </div>
      </div>

      {/* VIDEO BACKGROUND - Only show when wallet not connected */}
      {!wallet && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          zIndex: 1,
          margin: 0,
          padding: 0
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: "100vw",
              height: "100vh",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
              margin: 0,
              padding: 0,
              display: "block"
            }}
          >
            <source src="/fsc_home_page_video.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for better button visibility */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.4)",
            zIndex: 2,
            margin: 0,
            padding: 0
          }} />
        </div>
      )}

      {/* MAIN CONTENT */}
      {!wallet ? (
        <div style={{ 
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex", 
          justifyContent: "center",
          alignItems: "center",
          zIndex: 5,
          padding: 0,
          margin: 0
        }}>
          <div style={{ 
            textAlign: "center",
            zIndex: 10,
            padding: "40px",
            width: "100%",
            maxWidth: "800px"
          }}>
            <h1 style={{
              color: "white",
              fontSize: "56px",
              fontWeight: 700,
              marginBottom: "24px",
              textShadow: "3px 3px 6px rgba(0, 0, 0, 0.7)",
              letterSpacing: "2px",
              lineHeight: "1.2"
            }}>
              🍌 STEVENS BANANA COIN
            </h1>
            <p style={{
              color: "white",
              fontSize: "20px",
              marginBottom: "48px",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)",
              opacity: 0.95,
              fontWeight: 400
            }}>
              Connect your wallet to get started
            </p>
            <button 
              onClick={connectWallet} 
              style={{
                ...buttonStyle,
                padding: "20px 48px",
                fontSize: "20px",
                background: stevensRed,
                color: "white",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(163, 38, 56, 0.6)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px) scale(1.05)";
                e.target.style.boxShadow = "0 8px 24px rgba(163, 38, 56, 0.8)";
                e.target.style.background = "#8B1E2E";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = "0 4px 16px rgba(163, 38, 56, 0.6)";
                e.target.style.background = stevensRed;
                e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              Connect Wallet
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          padding: 40, 
          display: "flex", 
          gap: 30,
          flex: 1,
          position: "relative",
          zIndex: 5
        }}>
          {/* MAIN PANEL */}
          <div style={{ flex: 2 }}>

        {wallet && (
          <>
            <div style={{
              ...cardStyle,
              background: stevensRed,
              color: "white",
              marginBottom: 24,
              border: "none"
            }}>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.95, textTransform: "uppercase", letterSpacing: "0.5px" }}>Connected Wallet</p>
              <p style={{ margin: "8px 0 0 0", fontSize: 15, fontWeight: 500, wordBreak: "break-all", fontFamily: "monospace" }}>
                {wallet}
              </p>
            </div>

            {/* ADD STUDENT */}
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
                Add / Update Student
              </h3>

              <input
                placeholder="Wallet Address"
                value={newStudent.wallet}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, wallet: e.target.value })
                }
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = stevensRed}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />

              <input
                placeholder="Student Name"
                value={newStudent.name}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, name: e.target.value })
                }
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = stevensRed}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />

              <input
                placeholder="Student ID"
                value={newStudent.id}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, id: e.target.value })
                }
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = stevensRed}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />

              <button 
                onClick={addStudent} 
                style={{
                  ...buttonStyle,
                  marginTop: 8,
                  marginRight: 0,
                  width: "100%",
                  background: stevensRed,
                  color: "white"
                }}
                onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
              e.target.style.background = "#8B1E2E";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
              e.target.style.background = stevensRed;
            }}
              >
                Add Student
              </button>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ 
              marginBottom: 24,
              display: "flex",
              flexWrap: "wrap",
              gap: 10
            }}>
              <button 
                onClick={searchById} 
                style={buttonStyle}
                onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
              e.target.style.background = "#8B1E2E";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
              e.target.style.background = stevensRed;
            }}
              >
                🔍 Search Student
              </button>
              <button 
                onClick={transferTokens} 
                style={buttonStyle}
                onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
              e.target.style.background = "#8B1E2E";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
              e.target.style.background = stevensRed;
            }}
              >
                💸 Transfer Tokens
              </button>
              <button 
                onClick={mintTokens} 
                style={buttonStyle}
                onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
              e.target.style.background = "#8B1E2E";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
              e.target.style.background = stevensRed;
            }}
              >
                🪙 Mint Tokens
              </button>
              <button 
                onClick={burnTokens} 
                style={{
                  ...buttonStyle,
                  background: "#8B1E2E",
                  color: "white"
                }}
                onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(139, 30, 46, 0.4)";
              e.target.style.background = "#6B151F";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(139, 30, 46, 0.3)";
              e.target.style.background = "#8B1E2E";
            }}
              >
                🔥 Burn Tokens
              </button>
              <button 
                onClick={loadAllStudents} 
                style={buttonStyle}
                onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
              e.target.style.background = "#8B1E2E";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
              e.target.style.background = stevensRed;
            }}
              >
                📋 Load All Students
              </button>
              <button 
                onClick={deleteStudent} 
                style={{
                  ...buttonStyle,
                  background: "#8B1E2E",
                  color: "white"
                }}
                onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(139, 30, 46, 0.4)";
              e.target.style.background = "#6B151F";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(139, 30, 46, 0.3)";
              e.target.style.background = "#8B1E2E";
            }}
              >
                🗑️ Delete Student
              </button>
              <button 
                onClick={loadAvailableAddresses} 
                style={buttonStyle}
                onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
              e.target.style.background = "#8B1E2E";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
              e.target.style.background = stevensRed;
            }}
              >
                📇 Show Available
              </button>
              <button 
                onClick={loadTransactionHistory} 
                style={buttonStyle}
                disabled={isLoadingTransactions}
                onMouseEnter={(e) => {
              if (!isLoadingTransactions) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
                e.target.style.background = "#8B1E2E";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoadingTransactions) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
                e.target.style.background = stevensRed;
              }
            }}
              >
                {isLoadingTransactions ? "⏳ Loading..." : "📜 Transaction History"}
              </button>
              <button 
                onClick={searchTransactionByHash} 
                style={buttonStyle}
                onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
              e.target.style.background = "#8B1E2E";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
              e.target.style.background = stevensRed;
            }}
              >
                🔎 Search by Hash
              </button>
            </div>

            {/* TRANSACTION HISTORY */}
            {transactionHistory.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: 16, color: stevensRed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Transaction History ({transactionHistory.length})
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "white",
                    fontSize: 12
                  }}>
                    <thead>
                      <tr style={{ background: stevensRed }}>
                        <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Hash</th>
                        <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Block</th>
                        <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Time</th>
                        <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Function</th>
                        <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>From</th>
                        <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>To</th>
                        <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount</th>
                        <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionHistory.map((tx, i) => (
                        <tr 
                          key={i}
                          style={{
                            borderBottom: "1px solid #e9ecef"
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#fafafa"}
                          onMouseLeave={(e) => e.target.style.background = "white"}
                        >
                          <td style={{ padding: 10, color: stevensTextGrey, fontFamily: "monospace", fontSize: 10, wordBreak: "break-all", cursor: "pointer" }} title={tx.hash}>
                            {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 8)}
                          </td>
                          <td style={{ padding: 10, color: stevensDarkGrey, fontSize: 11 }}>{tx.blockNumber.toString()}</td>
                          <td style={{ padding: 10, color: stevensTextGrey, fontSize: 10 }} title={tx.date}>
                            {tx.date ? tx.date : "N/A"}
                          </td>
                          <td style={{ padding: 10, color: stevensDarkGrey, fontSize: 11, fontWeight: 600 }} title={tx.functionParams || ""}>
                            {tx.functionName || tx.type || "Unknown"}
                          </td>
                          <td style={{ padding: 10, color: stevensTextGrey, fontFamily: "monospace", fontSize: 10, wordBreak: "break-all" }} title={tx.transferFrom || tx.from}>
                            {tx.transferFrom ? 
                              `${tx.transferFrom.substring(0, 6)}...${tx.transferFrom.substring(tx.transferFrom.length - 4)}` :
                              `${tx.from ? tx.from.substring(0, 6) + "..." + tx.from.substring(tx.from.length - 4) : "N/A"}`
                            }
                          </td>
                          <td style={{ padding: 10, color: stevensTextGrey, fontFamily: "monospace", fontSize: 10, wordBreak: "break-all" }} title={tx.transferTo || tx.to}>
                            {tx.transferTo ? 
                              `${tx.transferTo.substring(0, 6)}...${tx.transferTo.substring(tx.transferTo.length - 4)}` :
                              `${tx.to ? tx.to.substring(0, 6) + "..." + tx.to.substring(tx.to.length - 4) : "N/A"}`
                            }
                          </td>
                          <td style={{ padding: 10, color: stevensRed, fontWeight: 600, fontSize: 11 }}>
                            {tx.transferAmount ? `${parseFloat(tx.transferAmount).toFixed(2)} SBC` : `${tx.value} ETH`}
                          </td>
                          <td style={{ padding: 10, fontSize: 11 }}>
                            <span style={{
                              color: tx.status === "Success" ? "#28a745" : "#dc3545",
                              fontWeight: 600
                            }}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STUDENT DETAILS */}
            {studentInfo && (
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: 16, color: stevensRed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Student Details
                </h3>
                <pre style={{ 
                  background: "#f8f9fa", 
                  padding: 20,
                  borderRadius: 8,
                  border: "1px solid #e9ecef",
                  overflow: "auto",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#495057"
                }}>
                {JSON.stringify(studentInfo, null, 2)}
              </pre>
              </div>
            )}

            {/* STUDENT TABLE */}
            {studentList.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: 16, color: stevensRed, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  All Students ({studentList.length})
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "white"
                  }}>
                <thead>
                      <tr style={{ background: stevensRed }}>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>ID</th>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</th>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Wallet</th>
                        <th style={{ padding: 12, textAlign: "left", color: "white", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {studentList.map((s, i) => (
                        <tr 
                          key={i}
                          style={{
                            borderBottom: "1px solid #e9ecef",
                            transition: "background 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#fafafa"}
                          onMouseLeave={(e) => e.target.style.background = "white"}
                        >
                          <td style={{ padding: 12, fontSize: 14, color: stevensDarkGrey }}>{s.id}</td>
                          <td style={{ padding: 12, fontSize: 14, color: stevensDarkGrey, fontWeight: 500 }}>{s.name}</td>
                          <td style={{ padding: 12, fontSize: 12, color: stevensTextGrey, fontFamily: "monospace", wordBreak: "break-all" }}>{s.wallet}</td>
                          <td style={{ padding: 12, fontSize: 14, color: stevensRed, fontWeight: 600 }}>{s.balance} SBC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              </div>
            )}

            {/* AVAILABLE ADDRESSES PANEL */}
            {available.length > 0 && (
        <div style={{
          background: "white",
          padding: 20,
          borderRadius: 8,
          width: 380,
          maxWidth: 380,
          marginTop: 100,
          alignSelf: "flex-start",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e8e8e8"
        }}>
          <h3 style={{ 
            color: stevensRed, 
            marginTop: 0, 
            marginBottom: 16,
            fontSize: 16,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Unused Wallet Addresses
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white"
            }}>
            <thead>
                <tr style={{ background: stevensRed }}>
                  <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>#</th>
                  <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {available.map((addr, i) => (
                  <tr 
                    key={i}
                    style={{
                      borderBottom: "1px solid #e9ecef"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#fafafa"}
                    onMouseLeave={(e) => e.target.style.background = "white"}
                  >
                    <td style={{ padding: 10, fontSize: 13, color: stevensDarkGrey, fontWeight: 500 }}>{i + 1}</td>
                    <td style={{ padding: 10, fontSize: 11, color: stevensTextGrey, fontFamily: "monospace", wordBreak: "break-all" }}>{addr}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
          </>
        )}
          </div>
        </div>
      )}
    </div>
  );
}
