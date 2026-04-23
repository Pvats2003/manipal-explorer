import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Calendar, MapPin, Wallet, Clock, Bus, Lightbulb, Backpack } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Block { time: string; activity: string; location: string; details: string; transport?: string; cost_inr: number; }
interface Day { day_number: number; theme: string; blocks: Block[]; }
interface Itinerary { title: string; summary: string; total_estimated_cost_inr: number; packing_tips: string[]; days: Day[]; }

export default function TripPlanner() {
  const [duration, setDuration] = useState("1");
  const [budget, setBudget] = useState("1500");
  const [vibe, setVibe] = useState("chill beach + sunset + good food");
  const [groupSize, setGroupSize] = useState("4");
  const [startDate, setStartDate] = useState("");
  const [extras, setExtras] = useState("");
  const [loading, setLoading] = useState(false);
  const [itin, setItin] = useState<Itinerary | null>(null);

  const generate = async () => {
    setLoading(true); setItin(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-trip-planner", {
        body: { duration: Number(duration), budget: Number(budget), vibe, groupSize: Number(groupSize), startDate, extras },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setItin(data as Itinerary);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't build your itinerary. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8 space-y-2">
          <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> AI Trip Planner</Badge>
          <h1 className="text-3xl font-extrabold md:text-4xl">Build your perfect Manipal trip</h1>
          <p className="text-muted-foreground">Tell us your vibe — we'll draft a time-blocked itinerary with real spots, transport tips & costs.</p>
        </div>

        <Card className="overflow-hidden border-primary/20 bg-gradient-card p-5 shadow-card md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Duration (days)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="2">2 days</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Budget per person (₹)</Label>
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Group size</Label>
              <Input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} min="1" max="20" />
            </div>
            <div className="space-y-1.5">
              <Label>Start date (optional)</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>What's the vibe?</Label>
              <Input value={vibe} onChange={(e) => setVibe(e.target.value)} placeholder="e.g. beach + bars, calm trek, foodie crawl" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Anything to avoid or include?</Label>
              <Textarea value={extras} onChange={(e) => setExtras(e.target.value)} rows={2} placeholder="No long treks, vegetarian only, must include sunset…" />
            </div>
          </div>
          <Button onClick={generate} disabled={loading} className="mt-5 w-full bg-gradient-hero shadow-glow md:w-auto" size="lg">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building your trip…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate itinerary</>}
          </Button>
        </Card>

        {itin && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <Card className="border-primary/20 bg-gradient-card p-5 shadow-card md:p-6">
              <h2 className="text-2xl font-extrabold md:text-3xl">{itin.title}</h2>
              <p className="mt-2 text-muted-foreground">{itin.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary" className="gap-1"><Wallet className="h-3 w-3" /> ~₹{itin.total_estimated_cost_inr}/person</Badge>
                <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" /> {itin.days.length} day{itin.days.length > 1 ? "s" : ""}</Badge>
              </div>
              {itin.packing_tips?.length > 0 && (
                <div className="mt-4 rounded-xl bg-primary/5 p-3 text-sm">
                  <div className="mb-1.5 flex items-center gap-1.5 font-semibold"><Backpack className="h-4 w-4 text-primary" /> Pack these</div>
                  <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                    {itin.packing_tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
            </Card>

            {itin.days.map((day) => (
              <Card key={day.day_number} className="overflow-hidden border-border/50 shadow-card">
                <div className="border-b border-border/50 bg-primary/5 px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold">Day {day.day_number}</div>
                    <Badge variant="outline">{day.theme}</Badge>
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {day.blocks.map((b, i) => (
                    <div key={i} className="flex gap-4 p-5">
                      <div className="flex w-20 shrink-0 flex-col items-center gap-1 text-xs">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-hero text-white shadow-glow">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="text-center font-semibold">{b.time}</div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="font-bold">{b.activity}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {b.location}
                        </div>
                        <p className="text-sm">{b.details}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {b.transport && <Badge variant="outline" className="gap-1 text-xs"><Bus className="h-3 w-3" /> {b.transport}</Badge>}
                          <Badge variant="secondary" className="gap-1 text-xs"><Wallet className="h-3 w-3" /> ₹{b.cost_inr}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
              <Lightbulb className="mr-1 inline h-3.5 w-3.5" /> Tip: AI suggestions are a starting point — always confirm timings & open status before heading out.
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}