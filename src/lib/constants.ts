import {
  LeadStage,
  SequenceStep,
  CampaignRules,
  CampaignSchedule,
  DailyFollowUpRule,
} from './types';

export const PIPELINE_STAGES: LeadStage[] = ['Cold', 'Contacted', 'Warm', 'Hot', 'Customer', 'Lost'];

export const STAGE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Cold:      { bg: "bg-slate-500/10",   text: "text-slate-400",  border: "border-slate-500/30",  dot: "bg-slate-400"  },
  Contacted: { bg: "bg-blue-500/10",    text: "text-blue-400",   border: "border-blue-500/30",   dot: "bg-blue-400"   },
  Warm:      { bg: "bg-amber-500/10",   text: "text-amber-400",  border: "border-amber-500/30",  dot: "bg-amber-400"  },
  Hot:       { bg: "bg-red-500/10",     text: "text-red-400",    border: "border-red-500/30",    dot: "bg-red-400"    },
  Customer:  { bg: "bg-emerald-500/10", text: "text-emerald-400",border: "border-emerald-500/30",dot: "bg-emerald-400"},
  Lost:      { bg: "bg-zinc-500/10",    text: "text-zinc-500",   border: "border-zinc-500/30",   dot: "bg-zinc-500"   },
};

export const TEMP_COLORS: Record<string, { badge: string }> = {
  Cold: { badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  Warm: { badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  Hot:  { badge: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export const DEFAULT_SEQUENCE: SequenceStep[] = [
  {
    id: "1",
    day: 0,
    step_number: 1,
    type: "Introduction",
    subject: "Personalized Outreach: {{company}}",
    body: "Hi {{name}},\n\nI noticed {{company}} has been expanding in your sector...",
    enabled: true,
  },
  {
    id: "2",
    day: 2,
    step_number: 2,
    type: "Follow-up",
    subject: "Brief introductory phone touchpoint",
    body: "Follow up via phone to introduce key value proposition.",
    enabled: true,
  },
  {
    id: "3",
    day: 4,
    step_number: 3,
    type: "Final Message",
    subject: "Follow up: Quick question for {{name}}",
    body: "Hi {{name}},\n\nWanted to quickly follow up on my previous note...",
    enabled: true,
  },
];

export const DEFAULT_RULES: CampaignRules = {
  stop_on_reply: true,
  stop_on_meeting_booked: true,
  update_lead_status: true,
  create_follow_up_task: true,
  exclude_customers: true,
  exclude_competitors: true,
  track_opens: true,
};

export const DEFAULT_SCHEDULE: CampaignSchedule = {
  send_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  send_time_from: "09:00",
  send_time_to: "17:00",
  timezone: "SAST (UTC+2 - Johannesburg / South Africa)",
  start_date: new Date().toISOString().split("T")[0],
};

export const DAILY_RULES: DailyFollowUpRule[] = [
  {
    id: 1,
    name: "Follow-up Delay (3 Days)",
    condition: "No response after 3 business days",
    action: "Send next sequence touchpoint",
    active: true,
  },
  {
    id: 2,
    name: "Stop on Reply",
    condition: "Lead replies to any touchpoint",
    action: "Halt all automated campaign emails immediately",
    active: true,
  },
  {
    id: 3,
    name: "Escalate High Intent",
    condition: "Email link clicked 2+ times or hot intent signal",
    action: "Tag as HOT and alert assigned account executive",
    active: true,
  },
];
