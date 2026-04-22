import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AISpot } from "./AISpots";

interface Msg { role: "user" | "assistant"; content: string }

interface Props {
  spots: AISpot[];
  moodReading: string;
}

const STARTERS = [
  "Which one is best for a first date?",
  "Cheapest option here?",
  "What if it rains?",
  "Best one for sunset?",
];

export default function SpotsFollowupChat({ spots, moodReading }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Got questions about these spots? Ask me anything — comparisons, timings, what to wear, alternatives. ✨" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("spots-chat", {
        body: { messages: next, spots, moodReading },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setMessages((m) => [...m, { role: "assistant", content: data?.reply || "Hmm, no answer came through." }]);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't reach Vibe. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-card shadow-card">
      <div className="flex items-center gap-2 border-b border-border/50 bg-primary/5 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-hero shadow-glow">
          <MessageCircle className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold">Ask Vibe about these spots</div>
          <div className="text-xs text-muted-foreground">Cross-questions, comparisons, alternatives</div>
        </div>
        <Badge variant="outline" className="ml-auto gap-1"><Sparkles className="h-3 w-3" />AI</Badge>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
              m.role === "user"
                ? "bg-gradient-hero text-white shadow-glow"
                : "bg-muted/60"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border/50 px-4 py-2">
          {STARTERS.map((s) => (
            <Button key={s} size="sm" variant="outline" className="h-7 text-xs" onClick={() => send(s)}>
              {s}
            </Button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2 border-t border-border/50 p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up…"
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()} className="bg-gradient-hero shadow-glow">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}