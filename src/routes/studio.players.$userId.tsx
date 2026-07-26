import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2, ArrowLeft, Shield, ShieldCheck, EyeOff, Eye, Plus, Minus, Trash2, RotateCcw,
} from "lucide-react";
import {
  getPlayerDetail, suspendPlayer, restorePlayer, setProfileHidden, adjustXp,
  grantTitleToPlayer, revokeTitleFromPlayer, grantAchievementToPlayer, revokeAchievementFromPlayer,
  resetQuestSession, resetEventProgress, listAllTitles, listAllAchievements,
} from "@/lib/admin/players.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/studio/players/$userId")({
  component: PlayerDetail,
});

function PlayerDetail() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getPlayerDetail);
  const titlesFn = useServerFn(listAllTitles);
  const achFn = useServerFn(listAllAchievements);

  const { data, isLoading, isError, refetch } = useQuery<any>({
    queryKey: ["admin-player", userId],
    queryFn: () => get({ data: { userId } }),
  });
  const { data: titles } = useQuery<any[]>({ queryKey: ["admin-titles-all"], queryFn: () => titlesFn() });
  const { data: achievements } = useQuery<any[]>({ queryKey: ["admin-achievements-all"], queryFn: () => achFn() });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ["admin-player", userId] }); qc.invalidateQueries({ queryKey: ["admin-players"] }); };

  const suspend = useMutation({ mutationFn: useServerFn(suspendPlayer), onSuccess: () => { toast.success("Player suspended"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const restore = useMutation({ mutationFn: useServerFn(restorePlayer), onSuccess: () => { toast.success("Player restored"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const hide = useMutation({ mutationFn: useServerFn(setProfileHidden), onSuccess: () => { toast.success("Visibility updated"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const xp = useMutation({ mutationFn: useServerFn(adjustXp), onSuccess: () => { toast.success("XP updated"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const grantT = useMutation({ mutationFn: useServerFn(grantTitleToPlayer), onSuccess: () => { toast.success("Title granted"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const revokeT = useMutation({ mutationFn: useServerFn(revokeTitleFromPlayer), onSuccess: () => { toast.success("Title revoked"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const grantA = useMutation({ mutationFn: useServerFn(grantAchievementToPlayer), onSuccess: () => { toast.success("Achievement granted"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const revokeA = useMutation({ mutationFn: useServerFn(revokeAchievementFromPlayer), onSuccess: () => { toast.success("Achievement revoked"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const resetQ = useMutation({ mutationFn: useServerFn(resetQuestSession), onSuccess: () => { toast.success("Session reset"); invalidate(); }, onError: (e: any) => toast.error(e.message) });
  const resetE = useMutation({ mutationFn: useServerFn(resetEventProgress), onSuccess: () => { toast.success("Event progress reset"); invalidate(); }, onError: (e: any) => toast.error(e.message) });

  const [suspendReason, setSuspendReason] = useState("");
  const [xpDelta, setXpDelta] = useState("");
  const [xpReason, setXpReason] = useState("");
  const [pickedTitle, setPickedTitle] = useState<string>("");
  const [pickedAch, setPickedAch] = useState<string>("");

  if (isLoading) return <div className="p-12 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (isError || !data) return (
    <Card className="p-6 space-y-3">
      <p className="text-sm text-muted-foreground">Couldn't load player.</p>
      <Button size="sm" onClick={() => refetch()}>Retry</Button>
    </Card>
  );

  const p = data.profile;
  const suspended = !!p.suspended_at;
  const hidden = !!data.social?.moderation_hidden;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/studio/players" })} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> All players
      </Button>

      <Card className="p-4">
        <div className="flex items-start gap-4">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center text-xl font-semibold">
              {p.display_name?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold">{p.display_name}</h1>
              {data.is_founder && <span className="text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Founder</span>}
              {p.is_pioneer && <span className="text-[10px] uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded">Pioneer #{p.pioneer_number}</span>}
              {suspended && <span className="text-[10px] uppercase tracking-widest bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Suspended</span>}
              {hidden && <span className="text-[10px] uppercase tracking-widest bg-muted text-muted-foreground px-2 py-0.5 rounded">Hidden</span>}
            </div>
            <div className="text-sm text-muted-foreground">@{p.username} · {p.city} · {data.email ?? "no email"}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Joined {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
              {data.last_sign_in_at && ` · Last sign-in ${formatDistanceToNow(new Date(data.last_sign_in_at), { addSuffix: true })}`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold tabular-nums">Lv {p.level}</div>
            <div className="text-xs text-muted-foreground">{p.xp?.toLocaleString?.() ?? p.xp} XP</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {suspended ? (
            <ConfirmAction label="Restore" icon={<ShieldCheck className="h-4 w-4" />} tone="default"
              onConfirm={() => restore.mutate({ data: { userId } })}
              pending={restore.isPending} title="Restore this player?" body="They will regain access to their account." />
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="gap-1.5"><Shield className="h-4 w-4" />Suspend</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspend this player?</AlertDialogTitle>
                  <AlertDialogDescription>They will be signed out of their next session. Provide an internal reason.</AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Reason (internal)" />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => suspend.mutate({ data: { userId, reason: suspendReason } })} disabled={suspend.isPending}>
                    {suspend.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Suspend
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <ConfirmAction label={hidden ? "Unhide profile" : "Hide profile"} icon={hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} tone="outline"
            onConfirm={() => hide.mutate({ data: { userId, hidden: !hidden } })} pending={hide.isPending}
            title={hidden ? "Unhide this profile?" : "Hide this profile?"}
            body="Hidden profiles are removed from leaderboards and public discovery." />
        </div>
      </Card>

      <Tabs defaultValue="progression">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="progression">Progression</TabsTrigger>
          <TabsTrigger value="titles">Titles ({data.titles?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="achievements">Achievements ({data.achievements?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="collections">Collections ({data.collections?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="quests">Quests ({data.quest_sessions?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="events">Events ({data.events?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="xp">XP History</TabsTrigger>
        </TabsList>

        <TabsContent value="progression" className="space-y-3 mt-3">
          <Card className="p-4">
            <div className="text-sm font-medium mb-3">Grant / Remove XP</div>
            <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
              <Input type="number" value={xpDelta} onChange={(e) => setXpDelta(e.target.value)} placeholder="±XP" />
              <Input value={xpReason} onChange={(e) => setXpReason(e.target.value)} placeholder="Reason (audit)" />
              <Button variant="outline" onClick={() => { const n = Number(xpDelta); if (n>0) xp.mutate({ data: { userId, delta: n, reason: xpReason } }); }} disabled={xp.isPending || Number(xpDelta)<=0} className="gap-1"><Plus className="h-4 w-4" />Grant</Button>
              <Button variant="outline" onClick={() => { const n = Number(xpDelta); if (n>0) xp.mutate({ data: { userId, delta: -n, reason: xpReason } }); }} disabled={xp.isPending || Number(xpDelta)<=0} className="gap-1"><Minus className="h-4 w-4" />Remove</Button>
            </div>
          </Card>
          <Card className="p-4 text-sm space-y-1 text-muted-foreground">
            <div>Lifetime XP: <span className="text-foreground tabular-nums">{data.progress?.lifetime_xp?.toLocaleString?.() ?? 0}</span></div>
            <div>Quests completed: <span className="text-foreground tabular-nums">{data.progress?.total_quests_completed ?? 0}</span></div>
            <div>Level: <span className="text-foreground tabular-nums">{data.progress?.current_level ?? 1}</span></div>
          </Card>
        </TabsContent>

        <TabsContent value="titles" className="space-y-3 mt-3">
          <Card className="p-4 space-y-2">
            <div className="text-sm font-medium">Grant a title</div>
            <div className="flex gap-2">
              <Select value={pickedTitle} onValueChange={setPickedTitle}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select title…" /></SelectTrigger>
                <SelectContent>
                  {(titles ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} · {t.rarity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled={!pickedTitle || grantT.isPending} onClick={() => grantT.mutate({ data: { userId, titleId: pickedTitle } })}>Grant</Button>
            </div>
          </Card>
          <Card className="p-4">
            {(data.titles ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No titles yet.</p> : (
              <ul className="divide-y divide-border/50">
                {data.titles.map((t: any) => (
                  <li key={t.title_id} className="py-2 flex items-center justify-between gap-3">
                    <div className="text-sm"><span className="font-medium">{t.name}</span> · <span className="text-muted-foreground">{t.rarity}</span> · <span className="text-xs text-muted-foreground">{t.source}</span></div>
                    <ConfirmAction label="Revoke" tone="destructive" icon={<Trash2 className="h-3 w-3" />} size="sm"
                      onConfirm={() => revokeT.mutate({ data: { userId, titleId: t.title_id } })}
                      pending={revokeT.isPending} title="Revoke this title?" body="This action is audited." />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-3 mt-3">
          <Card className="p-4 space-y-2">
            <div className="text-sm font-medium">Grant an achievement</div>
            <div className="flex gap-2">
              <Select value={pickedAch} onValueChange={setPickedAch}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select achievement…" /></SelectTrigger>
                <SelectContent>
                  {(achievements ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} · {a.rarity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled={!pickedAch || grantA.isPending} onClick={() => grantA.mutate({ data: { userId, achievementId: pickedAch } })}>Grant</Button>
            </div>
          </Card>
          <Card className="p-4">
            {(data.achievements ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No achievements yet.</p> : (
              <ul className="divide-y divide-border/50">
                {data.achievements.map((a: any) => (
                  <li key={a.achievement_id} className="py-2 flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <span className="font-medium">{a.name}</span>
                      {a.completed ? <span className="ml-2 text-[10px] uppercase text-green-400">Completed</span> : <span className="ml-2 text-[10px] uppercase text-muted-foreground">{a.progress}/{a.target}</span>}
                    </div>
                    <ConfirmAction label="Revoke" tone="destructive" icon={<Trash2 className="h-3 w-3" />} size="sm"
                      onConfirm={() => revokeA.mutate({ data: { userId, achievementId: a.achievement_id } })}
                      pending={revokeA.isPending} title="Revoke this achievement?" body="This action is audited." />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="mt-3">
          <Card className="p-4">
            {(data.collections ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No collection progress.</p> : (
              <ul className="divide-y divide-border/50">
                {data.collections.map((c: any) => (
                  <li key={c.collection_id} className="py-2 flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span className={c.completed ? "text-green-400" : "text-muted-foreground"}>{c.percent}%</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="quests" className="mt-3">
          <Card className="p-4">
            {(data.quest_sessions ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No quest history.</p> : (
              <ul className="divide-y divide-border/50">
                {data.quest_sessions.map((q: any) => (
                  <li key={q.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{q.title}</div>
                      <div className="text-xs text-muted-foreground">{q.status} · {formatDistanceToNow(new Date(q.started_at), { addSuffix: true })}</div>
                    </div>
                    <ConfirmAction label="Reset" tone="outline" icon={<RotateCcw className="h-3 w-3" />} size="sm"
                      onConfirm={() => resetQ.mutate({ data: { sessionId: q.id } })}
                      pending={resetQ.isPending} title="Reset this quest session?" body="Objective progress will be cleared. Player can restart." />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-3">
          <Card className="p-4">
            {(data.events ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No event participation.</p> : (
              <ul className="divide-y divide-border/50">
                {data.events.map((e: any) => (
                  <li key={e.event_id} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{e.name}</div>
                      <div className="text-xs text-muted-foreground">{e.progress}/{e.target} · {e.completed ? "Completed" : "In progress"}</div>
                    </div>
                    <ConfirmAction label="Reset" tone="outline" icon={<RotateCcw className="h-3 w-3" />} size="sm"
                      onConfirm={() => resetE.mutate({ data: { userId, eventId: e.event_id } })}
                      pending={resetE.isPending} title="Reset event progress?" body="Progress and reward flag will be cleared." />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="xp" className="mt-3">
          <Card className="p-4">
            {(data.recent_xp ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No XP events yet.</p> : (
              <ul className="divide-y divide-border/50 text-sm">
                {data.recent_xp.map((x: any) => (
                  <li key={x.id} className="py-2 flex justify-between">
                    <div>
                      <div className="font-medium">{x.reason}</div>
                      <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(x.created_at), { addSuffix: true })}</div>
                    </div>
                    <div className={`tabular-nums font-medium ${x.xp_earned>=0?"text-green-400":"text-red-400"}`}>
                      {x.xp_earned>=0?"+":""}{x.xp_earned}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConfirmAction({
  label, icon, tone = "default", size = "sm", onConfirm, pending, title, body,
}: { label: string; icon?: React.ReactNode; tone?: "default"|"outline"|"destructive"; size?: "sm"|"default"; onConfirm: () => void; pending?: boolean; title: string; body: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size={size} variant={tone === "destructive" ? "destructive" : tone === "outline" ? "outline" : "default"} className="gap-1.5" disabled={pending}>
          {icon}{label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>{pending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}