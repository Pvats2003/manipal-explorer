import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DestinationCard from "@/components/DestinationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Destination } from "@/lib/types";
import { getCheckinCountsBulk } from "@/lib/checkins";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type SortKey = "rating" | "distance" | "newest" | "popular";

export default function Explore() {
  const [all, setAll] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [activeMood, setActiveMood] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("rating");
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
      if (list.length) {
        getCheckinCountsBulk(list.map((d) => d.id)).then(setCounts);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    all.forEach((d) => d.category && set.add(d.category));
    return Array.from(set).sort();
  }, [all]);

  const moods = useMemo(() => {
    const set = new Set<string>();
    all.forEach((d) => (d.moods || []).forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = all.filter((d) => {
      if (activeCat !== "all" && d.category !== activeCat) return false;
      if (activeMood !== "all" && !(d.moods || []).includes(activeMood)) return false;
      if (q) {
        const hay = `${d.name} ${d.description} ${d.category} ${(d.activities || []).join(" ")} ${(d.moods || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "distance") return (a.distance_km || 0) - (b.distance_km || 0);
      if (sortBy === "newest") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortBy === "popular") return (counts[b.id] || 0) - (counts[a.id] || 0);
      return 0;
    });
    return list;
  }, [all, query, activeCat, activeMood, sortBy, counts]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <header className="border-b border-border/60 bg-gradient-card">
        <div className="container px-4 py-8 md:py-10">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Browse Karavali
            </div>
            <h1 className="font-display text-3xl font-bold md:text-5xl">
              Every place. Real names. Real info.
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              All {all.length} restaurants, cafes, beaches, hotels and spots verified for the Manipal–Udupi region. Search, filter, and dive in.
            </p>

            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places, cuisines, vibes…"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="container px-4 py-6">
        <div className="mx-auto max-w-6xl space-y-5">
          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            <CatChip active={activeCat === "all"} onClick={() => setActiveCat("all")} label="All" count={all.length} />
            {categories.map((c) => (
              <CatChip
                key={c}
                active={activeCat === c}
                onClick={() => setActiveCat(c)}
                label={c}
                count={all.filter((d) => d.category === c).length}
              />
            ))}
          </div>

          {/* Mood + sort row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" /> Vibe
            </div>
            <div className="flex flex-wrap gap-1.5">
              <MoodChip active={activeMood === "all"} onClick={() => setActiveMood("all")} label="Any" />
              {moods.map((m) => (
                <MoodChip key={m} active={activeMood === m} onClick={() => setActiveMood(m)} label={m} />
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top rated</SelectItem>
                  <SelectItem value="popular">Most visited</SelectItem>
                  <SelectItem value="distance">Closest first</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading places…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
              <p className="text-lg font-semibold">No places match those filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing a filter or searching something else.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setQuery(""); setActiveCat("all"); setActiveMood("all"); }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> place{filtered.length === 1 ? "" : "s"}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((d) => (
                  <DestinationCard key={d.id} destination={d} checkinCount={counts[d.id] || 0} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CatChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold capitalize transition-smooth ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-card"
          : "border-border bg-card text-foreground hover:border-primary/40"
      }`}
    >
      {label} <span className={`ml-1 text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{count}</span>
    </button>
  );
}

function MoodChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-smooth ${
        active ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/40"
      }`}
    >
      {label}
    </button>
  );
}
