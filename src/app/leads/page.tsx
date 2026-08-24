"use client";

import * as React from "react";
import Link from "next/link";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  getLeadsActionByToken,
  updateLeadStageActionByToken,
  createLeadActionByToken,
} from "@/services/private/leadServices";
import {
  PIPELINE_STAGES,
  STAGE_COLORS,
  TEMP_COLORS,
} from "@/lib/constants";
import type {
  Lead,
  LeadStage,
} from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Flame,
  Thermometer,
  Snowflake,
  ArrowRight,
  LayoutList,
  Kanban,
  Plus,
  DollarSign,
  SlidersHorizontal,
  ChevronRight,
  Users,
  Clock,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Repeat,
} from "lucide-react";

const STAGE_ICONS: Record<string, React.ReactNode> = {
  Cold: <Snowflake className="h-3.5 w-3.5" />,
  Contacted: <Repeat className="h-3.5 w-3.5" />,
  Warm: <Thermometer className="h-3.5 w-3.5" />,
  Hot: <Flame className="h-3.5 w-3.5" />,
  Customer: <CheckCircle className="h-3.5 w-3.5" />,
  Lost: <XCircle className="h-3.5 w-3.5" />,
};

function ScoreBar({ score }: { score?: number }) {
  const val = score ?? 70;
  const color = val >= 85 ? "bg-emerald-400" : val >= 65 ? "bg-amber-400" : "bg-blue-400";
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono">
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${val}%` }} />
      </div>
      <span className="text-foreground font-bold w-6 text-right">{val}</span>
    </div>
  );
}

// ─── Kanban Card ───────────────────────────────────────────────────────────
function KanbanCard({ lead, onMove }: { lead: Lead; onMove: (id: string | number, stage: LeadStage) => void }) {
  const stage = lead.pipeline_stage || "Cold";
  const sc = STAGE_COLORS[stage] || STAGE_COLORS.Cold;
  const idx = PIPELINE_STAGES.indexOf(stage);
  const prevStage = idx > 0 ? PIPELINE_STAGES[idx - 1] : null;
  const nextStage = idx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[idx + 1] : null;

  return (
    <div className={`rounded-xl ${sc.border} ${sc.bg} p-3 space-y-2.5 text-xs hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between gap-2">
        {lead.contact_avatar && (
          <img src={lead.contact_avatar} alt={lead.contact_name} className="h-7 w-7 rounded-full object-cover border border-border/40 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/people/${lead.id}`} className={`font-bold truncate block hover:text-indigo-400 ${sc.text}`}>
            {lead.contact_name}
          </Link>
          <p className="text-muted-foreground text-[10px] truncate">{lead.contact_title}</p>
        </div>
        <Badge className={`${TEMP_COLORS[lead.temperature || 'Cold']?.badge || 'bg-blue-500/10 text-blue-400 border-blue-500/20'} text-[9px] px-1.5 shrink-0`}>
          {lead.temperature || 'Cold'}
        </Badge>
      </div>

      <div className="text-[10px] text-muted-foreground font-mono">
        <Link href={`/companies/${lead.organization_id}`} className="text-indigo-400 hover:text-indigo-300 font-semibold">
          {lead.organization_name}
        </Link>
      </div>

      <ScoreBar score={lead.score} />

      <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border/20">
        <span className="text-emerald-400 font-bold">${Number(lead.deal_value || 0).toLocaleString()}</span>
        <span className="text-muted-foreground">↩ #{lead.followup_count}</span>
      </div>

      <div className="flex items-center gap-1 pt-0.5">
        {prevStage && (
          <button onClick={() => onMove(lead.id, prevStage as LeadStage)}
            className="flex-1 text-center text-[10px] py-1 rounded bg-muted/40 hover:bg-muted/70 text-muted-foreground transition-colors">
            ← {prevStage}
          </button>
        )}
        {nextStage && (
          <button onClick={() => onMove(lead.id, nextStage as LeadStage)}
            className="flex-1 text-center text-[10px] py-1 rounded bg-muted/40 hover:bg-muted/70 text-muted-foreground transition-colors">
            {nextStage} →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"table" | "kanban">("kanban");

  // Filters
  const [search, setSearch] = React.useState("");
  const [filterStage, setFilterStage] = React.useState<string>("all");
  const [filterAssigned, setFilterAssigned] = React.useState("all");

  // Add Lead Modal
  const [addOpen, setAddOpen] = React.useState(false);
  const [newLead, setNewLead] = React.useState({ contact_name: "", organization_name: "", deal_value: "" });

  const { user } = useAuth();
  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const data = await getLeadsActionByToken(token, { search });
      let filtered = Array.isArray(data) ? data : [];
      if (filterStage !== "all") filtered = filtered.filter(l => l.pipeline_stage === filterStage);
      if (filterAssigned !== "all") filtered = filtered.filter(l => l.assigned_to === filterAssigned);
      setLeads(filtered);
    } catch (e) {
      console.error("Failed to load leads:", e);
    } finally {
      setLoading(false);
    }
  }, [user, search, filterStage, filterAssigned]);

  React.useEffect(() => { load(); }, [load]);

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

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await createLeadActionByToken(token, {
        contact_name: newLead.contact_name,
        organization_name: newLead.organization_name,
        deal_value: Number(newLead.deal_value) || 50000,
      });
      setAddOpen(false);
      setNewLead({ contact_name: "", organization_name: "", deal_value: "" });
      load();
    } catch (e) {
      console.error("Failed to create lead:", e);
    }
  };

  // Stats summary
  const totalPipeline = leads.reduce((s, l) => s + (Number(l.deal_value) || 0), 0);
  const hotCount = leads.filter(l => l.pipeline_stage === "Hot").length;
  const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + (l.score || l.lead_score || 0), 0) / leads.length) : 0;

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
              { label: "Total Leads", value: leads.length.toString(), color: "text-foreground" },
              { label: "Hot Leads", value: hotCount.toString(), color: "text-red-400" },
              { label: "Pipeline Value", value: `$${(totalPipeline / 1000).toFixed(0)}k`, color: "text-emerald-400" },
              { label: "Avg Score", value: `${avgScore}/100`, color: "text-indigo-300" },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card p-4 text-center">
                <div className={`text-2xl font-extrabold font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Controls: View Toggle + Search + Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-card p-4 rounded-xl backdrop-blur-xl">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 shrink-0">
              <button onClick={() => setView("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "kanban" ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"}`}>
                <Kanban className="h-3.5 w-3.5" /> Kanban
              </button>
              <button onClick={() => setView("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === "table" ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutList className="h-3.5 w-3.5" /> Table
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by contact, company, industry..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 text-xs h-9" />
            </div>

            {/* Stage filter */}
            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}
              className="bg-muted/40 rounded-md px-2.5 py-1.5 text-xs outline-none text-foreground shrink-0">
              <option value="all">All Stages</option>
              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Assigned filter */}
            <select value={filterAssigned} onChange={(e) => setFilterAssigned(e.target.value)}
              className="bg-muted/40 rounded-md px-2.5 py-1.5 text-xs outline-none text-foreground shrink-0">
              <option value="all">All Reps</option>
              <option value="Alex Rivers">Alex Rivers</option>
              <option value="Sarah Connor">Sarah Connor</option>
              <option value="David Kim">David Kim</option>
            </select>

            {/* Add Lead */}
            <Button size="sm" onClick={() => setAddOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold h-9 shrink-0">
              <Plus className="h-3.5 w-3.5" /> Add Lead
            </Button>
          </div>

          {/* =================== KANBAN VIEW =================== */}
          {view === "kanban" && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {PIPELINE_STAGES.map((stage) => {
                const sc = STAGE_COLORS[stage];
                const stageLeads = leads.filter(l => l.pipeline_stage === stage);
                const stageValue = stageLeads.reduce((s, l) => s + (Number(l.deal_value) || 0), 0);
                return (
                  <div key={stage} className="flex flex-col gap-3">
                    {/* Column Header */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${sc.border} ${sc.bg}`}>
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${sc.text}`}>
                        {STAGE_ICONS[stage]} {stage}
                      </div>
                      <Badge className={`${sc.bg} ${sc.text} border-none text-[10px] font-mono`}>
                        {stageLeads.length}
                      </Badge>
                    </div>
                    {/* Stage Value */}
                    <div className="text-[10px] text-muted-foreground font-mono px-1">
                      ${(stageValue / 1000).toFixed(0)}k pipeline
                    </div>
                    {/* Cards */}
                    <div className="space-y-2.5">
                      {stageLeads.length > 0 ? (
                        stageLeads.map(lead => (
                          <KanbanCard key={lead.id} lead={lead} onMove={handleMove} />
                        ))
                      ) : (
                        <div className="h-20 rounded-xl flex items-center justify-center text-[10px] text-muted-foreground/40">
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
                      <th className="p-3.5">Industry</th>
                      <th className="p-3.5">Temperature</th>
                      <th className="p-3.5">Stage</th>
                      <th className="p-3.5">Score</th>
                      <th className="p-3.5">Deal Value</th>
                      <th className="p-3.5">Last Contact</th>
                      <th className="p-3.5">Next Follow-Up</th>
                      <th className="p-3.5">Follow-Ups</th>
                      <th className="p-3.5">Assigned</th>
                      <th className="p-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={12} className="p-4 bg-card/20" />
                        </tr>
                      ))
                    ) : leads.length > 0 ? (
                      leads.map((lead) => {
                        const stage = lead.pipeline_stage || 'Cold';
                        const sc = STAGE_COLORS[stage] || STAGE_COLORS['Cold'];
                        const tc = TEMP_COLORS[lead.temperature || 'Cold'] || TEMP_COLORS['Cold'];
                        return (
                          <tr key={lead.id} className="hover:bg-muted/40 transition-colors group">
                            {/* Person */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                {lead.contact_avatar && (
                                  <img src={lead.contact_avatar} alt={lead.contact_name}
                                    className="h-7 w-7 rounded-full object-cover border border-indigo-500/20 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold truncate max-w-[110px]">{lead.contact_name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[110px]">{lead.contact_title}</p>
                                </div>
                              </div>
                            </td>
                            {/* Company */}
                            <td className="p-3.5">
                              <Link href={`/companies/${lead.organization_id}`} className="text-indigo-400 hover:text-indigo-300 font-semibold whitespace-nowrap">
                                {lead.organization_name}
                              </Link>
                            </td>
                            {/* Industry */}
                            <td className="p-3.5 text-muted-foreground text-[11px] whitespace-nowrap">
                              {lead.industry || "—"}
                            </td>
                            {/* Temperature */}
                            <td className="p-3.5">
                              <Badge className={`${tc.badge} text-[10px]`}>
                                {lead.temperature || 'Cold'}
                              </Badge>
                            </td>
                            {/* Stage */}
                            <td className="p-3.5">
                              <Badge className={`${sc.bg} ${sc.text} border ${sc.border} text-[10px] gap-1`}>
                                {STAGE_ICONS[stage]} {stage}
                              </Badge>
                            </td>
                            {/* Score */}
                            <td className="p-3.5 w-28">
                              <ScoreBar score={lead.score} />
                            </td>
                            {/* Deal Value */}
                            <td className="p-3.5 font-mono text-emerald-400 font-semibold whitespace-nowrap">
                              ${Number(lead.deal_value || 0).toLocaleString()}
                            </td>
                            {/* Last Contact */}
                            <td className="p-3.5 text-muted-foreground font-mono text-[10px] whitespace-nowrap">
                              {lead.last_contact || "—"}
                            </td>
                            {/* Next Follow-Up */}
                            <td className="p-3.5 text-muted-foreground font-mono text-[10px] whitespace-nowrap">
                              {lead.next_followup || "—"}
                            </td>
                            {/* Follow-Up Count */}
                            <td className="p-3.5 font-mono text-center">
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                                {lead.followup_count}
                              </span>
                            </td>
                            {/* Assigned */}
                            <td className="p-3.5 text-muted-foreground text-[11px] whitespace-nowrap">
                              {lead.assigned_to}
                            </td>
                            {/* Move Buttons */}
                            <td className="p-3.5">
                              {(() => {
                                const idx = PIPELINE_STAGES.indexOf(stage);
                                const next = PIPELINE_STAGES[idx + 1];
                                return next ? (
                                  <Button size="sm" variant="ghost"
                                    onClick={() => handleMove(lead.id, next)}
                                    className={`text-[10px] h-7 gap-0.5 opacity-0 group-hover:opacity-100 ${sc.text}`}>
                                    → {next}
                                  </Button>
                                ) : null;
                              })()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={12} className="p-10 text-center text-muted-foreground text-xs">
                          No leads found. Try adjusting your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {leads.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-border/40 bg-muted/20 text-[11px] font-semibold text-muted-foreground">
                        <td className="p-3.5 font-bold text-foreground">{leads.length} leads</td>
                        <td colSpan={5} />
                        <td className="p-3.5 font-mono font-bold text-emerald-400">
                          ${totalPipeline.toLocaleString()} total
                        </td>
                        <td colSpan={5} />
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
        <DialogContent className="sm:max-w-sm bg-card/95 border-border/60">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Add New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label>Contact Name</Label>
              <Input placeholder="e.g. Jane Doe" value={newLead.contact_name}
                onChange={e => setNewLead(p => ({ ...p, contact_name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input placeholder="e.g. Acme Inc" value={newLead.organization_name}
                onChange={e => setNewLead(p => ({ ...p, organization_name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Deal Value ($)</Label>
              <Input type="number" placeholder="e.g. 75000" value={newLead.deal_value}
                onChange={e => setNewLead(p => ({ ...p, deal_value: e.target.value }))} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Add Lead</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
