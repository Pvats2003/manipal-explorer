import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { checkIn, getCheckinCount, hasCheckedIn } from "@/lib/checkins";
import { supabase } from "@/integrations/supabase/client";
import { Check, MapPin, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function CheckInButton({ placeId }: { placeId: string }) {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCheckinCount(placeId), hasCheckedIn(placeId, user?.id ?? null)])
      .then(([c, d]) => {
        if (!mounted) return;
        setCount(c); setDone(d); setLoading(false);
      });

    // Realtime: keep count fresh for everyone viewing this place
    const channel = supabase
      .channel(`checkins:${placeId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins", filter: `place_id=eq.${placeId}` },
        () => setCount((c) => c + 1)
      )
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "checkins", filter: `place_id=eq.${placeId}` },
        () => setCount((c) => Math.max(0, c - 1))
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [placeId, user]);

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#0ea5e9", "#f97316", "#10b981", "#fbbf24"],
      scalar: 0.9,
      ticks: 120,
    });
  };

  const onClick = async () => {
    if (done || submitting) return;
    setSubmitting(true);
    // Optimistic
    setDone(true);
    setCount((c) => c + 1);
    try {
      await checkIn(placeId, user?.id ?? null);
      fireConfetti();
      toast.success("You've been here! 🎉");
    } catch {
      setDone(false);
      setCount((c) => Math.max(0, c - 1));
      toast.error("Couldn't check in — try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={onClick}
        disabled={loading || done || submitting}
        size="lg"
        className={`w-full text-base font-bold transition-all sm:w-auto ${
          done
            ? "bg-success hover:bg-success text-success-foreground shadow-[0_0_20px_hsl(var(--success)/0.4)]"
            : "bg-gradient-hero shadow-glow hover:scale-[1.02]"
        }`}
      >
        {submitting ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking in…</>
        ) : done ? (
          <><Check className="mr-2 h-5 w-5" /> You've been here!</>
        ) : (
          <><MapPin className="mr-2 h-5 w-5" /> I've been here</>
        )}
      </Button>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">👣 {count.toLocaleString()}</span>{" "}
        MIT student{count === 1 ? " has" : "s have"} been here
      </p>
    </div>
  );
}
