import { supabase } from "@/integrations/supabase/client";
import { getCompleted as getLocalBucket, setCompleted as setLocalBucket } from "@/lib/bucketList";

const MIGRATED_KEY = "mhs_migrated_v1";

export async function migrateLocalToCloud(userId: string) {
  if (localStorage.getItem(MIGRATED_KEY) === userId) return;

  // Bucket list
  const local = getLocalBucket();
  const ids = Object.keys(local);
  if (ids.length) {
    const rows = ids.map((item_id) => ({ user_id: userId, item_id }));
    await supabase.from("bucket_list_completions").upsert(rows, { onConflict: "user_id,item_id", ignoreDuplicates: true });
  }

  localStorage.setItem(MIGRATED_KEY, userId);
}

// ---------- Bucket list cloud API ----------
export async function fetchCloudBucket(userId: string): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("bucket_list_completions")
    .select("item_id, completed_at")
    .eq("user_id", userId);
  const out: Record<string, number> = {};
  (data || []).forEach((r) => { out[r.item_id] = new Date(r.completed_at).getTime(); });
  return out;
}

export async function toggleCloudBucket(userId: string, itemId: string, currentlyDone: boolean) {
  if (currentlyDone) {
    await supabase.from("bucket_list_completions").delete().eq("user_id", userId).eq("item_id", itemId);
  } else {
    await supabase.from("bucket_list_completions").insert({ user_id: userId, item_id: itemId });
  }
}

// ---------- Trip logs cloud API ----------
export interface CloudTrip {
  id: string;
  place: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: number;
}

export async function fetchCloudTrips(userId: string): Promise<CloudTrip[]> {
  const { data } = await supabase
    .from("trip_logs")
    .select("id, destination_name, date_visited, spent, notes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data || []).map((r) => ({
    id: r.id,
    place: r.destination_name,
    amount: Number(r.spent),
    date: r.date_visited || new Date(r.created_at).toISOString().slice(0, 10),
    notes: r.notes ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function addCloudTrip(userId: string, t: { place: string; amount: number; date: string; notes?: string }) {
  const { data, error } = await supabase
    .from("trip_logs")
    .insert({
      user_id: userId,
      destination_name: t.place,
      spent: t.amount,
      date_visited: t.date,
      notes: t.notes ?? null,
    })
    .select("id, destination_name, date_visited, spent, notes, created_at")
    .single();
  if (error || !data) throw error;
  return {
    id: data.id,
    place: data.destination_name,
    amount: Number(data.spent),
    date: data.date_visited || new Date(data.created_at).toISOString().slice(0, 10),
    notes: data.notes ?? undefined,
    createdAt: new Date(data.created_at).getTime(),
  } as CloudTrip;
}

export async function deleteCloudTrip(userId: string, id: string) {
  await supabase.from("trip_logs").delete().eq("user_id", userId).eq("id", id);
}

export async function clearCloudTrips(userId: string) {
  await supabase.from("trip_logs").delete().eq("user_id", userId);
}
