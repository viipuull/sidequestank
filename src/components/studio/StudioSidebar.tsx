import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Radio, Trophy, ListChecks, History, Sparkles,
  Compass, Award,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: any; badge?: string };

// Sprint A: only shipped routes appear. Unfinished features are hidden
// rather than surfaced as "Coming soon" placeholders.
const overview: Item[] = [
  { title: "Home", url: "/studio", icon: LayoutDashboard },
  { title: "Audit Log", url: "/studio/audit", icon: History },
];

const content: Item[] = [
  { title: "Quests", url: "/founder/quests", icon: ListChecks },
  { title: "Collections", url: "/founder/collections", icon: Compass },
  { title: "Achievements", url: "/founder/achievements", icon: Trophy },
  { title: "Titles", url: "/founder/titles", icon: Award },
];

const ops: Item[] = [
  { title: "LiveOps", url: "/founder/liveops", icon: Radio },
  { title: "Social", url: "/founder/social", icon: Users },
];

function Section({ label, items, currentPath }: { label: string; items: Item[]; currentPath: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = currentPath === item.url || (item.url !== "/studio" && currentPath.startsWith(item.url + "/"));
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link to={item.url} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <span className="flex-1 flex items-center justify-between">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function StudioSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-purple-600 text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">SideQuest Studio</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pro</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Section label="Overview" items={overview} currentPath={currentPath} />
        <Section label="Content" items={content} currentPath={currentPath} />
        <Section label="Operations" items={ops} currentPath={currentPath} />
      </SidebarContent>
    </Sidebar>
  );
}