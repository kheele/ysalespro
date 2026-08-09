import { sendGraphQL } from "@/graphql";

export interface PersonTimelineItem {
  id: string;
  type: 'Email' | 'Call' | 'Meeting' | 'Note' | 'Task';
  title: string;
  description: string;
  timestamp: string;
}

export interface DecisionMaker {
  id: string;
  name: string;
  title: string;
  organization_id: string;
  organization_name: string;
  industry?: string;
  department?: string;
  seniority?: 'C-Suite' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor';
  email: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
  decision_power: 'Executive' | 'VP/Director' | 'Manager';
  verified: boolean;
  avatar_url?: string;
  score?: number;
  score_factors?: {
    seniority_score: number;
    department_relevance: number;
    industry_relevance: number;
    company_size_score: number;
  };
  timeline?: PersonTimelineItem[];
}

const MOCK_PEOPLE: DecisionMaker[] = [
  {
    id: "person-1",
    name: "Sarah Jenkins",
    title: "Chief Technology Officer",
    organization_id: "org-1",
    organization_name: "Acme Enterprise Corp",
    industry: "Cloud Infrastructure",
    department: "Engineering & Technology",
    seniority: "C-Suite",
    email: "s.jenkins@acme-corp.com",
    phone: "+1 (555) 234-5678",
    linkedin_url: "https://linkedin.com/in/sjenkins-tech",
    location: "San Francisco, CA",
    decision_power: "Executive",
    verified: true,
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    score: 94,
    score_factors: { seniority_score: 98, department_relevance: 95, industry_relevance: 92, company_size_score: 88 },
    timeline: [
      { id: "tl-1-1", type: "Email", title: "AI Infrastructure Proposal Sent", description: "Opened 3 times. Clicked pricing link.", timestamp: "2 hours ago" },
      { id: "tl-1-2", type: "Call", title: "Introductory Discovery Call", description: "35-min call. Positive signals on cloud migration budget.", timestamp: "Yesterday" },
      { id: "tl-1-3", type: "Meeting", title: "Platform Demo — Engineering Team", description: "Live demo with 4 engineers. Requested SOC 2 docs.", timestamp: "3 days ago" },
      { id: "tl-1-4", type: "Note", title: "Budget confirmed for Q3", description: "Sarah confirmed $450k budget allocated for AI tooling.", timestamp: "5 days ago" },
    ],
  },
  {
    id: "person-2",
    name: "Marcus Vance",
    title: "VP of Enterprise Security",
    organization_id: "org-2",
    organization_name: "Apex CyberSecurity",
    industry: "Cybersecurity",
    department: "Security & Compliance",
    seniority: "VP",
    email: "m.vance@apexcyber.io",
    phone: "+1 (555) 876-5432",
    linkedin_url: "https://linkedin.com/in/marcusvance",
    location: "Austin, TX",
    decision_power: "VP/Director",
    verified: true,
    avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    score: 88,
    score_factors: { seniority_score: 88, department_relevance: 92, industry_relevance: 90, company_size_score: 78 },
    timeline: [
      { id: "tl-2-1", type: "Call", title: "Security Architecture Review Call", description: "Discussed API integration capabilities. Requested follow-up with ROI model.", timestamp: "1 day ago" },
      { id: "tl-2-2", type: "Email", title: "Cold Outreach — Zero Trust Use Case", description: "Sequence opened 4x. Clicked XDR integration page.", timestamp: "3 days ago" },
    ],
  },
  {
    id: "person-3",
    name: "Elena Rostova",
    title: "Head of AI Infrastructure",
    organization_id: "org-3",
    organization_name: "FinPulse Financial AI",
    industry: "Fintech & AI",
    department: "Product & Engineering",
    seniority: "Director",
    email: "e.rostova@finpulse.ai",
    phone: "+1 (555) 432-1098",
    linkedin_url: "https://linkedin.com/in/elenarostova",
    location: "New York, NY",
    decision_power: "VP/Director",
    verified: true,
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    score: 96,
    score_factors: { seniority_score: 90, department_relevance: 98, industry_relevance: 97, company_size_score: 96 },
    timeline: [
      { id: "tl-3-1", type: "Meeting", title: "Contract Legal Review — Executive Signoff", description: "Legal team approved. Awaiting Elena and CEO signature.", timestamp: "3 hours ago" },
      { id: "tl-3-2", type: "Email", title: "Enterprise MSA Sent — Countersigned", description: "Contract returned with minor amendments.", timestamp: "Yesterday" },
      { id: "tl-3-3", type: "Task", title: "Prepare Custom AI Fraud Detection Demo", description: "Tailored demo for FinPulse ML pipeline integrations.", timestamp: "4 days ago" },
    ],
  },
  {
    id: "person-4",
    name: "David Chen",
    title: "VP of Global Procurement",
    organization_id: "org-4",
    organization_name: "BioHealth Diagnostics",
    industry: "Healthcare Tech",
    department: "Operations & Procurement",
    seniority: "VP",
    email: "dchen@biohealth.med",
    phone: "+1 (555) 901-2345",
    linkedin_url: "https://linkedin.com/in/davidchen-proc",
    location: "Boston, MA",
    decision_power: "Executive",
    verified: true,
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    score: 72,
    score_factors: { seniority_score: 80, department_relevance: 65, industry_relevance: 72, company_size_score: 82 },
    timeline: [
      { id: "tl-4-1", type: "Email", title: "Introduction to YSalesPro Platform", description: "Sent initial cold email. No reply yet.", timestamp: "3 days ago" },
      { id: "tl-4-2", type: "Meeting", title: "Architecture Review Zoom — Scheduled", description: "Meeting scheduled for July 24.", timestamp: "Upcoming" },
    ],
  },
  {
    id: "person-5",
    name: "Rachel Sommer",
    title: "Director of Digital Transformation",
    organization_id: "org-5",
    organization_name: "OmniLogistics Systems",
    industry: "Logistics & Supply Chain",
    department: "Operations & Strategy",
    seniority: "Director",
    email: "rsommer@omnilogistics.global",
    phone: "+1 (555) 678-9012",
    linkedin_url: "https://linkedin.com/in/rachelsommer",
    location: "Chicago, IL",
    decision_power: "VP/Director",
    verified: false,
    avatar_url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
    score: 81,
    score_factors: { seniority_score: 82, department_relevance: 80, industry_relevance: 79, company_size_score: 84 },
    timeline: [
      { id: "tl-5-1", type: "Email", title: "Supply Chain AI Webinar Follow-Up", description: "Attended webinar. Engaged with 3 polls.", timestamp: "2 days ago" },
      { id: "tl-5-2", type: "Call", title: "Discovery Call Booked", description: "Call scheduled via calendar link.", timestamp: "Tomorrow" },
    ],
  },
  {
    id: "person-6",
    name: "Klaus Brenner",
    title: "Chief Revenue Officer",
    organization_id: "org-6",
    organization_name: "Nexus Robotics Solutions",
    industry: "Robotics & Automation",
    department: "Sales & Revenue",
    seniority: "C-Suite",
    email: "k.brenner@nexusrobotics.de",
    phone: "+49 89 1234 5678",
    linkedin_url: "https://linkedin.com/in/klausbrenner-cro",
    location: "Munich, Germany",
    decision_power: "Executive",
    verified: true,
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    score: 91,
    score_factors: { seniority_score: 98, department_relevance: 90, industry_relevance: 85, company_size_score: 90 },
    timeline: [
      { id: "tl-6-1", type: "Email", title: "Partnership Proposal — Robotics AI Platform", description: "Opened immediately. Requested a call.", timestamp: "5 hours ago" },
      { id: "tl-6-2", type: "Note", title: "Key decision maker for European expansion", description: "Klaus controls €2M tech budget for FY2026.", timestamp: "1 week ago" },
    ],
  },
];

