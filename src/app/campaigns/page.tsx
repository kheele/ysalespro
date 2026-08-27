"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  getCampaignsActionByToken,
  createCampaignActionByToken,
  updateCampaignStatusActionByToken,
} from "@/services/private/campaignServices";
import {
  optimizeCampaignSequenceAction,
  predictOptimalTimingAction,
  generateCampaignStrategyAction,
} from "@/services/private/aiMessageServices";
import type { OptimizeSequenceOutput } from "@/ai/schemas/sequence-optimizer";
import type { PredictOptimalTimingOutput } from "@/ai/schemas/optimal-timing";
import type { GenerateCampaignStrategyOutput } from "@/ai/schemas/campaign-generator";
import * as industryServices from "@/services/public/industryServices";
import * as organizationServices from "@/services/public/organizationServices";
import * as peopleServices from "@/services/public/peopleServices";
import {
  DEFAULT_SEQUENCE,
  DEFAULT_RULES,
  DEFAULT_SCHEDULE,
} from "@/lib/constants";
import type {
  Campaign,
  CampaignStatus,
  SequenceStep,
  SequenceStepType,
  CampaignRules,
  CampaignAudience,
  CampaignSchedule,
} from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Plus, Play, Pause, CheckCircle2, XCircle, FileEdit,
  Mail, Users, Target, Zap, Clock, ChevronRight, Settings2, BarChart3,
  Trash2, GripVertical, AlertCircle, CalendarDays, StopCircle,
  ListChecks, ArrowRight, ArrowLeft, Rocket, Loader2, Sparkles, Lightbulb, Check,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const STEP_TYPES: SequenceStepType[] = ["Introduction", "Follow-up", "Case Study", "Final Message", "Custom"];

const STEP_COLORS: Record<SequenceStepType, string> = {
  Introduction: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  "Follow-up": "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "Case Study": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Final Message": "text-red-400 bg-red-500/10 border-red-500/30",
  Custom: "text-purple-400 bg-purple-500/10 border-purple-500/30",
};

const STATUS_META: Record<CampaignStatus, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Draft: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", icon: <FileEdit className="h-3 w-3" /> },
  Active: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: <Play className="h-3 w-3" /> },
  Paused: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: <Pause className="h-3 w-3" /> },
  Completed: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  Cancelled: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
};

