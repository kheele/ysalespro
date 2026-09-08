"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  getLeadsActionByToken,
  updateLeadStageActionByToken,
  createLeadActionByToken,
} from "@/services/private/leadServices";
import {
  generatePreCallBriefAction,
  classifyInboundReplyAction,
  scoreAndQualifyLeadAction,
} from "@/services/private/aiMessageServices";
import type { GeneratePreCallBriefOutput } from "@/ai/schemas/precall-brief";
import type { ClassifyInboundReplyOutput } from "@/ai/schemas/inbound-reply";
import type { ScoreAndQualifyLeadOutput } from "@/ai/schemas/lead-qualification";
import type { Lead, LeadStage, LeadTemperature } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Flame,
  Thermometer,
  Snowflake,
  Plus,
  Search,
  LayoutList,
  Kanban,
  CheckCircle,
  XCircle,
  Repeat,
  Building2,
  Calendar,
  Sparkles,
  Shield,
  Lightbulb,
  Loader2,
  HelpCircle,
  Volume2,
  Target,
  Copy,
  Check,
  MessageSquare,
  MoreHorizontal,
  ArrowRight,
  User,
  RefreshCw,
} from "lucide-react";

const STAGE_ICONS: Record<string, React.ReactNode> = {
  Cold: <Snowflake className="h-3.5 w-3.5" />,
  Contacted: <Repeat className="h-3.5 w-3.5" />,
  Warm: <Thermometer className="h-3.5 w-3.5" />,
  Hot: <Flame className="h-3.5 w-3.5" />,
  Customer: <CheckCircle className="h-3.5 w-3.5" />,
  Lost: <XCircle className="h-3.5 w-3.5" />,
};

