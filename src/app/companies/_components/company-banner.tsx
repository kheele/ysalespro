"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download } from "lucide-react";
import type { Organization } from "@/lib/types";

interface CompanyBannerProps {
  companies: Organization[];
  total: number;
}

export function CompanyBanner({ companies, total }: CompanyBannerProps) {
  const handleExportCSV = () => {
    const headers = "ID,Company Name,Website,Industry,Country,City,Employees,Revenue,Status\n";
    const rows = companies
      .map(
        (c) =>
          `"${c.id}","${c.name}","${c.primary_domain || ""}","${c.primary_industry || c.industry || ""}","${c.country || ""
          }","${c.city || ""}","${c.estimated_num_employees || c.employee_count || 0}","${c.annual_revenue || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `salespro_organizations_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground">
              {total.toLocaleString()} Enterprise Organizations
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Includes Mining, Construction, Heavy Manufacturing, Engineering & Logistics sectors.
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleExportCSV}
        className="text-xs h-9 gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/60 text-foreground"
      >
        <Download className="h-4 w-4 text-emerald-400" /> Export Paginated CSV
      </Button>
    </div>
  );
}
