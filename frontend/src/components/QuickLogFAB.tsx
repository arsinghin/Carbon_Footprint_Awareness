import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext.tsx";
import { Plus, X, Navigation, Utensils, Zap, ShoppingBag } from "lucide-react";

const QuickLogFAB = () => {
  const { logActivity } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [choice, setChoice] = useState("");
  const [amount, setAmount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isOpen) return;

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, select, input, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
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
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            ref={modalRef}
            className="modal-content"
            role="dialog"
            aria-labelledby="log-title"
            aria-describedby="log-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 id="log-title" style={{ fontSize: "var(--font-xl)" }}>
                {category ? `Log ${category.charAt(0).toUpperCase() + category.slice(1)}` : "Log Activity"}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p id="log-description" style={{ color: "var(--text-secondary)", marginBottom: "24px", lineHeight: "1.5" }}>
              Choose a category, select your action, and save the impact so your carbon insights stay current.
            </p>

            {!category ? (
              <div className="grid-2">
                <button type="button" onClick={() => { setCategory("transit"); setChoice("bus"); }} style={btnStyle} aria-label="Log transit activity">
                  <Navigation className="w-6 h-6 text-blue-400" /> Transit
                </button>
                <button type="button" onClick={() => { setCategory("food"); setChoice("vegan"); }} style={btnStyle} aria-label="Log food activity">
                  <Utensils className="w-6 h-6 text-orange-400" /> Food
                </button>
                <button type="button" onClick={() => { setCategory("energy"); setChoice("ac_eco"); }} style={btnStyle} aria-label="Log energy activity">
                  <Zap className="w-6 h-6 text-yellow-400" /> Energy
                </button>
                <button type="button" onClick={() => { setCategory("shopping"); setChoice("second_hand"); }} style={btnStyle} aria-label="Log shopping activity">
                  <ShoppingBag className="w-6 h-6 text-purple-400" /> Shopping
                </button>
              </div>
            ) : (
              <div>
                {/* Dynamic inputs based on category */}
                {category === "transit" && (
                  <>
                    <label htmlFor="log-transit-choice" style={{ display: "block", marginBottom: "8px" }}>Mode of Transit</label>
                    <select id="log-transit-choice" value={choice} onChange={e => setChoice(e.target.value)} style={selectStyle}>
                      <option value="solo_petrol">Solo Petrol Car</option>
                      <option value="ev_rideshare">EV / Rideshare</option>
                      <option value="bus">Bus</option>
                      <option value="train">Train</option>
                      <option value="active">Walk / Bike</option>
                    </select>
                    <label htmlFor="log-transit-amount" style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Distance (miles)</label>
                    <input id="log-transit-amount" type="number" min="0.1" step="0.1" value={amount} onChange={e => setAmount(Number(e.target.value))} style={selectStyle} />
                  </>
                )}

                {category === "food" && (
                  <>
                    <label htmlFor="log-food-choice" style={{ display: "block", marginBottom: "8px" }}>Meal Type</label>
                    <select id="log-food-choice" value={choice} onChange={e => setChoice(e.target.value)} style={selectStyle}>
                      <option value="beef_lamb">Beef / Lamb</option>
                      <option value="pork_poultry">Pork / Poultry</option>
                      <option value="vegetarian_fish">Vegetarian / Fish</option>
                      <option value="vegan">Vegan</option>
                    </select>
                    <label htmlFor="log-food-amount" style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Servings</label>
                    <input id="log-food-amount" type="number" min="1" step="1" value={amount} onChange={e => setAmount(Number(e.target.value))} style={selectStyle} />
                  </>
                )}

                {category === "energy" && (
                  <>
                    <label htmlFor="log-energy-choice" style={{ display: "block", marginBottom: "8px" }}>Energy Type</label>
                    <select id="log-energy-choice" value={choice} onChange={e => setChoice(e.target.value)} style={selectStyle}>
                      <option value="ac_standard">Standard AC</option>
                      <option value="ac_eco">Eco AC</option>
                      <option value="fan_only">Fans Only</option>
                      <option value="ventilation">Natural Ventilation</option>
                    </select>
                    <label htmlFor="log-energy-amount" style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Hours Used</label>
                    <input id="log-energy-amount" type="number" min="0.1" step="0.1" value={amount} onChange={e => setAmount(Number(e.target.value))} style={selectStyle} />
                  </>
                )}

                {category === "shopping" && (
                  <>
                    <label htmlFor="log-shopping-choice" style={{ display: "block", marginBottom: "8px" }}>Item Type</label>
                    <select id="log-shopping-choice" value={choice} onChange={e => setChoice(e.target.value)} style={selectStyle}>
                      <option value="fast_fashion">Fast Fashion</option>
                      <option value="electronics_small">Small Electronics</option>
                      <option value="second_hand">Second Hand</option>
                      <option value="groceries_typical">Typical Groceries</option>
                    </select>
                    <label htmlFor="log-shopping-amount" style={{ display: "block", marginTop: "16px", marginBottom: "8px" }}>Quantity</label>
                    <input id="log-shopping-amount" type="number" min="1" step="1" value={amount} onChange={e => setAmount(Number(e.target.value))} style={selectStyle} />
                  </>
                )}

                <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setCategory(null)}
                    style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", border: "1px solid var(--border-muted)", borderRadius: "8px", cursor: "pointer" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
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
