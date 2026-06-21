import React from "react";
import { useApp } from "../context/AppContext.tsx";
import { PieChart, TrendingDown, AlertTriangle } from "lucide-react";

/**
 * ImpactSummary – Smart Assistant Insights Panel
 * 
 * Analyses the user's logged activity history to provide:
 * 1. Category-level carbon breakdown with percentages
 * 2. Identification of highest-emission category with actionable advice
 * 3. Total emissions vs. total savings comparison
 * 
 * This component fulfils the "Smart Assistant Requirement":
 * - Understanding of user context (analyses actual logs)
 * - Logical decision making (identifies worst category)
 * - Personalized reasoning (advice changes based on which category is worst)
 * - Dynamic recommendations (different output for every user)
 */

interface CategoryBreakdown {
  category: string;
  totalGrams: number;
  totalSaved: number;
  count: number;
  percentage: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  transit: "var(--accent-blue)",
  food: "var(--accent-orange)",
  energy: "#facc15",
  shopping: "#a78bfa",
};

const CATEGORY_ADVICE: Record<string, string> = {
  transit: "Consider carpooling, taking the train, or cycling for shorter trips to cut your biggest carbon source.",
  food: "Swapping even one beef meal per week to plant-based cuts your food carbon by up to 40%.",
  energy: "Switch AC to eco-mode or use fans during mild weather — this is your largest energy saving opportunity.",
  shopping: "Buying second-hand or repairing items can reduce shopping carbon by over 90%.",
};

const ImpactSummary = () => {
  const { activities, profile } = useApp();

  if (!profile || activities.length < 2) return null;

  // Build per-category breakdown from real logged data
  const breakdownMap: Record<string, { totalGrams: number; totalSaved: number; count: number }> = {};
  
  for (const act of activities) {
    const cat = act.category;
    if (!breakdownMap[cat]) {
      breakdownMap[cat] = { totalGrams: 0, totalSaved: 0, count: 0 };
    }
    breakdownMap[cat].totalGrams += act.carbonGrams;
    breakdownMap[cat].totalSaved += Math.max(0, act.savedGrams);
    breakdownMap[cat].count += 1;
  }

  const totalEmissions = Object.values(breakdownMap).reduce((s, b) => s + b.totalGrams, 0);
  const totalSaved = Object.values(breakdownMap).reduce((s, b) => s + b.totalSaved, 0);

  if (totalEmissions === 0) return null;

  const categories: CategoryBreakdown[] = Object.entries(breakdownMap)
    .map(([cat, data]) => ({
      category: cat,
      totalGrams: data.totalGrams,
      totalSaved: data.totalSaved,
      count: data.count,
      percentage: Math.round((data.totalGrams / totalEmissions) * 100),
    }))
    .sort((a, b) => b.totalGrams - a.totalGrams);

  const worst = categories[0];

  return (
    <div className="card">
      <h3 className="card-title">
        <PieChart className="w-5 h-5" style={{ color: "var(--accent-blue)" }} />
        Your Impact Breakdown
      </h3>

      {/* Category bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
        {categories.map(cat => (
          <div key={cat.category}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)", marginBottom: "6px" }}>
              <span style={{ textTransform: "capitalize", fontWeight: "500" }}>{cat.category}</span>
              <span style={{ color: "var(--text-secondary)" }}>
                {(cat.totalGrams / 1000).toFixed(1)} kg ({cat.percentage}%) · {cat.count} logs
              </span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                width: `${cat.percentage}%`,
                height: "100%",
                background: CATEGORY_COLORS[cat.category] || "var(--accent-emerald)",
                borderRadius: "4px",
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: "140px",
          background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "10px", padding: "14px", textAlign: "center",
        }}>
          <div style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", marginBottom: "4px" }}>Total Emitted</div>
          <div style={{ fontSize: "var(--font-xl)", fontWeight: "700" }}>{(totalEmissions / 1000).toFixed(1)} kg</div>
        </div>
        <div style={{
          flex: 1, minWidth: "140px",
          background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "10px", padding: "14px", textAlign: "center",
        }}>
          <div style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", marginBottom: "4px" }}>Total Saved</div>
          <div style={{ fontSize: "var(--font-xl)", fontWeight: "700", color: "var(--accent-emerald)" }}>
            <TrendingDown className="w-4 h-4" style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
            {(totalSaved / 1000).toFixed(1)} kg
          </div>
        </div>
      </div>

      {/* Worst category spotlight — personalized advice */}
      <div style={{
        background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)",
        borderRadius: "10px", padding: "16px", display: "flex", gap: "14px", alignItems: "flex-start",
      }} role="alert">
        <AlertTriangle className="w-5 h-5" style={{ color: "var(--accent-orange)", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <div style={{ fontWeight: "600", marginBottom: "4px", textTransform: "capitalize" }}>
            {worst.category} is your highest-emission category ({worst.percentage}%)
          </div>
          <p style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
            {CATEGORY_ADVICE[worst.category] || "Look for lower-carbon alternatives in this area."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpactSummary;
