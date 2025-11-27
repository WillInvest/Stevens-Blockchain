import { useState } from "react";
import TaskCard from "./TaskCard";
import { cardStyle, stevensRed, stevensTextGrey, buttonStyle } from "../../styles/constants";
import { TASK_CATEGORIES } from "./categories";

export default function SearchByCategories({ wallet, taskManagerContract, duckCoinContract, status }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCategoryToggle = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSearch = async () => {
    if (selectedCategories.length === 0) {
      setError("Please select at least one category");
      return;
    }

    setError("");
    setLoading(true);
    setTasks([]);

    try {
      // TODO: Call contract method to search tasks by categories
      // const allTasks = await taskManagerContract.getAllTasks();
      // Filter by categories and status
      // const filteredTasks = allTasks.filter(t => {
      //   const taskCategories = [t.subject, ...t.categories];
      //   const hasMatch = selectedCategories.some(cat => taskCategories.includes(cat));
      //   return hasMatch && t.status.toLowerCase() === status;
      // });

      // For demo, simulate search
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock tasks
      const mockTasks = [
        {
          taskId: 3,
          creator: "0x9999...AAAA",
          description: "Task matching selected categories",
          fileHash: "",
          rewardType: "DuckCoin",
          rewardAmount: "150",
          assignedTo: status === "ongoing" ? "0xBBBB...CCCC" : null,
          bidAmount: "0",
          status: status === "ongoing" ? "Ongoing" : "Unassigned",
          createdAt: Date.now() - 259200000,
          assignedAt: status === "ongoing" ? Date.now() - 172800000 : null,
          completedAt: null,
          bidDeadline: 0,
          hasDispute: false,
          currentBid: null,
          creatorCreditScore: "90",
          takerStudentId: status === "ongoing" ? "67890" : null,
          subject: selectedCategories[0] || "Computer Science",
          categories: selectedCategories.slice(1, 4)
        }
      ];

      setTasks(mockTasks);
    } catch (err) {
      setError(err.message || "No tasks found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Category Selection */}
      <div style={cardStyle}>
        <div style={{
          marginBottom: 16,
          fontSize: 12,
          fontWeight: 600,
          color: "#333333",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Select Categories to Search:
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
          maxHeight: "300px",
          overflowY: "auto",
          padding: 12,
          background: "#F8F9FA",
          borderRadius: 6
        }}>
          {TASK_CATEGORIES.map(cat => (
            <label
              key={cat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 13,
                padding: "6px 12px",
                background: selectedCategories.includes(cat) ? "#E8F4F8" : "white",
                border: selectedCategories.includes(cat) ? `2px solid ${stevensRed}` : "2px solid #e0e0e0",
                borderRadius: 6,
                transition: "all 0.2s ease",
                color: "#333333",
                fontWeight: 500
              }}
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => handleCategoryToggle(cat)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ color: "#333333" }}>{cat}</span>
            </label>
          ))}
        </div>

        {selectedCategories.length > 0 && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: "#E8F4F8",
            borderRadius: 6,
            fontSize: 12,
            color: "#1E40AF"
          }}>
            <strong>Selected ({selectedCategories.length}):</strong> {selectedCategories.join(", ")}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={loading || selectedCategories.length === 0}
          style={{
            ...buttonStyle,
            opacity: loading || selectedCategories.length === 0 ? 0.6 : 1,
            cursor: loading || selectedCategories.length === 0 ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>

        {error && (
          <div style={{
            marginTop: 12,
            padding: 12,
            background: "#FEE2E2",
            borderRadius: 6,
            color: "#DC2626",
            fontSize: 12
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {tasks.length > 0 && (
        <div>
          <h3 style={{
            marginBottom: 16,
            color: stevensRed,
            fontSize: 16,
            fontWeight: 600
          }}>
            Search Results ({status === "unassigned" ? "Unassigned" : "Ongoing"}): {tasks.length} task(s)
          </h3>
          <div style={{ display: "grid", gap: 20 }}>
            {tasks.map(task => (
              <TaskCard
                key={task.taskId}
                task={task}
                wallet={wallet}
                taskManagerContract={taskManagerContract}
                duckCoinContract={duckCoinContract}
              />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && !loading && !error && (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
            Select categories and click Search to find matching tasks
          </div>
        </div>
      )}
    </div>
  );
}

