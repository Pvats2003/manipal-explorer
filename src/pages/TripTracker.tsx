import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { addTrip, clearMonth, deleteTrip, loadTrips, monthStats, type TripEntry } from "@/lib/tripTracker";
import { Trash2, IndianRupee, TrendingUp, Calendar as CalendarIcon, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function TripTracker() {
  const [trips, setTrips] = useState<TripEntry[]>([]);
  const [place, setPlace] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  useEffect(() => { setTrips(loadTrips()); }, []);

  const stats = monthStats(trips);
  const maxWeek = Math.max(1, ...stats.weekly);

  const onAdd = () => {
    const amt = Number(amount);
    if (!place.trim() || !amt || amt <= 0) { toast.error("Enter a place and amount"); return; }
    setTrips(addTrip({ place: place.trim(), amount: amt, date, notes: notes.trim() || undefined }));
    setPlace(""); setAmount(""); setNotes("");
    toast.success("Trip logged!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl space-y-6 px-4 py-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Trip Tracker</div>
          <h1 className="text-3xl font-extrabold md:text-4xl">Track every outing</h1>
          <p className="text-sm text-muted-foreground">See where your money goes. All data stays on your device.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<IndianRupee className="h-4 w-4" />} label="Spent this month" value={`₹${stats.total}`} />
          <Stat icon={<CalendarIcon className="h-4 w-4" />} label="Outings" value={String(stats.count)} />
          <Stat icon={<TrendingUp className="h-4 w-4" />} label="Avg / outing" value={`₹${stats.avg}`} />
          <Stat icon={<Trophy className="h-4 w-4" />} label="Biggest splurge" value={stats.biggest ? `₹${stats.biggest.amount}` : "—"} sub={stats.biggest?.place} />
        </div>

        {/* Weekly chart */}
        <Card className="bg-gradient-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">This month, by week</h2>
            <span className="text-xs text-muted-foreground">{format(new Date(), "MMMM yyyy")}</span>
          </div>
          <div className="flex h-32 items-end gap-3">
            {stats.weekly.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="text-xs font-semibold text-muted-foreground">{v ? `₹${v}` : ""}</div>
                <div
                  className="w-full rounded-t-md bg-gradient-hero transition-all"
                  style={{ height: `${(v / maxWeek) * 100}%`, minHeight: v ? "4px" : "0" }}
                />
                <div className="text-[10px] text-muted-foreground">W{i + 1}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Log form */}
        <Card className="bg-gradient-card p-5 shadow-card">
          <h2 className="mb-4 text-lg font-bold">Log a trip</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Place</Label><Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g. Kapu Beach" /></div>
            <div className="space-y-1.5"><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="450" /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Bike trip with the gang…" /></div>
          </div>
          <Button onClick={onAdd} className="mt-4 bg-gradient-hero shadow-glow">Log it</Button>
        </Card>

        {/* List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">My spending</h2>
            {trips.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">Reset month</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all entries?</AlertDialogTitle>
                    <AlertDialogDescription>This deletes every logged trip on this device. Cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { setTrips(clearMonth()); toast.success("Cleared"); }}>Delete all</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          {trips.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">No trips yet. Log your first outing above!</Card>
          ) : (
            <div className="space-y-2">
              {trips.map((t) => (
                <Card key={t.id} className="flex items-start justify-between gap-3 bg-gradient-card p-4 shadow-card">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <h3 className="truncate font-bold">{t.place}</h3>
                      <span className="text-xs text-muted-foreground">{format(new Date(t.date), "MMM d, yyyy")}</span>
                    </div>
                    {t.notes && <p className="mt-1 text-sm text-muted-foreground">{t.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right font-extrabold text-primary">₹{t.amount}</div>
                    <Button variant="ghost" size="icon" onClick={() => setTrips(deleteTrip(t.id))}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="bg-gradient-card p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
    </Card>
  );
}
