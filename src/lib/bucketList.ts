export type BucketCategory = "Food & Chai" | "Nature & Outdoors" | "Campus Life" | "Day Trips" | "Hidden Gems";

export interface BucketItem {
  id: string;
  title: string;
  description: string;
  category: BucketCategory;
  emoji: string;
}

export const BUCKET_ITEMS: BucketItem[] = [
  // Food & Chai (6)
  { id: "pai-2am", title: "Pai Tiffins at 2am", description: "Late-night idli-vada ritual after a study grind.", category: "Food & Chai", emoji: "🍛" },
  { id: "endpoint-chai", title: "Cutting chai at End Point", description: "Sunset, breeze, and ₹10 chai with the squad.", category: "Food & Chai", emoji: "☕" },
  { id: "udupi-krishna", title: "Filter coffee at Udupi Krishna Bhavan", description: "Authentic South Indian breakfast — no shortcuts.", category: "Food & Chai", emoji: "☕" },
  { id: "dollops-night", title: "Midnight Maggi at Dollops", description: "Cure for every 1am breakdown and group hangout.", category: "Food & Chai", emoji: "🍜" },
  { id: "tiger-circle-dosa", title: "Dosa at Tiger Circle stall", description: "₹40 masala dosa that beats any restaurant.", category: "Food & Chai", emoji: "🥞" },
  { id: "hangyo-icecream", title: "Hangyo ice cream after a Malpe sunset", description: "Local Mangalorean ice cream — gadbad is sacred.", category: "Food & Chai", emoji: "🍨" },

  // Nature & Outdoors (6)
  { id: "kapu-sunset", title: "Kapu Beach sunset from the lighthouse", description: "Climb the lighthouse, watch the Arabian Sea light up.", category: "Nature & Outdoors", emoji: "🌅" },
  { id: "st-marys", title: "St. Mary's Island ferry trip", description: "Hexagonal basalt rocks, untouched beach, ferry rush.", category: "Nature & Outdoors", emoji: "🪨" },
  { id: "malpe-low-tide", title: "Malpe at low tide", description: "Walk way out into the sea — feels otherworldly.", category: "Nature & Outdoors", emoji: "🌊" },
  { id: "varamballi-trek", title: "Trek to Varamballi viewpoint", description: "Hidden hilltop, 360° views of the Western Ghats.", category: "Nature & Outdoors", emoji: "🥾" },
  { id: "kodachadri", title: "Kodachadri sunrise trek", description: "The classic monsoon-to-winter pilgrimage trek.", category: "Nature & Outdoors", emoji: "⛰️" },
  { id: "agumbe-rains", title: "Agumbe in the monsoon", description: "India's Cherrapunji — get drenched on purpose.", category: "Nature & Outdoors", emoji: "🌧️" },

  // Campus Life (5)
  { id: "library-allnighter", title: "All-nighter in the library before exams", description: "5am sun rising as you finish that last revision.", category: "Campus Life", emoji: "📚" },
  { id: "revels-night", title: "Front row at Revels main night", description: "The annual cultural fest concert — pure madness.", category: "Campus Life", emoji: "🎤" },
  { id: "techtatva-stage", title: "TechTatva main stage", description: "Asia's largest student tech fest closing night.", category: "Campus Life", emoji: "🎛️" },
  { id: "kc-quad", title: "Late-night chill at KC Quad", description: "Music, friends, and zero thoughts about lectures.", category: "Campus Life", emoji: "🎸" },
  { id: "first-rain-campus", title: "First monsoon rain on campus", description: "Run through the rain from MIT to the hostel.", category: "Campus Life", emoji: "🌦️" },

  // Day Trips (4)
  { id: "goa-trip", title: "Goa weekend with the squad", description: "8-hour drive, beach shacks, the whole movie.", category: "Day Trips", emoji: "🏖️" },
  { id: "jog-falls", title: "Jog Falls in monsoon", description: "India's tallest plunge waterfall in full fury.", category: "Day Trips", emoji: "💦" },
  { id: "coorg-trip", title: "Coorg coffee plantation stay", description: "Misty hills, filter coffee, unreal sunrises.", category: "Day Trips", emoji: "☕" },
  { id: "kudremukh-trek", title: "Kudremukh peak trek", description: "Rolling green meadows like a Studio Ghibli film.", category: "Day Trips", emoji: "🏞️" },

  // Hidden Gems (4)
  { id: "secret-viewpoint", title: "Find a 'secret' viewpoint nobody posts", description: "Earn it from a senior — never share the location.", category: "Hidden Gems", emoji: "🤫" },
  { id: "anegudde-temple", title: "Anegudde Vinayaka temple at dawn", description: "Hilltop Ganesha temple, surreal morning vibes.", category: "Hidden Gems", emoji: "🛕" },
  { id: "monsoon-falls", title: "A nameless monsoon waterfall", description: "Bike off the highway and stumble into one.", category: "Hidden Gems", emoji: "🚿" },
  { id: "hoode-backwaters", title: "Hoode Beach backwater sunset", description: "Where the river meets the sea — rarely crowded.", category: "Hidden Gems", emoji: "🛶" },
];

const KEY = "mhs_bucket_done";

export function getCompleted(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
export function setCompleted(state: Record<string, number>) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
export function toggleCompleted(id: string): Record<string, number> {
  const cur = getCompleted();
  if (cur[id]) delete cur[id]; else cur[id] = Date.now();
  setCompleted(cur);
  return cur;
}

export function milestone(done: number, total: number): string {
  if (done === total) return "Legend status unlocked 🏆";
  if (done >= 30) return "Senior energy 🔥";
  if (done >= 15) return "You're getting started!";
  return "Your MIT story starts here";
}
