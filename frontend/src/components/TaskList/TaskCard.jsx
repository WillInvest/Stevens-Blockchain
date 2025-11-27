import { useState, useEffect } from "react";
import BidModal from "./BidModal";
import { cardStyle, stevensRed, stevensTextGrey } from "../../styles/constants";

export default function TaskCard({ 
  task, 
  wallet, 
  taskManagerContract, 
  duckCoinContract,
  onAction 
}) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isAssigned, setIsAssigned] = useState(false);

  useEffect(() => {
    if (task && wallet) {
      setIsCreator(task.creator?.toLowerCase() === wallet?.toLowerCase());
      setIsAssigned(task.assignedTo?.toLowerCase() === wallet?.toLowerCase());
    }
  }, [task, wallet]);

  useEffect(() => {
    if (task?.bidDeadline && task.bidDeadline > 0) {
      const updateTimer = () => {
        const now = Date.now();
        const remaining = task.bidDeadline - now;
        if (remaining > 0) {
          const hours = Math.floor(remaining / 3600000);
          const minutes = Math.floor((remaining % 3600000) / 60000);
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining("Deadline Passed");
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [task?.bidDeadline]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Unassigned": return "#3B82F6"; // Blue
      case "Ongoing": return "#10B981"; // Green
      case "Completed": return "#6B7280"; // Gray
      case "Disputed": return "#EF4444"; // Red
      default: return "#6B7280";
    }
  };

  const getRewardTypeColor = (rewardType) => {
    return rewardType === "PoR" ? "#FFD700" : "#FFFFFF";
  };

  const handlePlaceBid = () => {
    setShowBidModal(true);
  };

  const handleAcceptBid = async () => {
    // TODO: Call contract method
    console.log("Accept bid for task:", task.taskId);
    if (onAction) onAction();
  };

  const handleCompleteTask = async () => {
    // TODO: Call contract method
    console.log("Complete task:", task.taskId);
    if (onAction) onAction();
  };

  const handleReportDispute = async () => {
    // TODO: Call contract method
    console.log("Report dispute for task:", task.taskId);
    if (onAction) onAction();
  };

  if (!task) return null;

  const isPoRTask = task.rewardType === "PoR";
  const cardBackground = isPoRTask ? "#FFF8DC" : "#FFFFFF"; // Gold tint for PoR tasks

  return (
    <>
      <div style={{
        ...cardStyle,
        background: cardBackground,
        border: isPoRTask ? `2px solid #FFD700` : cardStyle.border,
        position: "relative"
      }}>
        {/* PoR Badge */}
        {isPoRTask && (
          <div style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "#FFD700",
            color: "#000",
            padding: "4px 12px",
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            PoR Task
          </div>
        )}

        {/* Task Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16
        }}>
          <div>
            <h3 style={{
              margin: 0,
              marginBottom: 8,
              color: stevensRed,
              fontSize: 18,
              fontWeight: 700
            }}>
              Task #{task.taskId}
            </h3>
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 12,
              background: getStatusColor(task.status),
              color: "white",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              {task.status}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600 }}>
            Task Description:
          </span>
          <p style={{
            marginTop: 8,
            marginBottom: 0,
            color: stevensTextGrey,
            lineHeight: 1.6
          }}>
            {task.description}
          </p>
        </div>

        {/* Task Details Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
          padding: 12,
          background: "#F8F9FA",
          borderRadius: 6
        }}>
          <div>
            <span style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600 }}>
              Creator:
            </span>
            <div style={{ fontSize: 13, fontFamily: "monospace", marginTop: 4 }}>
              {task.creator?.slice(0, 6)}...{task.creator?.slice(-4)}
            </div>
          </div>
          {/* Credit Score - Hide for all PoR tasks */}
          {!isPoRTask && (
            <div>
              <span style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600 }}>
                Credit Score:
              </span>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                {task.creatorCreditScore} PoR
              </div>
            </div>
          )}
          <div>
            <span style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600 }}>
              Reward Amount:
            </span>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              {task.rewardAmount} {task.rewardType === "PoR" ? "PoR" : "DC"}
            </div>
          </div>
          {/* Taker Student ID - Only for ongoing tasks */}
          {task.status === "Ongoing" && task.assignedTo && (
            <div>
              <span style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600 }}>
                Taker Student ID:
              </span>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                {task.takerStudentId || "N/A"}
              </div>
            </div>
          )}
        </div>

        {/* Current Bid (PoR tasks only) */}
        {isPoRTask && task.status === "Unassigned" && (
          <div style={{
            marginBottom: 16,
            padding: 12,
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
                Current Highest Bid:
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: stevensRed }}>
                {task.currentBid ? `${task.currentBid.amount} DC` : "No bids yet"}
              </span>
            </div>
            {task.currentBid && (
              <div style={{
                fontSize: 11,
                color: stevensTextGrey,
                marginBottom: 8
              }}>
                Bidder: {task.currentBid.bidder?.slice(0, 6)}...{task.currentBid.bidder?.slice(-4)}
              </div>
            )}
            {timeRemaining && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: timeRemaining === "Deadline Passed" ? "#EF4444" : "#059669",
                fontWeight: 600
              }}>
                <span>⏰</span>
                <span>Accept Deadline: {timeRemaining}</span>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        {(task.subject || (task.categories && task.categories.length > 0)) && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: stevensTextGrey, textTransform: "uppercase", fontWeight: 600 }}>
              Categories:
            </span>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 8
            }}>
              {task.subject && (
                <span style={{
                  padding: "4px 10px",
                  background: stevensRed,
                  color: "white",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {task.subject} (Subject)
                </span>
              )}
              {task.categories && task.categories.map((cat, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: "4px 10px",
                    background: "#E8F4F8",
                    color: "#1E40AF",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* File Link */}
        {task.fileHash && (
          <div style={{ marginBottom: 16 }}>
            <a
              href={`https://ipfs.io/ipfs/${task.fileHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: stevensRed,
                textDecoration: "none",
                fontWeight: 600
              }}
            >
              📎 View File (IPFS)
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        }}>
          {task.status === "Unassigned" && isPoRTask && !isCreator && (
            <button
              onClick={handlePlaceBid}
              style={{
                padding: "8px 16px",
                border: "none",
                background: stevensRed,
                color: "white",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Place Bid
            </button>
          )}
          {task.status === "Unassigned" && isPoRTask && isCreator && task.currentBid && (
            <button
              onClick={handleAcceptBid}
              disabled={timeRemaining === "Deadline Passed"}
              style={{
                padding: "8px 16px",
                border: "none",
                background: timeRemaining === "Deadline Passed" ? "#9CA3AF" : "#10B981",
                color: "white",
                fontWeight: 600,
                fontSize: 12,
                cursor: timeRemaining === "Deadline Passed" ? "not-allowed" : "pointer",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                opacity: timeRemaining === "Deadline Passed" ? 0.6 : 1
              }}
            >
              Accept Bid
            </button>
          )}
          {task.status === "Ongoing" && isCreator && (
            <button
              onClick={handleCompleteTask}
              style={{
                padding: "8px 16px",
                border: "none",
                background: "#10B981",
                color: "white",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Complete Task
            </button>
          )}
          {task.status === "Ongoing" && isAssigned && (
            <button
              onClick={handleReportDispute}
              style={{
                padding: "8px 16px",
                border: "none",
                background: "#EF4444",
                color: "white",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Report Dispute
            </button>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <BidModal
          task={task}
          wallet={wallet}
          taskManagerContract={taskManagerContract}
          duckCoinContract={duckCoinContract}
          onClose={() => setShowBidModal(false)}
          onBidPlaced={() => {
            setShowBidModal(false);
            if (onAction) onAction();
          }}
        />
      )}
    </>
  );
}

