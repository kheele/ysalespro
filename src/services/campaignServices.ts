import { sendGraphQL } from "@/graphql";

export type CampaignStatus = 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
export type SequenceStepType = 'Introduction' | 'Follow-up' | 'Case Study' | 'Final Message' | 'Custom';

export interface SequenceStep {
  id: string;
  day: number;
  type: SequenceStepType;
  subject: string;
  body: string;
  enabled: boolean;
}

export interface CampaignAudience {
  industries: string[];
  companies: string[];
  people: string[];
  estimated_contacts: number;
}

export interface CampaignRules {
  stop_on_reply: boolean;
  stop_on_meeting_booked: boolean;
  update_lead_status: boolean;
  create_follow_up_task: boolean;
  exclude_customers: boolean;
  exclude_competitors: boolean;
}

export interface CampaignSchedule {
  send_days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  send_time_from: string;
  send_time_to: string;
  timezone: string;
  start_date: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  audience: CampaignAudience;
  sequence: SequenceStep[];
  rules: CampaignRules;
  schedule: CampaignSchedule;
  // Stats
  total_contacts: number;
  emails_sent: number;
  open_rate: number;
  reply_rate: number;
  meetings_booked: number;
  unsubscribes: number;
  start_date: string;
  end_date?: string;
  created_by: string;
  tags?: string[];
}

const DEFAULT_SEQUENCE: SequenceStep[] = [
  {
    id: "step-tpl-1", day: 0, type: "Introduction",
    subject: "Quick intro — {{first_name}}, improve {{company}} revenue with AI",
    body: "Hi {{first_name}},\n\nI've been following {{company}}'s growth in the {{industry}} space and wanted to share how YSalesPro's AI intelligence platform is helping similar companies identify their highest-value accounts.\n\nWould you be open to a quick 15-minute call this week?\n\n{{sender_name}}\n{{sender_title}}",
    enabled: true,
  },
  {
    id: "step-tpl-2", day: 3, type: "Follow-up",
    subject: "Following up — {{company}} + YSalesPro",
    body: "Hi {{first_name}},\n\nJust checking in on my note from a few days ago. Did you get a chance to review it?\n\nI'd love to share a specific case study relevant to {{industry}}.\n\n{{sender_name}}",
    enabled: true,
  },
  {
    id: "step-tpl-3", day: 7, type: "Case Study",
    subject: "Case study: How [Similar Company] 3x'd their pipeline in 90 days",
    body: "Hi {{first_name}},\n\nI thought you'd find this relevant — [Similar Company] in the {{industry}} space used YSalesPro to:\n\n• Identify 340 new high-intent decision makers\n• Reduce outreach time by 65%\n• Book 28 demos in their first month\n\nCould we explore this for {{company}}?\n\n{{sender_name}}",
    enabled: true,
  },
  {
    id: "step-tpl-4", day: 14, type: "Final Message",
    subject: "Last note — {{first_name}}",
    body: "Hi {{first_name}},\n\nI don't want to keep filling your inbox, so this will be my last message for now.\n\nIf timing changes or you'd like to revisit this, I'd love to connect. I'll leave a calendar link below.\n\nAll the best,\n{{sender_name}}",
    enabled: true,
  },
];

const DEFAULT_RULES: CampaignRules = {
  stop_on_reply: true,
  stop_on_meeting_booked: true,
  update_lead_status: true,
  create_follow_up_task: true,
  exclude_customers: true,
  exclude_competitors: false,
};

