"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
}

const NAV_ITEMS: NavItem[] = [
  { name: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Companies", href: "/companies", icon: Building2, badge: "1.2k" },
  { name: "Industries", href: "/industries", icon: Factory },
  { name: "Decision Makers", href: "/people", icon: Users, badge: "3.8k" },
  { name: "Lead Pipeline", href: "/leads", icon: Target, badge: "HOT" },
  { name: "AI Messaging", href: "/ai-messaging", icon: Sparkles, badge: "AI" },
  { name: "Outreach & Calls", href: "/outreach", icon: Send },
  { name: "Sales Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Follow-up Tasks", href: "/tasks", icon: CheckSquare, badge: "4" },
  { name: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SalesProSidebarProps {
  onOpenCommandPalette?: () => void;
}

export function SidebarContent({ onOpenCommandPalette }: SalesProSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-between h-full select-none">
      <div>
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
          {NAV_ITEMS.map((item) => {
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
                      item.badge === "HOT"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                        : isActive
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-muted text-muted-foreground"
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

      {/* Footer Info */}
      <div className="p-3 border-t border-border/40 space-y-2">
        <div className="p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <p className="text-[10px] text-center text-muted-foreground">
                © {new Date().getFullYear()} YSalesPro
              </p>
            </div>
          </div>
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
