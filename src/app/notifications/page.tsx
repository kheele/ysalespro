"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Flame,
  MessageSquare,
  Clock,
  Megaphone,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  getNotificationsActionByToken,
  markAsReadActionByToken,
  markAllAsReadActionByToken,
} from "@/services/private/notificationServices";
import type { NotificationItem, NotificationType } from "@/lib/types";

function formatNotificationTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function getTypeIcon(type?: NotificationType | string) {
  switch (type) {
    case "New hot lead":
      return <Flame className="h-4 w-4 text-red-400" />;
    case "Reply received":
      return <MessageSquare className="h-4 w-4 text-emerald-400" />;
    case "Follow-up due":
    case "Task overdue":
      return <Clock className="h-4 w-4 text-amber-400" />;
    case "Campaign completed":
      return <Megaphone className="h-4 w-4 text-purple-400" />;
    default:
      return <Bell className="h-4 w-4 text-indigo-400" />;
  }
}

function getPriorityBadge(priority?: string) {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "high":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "medium":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [tabFilter, setTabFilter] = React.useState<"all" | "unread" | "replies" | "tasks">("all");

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const res = await getNotificationsActionByToken(token);
      setNotifications(res || []);
    } catch (e) {
      console.error("Failed to load notifications:", e);
      toast({
        title: "Error loading notifications",
        description: "Could not retrieve notifications from the server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    const handleRefresh = () => load();
    window.addEventListener("salespro:refresh-notifications", handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("salespro:refresh-notifications", handleRefresh);
    };
  }, [load]);

  const handleMarkRead = async (id: number) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await markAsReadActionByToken(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("salespro:refresh-notifications"));
      }
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await markAllAsReadActionByToken(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({
        title: "All marked as read",
        description: "All notifications are now marked as read.",
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("salespro:refresh-notifications"));
      }
    } catch (e) {
      console.error("Failed to mark all read:", e);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.read) {
      await handleMarkRead(n.id);
    }
    if (n.action_url) {
      router.push(n.action_url);
    }
  };

  // Filtered Notifications
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (tabFilter === "unread" && n.read) return false;
      if (tabFilter === "replies" && n.type !== "Reply received" && n.type !== "New hot lead") return false;
      if (tabFilter === "tasks" && n.type !== "Follow-up due" && n.type !== "Task overdue") return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = n.title?.toLowerCase().includes(q);
        const msgMatch = n.message?.toLowerCase().includes(q);
        const entityMatch = n.related_entity_name?.toLowerCase().includes(q);
        if (!titleMatch && !msgMatch && !entityMatch) return false;
      }

      return true;
    });
  }, [notifications, tabFilter, search]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const replyCount = notifications.filter((n) => n.type === "Reply received" || n.type === "New hot lead").length;
  const taskCount = notifications.filter((n) => n.type === "Follow-up due" || n.type === "Task overdue").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Notification Center"
          subtitle="Real-time alerts for incoming prospect replies, hot lead escalations, and overdue tasks"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card
              onClick={() => setTabFilter("all")}
              className={`p-4 cursor-pointer transition-all border ${
                tabFilter === "all"
                  ? "ring-2 ring-indigo-500 bg-indigo-500/10 border-indigo-500/40"
                  : "bg-card border-border/40 hover:border-border/80"
              }`}
            >
              <div className="text-2xl font-extrabold font-mono text-foreground">{notifications.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Total Alerts</div>
            </Card>

            <Card
              onClick={() => setTabFilter("unread")}
              className={`p-4 cursor-pointer transition-all border ${
                tabFilter === "unread"
                  ? "ring-2 ring-red-500 bg-red-500/10 border-red-500/40"
                  : "bg-card border-border/40 hover:border-border/80"
              }`}
            >
              <div className="text-2xl font-extrabold font-mono text-red-400">{unreadCount}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Unread Alerts</div>
            </Card>

            <Card
              onClick={() => setTabFilter("replies")}
              className={`p-4 cursor-pointer transition-all border ${
                tabFilter === "replies"
                  ? "ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/40"
                  : "bg-card border-border/40 hover:border-border/80"
              }`}
            >
              <div className="text-2xl font-extrabold font-mono text-emerald-400">{replyCount}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Hot Replies & Leads</div>
            </Card>

            <Card
              onClick={() => setTabFilter("tasks")}
              className={`p-4 cursor-pointer transition-all border ${
                tabFilter === "tasks"
                  ? "ring-2 ring-amber-500 bg-amber-500/10 border-amber-500/40"
                  : "bg-card border-border/40 hover:border-border/80"
              }`}
            >
              <div className="text-2xl font-extrabold font-mono text-amber-400">{taskCount}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Tasks & Follow-ups</div>
            </Card>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/40">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setTabFilter("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  tabFilter === "all" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTabFilter("unread")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  tabFilter === "unread" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setTabFilter("replies")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  tabFilter === "replies" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Replies
              </button>
              <button
                onClick={() => setTabFilter("tasks")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  tabFilter === "tasks" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Follow-ups
              </button>
            </div>

            {/* Search + Mark All Read */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 bg-muted/40 text-xs h-8"
                />
              </div>

              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAllRead}
                  className="text-xs h-8 gap-1.5 border-border/60 hover:bg-muted shrink-0"
                >
                  <CheckCheck className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Mark All Read</span>
                </Button>
              )}
            </div>
          </div>

          {/* Notification Items List */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-card rounded-xl border border-border/30 animate-pulse" />
              ))
            ) : filteredNotifications.length === 0 ? (
              <div className="py-16 text-center bg-card rounded-2xl border border-border/40 flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-foreground">No notifications found</div>
                  <div className="text-xs text-muted-foreground max-w-sm">
                    {search
                      ? "No notifications match your current search query."
                      : "You're all caught up! New alerts and prospect replies will appear here in real time."}
                  </div>
                </div>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      n.read
                        ? "bg-card/50 border-border/30 opacity-75 hover:opacity-100"
                        : "bg-card border-indigo-500/30 shadow-md shadow-indigo-500/5 hover:border-indigo-500/60"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Icon */}
                      <div className="h-9 w-9 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
                        {getTypeIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold truncate ${n.read ? "text-foreground/80" : "text-foreground"}`}>
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" title="Unread" />
                          )}
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${getPriorityBadge(n.priority)} uppercase font-mono`}>
                            {n.priority || "normal"}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/40 bg-muted/30 text-muted-foreground">
                            {n.type}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {n.message}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70 pt-0.5">
                          <span>{formatNotificationTime(n.timestamp || n.created_at)}</span>
                          {n.related_entity_name && (
                            <>
                              <span>•</span>
                              <span>Target: <strong className="text-foreground/80">{n.related_entity_name}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20">
                      {!n.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs h-8 text-muted-foreground hover:text-foreground"
                          title="Mark as Read"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                          Mark read
                        </Button>
                      )}

                      {n.action_url && (
                        <Button
                          size="sm"
                          onClick={() => handleNotificationClick(n)}
                          className="text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 font-semibold"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
