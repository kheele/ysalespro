"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowRight, Building2, Target, Zap, Activity, TrendingDown } from "lucide-react";
import type { Industry } from "@/lib/types";

interface IndustryCardProps {
  industry: Industry;
}

export function IndustryCard({ industry }: IndustryCardProps) {
  const topSignal = industry.industry_signal_list?.[0];

  return (
    <Card className="backdrop-blur-md transition-all flex flex-col justify-between group hover:border-indigo-500/40">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {(topSignal?.trend || topSignal?.sales_signal) && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs gap-1 font-mono">
              <Zap className="h-3 w-3 text-amber-400" /> {topSignal?.trend || topSignal?.sales_signal}
            </Badge>
          )}
          {(topSignal?.yoy !== null && topSignal?.yoy !== undefined) ?
            <Badge className={` ${topSignal.yoy > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"} text-xs gap-1 font-mono`}>
              {topSignal.yoy > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {topSignal.yoy > 0 ? "+" : ""}{topSignal.yoy}% YoY
            </Badge>
            : (topSignal?.qoq !== null && topSignal?.qoq !== undefined) ?
              <Badge className={` ${topSignal.qoq > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"} text-xs gap-1 font-mono`}>
                {topSignal.qoq > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {topSignal.qoq > 0 ? "+" : ""}{topSignal.qoq}% QoQ
              </Badge>
              : (topSignal?.mom !== null && topSignal?.mom !== undefined) ?
                <Badge className={` ${topSignal.mom > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"} text-xs gap-1 font-mono`}>
                  {topSignal.mom > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {topSignal.mom > 0 ? "+" : ""}{topSignal.mom}% MoM
                </Badge>
                : null}
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
              <Building2 className="h-3 w-3 text-indigo-400" /> Companies
            </span>
            <span className="font-bold text-foreground mt-0.5 block">
              {(industry.organization_count || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              <Target className="h-3 w-3 text-purple-400" /> Campaign Targets
            </span>
            <span className="font-bold text-indigo-300 mt-0.5 block">
              {(industry.campaign_target_count || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {topSignal && (
          <div className="p-2.5 rounded-lg bg-muted/40 text-xs flex items-center justify-between">
            <span className="text-muted-foreground truncate max-w-[170px] text-[11px] flex items-center gap-1">
              <Activity className="h-3 w-3 text-indigo-400 shrink-0" />
              {topSignal.metric}
            </span>
            <span className="font-mono font-bold text-indigo-300 text-[11px] shrink-0">
              {topSignal.trend || (topSignal.yoy !== null ? `${topSignal.yoy}%` : "Tracked")}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
          <span className="text-muted-foreground font-mono text-[11px]">
            {industry.industry_signal_count && industry.industry_signal_count > 0
              ? `${industry.industry_signal_count} Signals`
              : `0 Signals`}
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
