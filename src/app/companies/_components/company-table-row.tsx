"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Users, Eye } from "lucide-react";
import type { Organization } from "@/lib/types";

interface CompanyTableRowProps {
  company: Organization;
}

export function CompanyTableRow({ company: c }: CompanyTableRowProps) {
  return (
    <tr className="hover:bg-muted/30 transition-colors group">
      <td className="p-3 font-mono text-[11px] text-muted-foreground">#{c.id}</td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400">
            {c.name.charAt(0)}
          </div>
          <div>
            <Link
              href={`/companies/${c.id}`}
              className="font-bold text-foreground group-hover:text-indigo-400 transition-colors"
            >
              {c.name}
            </Link>
            {c.primary_domain && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Globe className="h-2.5 w-2.5" /> {c.primary_domain}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="p-3">
        <span className="text-indigo-300 font-semibold">{c.primary_industry || c.industry || "N/A"}</span>
      </td>
      <td className="p-3 text-muted-foreground font-mono">
        <MapPin className="h-3 w-3 inline text-muted-foreground/60 mr-1" />
        {c.city || "N/A"}, {c.country || "N/A"}
      </td>
      <td className="p-3 font-mono">
        <Users className="h-3 w-3 inline text-muted-foreground/60 mr-1" />
        {(c.estimated_num_employees || c.employee_count || 0).toLocaleString()}
      </td>
      <td className="p-3 font-mono text-emerald-400 font-bold">{c.annual_revenue || "N/A"}</td>
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
  );
}
