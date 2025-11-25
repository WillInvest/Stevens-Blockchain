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
  const [activeTab, setActiveTab] = useState("admin");
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [activeAdminSubTab, setActiveAdminSubTab] = useState("addUpdate");

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
          letterSpacing: "1px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <img 
            src="/SBC logo.png" 
            alt="SBC Logo" 
            style={{
              height: "32px",
              width: "auto",
              objectFit: "contain"
            }}
          />
          STEVENS BANANA COIN
        </div>
        <div style={{ 
          fontSize: 14, 
          opacity: 0.95,
          fontWeight: 500,
          marginLeft: "auto"
        }}>
          Beta Version 0.1.0 (Nov 24, 2025)
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
          padding: 0,
          border: "none",
          outline: "none"
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
              minWidth: "100%",
              minHeight: "100%",
              margin: 0,
              padding: 0,
              border: "none",
              outline: "none",
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
            padding: 0,
            border: "none"
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
              fontSize: "64px",
              fontWeight: 900,
              marginBottom: "24px",
              textShadow: "3px 3px 6px rgba(0, 0, 0, 0.7)",
              letterSpacing: "3px",
              lineHeight: "1",
              fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              whiteSpace: "nowrap"
            }}>
              <img 
                src="/SBC logo.png" 
                alt="SBC Logo" 
                style={{
                  height: "70px",
                  width: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.7))"
                }}
              />
              STEVENS BANANA COIN
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

            {/* TAB NAVIGATION */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 24,
              borderBottom: `2px solid ${stevensRed}`,
              paddingBottom: 0
            }}>
              {[
                { id: "admin", label: "🛠️ Admin Tool", icon: "🛠️" },
                { id: "studentInfo", label: "👥 Student Info", icon: "👥" },
                { id: "transfer", label: "💸 Transfer Tokens", icon: "💸" },
                { id: "available", label: "📇 Available Addresses", icon: "📇" },
                { id: "transactionInfo", label: "📊 Transaction Info", icon: "📊" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "12px 20px",
                    border: "none",
                    background: activeTab === tab.id ? stevensRed : "transparent",
                    color: activeTab === tab.id ? "white" : stevensRed,
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: activeTab === tab.id ? `3px solid ${stevensRed}` : "3px solid transparent",
                    marginBottom: "-2px",
                    transition: "all 0.2s ease",
                    borderRadius: "6px 6px 0 0"
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.background = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.background = "transparent";
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div style={{ minHeight: "400px" }}>
              {/* ADMIN TOOL TAB */}
              {activeTab === "admin" && (
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
                      { id: "addUpdate", label: "➕ Add/Update", icon: "➕" },
                      { id: "delete", label: "🗑️ Delete", icon: "🗑️" },
                      { id: "mint", label: "🪙 Mint", icon: "🪙" },
                      { id: "burn", label: "🔥 Burn", icon: "🔥" }
                    ].map(subTab => (
                      <button
                        key={subTab.id}
                        onClick={() => setActiveAdminSubTab(subTab.id)}
                        style={{
                          padding: "10px 18px",
                          border: "none",
                          background: activeAdminSubTab === subTab.id ? stevensRed : "transparent",
                          color: activeAdminSubTab === subTab.id ? "white" : stevensRed,
                          fontWeight: activeAdminSubTab === subTab.id ? 700 : 500,
                          fontSize: 12,
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: activeAdminSubTab === subTab.id ? `3px solid ${stevensRed}` : "3px solid transparent",
                          marginBottom: "-2px",
                          transition: "all 0.2s ease",
                          borderRadius: "6px 6px 0 0"
                        }}
                        onMouseEnter={(e) => {
                          if (activeAdminSubTab !== subTab.id) {
                            e.target.style.background = "#f5f5f5";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeAdminSubTab !== subTab.id) {
                            e.target.style.background = "transparent";
                          }
                        }}
                      >
                        {subTab.label}
                      </button>
                    ))}
                  </div>

                  {/* SUB-TAB CONTENT */}
                  <div style={cardStyle}>
                    {/* ADD/UPDATE SUB-TAB */}
                    {activeAdminSubTab === "addUpdate" && (
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
                      </>
                    )}

                    {/* DELETE SUB-TAB */}
                    {activeAdminSubTab === "delete" && (
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
                          🗑️ Delete Student
                        </h3>
                        <p style={{ marginBottom: 20, color: stevensTextGrey }}>
                          Remove a student from the whitelist by their Student ID.
                        </p>
                        <button 
                          onClick={deleteStudent} 
                          style={{
                            ...buttonStyle,
                            width: "100%",
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
                          Delete Student
                        </button>
                      </>
                    )}

                    {/* MINT SUB-TAB */}
                    {activeAdminSubTab === "mint" && (
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
                          🪙 Mint Tokens
                        </h3>
                        <p style={{ marginBottom: 20, color: stevensTextGrey }}>
                          Create new SBC tokens and add them to a whitelisted student's wallet.
                        </p>
                        <button 
                          onClick={mintTokens} 
                          style={{
                            ...buttonStyle,
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
                          Mint Tokens
                        </button>
                      </>
                    )}

                    {/* BURN SUB-TAB */}
                    {activeAdminSubTab === "burn" && (
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
                          🔥 Burn Tokens
                        </h3>
                        <p style={{ marginBottom: 20, color: stevensTextGrey }}>
                          Permanently remove SBC tokens from a wallet address.
                        </p>
                        <button 
                          onClick={burnTokens} 
                          style={{
                            ...buttonStyle,
                            width: "100%",
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
                          Burn Tokens
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* STUDENT INFO TAB */}
              {activeTab === "studentInfo" && (
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
                    🔍 Search Student
                  </h3>
                  <button 
                    onClick={searchById} 
                    style={{
                      ...buttonStyle,
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
                    Search by Student ID
                  </button>
                  {studentInfo && (
                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ color: stevensRed, marginBottom: 12 }}>Student Details</h4>
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

                  <div style={{ marginTop: 32, paddingTop: 24, borderTop: "2px solid #e0e0e0" }}>
                    <h3 style={{ 
                      marginTop: 0, 
                      marginBottom: 20, 
                      color: stevensRed,
                      fontSize: 20,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      📋 Load All Students
                    </h3>
                    <p style={{ marginBottom: 20, color: stevensTextGrey }}>
                      Load and display all registered students from the blockchain.
                    </p>
                    <button 
                      onClick={loadAllStudents} 
                      style={{
                        ...buttonStyle,
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
                      Load All Students
                    </button>
                    {studentList.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <h4 style={{ color: stevensRed, marginBottom: 16 }}>All Students ({studentList.length})</h4>
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
                  </div>
                </div>
              )}

              {/* TRANSFER TOKENS TAB */}
              {activeTab === "transfer" && (
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
                    💸 Transfer Tokens
                  </h3>
                  <p style={{ marginBottom: 20, color: stevensTextGrey }}>
                    Transfer SBC tokens from your wallet to another whitelisted address.
                  </p>
                  <button 
                    onClick={transferTokens} 
                    style={{
                      ...buttonStyle,
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
                    Transfer Tokens
                  </button>
                </div>
              )}

              {/* SHOW AVAILABLE TAB */}
              {activeTab === "available" && (
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
                    📇 Show Available Addresses
                  </h3>
                  <p style={{ marginBottom: 20, color: stevensTextGrey }}>
                    Display wallet addresses that are available but not yet registered as students.
                  </p>
                  <button 
                    onClick={loadAvailableAddresses} 
                    style={{
                      ...buttonStyle,
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
                    Load Available Addresses
                  </button>
                  {available.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ color: stevensRed, marginBottom: 16 }}>Unused Wallet Addresses</h4>
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
                </div>
              )}

              {/* TRANSACTION INFO TAB */}
              {activeTab === "transactionInfo" && (
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
                    📜 Transaction History
                  </h3>
                  <p style={{ marginBottom: 20, color: stevensTextGrey }}>
                    Load and view all recent transactions on the SBC contract.
                  </p>
                  <button 
                    onClick={loadTransactionHistory} 
                    style={{
                      ...buttonStyle,
                      width: "100%",
                      background: stevensRed,
                      color: "white",
                      disabled: isLoadingTransactions
                    }}
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
                    {isLoadingTransactions ? "⏳ Loading..." : "Load Transaction History"}
                  </button>
                  {transactionHistory.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ color: stevensRed, marginBottom: 16 }}>Transaction History ({transactionHistory.length})</h4>
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

                  <div style={{ marginTop: 32, paddingTop: 24, borderTop: "2px solid #e0e0e0" }}>
                    <h3 style={{ 
                      marginTop: 0, 
                      marginBottom: 20, 
                      color: stevensRed,
                      fontSize: 20,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      🔎 Search by Hash
                    </h3>
                    <p style={{ marginBottom: 20, color: stevensTextGrey }}>
                      Search for a specific transaction by its hash.
                    </p>
                    <button 
                      onClick={searchTransactionByHash} 
                      style={{
                        ...buttonStyle,
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
                      Search Transaction by Hash
                    </button>
                    {transactionHistory.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <h4 style={{ color: stevensRed, marginBottom: 16 }}>Transaction Details</h4>
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
                  </div>
                </div>
              )}
            </div>
          </>
        )}
          </div>
        </div>
      )}
    </div>
  );
}
