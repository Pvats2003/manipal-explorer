export interface TripEntry {
  id: string;
  place: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
  notes?: string;
  createdAt: number;
}

const KEY = "mhs_trips_v1";

export function loadTrips(): TripEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function saveTrips(t: TripEntry[]) { localStorage.setItem(KEY, JSON.stringify(t)); }
export function addTrip(t: Omit<TripEntry, "id" | "createdAt">): TripEntry[] {
  const list = loadTrips();
  const entry: TripEntry = { ...t, id: crypto.randomUUID(), createdAt: Date.now() };
  list.unshift(entry);
  saveTrips(list);
  return list;
}
export function deleteTrip(id: string): TripEntry[] {
  const list = loadTrips().filter((t) => t.id !== id);
  saveTrips(list);
  return list;
}
export function clearMonth(): TripEntry[] {
  saveTrips([]);
  return [];
}

export interface MonthStats {
  total: number;
  count: number;
  avg: number;
  biggest?: TripEntry;
  weekly: number[]; // 4-5 weeks
}
export function monthStats(trips: TripEntry[], ref: Date = new Date()): MonthStats {
  const y = ref.getFullYear(), m = ref.getMonth();
  const inMonth = trips.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === y && d.getMonth() === m;
  });
  const total = inMonth.reduce((s, t) => s + t.amount, 0);
  const biggest = inMonth.reduce<TripEntry | undefined>((b, t) => (!b || t.amount > b.amount ? t : b), undefined);
  const weeks = 5;
  const weekly = Array(weeks).fill(0);
  for (const t of inMonth) {
    const d = new Date(t.date);
    const w = Math.min(weeks - 1, Math.floor((d.getDate() - 1) / 7));
    weekly[w] += t.amount;
  }
  return { total, count: inMonth.length, avg: inMonth.length ? Math.round(total / inMonth.length) : 0, biggest, weekly };
}
