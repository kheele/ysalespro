"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as industryServices from "@/services/public/industryServices";
import * as organizationServices from "@/services/public/organizationServices";
import { getLeadsActionByToken } from "@/services/private/leadServices";
import type { Industry, Organization, Lead } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from "recharts";
import {
  Building2,
  Globe,
  Factory,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ExternalLink,
  Users,
  ShieldAlert,
  BarChart3,
  Layers,
  FileCode2,
  Flame,
  Target,
  Snowflake,
  Thermometer,
  ArrowRight,
} from "lucide-react";

export default function IndustryDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const indId = (params?.id as string) || "ind-1";

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [industry, setIndustry] = React.useState<Industry | null>(null);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken(true);
        const [indData, orgData, leadData] = await Promise.all([
          industryServices.getIndustryById(indId),
          organizationServices.getOrganizations({ limit: 50 }),
          getLeadsActionByToken(token),
        ]);
        setIndustry(indData);

        const orgsList = orgData?.organizations || [];
        const leadsList = Array.isArray(leadData) ? leadData : [];

        // Filter organizations that match this industry
        if (indData) {
          const industryWord = indData.name.split(" ")[0].toLowerCase();
          const relatedOrgs = orgsList.filter(
            (o) =>
              o.industry?.toLowerCase().includes(industryWord) ||
              (o as any).primary_industry?.toLowerCase().includes(industryWord)
          );
          setOrganizations(relatedOrgs.length > 0 ? relatedOrgs : orgsList.slice(0, 3));

          const relatedLeads = leadsList.filter(
            (l) =>
              l.industry?.toLowerCase().includes(industryWord) ||
              relatedOrgs.some((o) => o.name === (l.company_name || l.organization_name))
          );
          setLeads(relatedLeads.length > 0 ? relatedLeads : leadsList.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load industry details:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [indId, user]);

  if (loading || !industry) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <SalesProSidebar />
        <div className="flex-1 p-8 space-y-6">
          <div className="h-12 bg-card/40 border border-border/40 rounded-xl animate-pulse" />
          <div className="h-64 bg-card/40 border border-border/40 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Lead pipeline stats
  const hotLeads = leads.filter((l) => l.temperature === "Hot" || l.pipeline_stage === "Hot");
  const warmLeads = leads.filter((l) => l.temperature === "Warm" || l.pipeline_stage === "Warm");
  const coldLeads = leads.filter((l) => l.temperature === "Cold" || l.pipeline_stage === "Cold");
  const totalPipeline = leads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
  const avgProbability = leads.length
    ? Math.round(leads.reduce((s, l) => s + (l.probability || 0), 0) / leads.length)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title={industry.name}
          subtitle={`Hasura aa_s_industries · NAICS ${industry.naics_code || "518210"} · SIC ${industry.sic_code || "7374"}`}
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 w-full mx-auto overflow-y-auto">
          {/* Back Link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/industries")}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Industries
          </Button>

          {/* --- Industry Header Banner --- */}
          <Card className="backdrop-blur-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                  <Factory className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold tracking-tight">{industry.name}</h1>
                    <Badge className="bg-indigo-500/10 text-indigo-400 text-xs">
                      {industry.category}
                    </Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-400 text-xs gap-1.5 font-mono">
                      <TrendingUp className="h-3 w-3" /> {industry.market_growth} YoY
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-xl">{industry.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center shrink-0">
                <div className="p-3 rounded-xl bg-muted/40 text-xs font-mono">
                  <div className="text-lg font-extrabold text-emerald-400">{industry.market_size}</div>
                  <div className="text-[10px] uppercase text-muted-foreground mt-0.5">Market Cap</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 text-xs font-mono">
                  <div className="text-lg font-extrabold text-indigo-300">{industry.avg_deal_size}</div>
                  <div className="text-[10px] uppercase text-muted-foreground mt-0.5">Avg Deal</div>
                </div>
              </div>
            </div>
          </Card>

          {/* --- SECTION 1: Industry Details --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="p-5 col-span-2 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" /> Industry Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">NAICS Code</div>
                  <div className="font-bold font-mono text-indigo-300">{industry.naics_code || "518210"}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">SIC Code</div>
                  <div className="font-bold font-mono text-purple-300">{industry.sic_code || "7374"}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">Risk Level</div>
                  <Badge
                    className={
                      industry.risk_level === "Low"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : industry.risk_level === "High"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                    }
                  >
                    {industry.risk_level || "Low"} Risk
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">Companies</div>
                  <div className="font-bold font-mono">{industry.organization_count || 120} Accounts</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">Sector Pipeline</div>
                  <div className="font-bold font-mono text-emerald-400">{industry.total_pipeline_value}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">Category</div>
                  <div className="font-bold">{industry.category}</div>
                </div>
              </div>
            </Card>

            {/* Company Count Breakdown */}
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-400" /> Number of Companies
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Enterprise (1000+ employees)", count: Math.round((industry.organization_count || 120) * 0.2), color: "bg-indigo-500" },
                  { label: "Mid-Market (100-999)", count: Math.round((industry.organization_count || 120) * 0.45), color: "bg-purple-500" },
                  { label: "SMB (< 100 employees)", count: Math.round((industry.organization_count || 120) * 0.35), color: "bg-pink-500" },
                ].map((tier) => (
                  <div key={tier.label} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tier.label}</span>
                      <span className="font-bold font-mono">{tier.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50">
                      <div
                        className={`h-1.5 rounded-full ${tier.color}`}
                        style={{ width: `${Math.round((tier.count / (industry.organization_count || 120)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* --- SECTION 2: Related Organizations --- */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" /> Related Organizations
              </h3>
              <Link href="/companies" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground text-[11px] uppercase">
                    <th className="pb-2 pr-4">Company</th>
                    <th className="pb-2 pr-4">City</th>
                    <th className="pb-2 pr-4">Employees</th>
                    <th className="pb-2 pr-4">Revenue</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-mono text-[9px] font-bold shrink-0">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          {org.name}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{org.city || "—"}</td>
                      <td className="py-2.5 pr-4 font-mono text-muted-foreground">
                        {org.employee_count?.toLocaleString() || "—"}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-emerald-400 font-semibold">
                        {org.revenue || "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          className={
                            org.status === "Customer" || org.lead_status === "Hot"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }
                        >
                          {org.status || org.lead_status || "Prospect"}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        <Link
                          href={`/companies/${org.id}`}
                          className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1"
                        >
                          Profile <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* --- SECTION 3: Lead Performance --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-pink-400" /> Lead Performance (This Sector)
              </h3>

              {/* Pipeline Stage Breakdown */}
              <div className="space-y-3">
                {[
                  { stage: "Hot", count: hotLeads.length, icon: <Flame className="h-4 w-4 text-red-400" />, color: "bg-red-500", badge: "bg-red-500/10 text-red-400" },
                  { stage: "Warm", count: warmLeads.length, icon: <Thermometer className="h-4 w-4 text-amber-400" />, color: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400" },
                  { stage: "Cold", count: coldLeads.length, icon: <Snowflake className="h-4 w-4 text-blue-400" />, color: "bg-blue-500", badge: "bg-blue-500/10 text-blue-400" },
                ].map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between text-xs p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      {stage.icon}
                      <span className="font-semibold">{stage.stage} Leads</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={stage.badge}>{stage.count} accounts</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-muted/30 text-xs grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Total Pipeline Value</p>
                  <p className="font-bold font-mono text-emerald-400 text-base">${totalPipeline.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Avg Win Probability</p>
                  <p className="font-bold font-mono text-indigo-300 text-base">{avgProbability}%</p>
                </div>
              </div>
            </Card>

            {/* Recharts Lead Pipeline Bar */}
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-400" /> Pipeline Deal Values ($)
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leads.length > 0 ? leads.map(l => ({ name: (l.organization_name || l.company_name || "Lead").split(" ")[0], value: Number(l.deal_value || 0) })) : [{ name: "Sample", value: 50000 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: "11px" }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, "Deal Value"]}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* --- SECTION 4: Growth Analytics --- */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" /> Growth Analytics & Market Velocity
              </h3>
              <Badge className="bg-emerald-500/10 text-emerald-400 text-xs font-mono">
                {industry.market_growth} YoY → {industry.market_size} TAM
              </Badge>
            </div>

            {/* Growth Line Chart */}
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={industry.historical_growth || []}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="year" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}B`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(v: number, name: string) => [name === "rate" ? `${v}%` : `$${v}B`, name === "rate" ? "Growth Rate" : "Market Size"]}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="rate" stroke="#10b981" fill="url(#growthGradient)" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                  <Area yAxisId="right" type="monotone" dataKey="marketSize" stroke="#6366f1" fill="url(#marketGradient)" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" /> Growth Rate (%)</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-400" /> Market Size ($B)</span>
            </div>
          </Card>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
