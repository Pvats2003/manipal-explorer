import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, MapPin, Users, Wallet, Plus, UserPlus, UserMinus } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchExperience, type Experience, type ExperienceGroup } from "@/lib/experiences";
import CreateGroupDialog from "@/components/experiences/CreateGroupDialog";
import { toast } from "sonner";

export default function ExperienceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exp, setExp] = useState<Experience | null>(null);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<{ user_id: string; display_name?: string; profile_emoji?: string }[]>([]);
  const [groups, setGroups] = useState<ExperienceGroup[]>([]);
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const isAttending = !!user && attendees.some((a) => a.user_id === user.id);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const x = await fetchExperience(id);
    setExp(x);
    if (x?.destination_id) {
      const { data: d } = await supabase.from("destinations").select("name").eq("id", x.destination_id).maybeSingle();
      setDestinationName(d?.name || null);
    }
    const [{ data: aData }, { data: gData }] = await Promise.all([
      supabase.from("experience_attendees").select("user_id").eq("experience_id", id),
      supabase.from("experience_groups").select("*").eq("experience_id", id).order("created_at", { ascending: false }),
    ]);
    const userIds = (aData || []).map((r: any) => r.user_id);
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, profile_emoji").in("user_id", userIds);
      const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      setAttendees(userIds.map((uid) => ({ user_id: uid, ...(profMap.get(uid) || {}) })));
    } else setAttendees([]);
    setGroups((gData || []) as ExperienceGroup[]);

    if (gData && gData.length) {
      const { data: members } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", gData.map((g: any) => g.id));
      const c: Record<string, number> = {};
      (members || []).forEach((m: any) => { c[m.group_id] = (c[m.group_id] || 0) + 1; });
      setGroupCounts(c);
    } else setGroupCounts({});
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const join = async () => {
    if (!user) { navigate("/auth"); return; }
    const { error } = await supabase.from("experience_attendees").insert({ experience_id: id!, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success("You're going! 🎉");
    load();
  };

  const leave = async () => {
    if (!user) return;
    await supabase.from("experience_attendees").delete().eq("experience_id", id!).eq("user_id", user.id);
    toast.success("Left the experience");
    load();
  };

  if (loading || !exp) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <div className="container max-w-3xl space-y-4 px-4 py-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container max-w-3xl space-y-5 px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-hero">
          {exp.image_url && <img src={exp.image_url} alt={exp.title} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-sunset" />
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <h1 className="font-display text-3xl font-bold drop-shadow">{exp.title}</h1>
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(exp.starts_at), "EEE, d MMM · h:mm a")}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{exp.location}</span>
            </div>
          </div>
        </div>

        <Card className="space-y-3 p-5">
          <p className="text-sm">{exp.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary"><Wallet className="mr-1 h-3 w-3" /> ₹{exp.budget_estimate} pp</Badge>
            <Badge variant="secondary"><Users className="mr-1 h-3 w-3" /> {attendees.length} going</Badge>
            {destinationName && (
              <button onClick={() => navigate(`/destination/${exp.destination_id}`)} className="cursor-pointer">
                <Badge variant="outline">📍 {destinationName} →</Badge>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {isAttending ? (
              <Button variant="outline" onClick={leave}><UserMinus className="mr-1 h-4 w-4" /> Leave</Button>
            ) : (
              <Button onClick={join}><UserPlus className="mr-1 h-4 w-4" /> Join experience</Button>
            )}
            <Button variant="outline" onClick={() => user ? setCreateGroupOpen(true) : navigate("/auth")}>
              <Plus className="mr-1 h-4 w-4" /> Create group
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Attendees ({attendees.length})</h2>
          {attendees.length === 0 ? (
            <p className="text-sm text-muted-foreground">Be the first to join.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => (
                <div key={a.user_id} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                  <span>{a.profile_emoji || "🌴"}</span>
                  <span>{a.display_name || "Explorer"}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Groups ({groups.length})</h2>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups yet — start one to chat, vote and split costs.</p>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <button key={g.id} onClick={() => navigate(`/groups/${g.id}`)} className="block w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{g.name}</div>
                      {g.description && <div className="line-clamp-1 text-xs text-muted-foreground">{g.description}</div>}
                    </div>
                    <Badge variant="secondary">{groupCounts[g.id] || 0}/{g.max_members}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {id && <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} experienceId={id} onCreated={load} />}
    </div>
  );
}