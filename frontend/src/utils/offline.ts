import type { Activity, UserProfile } from "../types/app";

export const OFFLINE_COEFFICIENTS: Record<string, Record<string, number>> = {
  transit: { solo_petrol: 270.0, solo_diesel: 290.0, ev_rideshare: 100.0, bus: 60.0, train: 40.0, active: 0.0 },
  food: { beef_lamb: 3000.0, pork_poultry: 600.0, vegetarian_fish: 400.0, vegan: 200.0 },
  energy: { ac_standard: 1200.0, ac_eco: 300.0, fan_only: 40.0, ventilation: 0.0 },
  shopping: { fast_fashion: 15000.0, electronics_small: 30000.0, second_hand: 500.0, groceries_typical: 1500.0 },
};

export const OFFLINE_BASELINE_MAPPING: Record<string, Record<string, string>> = {
  transit: { solo_petrol: "solo_petrol", carpool: "ev_rideshare", transit: "bus", active: "active" },
  diet: { high_meat: "beef_lamb", low_meat: "pork_poultry", vegetarian: "vegetarian_fish", vegan: "vegan" },
  energy: { ac_always: "ac_standard", eco_mode: "ac_eco", ventilation: "ventilation" },
};

export const round = (value: number, decimals: number) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export const calculateOfflineEmissions = (
  category: string,
  selectedChoice: string,
  amount: number,
  profile: UserProfile,
) => {
  const baseMapping = OFFLINE_BASELINE_MAPPING[category];
  let baselineChoice = selectedChoice;

  if (category === "transit") {
    baselineChoice = baseMapping?.[profile.baseline.transit] || "solo_petrol";
  } else if (category === "food") {
    baselineChoice = baseMapping?.[profile.baseline.diet] || "beef_lamb";
  } else if (category === "energy") {
    baselineChoice = baseMapping?.[profile.baseline.energy] || "ac_standard";
  } else if (category === "shopping" && selectedChoice === "second_hand") {
    baselineChoice = "fast_fashion";
  }

  const efSelected = OFFLINE_COEFFICIENTS[category]?.[selectedChoice] || 0.0;
  const efBaseline = OFFLINE_COEFFICIENTS[category]?.[baselineChoice] || 0.0;

  const actualEmissions = amount * efSelected;
  const baselineEmissions = amount * efBaseline;
  const savedGrams = baselineEmissions - actualEmissions;
  const savedKg = savedGrams / 1000.0;

  return { baselineChoice, actualEmissions, baselineEmissions, savedGrams, savedKg };
};

export const calculateNextStreak = (lastLoggedDate: string, currentStreak: number, todayStr: string) => {
  if (!lastLoggedDate) return 1;

  const diff = Math.floor((new Date(todayStr).getTime() - new Date(lastLoggedDate).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 1) return currentStreak + 1;
  if (diff > 1) return 1;
  return currentStreak;
};

export const buildOfflineNudges = (logs: Activity[]) => {
  const nudgesList: Array<{ type: string; text: string }> = [];
  const soloTrips = logs.filter((activity) => activity.category === "transit" && ["solo_petrol", "solo_diesel"].includes(activity.selectedChoice)).length;
  const beefServings = logs.filter((activity) => activity.category === "food" && activity.selectedChoice === "beef_lamb").length;
  const acHours = logs.filter((activity) => activity.category === "energy" && activity.selectedChoice === "ac_standard").length;

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

  return nudgesList;
};
