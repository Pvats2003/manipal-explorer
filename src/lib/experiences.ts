import { supabase } from "@/integrations/supabase/client";

export interface Experience {
  id: string;
  created_by: string;
  title: string;
  description: string;
  location: string;
  destination_id: string | null;
  starts_at: string;
  budget_estimate: number;
  image_url: string | null;
  created_at: string;
}

export interface ExperienceGroup {
  id: string;
  experience_id: string;
  created_by: string;
  name: string;
  description: string;
  max_members: number;
  created_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Poll {
  id: string;
  group_id: string;
  created_by: string;
  question: string;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  description: string;
  amount: number;
  split_among: string[];
  created_at: string;
}

export async function fetchExperiences(): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Experience[];
}

export async function fetchExperience(id: string): Promise<Experience | null> {
  const { data } = await supabase.from("experiences").select("*").eq("id", id).maybeSingle();
  return (data as Experience) || null;
}

/** Compute simple "who owes whom" balances for a group's expenses. */
export function computeBalances(expenses: Expense[]): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const e of expenses) {
    if (!e.split_among.length) continue;
    const share = Number(e.amount) / e.split_among.length;
    bal[e.paid_by] = (bal[e.paid_by] || 0) + Number(e.amount);
    for (const u of e.split_among) {
      bal[u] = (bal[u] || 0) - share;
    }
  }
  return bal;
}

/** Greedy settlement: returns a list of "A pays B amount" transfers. */
export function settleBalances(balances: Record<string, number>): { from: string; to: string; amount: number }[] {
  const creditors = Object.entries(balances).filter(([, v]) => v > 0.01).map(([k, v]) => ({ id: k, amt: v }));
  const debtors = Object.entries(balances).filter(([, v]) => v < -0.01).map(([k, v]) => ({ id: k, amt: -v }));
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    out.push({ from: debtors[i].id, to: creditors[j].id, amount: Math.round(pay * 100) / 100 });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < 0.01) i++;
    if (creditors[j].amt < 0.01) j++;
  }
  return out;
}