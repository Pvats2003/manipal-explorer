import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Destination } from "@/lib/types";
import type { CommunityEvent } from "@/lib/events";
import { categoryMeta } from "@/lib/events";
import { Trash2, Plus, ShieldAlert, EyeOff, Eye, CalendarHeart, MapPin, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Footer from "@/components/Footer";
import { mapCategoryToken, costToBudgetTier, costToFoodCost } from "@/lib/submitOptions";

interface PlaceSubmission {
  id: string;
  name: string;
  description: string;
  category: string;
  maps_link: string | null;
  vibes: string[];
  cost_range: string;
  best_times: string[];
  opening_hours: string | null;
  pro_tip: string | null;
  image_url: string | null;
  submitter_batch: number | null;
  status: string;
  submitted_at: string;
  submitted_by: string | null;
}

const empty = {
  name: "", description: "", category: "beach", moods: "chill", travel_types: "solo,friends,partner",
  distance_km: 10, duration_type: "day", budget_tier: "low",
  transport_cost: 0, food_cost: 0, stay_cost: 0, entry_fee: 0, rating: 8,
  activities: "", best_time: "",
};

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Destination[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [submissions, setSubmissions] = useState<PlaceSubmission[]>([]);
  const [form, setForm] = useState(empty);

  const load = () => {
    supabase.from("destinations").select("*").order("name").then(({ data }) => {
      setItems((data as Destination[]) || []);
    });
    supabase.from("events").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setEvents((data as CommunityEvent[]) || []);
    });
    supabase.from("place_submissions").select("*").eq("status", "pending").order("submitted_at", { ascending: false }).then(({ data }) => {
      setSubmissions((data as PlaceSubmission[]) || []);
    });
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl px-4 py-12">
          <Card className="flex flex-col items-center gap-4 p-12 text-center">
            <ShieldAlert className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-bold">Admins only</h2>
            <p className="text-muted-foreground">Ask the project owner to grant you the admin role in the database.</p>
          </Card>
        </div>
      </div>
    );
  }

  const addDest = async () => {
    if (!form.name || !form.description) return toast.error("Name + description required");
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      moods: form.moods.split(",").map((s) => s.trim()).filter(Boolean),
      travel_types: form.travel_types.split(",").map((s) => s.trim()).filter(Boolean),
      distance_km: Number(form.distance_km),
      duration_type: form.duration_type,
      budget_tier: form.budget_tier,
      transport_cost: Number(form.transport_cost),
      food_cost: Number(form.food_cost),
      stay_cost: Number(form.stay_cost),
      entry_fee: Number(form.entry_fee),
      rating: Number(form.rating),
      activities: form.activities.split(",").map((s) => s.trim()).filter(Boolean),
      best_time: form.best_time || null,
    };
    const { error } = await supabase.from("destinations").insert([payload]);
    if (error) toast.error(error.message);
    else { toast.success("Added!"); setForm(empty); load(); }
  };

  const remove = async (id: string) => {
    await supabase.from("destinations").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  const toggleHide = async (ev: CommunityEvent) => {
    const { error } = await supabase.from("events").update({ hidden: !ev.hidden }).eq("id", ev.id);
    if (error) { toast.error("Failed"); return; }
    toast.success(ev.hidden ? "Event restored" : "Event hidden");
    load();
  };

  const removeEvent = async (id: string) => {
    if (!confirm("Delete this event permanently?")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event deleted");
    load();
  };

  const approveSubmission = async (s: PlaceSubmission) => {
    const { error: insErr } = await supabase.from("destinations").insert([{
      name: s.name,
      description: s.description,
      category: mapCategoryToken(s.category),
      moods: s.vibes,
      travel_types: ["solo", "friends", "partner"],
      distance_km: 5,
      duration_type: "day",
      budget_tier: costToBudgetTier(s.cost_range),
      transport_cost: 0,
      food_cost: costToFoodCost(s.cost_range),
      stay_cost: 0,
      entry_fee: 0,
      rating: 8,
      activities: [],
      image_url: s.image_url,
      best_time: s.best_times.join(", ") || null,
    }]);
    if (insErr) { toast.error(insErr.message); return; }
    const { error: updErr } = await supabase.from("place_submissions")
      .update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", s.id);
    if (updErr) { toast.error(updErr.message); return; }
    if (s.submitted_by) {
      // +50 explorer points
      const { data: prof } = await supabase.from("profiles").select("explorer_score").eq("user_id", s.submitted_by).maybeSingle();
      const score = (prof?.explorer_score ?? 0) + 50;
      await supabase.from("profiles").update({ explorer_score: score }).eq("user_id", s.submitted_by);
    }
    toast.success("Approved & added to destinations");
    load();
  };

  const rejectSubmission = async (id: string) => {
    if (!confirm("Reject this submission?")) return;
    const { error } = await supabase.from("place_submissions")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rejected");
    load();
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl space-y-8 px-4 py-8">
        <h1 className="text-3xl font-bold">Admin · Destinations</h1>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Pending submissions ({submissions.length})</h2>
          </div>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending submissions. 🌴</p>
          ) : submissions.map((s) => (
            <Card key={s.id} className="overflow-hidden bg-gradient-card shadow-card">
              <div className="flex flex-col gap-4 md:flex-row">
                {s.image_url && (
                  <img src={s.image_url} alt={s.name} className="h-40 w-full object-cover md:h-auto md:w-48" />
                )}
                <div className="flex-1 space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.category} · submitted {format(new Date(s.submitted_at), "d MMM, h:mm a")}
                        {s.submitter_batch && ` · Batch ${s.submitter_batch}`}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => approveSubmission(s)} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        <Check className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectSubmission(s.id)}>
                        <X className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm">{s.description}</p>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {s.vibes.map((v) => <span key={v} className="rounded-full bg-primary/10 px-2 py-0.5 capitalize text-primary">{v}</span>)}
                    {s.best_times.map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5">{t}</span>)}
                    <span className="rounded-full bg-muted px-2 py-0.5">Cost: {s.cost_range}</span>
                    {s.opening_hours && <span className="rounded-full bg-muted px-2 py-0.5">⏰ {s.opening_hours}</span>}
                  </div>
                  {s.pro_tip && <p className="text-xs italic text-muted-foreground">💡 {s.pro_tip}</p>}
                  {s.maps_link && (
                    <a href={s.maps_link} target="_blank" rel="noreferrer" className="inline-block text-xs font-semibold text-primary underline">
                      View map →
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="space-y-4 bg-gradient-card p-6 shadow-card">
          <h2 className="text-xl font-bold">Add new destination</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Category"><Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="beach, trek..." /></Field>
            <div className="md:col-span-2"><Field label="Description"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
            <Field label="Moods (comma)"><Input value={form.moods} onChange={(e) => set("moods", e.target.value)} /></Field>
            <Field label="Travel types"><Input value={form.travel_types} onChange={(e) => set("travel_types", e.target.value)} /></Field>
            <Field label="Distance (km)"><Input type="number" value={form.distance_km} onChange={(e) => set("distance_km", e.target.value)} /></Field>
            <Field label="Duration"><Input value={form.duration_type} onChange={(e) => set("duration_type", e.target.value)} placeholder="day or multi" /></Field>
            <Field label="Budget tier"><Input value={form.budget_tier} onChange={(e) => set("budget_tier", e.target.value)} placeholder="low/medium/high" /></Field>
            <Field label="Rating /10"><Input type="number" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)} /></Field>
            <Field label="Transport ₹"><Input type="number" value={form.transport_cost} onChange={(e) => set("transport_cost", e.target.value)} /></Field>
            <Field label="Food ₹"><Input type="number" value={form.food_cost} onChange={(e) => set("food_cost", e.target.value)} /></Field>
            <Field label="Stay ₹"><Input type="number" value={form.stay_cost} onChange={(e) => set("stay_cost", e.target.value)} /></Field>
            <Field label="Entry ₹"><Input type="number" value={form.entry_fee} onChange={(e) => set("entry_fee", e.target.value)} /></Field>
            <div className="md:col-span-2"><Field label="Activities (comma)"><Input value={form.activities} onChange={(e) => set("activities", e.target.value)} /></Field></div>
            <Field label="Best time"><Input value={form.best_time} onChange={(e) => set("best_time", e.target.value)} /></Field>
          </div>
          <Button onClick={addDest} className="bg-gradient-hero"><Plus className="mr-2 h-4 w-4" /> Add destination</Button>
        </Card>

        <div className="space-y-3">
          <h2 className="text-xl font-bold">All destinations ({items.length})</h2>
          {items.map((d) => (
            <Card key={d.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.category} · {d.distance_km}km · ⭐{d.rating}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(d.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarHeart className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Community events ({events.length})</h2>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : events.map((ev) => {
            const cat = categoryMeta(ev.category);
            return (
              <Card key={ev.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 ${ev.hidden ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span>{cat.emoji}</span>
                    <div className="font-semibold truncate">{ev.title}</div>
                    {ev.hidden && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">Hidden</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {format(new Date(ev.starts_at), "d MMM, h:mm a")} · {ev.location}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toggleHide(ev)} title={ev.hidden ? "Restore" : "Hide"}>
                    {ev.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeEvent(ev.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}