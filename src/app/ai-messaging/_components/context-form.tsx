"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  User,
  Building2,
  Send,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Search,
  X,
  Loader2,
  Check,
  Package,
} from "lucide-react";
import type {
  DecisionMaker,
  Organization,
  PersonContext,
  CompanyContext,
  OutreachOfferContext,
} from "@/lib/types";
import { searchDecisionMakersByNamePrefixAction } from "@/services/public/peopleServices";
import { searchOrganizationsByNamePrefixAction } from "@/services/public/organizationServices";

export interface OfferPreset {
  category: string;
  industryLabel: string;
  label: string;
  product: string;
  value: string;
  cta: string;
}

export const PRESET_CATEGORIES = [
  { id: "all", name: "All Industries" },
  { id: "she", name: "Safety & PPE" },
  { id: "mining_construction", name: "Mining & Construction" },
  { id: "it_software", name: "IT & Cybersecurity" },
  { id: "energy_solar", name: "Solar & Energy" },
  { id: "logistics", name: "Logistics & Fleet" },
  { id: "finance_bbbee", name: "Finance & B-BBEE" },
  { id: "security", name: "Security & Facilities" },
  { id: "hr_staffing", name: "HR & Staffing" },
];

export const OFFER_PRESETS: OfferPreset[] = [
  // Health, Safety & PPE
  {
    category: "she",
    industryLabel: "Safety",
    label: "Safety File Compliance",
    product: "Safety File Compliance & OHS Auditing",
    value: "100% DoEL / OSHA statutory compliance and instant audit-readiness to prevent site stoppages and penalties.",
    cta: "a complimentary 15-minute safety file compliance review",
  },
  {
    category: "she",
    industryLabel: "PPE",
    label: "Supply PPE & Workwear",
    product: "SABS/CE Certified PPE & Safety Workwear Supply",
    value: "Direct-to-site 24h replenishment, wholesale volume pricing, and guaranteed certified protective gear.",
    cta: "reviewing our wholesale PPE catalog and bulk pricing schedule",
  },
  {
    category: "she",
    industryLabel: "Software",
    label: "PPE Monitoring Software",
    product: "AI-Powered CCTV PPE & Safety Monitoring Software",
    value: "Automated real-time CCTV camera PPE violation detection, instant supervisor alerts, and automated audit logging.",
    cta: "a 10-minute live demonstration of the PPE detection dashboard",
  },
  {
    category: "she",
    industryLabel: "SHEQ",
    label: "ISO 45001 Certification",
    product: "ISO 45001 / ISO 9001 SHEQ Implementation & Auditing",
    value: "Fast-track gap analysis, integrated management systems, and guaranteed certification audit readiness.",
    cta: "a free initial gap-analysis consultation",
  },

  // Mining & Construction
  {
    category: "mining_construction",
    industryLabel: "Equipment",
    label: "Plant & Equipment Hire",
    product: "Heavy Earthmoving Equipment & Plant Hire",
    value: "Dry and wet plant hire with 98% uptime SLA, certified operators, and 24/7 on-site mobile mechanical support.",
    cta: "requesting our machinery availability and weekly rental rates",
  },
  {
    category: "mining_construction",
    industryLabel: "Steel",
    label: "Steel Fabrication & Rigging",
    product: "Structural Steel Fabrication & Precision Engineering",
    value: "Turnkey design, detailing, workshop fabrication, and site rigging certified to SANS structural standards.",
    cta: "submitting engineering drawings for a detailed cost quotation",
  },
  {
    category: "mining_construction",
    industryLabel: "Mining",
    label: "Conveyor Belting & Liners",
    product: "Industrial Conveyor Belting & Wear-Resistant Liners",
    value: "High-abrasion belting, pulley lagging, and fast on-site hot vulcanized splicing to minimize plant downtime.",
    cta: "a site survey of your plant conveyor and transfer points",
  },

  // IT & Cybersecurity
  {
    category: "it_software",
    industryLabel: "Cyber",
    label: "Managed Cybersecurity SOC",
    product: "Managed Cybersecurity & 24/7 SOC Threat Monitoring",
    value: "Zero-trust endpoint protection, ransomware defense, and real-time incident containment for enterprise IT.",
    cta: "a complimentary external cyber risk and vulnerability assessment",
  },
  {
    category: "it_software",
    industryLabel: "Cloud",
    label: "Cloud & AWS/Azure Migration",
    product: "Enterprise Cloud Migration & Infrastructure Optimization",
    value: "Cut infrastructure overhead by 35% while establishing automated backups and zero-downtime failover.",
    cta: "a 20-minute cloud architecture optimization review",
  },
  {
    category: "it_software",
    industryLabel: "ERP",
    label: "ERP & Workflow Automation",
    product: "Custom ERP, CRM & Business Process Automation",
    value: "Eliminate repetitive manual data entry, streamline procurement, and link sales pipelines directly with finance.",
    cta: "a 15-minute workflow demonstration tailored to your operations",
  },

  // Solar & Energy
  {
    category: "energy_solar",
    industryLabel: "Solar",
    label: "Commercial Solar & Storage",
    product: "Commercial & Industrial Solar PV + Battery Storage",
    value: "Zero-capex PPA financing, shield operations from grid power outages, and cut energy tariffs by up to 45%.",
    cta: "a free solar feasibility study based on your recent electricity accounts",
  },
  {
    category: "energy_solar",
    industryLabel: "Power",
    label: "Industrial Diesel Generators",
    product: "Industrial Generator Supply & Maintenance Contracts",
    value: "Silent diesel generator installation, automatic transfer switches (ATS), and guaranteed 2-hour breakdown support.",
    cta: "a site power load assessment and backup sizing review",
  },

  // Logistics & Fleet
  {
    category: "logistics",
    industryLabel: "Fleet",
    label: "Fleet Telematics & Fuel IoT",
    product: "IoT Fleet Telematics & CAN-Bus Fuel Theft Prevention",
    value: "Real-time fuel consumption telemetry, driver safety scoring, and average 20% reduction in fleet operating costs.",
    cta: "a 14-day free pilot on 2 of your fleet vehicles",
  },
  {
    category: "logistics",
    industryLabel: "Freight",
    label: "Cross-Border Road Haulage",
    product: "Cross-Border Road Freight & Warehousing Distribution",
    value: "Dedicated fleet haulage, bonded customs clearance, and end-to-end satellite GPS cargo visibility.",
    cta: "comparing our contracted route rate-card with your current freight expenditure",
  },

  // Finance & B-BBEE
  {
    category: "finance_bbbee",
    industryLabel: "B-BBEE",
    label: "B-BBEE Scorecard Advisory",
    product: "B-BBEE Strategic Advisory & Scorecard Maximization",
    value: "Structure preferential procurement and skills development to achieve Level 1/2 compliance cost-effectively.",
    cta: "a complimentary scorecard simulation and verification audit roadmap",
  },
  {
    category: "finance_bbbee",
    industryLabel: "Finance",
    label: "Invoice Discounting & PO Finance",
    product: "Supply Chain & Invoice Factoring / PO Financing",
    value: "Unlock up to 80% of outstanding debtor invoice value within 48 hours to fund operational expansion and purchase orders.",
    cta: "a confidential working capital facility review",
  },

  // Security & Facilities
  {
    category: "security",
    industryLabel: "CCTV",
    label: "Off-Site CCTV AI Monitoring",
    product: "AI-Powered Off-Site CCTV Video Monitoring & Rapid Response",
    value: "Proactive perimeter intrusion detection, live audio voice-down deterrence, and armed tactical dispatch integration.",
    cta: "a free perimeter security audit of your facility",
  },
  {
    category: "security",
    industryLabel: "Access",
    label: "Biometric Access & Time",
    product: "Biometric Access Control & Time & Attendance Systems",
    value: "High-speed facial recognition, anti-passback turnstiles, and automated payroll hours sync.",
    cta: "a brief on-site demonstration of our biometric access hardware",
  },

  // HR & Staffing
  {
    category: "hr_staffing",
    industryLabel: "Staffing",
    label: "Engineering & Artisan Placement",
    product: "Specialized Engineering & Artisan Technical Staffing",
    value: "Pre-screened, certified artisans and engineering specialists supplied on flexible temporary or permanent contracts.",
    cta: "discussing your upcoming project workforce requirements",
  },
];

