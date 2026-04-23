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
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
      {children}
    </div>
  );
}

function PlaceMini({ dest, badge, footer, isNew }: { dest: DestWithMeta; badge?: React.ReactNode; footer: React.ReactNode; isNew?: boolean }) {
  return (
    <Link to={`/destination/${dest.id}`} className="group block w-64 shrink-0 snap-start">
      <Card className="h-full overflow-hidden border-border/50 bg-gradient-card shadow-card transition-smooth hover:shadow-glow hover:-translate-y-1">
        <div className="relative h-32 bg-gradient-hero overflow-hidden">
          {dest.image_url && (
            <img src={dest.image_url} alt={dest.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-sunset" />
          {badge && <div className="absolute left-3 top-3">{badge}</div>}
          {isNew && (
            <div className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-secondary-foreground shadow-md">
              NEW
            </div>
          )}
          <div className="absolute bottom-2 left-3 right-3 text-white">
            <h3 className="line-clamp-1 text-base font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{dest.name}</h3>
          </div>
        </div>
        <div className="space-y-1 p-3">
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
    <section className="container px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <Flame className="h-6 w-6 text-orange-500" /> Trending this week
            </h2>
            <p className="text-sm text-muted-foreground">Where MIT students are checking in right now.</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock4 className="h-3 w-3" /> Updated {updatedMins === 0 ? "just now" : `${updatedMins} min${updatedMins === 1 ? "" : "s"} ago`}
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
                  <div className="flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
                    <Flame className="h-3 w-3" /> #{idx + 1}
                  </div>
                }
                footer={
                  <>
                    <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">
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
    <section className="container px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <Footprints className="h-6 w-6 text-primary" /> Recently checked in
          </h2>
          <p className="text-sm text-muted-foreground">Live community pulse from across campus.</p>
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
    <section className="container px-4 pb-12">
      <div className="mx-auto max-w-6xl space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <Sparkles className="h-6 w-6 text-secondary" /> Rising — new this month
          </h2>
          <p className="text-sm text-muted-foreground">Just added to Karavali.</p>
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
