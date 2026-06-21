import React, { useState } from "react";

const Simulator = () => {
  const [distance, setDistance] = useState(10);

  // Simplified offline coefficients for the simulator UI
  const carCO2 = distance * 270.0;
  const evCO2 = distance * 100.0;
  const trainCO2 = distance * 40.0;

  const savedCarToEV = carCO2 - evCO2;
  const savedCarToTrain = carCO2 - trainCO2;

  const getPhoneCharges = (grams: number) => Math.floor(grams / 8.33);

  return (
    <div className="card">
      <h2 style={{ fontSize: "var(--font-2xl)", marginBottom: "16px" }}>What-If Simulator</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
        Move the slider to see how different transit choices impact your carbon footprint over a single trip.
      </p>

      <div style={{ marginBottom: "40px" }}>
        <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontWeight: "600" }}>
          <span>Trip Distance</span>
          <span style={{ color: "var(--accent-emerald)" }}>{distance} miles</span>
        </label>
        <input 
          type="range" 
          min="1" 
          max="100" 
          value={distance} 
          onChange={(e) => setDistance(Number(e.target.value))}
          style={{ width: "100%", cursor: "pointer", accentColor: "var(--accent-emerald)" }}
          aria-label="Trip distance in miles"
        />
      </div>

      <div className="grid-3">
        {/* Solo Petrol */}
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
          <h3 style={{ fontSize: "var(--font-lg)", marginBottom: "8px", color: "var(--accent-red)" }}>Solo Petrol</h3>
          <div style={{ fontSize: "var(--font-2xl)", fontWeight: "700", marginBottom: "12px" }}>
            {(carCO2 / 1000).toFixed(1)} kg
          </div>
          <p style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)" }}>
            Baseline emissions
          </p>
        </div>

        {/* EV / Rideshare */}
        <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
          <h3 style={{ fontSize: "var(--font-lg)", marginBottom: "8px", color: "var(--accent-blue)" }}>EV Rideshare</h3>
          <div style={{ fontSize: "var(--font-2xl)", fontWeight: "700", marginBottom: "12px" }}>
            {(evCO2 / 1000).toFixed(1)} kg
          </div>
          <p style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)" }}>
            Saves <strong>{(savedCarToEV / 1000).toFixed(1)} kg</strong>
            <br />
            = {getPhoneCharges(savedCarToEV)} phone charges
          </p>
        </div>

        {/* Train */}
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
          <h3 style={{ fontSize: "var(--font-lg)", marginBottom: "8px", color: "var(--accent-emerald)" }}>Train</h3>
          <div style={{ fontSize: "var(--font-2xl)", fontWeight: "700", marginBottom: "12px" }}>
            {(trainCO2 / 1000).toFixed(1)} kg
          </div>
          <p style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)" }}>
            Saves <strong>{(savedCarToTrain / 1000).toFixed(1)} kg</strong>
            <br />
            = {getPhoneCharges(savedCarToTrain)} phone charges
          </p>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
