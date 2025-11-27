import { useState } from "react";
import UnassignedTasks from "./UnassignedTasks";
import OngoingTasks from "./OngoingTasks";
import MyTasks from "./MyTasks";
import SearchTasks from "./SearchTasks";
import CreateTask from "./CreateTask";
import { stevensRed, stevensTextGrey } from "../../styles/constants";

export default function TaskList({ 
  wallet, 
  taskManagerContract, 
  studentManagementContract, 
  duckCoinContract, 
  nftContract 
}) {
  const [activeSubTab, setActiveSubTab] = useState("unassigned");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div>
      {/* Header with Create Task Button */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24
      }}>
        <h2 style={{
          margin: 0,
          color: stevensRed,
          fontSize: 24,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          📋 Task List
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: "12px 24px",
            border: "none",
            background: stevensRed,
            color: "white",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            borderRadius: 6,
            boxShadow: "0 2px 4px rgba(163, 38, 56, 0.3)",
            transition: "all 0.3s ease",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#8B1E2E";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 8px rgba(163, 38, 56, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = stevensRed;
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 4px rgba(163, 38, 56, 0.3)";
          }}
        >
          + Create Task
        </button>
      </div>

      {/* Subtabs */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        borderBottom: `2px solid ${stevensRed}`,
        paddingBottom: 0
      }}>
        {[
          { id: "unassigned", label: "Unassigned Tasks" },
          { id: "ongoing", label: "Ongoing Tasks" },
          { id: "myTasks", label: "My Tasks" },
          { id: "search", label: "Search Tasks" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "12px 24px",
              border: "none",
              background: activeSubTab === tab.id ? stevensRed : "transparent",
              color: activeSubTab === tab.id ? "white" : stevensRed,
              fontWeight: activeSubTab === tab.id ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: activeSubTab === tab.id ? `3px solid ${stevensRed}` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
              borderRadius: "6px 6px 0 0"
            }}
            onMouseEnter={(e) => {
              if (activeSubTab !== tab.id) {
                e.target.style.background = "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeSubTab !== tab.id) {
                e.target.style.background = "transparent";
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subtab Content */}
      <div>
        {activeSubTab === "unassigned" && (
          <UnassignedTasks 
            wallet={wallet}
            taskManagerContract={taskManagerContract}
            duckCoinContract={duckCoinContract}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeSubTab === "ongoing" && (
          <OngoingTasks 
            wallet={wallet}
            taskManagerContract={taskManagerContract}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeSubTab === "myTasks" && (
          <MyTasks 
            wallet={wallet}
            taskManagerContract={taskManagerContract}
            duckCoinContract={duckCoinContract}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeSubTab === "search" && (
          <SearchTasks
            wallet={wallet}
            taskManagerContract={taskManagerContract}
            duckCoinContract={duckCoinContract}
            studentManagementContract={studentManagementContract}
          />
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTask
          wallet={wallet}
          taskManagerContract={taskManagerContract}
          studentManagementContract={studentManagementContract}
          duckCoinContract={duckCoinContract}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}

