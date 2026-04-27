import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Destination } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark, MapPin, Clock, Wallet, Users, Sparkles, Flame, Plus,
  Heart, Share2, ChevronRight, ShieldCheck, GraduationCap, CalendarHeart,
} from "lucide-react";
import { getCheckinCountsBulk, isNewPlace, relativeTime } from "@/lib/checkins";
import { getOpenStatus } from "@/lib/openingHours";
import { format } from "date-fns";

type FeedItemType = "place" | "experience" | "event" | "trip";

interface PlaceCard {
  type: "place";
  id: string;
  destination: Destination;
  saves: number;
  checkins: number;
  costEstimate: number;
  timeNeeded: string;
  tags: string[];
  verified: boolean;
}
interface ExperienceCard {
  type: "experience";
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  budget: number;
  image: string | null;
  attendees: number;
}
interface EventCard {
  type: "event";
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  starts_at: string;
  image: string | null;
}
type FeedItem = PlaceCard | ExperienceCard | EventCard;

const QUICK_FILTERS = [
  { id: "all", label: "For you", icon: Sparkles },
  { id: "under200", label: "Under ₹200", icon: Wallet },
  { id: "open", label: "Open now", icon: Clock },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "new", label: "New", icon: Plus },
  { id: "date", label: "Date spot", icon: Heart },
] as const;

type FilterId = typeof QUICK_FILTERS[number]["id"];

