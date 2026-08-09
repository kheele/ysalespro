import { sendGraphQL } from "@/graphql";

export type OutreachChannel = 'Email' | 'Phone' | 'LinkedIn' | 'Meeting';
export type OutreachStatus =
  | 'Sent'
  | 'Delivered'
  | 'Opened'
  | 'Clicked'
  | 'Replied'
  | 'Called'
  | 'Voicemail'
  | 'Connected'
  | 'Meeting Set'
  | 'Completed'
  | 'Scheduled'
  | 'No Answer'
  | 'Bounced';

export interface OutreachActivity {
  id: string;
  channel: OutreachChannel;
  // Legacy compat
  type?: OutreachChannel;
  // Contact
  recipient_name: string;
  recipient_title?: string;
  recipient_org: string;
  recipient_email: string;
  // Content
  subject: string;
  message?: string;
  // Tracking
  date: string;
  timestamp: string;
  status: OutreachStatus;
  response?: string;
  outcome?: string;
  // Follow-up
  next_followup?: string;
  followup_days?: number;
  // Meta
  assigned_to?: string;
  tags?: string[];
}

const MOCK_OUTREACH: OutreachActivity[] = [
  {
    id: "out-1",
    channel: "Email",
    type: "Email",
    recipient_name: "Sarah Jenkins",
    recipient_title: "Chief Technology Officer",
    recipient_org: "Acme Enterprise Corp",
    recipient_email: "s.jenkins@acme-corp.com",
    subject: "Improve operational compliance at Acme — YSalesPro AI",
    message: "Hi Sarah, I noticed Acme's recent cloud migration initiative and wanted to share how YSalesPro's AI intelligence layer can streamline compliance automation across your distributed infrastructure.",
    date: "2026-07-23",
    timestamp: "2026-07-23T14:20:00Z",
    status: "Opened",
    response: "Opened twice, clicked pricing link",
    next_followup: "2026-07-26",
    followup_days: 3,
    assigned_to: "Alex Rivers",
    tags: ["Enterprise", "Cloud", "Follow-up"],
  },
  {
    id: "out-2",
    channel: "Phone",
    type: "Phone",
    recipient_name: "Marcus Vance",
    recipient_title: "VP of Enterprise Security",
    recipient_org: "Apex CyberSecurity",
    recipient_email: "m.vance@apexcyber.io",
    subject: "Executive Discovery Call — Security Architecture",
    message: "Called to discuss Zero Trust integration capabilities and custom ROI analysis.",
    date: "2026-07-23",
    timestamp: "2026-07-23T11:00:00Z",
    status: "Connected",
    response: "Positive 35-min call. Requested custom ROI breakdown by threat vector.",
    outcome: "Schedule follow-up technical call with security engineers",
    next_followup: "2026-07-25",
    followup_days: 2,
    assigned_to: "Alex Rivers",
    tags: ["Security", "Demo Requested"],
  },
  {
    id: "out-3",
    channel: "Email",
    type: "Email",
    recipient_name: "Elena Rostova",
    recipient_title: "Head of AI Infrastructure",
    recipient_org: "FinPulse Financial AI",
    recipient_email: "e.rostova@finpulse.ai",
    subject: "Contract Terms Follow-Up — YSalesPro Enterprise MSA",
    message: "Hi Elena, following up on the enterprise MSA we reviewed together. Legal has approved minor amendments — please see the attached countersigned document.",
    date: "2026-07-22",
    timestamp: "2026-07-22T16:45:00Z",
    status: "Replied",
    response: "Legal review underway. Elena confirmed signing by EOD Friday.",
    outcome: "Contract execution imminent",
    next_followup: "2026-07-25",
    followup_days: 3,
    assigned_to: "Sarah Connor",
    tags: ["High Priority", "Closing"],
  },
  {
    id: "out-4",
    channel: "Meeting",
    type: "Meeting",
    recipient_name: "David Chen",
    recipient_title: "VP of Global Procurement",
    recipient_org: "BioHealth Diagnostics",
    recipient_email: "dchen@biohealth.med",
    subject: "Product Architecture Review & Trial Onboarding",
    message: "Zoom meeting to walk through YSalesPro's data pipeline architecture and discuss a 30-day trial scope with David's procurement team.",
    date: "2026-07-24",
    timestamp: "2026-07-24T10:00:00Z",
    status: "Scheduled",
    response: "Calendar invite accepted",
    outcome: "Pending upcoming Zoom call tomorrow at 10 AM",
    next_followup: "2026-07-28",
    followup_days: 4,
    assigned_to: "Alex Rivers",
    tags: ["Trial", "Healthcare"],
  },
  {
    id: "out-5",
    channel: "LinkedIn",
    type: "LinkedIn",
    recipient_name: "Rachel Sommer",
    recipient_title: "Director of Digital Transformation",
    recipient_org: "OmniLogistics Systems",
    recipient_email: "rsommer@omnilogistics.global",
    subject: "Supply Chain AI — Webinar Follow-Up Connection",
    message: "Hi Rachel, great to see you engaged with our Supply Chain AI webinar. Wanted to connect here and share a short case study on autonomous warehouse orchestration.",
    date: "2026-07-21",
    timestamp: "2026-07-21T09:30:00Z",
    status: "Connected",
    response: "Accepted connection. Liked the post.",
    outcome: "Book a discovery call to explore partnership",
    next_followup: "2026-07-24",
    followup_days: 3,
    assigned_to: "David Kim",
    tags: ["Logistics", "LinkedIn Sequence"],
  },
  {
    id: "out-6",
    channel: "Phone",
    type: "Phone",
    recipient_name: "Klaus Brenner",
    recipient_title: "Chief Revenue Officer",
    recipient_org: "Nexus Robotics Solutions",
    recipient_email: "k.brenner@nexusrobotics.de",
    subject: "Partnership Proposal Call — Robotics AI Platform",
    message: "Called to discuss a strategic partnership for the European robotics market.",
    date: "2026-07-23",
    timestamp: "2026-07-23T08:00:00Z",
    status: "Voicemail",
    response: "Left voicemail. No callback yet.",
    outcome: "Try email follow-up with partnership deck",
    next_followup: "2026-07-24",
    followup_days: 1,
    assigned_to: "Alex Rivers",
    tags: ["Robotics", "International"],
  },
  {
    id: "out-7",
    channel: "Email",
    type: "Email",
    recipient_name: "Yuki Tanaka",
    recipient_title: "Head of IT Procurement",
    recipient_org: "GlobalRetail Ventures",
    recipient_email: "y.tanaka@globalretail.jp",
    subject: "Re-introduction: YSalesPro Enterprise for Retail Intelligence",
    message: "Reaching back out after our initial conversation. Wanted to share new features for retail demand forecasting and inventory optimization.",
    date: "2026-07-20",
    timestamp: "2026-07-20T07:15:00Z",
    status: "Bounced",
    response: "Email bounced — inbox not available",
    outcome: "Find alternate contact or LinkedIn",
    next_followup: "2026-07-30",
    followup_days: 10,
    assigned_to: "David Kim",
    tags: ["Retail", "APAC", "Bounced"],
  },
];

