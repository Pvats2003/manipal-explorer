import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/events";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export default function EventForm({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("fest");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [link, setLink] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setDescription(""); setCategory("fest"); setLocation("");
    setStartsAt(""); setEndsAt(""); setLink(""); setOrganizer("");
    setImageFile(null); setPreviewUrl("");
  };

  const onPickImage = (f: File | null) => {
    setImageFile(f);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl("");
  };

  const submit = async () => {
    if (!user) { toast.error("Sign in to submit events"); return; }
    if (!title.trim() || !description.trim() || !location.trim() || !startsAt) {
      toast.error("Fill title, description, location and start time"); return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("event-images")
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("event-images").getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

      const { error } = await supabase.from("events").insert({
        created_by: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        link: link.trim() || null,
        organizer: organizer.trim() || null,
        image_url: imageUrl,
      });
      if (error) throw error;

      toast.success("Event posted! 🎉");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Couldn't submit event");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a new event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ev-title">Title *</Label>
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Beach cleanup at Malpe" maxLength={120} />
          </div>
          <div>
            <Label htmlFor="ev-desc">Description *</Label>
            <Textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's happening, who can come, what to bring…" rows={3} maxLength={1000} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ev-loc">Location *</Label>
              <Input id="ev-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="MIT Quadrangle" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ev-start">Starts *</Label>
              <Input id="ev-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ev-end">Ends</Label>
              <Input id="ev-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ev-org">Organizer</Label>
              <Input id="ev-org" value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="Club / society" />
            </div>
            <div>
              <Label htmlFor="ev-link">Link</Label>
              <Input id="ev-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Insta / RSVP form" />
            </div>
          </div>
          <div>
            <Label>Cover image</Label>
            <div className="mt-1 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm hover:bg-muted">
                <ImagePlus className="h-4 w-4" /> {imageFile ? "Change" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0] ?? null)} />
              </label>
              {previewUrl && <img src={previewUrl} alt="preview" className="h-12 w-20 rounded-md object-cover" />}
            </div>
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-hero shadow-glow">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting…</> : "Post event"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Goes live instantly. Be respectful — admins can remove inappropriate posts.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