export default function SmartFeed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const [destsRes, expsRes, evtsRes] = await Promise.all([
        supabase.from("destinations").select("*").order("rating", { ascending: false }),
        supabase.from("experiences").select("*").gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(8),
        supabase.from("events").select("*").eq("status", "approved").eq("hidden", false).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(8),
      ]);
      const dests = (destsRes.data || []) as Destination[];

      const ids = dests.map((d) => d.id);
      const [counts, savesData, expAtt] = await Promise.all([
        getCheckinCountsBulk(ids),
        supabase.from("saved_trips").select("destination_id").in("destination_id", ids),
        supabase.from("experience_attendees").select("experience_id"),
      ]);
      const savesByDest: Record<string, number> = {};
      (savesData.data || []).forEach((r: any) => {
        savesByDest[r.destination_id] = (savesByDest[r.destination_id] || 0) + 1;
      });
      const attByExp: Record<string, number> = {};
      (expAtt.data || []).forEach((r: any) => {
        attByExp[r.experience_id] = (attByExp[r.experience_id] || 0) + 1;
      });

      const placeCards: PlaceCard[] = dests.map((d) => ({
        type: "place",
        id: d.id,
        destination: d,
        saves: savesByDest[d.id] || 0,
        checkins: counts[d.id] || 0,
        costEstimate: (d.entry_fee || 0) + (d.food_cost || 0) + (d.transport_cost || 0),
        timeNeeded: d.duration_type === "day" ? "2–4 hrs" : "Full day+",
        tags: deriveTags(d),
        verified: true, // every destination in DB is curated/community-verified
      }));

      const expCards: ExperienceCard[] = (expsRes.data || []).map((e: any) => ({
        type: "experience",
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        starts_at: e.starts_at,
        budget: e.budget_estimate,
        image: e.image_url,
        attendees: attByExp[e.id] || 0,
      }));

      const evtCards: EventCard[] = (evtsRes.data || []).map((e: any) => ({
        type: "event",
        id: e.id,
        title: e.title,
        description: e.description,
        category: e.category,
        location: e.location,
        starts_at: e.starts_at,
        image: e.image_url,
      }));

      setItems(interleave(placeCards, expCards, evtCards));
      setLoading(false);

      if (user) {
        const { data } = await supabase.from("saved_trips").select("destination_id").eq("user_id", user.id);
        setSavedIds(new Set((data || []).map((r: any) => r.destination_id)));
      }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => {
      if (it.type !== "place") return filter === "trending" || filter === "new" ? false : true;
      const p = it as PlaceCard;
      if (filter === "under200") return p.costEstimate <= 200;
      if (filter === "open") {
        const s = getOpenStatus(p.destination.opening_hours);
        return s?.state === "open" || s?.state === "closing-soon";
      }
      if (filter === "trending") return p.checkins >= 1 || p.saves >= 1;
      if (filter === "new") return isNewPlace(p.destination.created_at);
      if (filter === "date") return p.tags.some((t) => /date|romantic|sunset|chill/i.test(t));
      return true;
    });
  }, [items, filter]);

  const toggleSave = async (destId: string) => {
    if (!user) { navigate("/auth"); return; }
    const isSaved = savedIds.has(destId);
    if (isSaved) {
      await supabase.from("saved_trips").delete().eq("user_id", user.id).eq("destination_id", destId);
      setSavedIds((s) => { const n = new Set(s); n.delete(destId); return n; });
    } else {
      await supabase.from("saved_trips").insert([{ user_id: user.id, destination_id: destId }]);
      setSavedIds((s) => new Set(s).add(destId));
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick filter chips */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-border/40 bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {QUICK_FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-smooth ${
                filter === id
                  ? "border-primary bg-primary text-primary-foreground shadow-card"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="h-80 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-gradient-card p-8 text-center">
          <p className="font-semibold">Nothing here for that filter yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another vibe — or be the first to add a spot.</p>
          <Button className="mt-4 bg-gradient-hero" onClick={() => navigate("/submit")}>
            <Plus className="mr-1.5 h-4 w-4" /> Add a place
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((it) =>
            it.type === "place" ? (
              <PlaceFeedCard
                key={`p-${it.id}`}
                card={it as PlaceCard}
                saved={savedIds.has(it.id)}
                onSave={() => toggleSave(it.id)}
              />
            ) : it.type === "experience" ? (
              <ExperienceFeedCard key={`e-${it.id}`} card={it as ExperienceCard} />
            ) : (
              <EventFeedCard key={`v-${it.id}`} card={it as EventCard} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function PlaceFeedCard({ card, saved, onSave }: { card: PlaceCard; saved: boolean; onSave: () => void }) {
  const d = card.destination;
  const status = getOpenStatus(d.opening_hours);
  return (
    <Card className="overflow-hidden border-border/60 bg-card shadow-card transition-smooth hover-lift">
      <Link to={`/destination/${d.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {d.image_url ? (
            <img src={d.image_url} alt={d.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-hero text-5xl">🌴</div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/80">
                  {d.category}
                  {card.verified && (
                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      <ShieldCheck className="h-2.5 w-2.5" /> Verified
                    </span>
                  )}
                  {isNewPlace(d.created_at) && (
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-extrabold text-secondary-foreground">NEW</span>
                  )}
                </div>
                <h3 className="mt-0.5 line-clamp-1 text-xl font-bold text-white drop-shadow">{d.name}</h3>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-foreground">
                ⭐ {d.rating}/10
              </div>
            </div>
          </div>
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">{d.description}</p>

        {/* Key chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Chip icon={<Wallet className="h-3 w-3" />} text={card.costEstimate ? `₹${card.costEstimate}` : "Free"} tone="primary" />
          <Chip icon={<MapPin className="h-3 w-3" />} text={`${d.distance_km} km`} />
          <Chip icon={<Clock className="h-3 w-3" />} text={card.timeNeeded} />
          {status && (
            <Chip
              icon={<span className={`inline-block h-1.5 w-1.5 rounded-full ${status.state === "open" ? "bg-green-500" : status.state === "closing-soon" ? "bg-amber-500" : "bg-red-500"}`} />}
              text={status.label}
              tone={status.state === "open" ? "success" : "muted"}
            />
          )}
        </div>

        {/* Vibe tags */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold capitalize text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Social proof + actions */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary" />
            {card.saves > 0 ? (
              <span><span className="font-bold text-foreground">{card.saves}</span> student{card.saves === 1 ? "" : "s"} saved</span>
            ) : card.checkins > 0 ? (
              <span><span className="font-bold text-foreground">{card.checkins}</span> been here</span>
            ) : (
              <span>Be the first to save this</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.preventDefault(); onSave(); }}
              className={`h-8 gap-1.5 px-2 text-xs ${saved ? "text-primary" : ""}`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved" : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async (e) => {
                e.preventDefault();
                const url = `${window.location.origin}/destination/${d.id}`;
                if (navigator.share) {
                  try { await navigator.share({ title: d.name, url }); } catch {}
                } else {
                  await navigator.clipboard.writeText(url);
                }
              }}
              className="h-8 px-2"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ExperienceFeedCard({ card }: { card: ExperienceCard }) {
  return (
    <Link to={`/experiences/${card.id}`}>
      <Card className="overflow-hidden border-secondary/40 bg-gradient-card shadow-card transition-smooth hover-lift">
        <div className="flex">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden bg-muted">
            {card.image ? (
              <img src={card.image} alt={card.title} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-hero text-3xl">✨</div>
            )}
          </div>
          <div className="flex-1 space-y-1.5 p-3">
            <Badge variant="outline" className="gap-1 border-secondary/60 text-secondary"><Sparkles className="h-3 w-3" /> Trip with students</Badge>
            <h3 className="line-clamp-1 font-bold">{card.title}</h3>
            <p className="line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarHeart className="h-3 w-3 text-primary" />{format(new Date(card.starts_at), "d MMM")}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{card.location}</span>
              <span className="flex items-center gap-1"><Wallet className="h-3 w-3" />₹{card.budget}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{card.attendees} going</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EventFeedCard({ card }: { card: EventCard }) {
  return (
    <Link to="/events">
      <Card className="overflow-hidden border-accent/40 bg-card shadow-card transition-smooth hover-lift">
        <div className="flex">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden bg-muted">
            {card.image ? (
              <img src={card.image} alt={card.title} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent text-3xl">🎉</div>
            )}
          </div>
          <div className="flex-1 space-y-1.5 p-3">
            <Badge variant="outline" className="gap-1 border-accent text-accent-foreground capitalize">
              <Flame className="h-3 w-3" /> {card.category} event
            </Badge>
            <h3 className="line-clamp-1 font-bold">{card.title}</h3>
            <p className="line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarHeart className="h-3 w-3 text-accent-foreground" />{format(new Date(card.starts_at), "EEE, d MMM")}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{card.location}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Chip({ icon, text, tone = "default" }: { icon: React.ReactNode; text: string; tone?: "default" | "primary" | "success" | "muted" }) {
  const cls =
    tone === "primary" ? "bg-primary/10 text-primary"
    : tone === "success" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : tone === "muted" ? "bg-muted text-muted-foreground"
    : "bg-card border border-border text-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${cls}`}>
      {icon} {text}
    </span>
  );
}

function deriveTags(d: Destination): string[] {
  const tags = new Set<string>();
  (d.moods || []).forEach((m) => tags.add(m));
  if ((d.entry_fee || 0) + (d.food_cost || 0) <= 200) tags.add("budget");
  if (d.duration_type === "day") tags.add("day-trip");
  if (d.distance_km <= 5) tags.add("near-campus");
  return Array.from(tags);
}

function interleave(places: PlaceCard[], exps: ExperienceCard[], evts: EventCard[]): FeedItem[] {
  const out: FeedItem[] = [];
  let pi = 0, ei = 0, vi = 0;
  while (pi < places.length || ei < exps.length || vi < evts.length) {
    if (pi < places.length) out.push(places[pi++]);
    if (pi < places.length) out.push(places[pi++]);
    if (ei < exps.length) out.push(exps[ei++]);
    if (pi < places.length) out.push(places[pi++]);
    if (vi < evts.length) out.push(evts[vi++]);
  }
  return out;
}
