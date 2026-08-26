"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as organizationServices from "@/services/public/organizationServices";
import * as industryServices from "@/services/public/industryServices";
import type { Organization, Industry } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Search, Filter, SlidersHorizontal, Users, DollarSign } from "lucide-react";
import { CompanyBanner } from "./_components/company-banner";
import { CompanyTableRow } from "./_components/company-table-row";

const DEFAULT_PAGE_SIZE = 30;

export default function CompaniesPage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [industryFilter, setIndustryFilter] = React.useState("all");
  const [employeeFilter, setEmployeeFilter] = React.useState("all");
  const [revenueFilter, setRevenueFilter] = React.useState("all");
  const [industries, setIndustries] = React.useState<Industry[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [companies, setCompanies] = React.useState<Organization[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Load real industries from backend
  React.useEffect(() => {
    (async () => {
      try {
        const res = await industryServices.getIndustries({ limit: 0 });
        setIndustries(res?.industries || []);
      } catch (err) {
        console.error("Failed to load industries from backend:", err);
      }
    })();
  }, []);

  const loadCompanies = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await organizationServices.getOrganizations({
        search,
        industry: industryFilter === "all" ? undefined : industryFilter,
        employee_range: employeeFilter === "all" ? undefined : employeeFilter,
        revenue_range: revenueFilter === "all" ? undefined : revenueFilter,
        page,
        pageSize,
      });
      setCompanies(res?.organizations || []);
      setTotal(res?.total || 0);
    } catch (e) {
      console.error("Failed to load organizations:", e);
    } finally {
      setLoading(false);
    }
  }, [search, industryFilter, employeeFilter, revenueFilter, page, pageSize]);

  React.useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  React.useEffect(() => {
    setPage(1); // Reset to page 1 on search or filter changes
  }, [search, industryFilter, employeeFilter, revenueFilter]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Organizations Intelligence"
          subtitle="Enterprise organization database built with server-side pagination & virtualized rendering for 200,000+ records"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-5 w-full mx-auto overflow-y-auto">
          {/* Scale Summary Banner */}
          <CompanyBanner companies={companies} total={total} />

          {/* Filtering Header */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations by name, domain, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 text-xs h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Industry Filter (Loaded from backend) */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
                <Filter className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Industry:</span>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="bg-transparent text-foreground text-xs outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="all">All Industries</option>
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.name} className="bg-card text-foreground">
                      {ind.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Employees Filter */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
                <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Employees:</span>
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="bg-transparent text-foreground text-xs outline-none cursor-pointer"
                >
                  <option value="all">All Sizes</option>
                  <option value="1-10" className="bg-card text-foreground">1 - 10</option>
                  <option value="11-50" className="bg-card text-foreground">11 - 50</option>
                  <option value="51-200" className="bg-card text-foreground">51 - 200</option>
                  <option value="201-500" className="bg-card text-foreground">201 - 500</option>
                  <option value="501-1000" className="bg-card text-foreground">501 - 1,000</option>
                  <option value="1000+" className="bg-card text-foreground">1,000+</option>
                </select>
              </div>

              {/* Annual Revenue Filter */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Revenue:</span>
                <select
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value)}
                  className="bg-transparent text-foreground text-xs outline-none cursor-pointer"
                >
                  <option value="all">All Revenues</option>
                  <option value="<1M" className="bg-card text-foreground">&lt; $1M</option>
                  <option value="1M-10M" className="bg-card text-foreground">$1M - $10M</option>
                  <option value="10M-50M" className="bg-card text-foreground">$10M - $50M</option>
                  <option value="50M-100M" className="bg-card text-foreground">$50M - $100M</option>
                  <option value="100M+" className="bg-card text-foreground">$100M+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Virtualized Scale Table */}
          <Card className="border-border/50 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[10px] border-b border-border/50">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Industries</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Employees</th>
                    <th className="p-3">Annual Revenue</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Loading organizations...
                      </td>
                    </tr>
                  ) : companies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No organizations found.
                      </td>
                    </tr>
                  ) : (
                    companies.map((c) => <CompanyTableRow key={c.id} company={c} />)
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Bottom Pagination Footer */}
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[DEFAULT_PAGE_SIZE, 50, 100]}
            itemLabel="organizations"
          />
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