function ScoreBar({ score }: { score?: number | null }) {
  const val = score ?? 0;
  const color = val >= 85 ? "bg-emerald-400" : val >= 65 ? "bg-amber-400" : "bg-blue-400";
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono">
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(val, 100)}%` }} />
      </div>
      <span className="text-foreground font-bold w-6 text-right">{val}</span>
    </div>
  );
}

function getSafeStage(stage?: string | null): LeadStage {
  if (!stage) return "Cold";
  const title = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
  return title as LeadStage;
}

function getSafeStageColor(
  stage: string,
  stageColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {}
) {
  const safeStage = getSafeStage(stage);
  if (stageColors[safeStage]) return stageColors[safeStage];
  if (stageColors[stage]) return stageColors[stage];

  switch (safeStage) {
    case "Hot":
      return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/25", dot: "bg-red-400" };
    case "Warm":
      return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/25", dot: "bg-amber-400" };
    case "Contacted":
      return { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/25", dot: "bg-purple-400" };
    case "Customer":
      return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/25", dot: "bg-emerald-400" };
    case "Lost":
      return { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/25", dot: "bg-zinc-400" };
    default:
      return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/25", dot: "bg-blue-400" };
  }
}

function getSafeTempBadge(
  temp?: string | null,
  tempColors: Record<string, { badge: string }> = {}
) {
  const norm = (temp || "COLD").trim();
  const upper = norm.toUpperCase();
  const title = upper.charAt(0) + upper.slice(1).toLowerCase();

  if (tempColors[title]?.badge) return tempColors[title].badge;
  if (tempColors[upper]?.badge) return tempColors[upper].badge;
  if (tempColors[norm]?.badge) return tempColors[norm].badge;

  if (upper === "HOT") {
    return "bg-red-500/15 text-red-400 border border-red-500/30";
  }
  if (upper === "WARM") {
    return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  }
  return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
}

// ─── Kanban Card ───────────────────────────────────────────────────────────
function KanbanCard({
  lead,
  isTarget,
  onMove,
  onOpenBrief,
  onOpenTriage,
  onOpenQualify,
}: {
  lead: Lead;
  isTarget?: boolean;
  onMove: (id: string | number, stage: LeadStage) => void;
  onOpenBrief: (lead: Lead) => void;
  onOpenTriage: (lead: Lead) => void;
  onOpenQualify: (lead: Lead) => void;
}) {
  const { pipelineStages, stageColors, tempColors } = useSettings();
  const stage = getSafeStage(lead.stage);
  const sc = getSafeStageColor(stage, stageColors);
  const idx = pipelineStages.indexOf(stage);
  const prevStage = idx > 0 ? pipelineStages[idx - 1] : null;
  const nextStage = idx < pipelineStages.length - 1 ? pipelineStages[idx + 1] : null;
  const tempBadge = getSafeTempBadge(lead.lead_temperature, tempColors);

  const personName = lead.person_name || lead.person?.name || "Lead Contact";
  const personTitle = lead.person?.job_title;
  const initials = personName.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "L";

  const repliedActivity = lead.outreach_activity_list?.find((a: any) => a.status === 'Replied');
  const latestOutreach = lead.outreach_activity_list?.[0];
  const leadEmail = lead.person?.email || lead.outreach_activity_list?.find((a: any) => a.recipient_email)?.recipient_email || null;
  const isReplied = Boolean(repliedActivity) || lead.stage === 'Engaged';
  const replyPreview = repliedActivity?.response_preview || latestOutreach?.response_preview;

  return (
    <div
      id={`lead-card-${lead.id}`}
      className={`rounded-xl ${sc.border} ${sc.bg} p-3 space-y-2.5 text-xs hover:shadow-md transition-all ${
        isTarget ? "ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/30 scale-[1.02]" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="h-7 w-7 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 flex items-center justify-center font-bold text-[10px] shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          {lead.person_id ? (
            <Link href={`/people/${lead.person_id}`} className={`font-bold truncate block hover:text-indigo-400 ${sc.text}`}>
              {personName}
            </Link>
          ) : (
            <span className={`font-bold truncate block ${sc.text}`}>{personName}</span>
          )}
          {leadEmail && (
            <p className="text-[10px] text-muted-foreground truncate font-mono" title={leadEmail}>
              {leadEmail}
            </p>
          )}
          {personTitle && <p className="text-muted-foreground text-[10px] truncate">{personTitle}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isReplied && (
            <Badge
              className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0 font-semibold cursor-help"
              title={replyPreview ? `Reply: "${replyPreview}"` : "Prospect replied to outreach"}
            >
              💬 Replied
            </Badge>
          )}
          <Badge className={`${tempBadge} text-[9px] px-1.5 shrink-0 font-bold uppercase`}>
            {lead.lead_temperature || 'COLD'}
          </Badge>
        </div>
      </div>

      {lead.company_name && (
        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
          <Building2 className="h-2.5 w-2.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-foreground truncate">{lead.company_name}</span>
        </div>
      )}

      {lead.industry && (
        <div className="text-[10px] text-muted-foreground font-mono truncate">
          {lead.industry}
        </div>
      )}

      <ScoreBar score={lead.lead_score} />

      {/* AI Quick Actions */}
      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border/20">
        <button
          type="button"
          onClick={() => onOpenQualify(lead)}
          className="flex items-center justify-center gap-0.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[9px] font-semibold transition-colors"
          title="AI Score & Qualify Lead"
        >
          <Target className="h-2.5 w-2.5 text-amber-400" /> Qualify
        </button>
        <button
          type="button"
          onClick={() => onOpenBrief(lead)}
          className="flex items-center justify-center gap-0.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[9px] font-semibold transition-colors"
          title="AI Pre-Call Intelligence Brief"
        >
          <Sparkles className="h-2.5 w-2.5 text-indigo-400" /> Brief
        </button>
        <button
          type="button"
          onClick={() => onOpenTriage(lead)}
          className="flex items-center justify-center gap-0.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[9px] font-semibold transition-colors"
          title="AI Inbound Reply Triage"
        >
          <MessageSquare className="h-2.5 w-2.5 text-purple-400" /> Triage
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border/20 text-muted-foreground">
        <span>{lead.next_followup ? `Next: ${new Date(lead.next_followup).toLocaleDateString()}` : `Score: ${lead.lead_score || 0}`}</span>
        <span>↩ #{lead.followup_count || 0}</span>
      </div>

      <div className="flex items-center gap-1 pt-0.5">
        {prevStage && (
          <button
            onClick={() => onMove(lead.id, prevStage as LeadStage)}
            className="flex-1 text-center text-[10px] py-1 rounded bg-muted/40 hover:bg-muted/70 text-muted-foreground transition-colors"
          >
            ← {prevStage}
          </button>
        )}
        {nextStage && (
          <button
            onClick={() => onMove(lead.id, nextStage as LeadStage)}
            className="flex-1 text-center text-[10px] py-1 rounded bg-muted/40 hover:bg-muted/70 text-muted-foreground transition-colors"
          >
            {nextStage} →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
function LeadsPageContent() {
  const { pipelineStages, stageColors, tempColors } = useSettings();
  const searchParams = useSearchParams();
  const targetLeadId = searchParams?.get("id") || "";

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"table" | "kanban">("kanban");

  // Auto-scroll and focus target lead from notification link (?id=xxx)
  React.useEffect(() => {
    if (targetLeadId && leads.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`lead-card-${targetLeadId}`) || document.getElementById(`lead-row-${targetLeadId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [targetLeadId, leads]);

  // Filters
  const [search, setSearch] = React.useState("");
  const [filterStage, setFilterStage] = React.useState<string>("all");
  const [filterTemp, setFilterTemp] = React.useState<LeadTemperature | "all">("all");
  const [filterAssigned, setFilterAssigned] = React.useState("all");

  // Add Lead Modal
  const [addOpen, setAddOpen] = React.useState(false);
  const [newLead, setNewLead] = React.useState({ person_name: "", company_name: "", industry: "" });

  // AI Pre-Call Brief State
  const [briefLoading, setBriefLoading] = React.useState(false);
  const [briefModalOpen, setBriefModalOpen] = React.useState(false);
  const [briefData, setBriefData] = React.useState<GeneratePreCallBriefOutput | null>(null);
  const [briefTargetLead, setBriefTargetLead] = React.useState<Lead | null>(null);

  // AI Lead Scoring & Qualification State
  const [qualifyLoading, setQualifyLoading] = React.useState(false);
  const [qualifyModalOpen, setQualifyModalOpen] = React.useState(false);
  const [qualifyResult, setQualifyResult] = React.useState<ScoreAndQualifyLeadOutput | null>(null);
  const [qualifyTargetLead, setQualifyTargetLead] = React.useState<Lead | null>(null);

  const handleOpenQualify = async (lead: Lead) => {
    setQualifyTargetLead(lead);
    setQualifyLoading(true);
    setQualifyModalOpen(true);
    try {
      const res = await scoreAndQualifyLeadAction({
        person_name: lead.person_name || lead.person?.name || "Decision Maker",
        job_title: lead.person?.job_title || "Executive",
        company_name: lead.company_name || "Enterprise Account",
        industry: lead.industry || "Enterprise B2B",
        company_size: "Mid-Market",
        stage: lead.stage || undefined,
        followup_count: lead.followup_count ?? undefined,
        last_contact_days_ago: lead.last_contact ? Math.round((Date.now() - new Date(lead.last_contact).getTime()) / 86400000) : undefined,
      });
      setQualifyResult(res);
    } catch (err) {
      console.error("Failed to qualify lead:", err);
    } finally {
      setQualifyLoading(false);
    }
  };

  const handleApplyAIQualification = () => {
    if (!qualifyResult || !qualifyTargetLead) return;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === qualifyTargetLead.id
          ? {
            ...l,
            lead_score: qualifyResult.lead_score,
            lead_temperature: qualifyResult.lead_temperature,
          }
          : l
      )
    );
    setQualifyModalOpen(false);
  };

  const handleOpenBrief = async (lead: Lead) => {
    setBriefTargetLead(lead);
    setBriefLoading(true);
    setBriefModalOpen(true);
    try {
      const res = await generatePreCallBriefAction({
        prospect: {
          name: lead.person_name || lead.person?.name || "Decision Maker",
          title: lead.person?.job_title || "Executive",
        },
        company: {
          name: lead.company_name || "Enterprise Account",
          industry: lead.industry || "Enterprise B2B",
        },
        call_goal: `Advance lead qualification (${lead.stage || "Warm"} Stage)`,
      });
      setBriefData(res);
    } catch (err) {
      console.error("Failed to generate pre-call brief:", err);
    } finally {
      setBriefLoading(false);
    }
  };

  // AI Inbound Reply Triage State
  const [triageOpen, setTriageOpen] = React.useState(false);
  const [triageMessage, setTriageMessage] = React.useState("");
  const [triageSubject, setTriageSubject] = React.useState("");
  const [triageProspect, setTriageProspect] = React.useState("");
  const [triageCompany, setTriageCompany] = React.useState("");
  const [triageLoading, setTriageLoading] = React.useState(false);
  const [triageResult, setTriageResult] = React.useState<ClassifyInboundReplyOutput | null>(null);
  const [triageCopied, setTriageCopied] = React.useState(false);

  const handleOpenTriage = (lead?: Lead) => {
    if (lead) {
      setTriageProspect(lead.person_name || lead.person?.name || "");
      setTriageCompany(lead.company_name || "");
      setTriageSubject(`Re: Discovery Follow-Up — ${lead.company_name || ""}`);
    }
    setTriageOpen(true);
  };

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

  const { user } = useAuth();
  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const data = await getLeadsActionByToken(token, {
        search,
        stage: filterStage !== "all" ? (filterStage as LeadStage) : undefined,
        lead_temperature: filterTemp !== "all" ? (filterTemp as LeadTemperature) : undefined,
        assigned_user: filterAssigned !== "all" ? filterAssigned : undefined,
      });
      setLeads(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load leads:", e);
    } finally {
      setLoading(false);
    }
  }, [user, search, filterStage, filterTemp, filterAssigned]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleMove = async (id: string | number, stage: LeadStage) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await updateLeadStageActionByToken(token, id, stage);
      load();
    } catch (e) {
      console.error("Failed to update lead stage:", e);
    }
  };

  const { toast } = useToast();
  const [syncingReplies, setSyncingReplies] = React.useState(false);

  const handleSyncReplies = async () => {
    setSyncingReplies(true);
    try {
      const res = await fetch("/api/cron/poll-inbox-replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-salespro-ui": "true",
        },
      });
      const data = await res.json();
      if (data.success) {
        if (data.replies_detected > 0) {
          toast({
            title: `📥 Found ${data.replies_detected} New Reply(ies)!`,
            description: `${data.replies_escalated} lead(s) escalated to Hot. Pipeline refreshed.`,
          });
          load();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("salespro:refresh-notifications"));
          }
        } else {
          toast({
            title: "Mailboxes Synced",
            description: `Polled ${data.accounts_checked} connected email account(s). No new prospect replies found.`,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Inbox Sync Warning",
          description: data.details?.[0]?.error || "Could not complete inbox reply poll.",
        });
      }
    } catch (e: any) {
      console.error("Failed to sync replies:", e);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: e.message || "Failed to connect to email inbox.",
      });
    } finally {
      setSyncingReplies(false);
    }
  };

  const [isAddingLead, setIsAddingLead] = React.useState(false);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAddingLead(true);
    try {
      const token = await user.getIdToken(true);
      await createLeadActionByToken(token, {
        person_name: newLead.person_name,
        company_name: newLead.company_name,
        industry: newLead.industry,
      });
      setAddOpen(false);
      setNewLead({ person_name: "", company_name: "", industry: "" });
      load();
    } catch (e) {
      console.error("Failed to create lead:", e);
    } finally {
      setIsAddingLead(false);
    }
  };

  // Filtered leads displayed on board and table
  const displayedLeads = React.useMemo(() => {
    return leads.filter((l) => {
      // Stage filter
      if (filterStage !== "all") {
        const lStage = getSafeStage(l.stage);
        if (lStage.toLowerCase() !== filterStage.toLowerCase()) return false;
      }
      // Temperature filter
      if (filterTemp !== "all") {
        const lTemp = (l.lead_temperature || "COLD").toUpperCase();
        if (lTemp !== filterTemp.toUpperCase()) return false;
      }
      return true;
    });
  }, [leads, filterStage, filterTemp]);

  // Stats summary - strictly based on pipeline stage
  const hotCount = leads.filter(l => getSafeStage(l.stage) === "Hot").length;
  const warmCount = leads.filter(l => getSafeStage(l.stage) === "Warm").length;
  const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + (l.lead_score || 0), 0) / leads.length) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Leads & Sales Pipeline"
          subtitle="6-stage pipeline: Cold → Contacted → Warm → Hot → Customer → Lost"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Leads", value: leads.length.toString(), color: "text-foreground", stageFilter: "all", tempFilter: "all" },
              { label: "Hot Leads", value: hotCount.toString(), color: "text-red-400", stageFilter: "Hot", tempFilter: "HOT" },
              { label: "Warm Leads", value: warmCount.toString(), color: "text-amber-400", stageFilter: "Warm", tempFilter: "WARM" },
              { label: "Avg Score", value: `${avgScore}/100`, color: "text-indigo-300", stageFilter: null, tempFilter: null },
            ].map((stat) => {
              const isSelected = stat.stageFilter && (filterStage === stat.stageFilter || (stat.tempFilter && filterTemp === stat.tempFilter));
              return (
                <Card
                  key={stat.label}
                  onClick={() => {
                    if (stat.stageFilter) {
                      if (filterStage === stat.stageFilter || (stat.tempFilter && filterTemp === stat.tempFilter)) {
                        setFilterStage("all");
                        setFilterTemp("all");
                      } else {
                        setFilterStage(stat.stageFilter);
                        setFilterTemp("all");
                      }
                    }
                  }}
                  className={`bg-card p-4 text-center transition-all select-none ${
                    stat.stageFilter ? "cursor-pointer hover:border-indigo-500/50 hover:shadow-md" : ""
                  } ${
                    isSelected ? "ring-2 ring-indigo-500 border-indigo-500/80 bg-indigo-500/10" : ""
                  }`}
                >
                  <div className={`text-2xl font-extrabold font-mono ${stat.color}`}>{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
                </Card>
              );
            })}
          </div>

          {/* Controls: View Toggle + Search + Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-card p-4 rounded-xl backdrop-blur-xl">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 shrink-0">
              <button
                onClick={() => setView("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "kanban" ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Kanban className="h-3.5 w-3.5" /> Kanban
              </button>
              <button
                onClick={() => setView("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "table" ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <LayoutList className="h-3.5 w-3.5" /> Table
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by contact, company, industry..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 text-xs h-9"
              />
            </div>

            {/* Stage filter */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="bg-muted/40 rounded-md px-2.5 py-1.5 text-xs outline-none text-foreground shrink-0 border border-border/30"
            >
              <option value="all">All Stages</option>
              {pipelineStages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Temperature filter */}
            <select
              value={filterTemp}
              onChange={(e) => setFilterTemp(e.target.value as LeadTemperature | "all")}
              className="bg-muted/40 rounded-md px-2.5 py-1.5 text-xs outline-none text-foreground shrink-0 border border-border/30"
            >
              <option value="all">All Temperatures</option>
              <option value="HOT">🔥 Hot</option>
              <option value="WARM">🌡️ Warm</option>
              <option value="COLD">❄️ Cold</option>
            </select>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncReplies}
                disabled={syncingReplies}
                className="border-border/60 bg-muted/40 text-foreground hover:bg-muted text-xs gap-1.5 font-semibold h-9"
                title="Poll connected inboxes via IMAP for prospect replies"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${syncingReplies ? "animate-spin" : ""}`} />
                {syncingReplies ? "Syncing..." : "Sync Replies"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenTriage()}
                className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs gap-1.5 font-semibold h-9"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> AI Triage Reply
              </Button>

              <Button
                size="sm"
                onClick={() => setAddOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold h-9"
              >
                <Plus className="h-3.5 w-3.5" /> Add Lead
              </Button>
            </div>
          </div>

          {/* =================== KANBAN VIEW =================== */}
          {view === "kanban" && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {pipelineStages.map((stage) => {
                const sc = getSafeStageColor(stage, stageColors);
                const stageLeads = displayedLeads.filter((l) => {
                  const lStage = getSafeStage(l.stage);
                  return lStage.toLowerCase() === stage.toLowerCase();
                });
                return (
                  <div key={stage} className="flex flex-col gap-3">
                    {/* Column Header */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${sc.border} ${sc.bg}`}>
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${sc.text}`}>
                        {STAGE_ICONS[stage] || <Repeat className="h-3.5 w-3.5" />} {stage}
                      </div>
                      <Badge className={`${sc.bg} ${sc.text} border-none text-[10px] font-mono`}>
                        {stageLeads.length}
                      </Badge>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2.5">
                      {stageLeads.length > 0 ? (
                        stageLeads.map((lead) => (
                          <KanbanCard
                            key={lead.id}
                            lead={lead}
                            isTarget={String(lead.id) === targetLeadId}
                            onMove={handleMove}
                            onOpenBrief={handleOpenBrief}
                            onOpenTriage={handleOpenTriage}
                            onOpenQualify={handleOpenQualify}
                          />
                        ))
                      ) : (
                        <div className="h-20 rounded-xl flex items-center justify-center text-[10px] text-muted-foreground/40 border border-dashed border-border/30">
                          Empty
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =================== TABLE VIEW =================== */}
          {view === "table" && (
            <Card className="bg-card backdrop-blur-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground text-[11px] uppercase font-semibold">
                      <th className="p-3.5">Person</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Temperature & Stage</th>
                      <th className="p-3.5">Score</th>
                      <th className="p-3.5">Last Contact</th>
                      <th className="p-3.5">Next Follow-Up</th>
                      <th className="p-3.5">Follow-Ups</th>
                      <th className="p-3.5">Assigned</th>
                      <th className="p-3.5 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={10} className="p-4 bg-card/20" />
                        </tr>
                      ))
                    ) : displayedLeads.length > 0 ? (
                      displayedLeads.map((lead) => {
                        const stage = getSafeStage(lead.stage);
                        const sc = getSafeStageColor(stage, stageColors);
                        const tempBadge = getSafeTempBadge(lead.lead_temperature, tempColors);
                        const personName = lead.person_name || lead.person?.name || "Lead Contact";
                        const personTitle = lead.person?.job_title;
                        const initials = personName.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "L";
                        const stageIdx = pipelineStages.indexOf(stage);
                        const nextStage = stageIdx >= 0 && stageIdx < pipelineStages.length - 1 ? (pipelineStages[stageIdx + 1] as LeadStage) : null;
                        const repliedActivity = lead.outreach_activity_list?.find((a: any) => a.status === 'Replied');
                        const latestOutreach = lead.outreach_activity_list?.[0];
                        const leadEmail = lead.person?.email || lead.outreach_activity_list?.find((a: any) => a.recipient_email)?.recipient_email || null;
                        const isReplied = Boolean(repliedActivity) || lead.stage === 'Engaged' || stage === 'Hot';
                        const replyPreview = repliedActivity?.response_preview || latestOutreach?.response_preview;

                        const isTarget = String(lead.id) === targetLeadId;

                        return (
                          <tr
                            key={lead.id}
                            id={`lead-row-${lead.id}`}
                            className={`hover:bg-muted/40 transition-all group ${
                              isTarget ? "bg-indigo-500/15 ring-2 ring-indigo-500/60 shadow-lg" : ""
                            }`}
                          >
                            {/* Person */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  {lead.person_id ? (
                                    <Link href={`/people/${lead.person_id}`} className="font-bold truncate max-w-[140px] block hover:text-indigo-400">
                                      {personName}
                                    </Link>
                                  ) : (
                                    <p className="font-bold truncate max-w-[140px]">{personName}</p>
                                  )}
                                  {leadEmail && (
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[140px] font-mono" title={leadEmail}>
                                      {leadEmail}
                                    </p>
                                  )}
                                  {personTitle && (
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                                      {personTitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Company */}
                            <td className="p-3.5">
                              <span className="flex flex-row justify-start gap-1 font-semibold text-foreground whitespace-nowrap">
                                {lead.company_name || "—"}
                                {lead.industry && <Badge
                                  variant="secondary"
                                  className="p-1 h-4 text-[10px] bg-inherit text-muted-foreground border border-border/40"
                                >
                                  {lead.industry}
                                </Badge>}
                              </span>
                            </td>
                            {/* Temperature */}
                            <td className="p-3.5">
                              <span className="flex flex-row justify-start gap-1 text-foreground whitespace-nowrap items-center">
                                {isReplied && (
                                  <Badge
                                    className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 p-1.5 h-4 text-[10px] gap-1 font-semibold cursor-help"
                                    title={replyPreview ? `Reply: "${replyPreview}"` : "Prospect replied to outreach"}
                                  >
                                    💬 Replied
                                  </Badge>
                                )}
                                <Badge className={`${tempBadge} border-0 p-1.5 h-4 text-[10px] uppercase font-bold`}>
                                  {lead.lead_temperature || "COLD"}
                                </Badge>
                                <Badge className={`${sc.bg} ${sc.text} ${sc.border} border p-1.5 h-4 text-[10px] gap-1 font-semibold`}>
                                  {STAGE_ICONS[stage] || <Repeat className="h-3.5 w-3.5" />} {stage}
                                </Badge>
                              </span>
                            </td>
                            {/* Score */}
                            <td className="p-3.5 w-28">
                              <ScoreBar score={lead.lead_score} />
                            </td>
                            {/* Last Contact */}
                            <td className="p-3.5 text-muted-foreground font-mono text-[10px] whitespace-nowrap">
                              {lead.last_contact ? new Date(lead.last_contact).toLocaleDateString() : "—"}
                            </td>
                            {/* Next Follow-Up */}
                            <td className="p-3.5 text-muted-foreground font-mono text-[10px] whitespace-nowrap">
                              {lead.next_followup ? new Date(lead.next_followup).toLocaleDateString() : "—"}
                            </td>
                            {/* Follow-Up Count */}
                            <td className="p-3.5 font-mono text-center">
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                                {lead.followup_count || 0}
                              </span>
                            </td>
                            {/* Assigned */}
                            <td className="p-3.5 text-muted-foreground text-[11px] whitespace-nowrap">
                              {typeof lead.assigned_user === 'string'
                                ? lead.assigned_user
                                : lead.assigned_user
                                ? `${lead.assigned_user.fname || ''} ${lead.assigned_user.lname || ''}`.trim() || lead.assigned_user.email || '—'
                                : '—'}
                            </td>
                            {/* Actions Dropdown */}
                            <td className="p-3.5 text-right pr-4 w-16">
                              <div className="flex items-center justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md data-[state=open]:bg-muted"
                                      title="Actions"
                                    >
                                      <span className="sr-only">Open actions menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52 bg-card border-border shadow-xl">
                                    <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                                      AI Intelligence
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenQualify(lead)}
                                      className="text-xs cursor-pointer gap-2 text-foreground focus:bg-amber-500/15 focus:text-amber-300"
                                    >
                                      <Target className="h-3.5 w-3.5 text-amber-400" />
                                      <span>Score & Qualify</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenBrief(lead)}
                                      className="text-xs cursor-pointer gap-2 text-foreground focus:bg-indigo-500/15 focus:text-indigo-300"
                                    >
                                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                                      <span>Pre-Call Brief</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenTriage(lead)}
                                      className="text-xs cursor-pointer gap-2 text-foreground focus:bg-purple-500/15 focus:text-purple-300"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                                      <span>Triage Reply</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                                      Pipeline Stage
                                    </DropdownMenuLabel>
                                    {nextStage && (
                                      <DropdownMenuItem
                                        onClick={() => handleMove(lead.id, nextStage)}
                                        className="text-xs cursor-pointer gap-2 font-medium text-emerald-400 focus:bg-emerald-500/15 focus:text-emerald-300"
                                      >
                                        <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                                        <span>Advance to {nextStage}</span>
                                      </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger className="text-xs gap-2 cursor-pointer">
                                        <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>Move Stage</span>
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent className="w-44 bg-card border-border shadow-xl">
                                        {pipelineStages.map((s) => (
                                          <DropdownMenuItem
                                            key={s}
                                            onClick={() => handleMove(lead.id, s as LeadStage)}
                                            className={`text-xs cursor-pointer gap-2 ${s === stage ? "font-bold text-indigo-400 bg-indigo-500/10" : "text-foreground"
                                              }`}
                                          >
                                            {STAGE_ICONS[s]}
                                            <span>{s}</span>
                                            {s === stage && (
                                              <Check className="h-3.5 w-3.5 ml-auto text-indigo-400" />
                                            )}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>

                                    {lead.person_id && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild className="text-xs cursor-pointer gap-2">
                                          <Link href={`/people/${lead.person_id}`}>
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>View Contact</span>
                                          </Link>
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-10 text-center text-muted-foreground text-xs">
                          No leads found. Try adjusting your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {leads.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-border/40 bg-muted/20 text-[11px] font-semibold text-muted-foreground">
                        <td colSpan={10} className="p-3.5 font-bold text-foreground">
                          {leads.length} Total Leads ({hotCount} Hot, {warmCount} Warm)
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>
          )}

          {loading && view === "table" && (
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Lead Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm bg-card text-card-foreground border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Add New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label>Contact Name</Label>
              <Input
                placeholder="e.g. Jane Doe"
                value={newLead.person_name}
                onChange={(e) => setNewLead((p) => ({ ...p, person_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input
                placeholder="e.g. Acme Inc"
                value={newLead.company_name}
                onChange={(e) => setNewLead((p) => ({ ...p, company_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                placeholder="e.g. Construction"
                value={newLead.industry}
                onChange={(e) => setNewLead((p) => ({ ...p, industry: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingLead} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-1.5">
                {isAddingLead ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding Lead...</> : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── AI Pre-Call Research Brief Modal ─── */}
      <Dialog open={briefModalOpen} onOpenChange={setBriefModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> AI Pre-Call Intelligence Brief
              </span>
              {briefTargetLead && (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-xs">
                  {briefTargetLead.person_name || briefTargetLead.company_name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {briefLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold">Synthesizing behavioral intelligence & talking points...</p>
            </div>
          ) : briefData ? (
            <div className="space-y-4 text-xs pt-1">
              {/* Executive Summary & Motivator */}
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
                  <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-indigo-400" /> Executive Situational Brief</span>
                  <span className="font-mono text-[10px]">Optimal Duration: ~{briefData.optimal_duration_minutes} mins</span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {briefData.executive_summary}
                </p>
              </div>

              {/* Recommended Vocal Demeanor */}
              <div className="p-3 bg-muted/30 border border-border/40 rounded-xl flex items-center gap-2.5 text-[11px]">
                <Volume2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Vocal & Behavioral Demeanor:</strong> {briefData.recommended_tone}
                </span>
              </div>

              {/* 3 Key Talking Points */}
              <div className="space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Key Value Propositions & Proof Points
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {briefData.key_talking_points.map((tp, idx) => (
                    <div key={idx} className="p-3 bg-card border border-border/50 rounded-xl space-y-1">
                      <div className="font-bold text-indigo-300 text-[11px]">{tp.topic}</div>
                      <div className="text-foreground text-[11px] font-medium">{tp.talking_point}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">Proof: {tp.proof_point}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Likely Objections & Rebuttals */}
              <div className="space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                  <Shield className="h-3.5 w-3.5 text-red-400" /> Anticipated Objections & Validation-First Rebuttals
                </p>
                <div className="space-y-2">
                  {briefData.likely_objections.map((obj, idx) => (
                    <div key={idx} className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl space-y-1">
                      <div className="font-bold text-red-300 text-[11px]">Objection: "{obj.objection}"</div>
                      <div className="text-muted-foreground text-[11px] leading-relaxed">
                        <strong className="text-foreground">Science-backed Counter:</strong> {obj.rebuttal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High-Dopamine Discovery Questions */}
              <div className="space-y-1.5 p-3 bg-muted/20 border border-border/40 rounded-xl">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-400" /> High-Dopamine Discovery Questions
                </p>
                <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                  {briefData.high_impact_questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="button" size="sm" onClick={() => setBriefModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                  Ready to Connect
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─── AI Inbound Reply Triage Modal ─── */}
      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> AI Inbound Reply Triage (Empathetic Response)
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

      {/* ─── AI Lead Scoring & Qualification Modal ─── */}
      <Dialog open={qualifyModalOpen} onOpenChange={setQualifyModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-400" /> AI Lead Scoring & Buying Readiness
              </span>
              {qualifyTargetLead && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">
                  {qualifyTargetLead.person_name || qualifyTargetLead.company_name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {qualifyLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold">Evaluating ICP fit, buying authority, and intent score...</p>
            </div>
          ) : qualifyResult ? (
            <div className="space-y-4 text-xs pt-1">
              {/* Score & Temperature Gauges */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="text-xl font-black text-amber-400 font-mono">{qualifyResult.lead_score}/100</div>
                  <div className="text-[10px] text-muted-foreground">Lead Score</div>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="text-xl font-black text-red-400 font-mono">{qualifyResult.lead_temperature}</div>
                  <div className="text-[10px] text-muted-foreground">Temperature</div>
                </div>
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <div className="text-xl font-black text-indigo-400 font-mono">{qualifyResult.buying_readiness_grade}</div>
                  <div className="text-[10px] text-muted-foreground">Readiness Grade</div>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-xl font-black text-emerald-400 font-mono">{qualifyResult.fit_score}%</div>
                  <div className="text-[10px] text-muted-foreground">ICP Fit Score</div>
                </div>
              </div>

              {/* Qualification Rationale */}
              <div className="p-3.5 bg-muted/20 border border-border/40 rounded-xl space-y-1.5">
                <p className="font-bold text-foreground text-[11px] flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Executive Qualification Analysis
                </p>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {qualifyResult.qualification_rationale}
                </p>
              </div>

              {/* Strengths & Risks */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-1.5">
                  <p className="font-bold text-emerald-300 text-[10px] uppercase">Key Positive Indicators</p>
                  <ul className="text-muted-foreground text-[11px] list-disc list-inside space-y-1">
                    {qualifyResult.key_strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl space-y-1.5">
                  <p className="font-bold text-red-300 text-[10px] uppercase">Risks & Potential Friction</p>
                  <ul className="text-muted-foreground text-[11px] list-disc list-inside space-y-1">
                    {qualifyResult.key_risks_or_blockers.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next Action & Recommended Channel */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-indigo-300 text-[11px]">Recommended Next Action:</div>
                  <div className="text-muted-foreground text-[11px]">{qualifyResult.recommended_next_action}</div>
                </div>
                <Badge className="bg-indigo-500/20 text-indigo-300 font-mono text-[10px] shrink-0">
                  Channel: {qualifyResult.optimal_outreach_channel}
                </Badge>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                <Button type="button" variant="ghost" size="sm" onClick={() => setQualifyModalOpen(false)}>
                  Close
                </Button>
                <Button type="button" size="sm" onClick={handleApplyAIQualification} className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5 text-xs font-semibold">
                  <Check className="h-3.5 w-3.5" /> Apply AI Score to Lead
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">Loading leads...</div>}>
      <LeadsPageContent />
    </React.Suspense>
  );
}
