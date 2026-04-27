import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Destination } from "@/lib/types";
import { ArrowLeft, Heart, MapPin, Star, Bookmark, ExternalLink, Clock, Share2 } from "lucide-react";
import { toast } from "sonner";
import CheckInButton from "@/components/CheckInButton";
import PlanningHere from "@/components/experiences/PlanningHere";

export default function DestinationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dest, setDest] = useState<Destination | null>(null);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("destinations").select("*").eq("id", id).single().then(({ data }) => {
      setDest(data as Destination);
    });
    if (user) {
      supabase.from("saved_trips").select("id").eq("user_id", user.id).eq("destination_id", id).maybeSingle()
        .then(({ data }) => setSaved(!!data));
      supabase.from("likes").select("id").eq("user_id", user.id).eq("destination_id", id).maybeSingle()
        .then(({ data }) => setLiked(!!data));
    }
  }, [id, user]);

  const requireAuth = () => {
    if (!user) {
      toast.info("Sign in to save trips");
      navigate("/auth");
      return false;
    }
    return true;
  };

  const toggleSave = async () => {
    if (!requireAuth() || !dest) return;
    if (saved) {
      await supabase.from("saved_trips").delete().eq("user_id", user!.id).eq("destination_id", dest.id);
      setSaved(false);
      toast.success("Removed from saved");
    } else {
      await supabase.from("saved_trips").insert([{ user_id: user!.id, destination_id: dest.id }]);
      setSaved(true);
      toast.success("Saved to your trips!");
    }
  };

  const toggleLike = async () => {
    if (!requireAuth() || !dest) return;
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user!.id).eq("destination_id", dest.id);
      setLiked(false);
    } else {
      await supabase.from("likes").insert([{ user_id: user!.id, destination_id: dest.id }]);
      setLiked(true);
    }
  };

  if (!dest) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Navbar />
        <div className="container max-w-5xl space-y-4 px-4 py-6">
          <div className="h-72 animate-pulse rounded-2xl bg-muted md:h-[420px]" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const totalCost = dest.transport_cost + dest.food_cost + dest.stay_cost + dest.entry_fee;
  const mapsUrl = dest.latitude && dest.longitude
    ? `https://www.google.com/maps?q=${dest.latitude},${dest.longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(dest.name + " Karnataka")}`;
  const mapsEmbed = dest.latitude && dest.longitude
    ? `https://maps.google.com/maps?q=${dest.latitude},${dest.longitude}&z=12&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(dest.name + " Karnataka")}&z=10&output=embed`;

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <Navbar />

      {/* Immersive hero — ~40% of viewport on mobile, fixed-tall on desktop */}
      <div className="relative h-[44vh] min-h-[280px] w-full overflow-hidden bg-gradient-hero md:h-[420px]">
        {dest.image_url && (
          <img src={dest.image_url} alt={dest.name} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow backdrop-blur transition-smooth hover:scale-105"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={async () => {
            const url = window.location.href;
            if (navigator.share) { try { await navigator.share({ title: dest.name, url }); } catch {} }
            else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
          }}
          aria-label="Share"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow backdrop-blur transition-smooth hover:scale-105"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      <div className="container max-w-5xl space-y-6 px-4 pb-6">
        {/* Floating title card overlapping the hero */}
        <div className="-mt-16 rounded-2xl border border-border/50 bg-card p-5 shadow-elevated md:p-6">
          <Badge className="mb-2 bg-secondary/40 capitalize text-secondary-foreground">{dest.category}</Badge>
          <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">{dest.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" /> {dest.rating}/10
            </span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {dest.distance_km} km</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {dest.duration_type === "day" ? "Day trip" : "Multi-day"}</span>
            {dest.best_time && <span className="hidden sm:inline">📅 Best: {dest.best_time}</span>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              ₹{totalCost} <span className="text-[11px] font-medium text-primary/70">total est.</span>
            </span>
            <Button onClick={toggleLike} variant={liked ? "default" : "outline"} size="sm" className="ml-auto">
              <Heart className={`mr-1.5 h-4 w-4 ${liked ? "fill-current" : ""}`} /> {liked ? "Liked" : "Like"}
            </Button>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1.5 h-4 w-4" /> Maps
              </Button>
            </a>
          </div>
        </div>

        <Card className="bg-gradient-card p-5 shadow-card">
          <CheckInButton placeId={dest.id} placeCategory={dest.category} />
        </Card>

        <PlanningHere destinationId={dest.id} />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card className="bg-gradient-card p-6 shadow-card">
              <h2 className="mb-3 text-xl font-bold">About</h2>
              <p className="text-muted-foreground">{dest.description}</p>
            </Card>

            <Card className="bg-gradient-card p-6 shadow-card">
              <h2 className="mb-3 text-xl font-bold">Things to do</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {dest.activities.map((a) => (
                  <li key={a} className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-secondary">▸</span> {a}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="overflow-hidden bg-gradient-card shadow-card">
              <iframe
                src={mapsEmbed}
                className="h-72 w-full border-0"
                loading="lazy"
                title={`Map of ${dest.name}`}
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-card p-6 shadow-card">
              <h2 className="mb-3 text-xl font-bold">Budget</h2>
              <div className="space-y-2 text-sm">
                <Row label="Transport" value={dest.transport_cost} />
                <Row label="Food" value={dest.food_cost} />
                {dest.stay_cost > 0 && <Row label="Stay" value={dest.stay_cost} />}
                <Row label="Entry fees" value={dest.entry_fee} />
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Estimated total</span>
                  <span className="text-primary">₹{totalCost}</span>
                </div>
                <p className="text-xs text-muted-foreground">Per person, from Manipal</p>
              </div>
            </Card>

            <Card className="bg-gradient-card p-6 shadow-card">
              <h2 className="mb-3 text-xl font-bold">Vibes</h2>
              <div className="flex flex-wrap gap-1.5">
                {dest.moods.map((m) => <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>)}
              </div>
              <h3 className="mt-4 mb-2 text-sm font-semibold">Good for</h3>
              <div className="flex flex-wrap gap-1.5">
                {dest.travel_types.map((t) => <Badge key={t} variant="outline" className="capitalize">{t}</Badge>)}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA bar (mobile-first) */}
      <div
        className="fixed bottom-[64px] left-0 right-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div className="container max-w-5xl flex items-center gap-2 px-0">
          <div className="hidden flex-1 sm:block">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Estimated</div>
            <div className="font-display text-lg font-bold text-primary">₹{totalCost}<span className="text-xs font-medium text-muted-foreground"> /person</span></div>
          </div>
          <Button
            onClick={toggleSave}
            variant={saved ? "default" : "outline"}
            className="flex-1 sm:flex-none"
            size="lg"
          >
            <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Save"}
          </Button>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
            <Button className="w-full bg-gradient-hero text-primary-foreground hover:opacity-95" size="lg">
              <MapPin className="mr-2 h-4 w-4" /> Get directions
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">₹{value}</span>
    </div>
  );
}