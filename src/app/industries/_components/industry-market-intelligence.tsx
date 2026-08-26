"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Globe,
  Search,
  Activity,
  Layers,
  Flame,
  ArrowRight,
} from "lucide-react";
import type { IndustrySignal } from "@/lib/types";
import { IndustrySignalCard } from "./industry-signal-card";

interface IndustryMarketIntelligenceProps {
  signals: IndustrySignal[];
  industryName?: string;
  loading?: boolean;
}

export function IndustryMarketIntelligence({
  signals,
  industryName,
  loading = false,
}: IndustryMarketIntelligenceProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCountry, setSelectedCountry] = React.useState<string>("all");
  const [selectedTrend, setSelectedTrend] = React.useState<string>("all");
  const [selectedDataType, setSelectedDataType] = React.useState<string>("all");

  const countries = React.useMemo(() => {
    const set = new Set<string>();
    signals.forEach((s) => {
      if (s.country) set.add(s.country);
    });
    return Array.from(set);
  }, [signals]);

  const trends = React.useMemo(() => {
    const set = new Set<string>();
    signals.forEach((s) => {
      if (s.trend) set.add(s.trend);
    });
    return Array.from(set);
  }, [signals]);

  const dataTypes = React.useMemo(() => {
    const set = new Set<string>();
    signals.forEach((s) => {
      if (s.data_type) set.add(s.data_type);
    });
    return Array.from(set);
  }, [signals]);

  const filteredSignals = React.useMemo(() => {
    return signals.filter((s) => {
      if (selectedCountry !== "all" && s.country !== selectedCountry) return false;
      if (selectedTrend !== "all" && s.trend !== selectedTrend) return false;
      if (selectedDataType !== "all" && s.data_type !== selectedDataType) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchMetric = s.metric?.toLowerCase().includes(query);
        const matchSignal = s.sales_signal?.toLowerCase().includes(query);
        const matchSummary = s.summary?.toLowerCase().includes(query);
        const matchCountry = s.country?.toLowerCase().includes(query);
        const matchUnit = s.unit?.toLowerCase().includes(query);
        const matchDataType = s.data_type?.toLowerCase().includes(query);
        if (!matchMetric && !matchSignal && !matchSummary && !matchCountry && !matchUnit && !matchDataType) return false;
      }
      return true;
    });
  }, [signals, searchTerm, selectedCountry, selectedTrend, selectedDataType]);

  // Analytics Metrics
  const avgYoY = React.useMemo(() => {
    const yoyList = signals.map((s) => s.yoy).filter((y): y is number => y !== null && y !== undefined);
    if (!yoyList.length) return null;
    const sum = yoyList.reduce((a, b) => a + b, 0);
    return Math.round((sum / yoyList.length) * 10) / 10;
  }, [signals]);

  const positiveCount = React.useMemo(() => {
    return signals.filter((s) => (s.yoy !== null && s.yoy !== undefined && s.yoy > 0) || s.trend?.toLowerCase().includes("growth")).length;
  }, [signals]);

  const triggerList = React.useMemo(() => {
    const list: string[] = [];
    signals.forEach((s) => {
      if (s.sales_signal && !list.includes(s.sales_signal)) {
        list.push(s.sales_signal);
      }
    });
    return list.slice(0, 4);
  }, [signals]);

  // Recharts Chart Data
  const chartData = React.useMemo(() => {
    return filteredSignals.slice(0, 8).map((s) => ({
      name: s.metric.length > 15 ? `${s.metric.slice(0, 13)}...` : s.metric,
      fullName: s.metric,
      yoy: s.yoy ?? 0,
      qoq: s.qoq ?? 0,
      mom: s.mom ?? 0,
    }));
  }, [filteredSignals]);

  return (
    <div className="space-y-6">
      {/* Top Intel Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-between">
              <span>Tracked Signals</span>
              <Activity className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono mt-1 text-foreground">
              {signals.length} Signals
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Real-time market indicators across {countries.length || 1} regions
          </p>
        </Card>

        <Card className="backdrop-blur-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-between">
              <span>Avg YoY Growth</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-400">
              {avgYoY !== null ? `${avgYoY > 0 ? "+" : ""}${avgYoY}%` : "—"}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {positiveCount} of {signals.length} indicators expanding
          </p>
        </Card>

        <Card className="backdrop-blur-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-between">
              <span>Active Sales Triggers</span>
              <Zap className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono mt-1 text-indigo-300">
              {triggerList.length} Triggers
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {triggerList.length > 0 ? triggerList[0] : "—"}
          </p>
        </Card>

        <Card className="backdrop-blur-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-between">
              <span>Market Velocity</span>
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono mt-1 text-purple-400">
              {avgYoY !== null ? (avgYoY > 15 ? "High Momentum" : "Steady Growth") : "—"}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {avgYoY !== null ? "Calculated from telemetry indicators" : "No telemetry recorded"}
          </p>
        </Card>
      </div>

      {/* Chart: Growth Comparison */}
      {chartData.length > 0 && (
        <Card className="backdrop-blur-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" /> Market Signal Momentum (YoY / QoQ / MoM)
              </CardTitle>
              <CardDescription className="text-xs">
                Comparative period growth rates across tracked sector metrics
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" /> YoY</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> QoQ</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500 inline-block" /> MoM</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {chartData.map((item, idx) => (
              <div key={idx} className="bg-card/40 border border-border/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold truncate max-w-[220px]" title={item.fullName}>{item.fullName}</span>
                  <span className={`font-mono text-[11px] font-bold ${item.yoy >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {item.yoy >= 0 ? `+${item.yoy}%` : `${item.yoy}%`} YoY
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-8 text-muted-foreground font-mono">YoY</span>
                    <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, Math.abs(item.yoy) * 2))}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono font-semibold text-indigo-300">{item.yoy}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-8 text-muted-foreground font-mono">QoQ</span>
                    <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, Math.abs(item.qoq) * 2))}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono font-semibold text-emerald-300">{item.qoq}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-8 text-muted-foreground font-mono">MoM</span>
                    <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, Math.abs(item.mom) * 2))}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono font-semibold text-purple-300">{item.mom}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border/40">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search signals by metric, sales trigger, region, or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-muted/40 text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {countries.length > 1 && (
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-muted/40 border border-border/50 text-xs rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {dataTypes.length > 1 && (
            <select
              value={selectedDataType}
              onChange={(e) => setSelectedDataType(e.target.value)}
              className="bg-muted/40 border border-border/50 text-xs rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              {dataTypes.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          )}

          {trends.length > 1 && (
            <select
              value={selectedTrend}
              onChange={(e) => setSelectedTrend(e.target.value)}
              className="bg-muted/40 border border-border/50 text-xs rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Trends</option>
              {trends.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 bg-card/40 border border-border/40 rounded-xl animate-pulse" />
          ))
        ) : filteredSignals.length > 0 ? (
          filteredSignals.map((signal) => (
            <IndustrySignalCard key={signal.id} signal={signal} />
          ))
        ) : (
          <div className="col-span-full p-10 text-center text-muted-foreground text-xs bg-card/40 rounded-xl border border-border/40">
            No market signals recorded for {industryName || "this sector"} matching the criteria.
          </div>
        )}
      </div>
    </div>
  );
}
