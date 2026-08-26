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
import type { Industry, Organization, Lead, IndustrySignal } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { CompanyTableRow } from "@/app/companies/_components/company-table-row";
import {
  Building2,
  Factory,
  ChevronLeft,
  Users,
  BarChart3,
  Flame,
  Target,
  Snowflake,
  Thermometer,
  ArrowRight,
  Activity,
  ArrowLeft,
  Search,
  DollarSign,
} from "lucide-react";
import { IndustryMarketIntelligence } from "@/app/industries/_components/industry-market-intelligence";

export default function IndustryDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const indId = params?.id as string | undefined;

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [industry, setIndustry] = React.useState<Industry | null>(null);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [orgTotal, setOrgTotal] = React.useState(0);
  const [orgPage, setOrgPage] = React.useState(1);
  const [orgPageSize, setOrgPageSize] = React.useState(30);
  const [orgSearch, setOrgSearch] = React.useState("");
  const [orgEmployeeFilter, setOrgEmployeeFilter] = React.useState("all");
  const [orgRevenueFilter, setOrgRevenueFilter] = React.useState("all");
  const [orgsLoading, setOrgsLoading] = React.useState(false);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [signals, setSignals] = React.useState<IndustrySignal[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user || !indId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken(true);
        const [indData, leadData] = await Promise.all([
          industryServices.getIndustryById(indId),
          getLeadsActionByToken(token),
        ]);
        setIndustry(indData);
        setSignals(indData?.industry_signal_list || []);

        const leadsList = Array.isArray(leadData) ? leadData : [];
        if (indData) {
          const industryName = indData.name.toLowerCase();
          const relatedLeads = leadsList.filter(
            (l) => l.industry?.toLowerCase() === industryName
          );
          setLeads(relatedLeads);
        }
      } catch (err) {
        console.error("Failed to load industry details:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [indId, user]);

  const loadOrganizations = React.useCallback(async () => {
    if (!indId) return;
    setOrgsLoading(true);
    try {
      const orgData = await organizationServices.getOrganizations({
        industry_id: indId,
        search: orgSearch.trim() || undefined,
        employee_range: orgEmployeeFilter === "all" ? undefined : orgEmployeeFilter,
        revenue_range: orgRevenueFilter === "all" ? undefined : orgRevenueFilter,
        page: orgPage,
        pageSize: orgPageSize,
      });
      setOrganizations(orgData?.organizations || []);
      setOrgTotal(orgData?.total || 0);
    } catch (err) {
      console.error("Failed to load organizations for industry:", err);
    } finally {
      setOrgsLoading(false);
    }
  }, [indId, orgSearch, orgEmployeeFilter, orgRevenueFilter, orgPage, orgPageSize]);

  React.useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  if (loading) {
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

  if (!industry) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
        <div className="flex-1 flex flex-col min-w-0">
          <SalesProHeader
            title="Industry Not Found"
            subtitle={indId ? `No industry record found matching ID #${indId}` : "Invalid industry ID provided"}
            onOpenCommandPalette={() => setCommandOpen(true)}
          />
          <main className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <h2 className="text-base font-bold">Industry Not Found</h2>
              <p className="text-xs text-muted-foreground mt-1">
                The requested industry could not be located in the database.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/industries")}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Industries
            </Button>
          </main>
        </div>
      </div>
    );
  }

  // Lead pipeline stats
  const hotLeads = leads.filter((l) => l.lead_temperature?.toUpperCase() === "HOT" || l.stage === "Hot");
  const warmLeads = leads.filter((l) => l.lead_temperature?.toUpperCase() === "WARM" || l.stage === "Warm");
  const coldLeads = leads.filter((l) => l.lead_temperature?.toUpperCase() === "COLD" || l.stage === "Cold");
  const avgScore = leads.length
    ? Math.round(leads.reduce((s, l) => s + (l.lead_score || 0), 0) / leads.length)
    : 0;
  const totalFollowups = leads.reduce((s, l) => s + (l.followup_count || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title={industry.name}
          subtitle={`Industry Profile · ${industry.organization_count || 0} Organizations · ${industry.industry_signal_count || 0} Market Signals`}
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

          {/* Industry Header Banner */}
          <Card className="backdrop-blur-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                  <Factory className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold tracking-tight">{industry.name}</h1>
                    {industry.active !== undefined && (
                      <Badge
                        className={`text-xs font-mono ${industry.active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-muted/40 text-muted-foreground border-border/40"
                          }`}
                      >
                        {industry.active ? "Active" : "Inactive"}
                      </Badge>
                    )}
                    {signals.length > 0 && (
                      <Badge className="bg-indigo-500/10 text-indigo-400 text-xs gap-1.5 font-mono">
                        <Activity className="h-3 w-3" /> {signals.length} Signals
                      </Badge>
                    )}
                  </div>
                  {industry.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-xl">{industry.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center shrink-0">
                <div className="p-3 rounded-xl bg-muted/40 text-xs font-mono">
                  <div className="text-lg font-extrabold text-foreground">
                    {(industry.organization_count || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground mt-0.5">Accounts</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 text-xs font-mono">
                  <div className="text-lg font-extrabold text-indigo-300">
                    {(industry.campaign_target_count || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground mt-0.5">Campaign Targets</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabbed Detail Views */}
          <Tabs defaultValue="intelligence" className="w-full space-y-5">
            <TabsList className="bg-card p-1 rounded-xl h-auto flex flex-wrap justify-start items-center gap-1 border border-border/40">
              <TabsTrigger
                value="intelligence"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3.5 gap-2"
              >
                <Activity className="h-3.5 w-3.5" /> Market Intelligence ({signals.length})
              </TabsTrigger>
              <TabsTrigger
                value="organizations"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3.5 gap-2"
              >
                <Building2 className="h-3.5 w-3.5" /> Related Organizations ({orgTotal})
              </TabsTrigger>
              <TabsTrigger
                value="leads"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3.5 gap-2"
              >
                <Target className="h-3.5 w-3.5" /> Lead Performance ({leads.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Market Intelligence */}
            <TabsContent value="intelligence" className="space-y-6">
              <IndustryMarketIntelligence signals={signals} industryName={industry.name} />
            </TabsContent>

            {/* TAB 2: Related Organizations */}
            <TabsContent value="organizations" className="space-y-4">
              {/* Filtering / Search Header */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl backdrop-blur-md border border-border/40">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${orgTotal.toLocaleString()} organizations in ${industry.name} by name, domain, or city...`}
                    value={orgSearch}
                    onChange={(e) => {
                      setOrgSearch(e.target.value);
                      setOrgPage(1);
                    }}
                    className="pl-8 bg-muted/40 text-xs h-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Number of Employees Filter */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
                    <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Employees:</span>
                    <select
                      value={orgEmployeeFilter}
                      onChange={(e) => {
                        setOrgEmployeeFilter(e.target.value);
                        setOrgPage(1);
                      }}
                      className="bg-transparent text-foreground text-xs outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-card text-foreground">All Sizes</option>
                      <option value="1-10" className="bg-card text-foreground">1 - 10</option>
                      <option value="11-50" className="bg-card text-foreground">11 - 50</option>
                      <option value="51-200" className="bg-card text-foreground">51 - 200</option>
                      <option value="201-500" className="bg-card text-foreground">201 - 500</option>
                      <option value="501-1000" className="bg-card text-foreground">501 - 1,000</option>
                      <option value="1000+" className="bg-card text-foreground">1,000+</option>
                    </select>
                  </div>

                  {/* Annual Revenue Filter */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Revenue:</span>
                    <select
                      value={orgRevenueFilter}
                      onChange={(e) => {
                        setOrgRevenueFilter(e.target.value);
                        setOrgPage(1);
                      }}
                      className="bg-transparent text-foreground text-xs outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-card text-foreground">All Revenues</option>
                      <option value="<1M" className="bg-card text-foreground">&lt; $1M</option>
                      <option value="1M-10M" className="bg-card text-foreground">$1M - $10M</option>
                      <option value="10M-50M" className="bg-card text-foreground">$10M - $50M</option>
                      <option value="50M-100M" className="bg-card text-foreground">$50M - $100M</option>
                      <option value="100M+" className="bg-card text-foreground">$100M+</option>
                    </select>
                  </div>

                  <Link href="/companies" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-2 shrink-0">
                    View All Companies <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Table */}
              <Card className="border-border/50 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[10px] border-b border-border/50">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Company</th>
                        <th className="p-3">Industries</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Employees</th>
                        <th className="p-3">Annual Revenue</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {orgsLoading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            Loading organizations...
                          </td>
                        </tr>
                      ) : organizations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            No organizations found in {industry.name}.
                          </td>
                        </tr>
                      ) : (
                        organizations.map((c) => <CompanyTableRow key={c.id} company={c} />)
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Bottom Pagination Footer */}
              <DataTablePagination
                page={orgPage}
                pageSize={orgPageSize}
                total={orgTotal}
                onPageChange={setOrgPage}
                onPageSizeChange={setOrgPageSize}
                pageSizeOptions={[10, 30, 50, 100]}
                itemLabel="organizations"
              />
            </TabsContent>

            {/* TAB 3: Lead Performance */}
            <TabsContent value="leads" className="space-y-5">
              {leads.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-xl border border-border/40">
                  No active pipeline leads currently recorded for {industry.name}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card className="p-5 space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Target className="h-4 w-4 text-pink-400" /> Pipeline Temperature Breakdown
                    </h3>

                    <div className="space-y-3">
                      {[
                        {
                          stage: "Hot",
                          count: hotLeads.length,
                          icon: <Flame className="h-4 w-4 text-red-400" />,
                          badge: "bg-red-500/10 text-red-400 border-red-500/20",
                        },
                        {
                          stage: "Warm",
                          count: warmLeads.length,
                          icon: <Thermometer className="h-4 w-4 text-amber-400" />,
                          badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        },
                        {
                          stage: "Cold",
                          count: coldLeads.length,
                          icon: <Snowflake className="h-4 w-4 text-blue-400" />,
                          badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        },
                      ].map((stage) => (
                        <div key={stage.stage} className="flex items-center justify-between text-xs p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            {stage.icon}
                            <span className="font-semibold">{stage.stage} Leads</span>
                          </div>
                          <Badge className={stage.badge}>{stage.count} accounts</Badge>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 text-xs grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Avg Lead Score</p>
                        <p className="font-bold text-emerald-400 text-base">{avgScore}/100</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Total Follow-ups</p>
                        <p className="font-bold text-indigo-300 text-base">{totalFollowups}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 space-y-3">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-400" /> Lead Score by Account
                    </h3>
                    <div className="space-y-3 pt-2">
                      {leads.slice(0, 6).map((lead) => {
                        const score = lead.lead_score || 0;
                        const name = lead.company_name || lead.person_name || "Lead Account";
                        return (
                          <div key={lead.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold truncate max-w-[200px]">{name}</span>
                              <span className="font-mono text-indigo-400 font-bold">{score}/100</span>
                            </div>
                            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${score >= 80
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                  : score >= 50
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                                    : "bg-gradient-to-r from-amber-500 to-rose-500"
                                  }`}
                                style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
