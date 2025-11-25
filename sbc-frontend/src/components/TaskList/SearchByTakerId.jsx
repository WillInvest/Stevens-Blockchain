import { useState } from "react";
import TaskCard from "./TaskCard";
import { cardStyle, stevensRed, stevensTextGrey, inputStyle, buttonStyle } from "../../styles/constants";

export default function SearchByTakerId({ wallet, taskManagerContract, duckCoinContract, studentManagementContract, status }) {
  const [takerId, setTakerId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!takerId.trim()) {
      setError("Please enter a taker's student ID");
      return;
    }

    setError("");
    setLoading(true);
    setTasks([]);

    try {
      // TODO: Get taker address from student ID
      // const studentInfo = await studentManagementContract.getStudentById(takerId);
      // const takerAddress = studentInfo.wallet;
      
      // TODO: Call contract method to get tasks by taker
      // const allTasks = await taskManagerContract.getTakerTasks(takerAddress);
      // Filter by status
      // const filteredTasks = allTasks.filter(t => t.status.toLowerCase() === status);

      // For demo, simulate search
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock tasks (only ongoing tasks can have takers)
      const mockTasks = status === "ongoing" ? [
        {
          taskId: 2,
          creator: "0x5555...6666",
          description: "Task assigned to this student",
          fileHash: "",
          rewardType: "PoR",
          rewardAmount: "15",
          assignedTo: "0xABCD...EFGH",
          bidAmount: "75",
          status: "Ongoing",
          createdAt: Date.now() - 172800000,
          assignedAt: Date.now() - 86400000,
          completedAt: null,
          bidDeadline: 0,
          hasDispute: false,
          currentBid: null,
          creatorCreditScore: "120",
          takerStudentId: takerId,
          subject: "Engineering",
          categories: ["Software Development", "Testing"]
        }
      ] : [];

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
            value={takerId}
            onChange={(e) => setTakerId(e.target.value)}
            placeholder="Enter Taker's Student ID"
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

        {status === "unassigned" && (
          <div style={{
            marginTop: 12,
            padding: 12,
            background: "#FFF8DC",
            borderRadius: 6,
            fontSize: 12,
            color: "#856404"
          }}>
            ⚠️ Note: Unassigned tasks don't have takers. Only ongoing tasks can be searched by taker ID.
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
            {status === "unassigned" 
              ? "Unassigned tasks don't have takers. Try searching for ongoing tasks."
              : "Enter a taker's student ID and click Search to find tasks"}
          </div>
        </div>
      )}
    </div>
  );
}

