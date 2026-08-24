"use client";

import * as React from "react";
import Link from "next/link";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as peopleServices from "@/services/public/peopleServices";
import { DecisionMaker } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Search,
  Users,
  ArrowRight,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Linkedin,
  Mail,
  Phone,
} from "lucide-react";

const SENIORITY_OPTIONS = ["all", "C-Suite", "VP", "Director", "Manager", "Individual Contributor"];
const DEPARTMENT_OPTIONS = [
  "all",
  "Engineering & Technology",
  "Security & Compliance",
  "Product & Engineering",
  "Operations & Procurement",
  "Operations & Strategy",
  "Sales & Revenue",
];
const INDUSTRY_OPTIONS = [
  "all",
  "Cloud Infrastructure",
  "Cybersecurity",
  "Fintech & AI",
  "Healthcare Tech",
  "Logistics & Supply Chain",
  "Robotics & Automation",
];
const COMPANY_OPTIONS = [
  "all",
  "Acme Enterprise Corp",
  "Apex CyberSecurity",
  "FinPulse Financial AI",
  "BioHealth Diagnostics",
  "OmniLogistics Systems",
  "Nexus Robotics Solutions",
];

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 90
      ? "text-emerald-400 border-emerald-400"
      : score >= 75
        ? "text-amber-400 border-amber-400"
        : "text-blue-400 border-blue-400";
  return (
    <div
      className={`h-9 w-9 rounded-full border-2 flex items-center justify-center font-bold text-[11px] font-mono shrink-0 ${color}`}
    >
      {score}
    </div>
  );
}

