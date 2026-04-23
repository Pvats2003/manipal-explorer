import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { migrateLocalToCloud } from "@/lib/cloudSync";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const EMOJIS = ["🌴", "🏄", "🌊", "🏔️", "🎒", "🌅", "🗺️", "🧭", "🍜", "🛵", "🌿", "⚡"];
const YEARS = [2022, 2023, 2024, 2025, 2026, 2027, 2028];

export default function ProfileSetupModal() {
  const { user, profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [year, setYear] = useState<string>("");
  const [emoji, setEmoji] = useState("🌴");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && profile && !profile.onboarded) {
      setName(profile.display_name || "");
      setEmoji(profile.profile_emoji || "🌴");
      setOpen(true);
    }
  }, [user, profile]);

  const onSave = async () => {
    if (!user) return;
    if (!name.trim()) return toast.error("Pick a display name");
    if (!year) return toast.error("Select your batch year");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim(),
        batch_year: Number(year),
        profile_emoji: emoji,
        onboarded: true,
      })
      .eq("user_id", user.id);
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }
    // Migrate local data
    await migrateLocalToCloud(user.id);
    await refreshProfile();
    setSaving(false);
    setOpen(false);
    toast.success(`Welcome aboard, ${name}! ${emoji}`);
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* one-time, no dismiss */ }}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Let's set you up 🌊</DialogTitle>
          <DialogDescription>Just a few details so we can personalize your Manipal journey.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" />
          </div>

          <div className="space-y-1.5">
            <Label>Batch year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue placeholder="Select your batch" /></SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pick your explorer emoji</Label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex h-12 w-full items-center justify-center rounded-xl border-2 text-2xl transition-smooth ${
                    emoji === e
                      ? "border-primary bg-primary/10 scale-110 shadow-glow"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >{e}</button>
              ))}
            </div>
          </div>

          <Button onClick={onSave} disabled={saving} className="w-full bg-gradient-hero shadow-glow">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start exploring"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
