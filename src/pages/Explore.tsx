import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DestinationCard from "@/components/DestinationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Destination } from "@/lib/types";
import { getCheckinCountsBulk, isNewPlace } from "@/lib/checkins";
import { getOpenStatus } from "@/lib/openingHours";
import { Search, Plus, Wallet, Sparkles, Clock, X, Flame, MapPin, Gem } from "lucide-react";

type Budget = "any" | "free" | "low" | "mid";
type Time = "any" | "open" | "morning" | "evening";
type Mood = "any" | string;

export default function Explore() {
  const navigate = useNavigate();
  const [all, setAll] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState<Budget>("any");
  const [mood, setMood] = useState<Mood>("any");
  const [time, setTime] = useState<Time>("any");
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("destinations")
        .select("*")
        .order("rating", { ascending: false });
      const list = (data as Destination[]) || [];
      setAll(list);
      setLoading(false);
      if (list.length) getCheckinCountsBulk(list.map((d) => d.id)).then(setCounts);
    })();
  }, []);

  const moods = useMemo(() => {
    const set = new Set<string>();
    all.forEach((d) => (d.moods || []).forEach((m) => set.add(m)));
    return Array.from(set).sort().slice(0, 8);
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((d) => {
      if (q) {
        const hay = `${d.name} ${d.description} ${d.category} ${(d.activities || []).join(" ")} ${(d.moods || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const cost = (d.entry_fee || 0) + (d.food_cost || 0) + (d.transport_cost || 0);
      if (budget === "free" && cost > 0) return false;
      if (budget === "low" && cost > 200) return false;
      if (budget === "mid" && (cost <= 200 || cost > 600)) return false;
      if (mood !== "any" && !(d.moods || []).includes(mood)) return false;
      if (time === "open") {
        const s = getOpenStatus(d.opening_hours);
        if (!s || (s.state !== "open" && s.state !== "closing-soon")) return false;
      }
      return true;
    });
  }, [all, query, budget, mood, time]);

  const trending = useMemo(
    () => [...filtered].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0)).slice(0, 6),
    [filtered, counts],
  );
  const nearby = useMemo(
    () => [...filtered].sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0)).slice(0, 6),
    [filtered],
  );
  const hidden = useMemo(
    () => filtered.filter((d) => (counts[d.id] || 0) <= 2 && !isNewPlace(d.created_at)).slice(0, 6),
    [filtered, counts],
  );

  const filtersActive = budget !== "any" || mood !== "any" || time !== "any" || !!query.trim();
  const reset = () => { setQuery(""); setBudget("any"); setMood("any"); setTime("any"); };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-12">
      <Navbar />

      {/* Sticky search header */}
      <div className="sticky top-16 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container max-w-5xl space-y-3 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cafes, beaches, viewpoints..."
              className="h-12 rounded-full border-border bg-card pl-11 pr-10 text-sm shadow-card focus-visible:ring-primary/40"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter chip rows */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
            <ChipGroup
              icon={<Wallet className="h-3 w-3" />}
              label="Budget"
              value={budget}
              options={[
                { v: "any", l: "Any" },
                { v: "free", l: "Free" },
                { v: "low", l: "Under ₹200" },
                { v: "mid", l: "₹200–600" },
              ]}
              onChange={(v) => setBudget(v as Budget)}
            />
            <ChipGroup
              icon={<Sparkles className="h-3 w-3" />}
              label="Mood"
              value={mood}
              options={[{ v: "any", l: "Any" }, ...moods.map((m) => ({ v: m, l: m }))]}
              onChange={(v) => setMood(v)}
            />
            <ChipGroup
              icon={<Clock className="h-3 w-3" />}
              label="Time"
              value={time}
              options={[
                { v: "any", l: "Anytime" },
                { v: "open", l: "Open now" },
              ]}
              onChange={(v) => setTime(v as Time)}
            />
            {filtersActive && (
              <button
                onClick={reset}
                className="shrink-0 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-5xl px-4 py-6 space-y-10">
        {loading ? (
          <SectionSkeleton />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            <p className="font-display text-xl font-bold">No places match those filters</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing a filter or searching something else.</p>
            <Button variant="outline" className="mt-4" onClick={reset}>Reset filters</Button>
          </div>
        ) : filtersActive ? (
          // When filters are active, show flat results — easier to scan
          <Section
            title={`${filtered.length} match${filtered.length === 1 ? "" : "es"}`}
            subtitle="Filtered for you"
            icon={<Sparkles className="h-4 w-4" />}
            items={filtered}
            counts={counts}
          />
        ) : (
          <>
            <Section title="Trending now" subtitle="Most visited this week" icon={<Flame className="h-4 w-4 text-accent" />} items={trending} counts={counts} />
            <Section title="Near you" subtitle="Closest to Manipal" icon={<MapPin className="h-4 w-4 text-primary" />} items={nearby} counts={counts} />
            {hidden.length > 0 && (
              <Section title="Hidden gems" subtitle="Quiet spots most students miss" icon={<Gem className="h-4 w-4 text-secondary-foreground" />} items={hidden} counts={counts} />
            )}
            <Section title="All places" subtitle={`Browse all ${filtered.length}`} icon={<Sparkles className="h-4 w-4" />} items={filtered} counts={counts} />
          </>
        )}
      </div>

      {/* Floating Add CTA */}
      <button
        onClick={() => navigate("/submit")}
        aria-label="Add a place"
        className="fixed bottom-20 right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-gradient-hero px-5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-105 active:scale-95 md:bottom-8"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} /> Add a place
      </button>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  items,
  counts,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: Destination[];
  counts: Record<string, number>;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {icon} {subtitle}
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => (
          <DestinationCard key={d.id} destination={d} checkinCount={counts[d.id] || 0} />
        ))}
      </div>
    </section>
  );
}

function ChipGroup({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  const active = value !== "any";
  const current = options.find((o) => o.v === value);
  return (
    <div className="relative shrink-0">
      <details className="group">
        <summary className={`flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-smooth ${
          active
            ? "border-primary bg-primary text-primary-foreground shadow-card"
            : "border-border bg-card text-foreground hover:border-primary/40"
        }`}>
          {icon}
          <span>{label}</span>
          {active && current && <span className="opacity-90">· {current.l}</span>}
        </summary>
        <div className="absolute left-0 top-full z-40 mt-2 flex flex-col gap-1 rounded-xl border border-border bg-card p-2 shadow-elevated min-w-[160px]">
          {options.map((o) => (
            <button
              key={o.v}
              onClick={(e) => {
                onChange(o.v);
                (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
              }}
              className={`rounded-md px-3 py-1.5 text-left text-xs font-semibold capitalize transition-colors ${
                value === o.v
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-10">
      {[0, 1].map((s) => (
        <div key={s}>
          <Skeleton className="mb-4 h-7 w-44" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
