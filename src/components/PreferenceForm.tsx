import { useState } from "react";
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
import { MapPin, Loader2, Sparkles } from "lucide-react";
import type { Budget, Duration, Mood, TravelType, UserPreferences } from "@/lib/types";
import { toast } from "sonner";

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "chill", label: "Chill", emoji: "🌅" },
  { value: "adventure", label: "Adventure", emoji: "🧗" },
  { value: "nature", label: "Nature", emoji: "🌿" },
  { value: "beach", label: "Beach", emoji: "🏖️" },
  { value: "party", label: "Party", emoji: "🎉" },
  { value: "food", label: "Food", emoji: "🍜" },
];

interface Props {
  onSubmit: (prefs: UserPreferences) => void;
}

export default function PreferenceForm({ onSubmit }: Props) {
  const [location, setLocation] = useState("Manipal, Karnataka");
  const [moods, setMoods] = useState<Mood[]>([]);
  const [budget, setBudget] = useState<Budget>("medium");
  const [budgetAmount, setBudgetAmount] = useState(2500);
  const [duration, setDuration] = useState<Duration>("day");
  const [travelType, setTravelType] = useState<TravelType>("friends");
  const [locating, setLocating] = useState(false);

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
  };

  const handleSubmit = () => {
    if (moods.length === 0) {
      toast.error("Pick at least one mood");
      return;
    }
    onSubmit({ location, moods, budget, budgetAmount, duration, travelType });
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
        <Label>What's the vibe?</Label>
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
    </Card>
  );
}