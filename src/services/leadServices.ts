import { sendGraphQL } from "@/graphql";

export type LeadStage = 'Cold' | 'Contacted' | 'Warm' | 'Hot' | 'Customer' | 'Lost';
export type LeadTemperature = 'Cold' | 'Warm' | 'Hot';

export interface Lead {
  id: string;
  // People
  contact_name: string;
  contact_title: string;
  contact_avatar?: string;
  contact_email?: string;
  // Company
  organization_id: string;
  organization_name: string;
  industry?: string;
  // Pipeline
  pipeline_stage: LeadStage;
  temperature: LeadTemperature;
  score: number;
  deal_value?: number;
  probability?: number;
  // Tracking
  last_contact?: string;
  next_followup?: string;
  followup_count: number;
  assigned_to: string;
  // Legacy compat
  status?: LeadTemperature;
  contact_person?: string;
  contact_email_legacy?: string;
  next_step?: string;
  tags?: string[];
}

const MOCK_LEADS: Lead[] = [
  {
    id: "lead-1",
    contact_name: "Sarah Jenkins",
    contact_title: "Chief Technology Officer",
    contact_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80",
    contact_email: "s.jenkins@acme-corp.com",
    organization_id: "org-1",
    organization_name: "Acme Enterprise Corp",
    industry: "Cloud Infrastructure",
    pipeline_stage: "Hot",
    temperature: "Hot",
    score: 94,
    deal_value: 125000,
    probability: 85,
    last_contact: "2 hours ago",
    next_followup: "Today, 4:00 PM",
    followup_count: 5,
    assigned_to: "Alex Rivers",
    tags: ["Enterprise", "Cloud", "Urgent"],
    next_step: "Send formal MSA contract",
  },
  {
    id: "lead-2",
    contact_name: "Elena Rostova",
    contact_title: "Head of AI Infrastructure",
    contact_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&auto=format&fit=crop&q=80",
    contact_email: "e.rostova@finpulse.ai",
    organization_id: "org-3",
    organization_name: "FinPulse Financial AI",
    industry: "Fintech & AI",
    pipeline_stage: "Customer",
    temperature: "Hot",
    score: 96,
    deal_value: 88000,
    probability: 90,
    last_contact: "3 hours ago",
    next_followup: "Contract signing",
    followup_count: 8,
    assigned_to: "Sarah Connor",
    tags: ["Fintech", "AI", "High Intent"],
    next_step: "Final executive signoff",
  },
  {
    id: "lead-3",
    contact_name: "Marcus Vance",
    contact_title: "VP of Enterprise Security",
    contact_avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&auto=format&fit=crop&q=80",
    contact_email: "m.vance@apexcyber.io",
    organization_id: "org-2",
    organization_name: "Apex CyberSecurity",
    industry: "Cybersecurity",
    pipeline_stage: "Warm",
    temperature: "Warm",
    score: 78,
    deal_value: 65000,
    probability: 55,
    last_contact: "1 day ago",
    next_followup: "Tomorrow, 10:00 AM",
    followup_count: 3,
    assigned_to: "Alex Rivers",
    tags: ["Security", "Trial"],
    next_step: "Schedule technical trial",
  },
  {
    id: "lead-4",
    contact_name: "Rachel Sommer",
    contact_title: "Director of Digital Transformation",
    contact_avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=80&auto=format&fit=crop&q=80",
    contact_email: "rsommer@omnilogistics.global",
    organization_id: "org-5",
    organization_name: "OmniLogistics Systems",
    industry: "Logistics & Supply Chain",
    pipeline_stage: "Contacted",
    temperature: "Warm",
    score: 71,
    deal_value: 210000,
    probability: 40,
    last_contact: "2 days ago",
    next_followup: "Friday, 2:00 PM",
    followup_count: 2,
    assigned_to: "David Kim",
    tags: ["Logistics", "Webinar Lead"],
    next_step: "Follow-up discovery call",
  },
  {
    id: "lead-5",
    contact_name: "David Chen",
    contact_title: "VP of Global Procurement",
    contact_avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&auto=format&fit=crop&q=80",
    contact_email: "dchen@biohealth.med",
    organization_id: "org-4",
    organization_name: "BioHealth Diagnostics",
    industry: "Healthcare Tech",
    pipeline_stage: "Cold",
    temperature: "Cold",
    score: 52,
    deal_value: 150000,
    probability: 20,
    last_contact: "3 days ago",
    next_followup: "Next Monday",
    followup_count: 1,
    assigned_to: "Sarah Connor",
    tags: ["Healthcare", "Nurture"],
    next_step: "Send personalized case study",
  },
  {
    id: "lead-6",
    contact_name: "Klaus Brenner",
    contact_title: "Chief Revenue Officer",
    contact_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80",
    contact_email: "k.brenner@nexusrobotics.de",
    organization_id: "org-6",
    organization_name: "Nexus Robotics Solutions",
    industry: "Robotics & Automation",
    pipeline_stage: "Hot",
    temperature: "Hot",
    score: 91,
    deal_value: 320000,
    probability: 75,
    last_contact: "5 hours ago",
    next_followup: "Tomorrow, 9:00 AM",
    followup_count: 4,
    assigned_to: "Alex Rivers",
    tags: ["Robotics", "International", "Strategic"],
    next_step: "Send partnership proposal",
  },
  {
    id: "lead-7",
    contact_name: "Yuki Tanaka",
    contact_title: "Head of IT Procurement",
    contact_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80",
    contact_email: "y.tanaka@globalretail.jp",
    organization_id: "org-7",
    organization_name: "GlobalRetail Ventures",
    industry: "Retail Tech",
    pipeline_stage: "Lost",
    temperature: "Cold",
    score: 38,
    deal_value: 75000,
    probability: 0,
    last_contact: "2 weeks ago",
    next_followup: "Re-engage in Q4",
    followup_count: 6,
    assigned_to: "David Kim",
    tags: ["Retail", "APAC"],
    next_step: "Archive & re-engage later",
  },
];

