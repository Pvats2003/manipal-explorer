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
import { ArrowRight, Sparkles, Heart, ListChecks, Wallet, Camera, GraduationCap, CalendarHeart } from "lucide-react";
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

      {/* Hero — full viewport, deep teal editorial */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-gradient-hero text-primary-foreground">
        {/* Subtle wave SVG pattern overlay */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="kara-waves" x="0" y="0" width="160" height="80" patternUnits="userSpaceOnUse">
              <path d="M0 40 Q 40 10, 80 40 T 160 40" fill="none" stroke="#E8C49A" strokeWidth="1.5" />
              <path d="M0 60 Q 40 30, 80 60 T 160 60" fill="none" stroke="#E8C49A" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kara-waves)" />
        </svg>

        <div className="container relative z-10 px-4 py-20">
          <div className="mx-auto max-w-3xl space-y-6 text-center animate-fade-in">
            <p className="font-sans text-xs font-light tracking-[0.35em] text-secondary md:text-sm">
              A MANIPAL STUDENT GUIDE
            </p>
            <h1 className="font-display text-[36px] font-bold leading-[1.05] md:text-[56px]">
              Coastal Karnataka,
              <span className="block italic font-bold text-secondary">student-discovered.</span>
            </h1>
            <p className="mx-auto max-w-xl font-sans text-base text-primary-foreground/85 md:text-lg">
              60+ places. Real student tips. AI-powered itineraries.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button
                size="lg"
                onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="bg-secondary text-primary hover:bg-secondary/90 font-semibold rounded-lg shadow-elevated"
              >
                Start Exploring <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="border-secondary/60 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground rounded-lg"
                >
                  Sign up for smarter picks
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Wave divider into background */}
        <svg
          aria-hidden
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          style={{ height: 60 }}
        >
          <path
            d="M0,40 C240,80 480,0 720,30 C960,60 1200,20 1440,50 L1440,80 L0,80 Z"
            fill="hsl(35 33% 95%)"
          />
        </svg>
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
            <h2 className="font-display text-3xl font-bold md:text-4xl">Chat with Vibe</h2>
            <p className="mt-2 text-muted-foreground">Just tell our AI what you're in the mood for.</p>
          </div>
          <VibeChat onComplete={handleSubmit} />
        </div>
      </section>

      {/* Popular */}
      {popular.length > 0 && (
        <section className="container px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="section-eyebrow mb-6 font-display text-2xl font-bold md:text-3xl">Top-rated near you</h2>
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
