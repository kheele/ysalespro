import { Organization, Person, Lead, PaginatedResult } from '@/lib/types';

export type { Organization, Person, Lead, PaginatedResult };

const PREFIXES = ["Global", "Apex", "Titan", "Vanguard", "Atlas", "Pinnacle", "Summit", "Matrix", "Omni", "Quantum", "Synergy", "Nexus", "Terra", "Ironclad", "Borealis", "Helix", "Zenith", "Strategic", "Precision", "Delta"];
const SECTORS = [
  { name: "Mining & Heavy Resources", keywords: ["Contractor Compliance", "Mine Safety", "Audit Readiness", "Fleet Logistics", "Heavy Equipment"], roles: ["Safety Manager", "Operations Manager", "VP of Mining", "Chief Safety Officer"] },
  { name: "Construction & Infrastructure", keywords: ["Jobsite Safety", "Subcontractor Management", "Site Inspections", "OSHA Compliance"], roles: ["Site Operations Manager", "EHS Director", "Procurement Manager", "Construction Manager"] },
  { name: "Advanced Manufacturing", keywords: ["ISO 9001", "Lean Operations", "Plant Safety", "Supply Chain", "Factory Automation"], roles: ["Plant Manager", "Head of Operations", "Procurement Director", "Safety Supervisor"] },
  { name: "Industrial & Mechanical Engineering", keywords: ["CAD/CAM", "Structural Integrity", "Quality Assurance", "EPC Contracting"], roles: ["Chief Engineer", "VP of Engineering", "Engineering Project Lead", "CEO"] },
  { name: "Cybersecurity & Defense", keywords: ["SOC-2", "Zero Trust", "Threat Intelligence", "FedRAMP Compliance"], roles: ["CISO", "VP of Security", "Security Operations Manager", "CTO"] },
  { name: "Cloud Computing & SaaS", keywords: ["Multi-cloud", "DevOps", "Kubernetes", "SLA 99.99%"], roles: ["VP of Infrastructure", "Director of Cloud Operations", "Chief Technology Officer"] },
  { name: "Fintech & Banking Technology", keywords: ["PCI-DSS", "AML/KYC", "Algorithmic Trading", "Payment Gateway"], roles: ["Chief Risk Officer", "Head of Product", "VP of Compliance", "CEO"] },
  { name: "Healthcare & Biotech Informatics", keywords: ["HIPAA Compliance", "Clinical Trials", "Medical Devices", "Diagnostic AI"], roles: ["Chief Medical Officer", "VP of Regulatory Affairs", "Director of Quality"] },
];

