"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb } from "lucide-react";
import type { OptimizeSequenceOutput } from "@/ai/schemas/sequence-optimizer";

interface SequenceCopilotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: OptimizeSequenceOutput | null;
}

export function SequenceCopilotModal({
  open,
  onOpenChange,
  result,
}: SequenceCopilotModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" /> AI Sequence Copilot
            </span>
            {result && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                Grade {result.overall_grade} · {result.overall_score}/100
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {result && (
          <div className="space-y-4 text-xs pt-2">
            {/* Metrics Lift Forecast */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                <div className="text-lg font-black text-indigo-400 font-mono">+{result.predicted_open_rate_boost_pct}%</div>
                <div className="text-[10px] text-muted-foreground">Predicted Open Rate Lift</div>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <div className="text-lg font-black text-emerald-400 font-mono">+{result.predicted_reply_rate_boost_pct}%</div>
                <div className="text-[10px] text-muted-foreground">Predicted Reply Rate Lift</div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5 p-3 bg-muted/20 border border-border/40 rounded-xl">
              <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Behavioral Psychology Insights
              </p>
              <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                {result.key_recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Optimized Steps Preview */}
            <div className="space-y-3">
              <p className="font-bold text-foreground text-[11px]">Optimized Steps Preview ({result.optimized_steps.length} steps):</p>
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {result.optimized_steps.map((st) => (
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
              <Button type="button" size="sm" onClick={() => onOpenChange(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
