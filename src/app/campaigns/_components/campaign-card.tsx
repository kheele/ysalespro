"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Rocket,
  ChevronRight,
  CheckCircle2,
  FileEdit,
  XCircle,
} from "lucide-react";
import type {
  Campaign,
  CampaignStatus,
  SequenceStepType,
} from "@/lib/types";

export const STEP_TYPES: SequenceStepType[] = ["Email", "Follow-up", "Case Study", "Final Message"];

export const STEP_COLORS: Record<SequenceStepType, string> = {
  Email: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  "Follow-up": "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "Case Study": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Final Message": "text-red-400 bg-red-500/10 border-red-500/30",
};

export const STATUS_META: Record<CampaignStatus, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Draft: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", icon: <FileEdit className="h-3 w-3" /> },
  Active: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: <Play className="h-3 w-3" /> },
  Paused: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: <Pause className="h-3 w-3" /> },
  Completed: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  Cancelled: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
};

export interface CampaignCardProps {
  campaign: Campaign;
  onStatusChange: (id: string | number, status: CampaignStatus) => Promise<void>;
}

export function CampaignCard({ campaign, onStatusChange }: CampaignCardProps) {
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
              const sc = STEP_COLORS[s.type] || STEP_COLORS.Email;
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