export default function PeoplePage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [people, setPeople] = React.useState<DecisionMaker[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState("");
  const [filterIndustry, setFilterIndustry] = React.useState("all");
  const [filterCompany, setFilterCompany] = React.useState("all");
  const [filterDepartment, setFilterDepartment] = React.useState("all");
  const [filterSeniority, setFilterSeniority] = React.useState("all");
  const [filterLocation, setFilterLocation] = React.useState("");

  // Sorting
  const [sortBy, setSortBy] = React.useState("score");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await peopleServices.getDecisionMakersAction({
      search,
      industry: filterIndustry,
      company_name: filterCompany,
      department: filterDepartment,
      seniority: filterSeniority,
      location: filterLocation || undefined,
    });
    const people = res?.people || [];

    // Client-side sort
    const sorted = [...people].sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      if (sortBy === "score") { va = a.score ?? 0; vb = b.score ?? 0; }
      else if (sortBy === "name") { va = a.name; vb = b.name; }
      else if (sortBy === "seniority") {
        const order = ["C-Suite", "VP", "Director", "Manager", "Individual Contributor"];
        va = order.indexOf(a.seniority ?? "Manager");
        vb = order.indexOf(b.seniority ?? "Manager");
      }
      if (va < vb) return sortOrder === "asc" ? -1 : 1;
      if (va > vb) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setPeople(sorted);
    setLoading(false);
  }, [search, filterIndustry, filterCompany, filterDepartment, filterSeniority, filterLocation, sortBy, sortOrder]);

  React.useEffect(() => { load(); }, [load]);

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortOrder("desc"); }
  };

  const totalPages = Math.ceil(people.length / pageSize) || 1;
  const paged = people.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setSearch(""); setFilterIndustry("all"); setFilterCompany("all");
    setFilterDepartment("all"); setFilterSeniority("all"); setFilterLocation("");
    setCurrentPage(1);
  };

  const hasFilters = search || filterIndustry !== "all" || filterCompany !== "all" || filterDepartment !== "all" || filterSeniority !== "all" || filterLocation;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="People & Decision Maker Intelligence"
          subtitle="Verified business contacts & buyer intent scoring"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-5 mx-auto overflow-y-auto w-full">

          {/* Filter Controls */}
          <div className="bg-card p-4 rounded-xl backdrop-blur-xl space-y-3">
            {/* Search Row */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, company, email, location..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="pl-9 bg-muted/40 text-xs h-9"
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-[11px] h-9 text-indigo-400 hover:text-indigo-300 shrink-0">
                  Reset Filters
                </Button>
              )}
            </div>

            {/* Filter Dropdowns Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-border/30 text-xs">
              <span className="text-muted-foreground font-semibold flex items-center gap-1.5 shrink-0">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters:
              </span>

              {[
                { label: "Industry", options: INDUSTRY_OPTIONS, value: filterIndustry, set: setFilterIndustry },
                { label: "Company", options: COMPANY_OPTIONS, value: filterCompany, set: setFilterCompany },
                { label: "Department", options: DEPARTMENT_OPTIONS, value: filterDepartment, set: setFilterDepartment },
                { label: "Seniority", options: SENIORITY_OPTIONS, value: filterSeniority, set: setFilterSeniority },
              ].map((f) => (
                <select
                  key={f.label}
                  value={f.value}
                  onChange={(e) => { f.set(e.target.value); setCurrentPage(1); }}
                  className="bg-muted/40 border border-border/60 rounded-md px-2.5 py-1.5 text-xs outline-none text-foreground"
                >
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o === "all" ? `All ${f.label}s` : o}
                    </option>
                  ))}
                </select>
              ))}

              {/* Location text filter */}
              <input
                type="text"
                placeholder="Location..."
                value={filterLocation}
                onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
                className="bg-muted/40 border border-border/60 rounded-md px-2.5 py-1.5 text-xs outline-none text-foreground placeholder:text-muted-foreground w-28"
              />
            </div>
          </div>

          {/* People Table */}
          <Card className="border-border/50 bg-card backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground text-[11px] font-semibold uppercase">
                    <th className="p-3.5 w-8">{/* Avatar */}</th>
                    <th className="p-3.5 cursor-pointer hover:text-foreground" onClick={() => toggleSort("name")}>
                      <div className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="p-3.5">Job Title</th>
                    <th className="p-3.5">Company</th>
                    <th className="p-3.5">Industry</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5 cursor-pointer hover:text-foreground" onClick={() => toggleSort("seniority")}>
                      <div className="flex items-center gap-1">Seniority <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">LinkedIn</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5 cursor-pointer hover:text-foreground" onClick={() => toggleSort("score")}>
                      <div className="flex items-center gap-1">Score <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="p-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={13} className="p-4 bg-card/20" />
                      </tr>
                    ))
                  ) : paged.length > 0 ? (
                    paged.map((person) => (
                      <tr key={person.id} className="hover:bg-muted/40 transition-colors group">
                        {/* Avatar */}
                        <td className="p-3.5">
                          <img
                            src={person.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"}
                            alt={person.name}
                            className="h-8 w-8 rounded-full object-cover border border-indigo-500/30"
                          />
                        </td>

                        {/* Name + Verified */}
                        <td className="p-3.5 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/people/${person.id}`} className="hover:text-indigo-400 font-bold whitespace-nowrap">
                              {person.name}
                            </Link>
                            {person.verified ? (
                              <span title="Verified" className="inline-flex shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              </span>
                            ) : (
                              <span title="Unverified" className="inline-flex shrink-0">
                                <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Job Title */}
                        <td className="p-3.5 text-muted-foreground max-w-[140px]">
                          <span className="truncate block">{person.title}</span>
                        </td>

                        {/* Company */}
                        <td className="p-3.5">
                          <Link href={`/companies/${person.company_id || person.company?.id}`} className="text-indigo-400 hover:text-indigo-300 whitespace-nowrap font-medium">
                            {person.company_name || person.company?.name || "Company"}
                          </Link>
                        </td>

                        {/* Industry */}
                        <td className="p-3.5">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-normal text-[10px] whitespace-nowrap">
                            {person.industry || "Technology"}
                          </Badge>
                        </td>

                        {/* Department */}
                        <td className="p-3.5 text-muted-foreground max-w-[140px]">
                          <span className="truncate block text-[11px]">{person.department || "—"}</span>
                        </td>

                        {/* Seniority */}
                        <td className="p-3.5">
                          <Badge
                            className={
                              person.seniority === "C-Suite"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : person.seniority === "VP"
                                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                  : person.seniority === "Director"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }
                          >
                            {person.seniority || "Manager"}
                          </Badge>
                        </td>

                        {/* Email */}
                        <td className="p-3.5 font-mono text-[10px]">
                          <a href={`mailto:${person.email}`} className="text-muted-foreground hover:text-indigo-400 flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[130px] block">{person.email}</span>
                          </a>
                        </td>

                        {/* Phone */}
                        <td className="p-3.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                          {person.phone ? (
                            <a href={`tel:${person.phone}`} className="flex items-center gap-1 hover:text-indigo-400">
                              <Phone className="h-3 w-3 shrink-0" /> {person.phone}
                            </a>
                          ) : "—"}
                        </td>

                        {/* LinkedIn */}
                        <td className="p-3.5">
                          {person.linkedin_url ? (
                            <a href={person.linkedin_url} target="_blank" rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px]">
                              <Linkedin className="h-3.5 w-3.5" /> View
                            </a>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>

                        {/* Location */}
                        <td className="p-3.5 text-muted-foreground text-[11px] whitespace-nowrap">
                          {person.location || "—"}
                        </td>

                        {/* Decision Maker Score */}
                        <td className="p-3.5">
                          <ScoreRing score={person.score ?? 80} />
                        </td>

                        {/* Profile Link */}
                        <td className="p-3.5">
                          <Link href={`/people/${person.id}`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
                            Profile <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={13} className="p-10 text-center text-muted-foreground text-xs">
                        No decision makers found matching your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>{people.length} contacts · Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)} className="h-8 px-2 text-xs border-border/60">
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)} className="h-8 px-2 text-xs border-border/60">
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
