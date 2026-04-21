import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PreferenceForm from "@/components/PreferenceForm";
import DestinationCard from "@/components/DestinationCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Destination, UserPreferences } from "@/lib/types";
import { ArrowDown, Sparkles, MapPin, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-coast.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [popular, setPopular] = useState<Destination[]>([]);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("destinations")
      .select("*")
      .order("rating", { ascending: false })
      .limit(3)
      .then(({ data }) => setPopular((data as Destination[]) || []));
  }, []);

  const handleSubmit = async (prefs: UserPreferences) => {
    sessionStorage.setItem("mhs_prefs", JSON.stringify(prefs));
    if (user) {
      await supabase.from("trip_history").insert({ user_id: user.id, preferences: prefs as unknown as never });
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
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>
        <div className="container relative z-10 px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-4 py-1.5 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>For students, by students</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
              Find Manipal's <span className="bg-gradient-hero bg-clip-text text-transparent">hidden spots</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground md:text-xl">
              Beaches, waterfalls, treks and cafes — picked for your mood, budget and weekend plan.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="bg-gradient-hero shadow-glow"
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
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> 16+ curated spots</div>
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Personalized for you</div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section ref={formRef} className="container px-4 py-16">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Tell us your vibe</h2>
            <p className="mt-2 text-muted-foreground">We'll surface the perfect spot in seconds.</p>
          </div>
          <PreferenceForm onSubmit={handleSubmit} />
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

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <div className="container px-4">
          Made with 🌊 for Manipal students · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;
