import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Sparkles, Upload, X } from "lucide-react";
import { PLACE_CATEGORIES, VIBE_TAGS, COST_RANGES, BEST_TIMES } from "@/lib/submitOptions";

const BATCH_YEARS = [2022, 2023, 2024, 2025, 2026, 2027, 2028];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export default function SubmitPlace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(PLACE_CATEGORIES[0]);
  const [mapsLink, setMapsLink] = useState("");

  // Step 2
  const [vibes, setVibes] = useState<string[]>([]);
  const [costRange, setCostRange] = useState("free");
  const [bestTimes, setBestTimes] = useState<string[]>([]);
  const [openingHours, setOpeningHours] = useState("");
  const [proTip, setProTip] = useState("");

  // Step 3
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [batchYear, setBatchYear] = useState<string>("");
  const [confirmReal, setConfirmReal] = useState(false);

  const toggleVibe = (v: string) => {
    setVibes((cur) => {
      if (cur.includes(v)) return cur.filter((x) => x !== v);
      if (cur.length >= 3) {
        toast.error("Pick up to 3 vibes");
        return cur;
      }
      return [...cur, v];
    });
  };

  const toggleBestTime = (t: string) =>
    setBestTimes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Photo must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validateStep1 = () => {
    if (!name.trim()) return "Place name is required";
    if (!description.trim()) return "Description is required";
    if (description.length > 100) return "Description must be 100 chars or less";
    return null;
  };
  const validateStep2 = () => {
    if (proTip.length > 150) return "Pro tip must be 150 chars or less";
    return null;
  };
  const validateStep3 = () => {
    if (!photo) return "Please upload one photo";
    if (!confirmReal) return "Please confirm this is a real place";
    return null;
  };

  const next = () => {
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (err) return toast.error(err);
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    const err = validateStep1() || validateStep2() || validateStep3();
    if (err) return toast.error(err);
    setSubmitting(true);
    try {
      // Upload photo
      const ext = photo!.name.split(".").pop() || "jpg";
      const path = `${user?.id || "anon"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("submissions").upload(path, photo!, {
        contentType: photo!.type,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("submissions").getPublicUrl(path);

      const { error: insErr } = await supabase.from("place_submissions").insert([{
        name: name.trim(),
        description: description.trim(),
        category,
        maps_link: mapsLink.trim() || null,
        vibes,
        cost_range: costRange,
        best_times: bestTimes,
        opening_hours: openingHours.trim() || null,
        pro_tip: proTip.trim() || null,
        image_url: pub.publicUrl,
        submitter_batch: batchYear ? Number(batchYear) : null,
        submitted_by: user?.id || null,
        status: "pending",
      }]);
      if (insErr) throw insErr;
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-xl px-4 py-16">
          <Card className="flex flex-col items-center gap-4 bg-gradient-card p-10 text-center shadow-card animate-scale-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-hero text-4xl shadow-glow">
              🌴
            </div>
            <h2 className="text-2xl font-bold">Thanks!</h2>
            <p className="text-muted-foreground">
              We'll review your submission within 48 hours. If approved, you'll get
              <span className="font-semibold text-primary"> +50 Explorer Points</span>! 🎉
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button onClick={() => navigate("/recommendations")} variant="outline">
                Back to explore
              </Button>
              <Button
                className="bg-gradient-hero"
                onClick={() => {
                  setSubmitted(false); setStep(1);
                  setName(""); setDescription(""); setCategory(PLACE_CATEGORIES[0]); setMapsLink("");
                  setVibes([]); setCostRange("free"); setBestTimes([]); setOpeningHours(""); setProTip("");
                  setPhoto(null); setPhotoPreview(null); setBatchYear(""); setConfirmReal(false);
                }}
              >
                Submit another
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl space-y-6 px-4 py-8">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> Submit a Place</Badge>
          <h1 className="text-3xl font-extrabold md:text-4xl">Share a Manipal hidden spot</h1>
          <p className="text-muted-foreground">Help fellow students discover your favourite places. Reviewed in 48 hours.</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{step === 1 ? "Basic info" : step === 2 ? "Details" : "Photo & confirm"}</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        <Card className="space-y-5 bg-gradient-card p-6 shadow-card">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <Field label="Place name *">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tiger Paw Falls" maxLength={120} />
              </Field>
              <Field label={`One-line description * (${description.length}/100)`}>
                <Input value={description} onChange={(e) => setDescription(e.target.value.slice(0, 100))} placeholder="Quick summary" />
              </Field>
              <Field label="Category">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLACE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Google Maps link or address (optional)">
                <Input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <Field label={`Vibe tags (pick up to 3) — ${vibes.length}/3`}>
                <div className="flex flex-wrap gap-2 pt-1">
                  {VIBE_TAGS.map((v) => {
                    const active = vibes.includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleVibe(v)}
                        className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-smooth ${
                          active
                            ? "border-transparent bg-gradient-hero text-primary-foreground shadow-glow"
                            : "border-border bg-background/60 hover:border-primary/40 hover:bg-muted"
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />} {v}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Estimated cost per person">
                <Select value={costRange} onValueChange={setCostRange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COST_RANGES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Best time to visit (multi-select)">
                <div className="flex flex-wrap gap-2 pt-1">
                  {BEST_TIMES.map((t) => {
                    const active = bestTimes.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleBestTime(t)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth ${
                          active
                            ? "border-transparent bg-secondary text-secondary-foreground"
                            : "border-border bg-background/60 hover:border-primary/40 hover:bg-muted"
                        }`}
                      >
                        {active && "✓ "}{t}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Opening hours">
                <Input value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} placeholder='e.g. "9am-11pm daily" or "24hrs"' />
              </Field>
              <Field label={`Pro tip (${proTip.length}/150)`}>
                <Textarea value={proTip} onChange={(e) => setProTip(e.target.value.slice(0, 150))} placeholder="One insider tip from you" rows={2} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <Field label="Upload one photo * (max 5MB)">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="preview" className="h-48 w-full rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/40 text-sm text-muted-foreground transition-smooth hover:border-primary/60 hover:bg-muted/30">
                    <Upload className="h-6 w-6" />
                    <span>Click to upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
                  </label>
                )}
              </Field>
              <Field label="Your batch year (optional)">
                <Select value={batchYear} onValueChange={setBatchYear}>
                  <SelectTrigger><SelectValue placeholder="Select batch year" /></SelectTrigger>
                  <SelectContent>
                    {BATCH_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-4">
                <Checkbox checked={confirmReal} onCheckedChange={(v) => setConfirmReal(!!v)} className="mt-0.5" />
                <span className="text-sm">I confirm this is a real place in or near Manipal.</span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={back} disabled={step === 1 || submitting}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={next} className="bg-gradient-hero">
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-hero">
                {submitting ? "Submitting..." : "Submit place"}
              </Button>
            )}
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
