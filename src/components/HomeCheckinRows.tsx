import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Destination } from "@/lib/types";
import { getRecentlyCheckedIn, getTrendingThisWeek, relativeTime, isNewPlace, getCheckinCountsBulk, type TrendingCache } from "@/lib/checkins";
import { Flame, Sparkles, Footprints, Clock4 } from "lucide-react";

type DestWithMeta = Destination & { created_at?: string };

function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-3 pt-1">
      {children}
    </div>
  );
}

function PlaceMini({ dest, badge, footer, isNew }: { dest: DestWithMeta; badge?: React.ReactNode; footer: React.ReactNode; isNew?: boolean }) {
  return (
    <Link to={`/destination/${dest.id}`} className="group block w-72 shrink-0 snap-start">
      <Card className="h-full overflow-hidden border-border/40 bg-gradient-card shadow-card transition-all duration-500 ease-premium hover:shadow-glow hover:-translate-y-2 hover:border-primary/30">
        <div className="relative h-36 bg-gradient-hero overflow-hidden">
          {dest.image_url && (
            <img src={dest.image_url} alt={dest.name} loading="lazy" className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-sunset transition-opacity duration-500 group-hover:opacity-80" />
          {badge && <div className="absolute left-3 top-3 transition-transform duration-300 group-hover:scale-105">{badge}</div>}
          {isNew && (
            <div className="absolute right-3 top-3 rounded-lg bg-secondary px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary-foreground shadow-lg animate-pulse-soft">
              NEW
            </div>
          )}
          <div className="absolute bottom-3 left-4 right-4 text-white transition-transform duration-500 group-hover:translate-y-[-2px]">
            <h3 className="line-clamp-1 font-display text-lg font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">{dest.name}</h3>
          </div>
        </div>
        <div className="space-y-2 p-4">
          {footer}
        </div>
      </Card>
    </Link>
  );
}

export function TrendingThisWeek() {
  const [trending, setTrending] = useState<TrendingCache | null>(null);
  const [destMap, setDestMap] = useState<Record<string, DestWithMeta>>({});

  useEffect(() => {
    (async () => {
      const cache = await getTrendingThisWeek();
      setTrending(cache);
      const ids = cache.entries.slice(0, 5).map((e) => e.place_id);
      if (ids.length) {
        const { data } = await supabase.from("destinations").select("*").in("id", ids);
        const map: Record<string, DestWithMeta> = {};
        (data || []).forEach((d: any) => { map[d.id] = d; });
        setDestMap(map);
      }
    })();
  }, []);

  if (!trending) return null;
  const top = trending.entries.slice(0, 5).filter((e) => destMap[e.place_id]);
  if (top.length === 0) return null;

  const updatedMins = Math.max(0, Math.floor((Date.now() - trending.computed_at) / 60000));

  return (
    <section className="container px-4 py-14">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="flex items-center gap-3 font-display text-2xl font-bold md:text-3xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 transition-transform duration-300 hover:scale-110">
                <Flame className="h-5 w-5 text-accent" />
              </span>
              Trending this week
            </h2>
            <p className="text-sm text-muted-foreground pl-[52px]">Where MIT students are checking in right now.</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Clock4 className="h-3.5 w-3.5" /> Updated {updatedMins === 0 ? "just now" : `${updatedMins} min${updatedMins === 1 ? "" : "s"} ago`}
          </span>
        </div>
        <ScrollRow>
          {top.map((entry, idx) => {
            const dest = destMap[entry.place_id];
            const topVibe = dest.moods?.[0];
            return (
              <PlaceMini
                key={entry.place_id}
                dest={dest}
                isNew={isNewPlace(dest.created_at)}
                badge={
                  <div className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-extrabold text-accent-foreground shadow-lg">
                    <Flame className="h-3.5 w-3.5" /> #{idx + 1}
                  </div>
                }
                footer={
                  <>
                    <div className="text-xs font-semibold text-accent">
                      {entry.weekly_count * 3} interactions this week
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {topVibe && <span className="capitalize rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{topVibe}</span>}
                      <span>👣 {entry.weekly_count}</span>
                    </div>
                  </>
                }
              />
            );
          })}
        </ScrollRow>
      </div>
    </section>
  );
}

export function RecentlyCheckedIn() {
  const [items, setItems] = useState<{ dest: DestWithMeta; today_count: number; last_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const recents = await getRecentlyCheckedIn(5);
      if (!recents.length) return;
      const ids = recents.map((r) => r.place_id);
      const { data } = await supabase.from("destinations").select("*").in("id", ids);
      const map: Record<string, DestWithMeta> = {};
      (data || []).forEach((d: any) => { map[d.id] = d; });
      setItems(recents.filter((r) => map[r.place_id]).map((r) => ({ dest: map[r.place_id], today_count: r.today_count, last_at: r.last_at })));
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="container px-4 py-14">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="space-y-1">
          <h2 className="flex items-center gap-3 font-display text-2xl font-bold md:text-3xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 hover:scale-110">
              <Footprints className="h-5 w-5 text-primary" />
            </span>
            Recently checked in
          </h2>
          <p className="text-sm text-muted-foreground pl-[52px]">Live community pulse from across campus.</p>
        </div>
        <ScrollRow>
          {items.map(({ dest, today_count, last_at }) => (
            <PlaceMini
              key={dest.id}
              dest={dest}
              isNew={isNewPlace(dest.created_at)}
              footer={
                <>
                  <div className="text-xs font-semibold text-primary">
                    {today_count > 0
                      ? `${today_count} student${today_count === 1 ? "" : "s"} checked in today`
                      : `Last visit ${relativeTime(last_at)}`}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">{dest.category}</div>
                </>
              }
            />
          ))}
        </ScrollRow>
      </div>
    </section>
  );
}

export function RisingNewThisMonth() {
  const [items, setItems] = useState<{ dest: DestWithMeta; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("destinations").select("*").gte("created_at", since);
      const newPlaces = (data || []) as DestWithMeta[];
      if (!newPlaces.length) { setItems([]); return; }
      const counts = await getCheckinCountsBulk(newPlaces.map((d) => d.id));
      const sorted = newPlaces
        .map((d) => ({ dest: d, count: counts[d.id] || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setItems(sorted);
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="container px-4 pb-16">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="space-y-1">
          <h2 className="flex items-center gap-3 font-display text-2xl font-bold md:text-3xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 transition-transform duration-300 hover:scale-110">
              <Sparkles className="h-5 w-5 text-secondary" />
            </span>
            Rising &mdash; new this month
          </h2>
          <p className="text-sm text-muted-foreground pl-[52px]">Just added to Karavali.</p>
        </div>
        <ScrollRow>
          {items.map(({ dest, count }) => (
            <PlaceMini
              key={dest.id}
              dest={dest}
              isNew
              footer={
                <>
                  <div className="text-xs font-semibold text-secondary">👣 {count} check-in{count === 1 ? "" : "s"} so far</div>
                  <div className="text-xs text-muted-foreground capitalize">{dest.category}</div>
                </>
              }
            />
          ))}
        </ScrollRow>
      </div>
    </section>
  );
}
