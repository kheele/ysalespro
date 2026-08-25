"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Factory,
  Users,
  Target,
  Send,
  Megaphone,
  CheckSquare,
  BarChart3,
  Settings,
  Sparkles,
  Search,
  Command,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import * as organizationServices from "@/services/public/organizationServices";
import * as industryServices from "@/services/public/industryServices";
import * as peopleServices from "@/services/public/peopleServices";
import * as leadServices from "@/services/private/leadServices";
import * as taskServices from "@/services/private/taskServices";
import * as campaignServices from "@/services/private/campaignServices";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
}

function formatBadgeCount(val?: number): string | undefined {
  if (!val || val <= 0) return undefined;
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return `${val}`;
}

interface SalesProSidebarProps {
  onOpenCommandPalette?: () => void;
}

export function SidebarContent({ onOpenCommandPalette }: SalesProSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, dbUser, signOut } = useAuth();

  const [counts, setCounts] = React.useState<{
    companies?: number;
    industries?: number;
    people?: number;
    leads?: number;
    tasks?: number;
    campaigns?: number;
  }>({});

  React.useEffect(() => {
    let isMounted = true;
    async function loadSidebarData() {
      try {
        const [orgsRes, indRes, peopleRes] = await Promise.allSettled([
          organizationServices.getOrganizations({ limit: 1 }),
          industryServices.getIndustries({ limit: 1 }),
          peopleServices.getDecisionMakersAction({ limit: 1 }),
        ]);

        const updated: typeof counts = {};
        if (orgsRes.status === "fulfilled" && orgsRes.value?.total) {
          updated.companies = orgsRes.value.total;
        }
        if (indRes.status === "fulfilled" && indRes.value?.total) {
          updated.industries = indRes.value.total;
        }
        if (peopleRes.status === "fulfilled" && peopleRes.value?.total) {
          updated.people = peopleRes.value.total;
        }

        if (user) {
          try {
            const token = await user.getIdToken(true);
            const [leadsRes, tasksRes, campaignsRes] = await Promise.allSettled([
              leadServices.getLeadsActionByToken(token),
              taskServices.getTasksActionByToken(token),
              campaignServices.getCampaignsActionByToken(token),
            ]);

            if (leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value)) {
              updated.leads = leadsRes.value.length;
            }
            if (tasksRes.status === "fulfilled" && Array.isArray(tasksRes.value)) {
              const pending = tasksRes.value.filter(
                (t) => t.status === "To Do" || t.status === "In Progress"
              );
              updated.tasks = pending.length;
            }
            if (campaignsRes.status === "fulfilled" && Array.isArray(campaignsRes.value)) {
              updated.campaigns = campaignsRes.value.length;
            }
          } catch {
            // Auth error or token expired; keep public counts
          }
        }

        if (isMounted) {
          setCounts((prev) => ({ ...prev, ...updated }));
        }
      } catch (err) {
        console.error("Error loading sidebar live counts:", err);
      }
    }

    loadSidebarData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const navItems: NavItem[] = React.useMemo(() => [
    { name: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Reports & Analytics", href: "/reports", icon: BarChart3 },
    {
      name: "Industries",
      href: "/industries",
      icon: Factory,
      badge: formatBadgeCount(counts.industries),
    },
    {
      name: "Companies",
      href: "/companies",
      icon: Building2,
      badge: formatBadgeCount(counts.companies),
    },
    // {
    //   name: "Decision Makers",
    //   href: "/people",
    //   icon: Users,
    //   badge: formatBadgeCount(counts.people),
    // },
    {
      name: "Lead Pipeline",
      href: "/leads",
      icon: Target,
      badge: counts.leads && counts.leads > 0 ? String(counts.leads) : undefined,
    },
    { name: "AI Messaging", href: "/ai-messaging", icon: Sparkles },
    { name: "Outreach & Calls", href: "/outreach", icon: Send },
    {
      name: "Sales Campaigns",
      href: "/campaigns",
      icon: Megaphone,
      badge: counts.campaigns && counts.campaigns > 0 ? String(counts.campaigns) : undefined,
    },
    {
      name: "Follow-up Tasks",
      href: "/tasks",
      icon: CheckSquare,
      badge: counts.tasks && counts.tasks > 0 ? String(counts.tasks) : undefined,
    },
    { name: "Settings", href: "/settings", icon: Settings },
  ], [counts]);

  const displayName = React.useMemo(() => {
    if (dbUser?.fname) {
      return `${dbUser.fname} ${dbUser.lname || ""}`.trim();
    }
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "Sales Pro";
  }, [dbUser, user]);

  const companyOrRole = React.useMemo(() => {
    return dbUser?.account_company?.name || dbUser?.role || "Enterprise Member";
  }, [dbUser]);

  const initials = React.useMemo(() => {
    if (dbUser?.fname) {
      return `${dbUser.fname[0] || ""}${dbUser.lname?.[0] || ""}`.toUpperCase();
    }
    if (user?.displayName) {
      const parts = user.displayName.split(" ");
      return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "SP";
  }, [dbUser, user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col justify-between h-full select-none">
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  YSalesPro
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">Enterprise Intelligence</p>
            </div>
          </Link>
        </div>

        {/* Global Search Trigger (Linear style) */}
        <div className="px-3 py-3">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground bg-muted/40 hover:bg-muted/70 rounded-lg transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span>Search or command...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Main Navigation List */}
        <nav className="px-3 py-1 space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Platform Modules
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-mono font-medium",
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Real User Profile Footer */}
      <div className="p-3 border-t border-border/40 space-y-2 bg-card/50">
        <div className="p-2 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-between gap-2">
          <Link href="/settings" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-500/30 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{companyOrRole}</p>
            </div>
          </Link>

          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-2 flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono">
          <span>© {new Date().getFullYear()} YSalesPro</span>
        </div>
      </div>
    </div>
  );
}

export function SalesProSidebar({ onOpenCommandPalette }: SalesProSidebarProps) {
  return (
    <aside className="hidden md:flex w-64 border-r border-border/40 bg-card backdrop-blur-xl flex-col justify-between h-screen sticky top-0 z-40 select-none">
      <SidebarContent onOpenCommandPalette={onOpenCommandPalette} />
    </aside>
  );
}

