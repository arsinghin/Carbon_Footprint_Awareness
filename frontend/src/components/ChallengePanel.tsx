import { useApp } from "../context/AppContext.tsx";
import { Award, CheckCircle } from "lucide-react";

const ChallengePanel = () => {
  const { profile } = useApp();

  if (!profile || !profile.weeklyChallenge || !profile.weeklyChallenge.challengeId) {
    return null;
  }

  const { challengeId, targetSwaps, completedSwaps } = profile.weeklyChallenge;
  const isCompleted = completedSwaps >= targetSwaps;
  const progressPercent = Math.min(100, (completedSwaps / targetSwaps) * 100);

  return (
    <div className="card">
      <h3 className="card-title">
        <Award className="w-5 h-5 text-yellow-400" style={{ color: "#facc15" }} />
        Active Weekly Challenge
      </h3>

      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px" }}>
        <div style={{
          background: isCompleted ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
          padding: "12px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <CheckCircle className={`w-6 h-6 ${isCompleted ? "text-emerald-500" : "text-blue-500"}`} style={{ color: isCompleted ? "var(--accent-emerald)" : "var(--accent-blue)" }} />
        </div>
        <div>
          <h4 style={{ fontSize: "var(--font-base)", fontWeight: "600", textTransform: "capitalize" }}>
            {challengeId.replace("_", " ")}
          </h4>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
            {isCompleted ? "Challenge Completed! Great job." : `Complete ${targetSwaps} low-carbon transit commutes this week.`}
          </p>
        </div>
      </div>

      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)", color: "var(--text-secondary)", marginBottom: "8px" }}>
          <span>Swaps completed</span>
          <span>{completedSwaps} / {targetSwaps}</span>
        </div>
        <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: isCompleted ? "var(--accent-emerald)" : "var(--accent-blue)",
            transition: "width 0.5s ease"
          }} />
        </div>
      </div>
    </div>
  );
};

export default ChallengePanel;
