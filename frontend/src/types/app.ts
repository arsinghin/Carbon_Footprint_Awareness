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
