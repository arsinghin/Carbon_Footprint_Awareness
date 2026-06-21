import React from "react";
import { useApp } from "../context/AppContext.tsx";
import { ArrowLeft } from "lucide-react";

const HistoryList = () => {
  const { activities, undoLastActivity } = useApp();

  const handleUndo = async () => {
    if (window.confirm("Are you sure you want to undo the last logged activity?")) {
      await undoLastActivity();
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "var(--font-2xl)" }}>My Activity Logs</h2>
        {activities.length > 0 && (
          <button 
            onClick={handleUndo}
            style={{ 
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-muted)",
              padding: "8px 12px", borderRadius: "6px", color: "var(--text-primary)", cursor: "pointer"
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Undo Last
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
          You haven't logged any activities yet.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }} aria-label="Carbon activity log">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-muted)", color: "var(--text-secondary)" }}>
                <th scope="col" style={{ padding: "12px 8px" }}>Date</th>
                <th scope="col" style={{ padding: "12px 8px" }}>Category</th>
                <th scope="col" style={{ padding: "12px 8px" }}>Choice</th>
                <th scope="col" style={{ padding: "12px 8px" }}>Saved (g CO2e)</th>
                <th scope="col" style={{ padding: "12px 8px" }}>Equivalence</th>
              </tr>
            </thead>
            <tbody>
              {activities.map(act => (
                <tr key={act.activityId} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "16px 8px", color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
                    {new Date(act.timestamp).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "16px 8px", textTransform: "capitalize" }}>
                    {act.category}
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    {act.selectedChoice.replace("_", " ")}
                  </td>
                  <td style={{ padding: "16px 8px", color: act.savedGrams > 0 ? "var(--accent-emerald)" : "var(--text-primary)", fontWeight: "600" }}>
                    {act.savedGrams > 0 ? "+" : ""}{act.savedGrams}g
                  </td>
                  <td style={{ padding: "16px 8px", fontSize: "var(--font-sm)", color: "var(--text-secondary)" }}>
                    {act.contextEquivalence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryList;
