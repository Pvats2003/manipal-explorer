import type { Destination, ScoredDestination, UserPreferences } from "./types";

const BUDGET_CAPS: Record<string, number> = { low: 1500, medium: 4000, high: 10000 };

export function scoreDestinations(
  destinations: Destination[],
  prefs: UserPreferences,
  pastSelectedCategories: string[] = []
): ScoredDestination[] {
  const cap = BUDGET_CAPS[prefs.budget] ?? prefs.budgetAmount;
  const userCap = Math.max(prefs.budgetAmount || 0, cap);

  return destinations
    .map((d) => {
      const reasons: string[] = [];
      let score = 0;
      const totalCost =
        d.transport_cost + d.food_cost + (prefs.duration === "multi" ? d.stay_cost : 0) + d.entry_fee;

      // Duration / distance match
      if (prefs.duration === "day" && d.distance_km <= 80 && d.duration_type === "day") {
        score += 30;
        reasons.push(`Easy day trip (${d.distance_km}km from Manipal)`);
      } else if (prefs.duration === "multi" && (d.duration_type === "multi" || d.distance_km > 80)) {
        score += 30;
        reasons.push(`Perfect for a multi-day getaway`);
      } else if (prefs.duration === "day" && d.distance_km > 80) {
        score -= 25;
      }

      // Mood matches
      const moodHits = prefs.moods.filter((m) => d.moods.includes(m));
      score += moodHits.length * 18;
      if (moodHits.length > 0) reasons.push(`Matches your ${moodHits.join(", ")} vibe`);

      // Budget fit
      if (totalCost <= userCap) {
        score += 20;
        reasons.push(`Fits your ₹${userCap} budget (est. ₹${totalCost})`);
      } else {
        score -= Math.min(30, ((totalCost - userCap) / userCap) * 40);
      }

      // Travel type
      if (d.travel_types.includes(prefs.travelType)) {
        score += 10;
        reasons.push(`Great for ${prefs.travelType} travel`);
      }

      // Rating
      score += d.rating * 2;

      // Personalization from history
      if (pastSelectedCategories.includes(d.category)) {
        score += 8;
        reasons.push("Matches places you've explored before");
      }

      return { ...d, score, reasons, totalCost };
    })
    .sort((a, b) => b.score - a.score);
}

export function topRecommendations(scored: ScoredDestination[], n = 2) {
  return scored.slice(0, n);
}