import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { UserPreferences } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Beach + bars with my squad of 5 🍻",
  "Quiet nature day trip, low budget",
  "Solo cafe-hopping this evening ☕",
  "Adventure trek for 3, weekend trip",
];

interface Props {
  onComplete: (prefs: UserPreferences) => void;
}

export default function VibeChat({ onComplete }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm **Vibe** ✨ — your spot-finder. Tell me what you're in the mood for and I'll find you the perfect hidden gem around Manipal. What's the vibe today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Pre-fill from saved taste profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("taste_profile").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        const tp: any = data?.taste_profile;
        if (!tp?.moods?.length) return;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I remember you like **${tp.moods.join(", ")}** vibes. Same again, or something different today?`,
          },
        ]);
      })
      .catch((err) => {
        console.error("Error loading taste profile:", err);
      });
  }, [user]);

  const send = async (text: string) => {
    if (!text.trim() || loading || done) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("vibe-chat", {
        body: { messages: next },
      });
      if (error) {
        console.error("Vibe chat error:", error);
        throw error;
      }
      if (data?.error) {
        console.error("Vibe chat response error:", data.error);
        toast.error(data.error);
        setLoading(false);
        return;
      }
      if (data?.reply) {
        setMessages((p) => [...p, { role: "assistant", content: data.reply }]);
      }
      if (data?.preferences) {
        const prefs: UserPreferences = {
          location: data.preferences.location || "Manipal, Karnataka",
          moods: data.preferences.moods || [],
          budget: data.preferences.budget || "medium",
          budgetAmount: data.preferences.budgetAmount || 2500,
          duration: data.preferences.duration || "day",
          travelType: data.preferences.travelType || "friends",
          groupSize: data.preferences.groupSize,
          timeOfDay: data.preferences.timeOfDay,
          transport: data.preferences.transport,
          crowd: data.preferences.crowd,
          avoidMoods: data.preferences.avoidMoods,
        };
        setDone(true);
        if (!data.reply) {
          setMessages((p) => [...p, { role: "assistant", content: "On it! Finding your spots... ✨" }]);
        }
        // Persist full chat history so the recommender can read the user's mood
        try {
          sessionStorage.setItem(
            "mhs_chat",
            JSON.stringify([...next, ...(data.reply ? [{ role: "assistant", content: data.reply }] : [])]),
          );
        } catch (storageErr) {
          console.error("Error saving chat history:", storageErr);
        }
        setTimeout(() => onComplete(prefs), 800);
      }
    } catch (e: any) {
      console.error("Vibe chat exception:", e);
      toast.error("Couldn't reach Vibe. Try again.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-card shadow-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 bg-background/40 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero shadow-glow">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-bold leading-tight">Vibe</div>
          <div className="text-xs text-muted-foreground">Your AI spot-finder</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-secondary/15 px-2.5 py-1 text-xs text-secondary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" /> online
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-[420px] space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-gradient-hero text-white shadow-glow"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-strong:text-foreground">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick starters */}
      {messages.length <= 2 && !loading && !done && (
        <div className="flex flex-wrap gap-1.5 border-t border-border/50 px-4 py-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-smooth hover:border-primary/50 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2 border-t border-border/50 bg-background/40 p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={done ? "Loading your spots..." : "Type your vibe..."}
          disabled={loading || done}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={loading || done || !input.trim()} className="bg-gradient-hero shadow-glow">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  );
}
