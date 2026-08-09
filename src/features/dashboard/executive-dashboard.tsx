"use client";

import * as React from "react";
import {
  Building2,
  Factory,
  Users,
  Target,
  Send,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  CheckCircle2,
  Clock,
  Mail,
  PhoneCall,
  Calendar,
  Sparkles,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { dashboardServices, DashboardKPIs, ActivityFeedItem } from "@/services/dashboardServices";
import { analyticsServices } from "@/services/analyticsServices";

export function ExecutiveDashboard() {
  const [kpis, setKpis] = React.useState<DashboardKPIs | null>(null);
  const [activities, setActivities] = React.useState<ActivityFeedItem[]>([]);
  const [growthData, setGrowthData] = React.useState<any[]>([]);
  const [industryData, setIndustryData] = React.useState<any[]>([]);
  const [locationData, setLocationData] = React.useState<any[]>([]);
  const [sizeData, setSizeData] = React.useState<any[]>([]);
  const [pipelineData, setPipelineData] = React.useState<any[]>([]);
  const [outreachData, setOutreachData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        kpiRes,
        actRes,
        growthRes,
        indRes,
        locRes,
        sizeRes,
        pipeRes,
        outRes,
      ] = await Promise.all([
        dashboardServices.getKPIs(),
        dashboardServices.getActivityFeed(),
        analyticsServices.getOrganizationGrowthTrend(),
        analyticsServices.getIndustryDistribution(),
        analyticsServices.getLocationDistribution(),
        analyticsServices.getEmployeeSizeDistribution(),
        analyticsServices.getLeadPipelineData(),
        analyticsServices.getOutreachPerformance(),
      ]);

      setKpis(kpiRes);
      setActivities(actRes);
      setGrowthData(growthRes);
      setIndustryData(indRes);
      setLocationData(locRes);
      setSizeData(sizeRes);
      setPipelineData(pipeRes);
      setOutreachData(outRes);
    } catch (err) {
      console.error("Error loading executive dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading || !kpis) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-muted/60 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 bg-card border border-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Executive Welcome & Refresh Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card backdrop-blur-xl p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Executive Sales & Intelligence Dashboard</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time telemetry across companies, decision makers, leads pipeline, and outreach performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            className="text-xs gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Module 1 KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Card 1: Companies */}
        <Card className="border-border/50 bg-card backdrop-blur-md shadow-sm hover:shadow-indigo-500/5 transition-all">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Companies
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono">
              {kpis.companies.total.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-1 py-0 text-[10px]">
                +{kpis.companies.newToday} today
              </Badge>
              <span>· +{kpis.companies.newThisMonth} this month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Industries */}
        <Card className="border-border/50 bg-card backdrop-blur-md shadow-sm hover:shadow-purple-500/5 transition-all">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Industries
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Factory className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono">
              {kpis.industries.total}
            </div>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground truncate">
              <span className="font-semibold text-foreground">Top:</span> Cloud, Cyber, Fintech
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Decision Makers */}
        <Card className="border-border/50 bg-card backdrop-blur-md shadow-sm hover:shadow-cyan-500/5 transition-all">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              People
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono">
              {kpis.people.totalDecisionMakers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
              <span className="text-emerald-400 font-semibold">98.4%</span> verified emails
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 4: Lead Pipeline */}
        <Card className="border-border/50 bg-card backdrop-blur-md shadow-sm hover:shadow-red-500/5 transition-all">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lead Pipeline
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono">
              {kpis.leads.total}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
              <span className="text-blue-400 font-semibold">{kpis.leads.cold} Cold</span>
              <span className="text-amber-400 font-semibold">{kpis.leads.warm} Warm</span>
              <span className="text-red-400 font-extrabold">{kpis.leads.hot} Hot</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Outreach & Activity */}
        <Card className="border-border/50 bg-card backdrop-blur-md shadow-sm hover:shadow-emerald-500/5 transition-all">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Outreach
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Send className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono">
              {(kpis.outreach.emailsSent / 1000).toFixed(1)}k
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
              <span>{kpis.outreach.callsMade} Calls</span>
              <span className="text-amber-400">{kpis.outreach.followupsPending} Pending</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Growth Trend (Span 2) */}
        <Card className="lg:col-span-2 border-border/50 bg-card backdrop-blur-md">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Organization Growth & Lead Velocity</CardTitle>
                <CardDescription className="text-xs">Cumulative enterprise orgs & active leads pipeline over time</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                +24.8% YoY
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area type="monotone" dataKey="organizations" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorOrgs)" name="Organizations" />
                  <Area type="monotone" dataKey="leads" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" name="Active Leads" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Industry Distribution Donut */}
        <Card className="border-border/50 bg-card backdrop-blur-md">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold">Industry Sector Share</CardTitle>
            <CardDescription className="text-xs">Distribution of target orgs across core industries</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={industryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {industryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Analytics Row: Employee Size & Location & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies by Location */}
        <Card className="border-border/50 bg-card backdrop-blur-md">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold">Companies by Region</CardTitle>
            <CardDescription className="text-xs">Geographic breakdown of enriched accounts</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" stroke="#888888" fontSize={11} />
                  <YAxis dataKey="country" type="category" stroke="#888888" fontSize={10} width={90} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Companies" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Companies by Employee Size */}
        <Card className="border-border/50 bg-card backdrop-blur-md">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold">Employee Size Bracket</CardTitle>
            <CardDescription className="text-xs">Distribution by headcounts</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="range" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} name="Accounts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead Pipeline Conversion Funnel */}
        <Card className="border-border/50 bg-card backdrop-blur-md">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold">Pipeline Value by Stage</CardTitle>
            <CardDescription className="text-xs">Estimated deal volume per pipeline stage</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="stage" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Pipeline Value"]}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outreach Performance & Live Activity Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Email & Call Outreach Performance (Span 2) */}
        <Card className="lg:col-span-2 border-border/50 bg-card backdrop-blur-md">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Outreach Telemetry (Weekly)</CardTitle>
                <CardDescription className="text-xs">Emails sent, opens, and link click responses</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  68.4% Open Rate
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={outreachData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} name="Emails Sent" />
                  <Line type="monotone" dataKey="opened" stroke="#10b981" strokeWidth={2} name="Opened" />
                  <Line type="monotone" dataKey="clicked" stroke="#f59e0b" strokeWidth={2} name="Clicked Link" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="border-border/50 bg-card backdrop-blur-md">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Activity Feed</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Real-time</Badge>
            </div>
            <CardDescription className="text-xs">Latest telemetry events in YSalesPro</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {activities.map((act) => (
                <div key={act.id} className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground truncate">{act.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{act.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{act.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
