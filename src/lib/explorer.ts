import { supabase } from "@/integrations/supabase/client";

export type ExplorerEventType =
  | "checkin"
  | "photo_upload"
  | "tip_upvoted"
  | "bucket_complete"
  | "itinerary_saved"
  | "submission_approved";

export const EVENT_POINTS: Record<ExplorerEventType, number> = {
  checkin: 10,
  photo_upload: 25,
  tip_upvoted: 15,
  bucket_complete: 5,
  itinerary_saved: 5,
  submission_approved: 50,
};

export const EVENT_LABEL: Record<ExplorerEventType, { icon: string; verb: string }> = {
  checkin: { icon: "📍", verb: "Checked in" },
  photo_upload: { icon: "📸", verb: "Uploaded a photo" },
  tip_upvoted: { icon: "💬", verb: "Tip got upvoted" },
  bucket_complete: { icon: "✅", verb: "Bucket list item" },
  itinerary_saved: { icon: "🗺️", verb: "Saved an itinerary" },
  submission_approved: { icon: "🌴", verb: "Place approved" },
};

export interface BadgeDef {
  id: string;
  emoji: string;
  name: string;
  desc: string;
}

export const BADGES: BadgeDef[] = [
  { id: "explorer", emoji: "🌱", name: "Explorer", desc: "First check-in" },
  { id: "adventurer", emoji: "🗺️", name: "Adventurer", desc: "10 check-ins" },
  { id: "photographer", emoji: "📸", name: "Photographer", desc: "5 photos uploaded" },
  { id: "sage", emoji: "💬", name: "Sage", desc: "10 helpful tips" },
  { id: "beach", emoji: "🌊", name: "Beach Bum", desc: "5 beach check-ins" },
  { id: "owl", emoji: "🦉", name: "Night Owl", desc: "5 late-night check-ins" },
  { id: "legend", emoji: "🏆", name: "Wanderlust Legend", desc: "100% bucket list" },
];

/**
 * Custom event channel for in-app celebrations (toast + score animation + badge overlay).
 * Components subscribe; logExplorerEvent dispatches.
 */
export type PointsAwardedDetail = { points: number; type: ExplorerEventType };
export type BadgeEarnedDetail = BadgeDef;

export function emitPointsAwarded(detail: PointsAwardedDetail) {
  window.dispatchEvent(new CustomEvent("karavali:points", { detail }));
}
export function emitBadgeEarned(detail: BadgeEarnedDetail) {
  window.dispatchEvent(new CustomEvent("karavali:badge", { detail }));
}

/**
 * Insert an explorer event for the logged-in user. The DB trigger increments
 * profiles.explorer_score automatically. After insertion, evaluate badge thresholds.
 */
export async function logExplorerEvent(opts: {
  userId: string;
  type: ExplorerEventType;
  referenceId?: string;
  /** Override the default points if needed (e.g. submission_approved is 50). */
  points?: number;
  /** Optional context for badge evaluation (e.g. place category). */
  context?: { placeCategory?: string; checkinHourLocal?: number };
}) {
  const points = opts.points ?? EVENT_POINTS[opts.type];
  const { error } = await supabase.from("explorer_events").insert({
    user_id: opts.userId,
    event_type: opts.type,
    points_awarded: points,
    reference_id: opts.referenceId ?? null,
  });
  if (error) {
    console.error("logExplorerEvent failed", error);
    return;
  }
  emitPointsAwarded({ points, type: opts.type });
  // Fire-and-forget badge evaluation
  evaluateBadges(opts.userId, opts.type, opts.context).catch((e) =>
    console.error("badge eval failed", e),
  );
}

async function alreadyHasBadge(userId: string, badgeId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();
  return !!data;
}

async function awardBadge(userId: string, badgeId: string) {
  if (await alreadyHasBadge(userId, badgeId)) return;
  const { error } = await supabase.from("user_badges").insert({ user_id: userId, badge_id: badgeId });
  if (error) {
    if (error.code === "23505") return; // duplicate
    console.error("awardBadge failed", error);
    return;
  }
  const def = BADGES.find((b) => b.id === badgeId);
  if (def) {
    emitBadgeEarned(def);
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge",
      message: `You earned the ${def.name} badge! ${def.emoji}`,
    });
  }
}

async function evaluateBadges(
  userId: string,
  type: ExplorerEventType,
  context?: { placeCategory?: string; checkinHourLocal?: number },
) {
  if (type === "checkin") {
    const { count: checkins } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((checkins ?? 0) >= 1) await awardBadge(userId, "explorer");
    if ((checkins ?? 0) >= 10) await awardBadge(userId, "adventurer");

    if (context?.placeCategory && /beach/i.test(context.placeCategory)) {
      // count beach check-ins
      const { data } = await supabase
        .from("checkins")
        .select("place_id, destinations!inner(category)")
        .eq("user_id", userId);
      const beachCount = (data || []).filter((r: any) =>
        /beach/i.test(r.destinations?.category || ""),
      ).length;
      if (beachCount >= 5) await awardBadge(userId, "beach");
    }

    // Night Owl badge: track late-night check-ins client-side until we
    // store hour-of-day on the event. Counts only genuine late check-ins.
    if (context?.checkinHourLocal !== undefined) {
      const h = context.checkinHourLocal;
      const isLate = h >= 22 || h < 4;
      if (isLate && typeof window !== "undefined") {
        const key = `karavali_late_checkins_${userId}`;
        const n = Number(localStorage.getItem(key) || "0") + 1;
        localStorage.setItem(key, String(n));
        if (n >= 5) await awardBadge(userId, "owl");
      }
    }
  }

  if (type === "bucket_complete") {
    const { count: completed } = await supabase
      .from("bucket_list_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    // 45 = total bucket items (see src/lib/bucketList.ts)
    if ((completed ?? 0) >= 45) await awardBadge(userId, "legend");
  }

  if (type === "photo_upload") {
    const { count } = await supabase
      .from("explorer_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", "photo_upload");
    if ((count ?? 0) >= 5) await awardBadge(userId, "photographer");
  }
}