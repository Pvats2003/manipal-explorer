import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventForm from "@/components/EventForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EVENT_CATEGORIES, isUpcoming, withinRange, type CommunityEvent, categoryMeta, downloadIcs } from "@/lib/events";
import { CalendarHeart, Plus, Search, MapPin, Calendar, Trash2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { fetchExperiences, type Experience } from "@/lib/experiences";
import ExperienceCard from "@/components/experiences/ExperienceCard";
import CreateExperienceDialog from "@/components/experiences/CreateExperienceDialog";
import { Skeleton } from "@/components/ui/skeleton";

type Range = "all" | "week" | "month";

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [myRsvps, setMyRsvps] = useState<Set<string>>(new Set());
  const [activeCat, setActiveCat] = useState<string>("all");
  const [range, setRange] = useState<Range>("all");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // Plan a trip (experiences) state
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [expCounts, setExpCounts] = useState<Record<string, number>>({});
  const [expLoading, setExpLoading] = useState(true);
  const [createTripOpen, setCreateTripOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("hidden", false)
      .eq("status", "approved")
      .order("starts_at", { ascending: true });
    if (error) { toast.error("Couldn't load events"); setLoading(false); return; }
    const list = (data as CommunityEvent[]) || [];
    setEvents(list);

    if (list.length > 0) {
      const ids = list.map((e) => e.id);
      const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("event_id, user_id")
        .in("event_id", ids);
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      (rsvps || []).forEach((r: any) => {
        counts[r.event_id] = (counts[r.event_id] || 0) + 1;
        if (user && r.user_id === user.id) mine.add(r.event_id);
      });
      setRsvpCounts(counts);
      setMyRsvps(mine);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const loadExperiences = async () => {
    setExpLoading(true);
    try {
      const xs = await fetchExperiences();
      setExperiences(xs);
      if (xs.length) {
        const { data } = await supabase
          .from("experience_attendees")
          .select("experience_id")
          .in("experience_id", xs.map((x) => x.id));
        const c: Record<string, number> = {};
        (data || []).forEach((r: any) => { c[r.experience_id] = (c[r.experience_id] || 0) + 1; });
        setExpCounts(c);
      }
    } catch (e: any) {
      toast.error(e.message || "Couldn't load trips");
    } finally { setExpLoading(false); }
  };

  useEffect(() => { loadExperiences(); }, []);

  // open ?id=... in detail dialog
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      const e = events.find((x) => x.id === id);
      if (e) setDetail(e);
    }
  }, [events]);

  const toggleRsvp = async (ev: CommunityEvent) => {
    if (!user) { toast.error("Sign in to RSVP"); navigate("/auth"); return; }
    if (myRsvps.has(ev.id)) {
      const { error } = await supabase.from("event_rsvps").delete().eq("event_id", ev.id).eq("user_id", user.id);
      if (error) { toast.error("Couldn't remove"); return; }
      const next = new Set(myRsvps); next.delete(ev.id); setMyRsvps(next);
      setRsvpCounts((c) => ({ ...c, [ev.id]: Math.max(0, (c[ev.id] || 1) - 1) }));
    } else {
      const { error } = await supabase.from("event_rsvps").insert({ event_id: ev.id, user_id: user.id });
      if (error) { toast.error("Couldn't RSVP"); return; }
      const next = new Set(myRsvps); next.add(ev.id); setMyRsvps(next);
      setRsvpCounts((c) => ({ ...c, [ev.id]: (c[ev.id] || 0) + 1 }));
      toast.success("You're going! 🎉");
    }
  };

  const removeMine = async (ev: CommunityEvent) => {
    if (!user || ev.created_by !== user.id) return;
    const ok = confirm("Delete this event?");
    if (!ok) return;
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    if (error) { toast.error("Couldn't delete"); return; }
    toast.success("Deleted");
    setDetail(null);
    load();
  };

  const filtered = useMemo(() => {
    return events
      .filter(isUpcoming)
      .filter((e) => activeCat === "all" || e.category === activeCat)
      .filter((e) => withinRange(e, range))
      .filter((e) => !q || (e.title + " " + e.description + " " + e.location).toLowerCase().includes(q.toLowerCase()));
  }, [events, activeCat, range, q]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="outline" className="gap-1"><CalendarHeart className="h-3 w-3" /> Live Events Board</Badge>
            <h1 className="text-3xl font-extrabold md:text-4xl">What's happening in Manipal</h1>
            <p className="text-muted-foreground">Fests, gigs, food pop-ups, beach parties — and group trips, all in one place.</p>
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="events"><CalendarHeart className="mr-1.5 h-4 w-4" /> Events</TabsTrigger>
            <TabsTrigger value="trips"><Sparkles className="mr-1.5 h-4 w-4" /> Plan a trip</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => user ? setFormOpen(true) : navigate("/auth")} className="bg-gradient-hero shadow-glow">
                <Plus className="mr-1.5 h-4 w-4" /> Post event
              </Button>
            </div>
            <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="pl-9" />
          </div>

          <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide">
            <div className="flex gap-2 whitespace-nowrap">
              <Button size="sm" variant={activeCat === "all" ? "default" : "outline"} onClick={() => setActiveCat("all")} className={activeCat === "all" ? "bg-gradient-hero shadow-glow" : ""}>All</Button>
              {EVENT_CATEGORIES.map((c) => (
                <Button key={c.id} size="sm" variant={activeCat === c.id ? "default" : "outline"} onClick={() => setActiveCat(c.id)} className={activeCat === c.id ? "bg-gradient-hero shadow-glow" : ""}>
                  <span className="mr-1.5">{c.emoji}</span> {c.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "week", "month"] as Range[]).map((r) => (
              <Button key={r} size="sm" variant={range === r ? "secondary" : "ghost"} onClick={() => setRange(r)}>
                {r === "all" ? "Anytime" : r === "week" ? "This week" : "This month"}
              </Button>
            ))}
          </div>
            </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <div className="text-5xl">📭</div>
            <h2 className="mt-3 text-lg font-bold">No events here yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {events.length === 0 ? "Be the first to post one!" : "Try changing filters or searching for something else."}
            </p>
            <Button className="mt-4 bg-gradient-hero shadow-glow" onClick={() => user ? setFormOpen(true) : navigate("/auth")}>
              <Plus className="mr-1.5 h-4 w-4" /> Post the first event
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                rsvpCount={rsvpCounts[ev.id] || 0}
                isGoing={myRsvps.has(ev.id)}
                onToggleRsvp={() => toggleRsvp(ev)}
                onClick={() => setDetail(ev)}
              />
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="trips" className="mt-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">
                  <Sparkles className="mr-1 inline h-5 w-5 text-secondary" />
                  Plan a trip
                </h2>
                <p className="text-sm text-muted-foreground">Group trips & community plans by Karavali explorers.</p>
              </div>
              <Button onClick={() => user ? setCreateTripOpen(true) : navigate("/auth")} className="bg-gradient-hero shadow-glow">
                <Plus className="mr-1.5 h-4 w-4" /> New plan
              </Button>
            </div>

            {expLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
              </div>
            ) : experiences.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
                <div className="text-5xl">🗺️</div>
                <h2 className="mt-3 text-lg font-bold">No trips planned yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">Be the first to plan something for the community.</p>
                <Button className="mt-4 bg-gradient-hero shadow-glow" onClick={() => user ? setCreateTripOpen(true) : navigate("/auth")}>
                  <Plus className="mr-1.5 h-4 w-4" /> Create the first one
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {experiences.map((x) => (
                  <ExperienceCard
                    key={x.id}
                    experience={x}
                    attendeeCount={expCounts[x.id] || 0}
                    onClick={() => navigate(`/experiences/${x.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EventForm open={formOpen} onOpenChange={setFormOpen} onCreated={load} />
      <CreateExperienceDialog open={createTripOpen} onOpenChange={setCreateTripOpen} onCreated={loadExperiences} />

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{detail.title}</DialogTitle>
              </DialogHeader>
              {detail.image_url && (
                <img src={detail.image_url} alt={detail.title} className="aspect-[16/9] w-full rounded-xl object-cover" />
              )}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>{categoryMeta(detail.category).emoji} {categoryMeta(detail.category).label}</Badge>
                  <Badge variant="outline">{rsvpCounts[detail.id] || 0} going</Badge>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{detail.description}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {format(new Date(detail.starts_at), "EEEE, d MMM yyyy · h:mm a")}{detail.ends_at && ` – ${format(new Date(detail.ends_at), "h:mm a")}`}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" /> {detail.location}</div>
                  {detail.organizer && <div className="text-muted-foreground">Organized by {detail.organizer}</div>}
                  {detail.link && (
                    <a href={detail.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      More details <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => toggleRsvp(detail)} className={myRsvps.has(detail.id) ? "" : "bg-gradient-hero shadow-glow"} variant={myRsvps.has(detail.id) ? "outline" : "default"}>
                    {myRsvps.has(detail.id) ? "✓ You're going" : "I'm going"}
                  </Button>
                  <Button variant="outline" onClick={() => downloadIcs(detail)}>Add to calendar</Button>
                  {user?.id === detail.created_by && (
                    <Button variant="destructive" onClick={() => removeMine(detail)}>
                      <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
