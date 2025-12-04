import { useState, useEffect } from "react";
import TaskCard from "./TaskCard";
import { cardStyle, stevensTextGrey } from "../../styles/constants";

// Mock data for demo
const MOCK_UNASSIGNED_TASKS = [
  {
    taskId: 1,
    creator: "0x1234...5678",
    description: "Develop a smart contract for decentralized voting system with gas optimization",
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
    taskId: 2,
    creator: "0x9876...5432",
    description: "Create frontend UI for task management system with React",
    fileHash: "",
    rewardType: "DuckCoin",
    rewardAmount: "200",
    assignedTo: null,
    bidAmount: "0",
    status: "Unassigned",
    createdAt: Date.now() - 3600000,
    assignedAt: null,
    completedAt: null,
    bidDeadline: 0,
    hasDispute: false,
    currentBid: null,
    creatorCreditScore: "75",
    subject: "Web Development",
    categories: ["UI/UX Design"]
  },
  {
    taskId: 3,
    creator: "0x1111...2222",
    description: "Write comprehensive documentation for the blockchain system",
    fileHash: "QmYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYy",
    rewardType: "SRPC",
    rewardAmount: "5",
    assignedTo: null,
    bidAmount: "25",
    status: "Unassigned",
    createdAt: Date.now() - 7200000,
    assignedAt: null,
    completedAt: null,
    bidDeadline: Date.now() + 43200000,
    hasDispute: false,
    currentBid: {
      bidder: "0x3333...4444",
      amount: "25",
      timestamp: Date.now() - 1800000
    },
    creatorCreditScore: "150",
    subject: "Documentation",
    categories: ["Writing", "Blockchain"]
  }
];

export default function UnassignedTasks({ 
  wallet, 
  taskManagerContract, 
  duckCoinContract,
  refreshTrigger 
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // TODO: Call contract method
        // const unassignedTasks = await taskManagerContract.getUnassignedTasks();
        // setTasks(unassignedTasks);

        // For demo, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setTasks(MOCK_UNASSIGNED_TASKS);
      } catch (error) {
        console.error("Error fetching unassigned tasks:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [taskManagerContract, refreshTrigger]);

  const handleAction = () => {
    // Refresh tasks after action
    const fetchTasks = async () => {
      try {
        // TODO: Call contract method
        // const unassignedTasks = await taskManagerContract.getUnassignedTasks();
        // setTasks(unassignedTasks);

        // For demo, just refresh mock data
        setTasks([...MOCK_UNASSIGNED_TASKS]);
      } catch (error) {
        console.error("Error refreshing tasks:", error);
      }
    };
    fetchTasks();
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          Loading unassigned tasks...
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          No unassigned tasks available.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        marginBottom: 16,
        padding: 12,
        background: "#E8F4F8",
        borderRadius: 6,
        fontSize: 12,
        color: "#1E40AF"
      }}>
        💡 <strong>Live Bidding:</strong> For SRPC tasks, you can place bids with SBC. 
        The highest bidder wins when the creator accepts. Each new bid resets the 24-hour acceptance deadline.
      </div>

      <div style={{
        display: "grid",
        gap: 20
      }}>
        {tasks.map(task => (
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
    </div>
  );
}

