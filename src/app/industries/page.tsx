"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as industryServices from "@/services/public/industryServices";
import type { Industry } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Search } from "lucide-react";
import { IndustryCard } from "./_components/industry-card";
import { IndustryStats } from "./_components/industry-stats";

const DEFAULT_PAGE_SIZE = 15;

export default function IndustriesPage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [industries, setIndustries] = React.useState<Industry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");

  const loadIndustries = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await industryServices.getIndustries({
        search,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setIndustries(data?.industries || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error("Failed to load industries:", e);
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  React.useEffect(() => {
    loadIndustries();
  }, [loadIndustries]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Industry Classification & Intelligence"
          subtitle="Comprehensive industry breakdown, market signals & NAICS/SIC mappings"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 w-full mx-auto overflow-y-auto">
          {/* Top Analytics Summary Section */}
          <IndustryStats industries={industries} total={total} />

          {/* Search Bar (Category filter removed) */}
          <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search industry by name, description, NAICS or SIC code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 text-xs h-9"
              />
            </div>
          </div>

          {/* Industry Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 bg-card/40 border border-border/40 rounded-xl animate-pulse" />
              ))
            ) : industries.length > 0 ? (
              industries.map((ind) => <IndustryCard key={ind.id} industry={ind} />)
            ) : (
              <div className="col-span-full p-12 text-center text-muted-foreground text-xs">
                No industries found matching search query.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[DEFAULT_PAGE_SIZE, 36, 60]}
            itemLabel="industries"
          />
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
