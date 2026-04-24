import { useState } from "react";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Item = { id: string; title: string };
const IN_DEV: Item[] = [
  { id: "whos-going", title: "🙋 Who's Going Board" },
  { id: "group-trip", title: "👥 Group Trip Planning" },
  { id: "fare-calc", title: "🛺 Auto Fare Calculator" },
];
const PLANNED: Item[] = [
  { id: "events-cal", title: "📅 Event Calendar" },
  { id: "scooty", title: "🛵 Scooty Rental Directory" },
  { id: "budget", title: "💰 Trip Budget Tracker" },
  { id: "biz", title: "🤝 Verified Business Listings" },
  { id: "pro", title: "⭐ Karavali Pro subscription" },
];
const HORIZON: Item[] = [
  { id: "mobile", title: "📱 Native Mobile App" },
  { id: "expand", title: "🗺️ Expand to NIT Surathkal & NITK" },
  { id: "alumni", title: "🎓 Alumni Explorer Mode" },
];

const WAITLIST_KEY = "karavali_waitlist";

function NotifyCard({ item, badge }: { item: Item; badge: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem(WAITLIST_KEY) || "{}")[item.id]; } catch { return false; }
  });

  const submit = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    const { error } = await supabase.from("waitlist").insert({ email, feature_id: item.id });
    if (error && error.code !== "23505") {
      toast.error("Couldn't sign you up — try again");
      return;
    }
    try {
      const cur = JSON.parse(localStorage.getItem(WAITLIST_KEY) || "{}");
      cur[item.id] = { email, at: Date.now() };
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(cur));
    } catch {}
    setDone(true);
    setOpen(false);
    toast.success("You're on the list — we'll ping you 🌊");
  };

  return (
    <Card className="card-sand-top flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="font-display text-lg font-semibold">{item.title}</div>
        {badge}
      </div>
      {open ? (
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="you@learner.manipal.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm"
          />
          <Button size="sm" onClick={submit} className="bg-primary text-primary-foreground">Save</Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => !done && setOpen(true)}
          disabled={done}
        >
          <Bell className="mr-2 h-4 w-4" />
          {done ? "You'll be notified ✓" : "Notify Me"}
        </Button>
      )}
    </Card>
  );
}

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      <div className="container max-w-4xl space-y-10 px-4 py-10">
        <div className="section-eyebrow">
          <h1 className="font-display text-3xl font-bold md:text-5xl">We're just getting started. 🌊</h1>
          <p className="mt-2 text-muted-foreground">A peek at what the Karavali team is cooking up.</p>
        </div>

        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">In development</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IN_DEV.map((i) => (
              <NotifyCard key={i.id} item={i} badge={<Badge className="bg-primary text-primary-foreground">In dev</Badge>} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">Planned</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLANNED.map((i) => (
              <NotifyCard key={i.id} item={i} badge={<Badge className="bg-secondary text-secondary-foreground">Planned</Badge>} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">On the horizon</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HORIZON.map((i) => (
              <NotifyCard key={i.id} item={i} badge={<Badge variant="outline" className="text-muted-foreground">Horizon</Badge>} />
            ))}
          </div>
        </section>
      </div>
      <MobileTabBar />
    </div>
  );
}