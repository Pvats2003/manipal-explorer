import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, MapPin, Clock, Phone, ExternalLink, Navigation, Lightbulb,
  AlertTriangle, IndianRupee, Heart, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserPreferences } from "@/lib/types";
import SpotsFollowupChat from "./SpotsFollowupChat";

export interface AISpot {
  name: string;
  category: string;
  area: string;
  distance_km_from_manipal: number;
  travel_time_minutes?: number;
  description: string;
  why_for_you: string;
  best_time_to_visit?: string;
  opening_hours?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  google_maps_query: string;
  latitude?: number;
  longitude?: number;
  estimated_cost_per_person_inr: number;
  budget_tier: string;
  transport_tip: string;
  what_to_order_or_do: string[];
  insider_tip?: string;
  avoid_if?: string;
  vibe_match_score: number;
}

interface AIResult {
  mood_reading: string;
  vibe_tags: string[];
  spots: AISpot[];
}

interface Props {
  prefs: UserPreferences;
  chatHistory: { role: string; content: string }[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  beach: "🏖", trek: "🥾", waterfall: "💦", viewpoint: "🌅",
  cafe: "☕", restaurant: "🍽", bar: "🍻", lounge: "🍷",
  nightlife: "🎶", temple: "🛕", hangout: "📸", nature: "🌿", shopping: "🛍",
};

export default function AISpots({ prefs, chatHistory }: Props) {
  const [data, setData] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: err } = await supabase.functions.invoke("ai-spots", {
          body: { preferences: prefs, chatHistory },
        });
        if (cancelled) return;
        if (err) throw err;
        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
          return;
        }
        setData(res as AIResult);
      } catch (e: unknown) {
        if (cancelled) return;
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        console.error(errorMessage);
        setError("Couldn't reach Vibe Concierge. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [prefs, chatHistory]);

  if (loading) {
    return (
      <Card className="flex flex-col items-center gap-3 border-primary/20 bg-gradient-card p-10 text-center shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-hero shadow-glow">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
        <div>
          <div className="text-lg font-bold">Vibe is reading your mood…</div>
          <p className="text-sm text-muted-foreground">Picking spots that actually fit how you feel today.</p>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        {error || "Couldn't fetch personalized spots."}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mood reading */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-card shadow-card animate-fade-in">
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-hero shadow-glow">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">How you're feeling</div>
            <p className="text-base leading-relaxed">{data.mood_reading}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {data.vibe_tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Hand-picked spots for your vibe</h2>
        <Badge variant="outline" className="ml-auto">{data.spots.length} spots</Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {data.spots.map((s, i) => {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.google_maps_query)}`;
          const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.google_maps_query)}&origin=Manipal+University,+Karnataka`;
          const emoji = CATEGORY_EMOJI[s.category] || "📍";
          return (
            <Card
              key={`${s.name}-${i}`}
              style={{ animationDelay: `${i * 60}ms` }}
              className="overflow-hidden border-border/50 bg-gradient-card shadow-card animate-fade-in hover-lift"
            >
              <div className="space-y-4 p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl">{emoji}</span>
                      <h3 className="text-xl font-bold leading-tight">{s.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.area}</span>
                      <span>·</span>
                      <span>{s.distance_km_from_manipal} km</span>
                      {s.travel_time_minutes && <><span>·</span><span>~{s.travel_time_minutes} min</span></>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    <Sparkles className="h-3 w-3" />{s.vibe_match_score}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>

                {/* Why for you */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Heart className="h-3.5 w-3.5" /> Why this fits you
                  </div>
                  <p className="text-sm">{s.why_for_you}</p>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {s.opening_hours && (
                    <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div><div className="text-xs text-muted-foreground">Hours</div><div>{s.opening_hours}</div></div>
                    </div>
                  )}
                  {s.best_time_to_visit && (
                    <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div><div className="text-xs text-muted-foreground">Best time</div><div>{s.best_time_to_visit}</div></div>
                    </div>
                  )}
                  <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div><div className="text-xs text-muted-foreground">Per person</div><div>≈ ₹{s.estimated_cost_per_person_inr} <span className="text-xs text-muted-foreground capitalize">({s.budget_tier})</span></div></div>
                  </div>
                  {s.contact_phone && (
                    <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Contact</div>
                        <a href={`tel:${s.contact_phone}`} className="text-primary hover:underline">{s.contact_phone}</a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Things to do / order */}
                {s.what_to_order_or_do?.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {["cafe", "restaurant", "bar", "lounge"].includes(s.category) ? "What to order" : "What to do"}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.what_to_order_or_do.map((a) => (
                        <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transport */}
                <div className="flex items-start gap-2 rounded-lg bg-secondary/10 px-3 py-2 text-sm">
                  <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <div><span className="font-semibold">Getting there: </span>{s.transport_tip}</div>
                </div>

                {/* Insider tip */}
                {s.insider_tip && (
                  <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                    <div><span className="font-semibold">Insider tip: </span>{s.insider_tip}</div>
                  </div>
                )}

                {/* Avoid */}
                {s.avoid_if && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div><span className="font-semibold">Skip if: </span>{s.avoid_if}</div>
                  </div>
                )}

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" className="bg-gradient-hero shadow-glow">
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-1.5 h-4 w-4" /> View on Maps
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={dirUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="mr-1.5 h-4 w-4" /> Directions
                    </a>
                  </Button>
                  {s.website && (
                    <Button asChild size="sm" variant="ghost">
                      <a href={s.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5 h-4 w-4" /> Website
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <SpotsFollowupChat spots={data.spots} moodReading={data.mood_reading} />
    </div>
  );
}
