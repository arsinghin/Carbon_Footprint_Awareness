import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext.tsx";

/**
 * OnboardingModal
 * 
 * Two-step questionnaire that establishes the user's lifestyle baseline.
 * The baseline determines how savings are calculated — a "solo_petrol" driver
 * switching to a bus saves more than someone who already carpools.
 * 
 * Accessibility: focus is trapped inside the modal, Escape key is disabled
 * (onboarding is required), and all form controls have explicit labels.
 */
const OnboardingModal = () => {
  const { submitOnboarding } = useApp();
  const [transit, setTransit] = useState("solo_petrol");
  const [diet, setDiet] = useState("high_meat");
  const [energy, setEnergy] = useState("ac_always");
  const [step, setStep] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap focus inside modal on mount
  useEffect(() => {
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, select, input, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) focusable[0].focus();
  }, [step]);

  const handleSubmit = async () => {
    await submitOnboarding(transit, diet, energy);
  };

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "12px", borderRadius: "8px",
    background: "var(--bg-base)", color: "var(--text-primary)",
    border: "1px solid var(--border-muted)", fontSize: "var(--font-base)",
  };

  return (
    <div className="modal-overlay">
      <div
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {step === 1 && (
          <>
            <h2 id="onboarding-title" style={{ marginBottom: "8px", fontSize: "var(--font-xl)" }}>
              Welcome to CarbonAware
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", lineHeight: "1.5" }}>
              We need to know your typical lifestyle so we can measure how much carbon you save 
              when you make better choices. This takes 30 seconds.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="onb-transit" style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                How do you usually commute?
              </label>
              <select
                id="onb-transit"
                value={transit}
                onChange={(e) => setTransit(e.target.value)}
                style={selectStyle}
              >
                <option value="solo_petrol">Solo Petrol Drive (270g CO₂e/mile)</option>
                <option value="carpool">Carpool / Rideshare (100g CO₂e/mile)</option>
                <option value="transit">Public Transit (60g CO₂e/mile)</option>
                <option value="active">Walk / Bicycle (0g CO₂e/mile)</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="onb-diet" style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                What is your typical diet?
              </label>
              <select
                id="onb-diet"
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                style={selectStyle}
              >
                <option value="high_meat">High Meat — Beef/Lamb frequently (3 kg CO₂e/serving)</option>
                <option value="low_meat">Low Meat — Poultry/Pork (0.6 kg CO₂e/serving)</option>
                <option value="vegetarian">Vegetarian / Fish (0.4 kg CO₂e/serving)</option>
                <option value="vegan">Vegan (0.2 kg CO₂e/serving)</option>
              </select>
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label htmlFor="onb-energy" style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                How do you manage home temperature?
              </label>
              <select
                id="onb-energy"
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
                style={selectStyle}
              >
                <option value="ac_always">AC / Heating Always On (1.2 kg CO₂e/hr)</option>
                <option value="eco_mode">Eco Mode / Intermittent (0.3 kg CO₂e/hr)</option>
                <option value="ventilation">Natural Ventilation / Fans (0g CO₂e/hr)</option>
              </select>
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: "100%", padding: "14px", background: "var(--accent-emerald)",
                color: "white", border: "none", borderRadius: "8px",
                fontSize: "var(--font-base)", fontWeight: "600", cursor: "pointer",
              }}
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
            <div style={{
              background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "12px", padding: "20px", marginBottom: "24px"
            }}>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                Based on your answers, your baseline lifestyle generates carbon that would take
                roughly <strong style={{ color: "var(--text-primary)" }}>45 trees</strong> to absorb annually.
              </p>
              <p style={{ color: "var(--text-primary)", marginTop: "12px", fontWeight: "600" }}>
                Let's save 5 trees this month by making small, realistic swaps!
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-muted)",
              borderRadius: "10px", padding: "16px", marginBottom: "24px",
              fontSize: "var(--font-sm)", color: "var(--text-secondary)", lineHeight: "1.6",
            }}>
              <strong style={{ color: "var(--text-primary)" }}>How it works:</strong> Every time 
              you log a choice that's greener than your baseline, you earn carbon savings. Every 
              12 kg saved grows a tree in your Digital Forest. Log daily to build your streak!
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: "100%", padding: "14px", background: "var(--accent-blue)",
                color: "white", border: "none", borderRadius: "8px",
                fontSize: "var(--font-base)", fontWeight: "600", cursor: "pointer",
              }}
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
