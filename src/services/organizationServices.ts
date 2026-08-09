import { sendGraphQL } from "@/graphql";

export interface OrganizationNote {
  id: string;
  organization_id: string;
  author: string;
  content: string;
  created_at: string;
}

export interface OrganizationActivity {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'Email' | 'Call' | 'Meeting' | 'StatusChange' | 'Note';
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  logo_url?: string;
  industry?: string;
  employee_count?: number;
  revenue?: string;
  location?: string;
  city?: string;
  country?: string;
  status?: 'Active' | 'Prospect' | 'Customer' | 'Churned';
  last_activity?: string;
  founded_year?: number;
  created_at?: string;
  updated_at?: string;
  industry_list?: Array<{ id: string; name?: string; industry?: { name: string } }>;
  keywords_list?: Array<{ id: string; keyword?: { name: string } }>;
  language_list?: Array<{ id: string; language?: { name: string } }>;
  naics_code_list?: Array<{ id: string; code: string; title: string }>;
  sic_code_list?: Array<{ id: string; code: string; title: string }>;
  lead_status?: 'Cold' | 'Warm' | 'Hot';
  score?: number;
  notes?: OrganizationNote[];
  activities?: OrganizationActivity[];
}

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "org-1",
    name: "Acme Enterprise Corp",
    domain: "acme-corp.com",
    logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
    industry: "Cloud Infrastructure",
    employee_count: 1450,
    revenue: "$120M - $250M",
    location: "San Francisco, CA, USA",
    city: "San Francisco",
    country: "United States",
    status: "Customer",
    last_activity: "2 hours ago",
    founded_year: 2012,
    created_at: "2026-07-01T10:00:00Z",
    lead_status: "Hot",
    score: 94,
    industry_list: [
      { id: "ind-1", industry: { name: "Cloud Infrastructure" } },
      { id: "ind-1b", industry: { name: "DevOps & Platform Eng" } },
    ],
    keywords_list: [
      { id: "kw-1", keyword: { name: "SaaS" } },
      { id: "kw-2", keyword: { name: "Kubernetes" } },
      { id: "kw-2b", keyword: { name: "Multi-Cloud" } },
    ],
    language_list: [
      { id: "lg-1", language: { name: "English" } },
      { id: "lg-1b", language: { name: "Spanish" } },
    ],
    naics_code_list: [
      { id: "n-1", code: "518210", title: "Data Processing, Hosting, and Related Services" },
      { id: "n-1b", code: "541511", title: "Custom Computer Programming Services" },
    ],
    sic_code_list: [
      { id: "s-1", code: "7374", title: "Computer Processing and Data Preparation" },
      { id: "s-1b", code: "7371", title: "Computer Programming Services" },
    ],
    notes: [
      { id: "nt-1", organization_id: "org-1", author: "Alex Rivers", content: "Executive briefing completed. Renewing 3-year enterprise contract.", created_at: "2026-07-23 14:00" },
      { id: "nt-2", organization_id: "org-1", author: "Sarah Jenkins", content: "Pushed 50 additional licenses for cloud analytics team.", created_at: "2026-07-20 11:30" },
    ],
    activities: [
      { id: "act-1", organization_id: "org-1", title: "Contract Renewal Signed", description: "Expanded account value to $450k ARR", timestamp: "2 hours ago", type: "StatusChange" },
      { id: "act-2", organization_id: "org-1", title: "Quarterly Review Call", description: "Discussed AI intelligence roadmap with CTO Marcus Vance", timestamp: "Yesterday", type: "Call" },
    ],
  },
  {
    id: "org-2",
    name: "Apex CyberSecurity",
    domain: "apexcyber.io",
    logo_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100&auto=format&fit=crop&q=60",
    industry: "Cybersecurity",
    employee_count: 620,
    revenue: "$50M - $100M",
    location: "Austin, TX, USA",
    city: "Austin",
    country: "United States",
    status: "Prospect",
    last_activity: "1 day ago",
    founded_year: 2017,
    created_at: "2026-07-10T14:30:00Z",
    lead_status: "Warm",
    score: 88,
    industry_list: [{ id: "ind-2", industry: { name: "Cybersecurity" } }],
    keywords_list: [
      { id: "kw-3", keyword: { name: "Zero Trust" } },
      { id: "kw-4", keyword: { name: "SIEM" } },
      { id: "kw-4b", keyword: { name: "XDR" } },
    ],
    language_list: [{ id: "lg-1", language: { name: "English" } }],
    naics_code_list: [{ id: "n-2", code: "541512", title: "Computer Systems Design Services" }],
    sic_code_list: [{ id: "s-2", code: "7379", title: "Computer Related Services, NEC" }],
    notes: [
      { id: "nt-3", organization_id: "org-2", author: "David Vance", content: "Evaluating API integrations with Hasura security layer.", created_at: "2026-07-22 16:45" },
    ],
    activities: [
      { id: "act-3", organization_id: "org-2", title: "Demo Delivered", description: "Presented sales automation workflow to CISO Elena Rostova", timestamp: "1 day ago", type: "Meeting" },
    ],
  },
  {
    id: "org-3",
    name: "FinPulse Financial AI",
    domain: "finpulse.ai",
    logo_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=60",
    industry: "Fintech & AI",
    employee_count: 280,
    revenue: "$20M - $50M",
    location: "New York, NY, USA",
    city: "New York",
    country: "United States",
    status: "Active",
    last_activity: "3 hours ago",
    founded_year: 2020,
    created_at: "2026-07-15T09:15:00Z",
    lead_status: "Hot",
    score: 96,
    industry_list: [{ id: "ind-3", industry: { name: "Fintech" } }],
    keywords_list: [
      { id: "kw-5", keyword: { name: "Fraud Detection" } },
      { id: "kw-6", keyword: { name: "Machine Learning" } },
    ],
    language_list: [
      { id: "lg-1", language: { name: "English" } },
      { id: "lg-2", language: { name: "Spanish" } },
    ],
    naics_code_list: [{ id: "n-3", code: "523999", title: "Miscellaneous Financial Investment Activities" }],
    sic_code_list: [{ id: "s-3", code: "6282", title: "Investment Advice" }],
    notes: [],
    activities: [],
  },
  {
    id: "org-4",
    name: "BioHealth Diagnostics",
    domain: "biohealth.med",
    logo_url: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=100&auto=format&fit=crop&q=60",
    industry: "Healthcare Tech",
    employee_count: 2100,
    revenue: "$300M - $500M",
    location: "Boston, MA, USA",
    city: "Boston",
    country: "United States",
    status: "Prospect",
    last_activity: "3 days ago",
    founded_year: 2008,
    created_at: "2026-06-20T11:00:00Z",
    lead_status: "Cold",
    score: 64,
    industry_list: [{ id: "ind-4", industry: { name: "Healthcare Tech" } }],
    keywords_list: [{ id: "kw-7", keyword: { name: "Genomics" } }],
    language_list: [{ id: "lg-1", language: { name: "English" } }],
    naics_code_list: [{ id: "n-4", code: "621511", title: "Medical Laboratories" }],
    sic_code_list: [{ id: "s-4", code: "8071", title: "Medical Laboratories" }],
    notes: [],
    activities: [],
  },
  {
    id: "org-5",
    name: "OmniLogistics Systems",
    domain: "omnilogistics.global",
    logo_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=60",
    industry: "Logistics & Supply Chain",
    employee_count: 4500,
    revenue: "$1B+",
    location: "Chicago, IL, USA",
    city: "Chicago",
    country: "United States",
    status: "Customer",
    last_activity: "4 hours ago",
    founded_year: 2002,
    created_at: "2026-07-22T08:00:00Z",
    lead_status: "Warm",
    score: 82,
    industry_list: [{ id: "ind-5", industry: { name: "Logistics & Supply Chain" } }],
    keywords_list: [{ id: "kw-8", keyword: { name: "IoT Tracking" } }],
    language_list: [
      { id: "lg-1", language: { name: "English" } },
      { id: "lg-3", language: { name: "German" } },
    ],
    naics_code_list: [{ id: "n-5", code: "488510", title: "Freight Transportation Arrangement" }],
    sic_code_list: [{ id: "s-5", code: "4731", title: "Arrangement of Transportation of Freight" }],
    notes: [],
    activities: [],
  },
  {
    id: "org-6",
    name: "Nexus Robotics Solutions",
    domain: "nexusrobotics.de",
    logo_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&auto=format&fit=crop&q=60",
    industry: "Robotics & Automation",
    employee_count: 920,
    revenue: "$100M - $250M",
    location: "Munich, Germany",
    city: "Munich",
    country: "Germany",
    status: "Active",
    last_activity: "5 hours ago",
    founded_year: 2015,
    created_at: "2026-07-18T12:00:00Z",
    lead_status: "Hot",
    score: 91,
    industry_list: [{ id: "ind-6", industry: { name: "Robotics & Automation" } }],
    keywords_list: [{ id: "kw-9", keyword: { name: "Industrial Automation" } }, { id: "kw-10", keyword: { name: "AI Vision" } }],
    language_list: [{ id: "lg-3", language: { name: "German" } }, { id: "lg-1", language: { name: "English" } }],
    naics_code_list: [{ id: "n-6", code: "333999", title: "All Other Miscellaneous General Purpose Machinery" }],
    sic_code_list: [{ id: "s-6", code: "3569", title: "General Industrial Machinery" }],
    notes: [],
    activities: [],
  },
];

