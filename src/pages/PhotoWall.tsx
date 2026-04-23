import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Plus, Trash2, ImagePlus, MapPin, Calendar } from "lucide-react";
import { deletePhoto, fileToDataUrl, getPhotos, savePhoto, type Photo } from "@/lib/photoWall";
import { toast } from "sonner";

export default function PhotoWall() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<Photo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPhotos(getPhotos()); }, []);

  const onFile = async (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Pick an image file"); return; }
    setBusy(true);
    try {
      const url = await fileToDataUrl(f);
      setPreview(url); setOpen(true);
    } catch { toast.error("Couldn't read that image"); }
    finally { setBusy(false); }
  };

  const save = () => {
    if (!preview) return;
    const p: Photo = {
      id: crypto.randomUUID(),
      dataUrl: preview,
      caption: caption.trim() || "Untitled memory",
      location: location.trim(),
      date: new Date().toISOString(),
    };
    savePhoto(p);
    setPhotos(getPhotos());
    setOpen(false); setPreview(""); setCaption(""); setLocation("");
    toast.success("Memory saved ✨");
  };

  const remove = (id: string) => {
    deletePhoto(id);
    setPhotos(getPhotos());
    setView(null);
    toast.success("Removed");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl px-4 py-8 md:py-12">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="outline" className="gap-1"><Camera className="h-3 w-3" /> Photo Wall</Badge>
            <h1 className="text-3xl font-extrabold md:text-4xl">Your Manipal memories</h1>
            <p className="text-muted-foreground">{photos.length} {photos.length === 1 ? "memory" : "memories"} · saved on this device</p>
          </div>
          <Button onClick={() => fileRef.current?.click()} disabled={busy} className="bg-gradient-hero shadow-glow">
            <Plus className="mr-1.5 h-4 w-4" /> Add photo
          </Button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        </div>

        {photos.length === 0 ? (
          <Card className="border-2 border-dashed border-border bg-gradient-card p-12 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ImagePlus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-1 text-lg font-bold">No memories yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Snap a photo or upload one to start your wall.</p>
            <Button onClick={() => fileRef.current?.click()} className="bg-gradient-hero shadow-glow">
              <Camera className="mr-1.5 h-4 w-4" /> Add your first memory
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map(p => (
              <button key={p.id} onClick={() => setView(p)} className="group relative aspect-square overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-card hover-lift">
                <img src={p.dataUrl} alt={p.caption} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="line-clamp-1 font-semibold">{p.caption}</div>
                  {p.location && <div className="line-clamp-1 opacity-80">📍 {p.location}</div>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Add dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Save memory</DialogTitle></DialogHeader>
            {preview && <img src={preview} alt="preview" className="mb-3 max-h-64 w-full rounded-xl object-cover" />}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Caption</Label>
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Sunset at Kapu lighthouse 🌅" />
              </div>
              <div className="space-y-1.5">
                <Label>Location (optional)</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kapu Beach" />
              </div>
              <Button onClick={save} className="w-full bg-gradient-hero shadow-glow">Save to wall</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View dialog */}
        <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
          <DialogContent className="max-w-2xl p-0">
            {view && (
              <>
                <img src={view.dataUrl} alt={view.caption} className="max-h-[70vh] w-full object-contain bg-black" />
                <div className="space-y-2 p-5">
                  <div className="text-lg font-bold">{view.caption}</div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {view.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {view.location}</span>}
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(view.date).toLocaleDateString()}</span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => remove(view.id)} className="mt-2">
                    <Trash2 className="mr-1.5 h-4 w-4" /> Remove
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}