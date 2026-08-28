"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import {
  Rocket,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  StopCircle,
  CalendarDays,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Check,
  Users,
  Target,
  ListChecks,
  Settings2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  optimizeCampaignSequenceAction,
  predictOptimalTimingAction,
  generateCampaignStrategyAction,
} from "@/services/private/aiMessageServices";
import type { OptimizeSequenceOutput } from "@/ai/schemas/sequence-optimizer";
import type { PredictOptimalTimingOutput } from "@/ai/schemas/optimal-timing";
import * as industryServices from "@/services/public/industryServices";
import * as organizationServices from "@/services/public/organizationServices";
import * as peopleServices from "@/services/public/peopleServices";
import type {
  Campaign,
  SequenceStep,
  SequenceStepType,
  CampaignRules,
  CampaignAudience,
  CampaignSchedule,
} from "@/lib/types";
import { STEP_TYPES, STEP_COLORS } from "./campaign-card";

const WIZARD_STEPS = [
  { id: 1, label: "Audience", icon: <Users className="h-3.5 w-3.5" /> },
  { id: 2, label: "Sequence", icon: <ListChecks className="h-3.5 w-3.5" /> },
  { id: 3, label: "Rules", icon: <Settings2 className="h-3.5 w-3.5" /> },
  { id: 4, label: "Schedule", icon: <CalendarDays className="h-3.5 w-3.5" /> },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full border transition-all flex items-center px-0.5 shrink-0 ${checked ? "bg-indigo-600 border-indigo-600" : "bg-muted/40 border-border/60"
        }`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </button>
  );
}

export interface CampaignBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (c: Partial<Campaign>) => void;
}

export function CampaignBuilderModal({ open, onClose, onSave }: CampaignBuilderModalProps) {
  const { user } = useAuth();
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [audience, setAudience] = React.useState<CampaignAudience>({
    industries: [],
    companies: [],
    people: [],
    estimated_contacts: 0,
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
    return () => {
      isMounted = false;
    };
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
              allPpl.map(
                (p) =>
                  `${p.name} (${p.title || p.job_title || "Executive"}, ${p.company_name || ""})`
              )
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
              allPpl.map(
                (p) =>
                  `${p.name} (${p.title || p.job_title || "Executive"}, ${p.company_name || ""})`
              )
            )
          ).filter(Boolean);
        } else {
          const res = await peopleServices.getDecisionMakers({ limit: 60 });
          peopleList = (res?.people || []).map(
            (p) =>
              `${p.name} (${p.title || p.job_title || "Executive"}, ${p.company_name || ""})`
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
    return () => {
      isMounted = false;
    };
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

  const { defaultSequence, defaultRules, defaultSchedule } = useSettings();
  const [sequence, setSequence] = React.useState<SequenceStep[]>(defaultSequence || []);
  const [rules, setRules] = React.useState<CampaignRules>(
    defaultRules || {
      stop_on_reply: true,
      stop_on_meeting_booked: true,
      update_lead_status: true,
      create_follow_up_task: true,
      exclude_customers: true,
      exclude_competitors: true,
      track_opens: true,
    }
  );
  const [schedule, setSchedule] = React.useState<CampaignSchedule>(
    defaultSchedule || {
      send_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      send_time_from: "09:00",
      send_time_to: "17:00",
      timezone: "SAST (UTC+2 - Johannesburg / South Africa)",
    }
  );

  React.useEffect(() => {
    if (open) {
      if (defaultSequence && defaultSequence.length > 0) setSequence(defaultSequence);
      if (defaultRules) setRules(defaultRules);
      if (defaultSchedule) setSchedule(defaultSchedule);
    }
  }, [open, defaultSequence, defaultRules, defaultSchedule]);

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
          setAudience((a) => ({
            ...a,
            industries: Array.from(
              new Set([...a.industries, ...res.recommended_audience_filters.suggested_industries])
            ),
          }));
        }
        if (res.sequence_steps?.length) {
          setSequence(
            res.sequence_steps.map((st, idx) => ({
              id: `step-${idx + 1}`,
              step_number: st.step_number,
              day: st.day,
              type: (st.type as SequenceStepType) || "Follow-up",
              subject: st.subject,
              body: st.body,
              enabled: true,
            }))
          );
        }
        if (res.recommended_rules) {
          setRules((r) => ({ ...r, ...res.recommended_rules }));
        }
        if (res.recommended_schedule) {
          setSchedule((s) => ({
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
    setSequence(
      optimizeResult.optimized_steps.map((st, idx) => ({
        id: `step-${idx + 1}`,
        step_number: st.step_number,
        day: st.day,
        type: (st.type as SequenceStepType) || "Follow-up",
        subject: st.subject,
        body: st.body,
        enabled: true,
      }))
    );
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
      setSchedule((s) => ({
        ...s,
        send_time_from: from.trim(),
        send_time_to: to.trim(),
      }));
    }
    setTimingModalOpen(false);
  };

  const updateStep = (id: string | number, field: keyof SequenceStep, val: any) =>
    setSequence((s) => s.map((st) => (st.id === id ? { ...st, [field]: val } : st)));

  const addStep = () => {
    const lastDay = sequence.length > 0 ? sequence[sequence.length - 1].day : 0;
    const nextStepNum = sequence.length + 1;
    setSequence((s) => [
      ...s,
      {
        id: nextStepNum,
        step_number: nextStepNum,
        day: lastDay + 2,
        type: "Follow-up",
        subject: "New Step — {{fname}}",
        body: "",
        enabled: true,
      },
    ]);
  };

  const removeStep = (id: string | number) => setSequence((s) => s.filter((st) => st.id !== id));

  const toggleSendDay = (d: CampaignSchedule["send_days"][number]) => {
    setSchedule((s) => ({
      ...s,
      send_days: s.send_days.includes(d) ? s.send_days.filter((x) => x !== d) : [...s.send_days, d],
    }));
  };

  const [isSavingCampaign, setIsSavingCampaign] = React.useState(false);

  const handleLaunch = async (asDraft = false) => {
    setIsSavingCampaign(true);
    try {
      await onSave({
        name,
        description,
        audience,
        sequence,
        rules,
        schedule,
        status: asDraft ? "Draft" : "Active",
        created_by: user?.displayName || user?.email?.split("@")[0] || "User",
      });
      onClose();
      setStep(1);
    } catch (e) {
      console.error("Failed to save campaign:", e);
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const canNext =
    step === 1
      ? name.length > 0 &&
      (audience.industries.length > 0 || audience.companies.length > 0 || audience.people.length > 0)
      : step === 2
        ? sequence.filter((s) => s.enabled).length > 0
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${step === ws.id
                    ? "bg-indigo-600 text-white"
                    : step > ws.id
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-muted/30 text-muted-foreground border border-border/40"
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
              <div className="p-3.5 bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-indigo-500/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> AI Strategy Generator
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Auto-generates title, audience & 4-step sequence
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Book 15-min discovery calls with FinTech CTOs on compliance automation..."
                    value={strategyPrompt}
                    onChange={(e) => setStrategyPrompt(e.target.value)}
                    className="bg-card/80 border-border/60 text-xs h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateCampaignStrategy}
                    disabled={generatingStrategy || !strategyPrompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-3 shrink-0 font-semibold gap-1.5"
                  >
                    {generatingStrategy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {generatingStrategy ? "Building Strategy..." : "Generate Strategy"}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Campaign Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="e.g. Q3 Enterprise CTO Outreach"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted/40 border-border/60 h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Brief campaign goal or context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted/40 border-border/60 h-9 text-xs"
                />
              </div>

              {/* 1. Select Industries */}
              <SearchableMultiSelect
                label="Select Industries"
                icon={<Target className="h-3.5 w-3.5 text-indigo-400" />}
                placeholder="Search & filter industries..."
                options={availableIndustries}
                selected={audience.industries}
                onChange={(v) => setAudience((a) => ({ ...a, industries: v }))}
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
                onChange={(v) => setAudience((a) => ({ ...a, companies: v }))}
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
                onChange={(v) => setAudience((a) => ({ ...a, people: v }))}
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
                    Estimated reach:{" "}
                    <span className="text-indigo-200 font-bold font-mono text-sm">
                      ~{audience.estimated_contacts}
                    </span>{" "}
                    contacts
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: SEQUENCE ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Define the emails and timing. Sequence auto-stops on reply or meeting.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRunAIOptimize}
                    disabled={optimizing}
                    className="h-7 text-[11px] gap-1.5 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                  >
                    {optimizing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-indigo-400" />
                    )}
                    {optimizing ? "Optimizing..." : "AI Optimize"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addStep}
                    className="h-7 text-[11px] gap-1 border-border/60 shrink-0"
                  >
                    <Plus className="h-3 w-3" /> Add Step
                  </Button>
                </div>
              </div>

              {/* Sequence Timeline */}
              <div className="space-y-3 relative">
                <div className="absolute left-[19px] top-8 bottom-8 w-px bg-border/40" />
                {sequence.map((step_item, sIdx) => {
                  const stepKey = step_item.id ?? sIdx + 1;
                  const sc = STEP_COLORS[step_item.type] || STEP_COLORS.Email;
                  return (
                    <div key={stepKey} className="relative flex items-start gap-3">
                      {/* Day Node */}
                      <div
                        className={`h-10 w-10 rounded-full border flex flex-col items-center justify-center text-[9px] font-bold font-mono shrink-0 z-10 ${sc}`}
                      >
                        <span>D</span>
                        <span>{step_item.day}</span>
                      </div>

                      {/* Card */}
                      <div
                        className={`flex-1 rounded-xl border ${step_item.enabled
                          ? "border-border/50 bg-card"
                          : "border-border/20 bg-muted/10 opacity-50"
                          }`}
                        p-3
                        space-y-2
                      >
                        {/* Top row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={step_item.type}
                            onChange={(e) =>
                              updateStep(stepKey, "type", e.target.value as SequenceStepType)
                            }
                            className="bg-muted/40 border border-border/60 rounded-md px-2 py-1 text-[11px] outline-none text-foreground"
                          >
                            {STEP_TYPES.map((t: SequenceStepType) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span>Day</span>
                            <input
                              type="number"
                              min={0}
                              max={90}
                              value={step_item.day}
                              onChange={(e) => updateStep(stepKey, "day", Number(e.target.value))}
                              className="w-12 bg-muted/40 border border-border/60 rounded-md px-2 py-1 text-center text-[11px] outline-none text-foreground font-mono"
                            />
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <Toggle
                              checked={step_item.enabled}
                              onChange={(v) => updateStep(stepKey, "enabled", v)}
                            />
                            {sequence.length > 1 && (
                              <button
                                onClick={() => removeStep(stepKey)}
                                className="text-muted-foreground hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Subject */}
                        <Input
                          value={step_item.subject}
                          onChange={(e) => updateStep(stepKey, "subject", e.target.value)}
                          placeholder="Email subject (use {{fname}}, {{company}})"
                          className="bg-muted/30 border-border/40 h-8 text-[11px] font-semibold"
                        />

                        {/* Body */}
                        <Textarea
                          value={step_item.body}
                          onChange={(e) => updateStep(stepKey, "body", e.target.value)}
                          placeholder="Email body..."
                          className="bg-muted/30 border-border/40 text-[11px] min-h-[80px] resize-none leading-relaxed"
                        />

                        <div className="text-[10px] text-muted-foreground/60 font-mono">
                          Variables: {"{{fname}}"} {"{{company}}"} {"{{industry}}"}{" "}
                          {"{{sender_name}}"} {"{{sender_title}}"}
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
              <p className="text-xs text-muted-foreground">
                Configure automation rules that control what happens when a contact responds.
              </p>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">
                  Stop Conditions
                </p>
                <div className="bg-card/40 border border-border/40 rounded-xl px-4 divide-y divide-border/30">
                  {[
                    {
                      key: "stop_on_reply" as const,
                      label: "Stop sequence on reply",
                      desc: "Immediately halt emails when contact replies to any step",
                      icon: <StopCircle className="h-3.5 w-3.5 text-emerald-400" />,
                    },
                    {
                      key: "stop_on_meeting_booked" as const,
                      label: "Stop when meeting is booked",
                      desc: "Halt emails when a calendar meeting is scheduled",
                      icon: <CalendarDays className="h-3.5 w-3.5 text-purple-400" />,
                    },
                  ].map((r) => (
                    <div key={r.key} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {r.icon}
                        <div>
                          <p className="font-semibold text-foreground">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
                        </div>
                      </div>
                      <Toggle
                        checked={rules[r.key]}
                        onChange={(v) => setRules((r_) => ({ ...r_, [r.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">
                  Automation Actions
                </p>
                <div className="bg-card/40 border border-border/40 rounded-xl px-4 divide-y divide-border/30">
                  {[
                    {
                      key: "update_lead_status" as const,
                      label: "Update lead status automatically",
                      desc: "Move lead from Cold → Warm → Hot based on engagement signals",
                      icon: <ArrowRight className="h-3.5 w-3.5 text-amber-400" />,
                    },
                    {
                      key: "create_follow_up_task" as const,
                      label: "Create follow-up task on reply",
                      desc: "Auto-generate a task for the assigned rep when a reply comes in",
                      icon: <ListChecks className="h-3.5 w-3.5 text-indigo-400" />,
                    },
                    {
                      key: "exclude_customers" as const,
                      label: "Exclude existing customers",
                      desc: "Do not enroll contacts already tagged as Customer",
                      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
                    },
                    {
                      key: "exclude_competitors" as const,
                      label: "Exclude known competitors",
                      desc: "Skip contacts at companies flagged as competitor accounts",
                      icon: <XCircle className="h-3.5 w-3.5 text-red-400" />,
                    },
                  ].map((r) => (
                    <div key={r.key} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {r.icon}
                        <div>
                          <p className="font-semibold text-foreground">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
                        </div>
                      </div>
                      <Toggle
                        checked={rules[r.key]}
                        onChange={(v) => setRules((r_) => ({ ...r_, [r.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: SCHEDULE + REVIEW ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">
                Configure when emails are sent and review your campaign before launching.
              </p>

              {/* Sending Window */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Send on days</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handlePredictTiming}
                    disabled={timingLoading}
                    className="h-6 text-[10px] gap-1.5 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                  >
                    {timingLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-indigo-400" />
                    )}
                    {timingLoading ? "Analyzing..." : "AI Best Send Times"}
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((d) => {
                    const active = schedule.send_days.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleSendDay(d)}
                        className={`w-11 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${active
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"
                          }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Send window starts</Label>
                  <Input
                    type="time"
                    value={schedule.send_time_from}
                    onChange={(e) =>
                      setSchedule((s) => ({ ...s, send_time_from: e.target.value }))
                    }
                    className="bg-muted/40 border-border/60 h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Send window ends</Label>
                  <Input
                    type="time"
                    value={schedule.send_time_to}
                    onChange={(e) =>
                      setSchedule((s) => ({ ...s, send_time_to: e.target.value }))
                    }
                    className="bg-muted/40 border-border/60 h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={schedule.start_date}
                    onChange={(e) => setSchedule((s) => ({ ...s, start_date: e.target.value }))}
                    className="bg-muted/40 border-border/60 h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Timezone</Label>
                  <select
                    value={schedule.timezone}
                    onChange={(e) => setSchedule((s) => ({ ...s, timezone: e.target.value }))}
                    className="w-full bg-muted/40 border border-border/60 rounded-md px-3 py-2 text-xs outline-none text-foreground h-9"
                  >
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
                <p className="text-[10px] uppercase font-bold text-muted-foreground">
                  Campaign Summary
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    <span className="font-bold">{name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contacts: </span>
                    <span className="font-bold text-indigo-300">
                      ~{audience.estimated_contacts}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Industries: </span>
                    <span className="font-bold">{audience.industries.length || "None"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Companies: </span>
                    <span className="font-bold">{audience.companies.length || "None"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sequence steps: </span>
                    <span className="font-bold">
                      {sequence.filter((s) => s.enabled).length} enabled
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration: </span>
                    <span className="font-bold">
                      ~{Math.max(...sequence.map((s) => s.day))} days
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stop on reply: </span>
                    <span
                      className={
                        rules.stop_on_reply ? "text-emerald-400 font-bold" : "text-muted-foreground"
                      }
                    >
                      {rules.stop_on_reply ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Auto-update leads: </span>
                    <span
                      className={
                        rules.update_lead_status
                          ? "text-emerald-400 font-bold"
                          : "text-muted-foreground"
                      }
                    >
                      {rules.update_lead_status ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Send window: </span>
                    <span className="font-bold font-mono">
                      {schedule.send_time_from} – {schedule.send_time_to}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days: </span>
                    <span className="font-bold">{schedule.send_days.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Nav */}
        <div className="p-6 pt-0 border-t border-border/30 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
            className="text-xs gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <div className="flex items-center gap-2">
            {step === 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSavingCampaign}
                onClick={() => handleLaunch(true)}
                className="text-xs gap-1.5 border-border/60 h-9"
              >
                {isSavingCampaign ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : "Save as Draft"}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={!canNext || isSavingCampaign}
              onClick={() => (step < 4 ? setStep((s) => s + 1) : handleLaunch())}
              className={`text-xs gap-1.5 font-semibold h-9 ${step === 4
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-indigo-600 hover:bg-indigo-500"
                } text-white disabled:opacity-50`}
            >
              {step === 4 ? (
                isSavingCampaign ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Launching...</>
                ) : (
                  <>
                    <Rocket className="h-3.5 w-3.5" /> Launch Campaign
                  </>
                )
              ) : (
                <>
                  Next: {WIZARD_STEPS[step]?.label} <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ─── AI Sequence Optimizer Modal ─── */}
        <Dialog open={optimizeModalOpen} onOpenChange={setOptimizeModalOpen}>
          <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" /> AI Sequence Copilot (Science-Based Optimization)
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
                    <div className="text-lg font-black text-indigo-400 font-mono">
                      +{optimizeResult.predicted_open_rate_boost_pct}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">Predicted Open Rate Lift</div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      +{optimizeResult.predicted_reply_rate_boost_pct}%
                    </div>
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
                  <p className="font-bold text-foreground text-[11px]">
                    Optimized Steps Preview ({optimizeResult.optimized_steps.length} steps):
                  </p>
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {optimizeResult.optimized_steps.map((st) => (
                      <div
                        key={st.step_number}
                        className="p-3 bg-card border border-border/50 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-indigo-300">
                            Step {st.step_number} (Day {st.day}) · {st.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground italic">
                            {st.rationale}
                          </span>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOptimizeModalOpen(false)}
                  >
                    Keep Current
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyOptimizedSteps}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
                  >
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
                  <p className="font-bold text-foreground text-[11px]">
                    Persona Engagement Habit Insights:
                  </p>
                  <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                    {timingResult.persona_behavioral_insights.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-foreground text-[11px]">
                    Recommended Peak Email Windows:
                  </p>
                  {timingResult.top_send_windows.map((win, i) => (
                    <div
                      key={i}
                      className="p-3 bg-card border border-border/50 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-indigo-300">
                          {win.day_of_week} · {win.time_range} ({win.timezone})
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {win.rationale}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleApplyTimingSchedule(win)}
                        className="h-7 text-[10px] gap-1 shrink-0 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20"
                      >
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
