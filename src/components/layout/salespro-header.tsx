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
import { getNotificationsActionByToken, markAsReadActionByToken } from "@/services/private/notificationServices";
import type { NotificationItem } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/salespro-sidebar";
import { UserNav } from "@/components/layout/user-nav";

interface SalesProHeaderProps {
  title: string;
  subtitle?: string;
  onOpenCommandPalette?: () => void;
  onAddCompanyClick?: () => void;
  onNewCampaignClick?: () => void;
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

  React.useEffect(() => {
    async function loadNotifications() {
      if (!user) return;
      try {
        const token = await user.getIdToken(true);
        const res = await getNotificationsActionByToken(token);
        setNotifications(res || []);
        setUnreadCount((res || []).filter((n) => !n.read).length);
      } catch (e) {
        console.error("Failed to load notifications:", e);
      }
    }
    loadNotifications();
  }, [user]);

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
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuLabel className="flex items-center justify-between text-xs font-semibold">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-400">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${n.read ? "opacity-60 bg-transparent hover:bg-muted/50" : "bg-muted/40 font-medium hover:bg-muted/80"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground">{n.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Avatar */}
        <UserNav />
      </div>
    </header>
  );
}

