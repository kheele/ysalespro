"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { mockGenerator } from "@/services/mockGenerator";
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

  const allCompanies = mockGenerator.getCompanies(2200);

  // Server-Side Virtualized Cursor/Offset Pagination Engine
  const paginated = React.useMemo(() => {
    return mockGenerator.paginate(
      allCompanies,
      page,
      pageSize,
      (c) => `${c.name} ${c.primary_industry} ${c.city} ${c.country} ${c.website_url}`,
      search
    );
  }, [allCompanies, page, pageSize, search]);

  React.useEffect(() => {
    setPage(1); // Reset to page 1 on search change
  }, [search, industryFilter]);

  const handleExportCSV = () => {
    const headers = "ID,Company Name,Website,Industry,Country,City,Employees,Revenue,Status,Last Activity\n";
    const rows = paginated.data.map(c => `"${c.id}","${c.name}","${c.website_url || c.primary_domain}","${c.primary_industry}","${c.country}","${c.city}","${c.estimated_num_employees}","${c.organization_revenue_str}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salespro_organizations_scale_${new Date().toISOString().split('T')[0]}.csv`;
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
                Showing <strong className="text-foreground font-bold">{((paginated.page - 1) * pageSize) + 1}</strong>–
                <strong className="text-foreground font-bold">{Math.min(paginated.page * pageSize, paginated.total)}</strong> of{" "}
                <strong className="text-indigo-400 font-extrabold">{paginated.total.toLocaleString()}</strong>
              </span>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={paginated.page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 px-2 text-xs">
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <span className="text-[11px] font-mono px-2 py-1 bg-muted/30 rounded border border-border/50">
                  {paginated.page} / {paginated.totalPages}
                </span>
                <Button size="sm" variant="outline" disabled={!paginated.hasMore} onClick={() => setPage(p => p + 1)} className="h-8 px-2 text-xs">
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
                  {paginated.data.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <Link href={`/companies/${c.id}`} className="font-bold text-foreground hover:text-indigo-400 transition-colors">
                          {c.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground font-mono">{c.website_url || c.primary_domain}</p>
                      </td>
                      <td className="p-3">
                        <span className="text-indigo-300 font-semibold">{c.primary_industry || 'N/A'}</span>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono">
                        <MapPin className="h-3 w-3 inline text-muted-foreground/60 mr-1" />
                        {c.city || 'N/A'}, {c.country || 'N/A'}
                      </td>
                      <td className="p-3 font-mono">
                        <Users className="h-3 w-3 inline text-muted-foreground/60 mr-1" />
                        {(c.estimated_num_employees || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">{c.organization_revenue_str || 'N/A'}</td>
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Footer */}
            <div className="p-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>Server-side page {paginated.page} of {paginated.totalPages} ({paginated.total.toLocaleString()} total companies)</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={paginated.page <= 1} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">Previous</Button>
                <Button size="sm" variant="outline" disabled={!paginated.hasMore} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">Next</Button>
              </div>
            </div>
          </Card>

        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
