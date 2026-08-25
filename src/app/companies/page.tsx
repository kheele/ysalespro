"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as organizationServices from "@/services/public/organizationServices";
import type { Organization } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { CompanyBanner } from "./_components/company-banner";
import { CompanyTableRow } from "./_components/company-table-row";

const DEFAULT_PAGE_SIZE = 30;

export default function CompaniesPage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [industryFilter, setIndustryFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [companies, setCompanies] = React.useState<Organization[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const loadCompanies = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await organizationServices.getOrganizations({
        search,
        industry: industryFilter === "all" ? undefined : industryFilter,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setCompanies(res?.organizations || []);
      setTotal(res?.total || 0);
    } catch (e) {
      console.error("Failed to load organizations:", e);
    } finally {
      setLoading(false);
    }
  }, [search, industryFilter, page, pageSize]);

  React.useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  React.useEffect(() => {
    setPage(1); // Reset to page 1 on search change
  }, [search, industryFilter]);

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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search 2,200+ organizations by name, domain, industry, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg">
                <Filter className="h-3.5 w-3.5 text-indigo-400" />
                <span>Industry:</span>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="bg-transparent text-foreground text-xs outline-none cursor-pointer"
                >
                  <option value="all">All Industries</option>
                  <option value="Mining & Metals">Mining & Metals</option>
                  <option value="Construction & Engineering">Construction & Engineering</option>
                  <option value="Heavy Machinery & Industrial Equipment">Heavy Machinery & Industrial Equipment</option>
                  <option value="Technology & Cloud">Technology & Cloud</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                  <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                </select>
              </div>

              <div className="flex items-center gap-1 border border-border/50 rounded-lg p-0.5 bg-muted/20">
                <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" /> Filters
                </Button>
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
                    <th className="p-3">Company Name</th>
                    <th className="p-3">Industry Vertical</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Employees</th>
                    <th className="p-3">Annual Revenue</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Loading organizations...
                      </td>
                    </tr>
                  ) : companies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
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