const DEFAULT_SCHEDULE: CampaignSchedule = {
  send_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  send_time_from: '09:00',
  send_time_to: '17:00',
  timezone: 'UTC-5 (Eastern)',
  start_date: '',
};

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    name: "Q3 Enterprise CTO Outreach",
    description: "4-step cold-to-warm sequence targeting CTOs at cloud-native companies.",
    status: "Active",
    audience: {
      industries: ["Cloud Infrastructure", "Cybersecurity"],
      companies: ["Acme Enterprise Corp", "Apex CyberSecurity", "Nexus Robotics Solutions"],
      people: [],
      estimated_contacts: 147,
    },
    sequence: DEFAULT_SEQUENCE,
    rules: DEFAULT_RULES,
    schedule: { ...DEFAULT_SCHEDULE, send_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], start_date: '2026-07-01' },
    total_contacts: 147, emails_sent: 441, open_rate: 38, reply_rate: 12, meetings_booked: 18, unsubscribes: 3,
    start_date: "2026-07-01", end_date: "2026-08-31",
    created_by: "Alex Rivers", tags: ["Enterprise", "CTO", "Q3"],
  },
  {
    id: "camp-2",
    name: "Fintech AI Decision Makers",
    description: "Warm sequence for VP-level contacts at fintech firms.",
    status: "Active",
    audience: {
      industries: ["Fintech & AI"],
      companies: ["FinPulse Financial AI"],
      people: ["Elena Rostova"],
      estimated_contacts: 64,
    },
    sequence: [
      { ...DEFAULT_SEQUENCE[0], id: "c2-s1" },
      { ...DEFAULT_SEQUENCE[1], id: "c2-s2" },
      { ...DEFAULT_SEQUENCE[2], id: "c2-s3" },
    ],
    rules: { ...DEFAULT_RULES, create_follow_up_task: false },
    schedule: { ...DEFAULT_SCHEDULE, start_date: '2026-07-10' },
    total_contacts: 64, emails_sent: 128, open_rate: 52, reply_rate: 19, meetings_booked: 11, unsubscribes: 1,
    start_date: "2026-07-10",
    created_by: "Sarah Connor", tags: ["Fintech", "Warm", "AI"],
  },
  {
    id: "camp-3",
    name: "Healthcare Re-Engagement",
    description: "Re-engagement for cold healthcare contacts from past events.",
    status: "Paused",
    audience: {
      industries: ["Healthcare Tech"],
      companies: ["BioHealth Diagnostics"],
      people: [],
      estimated_contacts: 89,
    },
    sequence: DEFAULT_SEQUENCE.slice(0, 3).map((s, i) => ({ ...s, id: `c3-s${i}` })),
    rules: DEFAULT_RULES,
    schedule: { ...DEFAULT_SCHEDULE, start_date: '2026-06-15' },
    total_contacts: 89, emails_sent: 267, open_rate: 21, reply_rate: 5, meetings_booked: 3, unsubscribes: 7,
    start_date: "2026-06-15",
    created_by: "David Kim", tags: ["Healthcare", "Re-Engage"],
  },
];

export const campaignServices = {
  getDefaultSequence: (): SequenceStep[] => JSON.parse(JSON.stringify(DEFAULT_SEQUENCE)),
  getDefaultRules: (): CampaignRules => ({ ...DEFAULT_RULES }),
  getDefaultSchedule: (): CampaignSchedule => ({ ...DEFAULT_SCHEDULE }),

  async getCampaigns(params?: { search?: string; status?: CampaignStatus | 'all' }): Promise<Campaign[]> {
    try {
      const q = `query { aa_s_campaigns { id name description status total_contacts emails_sent open_rate reply_rate meetings_booked start_date end_date created_by } }`;
      const res = await sendGraphQL({ query: q });
      if (res?.aa_s_campaigns?.length > 0) return res.aa_s_campaigns;
    } catch (err) {
      console.warn("Hasura campaignServices fallback:", err);
    }
    let results = [...MOCK_CAMPAIGNS];
    if (params?.search) {
      const s = params.search.toLowerCase();
      results = results.filter(c => c.name.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
    }
    if (params?.status && params.status !== "all") results = results.filter(c => c.status === params.status);
    return results;
  },

  async getCampaignById(id: string): Promise<Campaign> {
    return MOCK_CAMPAIGNS.find(c => c.id === id) ?? MOCK_CAMPAIGNS[0];
  },

  async createCampaign(input: Partial<Campaign>): Promise<Campaign> {
    const c: Campaign = {
      id: `camp-${Date.now()}`,
      name: input.name || "New Campaign",
      description: input.description || "",
      status: "Draft",
      audience: input.audience ?? { industries: [], companies: [], people: [], estimated_contacts: 0 },
      sequence: input.sequence ?? JSON.parse(JSON.stringify(DEFAULT_SEQUENCE)),
      rules: input.rules ?? { ...DEFAULT_RULES },
      schedule: input.schedule ?? { ...DEFAULT_SCHEDULE },
      total_contacts: 0, emails_sent: 0, open_rate: 0, reply_rate: 0, meetings_booked: 0, unsubscribes: 0,
      start_date: input.schedule?.start_date || new Date().toISOString().split('T')[0],
      created_by: input.created_by || "Alex Rivers",
      tags: input.tags || [],
    };
    MOCK_CAMPAIGNS.unshift(c);
    return c;
  },

  async updateCampaignStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    const c = MOCK_CAMPAIGNS.find(c => c.id === id);
    if (!c) throw new Error("Campaign not found");
    c.status = status;
    return c;
  },
};
