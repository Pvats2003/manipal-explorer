import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VibeChat from "@/components/VibeChat";
import DestinationCard from "@/components/DestinationCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Destination, UserPreferences } from "@/lib/types";
import { ArrowDown, Sparkles, MapPin, TrendingUp, Heart, ListChecks, Wallet, Camera, GraduationCap, CalendarHeart } from "lucide-react";
import heroImage from "@/assets/hero-coast.jpg";
import { TrendingThisWeek, RecentlyCheckedIn, RisingNewThisMonth } from "@/components/HomeCheckinRows";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [popular, setPopular] = useState<Destination[]>([]);
  const [taste, setTaste] = useState<any>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("destinations")
      .select("*")
      .order("rating", { ascending: false })
      .limit(3)
      .then(({ data }) => setPopular((data as Destination[]) || []));
  }, []);

  useEffect(() => {
    if (!user) { setTaste(null); return; }
    supabase.from("profiles").select("taste_profile").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setTaste(data?.taste_profile || null));
  }, [user]);

  const tastePersona = (() => {
    if (!taste) return null;
    const m: string[] = taste.moods || [];
    const labels: string[] = [];
    if (m.includes("adventure")) labels.push("Adventurous");
    if (m.includes("party") || taste.crowd === "packed") labels.push("Party-loving");
    if (m.includes("food")) labels.push("Foodie");
    if (m.includes("nature") || m.includes("beach")) labels.push("Nature-seeker");
    if (taste.crowd === "quiet") labels.push("Calm explorer");
    if (taste.duration === "multi") labels.push("Weekend wanderer");
    return labels.slice(0, 3).join(" · ") || "Explorer";
  })();

  const handleSubmit = async (prefs: UserPreferences) => {
    sessionStorage.setItem("mhs_prefs", JSON.stringify(prefs));
    if (user) {
      await supabase.from("trip_history").insert([{ user_id: user.id, preferences: prefs as any }]);
    }
    navigate("/recommendations");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Manipal coast at sunset" className="h-full w-full object-cover" width={1536} height={1024} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10" />
        </div>
        {/* Floating accent blobs */}
        <div className="pointer-events-none absolute -left-10 top-20 h-32 w-32 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute right-10 bottom-10 h-40 w-40 rounded-full bg-secondary/20 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

        <div className="container relative z-10 px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl space-y-6 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 glass px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>For students, by students</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.05] md:text-6xl lg:text-7xl">
              Find Manipal's <span className="bg-gradient-hero bg-clip-text text-transparent">hidden spots</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground md:text-xl">
              Beaches, treks, cafes, bars and late-night clubs — picked for your mood, budget and weekend plan.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="bg-gradient-hero shadow-glow hover:scale-105 transition-transform"
                onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                Plan my trip <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
              {!user && (
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                  Sign up for smarter picks
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-6 text-sm">
              <div className="flex items-center gap-2 rounded-full glass px-4 py-2"><MapPin className="h-4 w-4 text-primary" /> 28+ curated spots</div>
              <div className="flex items-center gap-2 rounded-full glass px-4 py-2"><TrendingUp className="h-4 w-4 text-secondary" /> Personalized picks</div>
              <div className="flex items-center gap-2 rounded-full glass px-4 py-2">☕ Cafes · 🏖 Beaches · 🍻 Bars</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending — community pulse, sits right under hero */}
      <TrendingThisWeek />

      {/* Form */}
      <section ref={formRef} className="container px-4 py-16">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => navigate("/trip-planner")}
              className="group flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-card p-4 text-left shadow-card hover-lift"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-hero text-2xl shadow-glow">✨</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">AI Trip Planner</div>
                <div className="truncate text-xs text-muted-foreground">Custom itineraries</div>
              </div>
              <Sparkles className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </button>
            <button
              onClick={() => navigate("/bucket-list")}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-gradient-card p-4 text-left shadow-card hover-lift"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">📋</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">Bucket List</div>
                <div className="truncate text-xs text-muted-foreground">25 iconic experiences</div>
              </div>
              <ListChecks className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </button>
            <button
              onClick={() => navigate("/trip-tracker")}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-gradient-card p-4 text-left shadow-card hover-lift"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-2xl">💸</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">Trip Tracker</div>
                <div className="truncate text-xs text-muted-foreground">Log spending</div>
              </div>
              <Wallet className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </button>
            <button
              onClick={() => navigate("/photo-wall")}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-gradient-card p-4 text-left shadow-card hover-lift"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-2xl">📸</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">Photo Wall</div>
                <div className="truncate text-xs text-muted-foreground">Save memories</div>
              </div>
              <Camera className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => navigate("/events")}
              className="group flex items-center gap-3 rounded-2xl border border-secondary/30 bg-gradient-card p-4 text-left shadow-card hover-lift"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-2xl">🎪</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">Live Events Board</div>
                <div className="truncate text-xs text-muted-foreground">Fests, gigs, food pop-ups</div>
              </div>
              <CalendarHeart className="h-4 w-4 text-muted-foreground group-hover:text-secondary" />
            </button>
            <button
              onClick={() => navigate("/fresher-guide")}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-gradient-card p-4 text-left shadow-card hover-lift"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">🎓</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">Fresher Survival Guide</div>
                <div className="truncate text-xs text-muted-foreground">Insider hacks for new MIT students</div>
              </div>
              <GraduationCap className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </button>
          </div>

          {user && taste && tastePersona && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-card p-4 shadow-card animate-fade-in">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Heart className="h-3.5 w-3.5 text-primary" /> Your taste profile
              </div>
              <div className="mt-1 text-lg font-bold">{tastePersona}</div>
              <p className="text-xs text-muted-foreground">We'll use these to personalize your picks. Tweak below anytime.</p>
            </div>
          )}
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Chat with Vibe</h2>
            <p className="mt-2 text-muted-foreground">Just tell our AI what you're in the mood for.</p>
          </div>
          <VibeChat onComplete={handleSubmit} />
        </div>
      </section>

      {/* Popular */}
      {popular.length > 0 && (
        <section className="container px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-2xl font-bold md:text-3xl">Top-rated near you</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {popular.map((d) => (
                <DestinationCard key={d.id} destination={d} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently checked in — live community pulse */}
      <RecentlyCheckedIn />

      {/* Rising — new this month */}
      <RisingNewThisMonth />

      <Footer />
    </div>
  );
};

export default Index;
