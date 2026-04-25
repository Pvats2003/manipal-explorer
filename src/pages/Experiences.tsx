import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchExperiences, type Experience } from "@/lib/experiences";
import ExperienceCard from "@/components/experiences/ExperienceCard";
import CreateExperienceDialog from "@/components/experiences/CreateExperienceDialog";
import { toast } from "sonner";

export default function Experiences() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Experience[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const xs = await fetchExperiences();
      setItems(xs);
      if (xs.length) {
        const { data } = await supabase
          .from("experience_attendees")
          .select("experience_id")
          .in("experience_id", xs.map((x) => x.id));
        const c: Record<string, number> = {};
        (data || []).forEach((r: any) => { c[r.experience_id] = (c[r.experience_id] || 0) + 1; });
        setCounts(c);
      }
    } catch (e: any) {
      toast.error(e.message || "Couldn't load experiences");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container max-w-3xl px-4 py-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary"><Sparkles className="mr-1 inline h-6 w-6 text-secondary" />Experiences</h1>
            <p className="text-sm text-muted-foreground">Trips, events and group plans by Karavali explorers.</p>
          </div>
          <Button onClick={() => user ? setCreateOpen(true) : navigate("/auth")}>
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-lg">No experiences yet</p>
            <p className="mb-4 text-sm text-muted-foreground">Be the first to plan something for the community.</p>
            <Button onClick={() => user ? setCreateOpen(true) : navigate("/auth")}><Plus className="mr-1 h-4 w-4" /> Create the first one</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((x) => (
              <ExperienceCard
                key={x.id}
                experience={x}
                attendeeCount={counts[x.id] || 0}
                onClick={() => navigate(`/experiences/${x.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateExperienceDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
    </div>
  );
}