interface ContextFormProps {
  industryList: string[];
  selectedPersonId: string;
  selectedCompanyId: string;
  onSelectPerson: (person: DecisionMaker) => void;
  onSelectCompany: (company: Organization) => void;
  person: Partial<PersonContext>;
  setPerson: React.Dispatch<React.SetStateAction<Partial<PersonContext>>>;
  company: Partial<CompanyContext>;
  setCompany: React.Dispatch<React.SetStateAction<Partial<CompanyContext>>>;
  offer: OutreachOfferContext;
  setOffer: React.Dispatch<React.SetStateAction<OutreachOfferContext>>;
  senderName: string;
  setSenderName: (val: string) => void;
  senderTitle: string;
  setSenderTitle: (val: string) => void;
  painPoints: string[];
  loading: boolean;
  onGenerate: () => void;
}

export function ContextForm({
  industryList,
  selectedPersonId,
  selectedCompanyId,
  onSelectPerson,
  onSelectCompany,
  person,
  setPerson,
  company,
  setCompany,
  offer,
  setOffer,
  senderName,
  setSenderName,
  senderTitle,
  setSenderTitle,
  painPoints,
  loading,
  onGenerate,
}: ContextFormProps) {
  // Contact Search State
  const [contactQuery, setContactQuery] = React.useState("");
  const [contactResults, setContactResults] = React.useState<DecisionMaker[]>([]);
  const [contactTotal, setContactTotal] = React.useState(0);
  const [contactPage, setContactPage] = React.useState(1);
  const [contactTotalPages, setContactTotalPages] = React.useState(1);
  const [searchingContacts, setSearchingContacts] = React.useState(false);
  const [contactDropdownOpen, setContactDropdownOpen] = React.useState(false);
  const contactRef = React.useRef<HTMLDivElement>(null);

  // Organization Search State
  const [orgQuery, setOrgQuery] = React.useState("");
  const [orgResults, setOrgResults] = React.useState<Organization[]>([]);
  const [orgTotal, setOrgTotal] = React.useState(0);
  const [orgPage, setOrgPage] = React.useState(1);
  const [orgTotalPages, setOrgTotalPages] = React.useState(1);
  const [searchingOrgs, setSearchingOrgs] = React.useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = React.useState(false);
  const orgRef = React.useRef<HTMLDivElement>(null);

  // Quick Preset Category Filter
  const [selectedPresetCategory, setSelectedPresetCategory] = React.useState("all");

  // Sync inputs with selected entity names if changed externally (e.g. from URL params)
  React.useEffect(() => {
    if (person.full_name) {
      setContactQuery(person.full_name);
    } else if (person.fname) {
      setContactQuery(`${person.fname} ${person.lname || ""}`.trim());
    }
  }, [person.full_name, person.fname, person.lname]);

  React.useEffect(() => {
    if (company.name) {
      setOrgQuery(company.name);
    }
  }, [company.name]);

  // Click outside to close dropdowns
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setContactDropdownOpen(false);
      }
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Database search for Contacts: only searches when >= 2 letters, focusing on starts with in both first & last names
  React.useEffect(() => {
    const trimmed = contactQuery.trim();
    if (trimmed.length < 2) {
      setContactResults([]);
      setContactTotal(0);
      setContactTotalPages(1);
      setSearchingContacts(false);
      return;
    }

    let cancelled = false;
    setSearchingContacts(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchDecisionMakersByNamePrefixAction(trimmed, { page: contactPage, pageSize: 20 });
        if (!cancelled) {
          setContactResults(results.people);
          setContactTotal(results.total);
          setContactTotalPages(results.totalPages);
        }
      } catch (err) {
        console.error("Failed to search contacts:", err);
        if (!cancelled) {
          setContactResults([]);
          setContactTotal(0);
          setContactTotalPages(1);
        }
      } finally {
        if (!cancelled) setSearchingContacts(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [contactQuery, contactPage]);

  // Database search for Organizations: only searches when >= 2 letters, focusing on starts with in company name
  React.useEffect(() => {
    const trimmed = orgQuery.trim();
    if (trimmed.length < 2) {
      setOrgResults([]);
      setOrgTotal(0);
      setOrgTotalPages(1);
      setSearchingOrgs(false);
      return;
    }

    let cancelled = false;
    setSearchingOrgs(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchOrganizationsByNamePrefixAction(trimmed, { page: orgPage, pageSize: 20 });
        if (!cancelled) {
          setOrgResults(results.organizations);
          setOrgTotal(results.total);
          setOrgTotalPages(results.totalPages);
        }
      } catch (err) {
        console.error("Failed to search organizations:", err);
        if (!cancelled) {
          setOrgResults([]);
          setOrgTotal(0);
          setOrgTotalPages(1);
        }
      } finally {
        if (!cancelled) setSearchingOrgs(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orgQuery, orgPage]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Person Context */}
        <Card className="bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <User className="h-3.5 w-3.5 text-indigo-400" /> Person Context
            </div>
            {selectedPersonId && (
              <Badge
                variant="outline"
                className="text-[9px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-mono"
              >
                Contact #{selectedPersonId}
              </Badge>
            )}
          </div>

          {/* Searchable Contact Input (Database search, min 2 letters, starts with first & last name) */}
          <div className="space-y-1 relative" ref={contactRef}>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground font-semibold">
                Load Contact
              </Label>
              {contactQuery.trim().length >= 2 && (
                <span className="text-[9px] text-muted-foreground font-mono">
                  {searchingContacts
                    ? "Searching…"
                    : `${contactTotal} found`}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={contactQuery}
                onFocus={() => {
                  if (contactQuery.trim().length >= 2) {
                    setContactDropdownOpen(true);
                  }
                }}
                onChange={(e) => {
                  setContactQuery(e.target.value);
                  setContactPage(1);
                  setContactDropdownOpen(true);
                }}
                placeholder="Search contact by first or last name…"
                className="pl-8 pr-7 h-8 text-xs bg-muted/40 border-border/60 font-medium placeholder:text-muted-foreground/50"
              />
              {contactQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setContactQuery("");
                    setContactResults([]);
                    setContactTotal(0);
                    setContactPage(1);
                    setContactTotalPages(1);
                    setContactDropdownOpen(false);
                    setPerson({
                      fname: "",
                      lname: "",
                      full_name: "",
                      title: "",
                      department: "",
                      seniority: "",
                    });
                  }}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  title="Clear contact search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {/* Dropdown: ONLY searched items appear, and only after typing 2 letters */}
            {contactDropdownOpen && contactQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-card/95 backdrop-blur-md border border-border/70 rounded-xl shadow-2xl overflow-hidden py-1 max-h-64 overflow-y-auto">
                {searchingContacts ? (
                  <div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    <span>Searching…</span>
                  </div>
                ) : contactResults.length > 0 ? (
                  <>
                    {contactResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectPerson(p);
                          setContactQuery(p.name);
                          setContactDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-muted/60 transition-colors flex items-center justify-between gap-2 border-b border-border/20 last:border-0"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {p.name
                              .split(" ")
                              .filter(Boolean)
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {p.title || p.job_title || "Executive"} {p.company_name ? `· ${p.company_name}` : ""}
                            </p>
                          </div>
                        </div>
                        {String(selectedPersonId) === String(p.id) && (
                          <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        )}
                      </button>
                    ))}
                    {contactTotalPages > 1 && (
                      <div className="sticky bottom-0 flex items-center justify-between px-3 py-1.5 border-t border-border/50 bg-card/95 backdrop-blur text-[10px]">
                        <span className="text-muted-foreground font-mono">
                          Page {contactPage} / {contactTotalPages} ({contactTotal} total)
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={contactPage <= 1 || searchingContacts}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContactPage((p) => Math.max(1, p - 1));
                            }}
                            className="h-5 px-2 text-[10px] hover:bg-muted"
                          >
                            Prev
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={contactPage >= contactTotalPages || searchingContacts}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContactPage((p) => Math.min(contactTotalPages, p + 1));
                            }}
                            className="h-5 px-2 text-[10px] hover:bg-muted"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No contacts found starting with &ldquo;{contactQuery.trim()}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2.5 text-xs pt-1 border-t border-border/30">
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">First Name</Label>
                <Input
                  value={person.fname || ""}
                  onChange={(e) =>
                    setPerson((p) => ({
                      ...p,
                      fname: e.target.value,
                      full_name: `${e.target.value} ${p.lname || ""}`.trim(),
                    }))
                  }
                  className="h-8 text-xs bg-muted/40 border-border/60"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Last Name</Label>
                <Input
                  value={person.lname || ""}
                  onChange={(e) =>
                    setPerson((p) => ({
                      ...p,
                      lname: e.target.value,
                      full_name: `${p.fname || ""} ${e.target.value}`.trim(),
                    }))
                  }
                  className="h-8 text-xs bg-muted/40 border-border/60"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Job Title</Label>
              <Input
                value={person.title || ""}
                onChange={(e) =>
                  setPerson((p) => ({ ...p, title: e.target.value }))
                }
                className="h-8 text-xs bg-muted/40 border-border/60"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Department</Label>
                <select
                  value={person.department}
                  onChange={(e) =>
                    setPerson((p) => ({ ...p, department: e.target.value }))
                  }
                  className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8"
                >
                  {[
                    "",
                    "Operations",
                    "Engineering",
                    "Finance",
                    "Sales",
                    "Marketing",
                    "IT",
                    "Legal",
                    "HR",
                    "Security",
                    "Procurement",
                  ].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Seniority</Label>
                <select
                  value={person.seniority}
                  onChange={(e) =>
                    setPerson((p) => ({
                      ...p,
                      seniority: e.target.value as PersonContext["seniority"],
                    }))
                  }
                  className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8"
                >
                  {[
                    "",
                    "C-Suite",
                    "VP",
                    "Director",
                    "Manager",
                    "Individual Contributor",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Company Context */}
        <Card className="bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Building2 className="h-3.5 w-3.5 text-purple-400" /> Company Context
            </div>
          </div>

          {/* Searchable Organization Input (Database search, min 2 letters, starts with company name) */}
          <div className="space-y-1 relative" ref={orgRef}>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground font-semibold">
                Load Organization
              </Label>
              {orgQuery.trim().length >= 2 && (
                <span className="text-[9px] text-muted-foreground font-mono">
                  {searchingOrgs
                    ? "Searching…"
                    : `${orgTotal} found`}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={orgQuery}
                onFocus={() => {
                  if (orgQuery.trim().length >= 2) {
                    setOrgDropdownOpen(true);
                  }
                }}
                onChange={(e) => {
                  setOrgQuery(e.target.value);
                  setOrgPage(1);
                  setOrgDropdownOpen(true);
                }}
                placeholder="Search company by name…"
                className="pl-8 pr-7 h-8 text-xs bg-muted/40 border-border/60 font-medium placeholder:text-muted-foreground/50"
              />
              {orgQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setOrgQuery("");
                    setOrgResults([]);
                    setOrgTotal(0);
                    setOrgPage(1);
                    setOrgTotalPages(1);
                    setOrgDropdownOpen(false);
                    setCompany({
                      name: "",
                      industry: "",
                      size: "",
                      location: "",
                      country: "",
                      challenges: [],
                    });
                  }}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  title="Clear organization search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {/* Dropdown: ONLY searched items appear, and only after typing 2 letters */}
            {orgDropdownOpen && orgQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-card/95 backdrop-blur-md border border-border/70 rounded-xl shadow-2xl overflow-hidden py-1 max-h-64 overflow-y-auto">
                {searchingOrgs ? (
                  <div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                    <span>Searching…</span>
                  </div>
                ) : orgResults.length > 0 ? (
                  <>
                    {orgResults.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          onSelectCompany(org);
                          setOrgQuery(org.name);
                          setOrgDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-muted/60 transition-colors flex items-center justify-between gap-2 border-b border-border/20 last:border-0"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{org.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {org.primary_industry || org.industry || "General"}{" "}
                              {org.city || org.country
                                ? `· ${[org.city, org.country].filter(Boolean).join(", ")}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        {String(selectedCompanyId) === String(org.id) && (
                          <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        )}
                      </button>
                    ))}
                    {orgTotalPages > 1 && (
                      <div className="sticky bottom-0 flex items-center justify-between px-3 py-1.5 border-t border-border/50 bg-card/95 backdrop-blur text-[10px]">
                        <span className="text-muted-foreground font-mono">
                          Page {orgPage} / {orgTotalPages} ({orgTotal} total)
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={orgPage <= 1 || searchingOrgs}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOrgPage((p) => Math.max(1, p - 1));
                            }}
                            className="h-5 px-2 text-[10px] hover:bg-muted"
                          >
                            Prev
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={orgPage >= orgTotalPages || searchingOrgs}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOrgPage((p) => Math.min(orgTotalPages, p + 1));
                            }}
                            className="h-5 px-2 text-[10px] hover:bg-muted"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No organizations found starting with &ldquo;{orgQuery.trim()}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2.5 text-xs pt-1 border-t border-border/30">
            <div className="space-y-1">
              <Label className="text-[10px]">Company Name</Label>
              <Input
                value={company.name || ""}
                onChange={(e) =>
                  setCompany((c) => ({ ...c, name: e.target.value }))
                }
                className="h-8 text-xs bg-muted/40 border-border/60"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Industry</Label>
              <select
                value={company.industry}
                onChange={(e) =>
                  setCompany((c) => ({ ...c, industry: e.target.value }))
                }
                className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8"
              >
                {(industryList.length > 0
                  ? ["", ...industryList]
                  : [""]
                ).map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Company Size</Label>
                <select
                  value={company.size}
                  onChange={(e) =>
                    setCompany((c) => ({
                      ...c,
                      size: e.target.value as CompanyContext["size"],
                    }))
                  }
                  className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8"
                >
                  {[
                    "",
                    "Startup (<50)",
                    "SMB (50-250)",
                    "Mid-Market (250-1000)",
                    "Enterprise (1000+)",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Location</Label>
                <Input
                  value={company.location || ""}
                  onChange={(e) =>
                    setCompany((c) => ({ ...c, location: e.target.value }))
                  }
                  className="h-8 text-xs bg-muted/40 border-border/60"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Column 3: Sender Identity & Industry Pain Points */}
        <div className="space-y-4">
          {/* Sender Identity */}
          <Card className="bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Send className="h-3.5 w-3.5 text-emerald-400" /> Sender Identity
              </div>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <Label className="text-[10px]">Your Name</Label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="h-8 text-xs bg-muted/40 border-border/60"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Your Title</Label>
                <Input
                  value={senderTitle}
                  onChange={(e) => setSenderTitle(e.target.value)}
                  className="h-8 text-xs bg-muted/40 border-border/60"
                />
              </div>
            </div>
          </Card>

          {/* Industry Pain Points Quick Reference */}
          {company.industry && painPoints.length > 0 && (
            <Card className="border-border/40 bg-muted/20 p-3 space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                {company.industry} — Key Pain Points
              </p>
              <ul className="space-y-1">
                {painPoints.map((p) => (
                  <li
                    key={p}
                    className="text-[11px] text-muted-foreground flex items-start gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />{" "}
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Product & Offer Directive (What are you selling?) */}
      <Card className="bg-card border-indigo-500/20 bg-gradient-to-br from-card via-card to-indigo-950/10 p-4 space-y-3.5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border/40 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Package className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                What Are You Selling? (Product & Offer Directive)
                <Badge variant="outline" className="text-[9px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  Directs AI Copy
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tell specifically what product, service, or compliance solution you are pitching so all emails and scripts directly pitch your offering.
              </p>
            </div>
          </div>

          {/* Quick Presets by Industry */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                <span>Industry Offer Presets:</span>
              </div>
              {(offer.product_service || offer.value_proposition || offer.call_to_action) && (
                <button
                  type="button"
                  onClick={() =>
                    setOffer({
                      product_service: "",
                      value_proposition: "",
                      call_to_action: "",
                    })
                  }
                  className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors underline"
                >
                  Clear Offer
                </button>
              )}
            </div>

            {/* Industry Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_CATEGORIES.map((cat) => {
                const count =
                  cat.id === "all"
                    ? OFFER_PRESETS.length
                    : OFFER_PRESETS.filter((p) => p.category === cat.id).length;
                const isSelected = selectedPresetCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedPresetCategory(cat.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs"
                        : "bg-muted/40 hover:bg-muted/70 text-muted-foreground border-border/50"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Presets Grid/List */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {OFFER_PRESETS.filter(
                (p) =>
                  selectedPresetCategory === "all" ||
                  p.category === selectedPresetCategory
              ).map((preset) => {
                const isActive = offer.product_service === preset.product;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setOffer({
                        product_service: preset.product,
                        value_proposition: preset.value,
                        call_to_action: preset.cta,
                      })
                    }
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-semibold shadow-xs"
                        : "border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-300 hover:border-indigo-500/40"
                    }`}
                  >
                    {isActive ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        {preset.industryLabel}
                      </span>
                    )}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-foreground flex items-center justify-between">
              <span>Product / Service / Solution</span>
              <span className="text-[9px] text-muted-foreground font-normal">e.g. Safety File, PPE Supply</span>
            </Label>
            <Input
              value={offer.product_service || ""}
              onChange={(e) => setOffer((prev) => ({ ...prev, product_service: e.target.value }))}
              placeholder="e.g. Safety File Preparation, PPE Supply, PPE Monitoring Software..."
              className="h-8 text-xs bg-muted/40 border-border/60 font-medium"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-foreground flex items-center justify-between">
              <span>Value Proposition / Pitch Angle</span>
              <span className="text-[9px] text-muted-foreground font-normal">Why should they care?</span>
            </Label>
            <Input
              value={offer.value_proposition || ""}
              onChange={(e) => setOffer((prev) => ({ ...prev, value_proposition: e.target.value }))}
              placeholder="e.g. Prevent site stoppage fines, guaranteed 24h delivery, automated AI detection..."
              className="h-8 text-xs bg-muted/40 border-border/60"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-semibold text-foreground flex items-center justify-between">
              <span>Desired Call to Action (CTA)</span>
              <span className="text-[9px] text-muted-foreground font-normal">Next step</span>
            </Label>
            <Input
              value={offer.call_to_action || ""}
              onChange={(e) => setOffer((prev) => ({ ...prev, call_to_action: e.target.value }))}
              placeholder="e.g. a brief 15-minute introductory call, receiving a free site safety audit..."
              className="h-8 text-xs bg-muted/40 border-border/60"
            />
          </div>
        </div>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={loading || !person.fname || !company.name}
        className="w-full h-11 gap-2 font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-50 shadow-lg shadow-indigo-500/20"
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" /> Generating Outreach…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Generate Personalized Messages
          </>
        )}
      </Button>
    </div>
  );
}
