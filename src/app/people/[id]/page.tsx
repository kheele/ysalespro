"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as peopleServices from "@/services/public/peopleServices";
import type { DecisionMaker } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  Building2,
  Briefcase,
  Users,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  Send,
  MessageSquare,
  Target,
  User,
} from "lucide-react";

const TIMELINE_ICONS: Record<string, React.ReactNode> = {
  Email: <Mail className="h-3.5 w-3.5 text-indigo-400" />,
  Call: <Phone className="h-3.5 w-3.5 text-emerald-400" />,
  Meeting: <Users className="h-3.5 w-3.5 text-purple-400" />,
  Note: <MessageSquare className="h-3.5 w-3.5 text-amber-400" />,
  Task: <Target className="h-3.5 w-3.5 text-pink-400" />,
};

const TIMELINE_COLORS: Record<string, string> = {
  Email: "border-indigo-500/30 bg-indigo-500/5",
  Call: "border-emerald-500/30 bg-emerald-500/5",
  Meeting: "border-purple-500/30 bg-purple-500/5",
  Note: "border-amber-500/30 bg-amber-500/5",
  Task: "border-pink-500/30 bg-pink-500/5",
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold font-mono">{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function PersonProfilePage() {
  const params = useParams();
  const router = useRouter();
  const personId = params?.id as string | undefined;

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [person, setPerson] = React.useState<DecisionMaker | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!personId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const data = await peopleServices.getDecisionMakerById(personId);
        setPerson(data);
      } catch (err) {
        console.error("Failed to load person:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [personId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <SalesProSidebar />
        <div className="flex-1 p-8 space-y-6">
          <div className="h-12 bg-card/40 border border-border/40 rounded-xl animate-pulse" />
          <div className="h-80 bg-card/40 border border-border/40 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
        <div className="flex-1 flex flex-col min-w-0">
          <SalesProHeader
            title="Person Not Found"
            subtitle={personId ? `No decision maker profile found matching ID #${personId}` : "Invalid person ID provided"}
            onOpenCommandPalette={() => setCommandOpen(true)}
          />
          <main className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <User className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <h2 className="text-base font-bold">Person Profile Not Found</h2>
              <p className="text-xs text-muted-foreground mt-1">
                The requested decision maker could not be located in the database.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/people")}
              className="text-xs gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Back to People
            </Button>
          </main>
        </div>
      </div>
    );
  }

  const sf = person.score_factors;
  const overallScore = person.score ?? 80;
  const scoreColor =
    overallScore >= 90 ? "from-emerald-600 to-teal-600" : overallScore >= 75 ? "from-amber-600 to-orange-600" : "from-blue-600 to-indigo-600";
  const scoreBorderColor =
    overallScore >= 90 ? "border-emerald-500/30 shadow-emerald-500/20" : overallScore >= 75 ? "border-amber-500/30 shadow-amber-500/20" : "border-blue-500/30 shadow-blue-500/20";
  const scoreTextColor = overallScore >= 90 ? "text-emerald-400" : overallScore >= 75 ? "text-amber-400" : "text-blue-400";

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title={person.name}
          subtitle={`${person.title} · ${person.company_name || person.company?.name || "Company"} · Decision Maker Intelligence`}
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 w-full mx-auto overflow-y-auto">
          {/* Back Button */}
          <Button variant="ghost" size="sm"
            onClick={() => router.push("/people")}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Back to People
          </Button>

          {/* ========================= PROFILE HEADER BANNER ========================= */}
          <Card className="border-border/50 bg-card backdrop-blur-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/10 flex items-center justify-center text-white font-bold text-2xl">
                  {person.name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "P"}
                </div>
                {person.verified && (
                  <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-extrabold tracking-tight">{person.name}</h1>
                  {person.verified && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">✓ Verified</Badge>
                  )}
                  <Badge
                    className={
                      person.seniority === "C-Suite" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        person.seniority === "VP" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }
                  >
                    {person.seniority}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    {person.industry}
                  </Badge>
                </div>

                <p className="text-sm font-semibold text-muted-foreground">{person.title}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                    <Link href={`/companies/${person.company_id || person.company?.id}`} className="text-indigo-400 hover:text-indigo-300">
                      {person.company_name || person.company?.name || "Company"}
                    </Link>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-400" /> {person.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-purple-400" /> {person.department}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold h-8">
                  <a href={`mailto:${person.email}`}>
                    <Mail className="h-3.5 w-3.5" /> Send Email
                  </a>
                </Button>
                {person.linkedin_url && (
                  <Button size="sm" variant="outline" asChild className="text-xs gap-1.5 h-8 border-border/60">
                    <a href={person.linkedin_url} target="_blank" rel="noreferrer">
                      <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" /> LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* ========================= 3-COLUMN GRID ========================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* COLUMN 1: Personal Info */}
            <Card className="border-border/50 bg-card p-5 space-y-4">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-indigo-400" /> Personal
              </CardTitle>
              <div className="space-y-3 text-xs">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Full Name</p>
                  <p className="font-bold">{person.name}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Email</p>
                  <a href={`mailto:${person.email}`} className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 break-all">
                    <Mail className="h-3 w-3 shrink-0" /> {person.email}
                  </a>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Phone</p>
                  {person.phone ? (
                    <a href={`tel:${person.phone}`} className="text-muted-foreground hover:text-indigo-400 font-mono flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" /> {person.phone}
                    </a>
                  ) : <span className="text-muted-foreground">—</span>}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Location</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" /> {person.location || "—"}
                  </p>
                </div>
                {person.linkedin_url && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase text-muted-foreground">LinkedIn</p>
                    <a href={person.linkedin_url} target="_blank" rel="noreferrer"
                      className="text-[#0A66C2] hover:opacity-80 flex items-center gap-1">
                      <Linkedin className="h-3 w-3 shrink-0" /> View Profile
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* COLUMN 2: Professional Info */}
            <Card className="border-border/50 bg-card p-5 space-y-4">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-purple-400" /> Professional
              </CardTitle>
              <div className="space-y-3 text-xs">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Company</p>
                  <Link href={`/companies/${person.company_id || person.company?.id}`} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
                    <Building2 className="h-3 w-3 shrink-0" /> {person.company_name || person.company?.name || "Company"}
                  </Link>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Job Title</p>
                  <p className="font-bold">{person.title}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Department</p>
                  <p className="text-muted-foreground">{person.department || "—"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Seniority</p>
                  <Badge
                    className={
                      person.seniority === "C-Suite" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        person.seniority === "VP" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }
                  >
                    {person.seniority}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Industry</p>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    {person.industry}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Decision Authority</p>
                  <p className="font-bold text-foreground">{person.decision_power}</p>
                </div>
              </div>
            </Card>

            {/* COLUMN 3: Decision Maker Score */}
            <Card className={`border-border/50 bg-card p-5 space-y-4 border ${scoreBorderColor} shadow-lg`}>
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Decision Maker Intelligence
              </CardTitle>

              {/* Big Score Ring */}
              <div className="flex flex-col items-center py-2">
                <div className={`relative h-24 w-24 rounded-full bg-gradient-to-tr ${scoreColor} border-4 ${scoreBorderColor} flex flex-col items-center justify-center shadow-xl`}>
                  <span className="text-3xl font-extrabold text-white">{overallScore}</span>
                  <span className="text-[10px] text-white/70 font-mono -mt-1">/100</span>
                </div>
                <p className={`text-xs mt-2 font-bold ${scoreTextColor}`}>
                  {overallScore >= 90 ? "Top-Tier Buyer" : overallScore >= 75 ? "Strong Prospect" : "Nurture Lead"}
                </p>
              </div>

              {/* Score Factors */}
              {sf && (
                <div className="space-y-2.5 pt-2 border-t border-border/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Score Factors</p>
                  <ScoreBar label="Seniority" value={sf.seniority_score} color="bg-red-400" />
                  <ScoreBar label="Department Relevance" value={sf.department_relevance} color="bg-purple-400" />
                  <ScoreBar label="Industry Relevance" value={sf.industry_relevance} color="bg-indigo-400" />
                  <ScoreBar label="Company Size" value={sf.company_size_score} color="bg-emerald-400" />
                </div>
              )}
            </Card>
          </div>

          {/* ========================= TIMELINE ========================= */}
          <Card className="border-border/50 bg-card p-5 space-y-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Send className="h-4 w-4 text-indigo-400" /> Engagement Timeline
            </CardTitle>

            {person.timeline && person.timeline.length > 0 ? (
              <div className="relative space-y-3">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border/50 ml-px" />

                {person.timeline.map((item: any) => (
                  <div key={item.id} className="relative flex items-start gap-3 pl-9">
                    {/* Icon node */}
                    <div className={`absolute left-0 h-8 w-8 rounded-full border ${TIMELINE_COLORS[item.type]} flex items-center justify-center shrink-0`}>
                      {TIMELINE_ICONS[item.type]}
                    </div>

                    <div className={`flex-1 p-3 rounded-lg border ${TIMELINE_COLORS[item.type]} text-xs`}>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-foreground">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">{item.timestamp}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-0.5 leading-snug">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No engagement history yet for this contact.</p>
            )}
          </Card>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
