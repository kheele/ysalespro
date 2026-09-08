"use client";

import * as React from "react";
import {
  Bell,
  Plus,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getNotificationsActionByToken, markAsReadActionByToken, markAllAsReadActionByToken } from "@/services/private/notificationServices";
import type { NotificationItem } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/salespro-sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SalesProHeaderProps {
  title: string;
  subtitle?: string;
  onOpenCommandPalette?: () => void;
  onAddCompanyClick?: () => void;
  onNewCampaignClick?: () => void;
}

function formatNotificationTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
}

export function SalesProHeader({
  title,
  subtitle,
  onOpenCommandPalette,
  onAddCompanyClick,
  onNewCampaignClick,
}: SalesProHeaderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const router = useRouter();

  const loadNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      const res = await getNotificationsActionByToken(token);
      setNotifications(res || []);
      setUnreadCount((res || []).filter((n) => !n.read).length);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  }, [user]);

  React.useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    const handleRefresh = () => loadNotifications();
    window.addEventListener("salespro:refresh-notifications", handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("salespro:refresh-notifications", handleRefresh);
    };
  }, [loadNotifications]);

  const handleMarkRead = async (id: number) => {
    if (user) {
      try {
        const token = await user.getIdToken(true);
        await markAsReadActionByToken(token, id);
      } catch (e) {
        console.error("Failed to mark notification as read:", e);
      }
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (user) {
      try {
        const token = await user.getIdToken(true);
        await markAllAsReadActionByToken(token);
      } catch (e) {
        console.error("Failed to mark all notifications as read:", e);
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    await handleMarkRead(n.id);
    if (n.action_url) {
      router.push(n.action_url);
    }
  };

  return (
    <header className="h-16 border-b border-border/40 bg-card backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title & Mobile Menu */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-card/95 border-r border-border/40 backdrop-blur-2xl">
            <SidebarContent onOpenCommandPalette={onOpenCommandPalette} />
          </SheetContent>
        </Sheet>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate max-w-[160px] sm:max-w-none">{title}</h1>
          </div>
          {/* {subtitle && <p className="hidden sm:block text-xs text-muted-foreground">{subtitle}</p>} */}
        </div>
      </div>

      {/* Header Controls & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Action Buttons */}
        {onAddCompanyClick && (
          <Button
            size="sm"
            onClick={onAddCompanyClick}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Company</span>
          </Button>
        )}

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-84 sm:w-96 p-2">
            <DropdownMenuLabel className="flex items-center justify-between text-xs font-semibold pb-1.5">
              <div className="flex items-center gap-1.5">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAllRead();
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-normal hover:underline"
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Bell className="h-6 w-6 text-muted-foreground/30" />
                  <span className="font-semibold text-foreground/80">All caught up!</span>
                  <span className="text-[11px] text-muted-foreground max-w-[200px]">
                    New prospect replies and hot lead alerts will appear here.
                  </span>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                      n.read
                        ? "opacity-60 bg-transparent border-transparent hover:bg-muted/40"
                        : "bg-muted/50 border-indigo-500/20 font-medium hover:bg-muted/80 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground truncate">{n.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {formatNotificationTime(n.timestamp || n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <Link
              href="/notifications"
              className="block text-center py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-muted/30 rounded-md transition-colors"
            >
              View All Notifications →
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Avatar */}
        <UserNav />
      </div>
    </header>
  );
}

