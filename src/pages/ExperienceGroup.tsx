import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, UserMinus, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import GroupChat from "@/components/experiences/GroupChat";
import GroupPolls from "@/components/experiences/GroupPolls";
import GroupExpenses from "@/components/experiences/GroupExpenses";
import type { ExperienceGroup as Grp } from "@/lib/experiences";

export default function ExperienceGroup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Grp | null>(null);
  const [members, setMembers] = useState<{ user_id: string; display_name?: string; profile_emoji?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const isMember = !!user && members.some((m) => m.user_id === user.id);
  const memberIds = members.map((m) => m.user_id);
  const memberNames = Object.fromEntries(members.map((m) => [m.user_id, m.display_name || "Explorer"]));

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: g } = await supabase.from("experience_groups").select("*").eq("id", id).maybeSingle();
    setGroup(g as Grp);
    const { data: m } = await supabase.from("group_members").select("user_id").eq("group_id", id);
    const ids = (m || []).map((r: any) => r.user_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, profile_emoji").in("user_id", ids);
      const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      setMembers(ids.map((uid) => ({ user_id: uid, ...(profMap.get(uid) || {}) })));
    } else setMembers([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`group_members:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const join = async () => {
    if (!user) { navigate("/auth"); return; }
    if (group && members.length >= group.max_members) { toast.error("Group is full"); return; }
    const { error } = await supabase.from("group_members").insert({ group_id: id!, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Joined group!");
  };
  const leave = async () => {
    if (!user) return;
    await supabase.from("group_members").delete().eq("group_id", id!).eq("user_id", user.id);
    toast.success("Left group");
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <div className="container max-w-3xl space-y-3 px-4 py-6">
          <Skeleton className="h-8 w-32" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container max-w-3xl space-y-4 px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">{group.name}</h1>
              {group.description && <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>}
            </div>
            <Badge variant="secondary">{members.length}/{group.max_members}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                <span>{m.profile_emoji || "🌴"}</span><span>{m.display_name || "Explorer"}</span>
              </div>
            ))}
          </div>
          <div>
            {isMember ? (
              <Button variant="outline" size="sm" onClick={leave}><UserMinus className="mr-1 h-4 w-4" /> Leave group</Button>
            ) : (
              <Button size="sm" onClick={join} disabled={members.length >= group.max_members}>
                <UserPlus className="mr-1 h-4 w-4" /> {members.length >= group.max_members ? "Full" : "Join group"}
              </Button>
            )}
          </div>
        </Card>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="polls">Polls</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-3"><GroupChat groupId={group.id} isMember={isMember} /></TabsContent>
          <TabsContent value="polls" className="mt-3"><GroupPolls groupId={group.id} isMember={isMember} /></TabsContent>
          <TabsContent value="expenses" className="mt-3">
            <GroupExpenses groupId={group.id} isMember={isMember} memberIds={memberIds} memberNames={memberNames} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}