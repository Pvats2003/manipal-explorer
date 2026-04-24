import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET_ITEMS, getCompleted } from "@/lib/bucketList";
import { LogOut, Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGES = [
  { id: "explorer", emoji: "🌱", name: "Explorer", desc: "First check-in" },
  { id: "adventurer", emoji: "🗺️", name: "Adventurer", desc: "10 check-ins" },
  { id: "photographer", emoji: "📸", name: "Photographer", desc: "5 photos uploaded" },
  { id: "sage", emoji: "💬", name: "Sage", desc: "10 helpful tips" },
  { id: "beach", emoji: "🌊", name: "Beach Bum", desc: "5 beach check-ins" },
  { id: "owl", emoji: "🦉", name: "Night Owl", desc: "5 late-night check-ins" },
  { id: "legend", emoji: "🏆", name: "Wanderlust Legend", desc: "100% bucket list" },
];

function LoggedOutState() {
  const navigate = useNavigate();
  return (
    <div className="container max-w-2xl space-y-6 px-4 py-10">
      <div className="section-eyebrow">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Create your Karavali profile 🌴</h1>
        <p className="mt-2 text-muted-foreground">
          Track your check-ins, earn badges, and see how you rank against other explorers.
        </p>
      </div>

      <Card className="card-sand-top relative overflow-hidden p-8">
        <div className="pointer-events-none select-none opacity-40 blur-[1.5px]">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-secondary bg-background text-4xl">
              🌴
            </div>
            <div className="font-display text-2xl font-bold">Your Name</div>
            <div className="text-sm text-muted-foreground">Batch of 2025</div>
            <div className="mt-3 font-display text-5xl font-bold text-primary">240</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Explorer score</div>
            <div className="mt-2 text-sm text-muted-foreground">#42 out of 1,200 explorers</div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                <div className="font-display text-xl font-bold text-primary">12</div>
                <div className="text-[10px] uppercase text-muted-foreground">stat</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/40 backdrop-blur-[2px]">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate("/auth")}
          >
            Login to get started
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function Profile() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [checkinCount, setCheckinCount] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [bucketDone, setBucketDone] = useState(0);
  const [totalExplorers, setTotalExplorers] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    setBucketDone(Object.keys(getCompleted()).length);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: c1 }, { count: c2 }, { count: total }, { count: ahead }] = await Promise.all([
        supabase.from("checkins").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("saved_trips").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gt("explorer_score", profile?.explorer_score ?? 0),
      ]);
      setCheckinCount(c1 ?? 0);
      setSavedCount(c2 ?? 0);
      setTotalExplorers(total ?? 0);
      setRank((ahead ?? 0) + 1);
    })();
  }, [user, profile?.explorer_score]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Navbar />
        <div className="container max-w-2xl space-y-4 px-4 py-10">
          <Skeleton className="mx-auto h-20 w-20 rounded-full" />
          <Skeleton className="mx-auto h-6 w-40" />
          <Skeleton className="mx-auto h-12 w-24" />
          <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i=> <Skeleton key={i} className="h-20" />)}</div>
        </div>
        <MobileTabBar />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Navbar />
        <LoggedOutState />
        <MobileTabBar />
      </div>
    );
  }

  const topPercent = totalExplorers && rank ? Math.max(1, Math.round((rank / totalExplorers) * 100)) : null;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      <div className="container max-w-2xl space-y-6 px-4 py-8">
        {/* Hero */}
        <Card className="card-sand-top flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-secondary bg-background text-5xl shadow-card">
            {profile.profile_emoji}
          </div>
          <h1 className="font-display text-3xl font-bold">{profile.display_name || "Explorer"}</h1>
          {profile.batch_year && <div className="text-sm text-muted-foreground">Batch of {profile.batch_year}</div>}
          <div className="mt-3 font-display text-5xl font-bold text-primary">{profile.explorer_score}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Explorer score</div>
          {rank && totalExplorers && (
            <div className="mt-2 text-sm text-muted-foreground">
              #{rank} out of {totalExplorers} explorers
              {topPercent && topPercent <= 50 && (
                <span className="ml-1 text-accent">· Top {topPercent}% 🔥</span>
              )}
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Check-ins", value: checkinCount },
            { label: "Saved", value: savedCount },
            { label: "Tips", value: 0 },
            { label: "Bucket", value: `${bucketDone}/${BUCKET_ITEMS.length}` },
          ].map((s) => (
            <Card key={s.label} className="card-sand-top p-4 text-center">
              <div className="font-display text-2xl font-bold text-primary">
                {s.value === null ? <Skeleton className="mx-auto h-7 w-10" /> : s.value}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Badges */}
        <Card className="card-sand-top p-6">
          <div className="section-eyebrow mb-3">
            <h2 className="font-display text-xl font-bold">Badges</h2>
          </div>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-7">
            {BADGES.map((b) => (
              <div
                key={b.id}
                title={`${b.name} — ${b.desc}`}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-full border text-2xl",
                  "bg-muted/60 text-muted-foreground border-border",
                )}
              >
                <span className="grayscale opacity-50">{b.emoji}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">0/{BADGES.length} badges earned · coming soon</div>
        </Card>

        {/* Activity */}
        <Card className="card-sand-top p-6">
          <div className="section-eyebrow mb-3">
            <h2 className="font-display text-xl font-bold">Recent activity</h2>
          </div>
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <Sparkles className="h-6 w-6 text-secondary" />
            Your activity feed will appear here once we roll out the points engine.
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/saved")}>
            <Pencil className="mr-2 h-4 w-4" /> Manage saved
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => signOut().then(() => navigate("/"))}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}