export const outreachServices = {
  async getOutreachActivities(params?: {
    channel?: OutreachChannel | 'all';
    status?: string;
    search?: string;
    assigned_to?: string;
  }): Promise<OutreachActivity[]> {
    try {
      const query = `
        query GetOutreach {
          aa_s_outreach_activities(order_by: { timestamp: desc }) {
            id channel recipient_name recipient_title recipient_org recipient_email
            subject message date timestamp status response outcome
            next_followup followup_days assigned_to tags
          }
        }
      `;
      const res = await sendGraphQL({ query });
      if (res?.aa_s_outreach_activities?.length > 0) return res.aa_s_outreach_activities;
    } catch (err) {
      console.warn("Hasura outreachServices fallback:", err);
    }

    let results = [...MOCK_OUTREACH];
    if (params?.channel && params.channel !== "all") {
      results = results.filter(o => o.channel === params.channel);
    }
    if (params?.status && params.status !== "all") {
      results = results.filter(o => o.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      results = results.filter(o =>
        o.recipient_name.toLowerCase().includes(s) ||
        o.recipient_org.toLowerCase().includes(s) ||
        o.subject.toLowerCase().includes(s) ||
        o.message?.toLowerCase().includes(s)
      );
    }
    if (params?.assigned_to && params.assigned_to !== "all") {
      results = results.filter(o => o.assigned_to === params.assigned_to);
    }
    return results;
  },

  async logOutreach(activity: Partial<OutreachActivity>): Promise<OutreachActivity> {
    const newAct: OutreachActivity = {
      id: `out-${Date.now()}`,
      channel: activity.channel || "Email",
      type: activity.channel || "Email",
      recipient_name: activity.recipient_name || "Decision Maker",
      recipient_title: activity.recipient_title || "",
      recipient_org: activity.recipient_org || "Target Company",
      recipient_email: activity.recipient_email || "contact@target.com",
      subject: activity.subject || "Sales Communication",
      message: activity.message || "",
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date().toISOString(),
      status: activity.channel === "Phone" ? "Called" : "Sent",
      response: "",
      outcome: activity.outcome || "",
      next_followup: activity.next_followup || "",
      followup_days: activity.followup_days || 3,
      assigned_to: activity.assigned_to || "Alex Rivers",
      tags: activity.tags || [],
    };
    MOCK_OUTREACH.unshift(newAct);
    return newAct;
  },
};
