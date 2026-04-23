export type EventCategory = "fest" | "gig" | "food" | "party" | "sports" | "workshop" | "other";

export interface CommunityEvent {
  id: string;
  created_by: string;
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  link: string | null;
  organizer: string | null;
  status: string;
  hidden: boolean;
  created_at: string;
  updated_at: string;
}

export const EVENT_CATEGORIES: { id: EventCategory; label: string; emoji: string }[] = [
  { id: "fest", label: "Fest", emoji: "🎪" },
  { id: "gig", label: "Gig / Music", emoji: "🎸" },
  { id: "food", label: "Food", emoji: "🍜" },
  { id: "party", label: "Party", emoji: "🪩" },
  { id: "sports", label: "Sports", emoji: "🏆" },
  { id: "workshop", label: "Workshop", emoji: "🛠️" },
  { id: "other", label: "Other", emoji: "✨" },
];

export const categoryMeta = (id: string) =>
  EVENT_CATEGORIES.find((c) => c.id === id) ?? EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1];

export function isUpcoming(ev: Pick<CommunityEvent, "starts_at" | "ends_at">) {
  const end = ev.ends_at ? new Date(ev.ends_at).getTime() : new Date(ev.starts_at).getTime() + 3 * 60 * 60 * 1000;
  return end >= Date.now();
}

export function withinRange(ev: CommunityEvent, range: "all" | "week" | "month") {
  if (range === "all") return true;
  const start = new Date(ev.starts_at).getTime();
  const now = Date.now();
  const days = range === "week" ? 7 : 30;
  return start >= now - 12 * 60 * 60 * 1000 && start <= now + days * 24 * 60 * 60 * 1000;
}

/** Build a downloadable .ics calendar file for an event. */
export function buildIcs(ev: CommunityEvent): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(ev.starts_at);
  const end = ev.ends_at ? new Date(ev.ends_at) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Manipal Wanderlust//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@manipal-wanderlust`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(ev.description + (ev.link ? `\n\n${ev.link}` : ""))}`,
    `LOCATION:${esc(ev.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(ev: CommunityEvent) {
  const blob = new Blob([buildIcs(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