const FIRST_NAMES = ["James", "Sarah", "Michael", "Elena", "David", "Rachel", "Robert", "Jennifer", "Marcus", "Amanda", "Christopher", "Jessica", "Daniel", "Lisa", "Matthew", "Ashley", "Anthony", "Emily", "Mark", "Samantha"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

const CITIES = [
  { city: "Perth", country: "Australia" },
  { city: "Houston", country: "United States" },
  { city: "Denver", country: "United States" },
  { city: "Toronto", country: "Canada" },
  { city: "London", country: "United Kingdom" },
  { city: "Johannesburg", country: "South Africa" },
  { city: "Frankfurt", country: "Germany" },
  { city: "Tokyo", country: "Japan" },
  { city: "Brisbane", country: "Australia" },
  { city: "Calgary", country: "Canada" },
];

let cachedCompanies: Organization[] | null = null;
let cachedIndustries: { id: string; name: string; category: string; company_count: number }[] | null = null;
let cachedPeople: Person[] | null = null;
let cachedLeads: Lead[] | null = null;

export function getCompanies(count = 2200): Organization[] {
  if (cachedCompanies) return cachedCompanies;

  const list: Organization[] = [];
  for (let i = 1; i <= count; i++) {
    const sector = SECTORS[i % SECTORS.length];
    const prefix = PREFIXES[(i * 7) % PREFIXES.length];
    const loc = CITIES[i % CITIES.length];
    const emp = Math.floor(50 + ((i * 137) % 9950));
    const revMillions = Math.floor(10 + ((i * 43) % 490));

    list.push({
      id: i,
      name: `${prefix} ${sector.name.split(' ')[0]} ${i % 3 === 0 ? "Global" : i % 2 === 0 ? "Holdings" : "Corp"}`,
      website_url: `https://www.${prefix.toLowerCase()}${i}.com`,
      primary_domain: `${prefix.toLowerCase()}${i}.com`,
      primary_industry: sector.name,
      country: loc.country,
      city: loc.city,
      estimated_num_employees: emp,
      organization_revenue_str: `$${revMillions}M`,
      organization_revenue: revMillions * 1000000,
    });
  }

  cachedCompanies = list;
  return list;
}

export function getIndustries(count = 105): { id: string; name: string; category: string; company_count: number }[] {
  if (cachedIndustries) return cachedIndustries;

  const list = [];
  const baseSectors = ["Mining", "Construction", "Manufacturing", "Engineering", "Energy", "Logistics", "Software", "Healthcare", "Aerospace", "Automotive", "Chemicals", "Telecommunications"];
  const subTypes = ["Equipment & Machinery", "Safety & Compliance", "Operations Automation", "Infrastructure Solutions", "Digital Systems", "Procurement & Supply", "Global Logistics", "Research & Testing"];

  let idCounter = 1;
  for (const base of baseSectors) {
    for (const sub of subTypes) {
      if (idCounter > count) break;
      list.push({
        id: `ind-${idCounter}`,
        name: `${base} ${sub}`,
        category: base,
        company_count: Math.floor(15 + ((idCounter * 19) % 180)),
      });
      idCounter++;
    }
  }

  cachedIndustries = list;
  return list;
}

export function getPeople(count = 5200): Person[] {
  if (cachedPeople) return cachedPeople;

  const companies = getCompanies();
  const list: Person[] = [];

  const TARGET_ROLES = [
    { title: "Chief Executive Officer (CEO)", dept: "Executive", seniority: "C-Suite" },
    { title: "Safety Manager", dept: "EHS & Safety", seniority: "Manager" },
    { title: "Operations Manager", dept: "Operations", seniority: "Manager" },
    { title: "Procurement Manager", dept: "Procurement", seniority: "Manager" },
    { title: "VP of Mining Operations", dept: "Operations", seniority: "VP" },
    { title: "Head of Jobsite Compliance", dept: "EHS & Safety", seniority: "Director" },
    { title: "Chief Procurement Officer", dept: "Procurement", seniority: "C-Suite" },
    { title: "Director of Heavy Plant Safety", dept: "EHS & Safety", seniority: "Director" },
  ];

  for (let i = 1; i <= count; i++) {
    const comp = companies[i % companies.length];
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const role = TARGET_ROLES[i % TARGET_ROLES.length];
    const score = Math.min(99, Math.max(60, Math.floor(65 + ((i * 11) % 34))));

    list.push({
      id: `person-${i}`,
      name: `${fn} ${ln}`,
      job_title: role.title,
      company_id: comp.id,
      company_name: comp.name || '',
      industry: comp.primary_industry || '',
      department: role.dept,
      seniority: role.seniority,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${(comp.website_url || '').replace('https://www.', '')}`,
      phone: `+1 (${400 + (i % 500)}) 555-${1000 + (i % 8999)}`,
      location: `${comp.city}, ${comp.country}`,
      score: score,
    });
  }

  cachedPeople = list;
  return list;
}

export function getLeads(count = 5100): Lead[] {
  if (cachedLeads) return cachedLeads;

  const people = getPeople();
  const STAGES = ["Cold", "Contacted", "Warm Engaged", "Hot Qualified", "Demo Scheduled", "Closed Won", "Lost"];
  const REPS = ["Alex Rivers", "Sarah Connor", "David Kim", "Elena Vance"];

  const list: Lead[] = [];
  for (let i = 1; i <= count; i++) {
    const person = people[i % people.length];
    const temp: 'COLD' | 'WARM' | 'HOT' = i % 5 === 0 ? 'HOT' : i % 3 === 0 ? 'WARM' : 'COLD';
    const stage = STAGES[i % STAGES.length];
    const rep = REPS[i % REPS.length];

    list.push({
      id: `lead-${i}`,
      person_id: person.id,
      person_name: person.name,
      company_name: person.company_name,
      industry: person.industry,
      lead_temperature: temp,
      lead_score: person.score,
      stage: stage,
      last_contact: `2026-07-${(i % 22) + 1}`,
      next_followup: `2026-07-${(i % 5) + 24}`,
      assigned_user: rep,
    });
  }

  cachedLeads = list;
  return list;
}

export function paginate<T>(dataset: T[], page = 1, pageSize = 25, searchKey?: (item: T) => string, query = ""): PaginatedResult<T> {
  let filtered = dataset;
  if (query && searchKey) {
    const q = query.toLowerCase();
    filtered = dataset.filter(item => searchKey(item).toLowerCase().includes(q));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return {
    data,
    total,
    page: safePage,
    pageSize,
    totalPages,
    hasMore: safePage < totalPages,
  };
}

// Backward compatibility export object
export const mockGenerator = {
  getCompanies,
  getIndustries,
  getPeople,
  getLeads,
  paginate,
};
