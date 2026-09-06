"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  CalendarDays,
  Clock,
  Sparkles,
  Loader2,
  Bookmark,
  ChevronRight,
  Check,
} from "lucide-react";
import type { CampaignSchedule, SequenceStep } from "@/lib/types";
import { predictOptimalTimingAction } from "@/services/private/aiMessageServices";
import type { PredictOptimalTimingOutput } from "@/ai/schemas/optimal-timing";

export interface SaveCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTitle: string;
  companyName: string;
  sequenceSteps: SequenceStep[];
  saving: boolean;
  initialStatus?: "Active" | "Draft";
  onConfirmSave: (data: {
    title: string;
    schedule: CampaignSchedule;
    status: "Active" | "Draft";
  }) => Promise<void> | void;
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function SaveCampaignModal({
  open,
  onOpenChange,
  defaultTitle,
  companyName,
  sequenceSteps,
  saving,
  initialStatus = "Active",
  onConfirmSave,
}: SaveCampaignModalProps) {
  const [title, setTitle] = React.useState(defaultTitle);
  const [schedule, setSchedule] = React.useState<CampaignSchedule>({
    send_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    send_time_from: "09:00",
    send_time_to: "17:00",
    timezone: "SAST (UTC+2 - Johannesburg / South Africa)",
    start_date: new Date().toISOString().split("T")[0],
  });

  // AI Smart Timing Predictor State
  const [timingLoading, setTimingLoading] = React.useState(false);
  const [timingResult, setTimingResult] = React.useState<PredictOptimalTimingOutput | null>(null);
  const [timingModalOpen, setTimingModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setSchedule((prev) => ({
        ...prev,
        start_date: new Date().toISOString().split("T")[0],
      }));
    }
  }, [open, defaultTitle]);

  const toggleSendDay = (d: (typeof ALL_DAYS)[number]) => {
    setSchedule((s) => ({
      ...s,
      send_days: s.send_days.includes(d)
        ? s.send_days.filter((x) => x !== d)
        : [...s.send_days, d],
    }));
  };

  const handlePredictTiming = async () => {
    setTimingLoading(true);
    try {
      const res = await predictOptimalTimingAction({
        industry: companyName || "Enterprise",
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl bg-card border-border/60 max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="p-6 pb-3 border-b border-border/40">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Rocket className="h-5 w-5 text-indigo-400" /> Save Outreach Campaign
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Configure campaign schedule and sending window for {companyName || "your audience"}.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
            {/* Campaign Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Campaign Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acme Corp - Enterprise Outreach Campaign"
                className="bg-muted/40 border-border/60 h-9 text-xs"
              />
            </div>

            {/* Sequence Steps Timeline Preview (Day 1, Day 3, Day 7, Day 14) */}
            <div className="space-y-2 p-3.5 bg-muted/20 border border-border/40 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-[11px]">
                  Sequence Schedule ({sequenceSteps.length} Steps)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Starts on Day 1
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {sequenceSteps.map((st, i) => (
                  <React.Fragment key={st.id || i}>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border/50 text-[10px] shrink-0 font-mono">
                      <span className="font-bold text-indigo-400">Day {st.day}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-foreground">{st.type}</span>
                    </div>
                    {i < sequenceSteps.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* 1. Send on days */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-indigo-400" /> Send on days
                </Label>
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
                {ALL_DAYS.map((d) => {
                  const active = schedule.send_days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleSendDay(d)}
                      className={`w-11 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                        active
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

            {/* 2. Start Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Start Date</Label>
              <Input
                type="date"
                value={schedule.start_date || ""}
                onChange={(e) =>
                  setSchedule((s) => ({ ...s, start_date: e.target.value }))
                }
                className="bg-muted/40 border-border/60 h-9 text-xs font-mono"
              />
            </div>

            {/* 3. Send window starts & ends */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" /> Send window starts
                </Label>
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
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" /> Send window ends
                </Label>
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

            {/* 4. Timezone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Timezone</Label>
              <select
                value={schedule.timezone}
                onChange={(e) =>
                  setSchedule((s) => ({ ...s, timezone: e.target.value }))
                }
                className="w-full bg-muted/40 border border-border/60 rounded-md px-3 py-2 text-xs outline-none text-foreground h-9 font-sans"
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

          <DialogFooter className="p-4 border-t border-border/30 bg-muted/10 flex items-center justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving || !title.trim() || schedule.send_days.length === 0}
                onClick={() =>
                  onConfirmSave({
                    title,
                    schedule,
                    status: "Draft",
                  })
                }
                className="text-xs gap-1.5 h-9 border-border/70 bg-card hover:bg-muted"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                Save as Draft
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving || !title.trim() || schedule.send_days.length === 0}
                onClick={() =>
                  onConfirmSave({
                    title,
                    schedule,
                    status: "Active",
                  })
                }
                className="text-xs gap-1.5 h-9 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Rocket className="h-3.5 w-3.5" />
                )}
                Save & Launch Campaign
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Smart Timing Modal */}
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
    </>
  );
}
