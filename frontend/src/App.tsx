import React from "react";
import { AppProvider, useApp } from "./context/AppContext.tsx";
import OnboardingModal from "./components/OnboardingModal.tsx";
import DigitalForest from "./components/DigitalForest.tsx";
import QuickLogFAB from "./components/QuickLogFAB.tsx";
import Simulator from "./components/Simulator.tsx";
import HistoryList from "./components/HistoryList.tsx";
import NudgesPanel from "./components/NudgesPanel.tsx";
import ChallengePanel from "./components/ChallengePanel.tsx";
import { Leaf, Info } from "lucide-react";

const AppShell = () => {
  const { currentRoute, setCurrentRoute, profile, isLoading, isOffline } = useApp();

  const handleRouteClick = (e: React.MouseEvent, route: string) => {
    e.preventDefault();
    setCurrentRoute(route);
  };

  return (
    <div className="app-container">
      {/* Accessibility Link */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Header Navigation */}
      <header>
        <div className="header-container">
          <a href="#" className="brand" onClick={(e) => handleRouteClick(e, "/")}>
            <Leaf className="w-6 h-6 text-emerald-500" />
            <span>Carbon</span>Aware
          </a>
          
          <nav className="nav-links" role="navigation" aria-label="Main Navigation">
            <button 
              className={`nav-btn ${currentRoute === "/" ? "active" : ""}`}
              onClick={(e) => handleRouteClick(e, "/")}
              aria-current={currentRoute === "/" ? "page" : undefined}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${currentRoute === "/simulator" ? "active" : ""}`}
              onClick={(e) => handleRouteClick(e, "/simulator")}
              aria-current={currentRoute === "/simulator" ? "page" : undefined}
            >
              What-If Simulator
            </button>
            <button 
              className={`nav-btn ${currentRoute === "/history" ? "active" : ""}`}
              onClick={(e) => handleRouteClick(e, "/history")}
              aria-current={currentRoute === "/history" ? "page" : undefined}
            >
              My Activity Logs
            </button>
          </nav>
        </div>
      </header>

      {/* Offline Alert Indicator */}
      {isOffline && (
        <div 
          style={{
            background: "rgba(245, 158, 11, 0.15)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
            color: "var(--accent-orange)",
            padding: "8px 16px",
            fontSize: "var(--font-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
          role="alert"
        >
          <Info className="w-4 h-4" />
          <span>Offline mode active. All calculations and logging will resolve locally.</span>
        </div>
      )}

      {/* Main Layout Content Router */}
      <main id="main-content" className="main-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "var(--text-secondary)" }}>
            <div style={{ marginBottom: "16px", fontSize: "var(--font-lg)" }}>Loading your Carbon Forest...</div>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Onboarding triggers if baseline is not set */}
            {!profile && <OnboardingModal />}

            {currentRoute === "/" && (
              <>
                <h1 className="sr-only" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden" }}>
                  CarbonAware — Your Carbon Footprint Dashboard
                </h1>
                <DigitalForest />
                <div className="grid-2">
                  <NudgesPanel />
                  <ChallengePanel />
                </div>
                <div className="card">
                  <h3 className="card-title">
                    <Leaf className="w-5 h-5 text-emerald-500" />
                    How CarbonAware Works
                  </h3>
                  <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", fontSize: "var(--font-sm)" }}>
                    Standard carbon calculators show you a number and stop there.{" "}
                    <strong style={{ color: "var(--text-primary)" }}>CarbonAware</strong> focuses on{" "}
                    <strong style={{ color: "var(--text-primary)" }}>behavioural choices</strong>: every
                    time you swap a high-carbon action for a lower-carbon one, we calculate exactly how much
                    you saved <em>relative to your personal baseline</em> — not a global average.
                  </p>
                  <p style={{ marginTop: "12px", color: "var(--text-secondary)", lineHeight: "1.6", fontSize: "var(--font-sm)" }}>
                    Every <strong style={{ color: "var(--accent-emerald)" }}>12 kg of CO₂e</strong> saved
                    grows a tree in your{" "}
                    <strong style={{ color: "var(--accent-emerald)" }}>Digital Forest</strong>. Log daily
                    to maintain your streak and keep your forest glowing. Smart nudges update as your
                    patterns change, so your guidance always stays relevant.
                  </p>
                </div>
                <QuickLogFAB />
              </>
            )}

            {currentRoute === "/simulator" && <Simulator />}

            {currentRoute === "/history" && <HistoryList />}
          </>
        )}
      </main>

      {/* Spinner stylesheet overlay */}
      <style>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-muted);
          border-top-color: var(--accent-emerald);
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

export default App;
