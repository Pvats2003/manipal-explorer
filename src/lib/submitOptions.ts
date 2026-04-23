export const PLACE_CATEGORIES = [
  "Food & Drink",
  "Nature & Outdoors",
  "Beach",
  "Café & Study",
  "Nightlife",
  "Day Trip",
  "Hidden Gem",
  "Campus",
  "Shopping",
] as const;

export const VIBE_TAGS = [
  "chill", "party", "adventure", "nature", "beach", "food",
  "romantic", "scenic", "instagrammable", "budget", "hidden", "lively",
] as const;

export const COST_RANGES = [
  { value: "free", label: "Free" },
  { value: "under_100", label: "Under ₹100" },
  { value: "100_300", label: "₹100–300" },
  { value: "300_500", label: "₹300–500" },
  { value: "500_plus", label: "₹500+" },
] as const;

export const BEST_TIMES = [
  "Morning", "Afternoon", "Evening", "Late Night", "Monsoon Season", "Weekend Only",
] as const;

// Map cost_range -> rough budget tier for destinations
export const costToBudgetTier = (c: string): string => {
  if (c === "free" || c === "under_100") return "low";
  if (c === "100_300" || c === "300_500") return "medium";
  return "high";
};

// Map cost_range -> approximate cost number for food_cost
export const costToFoodCost = (c: string): number => {
  switch (c) {
    case "free": return 0;
    case "under_100": return 100;
    case "100_300": return 200;
    case "300_500": return 400;
    case "500_plus": return 700;
    default: return 0;
  }
};

// Map our category to destinations.category (lowercase token-ish)
export const mapCategoryToken = (c: string): string => {
  const m: Record<string, string> = {
    "Food & Drink": "food",
    "Nature & Outdoors": "nature",
    "Beach": "beach",
    "Café & Study": "cafe",
    "Nightlife": "nightlife",
    "Day Trip": "trek",
    "Hidden Gem": "hidden",
    "Campus": "campus",
    "Shopping": "shopping",
  };
  return m[c] || "other";
};
