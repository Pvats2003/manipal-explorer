import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Poll, PollOption, PollVote } from "@/lib/experiences";

interface Props { groupId: string; isMember: boolean; }

export default function GroupPolls({ groupId, isMember }: Props) {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [options, setOptions] = useState<Record<string, PollOption[]>>({});
  const [votes, setVotes] = useState<Record<string, PollVote[]>>({});
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<string[]>(["", ""]);

  const refresh = async () => {
    const { data: pData } = await supabase.from("polls").select("*").eq("group_id", groupId).order("created_at", { ascending: false });
    const ps = (pData || []) as Poll[];
    setPolls(ps);
    if (!ps.length) { setOptions({}); setVotes({}); return; }
    const ids = ps.map((p) => p.id);
    const { data: oData } = await supabase.from("poll_options").select("*").in("poll_id", ids);
    const { data: vData } = await supabase.from("poll_votes").select("*").in("poll_id", ids);
    const oMap: Record<string, PollOption[]> = {};
    (oData || []).forEach((o: any) => { (oMap[o.poll_id] = oMap[o.poll_id] || []).push(o); });
    const vMap: Record<string, PollVote[]> = {};
    (vData || []).forEach((v: any) => { (vMap[v.poll_id] = vMap[v.poll_id] || []).push(v); });
    setOptions(oMap); setVotes(vMap);
  };

  useEffect(() => {
    if (!isMember) return;
    refresh();
    const ch = supabase
      .channel(`poll_votes:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, isMember]);

  const createPoll = async () => {
    if (!user) return;
    const cleanOpts = opts.map((o) => o.trim()).filter(Boolean);
    if (!q.trim() || cleanOpts.length < 2) { toast.error("Question and at least 2 options required"); return; }
    const { data: poll, error } = await supabase.from("polls").insert({ group_id: groupId, created_by: user.id, question: q.trim() }).select("id").single();
    if (error) { toast.error(error.message); return; }
    const { error: oErr } = await supabase.from("poll_options").insert(cleanOpts.map((label) => ({ poll_id: poll!.id, label })));
    if (oErr) { toast.error(oErr.message); return; }
    setQ(""); setOpts(["", ""]); setCreating(false);
    refresh();
  };

  const vote = async (pollId: string, optionId: string) => {
    if (!user) return;
    // Remove existing vote first (one vote per user per poll)
    await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("user_id", user.id);
    const { error } = await supabase.from("poll_votes").insert({ poll_id: pollId, option_id: optionId, user_id: user.id });
    if (error) toast.error(error.message);
  };

  const deletePoll = async (id: string) => {
    await supabase.from("polls").delete().eq("id", id);
    refresh();
  };

  if (!isMember) return <div className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">Join to vote on group decisions.</div>;

  return (
    <div className="space-y-3">
      {!creating && <Button size="sm" variant="outline" onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" /> New poll</Button>}
      {creating && (
        <Card className="space-y-2 p-3">
          <Input placeholder="Question (e.g. Where should we stay?)" value={q} onChange={(e) => setQ(e.target.value)} />
          {opts.map((o, i) => (
            <Input key={i} placeholder={`Option ${i + 1}`} value={o} onChange={(e) => { const c = [...opts]; c[i] = e.target.value; setOpts(c); }} />
          ))}
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpts([...opts, ""])}>+ option</Button>
            <Button size="sm" onClick={createPoll}>Post poll</Button>
            <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setQ(""); setOpts(["", ""]); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {polls.length === 0 && !creating && <p className="text-sm text-muted-foreground">No polls yet.</p>}

      {polls.map((p) => {
        const pOpts = options[p.id] || [];
        const pVotes = votes[p.id] || [];
        const total = pVotes.length;
        const myVote = pVotes.find((v) => v.user_id === user?.id);
        return (
          <Card key={p.id} className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold">{p.question}</h4>
              {p.created_by === user?.id && (
                <button onClick={() => deletePoll(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
            <div className="space-y-1.5">
              {pOpts.map((o) => {
                const count = pVotes.filter((v) => v.option_id === o.id).length;
                const pct = total ? Math.round((count / total) * 100) : 0;
                const picked = myVote?.option_id === o.id;
                return (
                  <button key={o.id} onClick={() => vote(p.id, o.id)} className={`relative w-full overflow-hidden rounded-md border px-3 py-2 text-left text-sm transition-colors ${picked ? "border-primary" : "border-border hover:bg-muted"}`}>
                    <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${pct}%` }} />
                    <div className="relative flex justify-between">
                      <span>{o.label}{picked && " ✓"}</span>
                      <span className="text-xs text-muted-foreground">{count} · {pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-muted-foreground">{total} vote{total === 1 ? "" : "s"}</div>
          </Card>
        );
      })}
    </div>
  );
}