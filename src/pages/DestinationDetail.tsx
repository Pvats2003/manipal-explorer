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
import { ArrowLeft, Heart, MapPin, Star, Bookmark, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import CheckInButton from "@/components/CheckInButton";

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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-20 text-center text-muted-foreground">Loading...</div>
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl space-y-6 px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="relative h-64 overflow-hidden rounded-2xl bg-gradient-hero md:h-80">
          {dest.image_url && <img src={dest.image_url} alt={dest.name} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-sunset" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <Badge className="mb-2 bg-background/90 capitalize text-foreground">{dest.category}</Badge>
            <h1 className="text-4xl font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] md:text-5xl">{dest.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-primary-glow text-primary-glow" /> {dest.rating}/10</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {dest.distance_km}km from Manipal</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {dest.duration_type === "day" ? "Day trip" : "Multi-day"}</span>
              {dest.best_time && <span>📅 Best: {dest.best_time}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={toggleSave} variant={saved ? "default" : "outline"}>
            <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Save trip"}
          </Button>
          <Button onClick={toggleLike} variant={liked ? "default" : "outline"}>
            <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} /> {liked ? "Liked" : "Like"}
          </Button>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline"><ExternalLink className="mr-2 h-4 w-4" /> Open in Maps</Button>
          </a>
        </div>

        <Card className="bg-gradient-card p-5 shadow-card">
          <CheckInButton placeId={dest.id} placeCategory={dest.category} />
        </Card>

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