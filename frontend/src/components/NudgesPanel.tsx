import React from "react";
import { useApp } from "../context/AppContext.tsx";
import { Lightbulb, Navigation, Utensils, Zap } from "lucide-react";

const NudgesPanel = () => {
  const { nudges } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case "transit": return <Navigation className="w-5 h-5 text-blue-400" style={{ color: "var(--accent-blue)" }} />;
      case "diet": return <Utensils className="w-5 h-5 text-orange-400" style={{ color: "var(--accent-orange)" }} />;
      case "energy": return <Zap className="w-5 h-5 text-yellow-400" style={{ color: "#facc15" }} />;
      default: return <Lightbulb className="w-5 h-5 text-emerald-400" style={{ color: "var(--accent-emerald)" }} />;
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">
        <Lightbulb className="w-5 h-5 text-yellow-400" style={{ color: "#facc15" }} />
        Smart Assistant Insights
      </h3>
      
      {nudges.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)" }}>
          Log more activities to receive personalized insights and recommendations.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {nudges.map((nudge, i) => (
            <div 
              key={i}
              style={{ 
                background: "rgba(255, 255, 255, 0.03)", 
                border: "1px solid var(--border-muted)",
                borderRadius: "12px", 
                padding: "16px",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start"
              }}
            >
              <div style={{ 
                background: "rgba(255, 255, 255, 0.05)", 
                padding: "10px", 
                borderRadius: "50%" 
              }}>
                {getIcon(nudge.type)}
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)", lineHeight: "1.5", margin: 0 }}>
                {nudge.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NudgesPanel;