export const peopleServices = {
  async getDecisionMakers(params?: {
    search?: string;
    industry?: string;
    organization_name?: string;
    title?: string;
    department?: string;
    seniority?: string;
    location?: string;
    organization_id?: string;
  }): Promise<{ people: DecisionMaker[]; total: number }> {
    try {
      const query = `
        query GetDecisionMakers {
          aa_s_decision_makers {
            id name title email phone linkedin_url location
            decision_power verified avatar_url
            organization { id name industry }
          }
        }
      `;
      const res = await sendGraphQL({ query });
      if (res?.aa_s_decision_makers?.length > 0) {
        return { people: res.aa_s_decision_makers, total: res.aa_s_decision_makers.length };
      }
    } catch (err) {
      console.warn("Hasura peopleServices fallback:", err);
    }

    let filtered = [...MOCK_PEOPLE];
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.organization_name.toLowerCase().includes(s) ||
          p.title.toLowerCase().includes(s) ||
          p.email.toLowerCase().includes(s) ||
          p.location?.toLowerCase().includes(s)
      );
    }
    if (params?.industry && params.industry !== "all") {
      filtered = filtered.filter((p) => p.industry === params.industry);
    }
    if (params?.organization_name && params.organization_name !== "all") {
      filtered = filtered.filter((p) => p.organization_name === params.organization_name);
    }
    if (params?.department && params.department !== "all") {
      filtered = filtered.filter((p) => p.department === params.department);
    }
    if (params?.seniority && params.seniority !== "all") {
      filtered = filtered.filter((p) => p.seniority === params.seniority);
    }
    if (params?.location && params.location !== "all") {
      filtered = filtered.filter((p) => p.location?.includes(params.location!));
    }
    if (params?.organization_id) {
      filtered = filtered.filter((p) => p.organization_id === params.organization_id);
    }
    return { people: filtered, total: filtered.length };
  },

  async getDecisionMakerById(id: string): Promise<DecisionMaker | null> {
    return MOCK_PEOPLE.find((p) => p.id === id) || MOCK_PEOPLE[0];
  },
};
