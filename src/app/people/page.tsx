"use client";

import * as React from "react";
import Link from "next/link";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as peopleServices from "@/services/public/peopleServices";
import type { DecisionMaker } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DecisionMakerRow } from "./_components/decision-maker-row";
import {
  Search,
  Users,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
} from "lucide-react";

const SENIORITY_OPTIONS = [
  "all",
  "C-Suite",
  "VP",
  "Director",
  "Manager",
  "Individual Contributor",
];
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

const DEFAULT_PAGE_SIZE = 30;

export default function PeoplePage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [people, setPeople] = React.useState<DecisionMaker[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState("");
  const [filterIndustry, setFilterIndustry] = React.useState("all");
  const [filterCompany, setFilterCompany] = React.useState("all");
  const [filterDepartment, setFilterDepartment] = React.useState("all");
  const [filterSeniority, setFilterSeniority] = React.useState("all");
  const [filterLocation, setFilterLocation] = React.useState("");

  // Sort
  const [sortBy, setSortBy] = React.useState<string>("score");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { people: rawPeople, total: countTotal } = await peopleServices.getDecisionMakers({
      search,
      industry: filterIndustry,
      company_name: filterCompany,
      department: filterDepartment,
      seniority: filterSeniority,
      location: filterLocation || undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    });

    setPeople(rawPeople);
    setTotal(countTotal);
    setLoading(false);
  }, [search, filterIndustry, filterCompany, filterDepartment, filterSeniority, filterLocation, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filterIndustry, filterCompany, filterDepartment, filterSeniority, filterLocation]);

  React.useEffect(() => { load(); }, [load]);

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortOrder("desc"); }
  };

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
          subtitle="Hasura aa_s_decision_makers · Verified business contacts & buyer intent scoring"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-5 max-w-[1400px] mx-auto overflow-y-auto">

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
                  ) : people.length > 0 ? (
                    people.map((person) => (
                      <DecisionMakerRow key={person.id} person={person} />
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
          </Card>

          {/* Pagination */}
          <DataTablePagination
            page={currentPage}
            pageSize={pageSize}
            total={total}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[DEFAULT_PAGE_SIZE, 50, 100]}
            itemLabel="decision makers"
          />
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
