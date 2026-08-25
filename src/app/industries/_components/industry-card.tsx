"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowRight, Building2, Target } from "lucide-react";
import type { Industry } from "@/lib/types";

interface IndustryCardProps {
  industry: Industry;
}

export function IndustryCard({ industry }: IndustryCardProps) {
  return (
    <Card className="backdrop-blur-md transition-all flex flex-col justify-between group">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 text-xs font-mono">
            #{industry.id}
          </Badge>
          {industry.market_growth ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 text-xs gap-1 font-mono">
              <TrendingUp className="h-3 w-3" /> {industry.market_growth}
            </Badge>
          ) : industry.active !== undefined ? (
            <Badge
              className={`text-xs font-mono ${industry.active
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-muted/40 text-muted-foreground border-border/40"
                }`}
            >
              {industry.active ? "Active" : "Inactive"}
            </Badge>
          ) : null}
        </div>

        <CardTitle className="text-base font-bold mt-2 group-hover:text-indigo-400 transition-colors">
          <Link href={`/industries/${industry.id}`}>{industry.name}</Link>
        </CardTitle>

        {industry.description && (
          <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {industry.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/40 text-xs font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              <Building2 className="h-3 w-3 text-indigo-400" /> Accounts
            </span>
            <span className="font-bold text-foreground mt-0.5 block">
              {(industry.organization_count || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              <Target className="h-3 w-3 text-purple-400" /> Targets
            </span>
            <span className="font-bold text-indigo-300 mt-0.5 block">
              {(industry.campaign_target_count || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
          <span className="text-muted-foreground font-mono text-[11px]">
            {industry.naics_code ? `NAICS: ${industry.naics_code}` : `Industry #${industry.id}`}
          </span>
          <Link
            href={`/industries/${industry.id}`}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Profile <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
