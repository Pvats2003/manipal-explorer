import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BUCKET_ITEMS, getCompleted, milestone, toggleCompleted, type BucketCategory } from "@/lib/bucketList";
import { Check, CloudOff, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCloudBucket, toggleCloudBucket } from "@/lib/cloudSync";
import { logExplorerEvent } from "@/lib/explorer";

const CATEGORIES: BucketCategory[] = ["Food & Chai", "Nature & Outdoors", "Campus Life", "Day Trips", "Hidden Gems"];

export default function BucketList() {
  const { user } = useAuth();
  const [done, setDone] = useState<Record<string, number>>({});
  const [activeCat, setActiveCat] = useState<BucketCategory | "All">("All");
  const [recentlyClicked, setRecentlyClicked] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCloudBucket(user.id).then(setDone);
    } else {
      setDone(getCompleted());
    }
  }, [user]);

  const total = BUCKET_ITEMS.length;
  const completedCount = Object.keys(done).length;
  const pct = Math.round((completedCount / total) * 100);
  const tagline = milestone(completedCount, total);

  const items = useMemo(
    () => activeCat === "All" ? BUCKET_ITEMS : BUCKET_ITEMS.filter((i) => i.category === activeCat),
    [activeCat]
  );

  const onToggle = async (id: string) => {
    const wasDone = !!done[id];
    if (user) {
      // optimistic update
      const next = { ...done };
      if (wasDone) delete next[id]; else next[id] = Date.now();
      setDone(next);
      try { await toggleCloudBucket(user.id, id, wasDone); }
      catch { toast.error("Couldn't sync — try again"); setDone(done); }
      // Award points only when newly completed
      if (!wasDone) {
        logExplorerEvent({ userId: user.id, type: "bucket_complete" });
      }
    } else {
      const next = toggleCompleted(id);
      setDone(next);
    }
    if (!wasDone) {
      setRecentlyClicked(id);
      setTimeout(() => setRecentlyClicked(null), 800);
    }
  };

  const onShare = async () => {
    const text = `I've completed ${completedCount}/${total} things on the Karavali Bucket List — karavali.app 🌊`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard!"); }
    } catch { /* ignore */ }
  };

  const r = 60;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl space-y-6 px-4 py-6">
        {!user && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">
            <CloudOff className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 text-muted-foreground">Login to save your progress across devices.</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-card p-6 text-center shadow-card md:flex-row md:text-left">
          <div className="relative h-36 w-36 shrink-0">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle cx="70" cy="70" r={r} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
              <circle
                cx="70" cy="70" r={r}
                stroke="url(#bl-grad)" strokeWidth="10" fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.4,0,.2,1)" }}
              />
              <defs>
                <linearGradient id="bl-grad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-extrabold">{completedCount}</div>
              <div className="text-xs text-muted-foreground">/ {total}</div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-primary">A Karavali Ritual</div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">The Karavali Bucket List 🌊</h1>
            <p className="text-sm text-muted-foreground">{total} things every Manipal student should do before graduating.</p>
            <Button onClick={onShare} className="bg-gradient-hero shadow-glow">
              <Share2 className="mr-2 h-4 w-4" /> Share my progress
            </Button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(["All", ...CATEGORIES] as const).map((cat) => {
            const active = activeCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat as any)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-smooth ${
                  active
                    ? "border-transparent bg-gradient-hero text-primary-foreground shadow-glow"
                    : "border-border bg-background/60 text-foreground hover:bg-muted"
                }`}
              >{cat}</button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const isDone = !!done[it.id];
            const justClicked = recentlyClicked === it.id;
            return (
              <button
                key={it.id}
                onClick={() => onToggle(it.id)}
                className={`group text-left rounded-2xl border p-4 transition-smooth hover-lift ${
                  isDone
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-gradient-card shadow-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-3xl">{it.emoji}</div>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-smooth ${
                    isDone ? "border-primary bg-gradient-hero" : "border-border"
                  } ${justClicked ? "scale-125" : ""}`}>
                    {isDone && <Check className={`h-4 w-4 text-primary-foreground ${justClicked ? "animate-scale-in" : ""}`} />}
                  </div>
                </div>
                <h3 className={`mt-2 font-bold leading-tight ${isDone ? "line-through opacity-70" : ""}`}>{it.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{it.description}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">{it.category}</Badge>
              </button>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
