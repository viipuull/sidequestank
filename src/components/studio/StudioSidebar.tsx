import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BarChart3, Users, ShieldCheck, Boxes, Radio, Image as ImageIcon,
  Trophy, ListChecks, History, Settings, Sparkles,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: any; badge?: string };

const overview: Item[] = [
  { title: "Home", url: "/studio", icon: LayoutDashboard },
  { title: "Analytics", url: "/studio/analytics", icon: BarChart3, badge: "Soon" },
];

const community: Item[] = [
  { title: "Players", url: "/studio/players", icon: Users, badge: "Soon" },
  { title: "Moderation", url: "/studio/moderation", icon: ShieldCheck, badge: "Soon" },
];

const content: Item[] = [
  { title: "Content", url: "/studio/content", icon: Boxes, badge: "Soon" },
  { title: "Media Library", url: "/studio/media", icon: ImageIcon, badge: "Soon" },
  { title: "Rewards", url: "/studio/rewards", icon: Trophy, badge: "Soon" },
];

const ops: Item[] = [
  { title: "LiveOps", url: "/founder/liveops", icon: Radio },
  { title: "Quests", url: "/founder/quests", icon: ListChecks },
  { title: "Audit Log", url: "/studio/audit", icon: History },
  { title: "Settings", url: "/studio/settings", icon: Settings, badge: "Soon" },
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
        <Section label="Community" items={community} currentPath={currentPath} />
        <Section label="Content" items={content} currentPath={currentPath} />
        <Section label="Operations" items={ops} currentPath={currentPath} />
      </SidebarContent>
    </Sidebar>
  );
}