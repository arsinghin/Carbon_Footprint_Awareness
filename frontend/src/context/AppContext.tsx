import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Activity {
  activityId: string;
  userId: string;
  timestamp: string;
  category: string;
  selectedChoice: string;
  baselineEquivalentChoice: string;
  carbonGrams: number;
  baselineCarbonGrams: number;
  savedGrams: number;
  contextEquivalence: string;
}

export interface UserProfile {
  userId: string;
  createdAt: string;
  baseline: {
    transit: string;
    diet: string;
    energy: string;
  };
  weeklyChallenge: {
    challengeId: string;
    activatedAt: string;
    targetSwaps: number;
    completedSwaps: number;
  };
  streak: {
    current: number;
    lastLoggedDate: string;
  };
  cumulativeSavedKg: number;
}

export interface Nudge {
  type: string;
  text: string;
}

interface AppContextType {
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  profile: UserProfile | null;
  activities: Activity[];
  nudges: Nudge[];
  isLoading: boolean;
  isOffline: boolean;
  errorMessage: string | null;
  submitOnboarding: (transit: string, diet: string, energy: string) => Promise<boolean>;
  logActivity: (category: string, selectedChoice: string, amount: number) => Promise<boolean>;
  undoLastActivity: () => Promise<void>;
  refreshState: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Local coefficient mapping for offline calculations
const OFFLINE_COEFFICIENTS: Record<string, Record<string, number>> = {
  transit: { solo_petrol: 270.0, solo_diesel: 290.0, ev_rideshare: 100.0, bus: 60.0, train: 40.0, active: 0.0 },
  food: { beef_lamb: 3000.0, pork_poultry: 600.0, vegetarian_fish: 400.0, vegan: 200.0 },
  energy: { ac_standard: 1200.0, ac_eco: 300.0, fan_only: 40.0, ventilation: 0.0 },
  shopping: { fast_fashion: 15000.0, electronics_small: 30000.0, second_hand: 500.0, groceries_typical: 1500.0 }
};

const OFFLINE_BASELINE_MAPPING: Record<string, Record<string, string>> = {
  transit: { solo_petrol: "solo_petrol", carpool: "ev_rideshare", transit: "bus", active: "active" },
  diet: { high_meat: "beef_lamb", low_meat: "pork_poultry", vegetarian: "vegetarian_fish", vegan: "vegan" },
  energy: { ac_always: "ac_standard", eco_mode: "ac_eco", ventilation: "ventilation" }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentRoute, setCurrentRoute] = useState("/");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authenticate locally with mock token header
  const authHeaders = {
    "Authorization": "Bearer mock-user-client-session",
    "Content-Type": "application/json"
  };

  const refreshState = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Fetch insights and activities in parallel for efficiency
      const [insightsRes, activitiesRes] = await Promise.all([
        fetch("/api/v1/user/insights", { headers: authHeaders }),
        fetch("/api/v1/activities?limit=30", { headers: authHeaders }),
      ]);

      if (!insightsRes.ok || !activitiesRes.ok) throw new Error("API error");

      const [insights, logs] = await Promise.all([
        insightsRes.json(),
        activitiesRes.json(),
      ]);

      const loadedProfile: UserProfile = {
        userId: "mock-user-client-session",
        createdAt: new Date().toISOString(),
        baseline: JSON.parse(localStorage.getItem("local_baseline") || '{"transit":"solo_petrol","diet":"high_meat","energy":"ac_always"}'),
        weeklyChallenge: insights.weeklyChallenge || {
          challengeId: "transit_swap",
          activatedAt: new Date().toISOString(),
          targetSwaps: 2,
          completedSwaps: 0
        },
        streak: {
          current: insights.streak,
          lastLoggedDate: logs.length > 0 ? logs[0].timestamp.split("T")[0] : ""
        },
        cumulativeSavedKg: insights.savedKg
      };

