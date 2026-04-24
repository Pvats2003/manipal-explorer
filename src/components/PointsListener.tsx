import { useEffect, useState } from "react";
import type { BadgeDef, PointsAwardedDetail } from "@/lib/explorer";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Mounts globally. Listens to:
 *  - "karavali:points" → bottom-right "+X pts" toast
 *  - "karavali:badge"  → full-screen celebration overlay
 * Also refreshes the auth profile so the score number animates up.
 */
export default function PointsListener() {
  const { refreshProfile } = useAuth();
  const [toasts, setToasts] = useState<{ id: number; points: number }[]>([]);
  const [badge, setBadge] = useState<BadgeDef | null>(null);

  useEffect(() => {
    const onPoints = (e: Event) => {
      const { points } = (e as CustomEvent<PointsAwardedDetail>).detail;
      const id = Date.now() + Math.random();
      setToasts((cur) => [...cur, { id, points }]);
      setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 2000);
      // Profile update happens server-side via trigger; refetch.
      refreshProfile();
    };
    const onBadge = (e: Event) => {
      const def = (e as CustomEvent<BadgeDef>).detail;
      setBadge(def);
      setTimeout(() => setBadge((b) => (b?.id === def.id ? null : b)), 2200);
    };
    window.addEventListener("karavali:points", onPoints);
    window.addEventListener("karavali:badge", onBadge);
    return () => {
      window.removeEventListener("karavali:points", onPoints);
      window.removeEventListener("karavali:badge", onBadge);
    };
  }, [refreshProfile]);

  return (
    <>
      {/* Points toast stack — bottom right */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-full bg-primary px-4 py-2 font-display text-base font-bold text-primary-foreground shadow-elevated animate-fade-in"
          >
            +{t.points} pts
          </div>
        ))}
      </div>

      {/* Badge celebration overlay */}
      {badge && (
        <button
          type="button"
          onClick={() => setBadge(null)}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-black/70 px-6 text-center backdrop-blur-sm animate-fade-in"
          aria-label="Dismiss celebration"
        >
          <h2 className="font-display text-3xl font-bold text-white animate-scale-in md:text-4xl">
            New Badge Unlocked! 🎉
          </h2>
          <div className="text-[80px] leading-none animate-scale-in">{badge.emoji}</div>
          <div className="font-display text-2xl font-bold text-secondary">{badge.name}</div>
          <div className="text-sm text-white/70">{badge.desc}</div>
        </button>
      )}
    </>
  );
}