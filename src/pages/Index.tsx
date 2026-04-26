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
import { ArrowRight, Sparkles, Heart, ListChecks, Camera, GraduationCap, CalendarHeart } from "lucide-react";
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
        {/* Animated wave SVG pattern overlay */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="kara-waves" x="0" y="0" width="160" height="80" patternUnits="userSpaceOnUse">
              <path d="M0 40 Q 40 10, 80 40 T 160 40" fill="none" stroke="#E8C49A" strokeWidth="1.5" className="animate-pulse-soft" />
              <path d="M0 60 Q 40 30, 80 60 T 160 60" fill="none" stroke="#E8C49A" strokeWidth="1.5" style={{ animationDelay: '0.5s' }} className="animate-pulse-soft" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kara-waves)" />
        </svg>

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-primary-glow/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="container relative z-10 px-4 py-24">
          <div className="mx-auto max-w-3xl space-y-8 text-center">
            <p className="font-sans text-xs font-medium tracking-[0.4em] text-secondary/90 md:text-sm animate-fade-in" style={{ animationDelay: '0.1s' }}>
              A MANIPAL STUDENT GUIDE
            </p>
            <h1 className="font-display text-[40px] font-bold leading-[1.02] md:text-[64px] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Coastal Karnataka,
              <span className="block italic font-bold bg-gradient-to-r from-secondary via-secondary to-secondary/80 bg-clip-text text-transparent">student-discovered.</span>
            </h1>
            <p className="mx-auto max-w-xl font-sans text-base text-secondary/90 md:text-lg leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
              60+ curated places. Authentic student tips. AI-powered itineraries.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <Button
                size="lg"
                onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="btn-premium bg-secondary text-primary hover:bg-secondary/95 font-semibold rounded-xl shadow-elevated px-8"
              >
                Start Exploring <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="border-2 border-secondary/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:border-secondary/60 rounded-xl backdrop-blur-sm"
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
          className="absolute bottom-0 left-0 w-full transition-transform duration-1000"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          style={{ height: 70 }}
        >
          <path
            d="M0,40 C240,80 480,0 720,30 C960,60 1200,20 1440,50 L1440,80 L0,80 Z"
            fill="hsl(35 33% 95%)"
            className="dark:fill-[hsl(187_60%_6%)]"
          />
        </svg>
      </section>

      {/* Trending — community pulse, sits right under hero */}
      <TrendingThisWeek />

      {/* Form */}
      <section ref={formRef} className="container px-4 py-16">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => navigate("/trip-planner")}
              className="group relative flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-card p-5 text-left shadow-card transition-all duration-500 hover:shadow-glow hover:-translate-y-1 hover:border-primary/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-hero text-2xl shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">✨</div>
              <div className="relative flex-1 min-w-0">
                <div className="font-bold text-[15px]">AI Trip Planner</div>
                <div className="truncate text-xs text-muted-foreground mt-0.5">Custom itineraries</div>
              </div>
              <Sparkles className="relative h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:rotate-12" />
            </button>
            <button
              onClick={() => navigate("/bucket-list")}
              className="group relative flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-card p-5 text-left shadow-card transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 hover:border-primary/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl transition-transform duration-300 group-hover:scale-110">📋</div>
              <div className="relative flex-1 min-w-0">
                <div className="font-bold text-[15px]">Bucket List</div>
                <div className="truncate text-xs text-muted-foreground mt-0.5">25 iconic experiences</div>
              </div>
              <ListChecks className="relative h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-primary" />
            </button>
            <button
              onClick={() => navigate("/events")}
              className="group relative flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-card p-5 text-left shadow-card transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 hover:border-secondary/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-2xl transition-transform duration-300 group-hover:scale-110">🎉</div>
              <div className="relative flex-1 min-w-0">
                <div className="font-bold text-[15px]">Events</div>
                <div className="truncate text-xs text-muted-foreground mt-0.5">Plan a trip together</div>
              </div>
              <CalendarHeart className="relative h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-secondary" />
            </button>
            <button
              onClick={() => navigate("/photo-wall")}
              className="group relative flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-card p-5 text-left shadow-card transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 hover:border-accent/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-2xl transition-transform duration-300 group-hover:scale-110">📸</div>
              <div className="relative flex-1 min-w-0">
                <div className="font-bold text-[15px]">Photo Wall</div>
                <div className="truncate text-xs text-muted-foreground mt-0.5">Save memories</div>
              </div>
              <Camera className="relative h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-accent" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => navigate("/events")}
              className="group relative flex items-center gap-4 rounded-2xl border border-secondary/20 bg-gradient-card p-5 text-left shadow-card transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 hover:border-secondary/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-2xl transition-transform duration-300 group-hover:scale-110">🎪</div>
              <div className="relative flex-1 min-w-0">
                <div className="font-bold text-[15px]">Live Events Board</div>
                <div className="truncate text-xs text-muted-foreground mt-0.5">Fests, gigs, food pop-ups</div>
              </div>
              <CalendarHeart className="relative h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-secondary" />
            </button>
            <button
              onClick={() => navigate("/fresher-guide")}
              className="group relative flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-card p-5 text-left shadow-card transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 hover:border-primary/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl transition-transform duration-300 group-hover:scale-110">🎓</div>
              <div className="relative flex-1 min-w-0">
                <div className="font-bold text-[15px]">Fresher Survival Guide</div>
                <div className="truncate text-xs text-muted-foreground mt-0.5">Insider hacks for new MIT students</div>
              </div>
              <GraduationCap className="relative h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-primary" />
            </button>
          </div>

          {user && taste && tastePersona && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-card p-5 shadow-card animate-fade-in-up relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
                <Heart className="h-4 w-4 text-primary animate-pulse-soft" /> Your taste profile
              </div>
              <div className="relative mt-2 text-xl font-bold font-display">{tastePersona}</div>
              <p className="relative text-xs text-muted-foreground mt-1 leading-relaxed">We&apos;ll use these to personalize your picks. Tweak below anytime.</p>
            </div>
          )}
          <div className="text-center space-y-3">
            <h2 className="font-display text-3xl font-bold md:text-4xl bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">Chat with Vibe</h2>
            <p className="text-muted-foreground text-base md:text-lg">Just tell our AI what you&apos;re in the mood for.</p>
          </div>
          <VibeChat onComplete={handleSubmit} />
        </div>
      </section>

      {/* Popular */}
      {popular.length > 0 && (
        <section className="container px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="section-eyebrow mb-8 font-display text-2xl font-bold md:text-3xl">Top-rated near you</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {popular.map((d, i) => (
                <div key={d.id} className="stagger-item" style={{ animationDelay: `${i * 100}ms` }}>
                  <DestinationCard destination={d} />
                </div>
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
