"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Factory, TrendingUp, PieChart as PieIcon, Activity } from "lucide-react";
import type { Industry } from "@/lib/types";

const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];

interface IndustryStatsProps {
  industries: Industry[];
  total: number;
}

export function IndustryStats({ industries, total }: IndustryStatsProps) {
  const totalAccounts = React.useMemo(() => {
    return industries.reduce((acc, curr) => acc + (curr.organization_count || 0), 0);
  }, [industries]);

  const totalTargets = React.useMemo(() => {
    return industries.reduce((acc, curr) => acc + (curr.campaign_target_count || 0), 0);
  }, [industries]);

  const totalSignals = React.useMemo(() => {
    return industries.reduce(
      (acc, curr) => acc + (curr.industry_signal_count || curr.industry_signal_list?.length || 0),
      0
    );
  }, [industries]);

  const topIndustry = React.useMemo(() => {
    if (!industries.length) return null;
    return [...industries].sort((a, b) => (b.organization_count || 0) - (a.organization_count || 0))[0];
  }, [industries]);

  const sectorPieData = React.useMemo(() => {
    const valid = industries.filter((ind) => (ind.organization_count || 0) > 0).slice(0, 6);
    if (!valid.length) {
      return industries.slice(0, 6).map((ind) => ({
        name: ind.name,
        value: 1,
      }));
    }
    return valid.map((ind) => ({
      name: ind.name,
      value: ind.organization_count || 0,
    }));
  }, [industries]);

  const growthBarData = React.useMemo(() => {
    return industries.filter((ind) => {
      const topSignal = ind.industry_signal_list?.[0];
      return topSignal?.yoy !== null && topSignal?.yoy !== undefined
    }).sort((a, b) => {
      const a_topSignal = a.industry_signal_list?.[0];
      const a_yoy = a_topSignal?.yoy !== null && a_topSignal?.yoy !== undefined
        ? a_topSignal.yoy
        : a.industry_signal_list?.find((s) => s.yoy !== null && s.yoy !== undefined)?.yoy ?? 0;

      const b_topSignal = b.industry_signal_list?.[0];
      const b_yoy = b_topSignal?.yoy !== null && b_topSignal?.yoy !== undefined
        ? b_topSignal.yoy
        : b.industry_signal_list?.find((s) => s.yoy !== null && s.yoy !== undefined)?.yoy ?? 0;

      return a_yoy < b_yoy ? 1 : a_yoy > b_yoy ? -1 : 0;
    }).slice(0, 6).map((ind) => {
      const topSignal = ind.industry_signal_list?.[0];
      const yoy = topSignal?.yoy !== null && topSignal?.yoy !== undefined
        ? topSignal.yoy
        : ind.industry_signal_list?.find((s) => s.yoy !== null && s.yoy !== undefined)?.yoy ?? 0;

      return {
        name: ind.name.length > 12 ? `${ind.name.slice(0, 10)}...` : ind.name,
        fullName: ind.name,
        growth: yoy,
      };
    });
  }, [industries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* KPI Overview */}
      <Card className="backdrop-blur-xl p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
            <span>Tracked Sectors</span>
            <Factory className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono mt-2">{total} Industries</div>
          <p className="text-xs text-muted-foreground mt-1">
            Mapping {totalAccounts.toLocaleString()} enterprise accounts
          </p>
        </div>

        <div className="space-y-2 pt-3 border-t border-border/40 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Top Account Sector:</span>
            <span className="font-bold text-emerald-400 truncate max-w-[170px]">
              {topIndustry ? `${topIndustry.name} (${topIndustry.organization_count || 0})` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Campaign Targets:</span>
            <span className="font-bold font-mono text-indigo-300">
              {totalTargets.toLocaleString()} Accounts
            </span>
          </div>
          {totalSignals > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Market Signals:</span>
              <span className="font-bold font-mono text-purple-400 flex items-center gap-1">
                <Activity className="h-3 w-3" /> {totalSignals} Telemetry Indicators
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Recharts Pie Chart - Sector Distribution */}
      <Card className="backdrop-blur-xl p-5">
        <div className="flex items-center justify-between text-xs font-bold mb-3">
          <span className="flex items-center gap-1.5">
            <PieIcon className="h-3.5 w-3.5 text-purple-400" /> Companies Distribution
          </span>
          <span className="text-muted-foreground text-[11px]">Accounts per Sector</span>
        </div>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectorPieData.length > 0 ? sectorPieData : [{ name: "No data", value: 1 }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={4}
              >
                {sectorPieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recharts Bar Chart - YoY Market Growth (%) */}
      <Card className="backdrop-blur-xl p-5">
        <div className="flex items-center justify-between text-xs font-bold mb-3">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> YoY Market Growth (%)
          </span>
          <span className="text-muted-foreground text-[11px]">Sector Growth</span>
        </div>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value: any) => [`${value}%`, "YoY Growth"]}
              />
              <Bar dataKey="growth" name="YoY Growth (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
