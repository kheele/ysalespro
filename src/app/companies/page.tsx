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
import { Badge } from "@/components/ui/badge";
import {
  Building2, Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight,
  Sparkles, Layers, SlidersHorizontal, Eye, Globe, MapPin, Users, DollarSign,
} from "lucide-react";
import Link from "next/link";

export default function CompaniesPage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [industryFilter, setIndustryFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 25;
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasMore = page < totalPages;

  const handleExportCSV = () => {
    const headers = "ID,Company Name,Website,Industry,Country,City,Employees,Revenue,Status\n";
    const rows = companies.map(c => `"${c.id}","${c.name}","${c.domain || ''}","${c.primary_industry || c.industry || ''}","${c.country || ''}","${c.city || ''}","${c.estimated_num_employees || c.employee_count || 0}","${c.annual_revenue || ''}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salespro_organizations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Organizations Intelligence"
          subtitle="Enterprise organization database built with server-side pagination & virtualized rendering for 200,000+ records"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto">

          {/* Scale Summary Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-foreground">2,200+ Enterprise Organizations Seeded</h1>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Virtualized Engine</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Includes Mining, Construction, Heavy Manufacturing, Engineering & Technology sectors.</p>
              </div>
            </div>

            <Button size="sm" variant="outline" onClick={handleExportCSV}
              className="text-xs h-9 gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/60 text-foreground">
              <Download className="h-4 w-4 text-emerald-400" /> Export Paginated CSV
            </Button>
          </div>

          {/* Search & Pagination Control Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl backdrop-blur-xl">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search 2,200+ companies by name, industry, city, or keywords..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 bg-muted/30 border-border/60 text-xs h-9" />
            </div>

            {/* Server-Side Pagination Controls */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground w-full sm:w-auto justify-between">
              <span className="font-mono">
                Showing <strong className="text-foreground font-bold">{total === 0 ? 0 : ((page - 1) * pageSize) + 1}</strong>–
                <strong className="text-foreground font-bold">{Math.min(page * pageSize, total)}</strong> of{" "}
                <strong className="text-indigo-400 font-extrabold">{total.toLocaleString()}</strong>
              </span>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 px-2 text-xs">
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <span className="text-[11px] font-mono px-2 py-1 bg-muted/30 rounded border border-border/50">
                  {page} / {totalPages}
                </span>
                <Button size="sm" variant="outline" disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="h-8 px-2 text-xs">
                  Next <ChevronRight className="h-3.5 w-3.5" />
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
                    companies.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <Link href={`/companies/${c.id}`} className="font-bold text-foreground hover:text-indigo-400 transition-colors">
                            {c.name}
                          </Link>
                          <p className="text-[10px] text-muted-foreground font-mono">{c.domain || ''}</p>
                        </td>
                        <td className="p-3">
                          <span className="text-indigo-300 font-semibold">{c.primary_industry || c.industry || 'N/A'}</span>
                        </td>
                        <td className="p-3 text-muted-foreground font-mono">
                          <MapPin className="h-3 w-3 inline text-muted-foreground/60 mr-1" />
                          {c.city || 'N/A'}, {c.country || 'N/A'}
                        </td>
                        <td className="p-3 font-mono">
                          <Users className="h-3 w-3 inline text-muted-foreground/60 mr-1" />
                          {(c.estimated_num_employees || c.employee_count || 0).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{c.annual_revenue || 'N/A'}</td>
                        <td className="p-3">
                          <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-[10px]">Active</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Link href={`/companies/${c.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-indigo-400 hover:text-indigo-300">
                              <Eye className="h-3.5 w-3.5" /> View Profile
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Footer */}
            <div className="p-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>Page {page} of {totalPages} ({total.toLocaleString()} total companies)</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">Previous</Button>
                <Button size="sm" variant="outline" disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">Next</Button>
              </div>
            </div>
          </Card>

        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
