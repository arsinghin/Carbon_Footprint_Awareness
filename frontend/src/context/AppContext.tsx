/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Activity, Nudge, UserProfile } from "../types/app";
import { getStoredBaseline, getStoredChallenge, readStoredJson } from "../utils/storage";
import { buildOfflineNudges, calculateNextStreak, calculateOfflineEmissions, round } from "../utils/offline";

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

const AUTH_HEADERS = {
  Authorization: "Bearer mock-user-client-session",
  "Content-Type": "application/json",
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentRoute, setCurrentRoute] = useState("/");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateOfflineNudges = useCallback((logs: Activity[]) => {
    setNudges(buildOfflineNudges(logs));
  }, []);

  const loadOfflineData = useCallback(() => {
    const localBaseline = getStoredBaseline();
    const localLogs = readStoredJson<Activity[]>("local_activities", []);
    const localSavings = Number(localStorage.getItem("local_saved_kg") || "0.0");
    const localStreak = Number(localStorage.getItem("local_streak") || "0");
    const localStreakDate = localStorage.getItem("local_streak_date") || "";
    const localChallenge = getStoredChallenge();

    if (localBaseline.transit || localBaseline.diet || localBaseline.energy) {
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
  }, [generateOfflineNudges]);

  const refreshState = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Fetch insights and activities in parallel for efficiency
      const [insightsRes, activitiesRes] = await Promise.all([
        fetch("/api/v1/user/insights", { headers: AUTH_HEADERS }),
        fetch("/api/v1/activities?limit=30", { headers: AUTH_HEADERS }),
      ]);

      if (!insightsRes.ok || !activitiesRes.ok) throw new Error("API error");

      const [insights, logs] = await Promise.all([
        insightsRes.json(),
        activitiesRes.json(),
      ]);

      const loadedProfile: UserProfile = {
        userId: "mock-user-client-session",
        createdAt: new Date().toISOString(),
        baseline: getStoredBaseline(),
        weeklyChallenge: insights.weeklyChallenge || getStoredChallenge(),
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
    } catch {
      console.warn("API unreachable. Falling back to offline mode.");
      setIsOffline(true);
      loadOfflineData();
    } finally {
      setIsLoading(false);
    }
  }, [loadOfflineData]);

  const submitOnboarding = async (transit: string, diet: string, energy: string): Promise<boolean> => {
    const baseline = { transit, diet, energy };
    localStorage.setItem("local_baseline", JSON.stringify(baseline));

    if (!isOffline) {
      try {
        const res = await fetch("/api/v1/user/onboarding", {
          method: "POST",
          headers: AUTH_HEADERS,
          body: JSON.stringify(baseline)
        });
        if (res.ok) {
          await refreshState();
          return true;
        }
      } catch (error) {
        console.error(error);
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
          headers: AUTH_HEADERS,
          body: JSON.stringify({ category, selectedChoice, amount, timestamp })
        });
        if (res.ok) {
          await refreshState();
          return true;
        }
      } catch {
        console.warn("Failed API activity log post. Processing locally.");
      }
    }

    // Offline implementation calculations
    if (!profile) return false;
    const { baselineChoice, actualEmissions, baselineEmissions, savedGrams, savedKg } = calculateOfflineEmissions(category, selectedChoice, amount, profile);

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
    const newStreak = calculateNextStreak(profile.streak.lastLoggedDate, profile.streak.current, todayStr);

    // Update challenge progress offline
    const localChallenge = getStoredChallenge();
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
    const localChallenge = getStoredChallenge();
    if (localChallenge && removedItem.category === "transit" && ["ev_rideshare", "bus", "train", "active"].includes(removedItem.selectedChoice)) {
      localChallenge.completedSwaps = Math.max(0, localChallenge.completedSwaps - 1);
      localStorage.setItem("local_challenge", JSON.stringify(localChallenge));
    }

    loadOfflineData();
  };

  useEffect(() => {
    refreshState();
  }, [refreshState]);

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
