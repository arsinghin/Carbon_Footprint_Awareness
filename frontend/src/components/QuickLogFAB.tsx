import React, { useState } from "react";
import { useApp } from "../context/AppContext.tsx";
import { Plus, X, Navigation, Utensils, Zap, ShoppingBag } from "lucide-react";

const QuickLogFAB = () => {
  const { logActivity } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [choice, setChoice] = useState("");
  const [amount, setAmount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setCategory(null);
    setChoice("");
    setAmount(1);
  };

  const handleSubmit = async () => {
    if (!category || !choice || amount <= 0) return;
    setIsSubmitting(true);
    const success = await logActivity(category, choice, amount);
    setIsSubmitting(false);
    if (success) setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleOpen}
        style={{
          position: "fixed", bottom: "32px", right: "32px",
          width: "64px", height: "64px", borderRadius: "32px",
          background: "var(--accent-emerald)", color: "white",
          border: "none", boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
          display: "flex", justifyContent: "center", alignItems: "center",
          cursor: "pointer", zIndex: 90
        }}
        aria-label="Quick log activity"
        aria-expanded={isOpen}
      >
        <Plus className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" role="dialog" aria-labelledby="log-title">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 id="log-title" style={{ fontSize: "var(--font-xl)" }}>
                {category ? `Log ${category.charAt(0).toUpperCase() + category.slice(1)}` : "Log Activity"}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!category ? (
              <div className="grid-2">
                <button onClick={() => { setCategory("transit"); setChoice("bus"); }} style={btnStyle} aria-label="Log transit activity">
                  <Navigation className="w-6 h-6 text-blue-400" /> Transit
                </button>
                <button onClick={() => { setCategory("food"); setChoice("vegan"); }} style={btnStyle} aria-label="Log food activity">
                  <Utensils className="w-6 h-6 text-orange-400" /> Food
                </button>
                <button onClick={() => { setCategory("energy"); setChoice("ac_eco"); }} style={btnStyle} aria-label="Log energy activity">
                  <Zap className="w-6 h-6 text-yellow-400" /> Energy
                </button>
                <button onClick={() => { setCategory("shopping"); setChoice("second_hand"); }} style={btnStyle} aria-label="Log shopping activity">
                  <ShoppingBag className="w-6 h-6 text-purple-400" /> Shopping
                </button>
              </div>
            ) : (
              <div>
                {/* Dynamic inputs based on category */}
                {category === "transit" && (
                  <>
                    <label style={{ display: "block", marginBottom: "8px" }}>Mode of Transit</label>
                    <select value={choice} onChange={e => setChoice(e.target.value)} style={selectStyle}>
                      <option value="solo_petrol">Solo Petrol Car</option>
                      <option value="ev_rideshare">EV / Rideshare</option>
                      <option value="bus">Bus</option>
                      <option value="train">Train</option>
                      <option value="active">Walk / Bike</option>
                    </select>
                    <label style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Distance (miles)</label>
                    <input type="number" min="0.1" step="0.1" value={amount} onChange={e => setAmount(Number(e.target.value))} style={selectStyle} />
                  </>
                )}
                
                {category === "food" && (
                  <>
                    <label style={{ display: "block", marginBottom: "8px" }}>Meal Type</label>
                    <select value={choice} onChange={e => setChoice(e.target.value)} style={selectStyle}>
                      <option value="beef_lamb">Beef / Lamb</option>
                      <option value="pork_poultry">Pork / Poultry</option>
                      <option value="vegetarian_fish">Vegetarian / Fish</option>
                      <option value="vegan">Vegan</option>
                    </select>
                    <label style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Servings</label>
                    <input type="number" min="1" step="1" value={amount} onChange={e => setAmount(Number(e.target.value))} style={selectStyle} />
                  </>
                )}

                {category === "energy" && (
                  <>
                    <label style={{ display: "block", marginBottom: "8px" }}>Energy Type</label>
                    <select value={choice} onChange={e => setChoice(e.target.value)} style={selectStyle}>
                      <option value="ac_standard">Standard AC</option>
                      <option value="ac_eco">Eco AC</option>
                      <option value="fan_only">Fans Only</option>
                      <option value="ventilation">Natural Ventilation</option>
                    </select>
                    <label style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Hours Used</label>
                    <input type="number" min="0.1" step="0.1" value={amount} onChange={e => setAmount(Number(e.target.value))} style={selectStyle} />
                  </>
                )}

                {category === "shopping" && (
                  <>
                    <label style={{ display: "block", marginBottom: "8px" }}>Item Type</label>
                    <select value={choice} onChange={e => setChoice(e.target.value)} style={selectStyle}>
                      <option value="fast_fashion">Fast Fashion</option>
                      <option value="electronics_small">Small Electronics</option>
                      <option value="second_hand">Second Hand</option>
                      <option value="groceries_typical">Typical Groceries</option>
                    </select>
                    <label style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Quantity</label>
                    <input type="number" min="1" step="1" value={amount} onChange={e => setAmount(Number(e.target.value))} style={selectStyle} />
                  </>
                )}

                <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                  <button 
                    onClick={() => setCategory(null)}
                    style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", border: "1px solid var(--border-muted)", borderRadius: "8px", cursor: "pointer" }}
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{ flex: 2, padding: "12px", background: "var(--accent-emerald)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                  >
                    {isSubmitting ? "Saving..." : "Log Activity"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const btnStyle = {
  display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "12px",
  background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-muted)",
  padding: "24px", borderRadius: "12px", color: "var(--text-primary)",
  cursor: "pointer", transition: "background 0.2s"
};

const selectStyle = {
  width: "100%", padding: "12px", borderRadius: "8px", 
  background: "rgba(0,0,0,0.2)", color: "var(--text-primary)", 
  border: "1px solid var(--border-muted)"
};

export default QuickLogFAB;
