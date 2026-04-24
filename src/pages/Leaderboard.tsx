import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  user_id: string;
  display_name: string | null;
  profile_emoji: string;
  batch_year: number | null;
  explorer_score: number;
};

function RowItem({ row, rank, isMe }: { row: Row; rank: number; isMe: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 shadow-card transition-smooth",
        isMe && "bg-secondary/40 border-secondary",
      )}
    >
      <div className="w-8 text-center font-display text-lg font-bold text-primary">{rank}</div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-secondary bg-background text-xl">
        {row.profile_emoji || "🌴"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display font-semibold">
          {row.display_name || "Explorer"} {isMe && <span className="ml-1 text-xs text-primary">· You</span>}
        </div>
        <div className="text-xs text-muted-foreground">
          {row.batch_year ? `Batch of ${row.batch_year}` : "Karavali Explorer"}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-lg font-bold text-primary">{row.explorer_score}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">pts</div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
      <Skeleton className="h-6 w-6 rounded" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-6 w-10" />
    </div>
  );
}

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const [allTime, setAllTime] = useState<Row[] | null>(null);
  const [batch, setBatch] = useState<Row[] | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, profile_emoji, batch_year, explorer_score")
        .order("explorer_score", { ascending: false })
        .limit(50);
      setAllTime((data as Row[]) || []);
    })();
  }, []);

  useEffect(() => {
    if (!profile?.batch_year) {
      setBatch([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, profile_emoji, batch_year, explorer_score")
        .eq("batch_year", profile.batch_year)
        .order("explorer_score", { ascending: false })
        .limit(50);
      setBatch((data as Row[]) || []);
    })();
  }, [profile?.batch_year]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("explorer_score", profile?.explorer_score ?? 0);
      setMyRank((count ?? 0) + 1);
    })();
  }, [user, profile?.explorer_score]);

  const myRowInList = useMemo(
    () => !!user && !!allTime && allTime.some((r) => r.user_id === user.id),
    [user, allTime],
  );

  const renderList = (rows: Row[] | null, emptyText: string) => {
    if (rows === null) return <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</div>;
    if (rows.length === 0) return <Card className="card-sand-top p-8 text-center text-muted-foreground">{emptyText}</Card>;
    return (
      <div className="space-y-2">
        {rows.map((r, i) => (
          <RowItem key={r.user_id} row={r} rank={i + 1} isMe={!!user && r.user_id === user.id} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      <div className="container max-w-3xl px-4 py-8">
        <div className="section-eyebrow mb-6">
          <h1 className="font-display text-3xl font-bold md:text-4xl">🏆 Top Explorers</h1>
          <p className="mt-1 text-muted-foreground">Who's discovered Manipal the most?</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="batch">My Batch</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderList(allTime, "No explorers yet — be the first!")}
          </TabsContent>

          <TabsContent value="week" className="mt-4">
            <Card className="card-sand-top p-8 text-center">
              <Trophy className="mx-auto h-10 w-10 text-secondary" />
              <p className="mt-3 font-display text-lg font-semibold">Weekly leaderboard launching soon</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We're tracking weekly point streaks. Check back Monday.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="mt-4">
            {!user ? (
              <Card className="card-sand-top p-8 text-center text-muted-foreground">
                Login to see your batch ranking.
              </Card>
            ) : !profile?.batch_year ? (
              <Card className="card-sand-top p-8 text-center text-muted-foreground">
                Add your batch year in your profile to see your batch ranking.
              </Card>
            ) : (
              renderList(batch, "No explorers in your batch yet.")
            )}
          </TabsContent>
        </Tabs>

        {user && profile && !myRowInList && allTime && (
          <div className="sticky bottom-20 mt-6 md:bottom-4">
            <div className="rounded-lg border-2 border-secondary bg-secondary/40 p-3 shadow-elevated backdrop-blur">
              <RowItem
                row={{
                  user_id: user.id,
                  display_name: profile.display_name,
                  profile_emoji: profile.profile_emoji,
                  batch_year: profile.batch_year,
                  explorer_score: profile.explorer_score,
                }}
                rank={myRank ?? 0}
                isMe
              />
              {myRank && <div className="mt-2 text-center text-xs text-muted-foreground">You · #{myRank} overall</div>}
            </div>
          </div>
        )}
      </div>
      <MobileTabBar />
    </div>
  );
}