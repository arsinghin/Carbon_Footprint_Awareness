import React, { useState } from "react";
import { useApp } from "../context/AppContext.tsx";

const OnboardingModal = () => {
  const { submitOnboarding } = useApp();
  const [transit, setTransit] = useState("solo_petrol");
  const [diet, setDiet] = useState("high_meat");
  const [energy, setEnergy] = useState("ac_always");
  const [step, setStep] = useState(1);

  const handleSubmit = async () => {
    await submitOnboarding(transit, diet, energy);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-labelledby="onboarding-title">
        {step === 1 && (
          <>
            <h2 id="onboarding-title" style={{ marginBottom: "16px", fontSize: "var(--font-xl)" }}>
              Welcome to CarbonAware
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
              Let's establish your baseline so we can accurately measure your positive impact.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>How do you usually commute?</label>
              <select 
                value={transit} 
                onChange={(e) => setTransit(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg-base)", color: "var(--text-primary)", border: "1px solid var(--border-muted)" }}
                aria-label="Select usual commute method"
              >
                <option value="solo_petrol">Solo Petrol Drive</option>
                <option value="carpool">Carpool / Rideshare</option>
                <option value="transit">Public Transit</option>
                <option value="active">Walk / Bike</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>What is your typical diet?</label>
              <select 
                value={diet} 
                onChange={(e) => setDiet(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg-base)", color: "var(--text-primary)", border: "1px solid var(--border-muted)" }}
                aria-label="Select typical diet"
              >
                <option value="high_meat">High Meat (Beef/Lamb frequently)</option>
                <option value="low_meat">Low Meat (Poultry/Pork)</option>
                <option value="vegetarian">Vegetarian / Fish</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>How do you manage home temperature?</label>
              <select 
                value={energy} 
                onChange={(e) => setEnergy(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg-base)", color: "var(--text-primary)", border: "1px solid var(--border-muted)" }}
                aria-label="Select home temperature management"
              >
                <option value="ac_always">AC / Heating Always On</option>
                <option value="eco_mode">Eco Mode / Intermittent</option>
                <option value="ventilation">Natural Ventilation / Fans</option>
              </select>
            </div>

            <button 
              onClick={() => setStep(2)}
              style={{ width: "100%", padding: "14px", background: "var(--accent-emerald)", color: "white", border: "none", borderRadius: "8px", fontSize: "var(--font-base)", fontWeight: "600", cursor: "pointer" }}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 id="onboarding-title" style={{ marginBottom: "16px", fontSize: "var(--font-xl)" }}>
              Your Starting Baseline
            </h2>
            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                Based on your answers, your baseline lifestyle generates carbon that would take roughly <strong>45 trees</strong> to absorb annually.
              </p>
              <p style={{ color: "var(--text-primary)", marginTop: "12px", fontWeight: "600" }}>
                Let's try to save 5 trees this month together by making small, realistic swaps!
              </p>
            </div>
            
            <button 
              onClick={handleSubmit}
              style={{ width: "100%", padding: "14px", background: "var(--accent-blue)", color: "white", border: "none", borderRadius: "8px", fontSize: "var(--font-base)", fontWeight: "600", cursor: "pointer" }}
            >
              Start My Digital Forest
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;
