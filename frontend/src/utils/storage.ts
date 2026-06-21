export const readStoredJson = <T,>(key: string, fallback: T): T => {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const getStoredBaseline = () => {
  return readStoredJson("local_baseline", {
    transit: "solo_petrol",
    diet: "high_meat",
    energy: "ac_always",
  });
};

export const getStoredChallenge = () => {
  return readStoredJson("local_challenge", {
    challengeId: "transit_swap",
    activatedAt: new Date().toISOString(),
    targetSwaps: 2,
    completedSwaps: 0,
  });
};
