import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmartFeed from "@/components/feed/SmartFeed";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Plus, ShieldCheck, Compass, Bookmark, Sparkles } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />

      {/* Compact hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]">
          <defs>
            <pattern id="kw" x="0" y="0" width="160" height="80" patternUnits="userSpaceOnUse">
              <path d="M0 40 Q 40 10, 80 40 T 160 40" fill="none" stroke="#E8C49A" strokeWidth="1.5" />
              <path d="M0 60 Q 40 30, 80 60 T 160 60" fill="none" stroke="#E8C49A" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kw)" />
        </svg>
        <div className="container relative px-4 py-7 md:py-10">
          <div className="mx-auto max-w-6xl space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-light tracking-[0.3em] text-secondary">
              <MapPin className="h-3 w-3" /> MANIPAL · UDUPI
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight md:text-4xl">
              Where to go,{" "}
              <span className="italic text-secondary">right now.</span>
            </h1>
            <p className="max-w-xl text-sm text-secondary/95 md:text-base">
              Real student-discovered spots. Live experiences. Trips you can join today.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => navigate("/vibe")}
                className="bg-gradient-hero text-primary-foreground hover:opacity-90 font-semibold rounded-full shadow-glow"
              >
                <Sparkles className="mr-1.5 h-4 w-4" /> Ask Vibe AI
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/explore")}
                className="bg-secondary text-primary hover:bg-secondary/90 font-semibold rounded-full"
              >
                <Compass className="mr-1.5 h-4 w-4" /> Explore all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/trips")}
                className="border-secondary/50 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground rounded-full"
              >
                <Bookmark className="mr-1.5 h-4 w-4" /> My trips
              </Button>
              {!user && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="text-secondary hover:bg-white/10 hover:text-secondary rounded-full"
                >
                  Sign in
                </Button>
              )}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-secondary backdrop-blur">
              <ShieldCheck className="h-3 w-3" /> Real submissions only · Community-verified
            </div>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="container px-4 py-5">
        <div className="mx-auto max-w-2xl">
          <SmartFeed />
        </div>
      </section>

      {/* Floating Add button (mobile only — tab bar handles it too, this stays for desktop CTA) */}
      <button
        onClick={() => navigate("/submit")}
        className="fixed bottom-24 right-5 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground shadow-glow transition-smooth hover:scale-105 md:flex"
        aria-label="Add a place"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Footer />
    </div>
  );
}
