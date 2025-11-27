import { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import { SBC_ABI } from "../../contracts/abi";
import { 
  SBC_ADDRESS, 
  SDC_ADDRESS, 
  SRPC_ADDRESS, 
  STUDENT_MANAGEMENT_ADDRESS 
} from "../../contracts/config";
import studentManagementAbiData from "../../contracts/studentManagementAbi.json";
import duckCoinAbiData from "../../contracts/duckCoinAbi.json";
import proveOfReputationAbiData from "../../contracts/proveOfReputationAbi.json";
import { cardStyle, stevensRed, stevensTextGrey, stevensDarkGrey, buttonStyle, inputStyle } from "../../styles/constants";

// Parse ABIs
const studentManagementAbi = typeof studentManagementAbiData === 'string' 
  ? JSON.parse(studentManagementAbiData) 
  : studentManagementAbiData;
const duckCoinAbi = typeof duckCoinAbiData === 'string' 
  ? JSON.parse(duckCoinAbiData) 
  : duckCoinAbiData;
const proveOfReputationAbi = typeof proveOfReputationAbiData === 'string' 
  ? JSON.parse(proveOfReputationAbiData) 
  : proveOfReputationAbiData;

export default function TransactionInfo({ contract }) {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [searchTxHash, setSearchTxHash] = useState("");
  const [searchStudentId, setSearchStudentId] = useState("");

  // Helper function to determine token type from contract address
  function getTokenType(address) {
    if (!address) return "Unknown";
    const addr = address.toLowerCase();
    if (addr === SBC_ADDRESS.toLowerCase()) return "SBC";
    if (addr === SDC_ADDRESS.toLowerCase()) return "SDC";
    if (addr === SRPC_ADDRESS.toLowerCase()) return "SRPC";
    if (addr === STUDENT_MANAGEMENT_ADDRESS.toLowerCase()) return "StudentManagement";
    return "Unknown";
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
      
      // Get current block number to limit search range
      const currentBlock = await ethersProvider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000); // Last 1000 blocks

      // Create contract instances for all tokens
      const sbcContract = new ethers.Contract(SBC_ADDRESS, duckCoinAbi, ethersProvider);
      const sdcContract = new ethers.Contract(SDC_ADDRESS, duckCoinAbi, ethersProvider);
      const srpcContract = new ethers.Contract(SRPC_ADDRESS, proveOfReputationAbi, ethersProvider);
      const studentMgmtContract = new ethers.Contract(STUDENT_MANAGEMENT_ADDRESS, studentManagementAbi, ethersProvider);

      // Query Transfer events from all token contracts
      const [sbcTransfers, sdcTransfers, srpcTransfers] = await Promise.all([
        sbcContract.queryFilter(sbcContract.filters.Transfer(), fromBlock, currentBlock).catch(() => []),
        sdcContract.queryFilter(sdcContract.filters.Transfer(), fromBlock, currentBlock).catch(() => []),
        srpcContract.queryFilter(srpcContract.filters.Transfer(), fromBlock, currentBlock).catch(() => [])
      ]);

      // Query events from StudentManagement contract
      const [studentAddedEvents, studentRemovedEvents, sbcMintedEvents, sbcBurnedEvents, sdcMintedEvents, sdcBurnedEvents, srpcMintedEvents, srpcBurnedEvents] = await Promise.all([
        studentMgmtContract.queryFilter(studentMgmtContract.filters.StudentAdded(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.StudentRemoved(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SBCMinted(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SBCBurned(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SDCMinted(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SDCBurned(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SRPCMinted(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SRPCBurned(), fromBlock, currentBlock).catch(() => [])
      ]);

      // Get all transactions sent to the contract address
      const allTransactions = [];
      const seenHashes = new Set();

      // Process all events with token type information
      const allEvents = [
        ...sbcTransfers.map(e => ({ ...e, eventType: "Transfer", tokenType: "SBC", contractAddress: SBC_ADDRESS })),
        ...sdcTransfers.map(e => ({ ...e, eventType: "Transfer", tokenType: "SDC", contractAddress: SDC_ADDRESS })),
        ...srpcTransfers.map(e => ({ ...e, eventType: "Transfer", tokenType: "SRPC", contractAddress: SRPC_ADDRESS })),
        ...studentAddedEvents.map(e => ({ ...e, eventType: "StudentAdded", tokenType: "StudentManagement", contractAddress: STUDENT_MANAGEMENT_ADDRESS })),
        ...studentRemovedEvents.map(e => ({ ...e, eventType: "StudentRemoved", tokenType: "StudentManagement", contractAddress: STUDENT_MANAGEMENT_ADDRESS })),
        ...sbcMintedEvents.map(e => ({ ...e, eventType: "SBCMinted", tokenType: "SBC", contractAddress: STUDENT_MANAGEMENT_ADDRESS })),
        ...sbcBurnedEvents.map(e => ({ ...e, eventType: "SBCBurned", tokenType: "SBC", contractAddress: STUDENT_MANAGEMENT_ADDRESS })),
        ...sdcMintedEvents.map(e => ({ ...e, eventType: "SDCMinted", tokenType: "SDC", contractAddress: STUDENT_MANAGEMENT_ADDRESS })),
        ...sdcBurnedEvents.map(e => ({ ...e, eventType: "SDCBurned", tokenType: "SDC", contractAddress: STUDENT_MANAGEMENT_ADDRESS })),
        ...srpcMintedEvents.map(e => ({ ...e, eventType: "SRPCMinted", tokenType: "SRPC", contractAddress: STUDENT_MANAGEMENT_ADDRESS })),
        ...srpcBurnedEvents.map(e => ({ ...e, eventType: "SRPCBurned", tokenType: "SRPC", contractAddress: STUDENT_MANAGEMENT_ADDRESS }))
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
        const tokenType = event.tokenType || getTokenType(tx.to);

        if (event.eventType === "Transfer") {
          transferFrom = event.args.from;
          transferTo = event.args.to;
          transferAmount = ethers.formatEther(event.args.value);
          functionParams = `From: ${event.args.from.substring(0, 6)}...${event.args.from.substring(38)}, To: ${event.args.to.substring(0, 6)}...${event.args.to.substring(38)}, Amount: ${ethers.formatEther(event.args.value)} ${tokenType}`;
        } else if (event.eventType === "StudentAdded") {
          transferTo = event.args.wallet;
          functionParams = `Wallet: ${event.args.wallet.substring(0, 6)}...${event.args.wallet.substring(38)}, Name: ${event.args.name}, ID: ${event.args.studentId}`;
        } else if (event.eventType === "StudentRemoved") {
          transferFrom = event.args.wallet;
          functionParams = `Student ID: ${event.args.studentId}, Wallet: ${event.args.wallet.substring(0, 6)}...${event.args.wallet.substring(38)}`;
        } else if (event.eventType === "SBCMinted" || event.eventType === "SDCMinted" || event.eventType === "SRPCMinted") {
          transferTo = event.args.to;
          transferAmount = ethers.formatEther(event.args.amount);
          functionParams = `To: ${event.args.to.substring(0, 6)}...${event.args.to.substring(38)}, Amount: ${ethers.formatEther(event.args.amount)} ${tokenType}`;
        } else if (event.eventType === "SBCBurned" || event.eventType === "SDCBurned" || event.eventType === "SRPCBurned") {
          transferFrom = event.args.from;
          transferAmount = ethers.formatEther(event.args.amount);
          functionParams = `From: ${event.args.from.substring(0, 6)}...${event.args.from.substring(38)}, Amount: ${ethers.formatEther(event.args.amount)} ${tokenType}`;
        }

        allTransactions.push({
          hash: event.transactionHash,
          blockNumber: receipt.blockNumber,
          timestamp: block.timestamp,
          date: date.toLocaleString(),
          from: tx.from,
          to: tx.to || event.contractAddress || SBC_ADDRESS,
          value: ethers.formatEther(tx.value || 0),
          gasUsed: receipt.gasUsed.toString(),
          gasPrice: tx.gasPrice ? tx.gasPrice.toString() : "0",
          status: receipt.status === 1 ? "Success" : "Failed",
          transferFrom: transferFrom || tx.from,
          transferTo: transferTo || tx.to,
          transferAmount: transferAmount,
          functionName: functionName,
          functionParams: functionParams,
          type: event.eventType || "Unknown",
          tokenType: tokenType
        });
      }

      // Get all other transactions to the contracts (non-Transfer)
      // We'll scan blocks for transactions to our contracts
      const contractAddresses = [
        SBC_ADDRESS,
        SDC_ADDRESS,
        SRPC_ADDRESS,
        STUDENT_MANAGEMENT_ADDRESS
      ].filter(addr => addr && addr.trim() !== "");

      for (let blockNum = currentBlock; blockNum >= fromBlock && blockNum >= 0; blockNum--) {
        try {
          const block = await ethersProvider.getBlock(blockNum, true);
          if (!block || !block.transactions) continue;

          for (const txHash of block.transactions) {
            if (seenHashes.has(txHash)) continue;

            try {
              const tx = await ethersProvider.getTransaction(txHash);
              if (!tx || !tx.to) continue;
              
              // Check if transaction is to any of our contracts
              const contractMatch = contractAddresses.find(addr => 
                tx.to?.toLowerCase() === addr.toLowerCase()
              );
              if (!contractMatch) continue;

              seenHashes.add(txHash);
              const receipt = await ethersProvider.getTransactionReceipt(txHash);
              const date = new Date(Number(block.timestamp) * 1000);

              // Determine which contract and ABI to use
              const tokenType = getTokenType(contractMatch);
              let abiToUse = duckCoinAbi;
              if (tokenType === "SRPC") {
                abiToUse = proveOfReputationAbi;
              } else if (tokenType === "StudentManagement") {
                abiToUse = studentManagementAbi;
              } else if (tokenType === "SBC" || tokenType === "SDC") {
                abiToUse = duckCoinAbi;
              }

              // Decode function call
              let functionName = "Unknown";
              let functionParams = "";
              let type = "Contract Call";
              let transferFrom = null;
              let transferTo = null;
              let transferAmount = "0";

              try {
                if (tx.data && tx.data.length >= 10) {
                  const iface = new ethers.Interface(abiToUse);
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

                    // Extract info for different functions
                    if (decoded.name === "addStudent") {
                      transferTo = decoded.args[0]; // wallet address
                      functionParams = `Wallet: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Name: ${decoded.args[1]}, ID: ${decoded.args[2]}`;
                    } else if (decoded.name === "removeStudent") {
                      functionParams = `Student ID: ${decoded.args[0]}`;
                    } else if (decoded.name === "mint" || decoded.name === "mintSBC" || decoded.name === "mintSDC" || decoded.name === "mintSRPC") {
                      transferTo = decoded.args[0];
                      transferAmount = ethers.formatEther(decoded.args[1]);
                      const token = decoded.name === "mintSBC" ? "SBC" : decoded.name === "mintSDC" ? "SDC" : decoded.name === "mintSRPC" ? "SRPC" : tokenType;
                      functionParams = `To: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Amount: ${ethers.formatEther(decoded.args[1])} ${token}`;
                    } else if (decoded.name === "burn" || decoded.name === "burnSBC" || decoded.name === "burnSDC" || decoded.name === "burnSRPC") {
                      transferFrom = decoded.args[0];
                      transferAmount = ethers.formatEther(decoded.args[1]);
                      const token = decoded.name === "burnSBC" ? "SBC" : decoded.name === "burnSDC" ? "SDC" : decoded.name === "burnSRPC" ? "SRPC" : tokenType;
                      functionParams = `From: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Amount: ${ethers.formatEther(decoded.args[1])} ${token}`;
                    } else if (decoded.name === "transfer") {
                      transferFrom = decoded.args[0];
                      transferTo = decoded.args[1];
                      transferAmount = ethers.formatEther(decoded.args[2]);
                      functionParams = `From: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, To: ${decoded.args[1].substring(0, 6)}...${decoded.args[1].substring(38)}, Amount: ${ethers.formatEther(decoded.args[2])} ${tokenType}`;
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
                type: type,
                tokenType: tokenType
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
    if (!searchTxHash) return alert("Please enter a transaction hash");

    try {
      const provider = await detectEthereumProvider();
      if (!provider) return alert("Provider not found");
      
      const ethersProvider = new ethers.BrowserProvider(provider);
      const tx = await ethersProvider.getTransaction(searchTxHash);
      
      if (!tx) {
        alert("❌ Transaction not found");
        setSearchTxHash("");
        return;
      }

      const receipt = await ethersProvider.getTransactionReceipt(searchTxHash);
      const block = await ethersProvider.getBlock(receipt.blockNumber);
      const date = new Date(Number(block.timestamp) * 1000);

      // Create contract instances for all tokens
      const sbcContract = new ethers.Contract(SBC_ADDRESS, duckCoinAbi, ethersProvider);
      const sdcContract = new ethers.Contract(SDC_ADDRESS, duckCoinAbi, ethersProvider);
      const srpcContract = new ethers.Contract(SRPC_ADDRESS, proveOfReputationAbi, ethersProvider);
      const studentMgmtContract = new ethers.Contract(STUDENT_MANAGEMENT_ADDRESS, studentManagementAbi, ethersProvider);

      // Query events from all contracts for this block
      const [sbcTransfers, sdcTransfers, srpcTransfers, studentAddedEvents, studentRemovedEvents, sbcMintedEvents, sbcBurnedEvents, sdcMintedEvents, sdcBurnedEvents, srpcMintedEvents, srpcBurnedEvents] = await Promise.all([
        sbcContract.queryFilter(sbcContract.filters.Transfer(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        sdcContract.queryFilter(sdcContract.filters.Transfer(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        srpcContract.queryFilter(srpcContract.filters.Transfer(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.StudentAdded(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.StudentRemoved(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SBCMinted(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SBCBurned(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SDCMinted(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SDCBurned(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SRPCMinted(), receipt.blockNumber, receipt.blockNumber).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SRPCBurned(), receipt.blockNumber, receipt.blockNumber).catch(() => [])
      ]);

      // Find the matching event
      const allEvents = [
        ...sbcTransfers.map(e => ({ ...e, eventType: "Transfer", tokenType: "SBC" })),
        ...sdcTransfers.map(e => ({ ...e, eventType: "Transfer", tokenType: "SDC" })),
        ...srpcTransfers.map(e => ({ ...e, eventType: "Transfer", tokenType: "SRPC" })),
        ...studentAddedEvents.map(e => ({ ...e, eventType: "StudentAdded", tokenType: "StudentManagement" })),
        ...studentRemovedEvents.map(e => ({ ...e, eventType: "StudentRemoved", tokenType: "StudentManagement" })),
        ...sbcMintedEvents.map(e => ({ ...e, eventType: "SBCMinted", tokenType: "SBC" })),
        ...sbcBurnedEvents.map(e => ({ ...e, eventType: "SBCBurned", tokenType: "SBC" })),
        ...sdcMintedEvents.map(e => ({ ...e, eventType: "SDCMinted", tokenType: "SDC" })),
        ...sdcBurnedEvents.map(e => ({ ...e, eventType: "SDCBurned", tokenType: "SDC" })),
        ...srpcMintedEvents.map(e => ({ ...e, eventType: "SRPCMinted", tokenType: "SRPC" })),
        ...srpcBurnedEvents.map(e => ({ ...e, eventType: "SRPCBurned", tokenType: "SRPC" }))
      ];

      const matchingEvent = allEvents.find(e => e.transactionHash === searchTxHash);

      // Decode function call
      let functionName = "Unknown";
      let functionParams = "";
      let type = "Contract Call";
      let transferFrom = null;
      let transferTo = null;
      let transferAmount = "0";
      const tokenType = getTokenType(tx.to);

      if (matchingEvent) {
        functionName = matchingEvent.eventType || "Unknown";
        type = matchingEvent.eventType || "Unknown";
        const eventTokenType = matchingEvent.tokenType || tokenType;

        if (matchingEvent.eventType === "Transfer") {
          transferFrom = matchingEvent.args.from;
          transferTo = matchingEvent.args.to;
          transferAmount = ethers.formatEther(matchingEvent.args.value);
          functionParams = `From: ${matchingEvent.args.from.substring(0, 6)}...${matchingEvent.args.from.substring(38)}, To: ${matchingEvent.args.to.substring(0, 6)}...${matchingEvent.args.to.substring(38)}, Amount: ${ethers.formatEther(matchingEvent.args.value)} ${eventTokenType}`;
        } else if (matchingEvent.eventType === "StudentAdded") {
          transferTo = matchingEvent.args.wallet;
          functionParams = `Wallet: ${matchingEvent.args.wallet.substring(0, 6)}...${matchingEvent.args.wallet.substring(38)}, Name: ${matchingEvent.args.name}, ID: ${matchingEvent.args.studentId}`;
        } else if (matchingEvent.eventType === "StudentRemoved") {
          transferFrom = matchingEvent.args.wallet;
          functionParams = `Student ID: ${matchingEvent.args.studentId}, Wallet: ${matchingEvent.args.wallet.substring(0, 6)}...${matchingEvent.args.wallet.substring(38)}`;
        } else if (matchingEvent.eventType === "SBCMinted" || matchingEvent.eventType === "SDCMinted" || matchingEvent.eventType === "SRPCMinted") {
          transferTo = matchingEvent.args.to;
          transferAmount = ethers.formatEther(matchingEvent.args.amount);
          functionParams = `To: ${matchingEvent.args.to.substring(0, 6)}...${matchingEvent.args.to.substring(38)}, Amount: ${ethers.formatEther(matchingEvent.args.amount)} ${eventTokenType}`;
        } else if (matchingEvent.eventType === "SBCBurned" || matchingEvent.eventType === "SDCBurned" || matchingEvent.eventType === "SRPCBurned") {
          transferFrom = matchingEvent.args.from;
          transferAmount = ethers.formatEther(matchingEvent.args.amount);
          functionParams = `From: ${matchingEvent.args.from.substring(0, 6)}...${matchingEvent.args.from.substring(38)}, Amount: ${ethers.formatEther(matchingEvent.args.amount)} ${eventTokenType}`;
        }
      } else {
        // Try to decode from transaction data
        try {
          if (tx.data && tx.data.length >= 10) {
            // Determine which ABI to use
            let abiToUse = duckCoinAbi;
            if (tokenType === "SRPC") {
              abiToUse = proveOfReputationAbi;
            } else if (tokenType === "StudentManagement") {
              abiToUse = studentManagementAbi;
            }

            const iface = new ethers.Interface(abiToUse);
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

              // Extract info for different functions
              if (decoded.name === "addStudent") {
                transferTo = decoded.args[0]; // wallet address
                functionParams = `Wallet: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Name: ${decoded.args[1]}, ID: ${decoded.args[2]}`;
              } else if (decoded.name === "removeStudent") {
                functionParams = `Student ID: ${decoded.args[0]}`;
              } else if (decoded.name === "mint" || decoded.name === "mintSBC" || decoded.name === "mintSDC" || decoded.name === "mintSRPC") {
                transferTo = decoded.args[0];
                transferAmount = ethers.formatEther(decoded.args[1]);
                const token = decoded.name === "mintSBC" ? "SBC" : decoded.name === "mintSDC" ? "SDC" : decoded.name === "mintSRPC" ? "SRPC" : tokenType;
                functionParams = `To: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Amount: ${ethers.formatEther(decoded.args[1])} ${token}`;
              } else if (decoded.name === "burn" || decoded.name === "burnSBC" || decoded.name === "burnSDC" || decoded.name === "burnSRPC") {
                transferFrom = decoded.args[0];
                transferAmount = ethers.formatEther(decoded.args[1]);
                const token = decoded.name === "burnSBC" ? "SBC" : decoded.name === "burnSDC" ? "SDC" : decoded.name === "burnSRPC" ? "SRPC" : tokenType;
                functionParams = `From: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Amount: ${ethers.formatEther(decoded.args[1])} ${token}`;
              } else if (decoded.name === "transfer") {
                transferFrom = decoded.args[0];
                transferTo = decoded.args[1];
                transferAmount = ethers.formatEther(decoded.args[2]);
                functionParams = `From: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, To: ${decoded.args[1].substring(0, 6)}...${decoded.args[1].substring(38)}, Amount: ${ethers.formatEther(decoded.args[2])} ${tokenType}`;
              }
            }
          }
        } catch (e) {
          // Decoding failed, keep defaults
        }
      }

      const txDetails = {
        hash: searchTxHash,
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
        type: type,
        tokenType: matchingEvent?.tokenType || tokenType
      };

      setTransactionHistory([txDetails]);
      setSearchTxHash("");
    } catch (err) {
      alert("❌ Failed to search transaction: " + (err.message || "Invalid transaction hash"));
      setSearchTxHash("");
    }
  }

  // ---------------- SEARCH TRANSACTIONS BY STUDENT ID ----------------
  async function searchTransactionsByStudentId() {
    if (!searchStudentId) return alert("Please enter a student ID");
    if (!contract) return alert("Please connect wallet first");

    setIsLoadingTransactions(true);
    setTransactionHistory([]);

    try {
      // Get student wallet address from ID
      const studentId = BigInt(searchStudentId);
      const studentInfo = await contract.getStudentById(studentId);
      
      if (studentInfo.wallet === ethers.ZeroAddress) {
        alert("❌ Student not found");
        setSearchStudentId("");
        setIsLoadingTransactions(false);
        return;
      }

      const studentWallet = studentInfo.wallet.toLowerCase();

      // Load all transactions (similar to loadTransactionHistory)
      const provider = await detectEthereumProvider();
      if (!provider) return alert("Provider not found");
      
      const ethersProvider = new ethers.BrowserProvider(provider);
      
      // Create contract instances for all tokens
      const sbcContract = new ethers.Contract(SBC_ADDRESS, duckCoinAbi, ethersProvider);
      const sdcContract = new ethers.Contract(SDC_ADDRESS, duckCoinAbi, ethersProvider);
      const srpcContract = new ethers.Contract(SRPC_ADDRESS, proveOfReputationAbi, ethersProvider);
      const studentMgmtContract = new ethers.Contract(STUDENT_MANAGEMENT_ADDRESS, studentManagementAbi, ethersProvider);
      
      const currentBlock = await ethersProvider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      // Query Transfer events from all token contracts
      const [sbcTransfers, sdcTransfers, srpcTransfers, studentAddedEvents, studentRemovedEvents, sbcMintedEvents, sbcBurnedEvents, sdcMintedEvents, sdcBurnedEvents, srpcMintedEvents, srpcBurnedEvents] = await Promise.all([
        sbcContract.queryFilter(sbcContract.filters.Transfer(), fromBlock, currentBlock).catch(() => []),
        sdcContract.queryFilter(sdcContract.filters.Transfer(), fromBlock, currentBlock).catch(() => []),
        srpcContract.queryFilter(srpcContract.filters.Transfer(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.StudentAdded(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.StudentRemoved(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SBCMinted(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SBCBurned(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SDCMinted(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SDCBurned(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SRPCMinted(), fromBlock, currentBlock).catch(() => []),
        studentMgmtContract.queryFilter(studentMgmtContract.filters.SRPCBurned(), fromBlock, currentBlock).catch(() => [])
      ]);

      const allTransactions = [];
      const seenHashes = new Set();

      const allEvents = [
        ...sbcTransfers.map(e => ({ ...e, eventType: "Transfer", tokenType: "SBC" })),
        ...sdcTransfers.map(e => ({ ...e, eventType: "Transfer", tokenType: "SDC" })),
        ...srpcTransfers.map(e => ({ ...e, eventType: "Transfer", tokenType: "SRPC" })),
        ...studentAddedEvents.map(e => ({ ...e, eventType: "StudentAdded", tokenType: "StudentManagement" })),
        ...studentRemovedEvents.map(e => ({ ...e, eventType: "StudentRemoved", tokenType: "StudentManagement" })),
        ...sbcMintedEvents.map(e => ({ ...e, eventType: "SBCMinted", tokenType: "SBC" })),
        ...sbcBurnedEvents.map(e => ({ ...e, eventType: "SBCBurned", tokenType: "SBC" })),
        ...sdcMintedEvents.map(e => ({ ...e, eventType: "SDCMinted", tokenType: "SDC" })),
        ...sdcBurnedEvents.map(e => ({ ...e, eventType: "SDCBurned", tokenType: "SDC" })),
        ...srpcMintedEvents.map(e => ({ ...e, eventType: "SRPCMinted", tokenType: "SRPC" })),
        ...srpcBurnedEvents.map(e => ({ ...e, eventType: "SRPCBurned", tokenType: "SRPC" }))
      ];

      for (const event of allEvents) {
        if (seenHashes.has(event.transactionHash)) continue;
        seenHashes.add(event.transactionHash);

        // Check if this event involves the student's wallet
        let involvesStudent = false;
        if (event.eventType === "Transfer") {
          involvesStudent = event.args.from.toLowerCase() === studentWallet || 
                           event.args.to.toLowerCase() === studentWallet;
        } else if (event.eventType === "StudentAdded" || event.eventType === "TokensMinted") {
          involvesStudent = event.args.wallet?.toLowerCase() === studentWallet || 
                           event.args.to?.toLowerCase() === studentWallet;
        } else if (event.eventType === "StudentRemoved" || event.eventType === "TokensBurned") {
          involvesStudent = event.args.wallet?.toLowerCase() === studentWallet || 
                           event.args.from?.toLowerCase() === studentWallet;
        }

        if (!involvesStudent) continue;

        const tx = await ethersProvider.getTransaction(event.transactionHash);
        const receipt = await ethersProvider.getTransactionReceipt(event.transactionHash);
        const block = await ethersProvider.getBlock(receipt.blockNumber);
        const date = new Date(Number(block.timestamp) * 1000);

        let functionName = event.eventType || "Unknown";
        let functionParams = "";
        let transferFrom = null;
        let transferTo = null;
        let transferAmount = "0";

        const tokenType = event.tokenType || getTokenType(tx.to);

        if (event.eventType === "Transfer") {
          transferFrom = event.args.from;
          transferTo = event.args.to;
          transferAmount = ethers.formatEther(event.args.value);
          functionParams = `From: ${event.args.from.substring(0, 6)}...${event.args.from.substring(38)}, To: ${event.args.to.substring(0, 6)}...${event.args.to.substring(38)}, Amount: ${ethers.formatEther(event.args.value)} ${tokenType}`;
        } else if (event.eventType === "StudentAdded") {
          transferTo = event.args.wallet;
          functionParams = `Wallet: ${event.args.wallet.substring(0, 6)}...${event.args.wallet.substring(38)}, Name: ${event.args.name}, ID: ${event.args.studentId}`;
        } else if (event.eventType === "StudentRemoved") {
          transferFrom = event.args.wallet;
          functionParams = `Student ID: ${event.args.studentId}, Wallet: ${event.args.wallet.substring(0, 6)}...${event.args.wallet.substring(38)}`;
        } else if (event.eventType === "SBCMinted" || event.eventType === "SDCMinted" || event.eventType === "SRPCMinted") {
          transferTo = event.args.to;
          transferAmount = ethers.formatEther(event.args.amount);
          functionParams = `To: ${event.args.to.substring(0, 6)}...${event.args.to.substring(38)}, Amount: ${ethers.formatEther(event.args.amount)} ${tokenType}`;
        } else if (event.eventType === "SBCBurned" || event.eventType === "SDCBurned" || event.eventType === "SRPCBurned") {
          transferFrom = event.args.from;
          transferAmount = ethers.formatEther(event.args.amount);
          functionParams = `From: ${event.args.from.substring(0, 6)}...${event.args.from.substring(38)}, Amount: ${ethers.formatEther(event.args.amount)} ${tokenType}`;
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
          type: event.eventType || "Unknown",
          tokenType: tokenType
        });
      }

      // Also check regular transactions to the contract
      for (let blockNum = currentBlock; blockNum >= fromBlock && blockNum >= 0; blockNum--) {
        try {
          const block = await ethersProvider.getBlock(blockNum, true);
          if (!block || !block.transactions) continue;

          for (const txHash of block.transactions) {
            if (seenHashes.has(txHash)) continue;

            try {
              const tx = await ethersProvider.getTransaction(txHash);
              if (!tx || !tx.to) continue;
              
              // Check if transaction is to any of our contracts
              const contractAddresses = [
                SBC_ADDRESS,
                SDC_ADDRESS,
                SRPC_ADDRESS,
                STUDENT_MANAGEMENT_ADDRESS
              ].filter(addr => addr && addr.trim() !== "");
              
              const contractMatch = contractAddresses.find(addr => 
                tx.to?.toLowerCase() === addr.toLowerCase()
              );
              if (!contractMatch) continue;
              if (tx.from.toLowerCase() !== studentWallet) continue; // Only transactions from this student

              seenHashes.add(txHash);
              const receipt = await ethersProvider.getTransactionReceipt(txHash);
              const date = new Date(Number(block.timestamp) * 1000);

              // Determine which contract and ABI to use
              const tokenType = getTokenType(contractMatch);
              let abiToUse = duckCoinAbi;
              if (tokenType === "SRPC") {
                abiToUse = proveOfReputationAbi;
              } else if (tokenType === "StudentManagement") {
                abiToUse = studentManagementAbi;
              }

              let functionName = "Unknown";
              let functionParams = "";
              let type = "Contract Call";
              let transferFrom = null;
              let transferTo = null;
              let transferAmount = "0";

              try {
                if (tx.data && tx.data.length >= 10) {
                  const iface = new ethers.Interface(abiToUse);
                  const decoded = iface.parseTransaction({ data: tx.data });
                  if (decoded) {
                    functionName = decoded.name;
                    type = decoded.name;
                    
                    functionParams = decoded.args.map((arg, i) => {
                      if (typeof arg === 'string' && arg.startsWith('0x') && arg.length === 42) {
                        return `${arg.substring(0, 6)}...${arg.substring(38)}`;
                      }
                      if (typeof arg === 'bigint') {
                        return arg.toString();
                      }
                      return String(arg);
                    }).join(", ");

                    if (decoded.name === "addStudent") {
                      transferTo = decoded.args[0];
                      functionParams = `Wallet: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Name: ${decoded.args[1]}, ID: ${decoded.args[2]}`;
                    } else if (decoded.name === "removeStudent") {
                      functionParams = `Student ID: ${decoded.args[0]}`;
                    } else if (decoded.name === "mint" || decoded.name === "mintSBC" || decoded.name === "mintSDC" || decoded.name === "mintSRPC") {
                      transferTo = decoded.args[0];
                      transferAmount = ethers.formatEther(decoded.args[1]);
                      const token = decoded.name === "mintSBC" ? "SBC" : decoded.name === "mintSDC" ? "SDC" : decoded.name === "mintSRPC" ? "SRPC" : tokenType;
                      functionParams = `To: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Amount: ${ethers.formatEther(decoded.args[1])} ${token}`;
                    } else if (decoded.name === "burn" || decoded.name === "burnSBC" || decoded.name === "burnSDC" || decoded.name === "burnSRPC") {
                      transferFrom = decoded.args[0];
                      transferAmount = ethers.formatEther(decoded.args[1]);
                      const token = decoded.name === "burnSBC" ? "SBC" : decoded.name === "burnSDC" ? "SDC" : decoded.name === "burnSRPC" ? "SRPC" : tokenType;
                      functionParams = `From: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, Amount: ${ethers.formatEther(decoded.args[1])} ${token}`;
                    } else if (decoded.name === "transfer") {
                      transferFrom = decoded.args[0];
                      transferTo = decoded.args[1];
                      transferAmount = ethers.formatEther(decoded.args[2]);
                      functionParams = `From: ${decoded.args[0].substring(0, 6)}...${decoded.args[0].substring(38)}, To: ${decoded.args[1].substring(0, 6)}...${decoded.args[1].substring(38)}, Amount: ${ethers.formatEther(decoded.args[2])} ${tokenType}`;
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
                type: type,
                tokenType: tokenType
              });
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          continue;
        }
      }

      allTransactions.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
      
      setTransactionHistory(allTransactions);
      if (allTransactions.length === 0) {
        alert(`No transactions found for student ID ${searchStudentId}`);
      }
      setSearchStudentId("");
    } catch (err) {
      alert("❌ Failed to search transactions: " + (err.message || "Unknown error"));
      setSearchStudentId("");
    } finally {
      setIsLoadingTransactions(false);
    }
  }

  return (
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
        Load and view all recent transactions on SBC, SDC, SRPC, and StudentManagement contracts.
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
                  <th style={{ padding: 10, textAlign: "left", color: "white", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>Token</th>
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
                      {tx.hash.substring(0, 10)}...
                    </td>
                    <td style={{ padding: 10, color: stevensRed, fontSize: 11, fontWeight: 600 }}>
                      {tx.tokenType || "Unknown"}
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
                      {tx.transferAmount ? `${parseFloat(tx.transferAmount).toFixed(2)} ${tx.tokenType || "SBC"}` : `${tx.value} ETH`}
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
          🔍 Search by Student ID
        </h3>
        <p style={{ marginBottom: 20, color: stevensTextGrey }}>
          Search for all transactions related to a specific student ID.
        </p>
        <input
          placeholder="Student ID"
          value={searchStudentId}
          onChange={(e) => setSearchStudentId(e.target.value)}
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = stevensRed}
          onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
        />
        <button 
          onClick={searchTransactionsByStudentId} 
          style={{
            ...buttonStyle,
            marginTop: 8,
            marginBottom: 32,
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
          {isLoadingTransactions ? "⏳ Loading..." : "Search Transactions by Student ID"}
        </button>

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
        <input
          placeholder="Transaction Hash"
          value={searchTxHash}
          onChange={(e) => setSearchTxHash(e.target.value)}
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = stevensRed}
          onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
        />
        <button 
          onClick={searchTransactionByHash} 
          style={{
            ...buttonStyle,
            marginTop: 8,
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
      </div>
    </div>
  );
}

