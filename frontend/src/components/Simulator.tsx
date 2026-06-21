import React, { useState } from "react";
import { useApp } from "../context/AppContext.tsx";
import { Sliders } from "lucide-react";

/**
 * What-If Simulator
 * Interactive decision-support tool that helps users compare the carbon impact
 * of different choices across ALL four categories (transit, food, energy, shopping).
 * Uses the user's personal baseline to calculate savings — not a generic default.
 */

// Emission coefficients (mirrored from backend logic.py for offline use)
const FACTORS: Record<string, Record<string, { label: string; grams: number }>> = {
  transit: {
    solo_petrol: { label: "Solo Petrol Car", grams: 270.0 },
    ev_rideshare: { label: "EV / Rideshare", grams: 100.0 },
    bus:          { label: "Public Bus", grams: 60.0 },
    train:        { label: "Train / Metro", grams: 40.0 },
    active:       { label: "Walk / Bicycle", grams: 0.0 },
  },
  food: {
    beef_lamb:       { label: "Beef / Lamb", grams: 3000.0 },
    pork_poultry:    { label: "Pork / Poultry", grams: 600.0 },
    vegetarian_fish: { label: "Vegetarian / Fish", grams: 400.0 },
    vegan:           { label: "Vegan Meal", grams: 200.0 },
  },
  energy: {
    ac_standard: { label: "Standard AC", grams: 1200.0 },
    ac_eco:      { label: "Eco-mode AC", grams: 300.0 },
    fan_only:    { label: "Fans Only", grams: 40.0 },
    ventilation: { label: "Natural Ventilation", grams: 0.0 },
  },
  shopping: {
    fast_fashion:     { label: "Fast Fashion Item", grams: 15000.0 },
    electronics_small:{ label: "Small Electronics", grams: 30000.0 },
    groceries_typical:{ label: "Typical Groceries", grams: 1500.0 },
    second_hand:      { label: "Second-hand Item", grams: 500.0 },
  },
};

const UNITS: Record<string, string> = {
  transit: "miles",
  food: "servings",
  energy: "hours",
  shopping: "items",
};

const BASELINE_MAP: Record<string, Record<string, string>> = {
  transit: { solo_petrol: "solo_petrol", carpool: "ev_rideshare", transit: "bus", active: "active" },
  diet:    { high_meat: "beef_lamb", low_meat: "pork_poultry", vegetarian: "vegetarian_fish", vegan: "vegan" },
  energy:  { ac_always: "ac_standard", eco_mode: "ac_eco", ventilation: "ventilation" },
};

