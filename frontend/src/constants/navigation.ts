export const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard — CarbonAware",
  "/simulator": "What-If Simulator — CarbonAware",
  "/history": "Activity Logs — CarbonAware",
};

export const NAV_ITEMS = [
  { route: "/", label: "Dashboard" },
  { route: "/simulator", label: "What-If Simulator" },
  { route: "/history", label: "My Activity Logs" },
] as const;
