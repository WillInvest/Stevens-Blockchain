import { useState } from "react";
import TaskCard from "./TaskCard";
import { cardStyle, stevensRed, stevensTextGrey, inputStyle, buttonStyle } from "../../styles/constants";

export default function SearchByTaskId({ wallet, taskManagerContract, duckCoinContract, status }) {
  const [taskId, setTaskId] = useState("");
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!taskId.trim()) {
      setError("Please enter a task ID");
      return;
    }

    setError("");
    setLoading(true);
    setTask(null);

    try {
      // TODO: Call contract method
      // const taskData = await taskManagerContract.tasks(taskId);
      // Filter by status if needed
      // if (taskData.status !== status) {
      //   setError(`Task found but status is ${taskData.status}, not ${status}`);
      //   return;
      // }
      // setTask(taskData);

      // For demo, simulate search
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock task data
      const mockTask = {
        taskId: parseInt(taskId),
        creator: "0x1234...5678",
        description: "Sample task description",
        fileHash: "",
        rewardType: "DuckCoin",
        rewardAmount: "100",
        assignedTo: status === "ongoing" ? "0xABCD...EFGH" : null,
        bidAmount: "0",
        status: status === "ongoing" ? "Ongoing" : "Unassigned",
        createdAt: Date.now() - 86400000,
        assignedAt: status === "ongoing" ? Date.now() - 43200000 : null,
        completedAt: null,
        bidDeadline: 0,
        hasDispute: false,
        currentBid: null,
        creatorCreditScore: "75",
        takerStudentId: status === "ongoing" ? "12345" : null,
        subject: "Computer Science",
        categories: ["Software Development", "Web Development"]
      };

      if (mockTask.status.toLowerCase() !== status) {
        setError(`No ${status} task found with ID ${taskId}`);
        return;
      }

      setTask(mockTask);
    } catch (err) {
      setError(err.message || "Task not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Search Input */}
      <div style={cardStyle}>
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 16
        }}>
          <input
            type="number"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            placeholder="Enter Task ID"
            style={{
              ...inputStyle,
              flex: 1,
              marginBottom: 0
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div style={{
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
      {task && (
        <div>
          <h3 style={{
            marginBottom: 16,
            color: stevensRed,
            fontSize: 16,
            fontWeight: 600
          }}>
            Search Results ({status === "unassigned" ? "Unassigned" : "Ongoing"}):
          </h3>
          <TaskCard
            task={task}
            wallet={wallet}
            taskManagerContract={taskManagerContract}
            duckCoinContract={duckCoinContract}
          />
        </div>
      )}

      {!task && !loading && !error && (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
            Enter a task ID and click Search to find tasks
          </div>
        </div>
      )}
    </div>
  );
}

