import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DestinationCard from "@/components/DestinationCard";
import AISpots from "@/components/AISpots";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { scoreDestinations } from "@/lib/recommendation";
import type { Destination, ScoredDestination, UserPreferences } from "@/lib/types";
import { isOpenNow } from "@/lib/openingHours";
import { ArrowLeft, Check, Sparkles, Star, Filter, X, Clock } from "lucide-react";

export default function Recommendations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState<ScoredDestination[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVibes, setActiveVibes] = useState<string[]>([]);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("mhs_prefs");
    if (!stored) {
      navigate("/");
      return;
    }
    const p: UserPreferences = JSON.parse(stored);
    setPrefs(p);
    try {
      const ch = sessionStorage.getItem("mhs_chat");
      if (ch) setChatHistory(JSON.parse(ch));
    } catch { /* ignore */ }

    (async () => {
      const { data } = await supabase.from("destinations").select("*");
      let pastCats: string[] = [];
      if (user) {
        const { data: hist } = await supabase
          .from("trip_history")
          .select("selected_destination_id, destinations(category)")
          .eq("user_id", user.id)
          .not("selected_destination_id", "is", null)
          .limit(10);
        pastCats = (hist || []).map((h: any) => h.destinations?.category).filter(Boolean);
      }
      const scored = scoreDestinations((data as Destination[]) || [], p, pastCats);
      setResults(scored);
      setLoading(false);
    })();
  }, [navigate, user]);

  if (loading || !prefs) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-20 text-center">
          <div className="mx-auto h-12 w-12 animate-float rounded-full bg-gradient-hero shadow-glow" />
          <p className="mt-4 text-muted-foreground">Finding your perfect spots...</p>
        </div>
      </div>
    );
  }

  const vibesPresent = Array.from(new Set(results.flatMap((r) => r.moods))).sort();

  // AND logic; if <3 results, fallback to OR
  let filterMode: "and" | "or" | "none" = "none";
  let filtered = results;
  if (activeVibes.length > 0) {
    const andMatch = results.filter((r) => activeVibes.every((v) => r.moods.includes(v)));
    if (andMatch.length >= 3) {
      filtered = andMatch;
      filterMode = "and";
    } else {
      filtered = results.filter((r) => activeVibes.some((v) => r.moods.includes(v)));
      filterMode = "or";
    }
  }
  if (openNowOnly) filtered = filtered.filter((r) => isOpenNow(r.opening_hours));

  const top = filtered.slice(0, 2);
  const others = filtered.slice(2, 8);

  const toggleVibe = (v: string) =>
    setActiveVibes((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl space-y-6 px-4 py-6 md:py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Edit preferences
        </Button>

        <div className="space-y-2 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <Sparkles className="h-4 w-4" /> Top picks for you
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">Your hidden spots</h1>
          <div className="flex flex-wrap gap-2 pt-1">
            {prefs.moods.map((m) => <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>)}
            <Badge variant="outline" className="capitalize">{prefs.budget} budget · ₹{prefs.budgetAmount}</Badge>
            <Badge variant="outline" className="capitalize">{prefs.duration === "day" ? "Day trip" : "Multi-day"}</Badge>
            <Badge variant="outline" className="capitalize">{prefs.travelType}</Badge>
          </div>
        </div>

        {/* AI-powered, real-world spots with timings, contact, maps */}
        <AISpots prefs={prefs} chatHistory={chatHistory} />

        <div className="pt-4">
          <h2 className="text-2xl font-bold">From our curated collection</h2>
          <p className="text-sm text-muted-foreground">Spots from our local database, ranked for your vibe.</p>
        </div>

        {/* Sticky vibe filter bar */}
        <div className="sticky top-14 z-30 -mx-4 space-y-2 border-y border-border/50 glass px-4 py-2.5 md:mx-0 md:rounded-2xl md:border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide">
              {vibesPresent.map((vibe) => {
                const active = activeVibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    onClick={() => toggleVibe(vibe)}
                    className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-smooth ${
                      active
                        ? "border-transparent bg-gradient-hero text-primary-foreground shadow-glow"
                        : "border-border bg-background/60 text-foreground hover:border-primary/40 hover:bg-muted"
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {vibe}
                  </button>
                );
              })}
            </div>
            <label className="ml-2 flex shrink-0 items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              Open now
              <Switch checked={openNowOnly} onCheckedChange={setOpenNowOnly} />
            </label>
          </div>
          {(activeVibes.length > 0 || openNowOnly) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{filtered.length} match{filtered.length === 1 ? "" : "es"}</span>
              {filterMode === "or" && activeVibes.length > 1 && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-400">
                  Showing places matching <strong>any</strong> selected vibe (too few exact matches)
                </span>
              )}
              <button
                onClick={() => { setActiveVibes([]); setOpenNowOnly(false); }}
                className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            </div>
          )}
        </div>

        {top.length === 0 ? (
          <Card className="p-8 text-center">No matches found. Try broadening your preferences.</Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {top.map((dest, i) => (
              <Card
                key={dest.id}
                style={{ animationDelay: `${i * 80}ms` }}
                className="overflow-hidden border-border/50 bg-gradient-card shadow-card animate-scale-in hover-lift"
              >
                <div className="relative h-56 bg-gradient-hero">
                  {dest.image_url && <img src={dest.image_url} alt={dest.name} loading="lazy" className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-sunset" />
                  <div className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-sm font-bold backdrop-blur">
                    {i === 0 ? "🏆 Best match" : "✨ Runner-up"}
                  </div>
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-sm font-bold backdrop-blur">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {dest.rating}/10
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-3xl font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{dest.name}</h2>
                    <p className="text-sm text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{dest.distance_km}km · {dest.category}</p>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <p className="text-sm text-muted-foreground">{dest.description}</p>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Why it fits you</h3>
                    <ul className="space-y-1">
                      {dest.reasons.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Things to do</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {dest.activities.slice(0, 4).map((a) => (
                        <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Budget breakdown</span>
                      <span className="text-primary">≈ ₹{dest.totalCost}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2"><span>Transport</span><span>₹{dest.transport_cost}</span></div>
                      <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2"><span>Food</span><span>₹{dest.food_cost}</span></div>
                      {prefs.duration === "multi" && (
                        <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2"><span>Stay</span><span>₹{dest.stay_cost}</span></div>
                      )}
                      <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2"><span>Entry</span><span>₹{dest.entry_fee}</span></div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => navigate(`/destination/${dest.id}`)}>
                    View full details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {others.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold">Also worth checking out</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {others.map((d, idx) => (
                <div key={d.id} style={{ animationDelay: `${idx * 60}ms` }} className="animate-fade-in">
                  <DestinationCard destination={d} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}