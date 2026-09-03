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
import type { Organization, OrganizationEmail, DecisionMaker, Lead, TaskItem } from "@/lib/types";
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
  Loader2,
  Mail,
  Phone,
  Newspaper,
  Copy,
  Check,
  Search,
  Radio,
  TrendingUp,
} from "lucide-react";

interface CompanyNewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

// Brand SVG Icons
function LinkedInIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 0-2.9 1.45 1.45 0 0 0 0 2.9m1.37 9.74v-8.37H5.1v8.37h2.73z" />
    </svg>
  );
}

function TwitterIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function CrunchbaseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M21.6 0H2.4C1.08 0 0 1.08 0 2.4v19.2C0 22.92 1.08 24 2.4 24h19.2c1.32 0 2.4-1.08 2.4-2.4V2.4C24 1.08 22.92 0 21.6 0zm-8.8 17.4c-3.2 0-5.8-2.6-5.8-5.8 0-3.2 2.6-5.8 5.8-5.8 2.6 0 4.8 1.7 5.5 4.1h-2.3c-.5-1.2-1.7-2-3.2-2-1.9 0-3.4 1.5-3.4 3.4 0 1.9 1.5 3.4 3.4 3.4 1.5 0 2.7-.8 3.2-2h2.3c-.7 2.4-2.9 4.1-5.5 4.1z" />
    </svg>
  );
}

function AngelListIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M13.978 2.05a.75.75 0 0 0-.956 0L2.35 11.2a.75.75 0 0 0 .956 1.156L4.5 11.332V20.25a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-5.25h3v5.25a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75V11.332l1.194 1.024a.75.75 0 1 0 .956-1.156z" />
    </svg>
  );
}

