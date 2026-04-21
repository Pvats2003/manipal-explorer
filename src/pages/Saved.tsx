import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DestinationCard from "@/components/DestinationCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Destination } from "@/lib/types";
import { Bookmark } from "lucide-react";

export default function Saved() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Destination[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    supabase
      .from("saved_trips")
      .select("destination_id, destinations(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data || []).map((row: any) => row.destinations).filter(Boolean));
      });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold">Saved trips</h1>
          <p className="text-muted-foreground">Your bookmarked spots — ready when you are.</p>
        </div>
        {items.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 p-12 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No saved spots yet. Find one you love and tap save.</p>
            <Button onClick={() => navigate("/")} className="bg-gradient-hero">Explore now</Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => <DestinationCard key={d.id} destination={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}