import { useState } from "react";
import TaskCard from "./TaskCard";
import { cardStyle, stevensRed, stevensTextGrey, inputStyle, buttonStyle } from "../../styles/constants";

export default function SearchByCreatorId({ wallet, taskManagerContract, duckCoinContract, studentManagementContract, status }) {
  const [creatorId, setCreatorId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!creatorId.trim()) {
      setError("Please enter a creator's student ID");
      return;
    }

    setError("");
    setLoading(true);
    setTasks([]);

    try {
      // TODO: Get creator address from student ID
      // const studentInfo = await studentManagementContract.getStudentById(creatorId);
      // const creatorAddress = studentInfo.wallet;
      
      // TODO: Call contract method to get tasks by creator
      // const allTasks = await taskManagerContract.getCreatorTasks(creatorAddress);
      // Filter by status
      // const filteredTasks = allTasks.filter(t => t.status.toLowerCase() === status);

      // For demo, simulate search
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock tasks
      const mockTasks = [
        {
          taskId: 1,
          creator: "0x1234...5678",
          description: "Task created by this student",
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
          categories: ["Software Development"]
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
      {/* Search Input */}
      <div style={cardStyle}>
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 16
        }}>
          <input
            type="text"
            value={creatorId}
            onChange={(e) => setCreatorId(e.target.value)}
            placeholder="Enter Creator's Student ID"
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
            Enter a creator's student ID and click Search to find tasks
          </div>
        </div>
      )}
    </div>
  );
}