function normalizeExternalUrl(
  rawUrl?: string | null,
  platform?: "website" | "linkedin" | "twitter" | "facebook" | "crunchbase" | "angellist"
): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (platform === "linkedin" && !trimmed.includes("linkedin.com")) {
    const handle = trimmed.replace(/^(\/|@)/, "");
    return `https://www.linkedin.com/${handle.startsWith("company/") ? handle : `company/${handle}`}`;
  }

  if (platform === "twitter" && !trimmed.includes("twitter.com") && !trimmed.includes("x.com")) {
    const handle = trimmed.replace(/^@/, "");
    return `https://x.com/${handle}`;
  }

  if (platform === "facebook" && !trimmed.includes("facebook.com")) {
    const handle = trimmed.replace(/^(\/|@)/, "");
    return `https://www.facebook.com/${handle}`;
  }

  if (platform === "crunchbase" && !trimmed.includes("crunchbase.com")) {
    const handle = trimmed.replace(/^(\/)/, "");
    return `https://www.crunchbase.com/${handle.startsWith("organization/") ? handle : `organization/${handle}`}`;
  }

  if (platform === "angellist" && !trimmed.includes("wellfound.com") && !trimmed.includes("angel.co")) {
    const handle = trimmed.replace(/^(\/)/, "");
    return `https://wellfound.com/company/${handle}`;
  }

  return `https://${trimmed}`;
}

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

  // News State
  const [news, setNews] = React.useState<CompanyNewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = React.useState(false);

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
      setTasks(tList.filter(t => String(t.related_company_id) === String(orgId) || t.related_company?.name === orgName));
    } catch (e) {
      console.error("Failed to load organization details:", e);
    } finally {
      setLoading(false);
    }
  }, [orgId, user]);

  React.useEffect(() => {
    loadOrgDetails();
  }, [loadOrgDetails]);

  // Fetch Company News
  React.useEffect(() => {
    if (org?.name) {
      setNewsLoading(true);
      fetch(`/api/companies/${org.id}/news?q=${encodeURIComponent(org.name)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.articles)) {
            setNews(data.articles);
          }
        })
        .catch((err) => console.error("Failed to load company news:", err))
        .finally(() => setNewsLoading(false));
    }
  }, [org?.id, org?.name]);

  const [isAddingNote, setIsAddingNote] = React.useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !org) return;
    setIsAddingNote(true);
    try {
      await organizationServices.addNote(org.id, newNoteContent);
      setNewNoteContent("");
      loadOrgDetails();
    } catch (e) {
      console.error("Failed to add note:", e);
    } finally {
      setIsAddingNote(false);
    }
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

  // Normalized links
  const websiteUrl = normalizeExternalUrl(org.website_url || org.primary_domain, "website");
  const linkedinUrl = normalizeExternalUrl(org.linkedin_url, "linkedin");
  const twitterUrl = normalizeExternalUrl(org.twitter_url, "twitter");
  const facebookUrl = normalizeExternalUrl(org.facebook_url, "facebook");
  const crunchbaseUrl = normalizeExternalUrl(org.crunchbase_url, "crunchbase");
  const angellistUrl = normalizeExternalUrl(org.angellist_url, "angellist");

  const emailsList = org.email_list || [];
  const primaryPhone = org.primary_phone_number || org.phone || org.primary_phone_sanitized || org.sanitized_phone;
  const totalContactsCount = emailsList.length + (primaryPhone ? 1 : 0) + people.length;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title={org.name}
          subtitle={`Company Profile & Account Intelligence · Organization #${org.id}`}
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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-500/30 flex items-center justify-center font-bold text-2xl text-white font-mono shadow-lg shadow-indigo-500/20 shrink-0">
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-extrabold tracking-tight">{org.name}</h1>
                      <Badge
                        className={
                          org.status === "Customer" || org.lead_status === "Hot"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }
                      >
                        {org.status || org.lead_status || "Prospect"}
                      </Badge>
                      <Badge className="bg-indigo-500/10 text-indigo-400 text-xs">
                        Score {org.score || "-"}/100
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-purple-400" /> {org.primary_industry || org.industry || "-"}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-amber-400" /> {org.location || org.city || "Headquarters"}
                      </span>
                    </div>

                    {/* Prominent Website & Social Media Badges/Links in Header Banner */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {websiteUrl && (
                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-colors shadow-sm"
                        >
                          <Globe className="h-3.5 w-3.5 text-indigo-400" />
                          <span>{org.primary_domain || org.website_url?.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink className="h-2.5 w-2.5 text-indigo-400/70" />
                        </a>
                      )}

                      {linkedinUrl && (
                        <a
                          href={linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="LinkedIn Profile"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                        >
                          <LinkedInIcon className="h-3.5 w-3.5" />
                          <span>LinkedIn</span>
                          <ExternalLink className="h-2.5 w-2.5 text-blue-400/70" />
                        </a>
                      )}

                      {twitterUrl && (
                        <a
                          href={twitterUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Twitter / X Profile"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                        >
                          <TwitterIcon className="h-3 w-3" />
                          <span>X (Twitter)</span>
                          <ExternalLink className="h-2.5 w-2.5 text-neutral-400" />
                        </a>
                      )}

                      {facebookUrl && (
                        <a
                          href={facebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Facebook Page"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 transition-colors"
                        >
                          <FacebookIcon className="h-3.5 w-3.5" />
                          <span>Facebook</span>
                          <ExternalLink className="h-2.5 w-2.5 text-blue-300/70" />
                        </a>
                      )}

                      {crunchbaseUrl && (
                        <a
                          href={crunchbaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Crunchbase Profile"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                        >
                          <CrunchbaseIcon className="h-3.5 w-3.5" />
                          <span>Crunchbase</span>
                          <ExternalLink className="h-2.5 w-2.5 text-emerald-400/70" />
                        </a>
                      )}

                      {angellistUrl && (
                        <a
                          href={angellistUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="AngelList / Wellfound Profile"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 transition-colors"
                        >
                          <AngelListIcon className="h-3.5 w-3.5" />
                          <span>Wellfound</span>
                          <ExternalLink className="h-2.5 w-2.5 text-pink-400/70" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/outreach?id=${org.id}`)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold"
                  >
                    <Send className="h-3.5 w-3.5" /> Log Outreach
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Tabs Container */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-card border border-border/40 p-1 overflow-x-auto flex w-full justify-start text-xs font-semibold gap-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="contacts" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-1.5 text-xs text-emerald-400">
                <Mail className="h-3.5 w-3.5" /> Contacts ({totalContactsCount})
              </TabsTrigger>
              {/* <TabsTrigger value="news" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-1.5 text-xs text-sky-400">
                <Newspaper className="h-3.5 w-3.5" /> Company News ({news.length})
              </TabsTrigger> */}
              <TabsTrigger value="people" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" /> People ({people.length})
              </TabsTrigger>
              <TabsTrigger value="leads" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-1.5 text-xs">
                <Target className="h-3.5 w-3.5" /> Leads ({leads.length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5" /> Notes ({org.notes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-1.5 text-xs">
                <CheckSquare className="h-3.5 w-3.5" /> Tasks ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5" /> Activities ({org.activities?.length || 0})
              </TabsTrigger>
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

              {/* Dedicated Website & Social Channels Overview Card */}
              <Card className="border-border/50 bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-indigo-400" /> Web & Digital Media Presence
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Verified corporate website and official social media footprints
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Website */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-muted-foreground">Corporate Website</div>
                        <div className="text-xs font-bold truncate">
                          {websiteUrl ? (
                            <a href={websiteUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                              {org.primary_domain || org.website_url}
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Not available</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {websiteUrl && (
                      <a href={websiteUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <LinkedInIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-muted-foreground">LinkedIn</div>
                        <div className="text-xs font-bold truncate">
                          {linkedinUrl ? (
                            <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                              View Company Page
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Not connected</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {linkedinUrl && (
                      <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Twitter / X */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                        <TwitterIcon className="h-3.5 w-3.5 text-neutral-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-muted-foreground">Twitter / X</div>
                        <div className="text-xs font-bold truncate">
                          {twitterUrl ? (
                            <a href={twitterUrl} target="_blank" rel="noreferrer" className="text-muted-foreground/60 hover:underline">
                              Follow @{org.twitter_url?.replace(/^@/, "").replace(/^https?:\/\/(x|twitter)\.com\//, "")}
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Not connected</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {twitterUrl && (
                      <a href={twitterUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Facebook */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
                        <FacebookIcon className="h-4 w-4 text-blue-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-muted-foreground">Facebook</div>
                        <div className="text-xs font-bold truncate">
                          {facebookUrl ? (
                            <a href={facebookUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">
                              Official Page
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Not connected</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {facebookUrl && (
                      <a href={facebookUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Crunchbase */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <CrunchbaseIcon className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-muted-foreground">Crunchbase</div>
                        <div className="text-xs font-bold truncate">
                          {crunchbaseUrl ? (
                            <a href={crunchbaseUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                              Funding & Profile
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Not connected</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {crunchbaseUrl && (
                      <a href={crunchbaseUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* AngelList / Wellfound */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                        <AngelListIcon className="h-4 w-4 text-pink-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-muted-foreground">Wellfound (AngelList)</div>
                        <div className="text-xs font-bold truncate">
                          {angellistUrl ? (
                            <a href={angellistUrl} target="_blank" rel="noreferrer" className="text-pink-400 hover:underline">
                              Startup Profile
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Not connected</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {angellistUrl && (
                      <a href={angellistUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="border-border/50 bg-card">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-bold">AI Business Intelligence Overview</CardTitle>
                  <CardDescription className="text-xs">Enriched account metadata and verified industry intelligence</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs space-y-3 leading-relaxed text-muted-foreground">
                  <p>
                    <strong className="text-foreground">{org.name}</strong> operates within the{" "}
                    <strong className="text-foreground">{org.primary_industry || org.industry || "-"}</strong> sector with a
                    headcount of <strong className="text-foreground">{org.employee_count?.toLocaleString() || "—"}</strong>{" "}
                    employees. Key domain tech stacks include {org.keywords_list?.map((k) => k.keyword?.name).join(", ") || "-"}.
                  </p>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between font-mono text-[11px]">
                    <span>
                      Last Telemetry Activity: <strong className="text-foreground">{org.last_activity || "Recently"}</strong>
                    </span>
                    <span className="text-indigo-400 font-bold">Account Score: {org.score || "-"}/100</span>
                  </div>
                </CardContent>
              </Card>

              {/* Consolidated Industry & Languages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Industries */}
                <Card className="border-border/50 bg-card p-5 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Factory className="h-4 w-4 text-purple-400" /> Related Industries ({org.industry_list?.length || 1})
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {org.industry_list && org.industry_list.length > 0 ? (
                      org.industry_list.map((ind) => (
                        <div
                          key={ind.id}
                          className="p-2.5 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Factory className="h-3.5 w-3.5 text-purple-400" />
                            <span className="font-semibold text-foreground">
                              {ind.industry?.name || org.primary_industry || org.industry}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400">
                            Sector
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs font-semibold">
                        {org.primary_industry || org.industry || "-"}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Supported Languages */}
                <Card className="border-border/50 bg-card p-5 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-400" /> Supported Languages ({org.language_list?.length || 0})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {org.language_list && org.language_list.length > 0 ? (
                      org.language_list.map((l) => (
                        <div
                          key={l.id}
                          className="p-2.5 rounded-lg bg-muted/30 border border-border/40 flex items-center gap-2 text-xs font-semibold"
                        >
                          <Globe className="h-3.5 w-3.5 text-indigo-400" />
                          <span>{l.language?.name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">English</span>
                    )}
                  </div>
                </Card>
              </div>

              {/* Classifications (NAICS & SIC) */}
              <div className="grid grid-cols-1 gap-6">
                <Card className="border-border/50 bg-card p-5 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-400" /> Industry Classifications (NAICS & SIC)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase text-indigo-400 flex items-center gap-1.5">
                        <Layers className="h-3 w-3" /> NAICS Codes
                      </span>
                      {org.naics_code_list && org.naics_code_list.length > 0 ? (
                        org.naics_code_list.map((n) => (
                          <div key={n.id} className="p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                            <span className="font-bold text-indigo-300 font-mono">Code {n.code}</span>
                            <p className="text-muted-foreground text-[10px] mt-0.5">{n.title}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground">No NAICS codes assigned</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase text-purple-400 flex items-center gap-1.5">
                        <FileCode2 className="h-3 w-3" /> SIC Codes
                      </span>
                      {org.sic_code_list && org.sic_code_list.length > 0 ? (
                        org.sic_code_list.map((s) => (
                          <div key={s.id} className="p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                            <span className="font-bold text-purple-300 font-mono">Code {s.code}</span>
                            <p className="text-muted-foreground text-[10px] mt-0.5">{s.title}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground">No SIC codes assigned</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Keywords & Tech Stack */}
                <Card className="border-border/50 bg-card p-5 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" /> Tagged Keywords & Tech Stack ({org.keywords_list?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {org.keywords_list && org.keywords_list.length > 0 ? (
                      org.keywords_list.map((k) => (
                        <Badge key={k.id} variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400">
                          #{k.keyword?.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No keywords tagged yet.</span>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: CONTACTS (NEW DEDICATED TAB) */}
            <TabsContent value="contacts" className="mt-4 space-y-6">
              {/* Verified Organization Emails */}
              <Card className="border-border/50 bg-card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-400" /> Verified Company Emails ({emailsList.length})
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/outreach?id=${org.id}`)}
                    className="text-xs gap-1.5 h-8 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 self-start sm:self-auto"
                  >
                    <Send className="h-3 w-3" /> Bulk Outreach
                  </Button>
                </div>

                {emailsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {emailsList.map((em, idx) => {
                      const isInternal = em.email_type === "internal";
                      const copyKey = `email-${em.id || idx}`;
                      const isCopied = copiedKey === copyKey;

                      return (
                        <div
                          key={em.id || idx}
                          className="p-3.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col justify-between gap-3 hover:border-emerald-500/30 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs font-mono text-foreground break-all">{em.email}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                Source: {em.source === "mx_fallback" ? "DNS MX Fallback" : em.source || "Website"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-border/20">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(em.email, copyKey)}
                              className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                            >
                              {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              {isCopied ? "Copied" : "Copy"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(`/outreach?id=${org.id}&email=${encodeURIComponent(em.email)}`)
                              }
                              className="h-7 text-[11px] gap-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium ml-auto"
                            >
                              <Send className="h-3 w-3" /> Outreach
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-muted/20 border border-dashed border-border/60 text-center space-y-2">
                    <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs font-semibold text-foreground">No Scraped Emails in Database Yet</p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      Run the scraper cron or use outreach to initiate contact via website inquiry.
                    </p>
                  </div>
                )}
              </Card>

              {/* Direct Phone Lines & Headquarters Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone Lines */}
                <Card className="border-border/50 bg-card p-5 space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-indigo-400" /> Corporate Phone Numbers
                  </h3>
                  <div className="space-y-3">
                    {primaryPhone ? (
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-indigo-400">Primary Switchboard</span>
                          <div className="text-sm font-bold font-mono text-foreground">{primaryPhone}</div>
                          {org.primary_phone_source && (
                            <p className="text-[10px] text-muted-foreground">Source: {org.primary_phone_source}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(primaryPhone, "primary-phone")}
                            className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                          >
                            {copiedKey === "primary-phone" ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button size="sm" asChild className="h-7 text-[11px] gap-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white">
                            <a href={`tel:${primaryPhone.replace(/\s+/g, "")}`}>
                              <Phone className="h-3 w-3" /> Call
                            </a>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-muted/20 border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                        No corporate phone registered for this account.
                      </div>
                    )}
                  </div>
                </Card>

                {/* Headquarters Location */}
                <Card className="border-border/50 bg-card p-5 space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-400" /> Corporate Headquarters
                  </h3>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      {org.raw_address || org.street_address || [org.city, org.state, org.country].filter(Boolean).join(", ") || "Location not specified"}
                    </div>
                    {(org.city || org.country || org.postal_code) && (
                      <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2">
                        {org.city && <span>{org.city}</span>}
                        {org.state && <span>{org.state}</span>}
                        {org.postal_code && <span>{org.postal_code}</span>}
                        {org.country && <span>({org.country})</span>}
                      </div>
                    )}
                    <div className="pt-2">
                      <Button size="sm" variant="outline" asChild className="h-7 text-[11px] gap-1.5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            [org.name, org.raw_address || org.street_address, org.city, org.country].filter(Boolean).join(" ")
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MapPin className="h-3 w-3" /> View on Google Maps <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Direct Personnel & Decision Maker Contacts */}
              <Card className="border-border/50 bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-400" /> Key Account Contacts ({people.length})
                  </h3>
                </div>

                {people.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {people.map((p) => (
                      <div key={p.id} className="p-3.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-foreground">{p.name}</h4>
                          <p className="text-[11px] text-indigo-400">{p.title || "Executive"}</p>
                          {p.email && (
                            <p className="text-[11px] text-muted-foreground font-mono truncate">{p.email}</p>
                          )}
                          {p.phone && (
                            <p className="text-[10px] text-muted-foreground font-mono">{p.phone}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-border/20">
                          {p.linkedin_url && (
                            <Button size="sm" variant="ghost" asChild className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300">
                              <a href={normalizeExternalUrl(p.linkedin_url, "linkedin") || p.linkedin_url} target="_blank" rel="noreferrer">
                                <LinkedInIcon className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                          {p.email && (
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(`/outreach?id=${org.id}&email=${encodeURIComponent(p.email!)}`)
                              }
                              className="h-7 text-[11px] gap-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium ml-auto"
                            >
                              <Send className="h-3 w-3" /> Outreach
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No individual decision makers listed yet.</p>
                )}
              </Card>
            </TabsContent>

            {/* TAB 3: COMPANY NEWS (NEW DEDICATED TAB) */}
            {/* <TabsContent value="news" className="mt-4 space-y-6"> */}
            {/* Buying Intent & News Header */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card p-4">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase">
                    <Radio className="h-3.5 w-3.5" /> Intent Strength
                  </div>
                  <div className="text-xl font-bold mt-1 text-foreground">
                    {org.intent_strength || (org.show_intent ? "High" : "Standard")}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Account buying velocity</p>
                </Card>

                <Card className="border-border/50 bg-card p-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
                    <TrendingUp className="h-3.5 w-3.5" /> Growth Signals
                  </div>
                  <div className="text-xl font-bold mt-1 text-foreground">
                    {org.intent_signal_account ? "Active Signals" : "Monitored"}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {org.intent_signal_account || "Tracking news & triggers"}
                  </p>
                </Card>

                <Card className="border-border/50 bg-card p-4">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase">
                    <Clock className="h-3.5 w-3.5" /> Last Signal Activity
                  </div>
                  <div className="text-xl font-bold mt-1 text-foreground font-mono">
                    {org.last_activity || "Recently"}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Telemetry timestamp</p>
                </Card>
              </div> */}

            {/* Live News Feed */}
            {/* <Card className="border-border/50 bg-card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-sky-400" /> Recent Company News & Media Mentions ({news.length})
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Live market press releases, executive milestones, and news coverage for {org.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="text-xs gap-1.5 h-8 border-sky-500/30 text-sky-300 hover:bg-sky-500/10"
                    >
                      <a
                        href={`https://news.google.com/search?q=${encodeURIComponent(org.name)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Search className="h-3 w-3" /> Search Google News <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </Button>
                  </div>
                </div>

                {newsLoading ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="h-7 w-7 text-indigo-400 animate-spin mx-auto" />
                    <p className="text-xs text-muted-foreground font-mono">Aggregating latest news for {org.name}...</p>
                  </div>
                ) : news.length > 0 ? (
                  <div className="space-y-3">
                    {news.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-muted/30 border border-border/40 hover:border-sky-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold text-foreground hover:text-sky-400 transition-colors flex items-start gap-1.5"
                          >
                            <span>{item.title}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                          </a>
                          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground font-mono">
                            <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20">
                              {item.source}
                            </Badge>
                            {item.pubDate && <span>· {item.pubDate}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/ai-messaging?organization=${encodeURIComponent(org.name)}&news=${encodeURIComponent(item.title)}`
                              )
                            }
                            className="h-8 text-xs gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium"
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Use as Sales Hook
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-muted/20 border border-dashed border-border/60 text-center space-y-3">
                    <Newspaper className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">No Direct Press Articles Found</p>
                      <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                        There are no syndicated press articles matching "{org.name}" at this moment. You can search external financial & tech portals below:
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <Button size="sm" variant="outline" asChild className="text-xs gap-1 h-7">
                        <a href={`https://www.google.com/search?tbm=nws&q=${encodeURIComponent(org.name)}`} target="_blank" rel="noreferrer">
                          Google News <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild className="text-xs gap-1 h-7">
                        <a href={`https://techcrunch.com/search/${encodeURIComponent(org.name)}`} target="_blank" rel="noreferrer">
                          TechCrunch <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild className="text-xs gap-1 h-7">
                        <a href={`https://www.bloomberg.com/search?query=${encodeURIComponent(org.name)}`} target="_blank" rel="noreferrer">
                          Bloomberg <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </Card> */}
            {/* </TabsContent> */}

            {/* TAB 4: PEOPLE */}
            <TabsContent value="people" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {people.length > 0 ? (
                  people.map((person) => (
                    <Card key={person.id} className="border-border/50 bg-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {person.name
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() || "P"}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{person.name}</h4>
                          <p className="text-[11px] text-indigo-400">{person.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{person.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/outreach?id=${org.id}&email=${encodeURIComponent(person.email || "")}`)}
                        className="text-[10px] h-7 bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        Contact
                      </Button>
                    </Card>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No decision makers tagged for this account.</p>
                )}
              </div>
            </TabsContent>

            {/* TAB 5: LEADS */}
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

            {/* TAB 6: NOTES */}
            <TabsContent value="notes" className="mt-4 space-y-4">
              <Card className="border-border/50 bg-card p-5 space-y-4">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <Textarea
                    placeholder="Add an internal sales note or meeting recap..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="bg-muted/40 text-xs min-h-[80px]"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isAddingNote || !newNoteContent.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
                  >
                    {isAddingNote ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> Saving Note...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Save Note
                      </>
                    )}
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

            {/* TAB 7: TASKS */}
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

            {/* TAB 8: ACTIVITIES */}
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