export const organizationServices = {
  async getOrganizations(params?: {
    search?: string;
    industry?: string;
    country?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ organizations: Organization[]; total: number }> {
    try {
      const query = `
        query GetOrganizations($limit: Int, $offset: Int) {
          aa_s_organizations(limit: $limit, offset: $offset, order_by: { created_at: desc }) {
            id
            name
            domain
            logo_url
            industry
            employee_count
            revenue
            location
            city
            country
            status
            last_activity
            founded_year
            created_at
            updated_at
            industry_list {
              id
              industry {
                name
              }
            }
            keywords_list {
              id
              keyword {
                name
              }
            }
            language_list {
              id
              language {
                name
              }
            }
            naics_code_list {
              id
              code
              title
            }
            sic_code_list {
              id
              code
              title
            }
          }
          aa_s_organizations_aggregate {
            aggregate {
              count
            }
          }
        }
      `;
      const res = await sendGraphQL({ query, variables: { limit: params?.limit || 100, offset: params?.offset || 0 } });
      if (res && res.aa_s_organizations && res.aa_s_organizations.length > 0) {
        let orgs: Organization[] = res.aa_s_organizations;

        // Apply Search
        if (params?.search) {
          const s = params.search.toLowerCase();
          orgs = orgs.filter(o =>
            o.name?.toLowerCase().includes(s) ||
            o.domain?.toLowerCase().includes(s) ||
            o.industry?.toLowerCase().includes(s) ||
            o.city?.toLowerCase().includes(s) ||
            o.country?.toLowerCase().includes(s)
          );
        }

        // Apply Filters
        if (params?.industry && params.industry !== "all") {
          orgs = orgs.filter(o => o.industry === params.industry);
        }
        if (params?.country && params.country !== "all") {
          orgs = orgs.filter(o => o.country === params.country);
        }
        if (params?.status && params.status !== "all") {
          orgs = orgs.filter(o => (o.status || o.lead_status) === params.status);
        }

        // Apply Sorting
        if (params?.sortBy) {
          const key = params.sortBy as keyof Organization;
          const order = params.sortOrder === "desc" ? -1 : 1;
          orgs.sort((a, b) => {
            const valA = a[key] ?? "";
            const valB = b[key] ?? "";
            if (valA < valB) return -1 * order;
            if (valA > valB) return 1 * order;
            return 0;
          });
        }

        return {
          organizations: orgs,
          total: res.aa_s_organizations_aggregate?.aggregate?.count || orgs.length,
        };
      }
    } catch (err) {
      console.warn("Hasura organization query fallback:", err);
    }

    let filtered = [...MOCK_ORGANIZATIONS];

    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(o =>
        o.name.toLowerCase().includes(s) ||
        o.domain?.toLowerCase().includes(s) ||
        o.industry?.toLowerCase().includes(s) ||
        o.city?.toLowerCase().includes(s) ||
        o.country?.toLowerCase().includes(s)
      );
    }

    if (params?.industry && params.industry !== "all") {
      filtered = filtered.filter(o => o.industry === params.industry);
    }
    if (params?.country && params.country !== "all") {
      filtered = filtered.filter(o => o.country === params.country);
    }
    if (params?.status && params.status !== "all") {
      filtered = filtered.filter(o => o.status === params.status || o.lead_status === params.status);
    }

    if (params?.sortBy) {
      const key = params.sortBy as keyof Organization;
      const order = params.sortOrder === "desc" ? -1 : 1;
      filtered.sort((a, b) => {
        const valA = a[key] ?? "";
        const valB = b[key] ?? "";
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    }

    return {
      organizations: filtered,
      total: filtered.length,
    };
  },

  async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      const query = `
        query GetOrganizationById($id: uuid!) {
          aa_s_organizations_by_pk(id: $id) {
            id
            name
            domain
            logo_url
            industry
            employee_count
            revenue
            location
            city
            country
            status
            last_activity
            founded_year
            created_at
            industry_list {
              id
              industry {
                name
              }
            }
            keywords_list {
              id
              keyword {
                name
              }
            }
            language_list {
              id
              language {
                name
              }
            }
            naics_code_list {
              id
              code
              title
            }
            sic_code_list {
              id
              code
              title
            }
          }
        }
      `;
      const res = await sendGraphQL({ query, variables: { id } });
      if (res && res.aa_s_organizations_by_pk) {
        return res.aa_s_organizations_by_pk;
      }
    } catch (err) {
      console.warn("Hasura getOrganizationById fallback:", err);
    }
    return MOCK_ORGANIZATIONS.find(o => o.id === id) || MOCK_ORGANIZATIONS[0];
  },

  async createOrganization(input: Partial<Organization>): Promise<Organization> {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: input.name || "New Organization",
      domain: input.domain || "example.com",
      industry: input.industry || "Technology",
      employee_count: input.employee_count || 10,
      revenue: input.revenue || "$1M - $5M",
      location: input.location || "San Francisco, CA",
      city: input.city || "San Francisco",
      country: input.country || "United States",
      status: "Prospect",
      last_activity: "Just now",
      founded_year: input.founded_year || new Date().getFullYear(),
      created_at: new Date().toISOString(),
      lead_status: "Cold",
      score: 75,
      notes: [],
      activities: [
        { id: `act-${Date.now()}`, organization_id: `org-${Date.now()}`, title: "Organization Created", description: "Enriched from input parameters", timestamp: "Just now", type: "StatusChange" },
      ],
    };
    MOCK_ORGANIZATIONS.unshift(newOrg);
    return newOrg;
  },

  async addNote(organization_id: string, content: string, author: string = "Alex Rivers"): Promise<OrganizationNote> {
    const note: OrganizationNote = {
      id: `nt-${Date.now()}`,
      organization_id,
      author,
      content,
      created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
    };
    const org = MOCK_ORGANIZATIONS.find(o => o.id === organization_id);
    if (org) {
      if (!org.notes) org.notes = [];
      org.notes.unshift(note);
    }
    return note;
  }
};
