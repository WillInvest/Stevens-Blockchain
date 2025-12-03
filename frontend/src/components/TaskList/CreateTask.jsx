import { useState } from "react";
import { cardStyle, stevensRed, stevensTextGrey, inputStyle, buttonStyle } from "../../styles/constants";
import { TASK_CATEGORIES } from "./categories";

export default function CreateTask({
  wallet,
  taskManagerContract,
  studentManagementContract,
  duckCoinContract,
  onClose,
  onTaskCreated
}) {
  const [description, setDescription] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [rewardType, setRewardType] = useState("DuckCoin");
  const [rewardAmount, setRewardAmount] = useState("");
  const [subject, setSubject] = useState(""); // Required category
  const [categories, setCategories] = useState([]); // Additional categories (up to 3 more)
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Implement IPFS upload
      // For demo, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockHash = "Qm" + Math.random().toString(36).substring(2, 15);
      setFileHash(mockHash);
      alert(`File uploaded! IPFS Hash: ${mockHash}\n(Note: This is a demo - actual IPFS integration needed)`);
    } catch (err) {
      setError("File upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!description.trim()) {
        throw new Error("Description is required");
      }
      if (!subject) {
        throw new Error("Subject category is required");
      }
      if (!rewardAmount || parseFloat(rewardAmount) <= 0) {
        throw new Error("Reward amount must be greater than 0");
      }
      if (categories.length > 3) {
        throw new Error("You can select up to 3 additional categories (4 total including subject)");
      }

      // TODO: Check if user is professor (for SRPC tasks)
      // TODO: Check SRPC balance (for SRPC tasks)
      // TODO: Call contract method
      // await taskManagerContract.createTask(description, fileHash, rewardType, rewardAmount);

      // For demo, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Task creation (demo):", {
        description,
        fileHash,
        rewardType,
        rewardAmount
      });

      // Reset form
      setDescription("");
      setFileHash("");
      setRewardType("DuckCoin");
      setRewardAmount("");
      setSubject("");
      setCategories([]);
      
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        ...cardStyle,
        maxWidth: 600,
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        padding: "24px",
        paddingTop: "60px" // Extra padding for close button
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            color: stevensTextGrey,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#f0f0f0";
            e.target.style.color = stevensRed;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.color = stevensTextGrey;
          }}
        >
          ×
        </button>

        <h2 style={{
          marginTop: 0,
          marginBottom: 24,
          color: stevensRed,
          fontSize: 20,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Create New Task
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Description */}
          <label style={{
            display: "block",
            marginBottom: 8,
            fontSize: 12,
            fontWeight: 600,
            color: "#333333",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit"
            }}
            placeholder="Describe the task requirements..."
          />

          {/* File Upload */}
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
            File Upload (Optional)
          </label>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{
              ...inputStyle,
              padding: "8px 12px",
              cursor: "pointer"
            }}
          />
          {isUploading && (
            <div style={{ fontSize: 12, color: stevensTextGrey, marginTop: 4 }}>
              Uploading to IPFS...
            </div>
          )}
          {fileHash && (
            <div style={{
              marginTop: 8,
              padding: 8,
              background: "#E8F4F8",
              borderRadius: 4,
              fontSize: 11,
              fontFamily: "monospace",
              color: "#1E40AF"
            }}>
              IPFS Hash: {fileHash}
            </div>
          )}

          {/* Reward Type */}
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
            Reward Type *
          </label>
          <div style={{
            display: "flex",
            gap: 16,
            marginBottom: 16
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 14,
              color: "#333333",
              fontWeight: 500
            }}>
              <input
                type="radio"
                value="DuckCoin"
                checked={rewardType === "DuckCoin"}
                onChange={(e) => setRewardType(e.target.value)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ color: "#333333" }}>Duck Coin</span>
            </label>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 14,
              color: "#333333",
              fontWeight: 500
            }}>
              <input
                type="radio"
                value="SRPC"
                checked={rewardType === "SRPC"}
                onChange={(e) => setRewardType(e.target.value)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ color: "#333333" }}>Proof of Reputation (SRPC)</span>
            </label>
          </div>
          {rewardType === "SRPC" && (
            <div style={{
              padding: 12,
              background: "#FFF8DC",
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 12,
              color: "#856404"
            }}>
              ⚠️ Only professors can create SRPC reward tasks. You must have sufficient SRPC balance.
            </div>
          )}

          {/* Subject Category (Required) */}
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
            Subject Category *
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">Select a subject category</option>
            {TASK_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Additional Categories (Optional, up to 3) */}
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
            Additional Categories (Optional, up to 3)
          </label>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 8
          }}>
            {TASK_CATEGORIES.filter(cat => cat !== subject).map(cat => (
              <label
                key={cat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: categories.length >= 3 && !categories.includes(cat) ? "not-allowed" : "pointer",
                  opacity: categories.length >= 3 && !categories.includes(cat) ? 0.5 : 1,
                  fontSize: 13,
                  color: "#333333",
                  fontWeight: 500,
                  padding: "6px 12px",
                  background: categories.includes(cat) ? "#E8F4F8" : "white",
                  border: categories.includes(cat) ? `2px solid ${stevensRed}` : "2px solid #e0e0e0",
                  borderRadius: 6,
                  transition: "all 0.2s ease"
                }}
              >
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (categories.length < 3) {
                        setCategories([...categories, cat]);
                      }
                    } else {
                      setCategories(categories.filter(c => c !== cat));
                    }
                  }}
                  disabled={categories.length >= 3 && !categories.includes(cat)}
                  style={{ cursor: categories.length >= 3 && !categories.includes(cat) ? "not-allowed" : "pointer" }}
                />
                <span style={{ 
                  color: categories.length >= 3 && !categories.includes(cat) ? "#999999" : "#333333"
                }}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
          {categories.length > 0 && (
            <div style={{
              marginTop: 8,
              padding: 8,
              background: "#E8F4F8",
              borderRadius: 4,
              fontSize: 11,
              color: "#1E40AF"
            }}>
              Selected: {categories.join(", ")} ({categories.length}/3)
            </div>
          )}

          {/* Reward Amount */}
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
            Reward Amount *
          </label>
          <input
            type="number"
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
            required
            min="0.000001"
            step="0.000001"
            style={inputStyle}
            placeholder={`Enter amount in ${rewardType === "SRPC" ? "SRPC" : "Duck Coin"}`}
          />

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
          <div style={{
            display: "flex",
            gap: 12,
            marginTop: 24
          }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...buttonStyle,
                background: "#6B7280",
                color: "white"
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