const WIZARD_STEPS = [
  { id: 1, label: "Audience", icon: <Users className="h-3.5 w-3.5" /> },
  { id: 2, label: "Sequence", icon: <ListChecks className="h-3.5 w-3.5" /> },
  { id: 3, label: "Rules", icon: <Settings2 className="h-3.5 w-3.5" /> },
  { id: 4, label: "Schedule", icon: <CalendarDays className="h-3.5 w-3.5" /> },
];

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full border transition-all flex items-center px-0.5 shrink-0 ${checked ? "bg-indigo-600 border-indigo-600" : "bg-muted/40 border-border/60"
        }`}>
      <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";

// ─── Campaign Builder Wizard Modal ────────────────────────────────────────────
function CampaignBuilderModal({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (c: Partial<Campaign>) => void;
}) {
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [audience, setAudience] = React.useState<CampaignAudience>({
    industries: [], companies: [], people: [], estimated_contacts: 0,
  });

  // Dynamic cascading option states
  const [availableIndustries, setAvailableIndustries] = React.useState<string[]>([]);
  const [loadingIndustries, setLoadingIndustries] = React.useState(false);

  const [availableCompanies, setAvailableCompanies] = React.useState<string[]>([]);
  const [loadingCompanies, setLoadingCompanies] = React.useState(false);

  const [availablePeople, setAvailablePeople] = React.useState<string[]>([]);
  const [loadingPeople, setLoadingPeople] = React.useState(false);

  // 1. Fetch available industries on modal open
  React.useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingIndustries(true);
      try {
        const res = await industryServices.getIndustries({ limit: 0 });
        if (res?.industries) {
          setAvailableIndustries(res.industries.map((i) => i.name).filter(Boolean));
        }
      } catch (err) {
        console.error("Failed to load industries:", err);
      } finally {
        setLoadingIndustries(false);
      }
    })();
  }, [open]);

  // 2. Fetch companies cascading from selected industries
  React.useEffect(() => {
    if (!open) return;
    let isMounted = true;
    (async () => {
      setLoadingCompanies(true);
      try {
        let companiesList: string[] = [];
        if (audience.industries.length === 0) {
          const res = await organizationServices.getOrganizations({ pageSize: 60 });
          companiesList = (res?.organizations || []).map((o) => o.name).filter(Boolean);
        } else {
          const results = await Promise.all(
            audience.industries.map((ind) =>
              organizationServices.getOrganizations({ industry: ind, pageSize: 50 })
            )
          );
          const allOrgs = results.flatMap((r) => r?.organizations || []);
          companiesList = Array.from(new Set(allOrgs.map((o) => o.name).filter(Boolean)));
        }
        if (isMounted) {
          setAvailableCompanies(companiesList);
        }
      } catch (err) {
        console.error("Failed to load companies for selected industries:", err);
      } finally {
        if (isMounted) setLoadingCompanies(false);
      }
    })();
    return () => { isMounted = false; };
  }, [open, audience.industries]);

  // 3. Fetch people cascading from selected companies and industries
  React.useEffect(() => {
    if (!open) return;
    let isMounted = true;
    (async () => {
      setLoadingPeople(true);
      try {
        let peopleList: string[] = [];
        if (audience.companies.length > 0) {
          const results = await Promise.all(
            audience.companies.map((comp) =>
              peopleServices.getDecisionMakers({ company_name: comp, limit: 50 })
            )
          );
          const allPpl = results.flatMap((r) => r?.people || []);
          peopleList = Array.from(
            new Set(
              allPpl.map((p) => `${p.name} (${p.title || p.job_title || "Executive"}, ${p.company_name || ""})`)
            )
          ).filter(Boolean);
        } else if (audience.industries.length > 0) {
          const results = await Promise.all(
            audience.industries.map((ind) =>
              peopleServices.getDecisionMakers({ industry: ind, limit: 50 })
            )
          );
          const allPpl = results.flatMap((r) => r?.people || []);
          peopleList = Array.from(
            new Set(
              allPpl.map((p) => `${p.name} (${p.title || p.job_title || "Executive"}, ${p.company_name || ""})`)
            )
          ).filter(Boolean);
        } else {
          const res = await peopleServices.getDecisionMakers({ limit: 60 });
          peopleList = (res?.people || []).map(
            (p) => `${p.name} (${p.title || p.job_title || "Executive"}, ${p.company_name || ""})`
          ).filter(Boolean);
        }

        if (isMounted) {
          setAvailablePeople(peopleList);
        }
      } catch (err) {
        console.error("Failed to load decision makers:", err);
      } finally {
        if (isMounted) setLoadingPeople(false);
      }
    })();
    return () => { isMounted = false; };
  }, [open, audience.industries, audience.companies]);

  // Estimated reach calculation
  React.useEffect(() => {
    let est = 0;
    if (audience.people.length > 0) {
      est = audience.people.length;
    } else if (audience.companies.length > 0) {
      est = audience.companies.length * 8;
    } else if (audience.industries.length > 0) {
      est = audience.industries.length * 35;
    }
    setAudience((a) => ({ ...a, estimated_contacts: est }));
  }, [audience.industries, audience.companies, audience.people]);

  const [sequence, setSequence] = React.useState<SequenceStep[]>(DEFAULT_SEQUENCE);
  const [rules, setRules] = React.useState<CampaignRules>(DEFAULT_RULES);
  const [schedule, setSchedule] = React.useState<CampaignSchedule>(DEFAULT_SCHEDULE);

  // AI Campaign Strategy Generator State
  const [generatingStrategy, setGeneratingStrategy] = React.useState(false);
  const [strategyPrompt, setStrategyPrompt] = React.useState("");

  // AI Sequence Optimizer State
  const [optimizing, setOptimizing] = React.useState(false);
  const [optimizeModalOpen, setOptimizeModalOpen] = React.useState(false);
  const [optimizeResult, setOptimizeResult] = React.useState<OptimizeSequenceOutput | null>(null);

  // AI Smart Timing Predictor State
  const [timingLoading, setTimingLoading] = React.useState(false);
  const [timingModalOpen, setTimingModalOpen] = React.useState(false);
  const [timingResult, setTimingResult] = React.useState<PredictOptimalTimingOutput | null>(null);

  const handleGenerateCampaignStrategy = async () => {
    if (!strategyPrompt.trim()) return;
    setGeneratingStrategy(true);
    try {
      const res = await generateCampaignStrategyAction({
        campaign_goal: strategyPrompt,
        target_industry: audience.industries[0] || undefined,
      });
      if (res) {
        setName(res.campaign_name);
        setDescription(res.description);
        if (res.recommended_audience_filters?.suggested_industries?.length) {
          setAudience(a => ({
            ...a,
            industries: Array.from(new Set([...a.industries, ...res.recommended_audience_filters.suggested_industries])),
          }));
        }
        if (res.sequence_steps?.length) {
          setSequence(res.sequence_steps.map((st, idx) => ({
            id: `step-${idx + 1}`,
            step_number: st.step_number,
            day: st.day,
            type: (st.type as SequenceStepType) || "Follow-up",
            subject: st.subject,
            body: st.body,
            enabled: true,
          })));
        }
        if (res.recommended_rules) {
          setRules(r => ({ ...r, ...res.recommended_rules }));
        }
        if (res.recommended_schedule) {
          setSchedule(s => ({
            ...s,
            send_days: (res.recommended_schedule.send_days as any) || s.send_days,
            send_time_from: res.recommended_schedule.send_time_from || s.send_time_from,
            send_time_to: res.recommended_schedule.send_time_to || s.send_time_to,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to generate campaign strategy:", err);
    } finally {
      setGeneratingStrategy(false);
    }
  };

  const handleRunAIOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await optimizeCampaignSequenceAction({
        campaign_name: name || "Outbound Sequence",
        industry: audience.industries[0] || "Enterprise B2B",
        target_audience: audience.people.length > 0 ? "Targeted Decision Makers" : "Industry Executives",
        current_steps: sequence.map((s, idx) => ({
          step_number: s.step_number || (idx + 1),
          day: s.day,
          type: s.type,
          subject: s.subject,
          body: s.body,
        })),
      });
      setOptimizeResult(res);
      setOptimizeModalOpen(true);
    } catch (err) {
      console.error("AI Sequence Optimize failed:", err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyOptimizedSteps = () => {
    if (!optimizeResult?.optimized_steps) return;
    setSequence(optimizeResult.optimized_steps.map((st, idx) => ({
      id: `step-${idx + 1}`,
      step_number: st.step_number,
      day: st.day,
      type: (st.type as SequenceStepType) || "Follow-up",
      subject: st.subject,
      body: st.body,
      enabled: true,
    })));
    setOptimizeModalOpen(false);
  };

  const handlePredictTiming = async () => {
    setTimingLoading(true);
    try {
      const res = await predictOptimalTimingAction({
        industry: audience.industries[0] || "Enterprise",
        seniority: "VP",
        timezone: schedule.timezone,
      });
      setTimingResult(res);
      setTimingModalOpen(true);
    } catch (err) {
      console.error("Predict timing failed:", err);
    } finally {
      setTimingLoading(false);
    }
  };

  const handleApplyTimingSchedule = (win: { time_range: string }) => {
    const [from, to] = win.time_range.split(" - ");
    if (from && to) {
      setSchedule(s => ({
        ...s,
        send_time_from: from.trim(),
        send_time_to: to.trim(),
      }));
    }
    setTimingModalOpen(false);
  };

  const updateStep = (id: string, field: keyof SequenceStep, val: any) =>
    setSequence(s => s.map(st => st.id === id ? { ...st, [field]: val } : st));

  const addStep = () => {
    const lastDay = sequence.length > 0 ? sequence[sequence.length - 1].day : 0;
    setSequence(s => [...s, {
      id: `step-${Date.now()}`, day: lastDay + 7, type: "Custom",
      subject: "New Step — {{first_name}}", body: "", enabled: true,
    }]);
  };

  const removeStep = (id: string) => setSequence(s => s.filter(st => st.id !== id));

  const toggleSendDay = (d: CampaignSchedule['send_days'][number]) => {
    setSchedule(s => ({
      ...s,
      send_days: s.send_days.includes(d) ? s.send_days.filter(x => x !== d) : [...s.send_days, d],
    }));
  };

  const { user } = useAuth();

  const handleLaunch = async (asDraft = false) => {
    await onSave({
      name, description, audience, sequence, rules, schedule,
      created_by: user?.displayName || user?.email?.split("@")[0] || "User",
    });
    onClose();
    setStep(1);
  };

  const canNext = step === 1
    ? (name.length > 0 && (audience.industries.length > 0 || audience.companies.length > 0 || audience.people.length > 0))
    : step === 2 ? sequence.filter(s => s.enabled).length > 0
      : true;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card max-h-[92vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Rocket className="h-5 w-5 text-indigo-400" /> Email Campaign Builder
          </DialogTitle>

          {/* Wizard Step Indicator */}
          <div className="flex items-center gap-1 mt-4">
            {WIZARD_STEPS.map((ws, i) => (
              <React.Fragment key={ws.id}>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${step === ws.id ? "bg-indigo-600 text-white" :
                    step > ws.id ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      "bg-muted/30 text-muted-foreground border border-border/40"
                    }`}
                  onClick={() => step > ws.id && setStep(ws.id)}
                >
                  {step > ws.id ? <CheckCircle2 className="h-3 w-3" /> : ws.icon}
                  {ws.label}
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">

          {/* ─── STEP 1: AUDIENCE ─── */}
          {step === 1 && (
            <div className="space-y-5">
              {/* AI Auto-Generate Strategy Bar */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> AI Strategy Generator
                  </span>
                  <span className="text-[10px] text-muted-foreground">Auto-generates title, audience & 4-step sequence</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Book 15-min discovery calls with FinTech CTOs on compliance automation..."
                    value={strategyPrompt}
                    onChange={e => setStrategyPrompt(e.target.value)}
                    className="bg-card/80 border-border/60 text-xs h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateCampaignStrategy}
                    disabled={generatingStrategy || !strategyPrompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-3 shrink-0 font-semibold gap-1.5"
                  >
                    {generatingStrategy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {generatingStrategy ? "Building Strategy..." : "Generate Strategy"}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Campaign Name <span className="text-red-400">*</span></Label>
                <Input placeholder="e.g. Q3 Enterprise CTO Outreach" value={name}
                  onChange={e => setName(e.target.value)} className="bg-muted/40 border-border/60 h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input placeholder="Brief campaign goal or context..." value={description}
                  onChange={e => setDescription(e.target.value)} className="bg-muted/40 border-border/60 h-9 text-xs" />
              </div>

              {/* 1. Select Industries */}
              <SearchableMultiSelect
                label="Select Industries"
                icon={<Target className="h-3.5 w-3.5 text-indigo-400" />}
                placeholder="Search & filter industries..."
                options={availableIndustries}
                selected={audience.industries}
                onChange={v => setAudience(a => ({ ...a, industries: v }))}
                loading={loadingIndustries}
                hint="Filters company & decision maker suggestions"
              />

              {/* 2. Select Companies (loaded from Selected Industries) */}
              <SearchableMultiSelect
                label="Select Companies"
                icon={<Target className="h-3.5 w-3.5 text-purple-400" />}
                placeholder={
                  audience.industries.length > 0
                    ? `Search organizations in ${audience.industries.length} selected industry(ies)...`
                    : "Search all verified organizations..."
                }
                options={availableCompanies}
                selected={audience.companies}
                onChange={v => setAudience(a => ({ ...a, companies: v }))}
                loading={loadingCompanies}
                hint={
                  audience.industries.length > 0
                    ? `Loaded from ${audience.industries.length} selected industry(ies)`
                    : "All industries"
                }
              />

              {/* 3. Select People (loaded from Selected Companies & Selected Industries) */}
              <SearchableMultiSelect
                label="Select People (Decision Makers)"
                icon={<Users className="h-3.5 w-3.5 text-emerald-400" />}
                placeholder={
                  audience.companies.length > 0
                    ? `Search contacts in ${audience.companies.length} selected company(ies)...`
                    : audience.industries.length > 0
                      ? `Search contacts in ${audience.industries.length} selected industry(ies)...`
                      : "Search all verified decision makers..."
                }
                options={availablePeople}
                selected={audience.people}
                onChange={v => setAudience(a => ({ ...a, people: v }))}
                loading={loadingPeople}
                hint={
                  audience.companies.length > 0
                    ? `Filtered by ${audience.companies.length} company(ies)`
                    : audience.industries.length > 0
                      ? `Filtered by ${audience.industries.length} industry(ies)`
                      : "All contacts"
                }
              />

              {audience.estimated_contacts > 0 && (
                <div className="flex items-center gap-2 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                  <Users className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-indigo-300 font-semibold">
                    Estimated reach: <span className="text-indigo-200 font-bold font-mono text-sm">~{audience.estimated_contacts}</span> contacts
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: SEQUENCE ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">Define the emails and timing. Sequence auto-stops on reply or meeting.</p>
                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" size="sm" variant="outline" onClick={handleRunAIOptimize} disabled={optimizing}
                    className="h-7 text-[11px] gap-1.5 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20">
                    {optimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-indigo-400" />}
                    {optimizing ? "Optimizing..." : "AI Optimize"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={addStep}
                    className="h-7 text-[11px] gap-1 border-border/60 shrink-0">
                    <Plus className="h-3 w-3" /> Add Step
                  </Button>
                </div>
              </div>

              {/* Sequence Timeline */}
              <div className="space-y-3 relative">
                <div className="absolute left-[19px] top-8 bottom-8 w-px bg-border/40" />
                {sequence.map((step_item, idx) => {
                  const sc = STEP_COLORS[step_item.type] || STEP_COLORS.Custom;
                  return (
                    <div key={step_item.id} className="relative flex items-start gap-3">
                      {/* Day Node */}
                      <div className={`h-10 w-10 rounded-full border flex flex-col items-center justify-center text-[9px] font-bold font-mono shrink-0 z-10 ${sc}`}>
                        <span>D</span>
                        <span>{step_item.day}</span>
                      </div>

                      {/* Card */}
                      <div className={`flex-1 rounded-xl border ${step_item.enabled ? "border-border/50 bg-card" : "border-border/20 bg-muted/10 opacity-50"} p-3 space-y-2`}>
                        {/* Top row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <select value={step_item.type}
                            onChange={e => updateStep(step_item.id, 'type', e.target.value as SequenceStepType)}
                            className="bg-muted/40 border border-border/60 rounded-md px-2 py-1 text-[11px] outline-none text-foreground">
                            {STEP_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span>Day</span>
                            <input type="number" min={0} max={90} value={step_item.day}
                              onChange={e => updateStep(step_item.id, 'day', Number(e.target.value))}
                              className="w-12 bg-muted/40 border border-border/60 rounded-md px-2 py-1 text-center text-[11px] outline-none text-foreground font-mono" />
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <Toggle checked={step_item.enabled} onChange={v => updateStep(step_item.id, 'enabled', v)} />
                            {sequence.length > 1 && (
                              <button onClick={() => removeStep(step_item.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Subject */}
                        <Input value={step_item.subject}
                          onChange={e => updateStep(step_item.id, 'subject', e.target.value)}
                          placeholder="Email subject (use {{first_name}}, {{company}})"
                          className="bg-muted/30 border-border/40 h-8 text-[11px] font-semibold" />

                        {/* Body */}
                        <Textarea value={step_item.body}
                          onChange={e => updateStep(step_item.id, 'body', e.target.value)}
                          placeholder="Email body..."
                          className="bg-muted/30 border-border/40 text-[11px] min-h-[80px] resize-none leading-relaxed" />

                        <div className="text-[10px] text-muted-foreground/60 font-mono">
                          Variables: {'{{first_name}}'} {'{{company}}'} {'{{industry}}'} {'{{sender_name}}'} {'{{sender_title}}'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── STEP 3: RULES ─── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Configure automation rules that control what happens when a contact responds.</p>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Stop Conditions</p>
                <div className="bg-card/40 border border-border/40 rounded-xl px-4 divide-y divide-border/30">
                  {[
                    { key: "stop_on_reply" as const, label: "Stop sequence on reply", desc: "Immediately halt emails when contact replies to any step", icon: <StopCircle className="h-3.5 w-3.5 text-emerald-400" /> },
                    { key: "stop_on_meeting_booked" as const, label: "Stop when meeting is booked", desc: "Halt emails when a calendar meeting is scheduled", icon: <CalendarDays className="h-3.5 w-3.5 text-purple-400" /> },
                  ].map(r => (
                    <div key={r.key} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {r.icon}
                        <div>
                          <p className="font-semibold text-foreground">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
                        </div>
                      </div>
                      <Toggle checked={rules[r.key]} onChange={v => setRules(r_ => ({ ...r_, [r.key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Automation Actions</p>
                <div className="bg-card/40 border border-border/40 rounded-xl px-4 divide-y divide-border/30">
                  {[
                    { key: "update_lead_status" as const, label: "Update lead status automatically", desc: "Move lead from Cold → Warm → Hot based on engagement signals", icon: <ArrowRight className="h-3.5 w-3.5 text-amber-400" /> },
                    { key: "create_follow_up_task" as const, label: "Create follow-up task on reply", desc: "Auto-generate a task for the assigned rep when a reply comes in", icon: <ListChecks className="h-3.5 w-3.5 text-indigo-400" /> },
                    { key: "exclude_customers" as const, label: "Exclude existing customers", desc: "Do not enroll contacts already tagged as Customer", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> },
                    { key: "exclude_competitors" as const, label: "Exclude known competitors", desc: "Skip contacts at companies flagged as competitor accounts", icon: <XCircle className="h-3.5 w-3.5 text-red-400" /> },
                  ].map(r => (
                    <div key={r.key} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {r.icon}
                        <div>
                          <p className="font-semibold text-foreground">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
                        </div>
                      </div>
                      <Toggle checked={rules[r.key]} onChange={v => setRules(r_ => ({ ...r_, [r.key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: SCHEDULE + REVIEW ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">Configure when emails are sent and review your campaign before launching.</p>

              {/* Sending Window */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Send on days</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handlePredictTiming} disabled={timingLoading}
                    className="h-6 text-[10px] gap-1.5 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20">
                    {timingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-indigo-400" />}
                    {timingLoading ? "Analyzing..." : "AI Best Send Times"}
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map(d => {
                    const active = schedule.send_days.includes(d);
                    return (
                      <button key={d} type="button" onClick={() => toggleSendDay(d)}
                        className={`w-11 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"
                          }`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Send window starts</Label>
                  <Input type="time" value={schedule.send_time_from}
                    onChange={e => setSchedule(s => ({ ...s, send_time_from: e.target.value }))}
                    className="bg-muted/40 border-border/60 h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Send window ends</Label>
                  <Input type="time" value={schedule.send_time_to}
                    onChange={e => setSchedule(s => ({ ...s, send_time_to: e.target.value }))}
                    className="bg-muted/40 border-border/60 h-9 text-xs font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={schedule.start_date}
                    onChange={e => setSchedule(s => ({ ...s, start_date: e.target.value }))}
                    className="bg-muted/40 border-border/60 h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Timezone</Label>
                  <select value={schedule.timezone} onChange={e => setSchedule(s => ({ ...s, timezone: e.target.value }))}
                    className="w-full bg-muted/40 border border-border/60 rounded-md px-3 py-2 text-xs outline-none text-foreground h-9">
                    <option>SAST (UTC+2 - Johannesburg / South Africa)</option>
                    <option>UTC+0 (GMT / London)</option>
                    <option>UTC+1 (CET / Paris / Berlin)</option>
                    <option>UTC+2 (EET / Cairo)</option>
                    <option>UTC+3 (EAT / Nairobi)</option>
                    <option>UTC-5 (Eastern / New York)</option>
                    <option>UTC-6 (Central / Chicago)</option>
                    <option>UTC-7 (Mountain / Denver)</option>
                    <option>UTC-8 (Pacific / Los Angeles)</option>
                  </select>
                </div>
              </div>

              {/* Summary Review */}
              <div className="border border-border/40 rounded-xl p-4 space-y-3 bg-muted/20">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Campaign Summary</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div><span className="text-muted-foreground">Name: </span><span className="font-bold">{name}</span></div>
                  <div><span className="text-muted-foreground">Contacts: </span><span className="font-bold text-indigo-300">~{audience.estimated_contacts}</span></div>
                  <div><span className="text-muted-foreground">Industries: </span><span className="font-bold">{audience.industries.length || "None"}</span></div>
                  <div><span className="text-muted-foreground">Companies: </span><span className="font-bold">{audience.companies.length || "None"}</span></div>
                  <div><span className="text-muted-foreground">Sequence steps: </span><span className="font-bold">{sequence.filter(s => s.enabled).length} enabled</span></div>
                  <div><span className="text-muted-foreground">Duration: </span><span className="font-bold">~{Math.max(...sequence.map(s => s.day))} days</span></div>
                  <div><span className="text-muted-foreground">Stop on reply: </span><span className={rules.stop_on_reply ? "text-emerald-400 font-bold" : "text-muted-foreground"}>
                    {rules.stop_on_reply ? "Yes" : "No"}</span></div>
                  <div><span className="text-muted-foreground">Auto-update leads: </span><span className={rules.update_lead_status ? "text-emerald-400 font-bold" : "text-muted-foreground"}>
                    {rules.update_lead_status ? "Yes" : "No"}</span></div>
                  <div><span className="text-muted-foreground">Send window: </span><span className="font-bold font-mono">{schedule.send_time_from} – {schedule.send_time_to}</span></div>
                  <div><span className="text-muted-foreground">Days: </span><span className="font-bold">{schedule.send_days.join(", ")}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Nav */}
        <div className="p-6 pt-0 border-t border-border/30 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="text-xs gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <div className="flex items-center gap-2">
            {step === 4 && (
              <Button type="button" variant="outline" size="sm"
                onClick={() => handleLaunch(true)}
                className="text-xs gap-1.5 border-border/60 h-9">
                Save as Draft
              </Button>
            )}
            <Button type="button" size="sm"
              disabled={!canNext}
              onClick={() => step < 4 ? setStep(s => s + 1) : handleLaunch()}
              className={`text-xs gap-1.5 font-semibold h-9 ${step === 4 ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-500"} text-white disabled:opacity-50`}>
              {step === 4 ? <><Rocket className="h-3.5 w-3.5" /> Launch Campaign</> : <>Next: {WIZARD_STEPS[step]?.label} <ArrowRight className="h-3.5 w-3.5" /></>}
            </Button>
          </div>
        </div>

        {/* ─── AI Sequence Optimizer Modal ─── */}
        <Dialog open={optimizeModalOpen} onOpenChange={setOptimizeModalOpen}>
          <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" /> AI Sequence Copilot (Vanessa Van Edwards Science-Based Optimization)
                </span>
                {optimizeResult && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                    Grade {optimizeResult.overall_grade} · {optimizeResult.overall_score}/100
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {optimizeResult && (
              <div className="space-y-4 text-xs pt-2">
                {/* Metrics Lift Forecast */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                    <div className="text-lg font-black text-indigo-400 font-mono">+{optimizeResult.predicted_open_rate_boost_pct}%</div>
                    <div className="text-[10px] text-muted-foreground">Predicted Open Rate Lift</div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <div className="text-lg font-black text-emerald-400 font-mono">+{optimizeResult.predicted_reply_rate_boost_pct}%</div>
                    <div className="text-[10px] text-muted-foreground">Predicted Reply Rate Lift</div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-1.5 p-3 bg-muted/20 border border-border/40 rounded-xl">
                  <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Behavioral Psychology Insights
                  </p>
                  <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                    {optimizeResult.key_recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Optimized Steps Preview */}
                <div className="space-y-3">
                  <p className="font-bold text-foreground text-[11px]">Optimized Steps Preview ({optimizeResult.optimized_steps.length} steps):</p>
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {optimizeResult.optimized_steps.map((st) => (
                      <div key={st.step_number} className="p-3 bg-card border border-border/50 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-indigo-300">Step {st.step_number} (Day {st.day}) · {st.type}</span>
                          <span className="text-[10px] text-muted-foreground italic">{st.rationale}</span>
                        </div>
                        <div className="font-semibold text-foreground bg-muted/30 px-2 py-1 rounded text-[11px]">
                          {st.subject}
                        </div>
                        <div className="text-muted-foreground text-[11px] whitespace-pre-wrap line-clamp-3 bg-muted/10 p-2 rounded">
                          {st.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOptimizeModalOpen(false)}>
                    Keep Current
                  </Button>
                  <Button type="button" size="sm" onClick={handleApplyOptimizedSteps} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5">
                    <Check className="h-3.5 w-3.5" /> Apply AI Optimized Steps
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── AI Smart Timing Modal ─── */}
        <Dialog open={timingModalOpen} onOpenChange={setTimingModalOpen}>
          <DialogContent className="max-w-lg bg-card border-border/60">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" /> AI Optimal Send Timing (Chronotype Intelligence)
              </DialogTitle>
            </DialogHeader>

            {timingResult && (
              <div className="space-y-4 text-xs pt-2">
                <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1">
                  <p className="font-bold text-foreground text-[11px]">Persona Engagement Habit Insights:</p>
                  <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                    {timingResult.persona_behavioral_insights.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-foreground text-[11px]">Recommended Peak Email Windows:</p>
                  {timingResult.top_send_windows.map((win, i) => (
                    <div key={i} className="p-3 bg-card border border-border/50 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-indigo-300">{win.day_of_week} · {win.time_range} ({win.timezone})</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{win.rationale}</div>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleApplyTimingSchedule(win)}
                        className="h-7 text-[10px] gap-1 shrink-0 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20">
                        Use Window
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// ─── Campaign List Card ────────────────────────────────────────────────────────
function CampaignCard({ campaign, onStatusChange }: { campaign: Campaign; onStatusChange: (id: string | number, status: CampaignStatus) => Promise<void> }) {
  const sm = STATUS_META[campaign.status] || STATUS_META.Draft;
  const totalSteps = campaign.sequence?.length || 0;
  const enabledSteps = campaign.sequence?.filter(s => s?.enabled).length || 0;
  const duration = (campaign.sequence && campaign.sequence.length > 0) ? Math.max(...campaign.sequence.map(s => s?.day || 0)) : 0;

  return (
    <Card className="bg-card backdrop-blur-md p-5 space-y-4 hover:border-indigo-500/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm">{campaign.name}</h3>
            <Badge className={`${sm.bg} ${sm.color} ${sm.border} text-[10px] gap-1`}>{sm.icon} {campaign.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</p>
          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground font-mono mt-1">
            <span>Started: {campaign.start_date || '—'}</span>
            {campaign.end_date && <span>Ended: {campaign.end_date}</span>}
            <span>By: {campaign.created_by || 'System'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {campaign.status === "Active" && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange(campaign.id, "Paused")}
              className="text-xs h-8 gap-1.5 border-border/60 text-amber-400 hover:text-amber-300">
              <Pause className="h-3 w-3" /> Pause
            </Button>
          )}
          {campaign.status === "Paused" && (
            <Button size="sm" onClick={() => onStatusChange(campaign.id, "Active")}
              className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
              <Play className="h-3 w-3" /> Resume
            </Button>
          )}
          {campaign.status === "Draft" && (
            <Button size="sm" onClick={() => onStatusChange(campaign.id, "Active")}
              className="text-xs h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white">
              <Rocket className="h-3 w-3" /> Launch
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: "Contacts", value: campaign.total_contacts || 0, color: "text-foreground" },
          { label: "Sent", value: campaign.emails_sent || 0, color: "text-foreground" },
          { label: "Open %", value: `${campaign.open_rate ?? 0}%`, color: (campaign.open_rate ?? 0) >= 30 ? "text-emerald-400" : "text-amber-400" },
          { label: "Reply %", value: `${campaign.reply_rate ?? 0}%`, color: (campaign.reply_rate ?? 0) >= 10 ? "text-emerald-400" : "text-amber-400" },
          { label: "Meetings", value: campaign.meetings_booked || 0, color: "text-purple-400" },
          { label: "Unsubs", value: campaign.unsubscribes || 0, color: (campaign.unsubscribes ?? 0) > 5 ? "text-red-400" : "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30 border border-border/30">
            <div className={`font-extrabold font-mono text-sm ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-muted-foreground uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Audience chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="text-muted-foreground font-semibold">Audience:</span>
        {campaign.audience?.industries?.map(i => (
          <Badge key={i} className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] font-mono">{i}</Badge>
        ))}
        {campaign.audience?.companies?.map(c => (
          <Badge key={c} variant="outline" className="text-[9px] font-mono">{c}</Badge>
        ))}
      </div>

      {/* Sequence Step Timeline */}
      {campaign.sequence && campaign.sequence.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-muted-foreground font-semibold">{enabledSteps} Step Sequence · ~{duration} days</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {campaign.sequence.map((s, i) => {
              const sc = STEP_COLORS[s.type] || STEP_COLORS.Custom;
              const seqLen = campaign.sequence?.length || 0;
              return (
                <React.Fragment key={s.id}>
                  <div className={`flex flex-col items-center gap-0.5 shrink-0 px-2 py-1 rounded-lg border text-[9px] ${sc} ${!s.enabled ? "opacity-40" : ""}`}>
                    <span className="font-bold font-mono">D{s.day}</span>
                    <span>{s.type}</span>
                  </div>
                  {i < seqLen - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Rules summary */}
      {campaign.rules && (
        <div className="flex flex-wrap gap-2 text-[10px] pt-1 border-t border-border/20">
          {campaign.rules.stop_on_reply && (
            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Stop on reply</span>
          )}
          {campaign.rules.stop_on_meeting_booked && (
            <span className="flex items-center gap-1 text-purple-400"><CheckCircle2 className="h-3 w-3" /> Stop on meeting</span>
          )}
          {campaign.rules.update_lead_status && (
            <span className="flex items-center gap-1 text-indigo-400"><CheckCircle2 className="h-3 w-3" /> Auto-update status</span>
          )}
          {campaign.rules.create_follow_up_task && (
            <span className="flex items-center gap-1 text-amber-400"><CheckCircle2 className="h-3 w-3" /> Create task on reply</span>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const { user } = useAuth();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<CampaignStatus | "all">("all");
  const [builderOpen, setBuilderOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const data = await getCampaignsActionByToken(token, { search, status: statusFilter });
      setCampaigns(data || []);
    } catch (e) {
      console.error("Failed to load campaigns:", e);
    } finally {
      setLoading(false);
    }
  }, [user, search, statusFilter]);

  React.useEffect(() => { load(); }, [load]);

  const handleSave = async (input: Partial<Campaign>) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await createCampaignActionByToken(token, input);
      load();
    } catch (e) {
      console.error("Failed to create campaign:", e);
    }
  };

  const handleStatusChange = async (id: string | number, status: CampaignStatus) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await updateCampaignStatusActionByToken(token, id, status);
      load();
    } catch (e) {
      console.error("Failed to update campaign status:", e);
    }
  };

  const totalContacts = campaigns.reduce((s, c) => s + (c.total_contacts || 0), 0);
  const totalMeetings = campaigns.reduce((s, c) => s + (c.meetings_booked || 0), 0);
  const avgOpenRate = campaigns.length ? Math.round(campaigns.reduce((s, c) => s + (c.open_rate || 0), 0) / campaigns.length) : 0;
  const avgReplyRate = campaigns.length ? Math.round(campaigns.reduce((s, c) => s + (c.reply_rate || 0), 0) / campaigns.length) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Email Campaigns"
          subtitle="Build multi-step sequences with audience targeting, day-based scheduling, and automation rules"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />
        <main className="flex-1 p-6 space-y-5 w-full mx-auto overflow-y-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Campaigns", value: campaigns.length, color: "text-foreground" },
              { label: "Contacts Enrolled", value: totalContacts, color: "text-indigo-300" },
              { label: "Avg Open Rate", value: `${avgOpenRate}%`, color: "text-emerald-400" },
              { label: "Meetings Booked", value: totalMeetings, color: "text-purple-400" },
            ].map(s => (
              <Card key={s.label} className="bg-card p-4 text-center">
                <div className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl backdrop-blur-xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 border-border/60 text-xs h-9" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              {(["all", "Active", "Draft", "Paused", "Completed"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s as CampaignStatus | "all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusFilter === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"}`}>
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setBuilderOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold h-9 shrink-0">
              <Plus className="h-3.5 w-3.5" /> New Campaign
            </Button>
          </div>

          {/* Campaign List */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-card/40 border border-border/40 rounded-xl animate-pulse" />)
            ) : campaigns.length > 0 ? (
              campaigns.map(c => <CampaignCard key={c.id} campaign={c} onStatusChange={handleStatusChange} />)
            ) : (
              <div className="p-16 text-center border border-dashed border-border/40 rounded-xl space-y-3">
                <Rocket className="h-8 w-8 mx-auto text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No campaigns yet. Build your first sequence.</p>
                <Button size="sm" onClick={() => setBuilderOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create First Campaign
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <CampaignBuilderModal open={builderOpen} onClose={() => setBuilderOpen(false)} onSave={handleSave} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
