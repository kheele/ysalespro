"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Globe,
  Calendar,
  ExternalLink,
  Layers,
} from "lucide-react";
import type { IndustrySignal } from "@/lib/types";

interface IndustrySignalCardProps {
  signal: IndustrySignal;
  compact?: boolean;
}

export function IndustrySignalCard({ signal, compact = false }: IndustrySignalCardProps) {
  const isPositive = (signal.yoy !== null && signal.yoy !== undefined && signal.yoy > 0) ||
    signal.trend?.toLowerCase().includes("growth") ||
    signal.trend?.toLowerCase().includes("positive") ||
    signal.trend?.toLowerCase().includes("accelerat");

  const isNegative = (signal.yoy !== null && signal.yoy !== undefined && signal.yoy < 0) ||
    signal.trend?.toLowerCase().includes("decline") ||
    signal.trend?.toLowerCase().includes("negative") ||
    signal.trend?.toLowerCase().includes("decelerat");

  return (
    <Card className="backdrop-blur-md transition-all flex flex-col justify-between hover:border-indigo-500/40 group">
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* {signal.country && (
              <Badge variant="outline" className="bg-muted/40 text-muted-foreground text-[10px] gap-1 font-mono">
                <Globe className="h-2.5 w-2.5" /> {signal.country}
              </Badge>
            )} */}
            {signal.data_type && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] font-mono">
                {signal.data_type}
              </Badge>
            )}
            {signal.trend && (
              <Badge
                className={`text-[10px] gap-1 font-mono ${isPositive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : isNegative
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : isNegative ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Activity className="h-3 w-3" />
                )}
                {signal.trend}
              </Badge>
            )}
          </div>

          {signal.sales_signal && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1 font-mono">
              <Zap className="h-2.5 w-2.5 text-amber-400" /> {signal.sales_signal}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <CardTitle className="text-sm font-bold text-foreground group-hover:text-indigo-300 transition-colors">
            {signal.metric}
          </CardTitle>
          {signal.unit && (
            <span className="text-[10px] text-muted-foreground font-mono block">
              Unit: <strong className="text-foreground">{signal.unit}</strong>
            </span>
          )}
        </div>

        {signal.summary && (
          <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {signal.summary}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        {/* Metric Percentages Grid */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-muted/40 text-center font-mono text-xs">
          <div className="p-1">
            <span className="text-[9px] uppercase text-muted-foreground block">YoY</span>
            <span
              className={`font-bold ${signal.yoy !== null && signal.yoy !== undefined
                ? signal.yoy >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
                : "text-muted-foreground"
                }`}
            >
              {signal.yoy !== null && signal.yoy !== undefined
                ? `${signal.yoy > 0 ? "+" : ""}${signal.yoy}%`
                : "—"}
            </span>
          </div>

          <div className="p-1 border-x border-border/40">
            <span className="text-[9px] uppercase text-muted-foreground block">QoQ</span>
            <span
              className={`font-bold ${signal.qoq !== null && signal.qoq !== undefined
                ? signal.qoq >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
                : "text-muted-foreground"
                }`}
            >
              {signal.qoq !== null && signal.qoq !== undefined
                ? `${signal.qoq > 0 ? "+" : ""}${signal.qoq}%`
                : "—"}
            </span>
          </div>

          <div className="p-1">
            <span className="text-[9px] uppercase text-muted-foreground block">MoM</span>
            <span
              className={`font-bold ${signal.mom !== null && signal.mom !== undefined
                ? signal.mom >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
                : "text-muted-foreground"
                }`}
            >
              {signal.mom !== null && signal.mom !== undefined
                ? `${signal.mom > 0 ? "+" : ""}${signal.mom}%`
                : "—"}
            </span>
          </div>
        </div>

        {/* Footer Period & Source */}
        <div className="flex items-start justify-center flex-col text-[10px] text-muted-foreground pt-2 border-t border-border/30">
          <div className="flex items-center gap-1 font-mono">
            {(signal.period_start || signal.period_end) ? (
              <>
                <Calendar className="h-2.5 w-2.5" />
                <span>
                  {signal.period_start && new Date(signal.period_start).toLocaleDateString() || "—"} to {signal.period_end && new Date(signal.period_end).toLocaleDateString() || "Present"}
                </span>
              </>
            ) : signal.published_at ? (
              <>
                <Calendar className="h-2.5 w-2.5" />
                <span>{new Date(signal.published_at).toLocaleDateString()}</span>
              </>
            ) : (
              <span>Signal #{signal.id}</span>
            )}
          </div>

          {signal.source_name && (
            <div>
              {signal.source_url ? (
                <a
                  href={signal.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                >
                  {signal.source_name} <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : (
                <span className="text-muted-foreground font-mono">{signal.source_name}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
