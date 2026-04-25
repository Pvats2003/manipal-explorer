import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Experience } from "@/lib/experiences";

export default function PlanningHere({ destinationId }: { destinationId: string }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<Experience[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("experiences")
        .select("*")
        .eq("destination_id", destinationId)
        .gte("starts_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("starts_at", { ascending: true })
        .limit(5);
      if (cancelled) return;
      const xs = (data || []) as Experience[];
      setItems(xs);
      if (xs.length) {
        const { data: a } = await supabase
          .from("experience_attendees")
          .select("experience_id")
          .in("experience_id", xs.map((x) => x.id));
        const c: Record<string, number> = {};
        (a || []).forEach((r: any) => { c[r.experience_id] = (c[r.experience_id] || 0) + 1; });
        setCounts(c);
      }
    })();
    return () => { cancelled = true; };
  }, [destinationId]);

  if (items.length === 0) return null;

  return (
    <Card className="bg-gradient-card p-6 shadow-card">
      <h2 className="mb-3 text-xl font-bold">People planning trips here</h2>
      <div className="space-y-2">
        {items.map((x) => (
          <button
            key={x.id}
            onClick={() => navigate(`/experiences/${x.id}`)}
            className="block w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="line-clamp-1 font-semibold">{x.title}</div>
                <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(x.starts_at), "EEE, d MMM")}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{counts[x.id] || 0} going</span>
                </div>
              </div>
              <Badge variant="secondary">₹{x.budget_estimate}</Badge>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}