export const PIPELINE_STAGES: LeadStage[] = ['Cold', 'Contacted', 'Warm', 'Hot', 'Customer', 'Lost'];

export const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; border: string; dot: string }> = {
  Cold:      { bg: "bg-slate-500/10",   text: "text-slate-400",  border: "border-slate-500/30",  dot: "bg-slate-400"  },
  Contacted: { bg: "bg-blue-500/10",    text: "text-blue-400",   border: "border-blue-500/30",   dot: "bg-blue-400"   },
  Warm:      { bg: "bg-amber-500/10",   text: "text-amber-400",  border: "border-amber-500/30",  dot: "bg-amber-400"  },
  Hot:       { bg: "bg-red-500/10",     text: "text-red-400",    border: "border-red-500/30",    dot: "bg-red-400"    },
  Customer:  { bg: "bg-emerald-500/10", text: "text-emerald-400",border: "border-emerald-500/30",dot: "bg-emerald-400"},
  Lost:      { bg: "bg-zinc-500/10",    text: "text-zinc-500",   border: "border-zinc-500/30",   dot: "bg-zinc-500"   },
};

export const TEMP_COLORS: Record<LeadTemperature, { badge: string }> = {
  Cold: { badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  Warm: { badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  Hot:  { badge: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export const leadServices = {
  async getLeads(params?: {
    stage?: LeadStage;
    temperature?: LeadTemperature;
    search?: string;
    assigned_to?: string;
    organization_id?: string;
    organization_name?: string;
  }): Promise<Lead[]> {
    try {
      const query = `
        query GetLeads {
          aa_s_leads(order_by: { score: desc }) {
            id contact_name contact_title contact_email organization_id organization_name
            industry pipeline_stage temperature score deal_value probability
            last_contact next_followup followup_count assigned_to tags next_step
          }
        }
      `;
      const res = await sendGraphQL({ query });
      if (res?.aa_s_leads?.length > 0) return res.aa_s_leads;
    } catch (err) {
      console.warn("Hasura leadServices fallback:", err);
    }

    let filtered = [...MOCK_LEADS];
    if (params?.stage) filtered = filtered.filter(l => l.pipeline_stage === params.stage);
    if (params?.temperature) filtered = filtered.filter(l => l.temperature === params.temperature);
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(l =>
        l.contact_name.toLowerCase().includes(s) ||
        l.organization_name.toLowerCase().includes(s) ||
        l.industry?.toLowerCase().includes(s)
      );
    }
    if (params?.assigned_to && params.assigned_to !== "all") {
      filtered = filtered.filter(l => l.assigned_to === params.assigned_to);
    }
    if (params?.organization_id) filtered = filtered.filter(l => l.organization_id === params.organization_id);
    if (params?.organization_name) filtered = filtered.filter(l => l.organization_name === params.organization_name);
    return filtered;
  },

  async updateLeadStage(id: string, newStage: LeadStage): Promise<Lead> {
    const lead = MOCK_LEADS.find(l => l.id === id);
    if (!lead) throw new Error("Lead not found");
    lead.pipeline_stage = newStage;
    lead.temperature = newStage === "Hot" || newStage === "Customer" ? "Hot"
      : newStage === "Cold" || newStage === "Lost" ? "Cold"
      : "Warm";
    return lead;
  },

  async updateLeadStatus(id: string, newStatus: LeadTemperature): Promise<Lead> {
    const lead = MOCK_LEADS.find(l => l.id === id);
    if (!lead) throw new Error("Lead not found");
    lead.temperature = newStatus;
    lead.status = newStatus;
    return lead;
  },

  async createLead(input: Partial<Lead>): Promise<Lead> {
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      contact_name: input.contact_name || "New Contact",
      contact_title: input.contact_title || "Decision Maker",
      contact_email: input.contact_email || "contact@example.com",
      organization_id: input.organization_id || "org-1",
      organization_name: input.organization_name || "Target Company",
      industry: input.industry || "Technology",
      pipeline_stage: input.pipeline_stage || "Cold",
      temperature: input.temperature || "Cold",
      score: input.score || 50,
      deal_value: input.deal_value || 50000,
      probability: input.probability || 25,
      last_contact: "Just now",
      next_followup: "Tomorrow",
      followup_count: 0,
      assigned_to: input.assigned_to || "Unassigned",
      tags: input.tags || ["New"],
      next_step: "Initial discovery email",
    };
    MOCK_LEADS.unshift(newLead);
    return newLead;
  },
};
