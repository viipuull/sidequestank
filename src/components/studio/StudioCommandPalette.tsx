import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  Users, Compass, Boxes, CalendarDays, Trophy, Sparkles, LayoutDashboard, History, ShieldCheck, Radio,
} from "lucide-react";
import { studioSearch, type StudioSearchResult } from "@/lib/studio/index.functions";

export function StudioCommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const search = useServerFn(studioSearch);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const { data } = useQuery<StudioSearchResult>({
    queryKey: ["studio-search", q],
    queryFn: () => search({ data: { q } }),
    enabled: q.trim().length >= 2,
    staleTime: 15_000,
  });

  const go = (to: string) => { onOpenChange(false); setQ(""); navigate({ to }); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search players, quests, collections, events…" value={q} onValueChange={setQ} />
      <CommandList>
        {q.trim().length < 2 ? (
          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => go("/studio")}><LayoutDashboard className="mr-2 h-4 w-4" />Studio Home</CommandItem>
            <CommandItem onSelect={() => go("/studio/players")}><Users className="mr-2 h-4 w-4" />Players</CommandItem>
            <CommandItem onSelect={() => go("/studio/moderation")}><ShieldCheck className="mr-2 h-4 w-4" />Moderation</CommandItem>
            <CommandItem onSelect={() => go("/studio/audit")}><History className="mr-2 h-4 w-4" />Audit Log</CommandItem>
            <CommandSeparator />
            <CommandItem onSelect={() => go("/founder/quests/new")}><Sparkles className="mr-2 h-4 w-4" />Create Quest</CommandItem>
            <CommandItem onSelect={() => go("/founder/liveops")}><Radio className="mr-2 h-4 w-4" />LiveOps Manager</CommandItem>
            <CommandItem onSelect={() => go("/founder/collections")}><Boxes className="mr-2 h-4 w-4" />Collections</CommandItem>
          </CommandGroup>
        ) : (
          <>
            <CommandEmpty>No matches.</CommandEmpty>
            {data?.players && data.players.length > 0 && (
              <CommandGroup heading="Players">
                {data.players.map((p) => (
                  <CommandItem key={p.id} onSelect={() => go(`/players/${p.username}`)}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>{p.display_name} <span className="text-muted-foreground">@{p.username}</span></span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {data?.quests && data.quests.length > 0 && (
              <CommandGroup heading="Quests">
                {data.quests.map((q2) => (
                  <CommandItem key={q2.id} onSelect={() => go(`/founder/quests/${q2.id}`)}>
                    <Compass className="mr-2 h-4 w-4" />
                    <span>{q2.title} <span className="text-muted-foreground">· {q2.status}</span></span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {data?.collections && data.collections.length > 0 && (
              <CommandGroup heading="Collections">
                {data.collections.map((c) => (
                  <CommandItem key={c.id} onSelect={() => go(`/founder/collections/${c.id}`)}>
                    <Boxes className="mr-2 h-4 w-4" />{c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {data?.events && data.events.length > 0 && (
              <CommandGroup heading="Events">
                {data.events.map((e) => (
                  <CommandItem key={e.id} onSelect={() => go(`/events/${e.slug}`)}>
                    <CalendarDays className="mr-2 h-4 w-4" />{e.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {data?.achievements && data.achievements.length > 0 && (
              <CommandGroup heading="Achievements">
                {data.achievements.map((a) => (
                  <CommandItem key={a.id} onSelect={() => go(`/achievements/${a.slug}`)}>
                    <Trophy className="mr-2 h-4 w-4" />{a.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {data?.titles && data.titles.length > 0 && (
              <CommandGroup heading="Titles">
                {data.titles.map((t) => (
                  <CommandItem key={t.id} onSelect={() => go(`/titles`)}>
                    <Sparkles className="mr-2 h-4 w-4" />{t.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}