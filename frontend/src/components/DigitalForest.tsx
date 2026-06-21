import React from "react";
import { useApp } from "../context/AppContext.tsx";
import { TreePine } from "lucide-react";

const DigitalForest = () => {
  const { profile, isLoading } = useApp();

  if (isLoading || !profile) return null;

  const treesGrown = Math.floor(profile.cumulativeSavedKg / 12.0);
  const progressToNext = (profile.cumulativeSavedKg % 12.0) / 12.0;

  // Generate an array of trees for visualization
  const trees = Array.from({ length: treesGrown }).map((_, i) => (
    <div key={i} style={{ animation: `slideUp 0.3s ease-out ${i * 0.1}s both` }}>
      <TreePine className="w-12 h-12" style={{ color: "var(--accent-emerald)" }} />
    </div>
  ));

  return (
    <div className="card" style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* Background glow if streak is 7+ */}
      {profile.streak.current >= 7 && (
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%", height: "100%",
          background: "radial-gradient(circle, rgba(250, 204, 21, 0.15) 0%, transparent 70%)",
          zIndex: 0,
          pointerEvents: "none"
        }} />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: "var(--font-2xl)", marginBottom: "8px" }}>Your Digital Forest</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          You have saved <strong>{profile.cumulativeSavedKg.toFixed(1)} kg</strong> of CO2e!
          {profile.streak.current > 0 && (
            <span style={{ color: "var(--accent-orange)", marginLeft: "8px" }}>
              🔥 {profile.streak.current} Day Streak!
            </span>
          )}
        </p>

        <div 
          style={{ 
            display: "flex", 
            justifyContent: "center", 
            gap: "8px", 
            flexWrap: "wrap",
            minHeight: "80px",
            marginBottom: "24px"
          }}
          aria-describedby="forest-title"
        >
          <span id="forest-title" className="sr-only" style={{ display: "none" }}>
            Visual representation of your saved carbon forest. Currently contains {treesGrown} fully grown trees.
          </span>
          
          {trees.length > 0 ? trees : (
            <div style={{ color: "var(--text-muted)", alignSelf: "center" }}>
              Your forest is empty. Log a low-carbon activity to plant your first seed!
            </div>
          )}
          
          {/* Sapling showing progress to next tree */}
          <div style={{ opacity: Math.max(0.3, progressToNext), transform: `scale(${0.5 + (progressToNext * 0.5)})` }}>
            <TreePine className="w-12 h-12" style={{ color: "var(--accent-emerald)" }} />
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)", color: "var(--text-secondary)", marginBottom: "8px" }}>
            <span>Next Tree Progress</span>
            <span>{Math.round(progressToNext * 100)}%</span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ 
              width: `${progressToNext * 100}%`, 
              height: "100%", 
              background: "var(--accent-emerald)",
              transition: "width 0.5s ease"
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalForest;
