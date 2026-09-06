"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Rocket,
  Calendar,
  Clock,
  Users,
  Target,
  Mail,
  CheckCircle2,
  StopCircle,
  Copy,
  Edit,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { Campaign, SequenceStep, CampaignSchedule } from "@/lib/types";
import { STATUS_META, STEP_COLORS } from "@/app/campaigns/_components/campaign-card";

export interface CampaignDetailsModalProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (campaign: Campaign) => void;
  onCopy?: (campaign: Campaign) => void;
}

export function CampaignDetailsModal({
  campaign,
  open,
  onClose,
  onEdit,
  onCopy,
}: CampaignDetailsModalProps) {
  if (!campaign) return null;

  const sm = STATUS_META[campaign.status] || STATUS_META.Draft;
  const sequence = campaign.sequence || [];
  const enabledSteps = sequence.filter((s) => s?.enabled !== false);
  const duration = sequence.length > 0 ? Math.max(...sequence.map((s) => s?.day || 0)) : 0;

  const sched: CampaignSchedule | null = React.useMemo(() => {
    if (!campaign.schedule) return null;
    if (typeof campaign.schedule === "object") return campaign.schedule;
    try {
      return JSON.parse(campaign.schedule);
    } catch {
      return null;
    }
  }, [campaign.schedule]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-card border-border/60 max-h-[90vh] flex flex-col overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <DialogTitle className="text-base font-bold text-foreground">
                  {campaign.name}
                </DialogTitle>
                <Badge className={`${sm.bg} ${sm.color} ${sm.border} text-[10px] gap-1`}>
                  {sm.icon} {campaign.status}
                </Badge>
              </div>
              {campaign.description && (
                <p className="text-xs text-muted-foreground">{campaign.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onCopy && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onCopy(campaign);
                  }}
                  className="h-8 text-xs gap-1.5 border-border/60 hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEdit(campaign);
                  }}
                  className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit Campaign
                </Button>
              )}
            </div>
          </div>

          {/* Quick Meta Row */}
          <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-muted-foreground font-mono">
            <span>Started: {campaign.start_date || "—"}</span>
            {campaign.end_date && <span>Ended: {campaign.end_date}</span>}
            <span>Created by: {campaign.created_by || "System"}</span>
            {campaign.target_organization_id && (
              <span className="text-indigo-400">Org ID: #{campaign.target_organization_id}</span>
            )}
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {[
              { label: "Contacts", value: campaign.total_contacts || 0, color: "text-foreground" },
              { label: "Emails Sent", value: campaign.emails_sent || 0, color: "text-foreground" },
              {
                label: "Open Rate",
                value: `${campaign.open_rate ?? 0}%`,
                color: (campaign.open_rate ?? 0) >= 30 ? "text-emerald-400" : "text-amber-400",
              },
              {
                label: "Reply Rate",
                value: `${campaign.reply_rate ?? 0}%`,
                color: (campaign.reply_rate ?? 0) >= 10 ? "text-emerald-400" : "text-amber-400",
              },
              { label: "Meetings", value: campaign.meetings_booked || 0, color: "text-purple-400" },
              {
                label: "Unsubscribes",
                value: campaign.unsubscribes || 0,
                color: (campaign.unsubscribes ?? 0) > 5 ? "text-red-400" : "text-muted-foreground",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="p-3 rounded-xl bg-muted/20 border border-border/40 text-center space-y-0.5"
              >
                <div className={`text-base font-black font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          <Tabs defaultValue="sequence" className="space-y-4">
            <TabsList className="bg-muted/30 border border-border/40">
              <TabsTrigger value="sequence" className="text-xs gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Sequence Steps ({sequence.length})
              </TabsTrigger>
              <TabsTrigger value="audience" className="text-xs gap-1.5">
                <Users className="h-3.5 w-3.5" /> Audience & Targeting
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Schedule & Rules
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: SEQUENCE STEPS */}
            <TabsContent value="sequence" className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <span>
                  {enabledSteps.length} active touchpoints over ~{duration} days
                </span>
              </div>

              {sequence.length > 0 ? (
                <div className="space-y-3">
                  {sequence.map((step, idx) => {
                    const sc = STEP_COLORS[step.type] || STEP_COLORS.Email;
                    return (
                      <div
                        key={step.id || idx}
                        className={`p-4 rounded-xl border ${
                          step.enabled !== false
                            ? "bg-muted/15 border-border/50"
                            : "bg-muted/5 border-border/20 opacity-60"
                        } space-y-2`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold font-mono ${sc}`}
                            >
                              Step {step.step_number || idx + 1} · Day {step.day}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {step.type}
                            </Badge>
                          </div>
                          {step.enabled === false && (
                            <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                              Disabled
                            </Badge>
                          )}
                        </div>

                        {step.subject && (
                          <div className="text-xs font-bold text-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/30">
                            <span className="text-muted-foreground font-normal">Subject: </span>
                            {step.subject}
                          </div>
                        )}

                        {step.body && (
                          <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/20 font-sans">
                            {step.body}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl">
                  No sequence steps defined for this campaign.
                </div>
              )}
            </TabsContent>

            {/* TAB 2: AUDIENCE */}
            <TabsContent value="audience" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-2">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Target className="h-3.5 w-3.5 text-indigo-400" /> Target Industries
                  </h4>
                  {campaign.audience?.industries && campaign.audience.industries.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.audience.industries.map((ind) => (
                        <Badge
                          key={ind}
                          className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs"
                        >
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">All industries / General</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-2">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Users className="h-3.5 w-3.5 text-purple-400" /> Target Accounts & People
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-muted-foreground">Target Companies: </span>
                      <span className="font-bold text-foreground">
                        {campaign.target_companies_count ?? campaign.audience?.companies?.length ?? 1}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Enrolled Contacts: </span>
                      <span className="font-bold text-indigo-300">
                        {campaign.total_contacts ?? campaign.audience?.people?.length ?? 1}
                      </span>
                    </div>
                    {campaign.audience?.companies && campaign.audience.companies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {campaign.audience.companies.map((c) => (
                          <Badge key={c} variant="outline" className="text-[10px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: SCHEDULE & RULES */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Schedule Window */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-3">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" /> Sending Schedule
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Send Window: </span>
                      <span className="font-bold font-mono text-foreground">
                        {sched?.send_time_from || "09:00"} –{" "}
                        {sched?.send_time_to || "17:00"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Active Days: </span>
                      <span className="font-bold text-foreground">
                        {sched?.send_days?.join(", ") || "Mon, Tue, Wed, Thu, Fri"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timezone: </span>
                      <span className="text-[11px] text-foreground font-mono">
                        {sched?.timezone || "SAST (UTC+2)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Automation Rules */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-3">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Automation Rules
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          campaign.rules?.stop_on_reply !== false
                            ? "text-emerald-400 font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        ✓ Stop on reply: {campaign.rules?.stop_on_reply !== false ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          campaign.rules?.stop_on_meeting_booked !== false
                            ? "text-purple-400 font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        ✓ Stop on meeting: {campaign.rules?.stop_on_meeting_booked !== false ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          campaign.rules?.update_lead_status !== false
                            ? "text-indigo-400 font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        ✓ Auto-update lead status:{" "}
                        {campaign.rules?.update_lead_status !== false ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          campaign.rules?.create_follow_up_task !== false
                            ? "text-amber-400 font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        ✓ Auto-create task on response:{" "}
                        {campaign.rules?.create_follow_up_task !== false ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 flex justify-end gap-2 bg-muted/10">
          <Button size="sm" variant="ghost" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
