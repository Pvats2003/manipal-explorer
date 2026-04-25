import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export default function CreateExperienceDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [budget, setBudget] = useState("500");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) { toast.error("Sign in to create experiences"); return; }
    if (!title.trim() || !location.trim() || !startsAt) {
      toast.error("Title, location and date are required"); return;
    }
    setBusy(true);
    const { error } = await supabase.from("experiences").insert({
      created_by: user.id,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      starts_at: new Date(startsAt).toISOString(),
      budget_estimate: Number(budget) || 0,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Experience created!");
    setTitle(""); setDescription(""); setLocation(""); setStartsAt(""); setBudget("500");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create an experience</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunrise hike to Kudremukh" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div><Label>Location *</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kudremukh" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date *</Label><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></div>
            <div><Label>Budget (₹ pp)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
          </div>
          <Button onClick={submit} disabled={busy} className="w-full">{busy ? "Creating…" : "Create"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}