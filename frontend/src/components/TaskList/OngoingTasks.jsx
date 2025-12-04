import { useState, useEffect } from "react";
import TaskCard from "./TaskCard";
import { cardStyle, stevensTextGrey } from "../../styles/constants";

// Mock data for demo
const MOCK_ONGOING_TASKS = [
  {
    taskId: 4,
    creator: "0xIvanBakrac...6666",
    creatorName: "Ivan Bakrac",
    description: "Implement automated testing suite for smart contracts",
    fileHash: "QmZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZz",
    rewardType: "SRPC",
    rewardAmount: "10",
    assignedTo: "0x7777...8888",
    bidAmount: "75",
    status: "Ongoing",
    createdAt: Date.now() - 172800000,
    assignedAt: Date.now() - 86400000,
    completedAt: null,
    bidDeadline: 0,
    hasDispute: false,
    currentBid: null,
    creatorCreditScore: "120",
    takerStudentId: "20027138",
    subject: "Software Development",
    categories: ["Testing", "Quality Assurance"]
  },
  {
    taskId: 5,
    creator: "0xShaheerSidd...AAAA",
    creatorName: "Shaheer Sidd",
    description: "Design and implement user authentication system",
    fileHash: "",
    rewardType: "DuckCoin",
    rewardAmount: "50",
    assignedTo: "0xBBBB...CCCC",
    bidAmount: "0",
    status: "Ongoing",
    createdAt: Date.now() - 259200000,
    assignedAt: Date.now() - 172800000,
    completedAt: null,
    bidDeadline: 0,
    hasDispute: false,
    currentBid: null,
    creatorCreditScore: "90",
    takerStudentId: "20012345",
    subject: "Cybersecurity",
    categories: ["Web Development"]
  }
];

export default function OngoingTasks({ 
  wallet, 
  taskManagerContract,
  refreshTrigger 
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // TODO: Call contract method
        // const ongoingTasks = await taskManagerContract.getOngoingTasks();
        // setTasks(ongoingTasks);

        // For demo, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setTasks(MOCK_ONGOING_TASKS);
      } catch (error) {
        console.error("Error fetching ongoing tasks:", error);
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
        // const ongoingTasks = await taskManagerContract.getOngoingTasks();
        // setTasks(ongoingTasks);

        // For demo, just refresh mock data
        setTasks([...MOCK_ONGOING_TASKS]);
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
          Loading ongoing tasks...
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: 40, color: stevensTextGrey }}>
          No ongoing tasks at the moment.
        </div>
      </div>
    );
  }

  return (
    <div>
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
            duckCoinContract={null}
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  );
}

