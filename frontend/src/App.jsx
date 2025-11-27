import { useState } from "react";
import { useContract } from "./hooks/useContract";
import StevensCoin from "./components/StevensCoin/StevensCoin";
import Exchange from "./components/Exchange/Exchange";
import Lending from "./components/Lending/Lending";
import TaskList from "./components/TaskList/TaskList";
import StudentInfo from "./components/Utils/StudentInfo";
import TransactionInfo from "./components/Utils/TransactionInfo";
import AvailableAddresses from "./components/Utils/AvailableAddresses";
import { stevensRed, stevensDarkGrey, stevensLightGrey, buttonStyle } from "./styles/constants";

export default function App() {
  const { 
    wallet, 
    contract, 
    studentManagementContract, 
    duckCoinContract, // SBC
    nftContract, // SRPC
    sdcContract, // SDC
    connectWallet 
  } = useContract();
  const [activeTab, setActiveTab] = useState("stevensCoin");

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
          STEVENS BLOCKCHAIN
        </div>
        <div style={{ 
          fontSize: 14, 
          opacity: 0.95,
          fontWeight: 500,
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 20
        }}>
          {wallet && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4
            }}>
              <span style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Connected Wallet</span>
              <span style={{ fontSize: 12, fontFamily: "monospace", wordBreak: "break-all" }}>
                {wallet}
              </span>
            </div>
          )}
          <span>Beta Version 0.1.0 (Nov 24, 2025)</span>
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
              STEVENS BLOCKCHAIN
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
                {/* MAIN TAB NAVIGATION */}
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 24,
                  borderBottom: `2px solid ${stevensRed}`,
                  paddingBottom: 0
                }}>
                  {[
                    { id: "stevensCoin", label: "🪙 Stevens Coin", icon: "🪙" },
                    { id: "exchange", label: "🔄 Exchange", icon: "🔄" },
                    { id: "lending", label: "💰 Lending", icon: "💰" },
                    { id: "taskList", label: "📋 Task List", icon: "📋" },
                    { id: "studentInfo", label: "👥 Student Info", icon: "👥" },
                    { id: "transactionInfo", label: "📊 Transaction Info", icon: "📊" },
                    { id: "available", label: "📇 Available Addresses", icon: "📇" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: "16px 28px",
                        border: "none",
                        background: activeTab === tab.id ? stevensRed : "transparent",
                        color: activeTab === tab.id ? "white" : stevensRed,
                        fontWeight: activeTab === tab.id ? 700 : 500,
                        fontSize: 16,
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
                  {activeTab === "stevensCoin" && (
                    <StevensCoin 
                      contract={studentManagementContract || contract} 
                      sbcContract={duckCoinContract} // SBC (Stevens Banana Coin)
                      sdcContract={sdcContract} // SDC (Stevens Duck Coin)
                      srpcContract={nftContract} // SRPC (Stevens Reputation Proof Coin)
                      wallet={wallet} 
                    />
                  )}
                  {activeTab === "exchange" && (
                    <Exchange
                      contract={contract}
                      duckCoinContract={duckCoinContract}
                      nftContract={nftContract}
                    />
                  )}
                  {activeTab === "lending" && (
                    <Lending
                      wallet={wallet}
                      contract={contract}
                      duckCoinContract={duckCoinContract}
                      nftContract={nftContract}
                      studentManagementContract={studentManagementContract || contract}
                    />
                  )}
                  {activeTab === "taskList" && (
                    <TaskList
                      wallet={wallet}
                      taskManagerContract={null}
                      studentManagementContract={studentManagementContract || contract}
                      duckCoinContract={duckCoinContract}
                      nftContract={nftContract}
                    />
                  )}
                  {activeTab === "studentInfo" && (
                    <StudentInfo 
                      contract={studentManagementContract || contract}
                      sbcContract={duckCoinContract}
                      sdcContract={sdcContract}
                      srpcContract={nftContract}
                    />
                  )}
                  {activeTab === "transactionInfo" && <TransactionInfo contract={contract} />}
                  {activeTab === "available" && (
                    <AvailableAddresses 
                      contract={studentManagementContract || contract}
                    />
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
