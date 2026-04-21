import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { History as HistoryIcon } from "lucide-react";

interface HistoryRow {
  id: string;
  preferences: any;
  created_at: string;
}

export default function History() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<HistoryRow[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    supabase
      .from("trip_history")
      .select("id, preferences, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setRows((data as HistoryRow[]) || []));
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold">Search history</h1>
          <p className="text-muted-foreground">We use this to make picks smarter over time.</p>
        </div>
        {rows.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 p-12 text-center">
            <HistoryIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No searches yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const p = r.preferences || {};
              return (
                <Card key={r.id} className="bg-gradient-card p-4 shadow-card">
                  <div className="mb-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(p.moods || []).map((m: string) => <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>)}
                    {p.budget && <Badge variant="outline">₹{p.budgetAmount}</Badge>}
                    {p.duration && <Badge variant="outline">{p.duration === "day" ? "Day trip" : "Multi-day"}</Badge>}
                    {p.travelType && <Badge variant="outline" className="capitalize">{p.travelType}</Badge>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}