      setProfile(loadedProfile);
      setActivities(logs);
      setNudges(insights.nudges || []);
      setIsOffline(false);
    } catch (err) {
      console.warn("API unreachable. Falling back to offline mode.");
      setIsOffline(true);
      loadOfflineData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfflineData = () => {
    const localBaseline = JSON.parse(localStorage.getItem("local_baseline") || "null");
    const localLogs = JSON.parse(localStorage.getItem("local_activities") || "[]");
    const localSavings = Number(localStorage.getItem("local_saved_kg") || "0.0");
    const localStreak = Number(localStorage.getItem("local_streak") || "0");
    const localStreakDate = localStorage.getItem("local_streak_date") || "";
    const localChallenge = JSON.parse(localStorage.getItem("local_challenge") || "null") || {
      challengeId: "transit_swap",
      activatedAt: new Date().toISOString(),
      targetSwaps: 2,
      completedSwaps: 0
    };

    if (localBaseline) {
      setProfile({
        userId: "local-user",
        createdAt: new Date().toISOString(),
        baseline: localBaseline,
        weeklyChallenge: localChallenge,
        streak: {
          current: localStreak,
          lastLoggedDate: localStreakDate
        },
        cumulativeSavedKg: localSavings
      });
    } else {
      setProfile(null);
    }
    setActivities(localLogs);
    generateOfflineNudges(localLogs);
  };

  const generateOfflineNudges = (logs: Activity[]) => {
    const nudgesList: Nudge[] = [];
    const soloTrips = logs.filter(a => a.category === "transit" && ["solo_petrol", "solo_diesel"].includes(a.selectedChoice)).length;
    const beefServings = logs.filter(a => a.category === "food" && a.selectedChoice === "beef_lamb").length;
    const acHours = logs.filter(a => a.category === "energy" && a.selectedChoice === "ac_standard").length;

    if (soloTrips >= 2) {
      nudgesList.push({ type: "transit", text: `You logged ${soloTrips} solo drives. Swap 1 to bus or walking next week to save 1.5 kg carbon.` });
    } else {
      nudgesList.push({ type: "transit", text: "Commute by public transit or walk tomorrow to save 270g of carbon per mile." });
    }

    if (beefServings >= 2) {
      nudgesList.push({ type: "diet", text: `You had beef/lamb ${beefServings} times. Try a vegan lunch to save 2.8 kg carbon!` });
    } else {
      nudgesList.push({ type: "diet", text: "Swapping beef to poultry saves 2.4 kg CO2e—equivalent to running your fridge for 1.5 days." });
    }

    if (acHours >= 2) {
      nudgesList.push({ type: "energy", text: "Switch AC standard to eco-mode to save 900g of carbon per hour." });
    } else {
      nudgesList.push({ type: "energy", text: "Open windows for ventilation tonight to conserve energy and grow your digital forest." });
    }

    setNudges(nudgesList);
  };

  const submitOnboarding = async (transit: string, diet: string, energy: string): Promise<boolean> => {
    const baseline = { transit, diet, energy };
    localStorage.setItem("local_baseline", JSON.stringify(baseline));

    if (!isOffline) {
      try {
        const res = await fetch("/api/v1/user/onboarding", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(baseline)
        });
        if (res.ok) {
          await refreshState();
          return true;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Offline onboarding setup
    localStorage.setItem("local_saved_kg", "0.0");
    localStorage.setItem("local_streak", "0");
    localStorage.setItem("local_streak_date", "");
    localStorage.setItem("local_activities", "[]");
    loadOfflineData();
    return true;
  };

  const logActivity = async (category: string, selectedChoice: string, amount: number): Promise<boolean> => {
    const timestamp = new Date().toISOString();

    if (!isOffline) {
      try {
        const res = await fetch("/api/v1/activities", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ category, selectedChoice, amount, timestamp })
        });
        if (res.ok) {
          await refreshState();
          return true;
        }
      } catch (err) {
        console.warn("Failed API activity log post. Processing locally.");
      }
    }

    // Offline implementation calculations
    if (!profile) return false;
    const baseMapping = OFFLINE_BASELINE_MAPPING[category];
    let baselineChoice = selectedChoice;
    if (category === "transit") {
      baselineChoice = baseMapping[profile.baseline.transit] || "solo_petrol";
    } else if (category === "food") {
      baselineChoice = baseMapping[profile.baseline.diet] || "beef_lamb";
    } else if (category === "energy") {
      baselineChoice = baseMapping[profile.baseline.energy] || "ac_standard";
    } else if (category === "shopping" && selectedChoice === "second_hand") {
      baselineChoice = "fast_fashion";
    }

    const efSelected = OFFLINE_COEFFICIENTS[category]?.[selectedChoice] || 0.0;
    const efBaseline = OFFLINE_COEFFICIENTS[category]?.[baselineChoice] || 0.0;

    const actualEmissions = amount * efSelected;
    const baselineEmissions = amount * efBaseline;
    const savedGrams = baselineEmissions - actualEmissions;
    const savedKg = savedGrams / 1000.0;

    const newActivity: Activity = {
      activityId: Math.random().toString(36).substring(2, 9),
      userId: "local-user",
      timestamp,
      category,
      selectedChoice,
      baselineEquivalentChoice: baselineChoice,
      carbonGrams: Number(actualEmissions.toFixed(1)),
      baselineCarbonGrams: Number(baselineEmissions.toFixed(1)),
      savedGrams: Number(savedGrams.toFixed(1)),
      contextEquivalence: savedGrams > 0 ? `Saved equivalent to avoiding a ${round(savedGrams / 270.0, 1)} mile solo drive` : "None"
    };

    // Update streak logic offline
    const todayStr = new Date().toISOString().split("T")[0];
    const lastLogged = profile.streak.lastLoggedDate;
    let newStreak = profile.streak.current;
    if (!lastLogged) {
      newStreak = 1;
    } else {
      const diff = Math.floor((new Date(todayStr).getTime() - new Date(lastLogged).getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        newStreak += 1;
      } else if (diff > 1) {
        newStreak = 1;
      }
    }

    // Update challenge progress offline
    const localChallenge = JSON.parse(localStorage.getItem("local_challenge") || "null") || {
      challengeId: "transit_swap",
      activatedAt: new Date().toISOString(),
      targetSwaps: 2,
      completedSwaps: 0
    };
    if (category === "transit" && ["ev_rideshare", "bus", "train", "active"].includes(selectedChoice)) {
      localChallenge.completedSwaps += 1;
    }
    localStorage.setItem("local_challenge", JSON.stringify(localChallenge));

    const updatedLogs = [newActivity, ...activities];
    const updatedSavings = round(profile.cumulativeSavedKg + savedKg, 1);

    localStorage.setItem("local_activities", JSON.stringify(updatedLogs));
    localStorage.setItem("local_saved_kg", updatedSavings.toString());
    localStorage.setItem("local_streak", newStreak.toString());
    localStorage.setItem("local_streak_date", todayStr);

    loadOfflineData();
    return true;
  };

  const undoLastActivity = async () => {
    if (activities.length === 0) return;
    const updatedLogs = activities.slice(1);
    const removedItem = activities[0];
    const removedSavedKg = removedItem.savedGrams / 1000.0;

    if (!isOffline) {
      // In online mode, we reconstruct or update total score
      // Since backend doesn't support DELETE endpoint directly, we can subtract locally or wait for refresh
      // For visual feedback, we update frontend instantly
    }

    // Local update
    const updatedSavings = round(Math.max(0, (profile?.cumulativeSavedKg || 0) - removedSavedKg), 1);
    localStorage.setItem("local_activities", JSON.stringify(updatedLogs));
    localStorage.setItem("local_saved_kg", updatedSavings.toString());

    // Recalculate streak
    const prevDate = updatedLogs.length > 0 ? updatedLogs[0].timestamp.split("T")[0] : "";
    localStorage.setItem("local_streak_date", prevDate);
    if (!prevDate) {
      localStorage.setItem("local_streak", "0");
    }

    // Undo challenge progress if last was low-carbon transit
    const localChallenge = JSON.parse(localStorage.getItem("local_challenge") || "null");
    if (localChallenge && removedItem.category === "transit" && ["ev_rideshare", "bus", "train", "active"].includes(removedItem.selectedChoice)) {
      localChallenge.completedSwaps = Math.max(0, localChallenge.completedSwaps - 1);
      localStorage.setItem("local_challenge", JSON.stringify(localChallenge));
    }

    loadOfflineData();
  };

  const round = (val: number, decimals: number) => {
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  };

  useEffect(() => {
    refreshState();
  }, []);

  return (
    <AppContext.Provider value={{
      currentRoute,
      setCurrentRoute,
      profile,
      activities,
      nudges,
      isLoading,
      isOffline,
      errorMessage,
      submitOnboarding,
      logActivity,
      undoLastActivity,
      refreshState
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
