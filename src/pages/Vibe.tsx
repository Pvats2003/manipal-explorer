import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import VibeChat from "@/components/VibeChat";
import type { UserPreferences } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Vibe() {
  const navigate = useNavigate();

  const handleComplete = (prefs: UserPreferences) => {
    try {
      sessionStorage.setItem("mhs_prefs", JSON.stringify(prefs));
    } catch {}
    navigate("/recommendations");
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />
      <div className="container max-w-2xl px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 -ml-2">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <h1 className="font-display text-2xl font-bold">Ask Vibe ✨</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Tell our AI what you're in the mood for — it'll find your perfect spot.
        </p>
        <VibeChat onComplete={handleComplete} />
      </div>
    </div>
  );
}