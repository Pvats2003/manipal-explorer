import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DestinationCard from "@/components/DestinationCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Destination } from "@/lib/types";
import { Bookmark, Map, Plus, Sparkles } from "lucide-react";

export default function Trips() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Destination[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { setFetching(false); return; }
    supabase
      .from("saved_trips")
      .select("destination_id, destinations(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data || []).map((row: any) => row.destinations).filter(Boolean));
        setFetching(false);
      });
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <Navbar />
      <header className="border-b border-border/60 bg-gradient-card">
        <div className="container max-w-5xl px-4 py-7 md:py-10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            <Map className="h-3.5 w-3.5" /> Your trips
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Places you'll go.</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground md:text-base">
            Everything you've saved — ready when the weekend hits.
          </p>
        </div>
      </header>

      <section className="container max-w-5xl px-4 py-6">
        {!user ? (
          <Card className="flex flex-col items-center gap-4 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-secondary bg-background text-3xl">🌴</div>
            <div>
              <p className="font-display text-xl font-bold">Sign in to save trips</p>
              <p className="mt-1 text-sm text-muted-foreground">Bookmark spots you love and pull them up anywhere.</p>
            </div>
            <Button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Login to start saving
            </Button>
          </Card>
        ) : fetching ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 p-12 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-display text-xl font-bold">No saved spots yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Tap the bookmark on any place to plan ahead.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => navigate("/explore")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Sparkles className="mr-1.5 h-4 w-4" /> Explore places
              </Button>
              <Button variant="outline" onClick={() => navigate("/submit")}>
                <Plus className="mr-1.5 h-4 w-4" /> Add a place
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{items.length}</span> saved place{items.length === 1 ? "" : "s"}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((d) => <DestinationCard key={d.id} destination={d} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
