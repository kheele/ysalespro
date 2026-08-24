"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  getCompanyAnalyticsReportsActionByToken,
  getIndustryAnalyticsReportsActionByToken,
  getLeadConversionReportsActionByToken,
  getEmailPerformanceReportsActionByToken,
  getOutreachPerformanceReportsActionByToken,
  getSalesActivityReportsActionByToken,
} from "@/services/private/reportServices";
import type {
  CompanyAnalyticsReport,
  IndustryAnalyticsReport,
  LeadConversionReport,
  EmailPerformanceReport,
  OutreachPerformanceReport,
  SalesActivityReport,
} from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText, Download, FileSpreadsheet, FileCode, Printer,
  Building2, Factory, TrendingUp, Mail, Send, Activity,
  BarChart3, CheckCircle2, ArrowUpRight, Percent, Users,
} from "lucide-react";

export type ReportCategory = "company" | "industry" | "conversion" | "email" | "outreach" | "activity";

export default function ReportsPage() {
  const { user } = useAuth();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<ReportCategory>("company");
  const [companyData, setCompanyData] = React.useState<CompanyAnalyticsReport[]>([]);
  const [industryData, setIndustryData] = React.useState<IndustryAnalyticsReport[]>([]);
  const [conversionData, setConversionData] = React.useState<LeadConversionReport[]>([]);
  const [emailData, setEmailData] = React.useState<EmailPerformanceReport[]>([]);
  const [outreachData, setOutreachData] = React.useState<OutreachPerformanceReport[]>([]);
  const [activityData, setActivityData] = React.useState<SalesActivityReport[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadReports() {
      if (!user) return;
      setLoading(true);
      try {
        const token = await user.getIdToken(true);
        const [c, i, conv, e, o, a] = await Promise.all([
          getCompanyAnalyticsReportsActionByToken(token),
          getIndustryAnalyticsReportsActionByToken(token),
          getLeadConversionReportsActionByToken(token),
          getEmailPerformanceReportsActionByToken(token),
          getOutreachPerformanceReportsActionByToken(token),
          getSalesActivityReportsActionByToken(token),
        ]);
        setCompanyData(c || []);
        setIndustryData(i || []);
        setConversionData(conv || []);
        setEmailData(e || []);
        setOutreachData(o || []);
        setActivityData(a || []);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [user]);

  const handleExportCSV = (tab: ReportCategory) => {
    let content = "";
    if (tab === "company") {
      content = "Company,Industry,Employees,Revenue,Leads,Deals Won,Pipeline\n" +
        companyData.map(c => `"${c.company_name}","${c.industry}",${c.employee_count},"${c.revenue}",${c.leads_count},${c.deals_won},"${c.pipeline_value}"`).join("\n");
    } else if (tab === "industry") {
      content = "Industry,Companies,Total Leads,Conversion Rate,Avg Deal Size,Growth Rate\n" +
        industryData.map(i => `"${i.industry_name}",${i.company_count},${i.total_leads},"${i.conversion_rate}","${i.avg_deal_size}","${i.growth_rate}"`).join("\n");
    } else {
      content = "Report Type,Generated At\n" + `"${tab}","${new Date().toISOString()}"`;
    }
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${tab}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = (tab: ReportCategory) => {
    handleExportCSV(tab);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Reports & Analytics"
          subtitle="Real-time multi-dimensional analytics: performance, conversions, deliverability, and rep activities"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-5 max-w-7xl mx-auto overflow-y-auto w-full">

          {/* Controls & Export Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground capitalize">{activeTab} Analytics Report</h1>
                <p className="text-xs text-muted-foreground">Select a report module below to view live data and export.</p>
              </div>
            </div>

            {/* Export Actions Group */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => handleExportCSV(activeTab)}
                className="text-xs h-9 gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/60 text-foreground">
                <FileCode className="h-4 w-4 text-emerald-400" /> Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExportExcel(activeTab)}
                className="text-xs h-9 gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/60 text-foreground">
                <FileSpreadsheet className="h-4 w-4 text-green-400" /> Export Excel (.xls)
              </Button>
              <Button size="sm" onClick={handleExportPDF}
                className="text-xs h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20">
                <Printer className="h-4 w-4" /> Export / Print PDF
              </Button>
            </div>
          </div>

          {/* 6 Core Report Category Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportCategory)} className="w-full space-y-5">
            <TabsList className="bg-card p-1 rounded-xl h-auto flex flex-wrap gap-1">
              <TabsTrigger value="company" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3 gap-2">
                <Building2 className="h-3.5 w-3.5" /> Company Analytics
              </TabsTrigger>
              <TabsTrigger value="industry" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3 gap-2">
                <Factory className="h-3.5 w-3.5" /> Industry Analytics
              </TabsTrigger>
              <TabsTrigger value="conversion" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3 gap-2">
                <TrendingUp className="h-3.5 w-3.5" /> Lead Conversion
              </TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3 gap-2">
                <Mail className="h-3.5 w-3.5" /> Email Performance
              </TabsTrigger>
              <TabsTrigger value="outreach" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3 gap-2">
                <Send className="h-3.5 w-3.5" /> Outreach Performance
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 px-3 gap-2">
                <Activity className="h-3.5 w-3.5" /> Sales Activity
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Company Analytics */}
            <TabsContent value="company">
              <Card className="border-border/50 bg-card/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[10px] border-b border-border/50">
                      <tr>
                        <th className="p-3">Company Name</th>
                        <th className="p-3">Industry</th>
                        <th className="p-3">Country</th>
                        <th className="p-3">Employees</th>
                        <th className="p-3">Annual Revenue</th>
                        <th className="p-3">Leads Generated</th>
                        <th className="p-3">Deals Won</th>
                        <th className="p-3">Pipeline Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {companyData.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-bold text-foreground">{row.company_name || (row as any).company}</td>
                          <td className="p-3 text-indigo-300">{row.industry}</td>
                          <td className="p-3 text-muted-foreground">{(row as any).country || "USA"}</td>
                          <td className="p-3 font-mono">{(row.employee_count ?? (row as any).employees ?? 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-emerald-400">{row.revenue}</td>
                          <td className="p-3 font-mono font-bold text-indigo-300">{row.leads_count ?? (row as any).leadCount ?? 0}</td>
                          <td className="p-3 font-mono text-purple-400">{row.deals_won ?? (row as any).dealsWon ?? 0}</td>
                          <td className="p-3 font-mono font-extrabold text-foreground">{row.pipeline_value || (row as any).pipelineValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 2: Industry Analytics */}
            <TabsContent value="industry">
              <Card className="border-border/50 bg-card/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[10px] border-b border-border/50">
                      <tr>
                        <th className="p-3">Industry Vertical</th>
                        <th className="p-3">Companies Tracked</th>
                        <th className="p-3">Total Leads</th>
                        <th className="p-3">Conversion Rate</th>
                        <th className="p-3">Avg Deal Size</th>
                        <th className="p-3">YoY Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {industryData.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-bold text-foreground">{row.industry_name || (row as any).industry}</td>
                          <td className="p-3 font-mono">{row.company_count ?? (row as any).companyCount ?? 0}</td>
                          <td className="p-3 font-mono text-indigo-300">{row.total_leads ?? (row as any).totalLeads ?? 0}</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{row.conversion_rate || (row as any).conversionRate}</td>
                          <td className="p-3 font-mono text-purple-400">{row.avg_deal_size || (row as any).avgDealSize}</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-400">{row.growth_rate || (row as any).growthRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 3: Lead Conversion */}
            <TabsContent value="conversion">
              <Card className="border-border/50 bg-card/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[10px] border-b border-border/50">
                      <tr>
                        <th className="p-3">Pipeline Stage</th>
                        <th className="p-3">Leads Remaining</th>
                        <th className="p-3">Conversion %</th>
                        <th className="p-3">Drop-off Rate</th>
                        <th className="p-3">Avg Days in Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {conversionData.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-bold text-foreground">{row.stage}</td>
                          <td className="p-3 font-mono font-bold text-indigo-300">{row.count ?? (row as any).leadCount ?? 0}</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{row.conversion_rate || (row as any).conversionPct}</td>
                          <td className="p-3 font-mono text-red-400">{row.dropoff_rate || (row as any).dropoffRate}</td>
                          <td className="p-3 font-mono text-muted-foreground">{row.avg_days_in_stage ?? (row as any).avgDaysInStage ?? 0} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 4: Email Performance */}
            <TabsContent value="email">
              <Card className="border-border/50 bg-card/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[10px] border-b border-border/50">
                      <tr>
                        <th className="p-3">Campaign Name</th>
                        <th className="p-3">Emails Sent</th>
                        <th className="p-3">Delivered %</th>
                        <th className="p-3">Open Rate</th>
                        <th className="p-3">Click Rate</th>
                        <th className="p-3">Reply Rate</th>
                        <th className="p-3">Bounce Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {emailData.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-bold text-foreground">{row.campaign_name || (row as any).campaign}</td>
                          <td className="p-3 font-mono">{(row.emails_sent ?? (row as any).sent ?? 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-cyan-400">{row.delivered_percent || (row as any).deliveredPct}</td>
                          <td className="p-3 font-mono text-indigo-300 font-bold">{row.open_rate || (row as any).openPct}</td>
                          <td className="p-3 font-mono text-purple-400">{row.click_rate || (row as any).clickPct}</td>
                          <td className="p-3 font-mono text-emerald-400 font-extrabold">{row.reply_rate || (row as any).replyPct}</td>
                          <td className="p-3 font-mono text-red-400">{row.bounce_rate || (row as any).bouncePct}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 5: Outreach Performance */}
            <TabsContent value="outreach">
              <Card className="border-border/50 bg-card/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[10px] border-b border-border/50">
                      <tr>
                        <th className="p-3">Outreach Channel</th>
                        <th className="p-3">Total Attempts</th>
                        <th className="p-3">Connected Count</th>
                        <th className="p-3">Connect Rate</th>
                        <th className="p-3">Meetings Booked</th>
                        <th className="p-3">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {outreachData.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-bold text-foreground">{row.channel}</td>
                          <td className="p-3 font-mono">{(row.total_attempts ?? (row as any).totalAttempts ?? 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-indigo-300">{(row.connected_count ?? (row as any).connectedCount ?? 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-cyan-400 font-bold">{row.connect_rate || (row as any).connectRatePct}</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{row.meetings_booked ?? (row as any).meetingsBooked ?? 0}</td>
                          <td className="p-3 font-mono text-purple-400 font-extrabold">{row.conversion_rate || (row as any).conversionRatePct}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 6: Sales Activity */}
            <TabsContent value="activity">
              <Card className="border-border/50 bg-card/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[10px] border-b border-border/50">
                      <tr>
                        <th className="p-3">Sales Representative</th>
                        <th className="p-3">Emails Sent</th>
                        <th className="p-3">Calls Made</th>
                        <th className="p-3">LinkedIn Messages</th>
                        <th className="p-3">Meetings Held</th>
                        <th className="p-3">Deals Closed</th>
                        <th className="p-3">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {activityData.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-bold text-foreground">{row.rep_name || (row as any).repName}</td>
                          <td className="p-3 font-mono">{(row.emails_sent ?? (row as any).emailsSent ?? 0).toLocaleString()}</td>
                          <td className="p-3 font-mono">{row.calls_made ?? (row as any).callsMade ?? 0}</td>
                          <td className="p-3 font-mono">{row.linkedin_messages ?? (row as any).linkedInMessages ?? 0}</td>
                          <td className="p-3 font-mono text-indigo-300 font-bold">{row.meetings_held ?? (row as any).meetingsHeld ?? 0}</td>
                          <td className="p-3 font-mono text-purple-400 font-bold">{row.deals_closed ?? (row as any).dealsClosed ?? 0}</td>
                          <td className="p-3 font-mono text-emerald-400 font-extrabold text-sm">{row.revenue_generated || (row as any).revenueGenerated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
