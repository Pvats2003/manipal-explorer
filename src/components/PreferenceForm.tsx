import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, Sparkles, Users, Sun, Sunset, Moon, Bus, Bike, Car, Footprints, Volume2, Volume1, VolumeX } from "lucide-react";
import type { Budget, Crowd, Duration, Mood, TimeOfDay, Transport, TravelType, UserPreferences } from "@/lib/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "chill", label: "Chill", emoji: "🌅" },
  { value: "adventure", label: "Adventure", emoji: "🧗" },
  { value: "nature", label: "Nature", emoji: "🌿" },
  { value: "beach", label: "Beach", emoji: "🏖️" },
  { value: "party", label: "Party", emoji: "🎉" },
  { value: "food", label: "Food", emoji: "🍜" },
];

const TIMES: { value: TimeOfDay; label: string; Icon: any }[] = [
  { value: "morning", label: "Morning", Icon: Sun },
  { value: "afternoon", label: "Afternoon", Icon: Sun },
  { value: "evening", label: "Evening", Icon: Sunset },
  { value: "night", label: "Night", Icon: Moon },
];

const TRANSPORTS: { value: Transport; label: string; Icon: any }[] = [
  { value: "walk", label: "Walk", Icon: Footprints },
  { value: "bike", label: "Bike", Icon: Bike },
  { value: "bus", label: "Bus", Icon: Bus },
  { value: "cab", label: "Cab", Icon: Car },
  { value: "car", label: "Own car", Icon: Car },
];

const CROWDS: { value: Crowd; label: string; Icon: any }[] = [
  { value: "quiet", label: "Quiet", Icon: VolumeX },
  { value: "lively", label: "Lively", Icon: Volume1 },
  { value: "packed", label: "Packed", Icon: Volume2 },
];

interface Props {
  onSubmit: (prefs: UserPreferences) => void;
}

