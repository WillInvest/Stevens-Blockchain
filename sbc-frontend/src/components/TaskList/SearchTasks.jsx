import { useState } from "react";
import SearchByTaskId from "./SearchByTaskId";
import SearchByCreatorId from "./SearchByCreatorId";
import SearchByTakerId from "./SearchByTakerId";
import SearchByCategories from "./SearchByCategories";
import { stevensRed } from "../../styles/constants";

export default function SearchTasks({
  wallet,
  taskManagerContract,
  duckCoinContract,
  studentManagementContract
}) {
  const [activeSearchType, setActiveSearchType] = useState("taskId");
  const [activeStatusTab, setActiveStatusTab] = useState("unassigned");

  const searchTypes = [
    { id: "taskId", label: "By Task ID" },
    { id: "creatorId", label: "By Creator's ID" },
    { id: "takerId", label: "By Taker's ID" },
    { id: "categories", label: "By Categories" }
  ];

  return (
    <div>
      {/* Search Type Subtabs */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
        borderBottom: `2px solid ${stevensRed}`,
        paddingBottom: 0
      }}>
        {searchTypes.map(type => (
          <button
            key={type.id}
            onClick={() => {
              setActiveSearchType(type.id);
              setActiveStatusTab("unassigned"); // Reset status tab when changing search type
            }}
            style={{
              padding: "10px 20px",
              border: "none",
              background: activeSearchType === type.id ? stevensRed : "transparent",
              color: activeSearchType === type.id ? "white" : stevensRed,
              fontWeight: activeSearchType === type.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: activeSearchType === type.id ? `3px solid ${stevensRed}` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
              borderRadius: "6px 6px 0 0"
            }}
            onMouseEnter={(e) => {
              if (activeSearchType !== type.id) {
                e.target.style.background = "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeSearchType !== type.id) {
                e.target.style.background = "transparent";
              }
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Status Subtabs (Unassigned/Ongoing) */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 20,
        borderBottom: `1px solid #e0e0e0`,
        paddingBottom: 0
      }}>
        {[
          { id: "unassigned", label: "Unassigned" },
          { id: "ongoing", label: "Ongoing" }
        ].map(status => (
          <button
            key={status.id}
            onClick={() => setActiveStatusTab(status.id)}
            style={{
              padding: "8px 16px",
              border: "none",
              background: activeStatusTab === status.id ? "#E8F4F8" : "transparent",
              color: activeStatusTab === status.id ? stevensRed : "#666",
              fontWeight: activeStatusTab === status.id ? 600 : 500,
              fontSize: 12,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: activeStatusTab === status.id ? `2px solid ${stevensRed}` : "2px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (activeStatusTab !== status.id) {
                e.target.style.background = "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (activeStatusTab !== status.id) {
                e.target.style.background = "transparent";
              }
            }}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Search Content */}
      <div>
        {activeSearchType === "taskId" && (
          <SearchByTaskId
            wallet={wallet}
            taskManagerContract={taskManagerContract}
            duckCoinContract={duckCoinContract}
            status={activeStatusTab}
          />
        )}
        {activeSearchType === "creatorId" && (
          <SearchByCreatorId
            wallet={wallet}
            taskManagerContract={taskManagerContract}
            duckCoinContract={duckCoinContract}
            studentManagementContract={studentManagementContract}
            status={activeStatusTab}
          />
        )}
        {activeSearchType === "takerId" && (
          <SearchByTakerId
            wallet={wallet}
            taskManagerContract={taskManagerContract}
            duckCoinContract={duckCoinContract}
            studentManagementContract={studentManagementContract}
            status={activeStatusTab}
          />
        )}
        {activeSearchType === "categories" && (
          <SearchByCategories
            wallet={wallet}
            taskManagerContract={taskManagerContract}
            duckCoinContract={duckCoinContract}
            status={activeStatusTab}
          />
        )}
      </div>
    </div>
  );
}


