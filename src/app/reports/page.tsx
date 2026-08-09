"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { reportServices, ReportCategory } from "@/services/reportServices";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText, Download, FileSpreadsheet, FileCode, Printer,
  Building2, Factory, TrendingUp, Mail, Send, Activity,
  BarChart3, CheckCircle2, ArrowUpRight, Percent, Users,
} from "lucide-react";

export default function ReportsPage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<ReportCategory>("company");

  const companyData = reportServices.getCompanyAnalytics();
  const industryData = reportServices.getIndustryAnalytics();
  const conversionData = reportServices.getLeadConversion();
  const emailData = reportServices.getEmailPerformance();
  const outreachData = reportServices.getOutreachPerformance();
  const activityData = reportServices.getSalesActivity();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Reports & Analytics"
          subtitle="Comprehensive enterprise intelligence reports with direct CSV, Excel, and PDF export capabilities"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">

          {/* Top Export Bar & Category Tabs Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground capitalize">{activeTab} Analytics Report</h1>
                <p className="text-xs text-muted-foreground">Select a report module below to view live data and export.</p>
              </div>
            </div>

            {/* Export Actions Group */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => reportServices.exportCSV(activeTab)}
                className="text-xs h-9 gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/60 text-foreground">
                <FileCode className="h-4 w-4 text-emerald-400" /> Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => reportServices.exportExcel(activeTab)}
                className="text-xs h-9 gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/60 text-foreground">
                <FileSpreadsheet className="h-4 w-4 text-green-400" /> Export Excel (.xls)
              </Button>
              <Button size="sm" onClick={() => reportServices.exportPDF(activeTab)}
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
                          <td className="p-3 font-bold text-foreground">{row.company}</td>
                          <td className="p-3 text-indigo-300">{row.industry}</td>
                          <td className="p-3 text-muted-foreground">{row.country}</td>
                          <td className="p-3 font-mono">{row.employees.toLocaleString()}</td>
                          <td className="p-3 font-mono text-emerald-400">{row.revenue}</td>
                          <td className="p-3 font-mono font-bold text-indigo-300">{row.leadCount}</td>
                          <td className="p-3 font-mono text-purple-400">{row.dealsWon}</td>
                          <td className="p-3 font-mono font-extrabold text-foreground">{row.pipelineValue}</td>
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
                          <td className="p-3 font-bold text-foreground">{row.industry}</td>
                          <td className="p-3 font-mono">{row.companyCount}</td>
                          <td className="p-3 font-mono text-indigo-300">{row.totalLeads}</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{row.conversionRate}</td>
                          <td className="p-3 font-mono text-purple-400">{row.avgDealSize}</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-400">{row.growthRate}</td>
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
                          <td className="p-3 font-mono font-bold text-indigo-300">{row.leadCount}</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{row.conversionPct}%</td>
                          <td className="p-3 font-mono text-red-400">{row.dropoffRate}%</td>
                          <td className="p-3 font-mono text-muted-foreground">{row.avgDaysInStage} days</td>
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
                          <td className="p-3 font-bold text-foreground">{row.campaign}</td>
                          <td className="p-3 font-mono">{row.sent.toLocaleString()}</td>
                          <td className="p-3 font-mono text-cyan-400">{row.deliveredPct}%</td>
                          <td className="p-3 font-mono text-indigo-300 font-bold">{row.openPct}%</td>
                          <td className="p-3 font-mono text-purple-400">{row.clickPct}%</td>
                          <td className="p-3 font-mono text-emerald-400 font-extrabold">{row.replyPct}%</td>
                          <td className="p-3 font-mono text-red-400">{row.bouncePct}%</td>
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
                          <td className="p-3 font-mono">{row.totalAttempts.toLocaleString()}</td>
                          <td className="p-3 font-mono text-indigo-300">{row.connectedCount.toLocaleString()}</td>
                          <td className="p-3 font-mono text-cyan-400 font-bold">{row.connectRatePct}%</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{row.meetingsBooked}</td>
                          <td className="p-3 font-mono text-purple-400 font-extrabold">{row.conversionRatePct}%</td>
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
                          <td className="p-3 font-bold text-foreground">{row.repName}</td>
                          <td className="p-3 font-mono">{row.emailsSent.toLocaleString()}</td>
                          <td className="p-3 font-mono">{row.callsMade}</td>
                          <td className="p-3 font-mono">{row.linkedInMessages}</td>
                          <td className="p-3 font-mono text-indigo-300 font-bold">{row.meetingsHeld}</td>
                          <td className="p-3 font-mono text-purple-400 font-bold">{row.dealsClosed}</td>
                          <td className="p-3 font-mono text-emerald-400 font-extrabold text-sm">{row.revenueGenerated}</td>
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
