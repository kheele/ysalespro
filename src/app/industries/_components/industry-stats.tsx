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
import { Factory, BarChart3, PieChart as PieIcon, Building2, Target } from "lucide-react";
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

  const targetsBarData = React.useMemo(() => {
    return industries.slice(0, 6).map((ind) => ({
      name: ind.name.length > 12 ? `${ind.name.slice(0, 10)}...` : ind.name,
      fullName: ind.name,
      targets: ind.campaign_target_count || 0,
      accounts: ind.organization_count || 0,
    }));
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
        </div>
      </Card>

      {/* Recharts Pie Chart - Sector Distribution */}
      <Card className="backdrop-blur-xl p-5">
        <div className="flex items-center justify-between text-xs font-bold mb-3">
          <span className="flex items-center gap-1.5">
            <PieIcon className="h-3.5 w-3.5 text-purple-400" /> Account Distribution
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

      {/* Recharts Bar Chart - Campaign Targets */}
      <Card className="backdrop-blur-xl p-5">
        <div className="flex items-center justify-between text-xs font-bold mb-3">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" /> Campaign Targets by Sector
          </span>
          <span className="text-muted-foreground text-[11px]">Target Count</span>
        </div>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={targetsBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="targets" name="Campaign Targets" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
