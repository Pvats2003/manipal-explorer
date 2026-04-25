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
  experienceId: string;
  onCreated: () => void;
}

export default function CreateGroupDialog({ open, onOpenChange, experienceId, onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState("8");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) { toast.error("Sign in to create groups"); return; }
    if (!name.trim()) { toast.error("Group name required"); return; }
    setBusy(true);
    const { data, error } = await supabase.from("experience_groups").insert({
      experience_id: experienceId,
      created_by: user.id,
      name: name.trim(),
      description: description.trim(),
      max_members: Number(maxMembers) || 8,
    }).select("id").single();
    if (error) { setBusy(false); toast.error(error.message); return; }
    // Auto-join creator
    await supabase.from("group_members").insert({ group_id: data!.id, user_id: user.id });
    setBusy(false);
    toast.success("Group created!");
    setName(""); setDescription(""); setMaxMembers("8");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create a group</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tempo Squad" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div><Label>Max members</Label><Input type="number" min="2" max="50" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} /></div>
          <Button onClick={submit} disabled={busy} className="w-full">{busy ? "Creating…" : "Create group"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}