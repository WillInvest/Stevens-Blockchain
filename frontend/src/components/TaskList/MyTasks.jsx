import { useState, useEffect } from "react";
import TaskCard from "./TaskCard";
import { cardStyle, stevensTextGrey } from "../../styles/constants";

// Mock data for demo
const MOCK_MY_TASKS = [
  {
    taskId: 1,
    creator: "0x1234...5678", // User's address (as creator)
    description: "Develop a smart contract for decentralized voting system",
    fileHash: "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
    rewardType: "SRPC",
    rewardAmount: "10",
    assignedTo: null,
    bidAmount: "50",
    status: "Unassigned",
    createdAt: Date.now() - 86400000,
    assignedAt: null,
    completedAt: null,
    bidDeadline: Date.now() + 86400000,
    hasDispute: false,
    currentBid: {
      bidder: "0xABCD...EFGH",
      amount: "50",
      timestamp: Date.now() - 3600000
    },
    creatorCreditScore: "100",
    subject: "Computer Science",
    categories: ["Software Development", "Blockchain"]
  },
  {
    taskId: 4,
    creator: "0x5555...6666",
    description: "Implement automated testing suite for smart contracts",
    fileHash: "QmZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZz",
    rewardType: "SRPC",
    rewardAmount: "15",
    assignedTo: "0x1234...5678", // User's address (as assigned taker)
    bidAmount: "75",
    status: "Ongoing",
    createdAt: Date.now() - 172800000,
    assignedAt: Date.now() - 86400000,
    completedAt: null,
    bidDeadline: 0,
    hasDispute: false,
    currentBid: null,
    creatorCreditScore: "120",
    takerStudentId: "12345",
    subject: "Software Development",
    categories: ["Testing", "Quality Assurance"]
  },
  {
    taskId: 6,
    creator: "0x1234...5678", // User's address (as creator)
    description: "Complete frontend integration with backend API",
    fileHash: "",
    rewardType: "DuckCoin",
    rewardAmount: "100",
    assignedTo: "0xDDDD...EEEE",
    bidAmount: "0",
    status: "Ongoing",
    createdAt: Date.now() - 345600000,
    assignedAt: Date.now() - 259200000,
    completedAt: null,
    bidDeadline: 0,
    hasDispute: false,
    currentBid: null,
    creatorCreditScore: "100",
    takerStudentId: "67890",
    subject: "Web Development",
    categories: ["Software Development"]
  }
];

export default function MyTasks({ 
  wallet, 
  taskManagerContract, 
  duckCoinContract,
  refreshTrigger 
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("created"); // created, assigned

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // TODO: Call contract methods
        // const createdTasks = await taskManagerContract.getCreatorTasks(wallet);
        // const assignedTasks = await taskManagerContract.getTakerTasks(wallet);
        // const allTasks = [...createdTasks, ...assignedTasks];
        // setTasks(allTasks);

        // For demo, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setTasks(MOCK_MY_TASKS);
      } catch (error) {
        console.error("Error fetching my tasks:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    if (wallet) {
      fetchTasks();
    }
  }, [wallet, taskManagerContract, refreshTrigger]);

  const handleAction = () => {
    // Refresh tasks after action
    const fetchTasks = async () => {
      try {
        // TODO: Call contract methods
        // const createdTasks = await taskManagerContract.getCreatorTasks(wallet);
        // const assignedTasks = await taskManagerContract.getTakerTasks(wallet);
        // const allTasks = [...createdTasks, ...assignedTasks];
        // setTasks(allTasks);

        // For demo, just refresh mock data
        setTasks([...MOCK_MY_TASKS]);
      } catch (error) {
        console.error("Error refreshing tasks:", error);
      }
    };
    if (wallet) {
      fetchTasks();
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "created") {
      return task.creator?.toLowerCase() === wallet?.toLowerCase();
    }
    if (filter === "assigned") {
      return task.assignedTo?.toLowerCase() === wallet?.toLowerCase();
    }
    return true;
  });

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          Loading your tasks...
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          Please connect your wallet to view your tasks.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Buttons */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 20
      }}>
        {[
          { id: "created", label: "Created by Me" },
          { id: "assigned", label: "Assigned to Me" }
        ].map(option => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            style={{
              padding: "8px 16px",
              border: "none",
              background: filter === option.id ? "#A32638" : "#E5E7EB",
              color: filter === option.id ? "white" : "#374151",
              fontWeight: filter === option.id ? 600 : 500,
              fontSize: 12,
              cursor: "pointer",
              borderRadius: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              transition: "all 0.2s ease"
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
            {filter === "created"
              ? "You haven't created any tasks yet."
              : "You don't have any assigned tasks."}
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gap: 20
        }}>
          {filteredTasks.map(task => (
            <TaskCard
              key={task.taskId}
              task={task}
              wallet={wallet}
              taskManagerContract={taskManagerContract}
              duckCoinContract={duckCoinContract}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

