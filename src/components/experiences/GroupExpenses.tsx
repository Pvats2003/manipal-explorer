import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { computeBalances, settleBalances, type Expense } from "@/lib/experiences";

interface Props {
  groupId: string;
  isMember: boolean;
  memberIds: string[];
  memberNames: Record<string, string>;
}

export default function GroupExpenses({ groupId, isMember, memberIds, memberNames }: Props) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adding, setAdding] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  const load = async () => {
    const { data } = await supabase.from("expenses").select("*").eq("group_id", groupId).order("created_at", { ascending: false });
    setExpenses((data || []) as Expense[]);
  };

  useEffect(() => {
    if (!isMember) return;
    load();
    const ch = supabase
      .channel(`expenses:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `group_id=eq.${groupId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, isMember]);

  const add = async () => {
    if (!user || !desc.trim() || !amount) { toast.error("Description & amount required"); return; }
    const { error } = await supabase.from("expenses").insert({
      group_id: groupId,
      paid_by: user.id,
      description: desc.trim(),
      amount: Number(amount),
      split_among: memberIds,
    });
    if (error) { toast.error(error.message); return; }
    setDesc(""); setAmount(""); setAdding(false);
  };

  const remove = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
  };

  if (!isMember) return <div className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">Join the group to track expenses.</div>;

  const balances = computeBalances(expenses);
  const settlements = settleBalances(balances);

  return (
    <div className="space-y-3">
      {!adding ? (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="mr-1 h-4 w-4" /> Add expense</Button>
      ) : (
        <Card className="space-y-2 p-3">
          <Input placeholder="What was it? (e.g. Tempo fare)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Input type="number" placeholder="Amount in ₹" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <p className="text-xs text-muted-foreground">Will be split equally among {memberIds.length} member{memberIds.length === 1 ? "" : "s"}.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={add}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setDesc(""); setAmount(""); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {expenses.length === 0 && <p className="text-sm text-muted-foreground">No expenses yet.</p>}

      {expenses.length > 0 && (
        <div className="space-y-1.5">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{e.description}</div>
                <div className="text-xs text-muted-foreground">Paid by {memberNames[e.paid_by] || "Member"} · split {e.split_among.length} ways</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">₹{Number(e.amount).toFixed(0)}</span>
                {e.paid_by === user?.id && (
                  <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {settlements.length > 0 && (
        <Card className="space-y-1 p-3">
          <h4 className="text-sm font-semibold">Who owes whom</h4>
          {settlements.map((s, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{memberNames[s.from] || "Someone"}</span>
              <span className="text-muted-foreground"> pays </span>
              <span className="font-medium">{memberNames[s.to] || "Someone"}</span>
              <span className="font-semibold text-primary"> ₹{s.amount.toFixed(0)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}