export default function PreferenceForm({ onSubmit }: Props) {
  const { user } = useAuth();
  const [location, setLocation] = useState("Manipal, Karnataka");
  const [moods, setMoods] = useState<Mood[]>([]);
  const [avoidMoods, setAvoidMoods] = useState<Mood[]>([]);
  const [budget, setBudget] = useState<Budget>("medium");
  const [budgetAmount, setBudgetAmount] = useState(2500);
  const [duration, setDuration] = useState<Duration>("day");
  const [travelType, setTravelType] = useState<TravelType>("friends");
  const [groupSize, setGroupSize] = useState<number>(3);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("evening");
  const [transport, setTransport] = useState<Transport>("bike");
  const [crowd, setCrowd] = useState<Crowd>("lively");
  const [locating, setLocating] = useState(false);

  // Load saved taste profile for logged-in users
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("taste_profile").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        const tp: any = data?.taste_profile;
        if (!tp) return;
        if (Array.isArray(tp.moods)) setMoods(tp.moods);
        if (Array.isArray(tp.avoidMoods)) setAvoidMoods(tp.avoidMoods);
        if (tp.budget) setBudget(tp.budget);
        if (typeof tp.budgetAmount === "number") setBudgetAmount(tp.budgetAmount);
        if (tp.duration) setDuration(tp.duration);
        if (tp.travelType) setTravelType(tp.travelType);
        if (typeof tp.groupSize === "number") setGroupSize(tp.groupSize);
        if (tp.timeOfDay) setTimeOfDay(tp.timeOfDay);
        if (tp.transport) setTransport(tp.transport);
        if (tp.crowd) setCrowd(tp.crowd);
      });
  }, [user]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`Lat ${pos.coords.latitude.toFixed(3)}, Lng ${pos.coords.longitude.toFixed(3)}`);
        setLocating(false);
        toast.success("Location detected");
      },
      () => {
        setLocating(false);
        toast.error("Could not detect location");
      }
    );
  };

  const toggleMood = (m: Mood) => {
    setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
    // If you mark a vibe as wanted, remove it from "avoid"
    setAvoidMoods((prev) => prev.filter((x) => x !== m));
  };

  const toggleAvoid = (m: Mood) => {
    setAvoidMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
    setMoods((prev) => prev.filter((x) => x !== m));
  };

  const handleSubmit = async () => {
    if (moods.length === 0) {
      toast.error("Pick at least one mood");
      return;
    }
    const prefs: UserPreferences = {
      location, moods, budget, budgetAmount, duration, travelType,
      groupSize, timeOfDay, transport, crowd, avoidMoods,
    };
    if (user) {
      // Save taste profile
      await supabase.from("profiles").update({ taste_profile: prefs as any }).eq("user_id", user.id);
    }
    onSubmit(prefs);
  };

  return (
    <Card className="space-y-6 border-border/50 bg-gradient-card p-6 shadow-card">
      <div className="space-y-2">
        <Label>Your starting point</Label>
        <div className="flex gap-2">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="flex-1" />
          <Button variant="outline" size="icon" onClick={detectLocation} disabled={locating} aria-label="Detect location">
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>What's the vibe? <span className="text-xs text-muted-foreground">(pick any)</span></Label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => toggleMood(m.value)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-smooth ${
                moods.includes(m.value)
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vibes to avoid */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Anything you want to avoid?</Label>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m) => {
            const active = avoidMoods.includes(m.value);
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => toggleAvoid(m.value)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-smooth ${
                  active
                    ? "border-destructive bg-destructive/10 text-destructive line-through"
                    : "border-border bg-background text-muted-foreground hover:border-destructive/50"
                }`}
              >
                <span>{m.emoji}</span> {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Group size + time of day */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Group size</Label>
            <Badge variant="secondary">{groupSize === 1 ? "Just me" : `${groupSize} people`}</Badge>
          </div>
          <Slider value={[groupSize]} onValueChange={([v]) => setGroupSize(v)} min={1} max={15} step={1} />
        </div>
        <div className="space-y-2">
          <Label>Time of day</Label>
          <div className="grid grid-cols-4 gap-1">
            {TIMES.map((t) => {
              const active = timeOfDay === t.value;
              const Icon = t.Icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTimeOfDay(t.value)}
                  title={t.label}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border-2 px-1 py-1.5 transition-smooth ${
                    active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-medium leading-none">{t.label.slice(0,3)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transport */}
      <div className="space-y-2">
        <Label>How are you getting there?</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {TRANSPORTS.map((t) => {
            const active = transport === t.value;
            const Icon = t.Icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTransport(t.value)}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-smooth ${
                  active ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Crowd preference */}
      <div className="space-y-2">
        <Label>Crowd preference</Label>
        <div className="grid grid-cols-3 gap-2">
          {CROWDS.map((c) => {
            const active = crowd === c.value;
            const Icon = c.Icon;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCrowd(c.value)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border-2 p-2.5 text-sm transition-smooth ${
                  active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className="h-4 w-4" /> {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Budget</Label>
          <Badge variant="secondary">₹{budgetAmount}</Badge>
        </div>
        <Select value={budget} onValueChange={(v: Budget) => {
          setBudget(v);
          setBudgetAmount(v === "low" ? 1000 : v === "medium" ? 2500 : 6000);
        }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low (under ₹1,500)</SelectItem>
            <SelectItem value="medium">Medium (₹1,500–₹4,000)</SelectItem>
            <SelectItem value="high">High (₹4,000+)</SelectItem>
          </SelectContent>
        </Select>
        <Slider
          value={[budgetAmount]}
          onValueChange={([v]) => setBudgetAmount(v)}
          min={500}
          max={15000}
          step={250}
          className="pt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={duration} onValueChange={(v: Duration) => setDuration(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day trip</SelectItem>
              <SelectItem value="multi">Multi-day</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Travel as</Label>
          <Select value={travelType} onValueChange={(v: TravelType) => setTravelType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">Solo</SelectItem>
              <SelectItem value="friends">Friends</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button size="lg" className="w-full bg-gradient-hero shadow-glow text-base font-semibold" onClick={handleSubmit}>
        <Sparkles className="mr-2 h-5 w-5" /> Find My Spot
      </Button>
      {user && (
        <p className="text-center text-xs text-muted-foreground">
          ✨ We'll remember these for next time and personalize your picks.
        </p>
      )}
    </Card>
  );
}