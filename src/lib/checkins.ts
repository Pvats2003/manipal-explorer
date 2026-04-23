import { supabase } from "@/integrations/supabase/client";

const FP_KEY = "mhs_device_fp";

/** Stable per-device fingerprint (hashed). Stored once in localStorage. */
export function getDeviceFingerprint(): string {
  let cached = localStorage.getItem(FP_KEY);
  if (cached) return cached;
  const raw = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}`,
    new Date().getTimezoneOffset(),
  ].join("||");
  // Simple stable hash (djb2)
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) hash = ((hash << 5) + hash + raw.charCodeAt(i)) | 0;
  cached = `fp_${Math.abs(hash).toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(FP_KEY, cached);
  return cached;
}

export async function getCheckinCount(placeId: string): Promise<number> {
  const { count } = await supabase
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("place_id", placeId);
  return count ?? 0;
}

export async function hasCheckedIn(placeId: string, userId: string | null): Promise<boolean> {
  if (userId) {
    const { data } = await supabase
      .from("checkins").select("id")
      .eq("place_id", placeId).eq("user_id", userId).maybeSingle();
    return !!data;
  }
  const fp = getDeviceFingerprint();
  const { data } = await supabase
    .from("checkins").select("id")
    .eq("place_id", placeId).is("user_id", null).eq("device_fingerprint", fp).maybeSingle();
  return !!data;
}

export async function checkIn(placeId: string, userId: string | null): Promise<void> {
  const row = userId
    ? { place_id: placeId, user_id: userId, device_fingerprint: getDeviceFingerprint() }
    : { place_id: placeId, user_id: null, device_fingerprint: getDeviceFingerprint() };
  const { error } = await supabase.from("checkins").insert(row);
  if (error && error.code !== "23505") throw error; // ignore unique-violation (already checked in)
}

/** Counts per place_id for a given list. */
export async function getCheckinCountsBulk(placeIds: string[]): Promise<Record<string, number>> {
  if (!placeIds.length) return {};
  const { data } = await supabase
    .from("checkins").select("place_id").in("place_id", placeIds);
  const out: Record<string, number> = {};
  (data || []).forEach((r: any) => { out[r.place_id] = (out[r.place_id] || 0) + 1; });
  return out;
}

export interface RecentCheckin { place_id: string; checked_in_at: string; }

/** Most-recent distinct places that got check-ins. */
export async function getRecentlyCheckedIn(limit = 5): Promise<{ place_id: string; last_at: string; today_count: number }[]> {
  const { data } = await supabase
    .from("checkins")
    .select("place_id, checked_in_at")
    .order("checked_in_at", { ascending: false })
    .limit(200);
  const seen = new Map<string, { last_at: string; today_count: number }>();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  (data || []).forEach((r: any) => {
    const ts = r.checked_in_at;
    const isToday = new Date(ts) >= startOfToday;
    const cur = seen.get(r.place_id);
    if (!cur) seen.set(r.place_id, { last_at: ts, today_count: isToday ? 1 : 0 });
    else if (isToday) cur.today_count += 1;
    if (seen.size >= limit && !cur) {/* keep going to count today's */}
  });
  return Array.from(seen.entries()).slice(0, limit).map(([place_id, v]) => ({ place_id, ...v }));
}

/** Trending — last 7 days. Returns sorted [{place_id, score, weekly_count}]. */
const TRENDING_CACHE = "mhs_trending_v1";
const TRENDING_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface TrendingEntry { place_id: string; weekly_count: number; score: number; }
export interface TrendingCache { computed_at: number; entries: TrendingEntry[]; }

export async function getTrendingThisWeek(force = false): Promise<TrendingCache> {
  if (!force) {
    try {
      const raw = localStorage.getItem(TRENDING_CACHE);
      if (raw) {
        const cached: TrendingCache = JSON.parse(raw);
        if (Date.now() - cached.computed_at < TRENDING_TTL_MS) return cached;
      }
    } catch { /* ignore */ }
  }
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("checkins").select("place_id").gte("checked_in_at", since);
  const counts = new Map<string, number>();
  (data || []).forEach((r: any) => counts.set(r.place_id, (counts.get(r.place_id) || 0) + 1));
  const entries: TrendingEntry[] = Array.from(counts.entries())
    .map(([place_id, weekly_count]) => ({ place_id, weekly_count, score: weekly_count * 3 }))
    .sort((a, b) => b.score - a.score);
  const cache: TrendingCache = { computed_at: Date.now(), entries };
  try { localStorage.setItem(TRENDING_CACHE, JSON.stringify(cache)); } catch { /* ignore */ }
  return cache;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function isNewPlace(createdAtIso: string | undefined | null): boolean {
  if (!createdAtIso) return false;
  return Date.now() - new Date(createdAtIso).getTime() < 30 * 24 * 60 * 60 * 1000;
}
