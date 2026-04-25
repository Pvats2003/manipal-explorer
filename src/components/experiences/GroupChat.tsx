import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { GroupMessage } from "@/lib/experiences";

interface Props {
  groupId: string;
  isMember: boolean;
}

export default function GroupChat({ groupId, isMember }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [text, setText] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMember) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      const msgs = (data || []) as GroupMessage[];
      setMessages(msgs);
      const ids = Array.from(new Set(msgs.map((m) => m.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
        const map: Record<string, string> = {};
        (profs || []).forEach((p: any) => { map[p.user_id] = p.display_name || "Explorer"; });
        setNames(map);
      }
    })();

    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as GroupMessage]))
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [groupId, isMember]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!user || !text.trim()) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("group_messages").insert({ group_id: groupId, user_id: user.id, content });
    if (error) toast.error("Couldn't send message");
  };

  if (!isMember) {
    return <div className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">Join the group to see chat.</div>;
  }

  return (
    <div className="flex h-[420px] flex-col rounded-lg border border-border bg-background">
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hi 👋</p>}
        {messages.map((m) => {
          const mine = m.user_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                {!mine && <div className="text-[10px] font-semibold opacity-70">{names[m.user_id] || "Explorer"}</div>}
                <div>{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border p-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
        <Button type="submit" size="icon" disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}