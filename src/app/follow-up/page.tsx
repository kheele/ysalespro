"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  getFollowUpsActionByToken,
  getDailyAutomationRulesAction,
  runDailyAutomationActionByToken,
  markAsRespondedActionByToken,
} from "@/services/private/followUpServices";
import type {
  FollowUpItem,
  DailyAutomationRule,
  AutomationExecutionResult,
} from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Clock, Calendar, Play, CheckCircle2, AlertTriangle, Flame,
  Mail, Phone, Linkedin, Search, RefreshCw, Zap, ShieldAlert,
  ArrowRight, UserCheck, StopCircle, ListChecks, ChevronRight,
  Filter, Bell, Shield, Terminal,
} from "lucide-react";

// ─── Status Metadata ─────────────────────────────────────────────────────────
const STATUS_META: Record<string, { color: string; bg: string; border: string }> = {
  Scheduled: { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/25" },
  Sent: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25" },
  Delivered: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/25" },
  Opened: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/25" },
  Replied: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  Escalated: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" },
  Cancelled: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/25" },
};

const TEMP_BADGE: Record<string, string> = {
  HOT: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse font-extrabold",
  WARM: "bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold",
  COLD: "bg-blue-500/10 text-blue-400 border-blue-500/20 font-medium",
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  Email: <Mail className="h-3.5 w-3.5 text-indigo-400" />,
  Phone: <Phone className="h-3.5 w-3.5 text-purple-400" />,
  LinkedIn: <Linkedin className="h-3.5 w-3.5 text-blue-400" />,
};

// ─── Automated Execution Console Modal ───────────────────────────────────────
function AutomationConsoleModal({ open, onClose, result }: {
  open: boolean; onClose: () => void; result: AutomationExecutionResult | null;
}) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-card text-card-foreground border border-border shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border/40 bg-muted/20">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" /> Automated Daily Follow-Up Execution
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">Executed at {result.executed_at}</p>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {/* Summary KPI Grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="font-extrabold font-mono text-indigo-300 text-base">{result.emails_sent}</div>
              <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Sent</div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="font-extrabold font-mono text-emerald-400 text-base">{result.sequences_stopped}</div>
              <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Stopped (Reply)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="font-extrabold font-mono text-red-400 text-base">{result.leads_escalated}</div>
              <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Escalated HOT</div>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="font-extrabold font-mono text-purple-400 text-base">{result.tasks_created}</div>
              <div className="text-[9px] uppercase text-muted-foreground mt-0.5">Tasks Created</div>
            </div>
          </div>

          {/* Console Output Terminal */}
          <div className="bg-slate-950/80 rounded-xl p-3.5 space-y-2 font-mono text-[11px] max-h-60 overflow-y-auto">
            {result.log_entries.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-muted-foreground/50 shrink-0">[{log.timestamp.split(' ')[1]}]</span>
                <span className={
                  log.type === "success" ? "text-emerald-400 font-semibold" :
                    log.type === "escalation" ? "text-red-400 font-bold" :
                      log.type === "warning" ? "text-amber-400" : "text-indigo-300"
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border/40 bg-muted/20 flex justify-end">
          <Button size="sm" onClick={onClose} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
            Close Execution Console
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FollowUpPage() {
  const { user } = useAuth();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [items, setItems] = React.useState<FollowUpItem[]>([]);
  const [rules, setRules] = React.useState<DailyAutomationRule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [repFilter, setRepFilter] = React.useState("all");

  const [consoleOpen, setConsoleOpen] = React.useState(false);
  const [execResult, setExecResult] = React.useState<AutomationExecutionResult | null>(null);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    getDailyAutomationRulesAction().then(res => setRules(res || []));
  }, []);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const data = await getFollowUpsActionByToken(token, { search, status: statusFilter, rep: repFilter });
      setItems(data || []);
    } catch (e) {
      console.error("Failed to load follow-ups:", e);
    } finally {
      setLoading(false);
    }
  }, [user, search, statusFilter, repFilter]);

  React.useEffect(() => { load(); }, [load]);

  const handleRunDailyAutomation = async () => {
    if (!user) return;
    setRunning(true);
    try {
      const token = await user.getIdToken(true);
      const res = await runDailyAutomationActionByToken(token);
      setExecResult(res);
      setConsoleOpen(true);
      load();
    } catch (e) {
      console.error("Failed to run daily automation:", e);
    } finally {
      setRunning(false);
    }
  };

  const handleMarkResponded = async (id: string | number) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await markAsRespondedActionByToken(token, id);
      load();
    } catch (e) {
      console.error("Failed to mark as responded:", e);
    }
  };

  const availableReps = React.useMemo(() => {
    return Array.from(new Set(items.map(i => i.assigned_rep || i.assigned_user).filter(Boolean))) as string[];
  }, [items]);

  const overdueCount = items.filter(i => i.is_overdue && i.status === "Scheduled").length;
  const hotCount = items.filter(i => i.lead_temperature === "HOT").length;
  const scheduledToday = items.filter(i => i.status === "Scheduled").length;
  const repliedCount = items.filter(i => i.status === "Replied").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Follow-Up System"
          subtitle="Automated daily follow-up queue, sequence tracking, lead escalation, and response detection rules"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-5 max-w-6xl mx-auto overflow-y-auto">

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-amber-400">{overdueCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Overdue Follow-Ups</div>
              </div>
            </Card>

            <Card className="border-border/50 bg-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-red-400">{hotCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">HOT Leads Escalated</div>
              </div>
            </Card>

            <Card className="border-border/50 bg-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-indigo-300">{scheduledToday}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Scheduled in Queue</div>
              </div>
            </Card>

            <Card className="border-border/50 bg-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold font-mono text-emerald-400">{repliedCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Responses Stopped</div>
              </div>
            </Card>
          </div>

          {/* Automated Daily Follow-Up Rules Control Banner */}
          <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-card/60 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-400 animate-pulse" />
                  <h2 className="text-base font-bold text-foreground">Automated Daily Follow-Up Engine</h2>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Active Rule Engine</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enforces automated daily sending, response auto-stopping, lead escalation, and reminder task generation.
                </p>
              </div>

              <Button onClick={handleRunDailyAutomation} disabled={running}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs gap-2 h-10 px-5 shadow-lg shadow-indigo-500/20">
                {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run Daily Automation Queue
              </Button>
            </div>

            {/* Rules Quick Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/30">
              {rules.map(rule => (
                <div key={rule.id} className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-indigo-300 line-clamp-1">{rule.name}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1 py-0">Active</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{rule.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl backdrop-blur-xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search lead, company, or subject..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 border-border/60 text-xs h-9" />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-muted/40 border border-border/60 rounded-md px-3 py-1.5 text-xs outline-none text-foreground h-9">
                <option value="all">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Sent">Sent</option>
                <option value="Replied">Replied</option>
                <option value="Escalated">Escalated</option>
              </select>

              <select value={repFilter} onChange={e => setRepFilter(e.target.value)}
                className="bg-muted/40 border border-border/60 rounded-md px-3 py-1.5 text-xs outline-none text-foreground h-9">
                <option value="all">All Reps</option>
                {availableReps.map((rep) => (
                  <option key={rep} value={rep}>{rep}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Follow-Up List */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-card/40 border border-border/40 rounded-xl animate-pulse" />)
            ) : items.length > 0 ? (
              items.map(item => {
                const sm = STATUS_META[item.status] || STATUS_META.Scheduled;
                return (
                  <Card key={item.id} className="border-border/50 bg-card p-4 space-y-3 hover:border-indigo-500/30 transition-all">
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{item.person_name}</span>
                          <span className="text-xs text-muted-foreground">· {item.person_title} at</span>
                          <span className="font-semibold text-xs text-indigo-300">{item.company_name}</span>
                          <Badge className={`${TEMP_BADGE[item.lead_temperature]} text-[10px]`}>{item.lead_temperature}</Badge>
                          <Badge className={`${sm.bg} ${sm.color} ${sm.border} text-[10px]`}>{item.status}</Badge>
                          {item.is_overdue && (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] font-bold animate-pulse">
                              OVERDUE ({item.days_since_last_contact}d)
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                          {(item.channel && CHANNEL_ICON[item.channel]) || <Mail className="h-3.5 w-3.5 text-indigo-400" />} {item.subject}
                        </p>
                      </div>

                      {/* Rep + Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-muted-foreground font-mono">Rep: {item.assigned_rep}</span>
                        {item.status !== "Replied" && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkResponded(item.id)}
                            className="text-xs h-8 gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Replied
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Sequence Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-muted/20 rounded-xl text-xs border border-border/30">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Sequence</span>
                        <span className="font-semibold text-indigo-300 line-clamp-1">{item.sequence_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Step Progress</span>
                        <span className="font-bold font-mono">Step {item.step_number} of {item.total_steps}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Follow-up Count</span>
                        <span className="font-bold font-mono text-amber-400">{item.follow_up_count} sent</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Last Contact</span>
                        <span className="font-mono text-muted-foreground">{item.last_contact_date}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Next Scheduled</span>
                        <span className={`font-mono font-bold ${item.is_overdue ? "text-red-400" : "text-emerald-400"}`}>
                          {item.next_follow_up_date}
                        </span>
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="text-[11px] text-muted-foreground bg-muted/10 p-2.5 rounded-lg border border-border/20 italic">
                      "{item.message_preview}"
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="p-16 text-center border border-dashed border-border/40 rounded-xl space-y-2">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No follow-ups match current filters.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <AutomationConsoleModal open={consoleOpen} onClose={() => setConsoleOpen(false)} result={execResult} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
