export type Mood = "party" | "chill" | "adventure" | "nature" | "beach" | "food";
export type Budget = "low" | "medium" | "high";
export type Duration = "day" | "multi";
export type TravelType = "solo" | "friends" | "partner";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type Transport = "walk" | "bike" | "bus" | "cab" | "car";
export type Crowd = "quiet" | "lively" | "packed";

export interface UserPreferences {
  location: string;
  moods: Mood[];
  budget: Budget;
  budgetAmount: number;
  duration: Duration;
  travelType: TravelType;
  groupSize?: number;
  timeOfDay?: TimeOfDay;
  transport?: Transport;
  crowd?: Crowd;
  avoidMoods?: Mood[];
}

export interface Destination {
  id: string;
  name: string;
  description: string;
  category: string;
  moods: string[];
  travel_types: string[];
  distance_km: number;
  duration_type: string;
  budget_tier: string;
  transport_cost: number;
  food_cost: number;
  stay_cost: number;
  entry_fee: number;
  rating: number;
  activities: string[];
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  best_time: string | null;
  opening_hours?: OpeningHours | null;
  created_at?: string;
}

export type DayHours = "24hrs" | "closed" | { open: string; close: string };
export type OpeningHours = {
  monday?: DayHours; tuesday?: DayHours; wednesday?: DayHours; thursday?: DayHours;
  friday?: DayHours; saturday?: DayHours; sunday?: DayHours;
};

export interface ScoredDestination extends Destination {
  score: number;
  reasons: string[];
  totalCost: number;
}