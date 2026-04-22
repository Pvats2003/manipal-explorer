import type { Destination, ScoredDestination, UserPreferences } from "./types";

const BUDGET_CAPS: Record<string, number> = { low: 1500, medium: 4000, high: 10000 };

export function scoreDestinations(
  destinations: Destination[],
  prefs: UserPreferences,
  pastSelectedCategories: string[] = []
): ScoredDestination[] {
  const cap = BUDGET_CAPS[prefs.budget] ?? prefs.budgetAmount;
  const userCap = Math.max(prefs.budgetAmount || 0, cap);
  const groupSize = prefs.groupSize ?? 1;
  // Cab/car splits cost across people; bus/bike doesn't change much
  const transportFactor =
    prefs.transport === "cab" ? Math.max(0.3, 1 / Math.max(1, groupSize))
    : prefs.transport === "car" ? 0.4
    : prefs.transport === "bus" ? 0.7
    : prefs.transport === "bike" ? 0.5
    : 1;

  return destinations
    .map((d) => {
      const reasons: string[] = [];
      let score = 0;
      const adjustedTransport = Math.round(d.transport_cost * transportFactor);
      const totalCost =
        adjustedTransport + d.food_cost + (prefs.duration === "multi" ? d.stay_cost : 0) + d.entry_fee;

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

      // Vibes to AVOID — strong negative
      const avoidHits = (prefs.avoidMoods || []).filter((m) => d.moods.includes(m));
      if (avoidHits.length > 0) {
        score -= avoidHits.length * 25;
      }

      // Time of day matching — night/evening favours bars, lounges, nightlife, hangouts
      if (prefs.timeOfDay === "night") {
        if (["bar", "lounge", "nightlife", "cafe"].includes(d.category)) {
          score += 12;
          reasons.push("Open and great at night");
        }
        if (["trek", "waterfall"].includes(d.category)) score -= 15;
      } else if (prefs.timeOfDay === "morning") {
        if (["beach", "trek", "waterfall", "nature", "hangout"].includes(d.category)) {
          score += 10;
          reasons.push("Perfect for a morning visit");
        }
      } else if (prefs.timeOfDay === "evening") {
        if (["hangout", "cafe", "restaurant", "lounge", "beach"].includes(d.category)) {
          score += 8;
          reasons.push("Beautiful in the evening");
        }
      }

      // Transport reachability
      if (prefs.transport === "walk" && d.distance_km > 3) score -= 30;
      else if (prefs.transport === "bike" && d.distance_km > 60) score -= 12;
      else if (prefs.transport === "bus" && d.distance_km > 200) score -= 8;

      // Crowd preference vs category
      if (prefs.crowd === "quiet") {
        if (["nightlife", "bar", "lounge", "party"].includes(d.category)) score -= 20;
        if (["nature", "trek", "waterfall", "hangout"].includes(d.category)) {
          score += 8;
          reasons.push("Quiet and peaceful");
        }
      } else if (prefs.crowd === "packed") {
        if (["nightlife", "bar", "party", "lounge"].includes(d.category)) {
          score += 12;
          reasons.push("High-energy crowd");
        }
      }

      // Group size — large groups suit cafes/restaurants/lounges/beaches more than solo treks
      if (groupSize >= 6 && ["lounge", "restaurant", "bar", "beach", "hangout"].includes(d.category)) {
        score += 6;
        reasons.push(`Great for a group of ${groupSize}`);
      }
      if (groupSize === 1 && ["cafe", "trek", "nature"].includes(d.category)) {
        score += 4;
      }

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