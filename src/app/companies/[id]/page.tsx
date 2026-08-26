"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as organizationServices from "@/services/public/organizationServices";
import * as peopleServices from "@/services/public/peopleServices";
import * as leadServices from "@/services/private/leadServices";
import * as taskServices from "@/services/private/taskServices";
import type { Organization, OrganizationNote, DecisionMaker, Lead, TaskItem } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Globe,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  ChevronLeft,
  ExternalLink,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Factory,
  Layers,
  FileCode2,
  MessageSquare,
  CheckSquare,
  Activity,
  Flame,
  FileText,
  User,
  Target,
  ArrowLeft,
} from "lucide-react";

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orgId = params?.id as string | undefined;

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [org, setOrg] = React.useState<Organization | null>(null);
  const [people, setPeople] = React.useState<DecisionMaker[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // New Note state
  const [newNoteContent, setNewNoteContent] = React.useState("");

  const loadOrgDetails = React.useCallback(async () => {
    if (!user || !orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const [orgData, peopleData, leadData, taskData] = await Promise.all([
        organizationServices.getOrganizationById(orgId),
        peopleServices.getDecisionMakers({ company_id: orgId }),
        leadServices.getLeadsActionByToken(token),
        taskServices.getTasksActionByToken(token),
      ]);

      setOrg(orgData);
      const orgName = orgData?.name || "";
      const pList = peopleData?.people || [];
      const lList = Array.isArray(leadData) ? leadData : [];
      const tList = Array.isArray(taskData) ? taskData : [];

      setPeople(pList.filter(p => p.company_name === orgName || String(p.company_id) === String(orgId)));
      setLeads(lList.filter(l => l.company_name === orgName));
      setTasks(tList.filter(t => t.related_company === orgName || String(t.related_lead_id) === String(orgId)));
    } catch (e) {
      console.error("Failed to load organization details:", e);
    } finally {
      setLoading(false);
    }
  }, [orgId, user]);

  React.useEffect(() => {
    loadOrgDetails();
  }, [loadOrgDetails]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !org) return;
    await organizationServices.addNote(org.id, newNoteContent);
    setNewNoteContent("");
    loadOrgDetails();
  };

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

  if (!org) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
        <div className="flex-1 flex flex-col min-w-0">
          <SalesProHeader
            title="Company Not Found"
            subtitle={orgId ? `No organization found matching ID #${orgId}` : "Invalid company ID provided"}
            onOpenCommandPalette={() => setCommandOpen(true)}
          />
          <main className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <h2 className="text-base font-bold">Company Profile Not Found</h2>
              <p className="text-xs text-muted-foreground mt-1">
                The requested company account could not be located in the database.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/companies")}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Companies
            </Button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title={org.name}
          subtitle={`Company Profile & Account Intelligence (Hasura aa_s_organizations ID: ${org.id})`}
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 w-full mx-auto overflow-y-auto">
          {/* Back Button & Top Banner Header */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/companies")}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Organizations Table
            </Button>

            <Card className="border-border/50 bg-card backdrop-blur-xl p-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-500/30 flex items-center justify-center font-bold text-2xl text-white font-mono shadow-lg shadow-indigo-500/20 shrink-0">
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-extrabold tracking-tight">{org.name}</h1>
                      <Badge
                        className={
                          org.status === "Customer" || org.lead_status === "Hot"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }
                      >
                        {org.status || org.lead_status || "Prospect"}
                      </Badge>
                      <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                        Score {org.score || 90}/100
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5 font-mono">
                      {(org.primary_domain || org.website_url) && (
                        <a href={org.website_url || `https://${org.primary_domain}`} target="_blank" rel="noreferrer" className="hover:text-indigo-400 flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5 text-indigo-400" /> {org.primary_domain || org.website_url?.replace(/^https?:\/\//, '')} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-purple-400" /> {org.primary_industry || org.industry || "-"}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-amber-400" /> {org.location || org.city || "Headquarters"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/outreach?organization=${encodeURIComponent(org.name)}`)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold"
                  >
                    <Send className="h-3.5 w-3.5" /> Log Outreach
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* 10 Profile Tabs Container */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-muted/40 border border-border/40 p-1 overflow-x-auto flex w-full justify-start text-xs font-semibold">
              <TabsTrigger value="overview" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" /> Overview</TabsTrigger>
              <TabsTrigger value="industries" className="gap-1.5 text-xs"><Factory className="h-3.5 w-3.5" /> Industries ({org.industry_list?.length || 1})</TabsTrigger>
              <TabsTrigger value="keywords" className="gap-1.5 text-xs"><Sparkles className="h-3.5 w-3.5" /> Keywords ({org.keywords_list?.length || 0})</TabsTrigger>
              <TabsTrigger value="languages" className="gap-1.5 text-xs"><Globe className="h-3.5 w-3.5" /> Languages ({org.language_list?.length || 0})</TabsTrigger>
              <TabsTrigger value="classifications" className="gap-1.5 text-xs"><FileCode2 className="h-3.5 w-3.5" /> Classifications</TabsTrigger>
              <TabsTrigger value="people" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> People ({people.length})</TabsTrigger>
              <TabsTrigger value="leads" className="gap-1.5 text-xs"><Target className="h-3.5 w-3.5" /> Leads ({leads.length})</TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5 text-xs"><MessageSquare className="h-3.5 w-3.5" /> Notes ({org.notes?.length || 0})</TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1.5 text-xs"><CheckSquare className="h-3.5 w-3.5" /> Tasks ({tasks.length})</TabsTrigger>
              <TabsTrigger value="activities" className="gap-1.5 text-xs"><Activity className="h-3.5 w-3.5" /> Activities ({org.activities?.length || 0})</TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Employee Count</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold font-mono">{org.employee_count?.toLocaleString() || "—"}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Headcount Tier: Enterprise</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Annual Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold font-mono text-emerald-400">{org.revenue || "—"}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Reported Revenue</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Founded Year</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold font-mono">{org.founded_year || "—"}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Established Account</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/50 bg-card">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-bold">AI Business Intelligence Overview</CardTitle>
                  <CardDescription className="text-xs">Enriched metadata synthesized from Hasura GraphQL telemetry</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs space-y-3 leading-relaxed text-muted-foreground">
                  <p>
                    <strong className="text-foreground">{org.name}</strong> operates within the <strong className="text-foreground">{org.primary_industry || org.industry || "-"}</strong> sector with a headcount of <strong className="text-foreground">{org.employee_count?.toLocaleString() || "—"}</strong> employees. Key domain tech stacks include {org.keywords_list?.map(k => k.keyword?.name).join(", ") || "-"}.
                  </p>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between font-mono text-[11px]">
                    <span>Last Telemetry Activity: <strong className="text-foreground">{org.last_activity || "Recently"}</strong></span>
                    <span className="text-indigo-400 font-bold">Account Score: {org.score || '-'}/100</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: INDUSTRIES */}
            <TabsContent value="industries" className="mt-4 space-y-4">
              <Card className="border-border/50 bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold">Related Industries (aa_s_organization_industries)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {org.industry_list && org.industry_list.length > 0 ? (
                    org.industry_list.map((ind) => (
                      <div key={ind.id} className="p-3 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Factory className="h-4 w-4 text-purple-400" />
                          <span className="font-bold text-foreground">{ind.industry?.name || org.primary_industry || org.industry}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400">Sector</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs font-bold">
                      {org.primary_industry || org.industry || "-"}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 3: KEYWORDS */}
            <TabsContent value="keywords" className="mt-4 space-y-4">
              <Card className="border-border/50 bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold">Tagged Keywords & Tech Stack (aa_s_organization_keywords)</h3>
                <div className="flex flex-wrap gap-2">
                  {org.keywords_list?.map((k) => (
                    <Badge key={k.id} className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 text-xs font-mono">
                      #{k.keyword?.name}
                    </Badge>
                  )) || <span className="text-xs text-muted-foreground">No keywords tagged yet.</span>}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 4: LANGUAGES */}
            <TabsContent value="languages" className="mt-4 space-y-4">
              <Card className="border-border/50 bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold">Supported Languages (aa_s_organization_languages)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {org.language_list?.map((l) => (
                    <div key={l.id} className="p-3 rounded-lg bg-muted/30 border border-border/40 flex items-center gap-2 text-xs font-semibold">
                      <Globe className="h-4 w-4 text-indigo-400" />
                      <span>{l.language?.name}</span>
                    </div>
                  )) || <span className="text-xs text-muted-foreground">English</span>}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 5: CLASSIFICATIONS */}
            <TabsContent value="classifications" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border/50 bg-card p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase text-indigo-400 flex items-center gap-2">
                    <Layers className="h-4 w-4" /> NAICS Industry Codes
                  </h3>
                  {org.naics_code_list?.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-indigo-300">Code {n.code}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-1">{n.title}</p>
                    </div>
                  )) || <p className="text-xs text-muted-foreground">NAICS 518210 - Data Processing & Hosting</p>}
                </Card>

                <Card className="border-border/50 bg-card p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase text-purple-400 flex items-center gap-2">
                    <FileCode2 className="h-4 w-4" /> SIC Industry Codes
                  </h3>
                  {org.sic_code_list?.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-purple-300">Code {s.code}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-1">{s.title}</p>
                    </div>
                  )) || <p className="text-xs text-muted-foreground">SIC 7374 - Computer Processing Services</p>}
                </Card>
              </div>
            </TabsContent>

            {/* TAB 6: PEOPLE */}
            <TabsContent value="people" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {people.length > 0 ? (
                  people.map((person) => (
                    <Card key={person.id} className="border-border/50 bg-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {person.name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "P"}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{person.name}</h4>
                          <p className="text-[11px] text-indigo-400">{person.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{person.email}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => router.push(`/outreach?email=${person.email}`)} className="text-[10px] h-7 bg-indigo-600 hover:bg-indigo-500 text-white">
                        Contact
                      </Button>
                    </Card>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No decision makers tagged for this account.</p>
                )}
              </div>
            </TabsContent>

            {/* TAB 7: LEADS */}
            <TabsContent value="leads" className="mt-4 space-y-4">
              <div className="space-y-3">
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <Card key={lead.id} className="border-border/50 bg-card p-4 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-foreground">{lead.stage || "Cold"} Stage</span>
                        <p className="text-muted-foreground text-[11px]">
                          Contact: {lead.person_name || lead.person?.name || "Lead Contact"}
                          {lead.person?.job_title ? ` (${lead.person.job_title})` : ""}
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-indigo-300 text-sm">Score: {lead.lead_score ?? 0}/100</span>
                        <Badge className="ml-2 bg-indigo-600/20 text-indigo-300">{lead.lead_temperature || "COLD"}</Badge>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No active leads attached to this account.</p>
                )}
              </div>
            </TabsContent>

            {/* TAB 8: NOTES */}
            <TabsContent value="notes" className="mt-4 space-y-4">
              <Card className="border-border/50 bg-card p-5 space-y-4">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <Textarea
                    placeholder="Add an internal sales note or meeting recap..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="bg-muted/40 text-xs min-h-[80px]"
                  />
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" /> Save Note
                  </Button>
                </form>

                <div className="space-y-3 pt-3 border-t border-border/30">
                  {org.notes?.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-indigo-400">{note.author}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{note.created_at}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-snug">{note.content}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 9: TASKS */}
            <TabsContent value="tasks" className="mt-4 space-y-4">
              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.map((t) => (
                    <Card key={t.id} className="border-border/50 bg-card p-4 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold">{t.title}</h4>
                        <p className="text-[10px] text-muted-foreground">Due: {t.due_date}</p>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-400">{t.priority}</Badge>
                    </Card>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No pending tasks for this company.</p>
                )}
              </div>
            </TabsContent>

            {/* TAB 10: ACTIVITIES */}
            <TabsContent value="activities" className="mt-4 space-y-4">
              <div className="space-y-3">
                {org.activities?.map((act) => (
                  <div key={act.id} className="p-3.5 rounded-lg bg-muted/30 border border-border/40 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-foreground">{act.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{act.timestamp}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{act.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
