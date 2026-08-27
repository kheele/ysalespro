"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  getOutreachActivitiesActionByToken,
  logOutreachActionByToken,
} from "@/services/private/outreachServices";
import {
  classifyInboundReplyAction,
  processCallTranscriptAction,
} from "@/services/private/aiMessageServices";
import { createTaskActionByToken } from "@/services/private/taskServices";
import type { ClassifyInboundReplyOutput } from "@/ai/schemas/inbound-reply";
import type { ProcessCallTranscriptOutput } from "@/ai/schemas/call-transcript";
import type {
  OutreachActivity,
  OutreachChannel,
} from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search,
  Mail,
  Phone,
  Linkedin,
  Users,
  Calendar,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Filter,
  ChevronRight,
  ArrowRight,
  Bell,
  Sparkles,
  Mic,
  Copy,
  Check,
  Loader2,
  Lightbulb,
  Target,
  Shield,
} from "lucide-react";

// ─── Channel Metadata ───────────────────────────────────────────────────────
const CHANNEL_META: Record<OutreachChannel, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Email: { icon: <Mail className="h-4 w-4" />, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
  Phone: { icon: <Phone className="h-4 w-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  LinkedIn: { icon: <Linkedin className="h-4 w-4" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  Meeting: { icon: <Users className="h-4 w-4" />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
};

const STATUS_META: Record<string, { icon: React.ReactNode; color: string }> = {
  Sent: { icon: <Send className="h-3 w-3" />, color: "text-muted-foreground" },
  Delivered: { icon: <CheckCircle2 className="h-3 w-3" />, color: "text-slate-400" },
  Opened: { icon: <Mail className="h-3 w-3" />, color: "text-indigo-400" },
  Clicked: { icon: <ArrowRight className="h-3 w-3" />, color: "text-blue-400" },
  Replied: { icon: <MessageSquare className="h-3 w-3" />, color: "text-emerald-400" },
  Called: { icon: <Phone className="h-3 w-3" />, color: "text-emerald-400" },
  Connected: { icon: <CheckCircle2 className="h-3 w-3" />, color: "text-emerald-400" },
  Voicemail: { icon: <Bell className="h-3 w-3" />, color: "text-amber-400" },
  "No Answer": { icon: <XCircle className="h-3 w-3" />, color: "text-red-400" },
  "Meeting Set": { icon: <Calendar className="h-3 w-3" />, color: "text-purple-400" },
  Completed: { icon: <CheckCircle2 className="h-3 w-3" />, color: "text-emerald-400" },
  Scheduled: { icon: <Clock className="h-3 w-3" />, color: "text-amber-400" },
  Bounced: { icon: <AlertCircle className="h-3 w-3" />, color: "text-red-400" },
};

const ALL_CHANNELS: (OutreachChannel | "all")[] = ["all", "Email", "Phone", "LinkedIn", "Meeting"];

// ─── Activity Card ──────────────────────────────────────────────────────────
function ActivityCard({ activity }: { activity: OutreachActivity }) {
  const [expanded, setExpanded] = React.useState(false);
  const ch = CHANNEL_META[activity.channel];
  const st = STATUS_META[activity.status] || STATUS_META["Sent"];

  const formattedDate = React.useMemo(() => {
    try {
      return new Date(activity.timestamp || activity.date || Date.now()).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return activity.date || ""; }
  }, [activity]);

  const followupDate = React.useMemo(() => {
    if (!activity.next_followup) return null;
    try {
      return new Date(activity.next_followup).toLocaleDateString("en-US", {
        month: "short", day: "numeric",
      });
    } catch { return activity.next_followup; }
  }, [activity]);

  return (
    <div className={`rounded-xl ${ch.border} bg-card backdrop-blur-sm hover:bg-card/80 transition-all`}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Channel Icon */}
        <div className={`h-9 w-9 rounded-xl ${ch.bg} ${ch.border} flex items-center justify-center ${ch.color} shrink-0 mt-0.5`}>
          {ch.icon}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-sm text-foreground">{activity.subject}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mt-0.5">
                <span className="font-semibold text-foreground">{activity.recipient_name}</span>
                {activity.recipient_title && <span>· {activity.recipient_title}</span>}
                <span>·</span>
                <span className={ch.color}>{activity.recipient_org}</span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono shrink-0">{formattedDate}</span>
          </div>

          {/* Status + Channel + Follow-up row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge className={`${ch.bg} ${ch.color} border ${ch.border} text-[10px] gap-1`}>
              {ch.icon} {activity.channel}
            </Badge>
            <Badge className={`bg-card/40 border border-border/40 text-[10px] gap-1 ${st.color}`}>
              {st.icon} {activity.status}
            </Badge>
            {followupDate && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                <Bell className="h-3 w-3" /> Follow-up: {followupDate}
                {activity.followup_days && ` (${activity.followup_days}d)`}
              </span>
            )}
            {activity.assigned_to && (
              <span className="text-[10px] text-muted-foreground ml-auto">→ {activity.assigned_to}</span>
            )}
          </div>
        </div>

        <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform mt-1 ${expanded ? "rotate-90" : ""}`} />
      </div>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div className={`px-4 pb-4 pt-0 border-t ${ch.border} space-y-3 text-xs`}>
          {activity.message && (
            <div className="space-y-1 pt-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Message</p>
              <p className="text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/40">
                {activity.message}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activity.response && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Response</p>
                <p className="text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border/30">{activity.response}</p>
              </div>
            )}
            {activity.outcome && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Outcome / Next Step</p>
                <p className="text-foreground font-semibold bg-muted/20 p-2 rounded-lg border border-border/30">{activity.outcome}</p>
              </div>
            )}
            {followupDate && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Follow-Up Due</p>
                <p className="text-amber-400 font-bold font-mono bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                  {followupDate} · in {activity.followup_days} days
                </p>
              </div>
            )}
          </div>

          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/20">
              {activity.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-[9px] bg-muted/30 font-mono px-1.5">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
function OutreachPageContent() {
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams?.get("email") || "";
  const prefilledOrg = searchParams?.get("organization") || "";

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [activities, setActivities] = React.useState<OutreachActivity[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState<OutreachChannel | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [assignedFilter, setAssignedFilter] = React.useState("all");

  const availableReps = React.useMemo(() => {
    return Array.from(new Set(activities.map(a => a.assigned_to).filter(Boolean))) as string[];
  }, [activities]);

  // Compose modal
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    channel: "Email" as OutreachChannel,
    recipient_name: "",
    recipient_org: prefilledOrg,
    recipient_email: prefilledEmail,
    recipient_title: "",
    subject: "",
    message: "",
    next_followup: "",
    followup_days: "3",
    assigned_to: "",
  });

  // AI Inbound Reply Triage State
  const [triageOpen, setTriageOpen] = React.useState(false);
  const [triageMessage, setTriageMessage] = React.useState("");
  const [triageSubject, setTriageSubject] = React.useState("");
  const [triageProspect, setTriageProspect] = React.useState("");
  const [triageCompany, setTriageCompany] = React.useState("");
  const [triageLoading, setTriageLoading] = React.useState(false);
  const [triageResult, setTriageResult] = React.useState<ClassifyInboundReplyOutput | null>(null);
  const [triageCopied, setTriageCopied] = React.useState(false);

  // AI Call Transcript Processor State
  const [callNotesOpen, setCallNotesOpen] = React.useState(false);
  const [callNotesText, setCallNotesText] = React.useState("");
  const [callNotesProspect, setCallNotesProspect] = React.useState("");
  const [callNotesCompany, setCallNotesCompany] = React.useState("");
  const [callNotesType, setCallNotesType] = React.useState("Discovery Call");
  const [callNotesLoading, setCallNotesLoading] = React.useState(false);
  const [callNotesResult, setCallNotesResult] = React.useState<ProcessCallTranscriptOutput | null>(null);
  const [callEmailCopied, setCallEmailCopied] = React.useState(false);
  const [tasksCreated, setTasksCreated] = React.useState(false);

  const handleRunTriage = async () => {
    if (!triageMessage.trim()) return;
    setTriageLoading(true);
    try {
      const res = await classifyInboundReplyAction({
        inbound_message: triageMessage,
        subject: triageSubject || undefined,
        prospect_name: triageProspect || undefined,
        company_name: triageCompany || undefined,
      });
      setTriageResult(res);
    } catch (err) {
      console.error("AI Triage failed:", err);
    } finally {
      setTriageLoading(false);
    }
  };

  const handleProcessCallNotes = async () => {
    if (!callNotesText.trim()) return;
    setCallNotesLoading(true);
    setTasksCreated(false);
    try {
      const res = await processCallTranscriptAction({
        transcript_or_notes: callNotesText,
        prospect_name: callNotesProspect || "Prospect",
        company_name: callNotesCompany || "Target Account",
        call_type: callNotesType,
      });
      setCallNotesResult(res);
    } catch (err) {
      console.error("Process call notes failed:", err);
    } finally {
      setCallNotesLoading(false);
    }
  };

  const handleCreateExtractedTasks = async () => {
    if (!callNotesResult?.extracted_action_items || !user) return;
    try {
      const token = await user.getIdToken(true);
      for (const item of callNotesResult.extracted_action_items) {
        const dueDate = new Date(Date.now() + (item.due_days_from_now || 1) * 86400000).toISOString().split('T')[0];
        await createTaskActionByToken(token, {
          title: item.title,
          type: item.type as any,
          priority: item.priority as any,
          due_date: dueDate,
          due_time: "10:00 AM",
          related_lead_name: callNotesProspect,
          related_company: callNotesCompany,
          notes: item.notes,
        });
      }
      setTasksCreated(true);
    } catch (err) {
      console.error("Failed to create extracted tasks:", err);
    }
  };

  const { user } = useAuth();
  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const data = await getOutreachActivitiesActionByToken(token, {
        channel: channelFilter === "all" ? undefined : channelFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        assigned_to: assignedFilter === "all" ? undefined : assignedFilter,
      });
      setActivities(data || []);
    } catch (e) {
      console.error("Failed to load outreach activities:", e);
    } finally {
      setLoading(false);
    }
  }, [user, channelFilter, statusFilter, search, assignedFilter]);

  React.useEffect(() => { load(); }, [load]);

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await logOutreachActionByToken(token, {
        channel: form.channel,
        recipient_name: form.recipient_name,
        recipient_org: form.recipient_org,
        recipient_email: form.recipient_email,
        recipient_title: form.recipient_title,
        subject: form.subject,
        message: form.message,
        next_followup: form.next_followup,
        followup_days: Number(form.followup_days),
        assigned_to: form.assigned_to,
      });
      setComposeOpen(false);
      setForm(f => ({ ...f, recipient_name: "", recipient_email: prefilledEmail, subject: "", message: "", next_followup: "" }));
      load();
    } catch (e) {
      console.error("Failed to log outreach activity:", e);
    }
  };

  // Channel tab counts
  const countByChannel = (ch: OutreachChannel | "all") =>
    ch === "all" ? activities.length : activities.filter(a => a.channel === ch).length;

  // Stats
  const pendingFollowups = activities.filter(a => a.next_followup && new Date(a.next_followup) <= new Date(Date.now() + 3 * 86400000)).length;
  const replied = activities.filter(a => ["Replied", "Connected", "Completed"].includes(a.status)).length;
  const replyRate = activities.length ? Math.round((replied / activities.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Outreach & Communication Log"
          subtitle="Channels: Email · Phone · LinkedIn · Meeting · Track responses and follow-ups"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-5 w-full mx-auto overflow-y-auto">

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Activities", value: activities.length, color: "text-foreground" },
              { label: "Pending Follow-Ups", value: pendingFollowups, color: "text-amber-400" },
              { label: "Responses Received", value: replied, color: "text-emerald-400" },
              { label: "Reply Rate", value: `${replyRate}%`, color: "text-indigo-300" },
            ].map(stat => (
              <Card key={stat.label} className="bg-card p-4 text-center">
                <div className={`text-2xl font-extrabold font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col gap-3 bg-card p-4 rounded-xl backdrop-blur-xl">
            {/* Channel Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {ALL_CHANNELS.map((ch) => {
                const meta = ch === "all" ? null : CHANNEL_META[ch];
                const isActive = channelFilter === ch;
                return (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${isActive
                      ? (meta ? `${meta.bg} ${meta.color} ${meta.border}` : "bg-indigo-600 text-white border-indigo-600")
                      : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                      }`}
                  >
                    {meta ? meta.icon : <Filter className="h-3.5 w-3.5" />}
                    {ch === "all" ? "All Channels" : ch}
                    <span className="font-mono text-[10px] opacity-70">({countByChannel(ch)})</span>
                  </button>
                );
              })}
            </div>

            {/* Search + Filters row */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by contact, company, subject, or message..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-muted/40 border-border/60 text-xs h-9"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-muted/40 border border-border/60 rounded-md px-2.5 py-1.5 text-xs outline-none text-foreground shrink-0"
              >
                <option value="all">All Statuses</option>
                {["Sent", "Delivered", "Opened", "Clicked", "Replied", "Called", "Connected", "Voicemail", "No Answer", "Meeting Set", "Completed", "Scheduled", "Bounced"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={assignedFilter}
                onChange={e => setAssignedFilter(e.target.value)}
                className="bg-muted/40 border border-border/60 rounded-md px-2.5 py-1.5 text-xs outline-none text-foreground shrink-0"
              >
                <option value="all">All Reps</option>
                {availableReps.map((rep) => (
                  <option key={rep} value={rep}>{rep}</option>
                ))}
              </select>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTriageOpen(true)}
                  className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs gap-1.5 font-semibold h-9"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> AI Triage Reply
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCallNotesOpen(true)}
                  className="border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs gap-1.5 font-semibold h-9"
                >
                  <Mic className="h-3.5 w-3.5 text-purple-400" /> AI Call Notes
                </Button>

                <Button
                  size="sm"
                  onClick={() => setComposeOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold h-9"
                >
                  <Plus className="h-3.5 w-3.5" /> Log Activity
                </Button>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-card/40 border border-border/40 rounded-xl animate-pulse" />
              ))
            ) : activities.length > 0 ? (
              activities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground text-xs border border-dashed border-border/40 rounded-xl">
                No outreach activities found. Try adjusting filters or log a new activity.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Compose / Log Activity Modal ──────────────────────────────────── */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg bg-card/95 border-border/60 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Send className="h-4 w-4 text-indigo-400" /> Log Outreach Activity
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCompose} className="space-y-4 text-xs pt-1">
            {/* Channel Selector */}
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["Email", "Phone", "LinkedIn", "Meeting"] as OutreachChannel[]).map(ch => {
                  const meta = CHANNEL_META[ch];
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, channel: ch }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[11px] font-semibold transition-all ${form.channel === ch
                        ? `${meta.bg} ${meta.color} ${meta.border}`
                        : "bg-muted/20 text-muted-foreground border-border/40 hover:bg-muted/40"
                        }`}
                    >
                      {meta.icon}
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact Name</Label>
                <Input placeholder="e.g. Sarah Jenkins" value={form.recipient_name}
                  onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input placeholder="e.g. CTO" value={form.recipient_title}
                  onChange={e => setForm(f => ({ ...f, recipient_title: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input placeholder="e.g. Acme Corp" value={form.recipient_org}
                  onChange={e => setForm(f => ({ ...f, recipient_org: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" placeholder="contact@company.com" value={form.recipient_email}
                  onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))} />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label>
                {form.channel === "Phone" ? "Call Subject" :
                  form.channel === "LinkedIn" ? "LinkedIn Message Topic" :
                    form.channel === "Meeting" ? "Meeting Title" : "Email Subject"}
              </Label>
              <Input
                placeholder={
                  form.channel === "Email" ? "e.g. Improve operational compliance at Acme" :
                    form.channel === "Phone" ? "e.g. Discovery Call — Security Architecture" :
                      form.channel === "LinkedIn" ? "e.g. Webinar Follow-Up Connection" :
                        "e.g. Product Architecture Review"
                }
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label>Message / Notes</Label>
              <Textarea
                placeholder="Paste email body, call notes, LinkedIn message, or meeting details..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="bg-muted/40 min-h-[100px] text-xs"
              />
            </div>

            {/* Follow-Up */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Bell className="h-3 w-3 text-amber-400" /> Follow-Up Date</Label>
                <Input type="date" value={form.next_followup}
                  onChange={e => setForm(f => ({ ...f, next_followup: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Follow-Up in Days</Label>
                <Input type="number" min="1" max="90" value={form.followup_days}
                  onChange={e => setForm(f => ({ ...f, followup_days: e.target.value }))} />
              </div>
            </div>

            {/* Assigned To */}
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Input
                value={form.assigned_to}
                placeholder={user?.displayName || user?.email?.split("@")[0] || "Assignee"}
                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                className="bg-muted/40 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-1.5">
                <Send className="h-3.5 w-3.5" /> Log & Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── AI Inbound Reply Triage Modal ─── */}
      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> AI Inbound Reply Triage (Vanessa Van Edwards Empathetic Response)
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Prospect Name</Label>
                <Input placeholder="e.g. David Miller" value={triageProspect} onChange={e => setTriageProspect(e.target.value)} className="bg-muted/40 text-xs h-8 mt-1" />
              </div>
              <div>
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Company</Label>
                <Input placeholder="e.g. Apex Global" value={triageCompany} onChange={e => setTriageCompany(e.target.value)} className="bg-muted/40 text-xs h-8 mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Prospect Email / Message Content</Label>
              <Textarea
                placeholder="Paste the received email body or LinkedIn reply here..."
                value={triageMessage}
                onChange={e => setTriageMessage(e.target.value)}
                className="bg-muted/40 text-xs min-h-[90px] mt-1"
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleRunTriage}
              disabled={triageLoading || !triageMessage.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 w-full font-semibold h-9"
            >
              {triageLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {triageLoading ? "Analyzing Sentiment & Intent..." : "Analyze & Draft Empathetic Reply"}
            </Button>

            {triageResult && (
              <div className="space-y-3 pt-2 border-t border-border/40">
                {/* Intent & Sentiment Badges */}
                <div className="flex items-center justify-between gap-2 p-3 bg-muted/30 border border-border/40 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-500/10 text-indigo-300 uppercase font-mono text-[10px]">
                      Intent: {triageResult.intent}
                    </Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                      Sentiment: {triageResult.sentiment} ({triageResult.sentiment_score}/100)
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Action: {triageResult.recommended_action}
                  </span>
                </div>

                <div className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-1">
                  <p className="font-bold text-foreground text-[11px]">Executive Summary:</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{triageResult.summary}</p>
                  {triageResult.return_date && (
                    <p className="text-amber-400 font-mono text-[10px] pt-1">
                      Parsed Return Date: {triageResult.return_date}
                    </p>
                  )}
                </div>

                {/* Draft Reply */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-bold text-foreground">AI Drafted Empathetic Response (Ready to Send)</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(triageResult.draft_reply);
                        setTriageCopied(true);
                        setTimeout(() => setTriageCopied(false), 2000);
                      }}
                      className="h-6 text-[10px] gap-1 text-indigo-300"
                    >
                      {triageCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {triageCopied ? "Copied!" : "Copy Reply"}
                    </Button>
                  </div>
                  <Textarea
                    value={triageResult.draft_reply}
                    readOnly
                    className="bg-card border-border/60 text-xs min-h-[110px] leading-relaxed text-foreground font-sans"
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── AI Call Transcript / Voice Notes Modal ─── */}
      <Dialog open={callNotesOpen} onOpenChange={setCallNotesOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Mic className="h-4 w-4 text-purple-400" /> AI Call Notes & Task Extractor (Vanessa Van Edwards Active Listening)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs pt-1">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Prospect Name</Label>
                <Input placeholder="e.g. Alex Morgan" value={callNotesProspect} onChange={e => setCallNotesProspect(e.target.value)} className="bg-muted/40 text-xs h-8 mt-1" />
              </div>
              <div>
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Company</Label>
                <Input placeholder="e.g. TechCorp Inc" value={callNotesCompany} onChange={e => setCallNotesCompany(e.target.value)} className="bg-muted/40 text-xs h-8 mt-1" />
              </div>
              <div>
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Call Type</Label>
                <select value={callNotesType} onChange={e => setCallNotesType(e.target.value)} className="w-full bg-muted/40 border border-border/60 rounded-md p-1.5 text-xs outline-none text-foreground h-8 mt-1">
                  <option>Discovery Call</option>
                  <option>Cold Call</option>
                  <option>Product Demo</option>
                  <option>Proposal Review</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Raw Audio Transcription or Call Notes</Label>
              <Textarea
                placeholder="Paste call transcription or type rough sales notes (e.g. 'Customer is looking to fix data cleanup bottlenecks, likes our automated verification, wants security datasheet by tomorrow and demo with IT next week...')"
                value={callNotesText}
                onChange={e => setCallNotesText(e.target.value)}
                className="bg-muted/40 text-xs min-h-[90px] mt-1"
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleProcessCallNotes}
              disabled={callNotesLoading || !callNotesText.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5 w-full font-semibold h-9"
            >
              {callNotesLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
              {callNotesLoading ? "Processing Transcript & Extracting Tasks..." : "Process Call & Extract CRM Tasks"}
            </Button>

            {callNotesResult && (
              <div className="space-y-3.5 pt-2 border-t border-border/40">
                {/* Summary & Recommended Temperature */}
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" /> Call Executive Summary
                    </span>
                    <Badge className="bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                      Temp: {callNotesResult.recommended_temperature} · Stage: {callNotesResult.recommended_stage}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{callNotesResult.call_summary}</p>
                </div>

                {/* Key Discussion & Objections */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-muted/20 border border-border/30 rounded-xl space-y-1">
                    <p className="font-bold text-foreground text-[10px] uppercase">Discussion Topics</p>
                    <ul className="text-muted-foreground text-[10px] list-disc list-inside space-y-0.5">
                      {callNotesResult.key_discussion_points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div className="p-2.5 bg-red-500/5 border border-red-500/15 rounded-xl space-y-1">
                    <p className="font-bold text-red-300 text-[10px] uppercase">Objections Raised</p>
                    <ul className="text-muted-foreground text-[10px] list-disc list-inside space-y-0.5">
                      {callNotesResult.objections_raised.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Extracted Tasks to Create */}
                <div className="space-y-2 p-3 bg-card border border-border/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground text-[11px]">Extracted CRM Action Items ({callNotesResult.extracted_action_items.length}):</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateExtractedTasks}
                      disabled={tasksCreated}
                      className={`h-7 text-[10px] gap-1 font-semibold ${tasksCreated ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-500"}`}
                    >
                      {tasksCreated ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {tasksCreated ? "Tasks Created in /tasks!" : "Create in /tasks"}
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {callNotesResult.extracted_action_items.map((item, idx) => (
                      <div key={idx} className="p-2 bg-muted/30 border border-border/30 rounded-lg flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-foreground">{item.title}</span>
                          <div className="text-[10px] text-muted-foreground">{item.notes}</div>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                          {item.type} · Due in {item.due_days_from_now}d
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow-up Email Draft */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-bold text-foreground">Client Follow-Up Email (Reciprocity & Warmth)</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(callNotesResult.draft_followup_email);
                        setCallEmailCopied(true);
                        setTimeout(() => setCallEmailCopied(false), 2000);
                      }}
                      className="h-6 text-[10px] gap-1 text-purple-300"
                    >
                      {callEmailCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {callEmailCopied ? "Copied!" : "Copy Email"}
                    </Button>
                  </div>
                  <Textarea
                    value={callNotesResult.draft_followup_email}
                    readOnly
                    className="bg-card border-border/60 text-xs min-h-[100px] leading-relaxed text-foreground"
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}

export default function OutreachPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}>
      <OutreachPageContent />
    </React.Suspense>
  );
}