const Simulator = () => {
  const { profile } = useApp();
  const [category, setCategory] = useState<string>("transit");
  const [amount, setAmount] = useState(10);

  const choices = FACTORS[category];
  const unit = UNITS[category];

  // Determine user's personal baseline choice for this category
  let baselineKey = "";
  if (category === "transit") {
    const pref = profile?.baseline?.transit || "solo_petrol";
    baselineKey = BASELINE_MAP.transit[pref] || "solo_petrol";
  } else if (category === "food") {
    const pref = profile?.baseline?.diet || "high_meat";
    baselineKey = BASELINE_MAP.diet[pref] || "beef_lamb";
  } else if (category === "energy") {
    const pref = profile?.baseline?.energy || "ac_always";
    baselineKey = BASELINE_MAP.energy[pref] || "ac_standard";
  } else if (category === "shopping") {
    baselineKey = "fast_fashion"; // most common comparison
  }

  const baselineGrams = choices[baselineKey]?.grams ?? 0;
  const baselineLabel = choices[baselineKey]?.label ?? "Your Baseline";

  const getPhoneCharges = (g: number) => Math.floor(g / 8.33);
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "transit": return "var(--accent-blue)";
      case "food": return "var(--accent-orange)";
      case "energy": return "#facc15";
      case "shopping": return "#a78bfa";
      default: return "var(--accent-emerald)";
    }
  };

  const maxSlider = category === "transit" ? 100 : category === "food" ? 10 : category === "energy" ? 24 : 10;
  const minSlider = category === "food" || category === "shopping" ? 1 : 1;

  return (
    <div className="card">
      <h2 style={{ fontSize: "var(--font-2xl)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
        <Sliders className="w-6 h-6" style={{ color: "var(--accent-emerald)" }} />
        What-If Simulator
      </h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "24px", lineHeight: "1.5" }}>
        Compare alternatives side-by-side. Select a category, adjust the amount, and instantly see 
        how each choice stacks up against <strong style={{ color: "var(--text-primary)" }}>your personal baseline</strong>.
      </p>

      {/* Category selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
        {Object.keys(FACTORS).map(cat => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setAmount(cat === "food" || cat === "shopping" ? 1 : 10); }}
            aria-pressed={category === cat}
            style={{
              padding: "8px 16px", borderRadius: "8px", border: "1px solid",
              borderColor: category === cat ? getCategoryColor(cat) : "var(--border-muted)",
              background: category === cat ? `${getCategoryColor(cat)}22` : "transparent",
              color: category === cat ? getCategoryColor(cat) : "var(--text-secondary)",
              cursor: "pointer", fontWeight: category === cat ? "600" : "400",
              textTransform: "capitalize", transition: "all 0.2s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Amount slider */}
      <div style={{ marginBottom: "32px" }}>
        <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontWeight: "600" }}>
          <span>Amount ({unit})</span>
          <span style={{ color: getCategoryColor(category) }}>{amount} {unit}</span>
        </label>
        <input
          type="range" min={minSlider} max={maxSlider} value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          style={{ width: "100%", cursor: "pointer", accentColor: getCategoryColor(category) }}
          aria-label={`Amount in ${unit}`}
          aria-valuemin={minSlider} aria-valuemax={maxSlider} aria-valuenow={amount}
        />
      </div>

      {/* Baseline reference label */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-muted)",
        borderRadius: "8px", padding: "12px 16px", marginBottom: "24px",
        fontSize: "var(--font-sm)", color: "var(--text-secondary)"
      }}>
        Your baseline: <strong style={{ color: "var(--text-primary)" }}>{baselineLabel}</strong> at{" "}
        <strong>{(baselineGrams * amount / 1000).toFixed(1)} kg CO₂e</strong> for {amount} {unit}
      </div>

      {/* Comparison cards */}
      <div className="grid-2" style={{ gap: "16px" }}>
        {Object.entries(choices).map(([key, choice]) => {
          const totalGrams = choice.grams * amount;
          const saved = baselineGrams * amount - totalGrams;
          const isBaseline = key === baselineKey;
          const isBetter = saved > 0;
          const isWorse = saved < 0;

          return (
            <div
              key={key}
              style={{
                background: isBaseline ? "rgba(255,255,255,0.04)" : isBetter ? "rgba(16, 185, 129, 0.08)" : isWorse ? "rgba(239, 68, 68, 0.06)" : "transparent",
                border: `1px solid ${isBaseline ? "var(--border-muted)" : isBetter ? "rgba(16, 185, 129, 0.3)" : isWorse ? "rgba(239, 68, 68, 0.2)" : "var(--border-muted)"}`,
                borderRadius: "12px", padding: "16px", position: "relative",
              }}
            >
              {isBaseline && (
                <span style={{
                  position: "absolute", top: "8px", right: "12px",
                  fontSize: "0.7rem", background: "var(--accent-emerald-light)",
                  color: "var(--accent-emerald)", padding: "2px 8px", borderRadius: "4px",
                  fontWeight: "600",
                }}>
                  YOUR BASELINE
                </span>
              )}
              <h4 style={{ fontSize: "var(--font-base)", fontWeight: "600", marginBottom: "6px" }}>
                {choice.label}
              </h4>
              <div style={{ fontSize: "var(--font-2xl)", fontWeight: "700", marginBottom: "8px" }}>
                {(totalGrams / 1000).toFixed(1)} <span style={{ fontSize: "var(--font-sm)", fontWeight: "400" }}>kg CO₂e</span>
              </div>
              {!isBaseline && (
                <p style={{ fontSize: "var(--font-sm)", color: isBetter ? "var(--accent-emerald)" : isWorse ? "var(--accent-red)" : "var(--text-secondary)" }}>
                  {isBetter ? "Saves" : "Adds"}{" "}
                  <strong>{Math.abs(saved / 1000).toFixed(1)} kg</strong>
                  {isBetter && saved >= 100 && (
                    <span style={{ color: "var(--text-secondary)" }}>
                      {" "}≈ {getPhoneCharges(saved)} phone charges
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Simulator;
