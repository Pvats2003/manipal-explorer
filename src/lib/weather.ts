export interface WeatherSnapshot {
  tempC: number;
  code: number;
  condition: "clear" | "clouds" | "rain" | "drizzle" | "thunderstorm" | "fog" | "snow";
  isDay: boolean;
  fetchedAt: number;
}

const CACHE_KEY = "mhs_weather_v1";
const TTL = 30 * 60 * 1000;

// WMO weather codes → buckets
function bucket(code: number): WeatherSnapshot["condition"] {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3) return "clouds";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "clear";
}

export async function fetchWeather(): Promise<WeatherSnapshot> {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.fetchedAt < TTL) return cached;
  } catch { /* ignore */ }

  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=13.3409&longitude=74.7421&current=temperature_2m,weather_code,is_day&timezone=Asia%2FKolkata"
  );
  const j = await res.json();
  const cur = j.current;
  const snap: WeatherSnapshot = {
    tempC: Math.round(cur.temperature_2m),
    code: cur.weather_code,
    condition: bucket(cur.weather_code),
    isDay: cur.is_day === 1,
    fetchedAt: Date.now(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(snap));
  return snap;
}

export function weatherEmoji(c: WeatherSnapshot["condition"], isDay = true): string {
  switch (c) {
    case "clear": return isDay ? "☀️" : "🌙";
    case "clouds": return "⛅";
    case "rain": return "🌧️";
    case "drizzle": return "🌦️";
    case "thunderstorm": return "⛈️";
    case "fog": return "🌫️";
    case "snow": return "❄️";
  }
}

export interface WeatherInsight {
  emoji: string;
  message: string;
  /** moods to push to the top of the list */
  boostMoods: string[];
  /** categories to push to the top */
  boostCategories: string[];
}

export function getWeatherInsight(w: WeatherSnapshot, now: Date = new Date()): WeatherInsight | null {
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  if (w.condition === "rain" || w.condition === "drizzle" || w.condition === "thunderstorm") {
    return { emoji: "🌧️", message: "Monsoon mode — perfect for cozy spots", boostMoods: ["chill", "food"], boostCategories: ["cafe", "restaurant", "lounge"] };
  }
  if (w.tempC > 32) {
    return { emoji: "🥵", message: "Beat the heat — cool spots picked for you", boostMoods: ["chill", "food"], boostCategories: ["cafe", "restaurant", "lounge", "nightlife"] };
  }
  if (hour >= 18) {
    return { emoji: "🌙", message: "Evening picks — what's open and lit right now", boostMoods: ["party", "chill"], boostCategories: ["bar", "lounge", "nightlife", "cafe", "restaurant", "hangout"] };
  }
  if (w.condition === "clear" && isWeekend) {
    return { emoji: "☀️", message: "Perfect beach weather", boostMoods: ["beach", "adventure", "nature"], boostCategories: ["beach", "nature", "trek", "waterfall"] };
  }
  if (w.condition === "clear") {
    return { emoji: "☀️", message: "Clear skies — outdoor day", boostMoods: ["nature", "adventure"], boostCategories: ["beach", "nature", "hangout"] };
  }
  return null;
}
