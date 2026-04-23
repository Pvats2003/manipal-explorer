import type { DayHours, Destination, OpeningHours } from "./types";

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const;

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`;
}

export type OpenStatus =
  | { state: "open"; label: "Open Now"; closesAt?: string }
  | { state: "closing-soon"; label: string; closesAt: string }
  | { state: "closed"; label: string; opensAt?: string; nextDay?: string };

export function getOpenStatus(hours?: OpeningHours | null, now: Date = new Date()): OpenStatus | null {
  if (!hours) return null;
  const dayIdx = now.getDay();
  const today = DAYS[dayIdx];
  const yest = DAYS[(dayIdx + 6) % 7];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const todayH = hours[today] as DayHours | undefined;
  const yestH = hours[yest] as DayHours | undefined;

  // 24hrs today
  if (todayH === "24hrs") return { state: "open", label: "Open Now" };

  // Yesterday spilled past midnight (e.g. close 03:00)?
  if (yestH && typeof yestH === "object") {
    const o = toMin(yestH.open), c = toMin(yestH.close);
    if (c < o && nowMin < c) {
      return { state: "open", label: "Open Now", closesAt: fmt(yestH.close) };
    }
  }

  if (!todayH || todayH === "closed") {
    // find next opening
    for (let i = 1; i <= 7; i++) {
      const d = hours[DAYS[(dayIdx + i) % 7]];
      if (d === "24hrs") return { state: "closed", label: "Closed today", nextDay: DAYS[(dayIdx + i) % 7] };
      if (d && typeof d === "object") {
        return {
          state: "closed",
          label: i === 1 ? `Opens ${fmt(d.open)} tmrw` : `Opens ${DAYS[(dayIdx + i) % 7].slice(0,3)} ${fmt(d.open)}`,
          opensAt: d.open,
        };
      }
    }
    return { state: "closed", label: "Closed" };
  }

  const o = toMin(todayH.open);
  const c = toMin(todayH.close);
  const closeMin = c < o ? c + 24 * 60 : c; // overnight
  const adjNow = nowMin < o && c < o ? nowMin + 24 * 60 : nowMin;

  if (adjNow >= o && adjNow < closeMin) {
    const remaining = closeMin - adjNow;
    if (remaining <= 60) {
      return { state: "closing-soon", label: `Closes ${fmt(todayH.close)}`, closesAt: fmt(todayH.close) };
    }
    return { state: "open", label: "Open Now", closesAt: fmt(todayH.close) };
  }
  if (adjNow < o) {
    return { state: "closed", label: `Opens ${fmt(todayH.open)}`, opensAt: todayH.open };
  }
  // After close — find next day
  for (let i = 1; i <= 7; i++) {
    const d = hours[DAYS[(dayIdx + i) % 7]];
    if (d === "24hrs") return { state: "closed", label: `Opens 12AM tmrw` };
    if (d && typeof d === "object") {
      return { state: "closed", label: i === 1 ? `Opens ${fmt(d.open)} tmrw` : `Opens ${DAYS[(dayIdx + i) % 7].slice(0,3)} ${fmt(d.open)}` };
    }
  }
  return { state: "closed", label: "Closed" };
}

export function isOpenNow(hours?: OpeningHours | null, now: Date = new Date()): boolean {
  const s = getOpenStatus(hours, now);
  return s?.state === "open" || s?.state === "closing-soon";
}

export function filterOpenNow<T extends Destination>(items: T[], now: Date = new Date()): T[] {
  return items.filter((d) => isOpenNow(d.opening_hours, now));
}
