"use client";

import * as React from "react";
import Link from "next/link";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { industryServices, Industry } from "@/services/industryServices";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Search,
  Factory,
  TrendingUp,
  Building2,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Filter,
  BarChart3,
  Globe2,
  PieChart as PieIcon,
} from "lucide-react";

const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];

export default function IndustriesPage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [industries, setIndustries] = React.useState<Industry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const loadIndustries = React.useCallback(async () => {
    setLoading(true);
    const data = await industryServices.getIndustries({ search, category: selectedCategory });
    setIndustries(data);
    setLoading(false);
  }, [search, selectedCategory]);

  React.useEffect(() => {
    loadIndustries();
  }, [loadIndustries]);

  // Recharts Analytics data preparation
  const sectorPieData = React.useMemo(() => {
    return industries.map((ind) => ({
      name: ind.name.split(" ")[0],
      value: ind.organization_count || 50,
    }));
  }, [industries]);

  const growthBarData = React.useMemo(() => {
    return industries.map((ind) => ({
      name: ind.name.split(" ")[0],
      growth: parseFloat(ind.market_growth?.replace("+", "").replace("%", "") || "15"),
    }));
  }, [industries]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Industry Classification & Intelligence"
          subtitle="Main data source: Hasura aa_s_industries, NAICS & SIC mappings"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
          {/* Top Analytics Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* KPI Overview */}
            <Card className="backdrop-blur-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
                  <span>Tracked Sectors</span>
                  <Factory className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-extrabold font-mono mt-2">{industries.length} Industries</div>
                <p className="text-xs text-muted-foreground mt-1">Cross-referencing 1,250+ enterprise accounts</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/40 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Highest Growth Sector:</span>
                  <span className="font-bold text-emerald-400">Cybersecurity (+22.1%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Sector Pipeline:</span>
                  <span className="font-bold font-mono text-indigo-300">$211.5M ARR</span>
                </div>
              </div>
            </Card>

            {/* Recharts Pie Chart - Sector Distribution */}
            <Card className="backdrop-blur-xl p-5">
              <div className="flex items-center justify-between text-xs font-bold mb-3">
                <span className="flex items-center gap-1.5"><PieIcon className="h-3.5 w-3.5 text-purple-400" /> Organization Distribution</span>
                <span className="text-muted-foreground text-[11px]">Accounts per Sector</span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sectorPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4}>
                      {sectorPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recharts Bar Chart - Market Growth Rates */}
            <Card className="backdrop-blur-xl p-5">
              <div className="flex items-center justify-between text-xs font-bold mb-3">
                <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-indigo-400" /> YoY Market Growth (%)</span>
                <span className="text-muted-foreground text-[11px]">Sector Velocity</span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: "11px" }} />
                    <Bar dataKey="growth" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Search & Sector Filtering Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search industry by name, description, NAICS or SIC code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground font-semibold shrink-0">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-muted/40 rounded-md px-3 py-1.5 text-xs outline-none text-foreground"
              >
                <option value="all">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Transportation">Transportation</option>
                <option value="Manufacturing">Manufacturing</option>
              </select>
            </div>
          </div>

          {/* Industry Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 bg-card/40 border border-border/40 rounded-xl animate-pulse" />
              ))
            ) : industries.length > 0 ? (
              industries.map((ind) => (
                <Card
                  key={ind.id}
                  className="backdrop-blur-md transition-all flex flex-col justify-between group"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 text-xs">
                        {ind.category || "-"}
                      </Badge>
                      <Badge className="bg-emerald-500/10 text-emerald-400 text-xs gap-1 font-mono">
                        <TrendingUp className="h-3 w-3" /> {ind.market_growth}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold mt-2 group-hover:text-indigo-400 transition-colors">
                      <Link href={`/industries/${ind.id}`}>{ind.name}</Link>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {ind.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/40 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Companies</span>
                        <span className="font-bold text-foreground">{ind.organization_count || 120} Accounts</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">Market Size</span>
                        <span className="font-bold text-emerald-400">{ind.market_size || "$150B"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
                      <span className="text-muted-foreground font-mono text-[11px]">NAICS: {ind.naics_code || "518210"}</span>
                      <Link
                        href={`/industries/${ind.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        Profile <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full p-12 text-center text-muted-foreground text-xs">
                No industries found matching search query.
              </div>
            )}
          </div>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
