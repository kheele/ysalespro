"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as aiMessageServices from "@/services/private/aiMessageServices";
import { getDecisionMakers, getDecisionMakerById } from "@/services/public/peopleServices";
import { getOrganizations, getOrganizationById } from "@/services/public/organizationServices";
import { getIndustries } from "@/services/public/industryServices";
import { useAuth } from "@/hooks/use-auth";
import type {
  MessageType,
  PersonContext,
  CompanyContext,
  GeneratedMessage,
  MessageGenerationResult,
  DecisionMaker,
  Organization,
} from "@/lib/types";
import type { OptimizeSequenceOutput } from "@/ai/schemas/sequence-optimizer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles, Mail, Phone, Linkedin, Copy, Check,
  ChevronRight, User, Building2, RefreshCw,
  Send, ArrowRight, MessageSquare, FileText,
  Zap, Lightbulb, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";

// ─── Message Type Metadata ────────────────────────────────────────────────────
const MSG_META: Record<MessageType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  email_subject: { icon: <Mail className="h-3.5 w-3.5" />, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/25" },
  initial_email: { icon: <Mail className="h-3.5 w-3.5" />, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/25" },
  followup_1: { icon: <ArrowRight className="h-3.5 w-3.5" />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25" },
  followup_2: { icon: <FileText className="h-3.5 w-3.5" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  final: { icon: <MessageSquare className="h-3.5 w-3.5" />, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" },
  linkedin: { icon: <Linkedin className="h-3.5 w-3.5" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25" },
  call_script: { icon: <Phone className="h-3.5 w-3.5" />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/25" },
};

const SCORE_COLOR = (s: number) => s >= 88 ? "text-emerald-400" : s >= 75 ? "text-amber-400" : "text-muted-foreground";

function ScoreRing({ score }: { score: number }) {
  const r = 16; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 88 ? "#10b981" : score >= 75 ? "#f59e0b" : "#6b7280";
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#27272a" strokeWidth="3.5" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[10px] font-extrabold font-mono ${SCORE_COLOR(score)}`}>{score}</span>
      </div>
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${copied ? "text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}>
      {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
    </button>
  );
}

import {
  sendEmailOutreachActionByToken,
  sendLinkedInOutreachActionByToken,
} from "@/services/private/senderDispatchService";
import { getConnectedAccountsActionByToken } from "@/services/private/connectedAccountsService";
import type { ConnectedAccount, DispatchResult } from "@/lib/types";

// ─── Message Card ─────────────────────────────────────────────────────────────
function MessageCard({
  msg,
  editable,
  onChange,
  onSend,
}: {
  msg: GeneratedMessage;
  editable: boolean;
  onChange: (content: string) => void;
  onSend?: (msg: GeneratedMessage) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const meta = MSG_META[msg.type] || MSG_META.initial_email;

  const isEmail = ["initial_email", "followup_1", "followup_2", "final"].includes(msg.type);
  const isLinkedIn = msg.type === "linkedin";

  return (
    <Card className={`${meta.border} bg-card p-4 space-y-3 transition-all hover:bg-card/80`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-lg ${meta.bg} ${meta.border} flex items-center justify-center ${meta.color} shrink-0`}>
            {meta.icon}
          </div>
          <span className={`text-xs font-bold ${meta.color}`}>{msg.label}</span>
          {msg.subject && msg.type !== 'email_subject' && (
            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[240px]">Subject: {msg.subject}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ScoreRing score={msg.personalization_score} />
          <div className="flex flex-col items-end gap-1">
            <span className="text-[8px] uppercase font-bold text-muted-foreground">Personalization</span>
            <div className="flex items-center gap-2">
              <CopyBtn text={msg.content} />
              {editable && (
                <button onClick={() => setEditing(e => !e)}
                  className="text-[10px] text-muted-foreground hover:text-indigo-400 font-semibold flex items-center gap-1 transition-colors">
                  <RefreshCw className="h-3 w-3" /> {editing ? "Preview" : "Edit"}
                </button>
              )}
              {onSend && (isEmail || isLinkedIn) && (
                <Button
                  size="sm"
                  onClick={() => onSend(msg)}
                  className={`text-[11px] h-7 gap-1 px-2.5 shadow-sm text-white ${isLinkedIn
                    ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                    }`}
                >
                  <Send className="h-3 w-3" /> {isLinkedIn ? "Send LinkedIn" : "Send Email"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <Textarea value={msg.content} onChange={e => onChange(e.target.value)}
          className="bg-muted/30 border-border/40 text-xs font-mono min-h-[160px] resize-y leading-relaxed" />
      ) : (
        <pre className="text-xs text-muted-foreground font-sans whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/30 max-h-48 overflow-y-auto">
          {msg.content}
        </pre>
      )}

      {/* Hooks Used */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/20">
        <span className="text-[9px] uppercase font-bold text-muted-foreground/60 mr-1">Personalized with:</span>
        {msg.hooks_used.slice(0, 5).map((h: string) => (
          <Badge key={h} variant="outline" className="text-[9px] bg-muted/20 font-mono px-1.5 text-muted-foreground">{h}</Badge>
        ))}
      </div>
    </Card>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────
const FILTERS: { label: string; types: MessageType[] }[] = [
  { label: "All Messages", types: ["email_subject", "initial_email", "followup_1", "followup_2", "final", "linkedin", "call_script"] },
  { label: "Email Sequence", types: ["email_subject", "initial_email", "followup_1", "followup_2", "final"] },
  { label: "LinkedIn", types: ["linkedin"] },
  { label: "Call Script", types: ["call_script"] },
];

function AiMessagingContent() {
  const { user, dbUser } = useAuth();
  const searchParams = useSearchParams();

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [result, setResult] = React.useState<MessageGenerationResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState(0);
  const [editableMessages, setEditableMessages] = React.useState<GeneratedMessage[]>([]);
  const [painPoints, setPainPoints] = React.useState<string[]>([]);

  // AI Sequence Copilot State
  const [optimizingSeq, setOptimizingSeq] = React.useState(false);
  const [optimizeModalOpen, setOptimizeModalOpen] = React.useState(false);
  const [optimizeResult, setOptimizeResult] = React.useState<OptimizeSequenceOutput | null>(null);

  const handleOptimizeCurrentSequence = async () => {
    setOptimizingSeq(true);
    try {
      const emailSteps = [
        {
          step_number: 1,
          day: 0,
          type: "Introduction",
          subject: editableMessages.find((m) => m.type === "email_subject")?.content || `Quick question — ${company.name || "partnership"}`,
          body: editableMessages.find((m) => m.type === "initial_email")?.content || "",
        },
        {
          step_number: 2,
          day: 3,
          type: "Follow-up",
          subject: `Re: ${company.name || "Quick question"}`,
          body: editableMessages.find((m) => m.type === "followup_1")?.content || "",
        },
        {
          step_number: 3,
          day: 7,
          type: "Case Study",
          subject: `Case Study for ${company.name || "your team"}`,
          body: editableMessages.find((m) => m.type === "followup_2")?.content || "",
        },
        {
          step_number: 4,
          day: 14,
          type: "Final Message",
          subject: `Closing the loop — ${company.name || ""}`,
          body: editableMessages.find((m) => m.type === "final")?.content || "",
        },
      ].filter((s) => s.body.trim().length > 0);

      const res = await aiMessageServices.optimizeCampaignSequenceAction({
        campaign_name: `${company.name || "Target Account"} Outreach Sequence`,
        industry: company.industry || "Technology",
        target_audience: `${person.seniority || "Executive"} Leader in ${person.department || "Operations"}`,
        current_steps: emailSteps,
      });
      setOptimizeResult(res);
      setOptimizeModalOpen(true);
    } catch (err) {
      console.error("Sequence Copilot optimization failed:", err);
    } finally {
      setOptimizingSeq(false);
    }
  };

  // Outbound Dispatch State
  const [connectedAccounts, setConnectedAccounts] = React.useState<ConnectedAccount[]>([]);
  const [dispatchModalOpen, setDispatchModalOpen] = React.useState(false);
  const [dispatchChannel, setDispatchChannel] = React.useState<"Email" | "LinkedIn">("Email");
  const [dispatchRecipientEmail, setDispatchRecipientEmail] = React.useState("");
  const [dispatchRecipientName, setDispatchRecipientName] = React.useState("");
  const [dispatchRecipientLinkedin, setDispatchRecipientLinkedin] = React.useState("");
  const [dispatchRecipientTitle, setDispatchRecipientTitle] = React.useState("");
  const [dispatchRecipientOrg, setDispatchRecipientOrg] = React.useState("");
  const [dispatchSubject, setDispatchSubject] = React.useState("");
  const [dispatchBody, setDispatchBody] = React.useState("");
  const [dispatchAccountId, setDispatchAccountId] = React.useState("");
  const [dispatching, setDispatching] = React.useState(false);
  const [dispatchResult, setDispatchResult] = React.useState<DispatchResult | null>(null);

  const loadConnectedAccounts = React.useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      const accs = await getConnectedAccountsActionByToken(token);
      setConnectedAccounts(accs || []);
    } catch (e) {
      console.error("Failed to load connected accounts for messaging:", e);
    }
  }, [user]);

  React.useEffect(() => {
    loadConnectedAccounts();
  }, [loadConnectedAccounts]);

  const handleOpenDispatch = (msg: GeneratedMessage) => {
    setDispatchResult(null);
    const selectedP = people.find(p => String(p.id) === String(selectedPersonId));
    const recipientEmail = selectedP?.email || (person.fname ? `${person.fname.toLowerCase()}@${company.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || "company"}.com` : "");
    const recipientName = person.full_name || `${person.fname || ""} ${person.lname || ""}`.trim() || "Decision Maker";
    const recipientLinkedin = selectedP?.linkedin_url || `https://linkedin.com/in/${recipientName.toLowerCase().replace(/\s+/g, '-')}`;

    if (msg.type === "linkedin") {
      setDispatchChannel("LinkedIn");
      setDispatchRecipientName(recipientName);
      setDispatchRecipientLinkedin(recipientLinkedin);
      setDispatchRecipientTitle(person.title || "");
      setDispatchRecipientOrg(company.name || "");
      setDispatchSubject("LinkedIn Message");
      setDispatchBody(msg.content);
      const defLi = connectedAccounts.find(a => a.channel === "LinkedIn" && a.is_default && a.is_active) || connectedAccounts.find(a => a.channel === "LinkedIn" && a.is_active);
      setDispatchAccountId(defLi ? String(defLi.id) : "");
    } else {
      setDispatchChannel("Email");
      setDispatchRecipientEmail(recipientEmail);
      setDispatchRecipientName(recipientName);
      setDispatchRecipientTitle(person.title || "");
      setDispatchRecipientOrg(company.name || "");
      const subjectMsg = editableMessages.find(m => m.type === "email_subject");
      setDispatchSubject(msg.subject || subjectMsg?.content || `Quick question — ${company.name || "partnership"}`);
      setDispatchBody(msg.content);
      const defEmail = connectedAccounts.find(a => a.channel === "Email" && a.is_default && a.is_active) || connectedAccounts.find(a => a.channel === "Email" && a.is_active);
      setDispatchAccountId(defEmail ? String(defEmail.id) : "");
    }
    setDispatchModalOpen(true);
  };

  const handleExecuteDispatch = async () => {
    if (!user) return;
    setDispatching(true);
    setDispatchResult(null);
    try {
      const token = await user.getIdToken(true);
      if (dispatchChannel === "Email") {
        const res = await sendEmailOutreachActionByToken(token, {
          to: dispatchRecipientEmail,
          to_name: dispatchRecipientName,
          subject: dispatchSubject,
          text: dispatchBody,
          account_id: dispatchAccountId || undefined,
          lead_id: selectedPersonId ? Number(selectedPersonId) : undefined,
        });
        setDispatchResult(res);
      } else {
        const res = await sendLinkedInOutreachActionByToken(token, {
          recipient_name: dispatchRecipientName,
          recipient_title: dispatchRecipientTitle,
          recipient_org: dispatchRecipientOrg,
          recipient_profile_url: dispatchRecipientLinkedin,
          message: dispatchBody,
          account_id: dispatchAccountId || undefined,
          lead_id: selectedPersonId ? Number(selectedPersonId) : undefined,
        });
        setDispatchResult(res);
      }
    } catch (err: any) {
      setDispatchResult({
        success: false,
        channel: dispatchChannel,
        recipient: dispatchChannel === "Email" ? dispatchRecipientEmail : dispatchRecipientName,
        status: "Failed",
        error: err?.message || "Outbound dispatch failed.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setDispatching(false);
    }
  };

  // Real Database Records
  const [people, setPeople] = React.useState<DecisionMaker[]>([]);
  const [companies, setCompanies] = React.useState<Organization[]>([]);
  const [industryList, setIndustryList] = React.useState<string[]>([]);
  const [, setLoadingDb] = React.useState(true);

  // Selected entities
  const [selectedPersonId, setSelectedPersonId] = React.useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("");

  const [person, setPerson] = React.useState<Partial<PersonContext>>({
    fname: "",
    lname: "",
    full_name: "",
    title: "",
    department: "Operations",
    seniority: "VP",
  });

  const [company, setCompany] = React.useState<Partial<CompanyContext>>({
    name: "",
    industry: "Technology",
    size: "Mid-Market (250-1000)",
    location: "",
    country: "",
    recent_news: "",
    challenges: [],
  });

  const [senderName, setSenderName] = React.useState("");
  const [senderTitle, setSenderTitle] = React.useState("");

  // Sync authenticated user profile as sender
  React.useEffect(() => {
    if (dbUser || user) {
      const fullName = dbUser?.fname || dbUser?.lname
        ? `${dbUser?.fname || ""} ${dbUser?.lname || ""}`.trim()
        : user?.displayName || "";
      const companyName = dbUser?.account_company?.name || "";
      const role = dbUser?.role || "Sales Representative";
      const title = companyName ? `${role}, ${companyName}` : role;

      if (fullName) setSenderName(fullName);
      if (title) setSenderTitle(title);
    }
  }, [user, dbUser]);

  const applyPersonData = React.useCallback((p: DecisionMaker) => {
    setSelectedPersonId(String(p.id));
    const names = (p.name || "").trim().split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";
    setPerson({
      fname: firstName,
      lname: lastName,
      full_name: p.name || "",
      title: p.job_title || p.title || "Executive",
      department: p.department || "Operations",
      seniority: (["C-Suite", "VP", "Director", "Manager", "Individual Contributor"].includes(p.seniority || "")
        ? (p.seniority as any)
        : "VP"),
    });

    if (p.company_name || p.company?.name) {
      const compName = p.company_name || p.company?.name || "";
      const compInd = p.industry || p.company?.primary_industry || "";
      const compLoc = p.location || p.city || p.country || "";
      setCompany(c => ({
        ...c,
        name: compName || c.name || "",
        industry: compInd || c.industry || "Technology",
        location: compLoc || c.location || "",
        country: p.country || c.country || "",
      }));
    }
  }, []);

  const applyCompanyData = React.useCallback((org: Organization) => {
    setSelectedCompanyId(String(org.id));
    const employees = org.estimated_num_employees || org.employee_count || 0;
    const size: CompanyContext["size"] = employees >= 1000
      ? "Enterprise (1000+)"
      : employees >= 250
        ? "Mid-Market (250-1000)"
        : employees >= 50
          ? "SMB (50-250)"
          : "Startup (<50)";

    const loc = [org.city, org.state, org.country].filter(Boolean).join(", ") || org.headquarters_location || org.location || "";

    setCompany({
      name: org.name,
      industry: org.primary_industry || org.industry || "Technology",
      size,
      location: loc,
      country: org.country || "",
      recent_news: org.intent_signal_account || (org.show_intent ? `High buying intent detected (${org.intent_strength || "Strong"} signal)` : ""),
      challenges: (org.keywords_list || []).map(k => k.keyword?.name).filter(Boolean) as string[],
    });
  }, []);

  // Fetch real data from Hasura GraphQL backend
  React.useEffect(() => {
    async function loadRealData() {
      setLoadingDb(true);
      try {
        const [peopleRes, orgsRes, indRes] = await Promise.allSettled([
          getDecisionMakers({ limit: 60 }),
          getOrganizations({ limit: 60 }),
          getIndustries({ limit: 60 }),
        ]);

        const loadedPeople = peopleRes.status === "fulfilled" ? peopleRes.value.people || [] : [];
        const loadedOrgs = orgsRes.status === "fulfilled" ? orgsRes.value.organizations || [] : [];
        const loadedInds = indRes.status === "fulfilled"
          ? (indRes.value.industries || []).map(i => i.name).filter(Boolean)
          : [];

        setPeople(loadedPeople);
        setCompanies(loadedOrgs);
        if (loadedInds.length > 0) {
          setIndustryList(loadedInds);
        }

        const paramPersonId = searchParams?.get("person_id");
        const paramCompanyId = searchParams?.get("company_id");

        if (paramPersonId) {
          const matchPerson = loadedPeople.find(p => String(p.id) === String(paramPersonId));
          if (matchPerson) {
            applyPersonData(matchPerson);
          } else {
            getDecisionMakerById(paramPersonId).then(p => {
              if (p) applyPersonData(p);
            });
          }
        } else if (paramCompanyId) {
          const matchOrg = loadedOrgs.find(o => String(o.id) === String(paramCompanyId));
          if (matchOrg) {
            applyCompanyData(matchOrg);
          } else {
            getOrganizationById(paramCompanyId).then(o => {
              if (o) applyCompanyData(o);
            });
          }
        } else if (loadedPeople.length > 0) {
          applyPersonData(loadedPeople[0]);
        }
      } catch (err) {
        console.error("Failed to load real data for AI messaging:", err);
      } finally {
        setLoadingDb(false);
      }
    }
    loadRealData();
  }, [searchParams, applyPersonData, applyCompanyData]);

  // Load real industry pain points dynamically
  React.useEffect(() => {
    if (company.industry) {
      aiMessageServices.getIndustryPainPoints(company.industry)
        .then((pts: string[]) => setPainPoints(Array.isArray(pts) ? pts : []))
        .catch(() => setPainPoints([]));
    }
  }, [company.industry]);

  const handleGenerate = async () => {
    if (!person.fname || !company.name) return;
    setLoading(true);
    const fullPerson: PersonContext = {
      fname: person.fname || "",
      lname: person.lname || "",
      full_name: person.full_name || `${person.fname} ${person.lname}`.trim(),
      title: person.title || "Decision Maker",
      department: person.department || "Operations",
      seniority: person.seniority || "VP",
    };
    const fullCompany: CompanyContext = {
      name: company.name || "",
      industry: company.industry || "Technology",
      size: company.size || "Mid-Market (250-1000)",
      location: company.location || "",
      country: company.country || "",
      recent_news: company.recent_news,
      challenges: company.challenges,
    };
    const res = await aiMessageServices.generateMessages(
      fullPerson,
      fullCompany,
      senderName || "Sales Executive",
      senderTitle || "Enterprise Account Executive"
    );
    setResult(res);
    setEditableMessages(res.messages);
    setLoading(false);
  };

  const updateMessage = (index: number, content: string) => {
    setEditableMessages(msgs => msgs.map((m, i) => i === index ? { ...m, content } : m));
  };

  const displayedMessages = editableMessages.filter(m => FILTERS[activeFilter].types.includes(m.type));

  const avgScore = editableMessages.length
    ? Math.round(editableMessages.reduce((s, m) => s + m.personalization_score, 0) / editableMessages.length) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="AI Personalized Messaging"
          subtitle="Generate hyper-personalized emails, LinkedIn messages, and call scripts using live database intelligence"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="w-full mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

              {/* ─── LEFT: Context Form ──────────────────────────────────── */}
              <div className="space-y-4">

                {/* Person Context */}
                <Card className="bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <User className="h-3.5 w-3.5 text-indigo-400" /> Person Context
                    </div>
                    {people.length > 0 && (
                      <Badge variant="outline" className="text-[9px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-mono">
                        {people.length} Live Contacts
                      </Badge>
                    )}
                  </div>

                  {/* Real Contact Dropdown Picker */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-semibold">
                      Load Contact
                    </Label>
                    <select
                      value={selectedPersonId}
                      onChange={(e) => {
                        const sel = people.find(p => String(p.id) === e.target.value);
                        if (sel) applyPersonData(sel);
                      }}
                      className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8 truncate font-medium"
                    >
                      <option value="">Choose a contact</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.title || p.job_title || "Executive"} · {p.company_name || "Company"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2.5 text-xs pt-1 border-t border-border/30">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">First Name</Label>
                        <Input value={person.fname || ""} onChange={e => setPerson((p: Partial<PersonContext>) => ({ ...p, fname: e.target.value, full_name: `${e.target.value} ${p.lname || ""}`.trim() }))}
                          className="h-8 text-xs bg-muted/40 border-border/60" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Last Name</Label>
                        <Input value={person.lname || ""} onChange={e => setPerson((p: Partial<PersonContext>) => ({ ...p, lname: e.target.value, full_name: `${p.fname || ""} ${e.target.value}`.trim() }))}
                          className="h-8 text-xs bg-muted/40 border-border/60" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Job Title</Label>
                      <Input value={person.title || ""} onChange={e => setPerson((p: Partial<PersonContext>) => ({ ...p, title: e.target.value }))}
                        className="h-8 text-xs bg-muted/40 border-border/60" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Department</Label>
                        <select value={person.department || "Operations"}
                          onChange={e => setPerson((p: Partial<PersonContext>) => ({ ...p, department: e.target.value }))}
                          className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8">
                          {["Operations", "Engineering", "Finance", "Sales", "Marketing", "IT", "Legal", "HR", "Security", "Procurement"].map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Seniority</Label>
                        <select value={person.seniority || "VP"}
                          onChange={e => setPerson((p: Partial<PersonContext>) => ({ ...p, seniority: e.target.value as PersonContext['seniority'] }))}
                          className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8">
                          {["C-Suite", "VP", "Director", "Manager", "Individual Contributor"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Company Context */}
                <Card className="bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Building2 className="h-3.5 w-3.5 text-purple-400" /> Company Context
                    </div>
                    {companies.length > 0 && (
                      <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20 font-mono">
                        {companies.length} Live Orgs
                      </Badge>
                    )}
                  </div>

                  {/* Real Company Dropdown Picker */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-semibold">
                      Load Organization
                    </Label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => {
                        const sel = companies.find(c => String(c.id) === e.target.value);
                        if (sel) applyCompanyData(sel);
                      }}
                      className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8 truncate font-medium"
                    >
                      <option value="">Choose an organization</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.primary_industry || c.industry || "General"} · {c.city || c.country || "Global"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2.5 text-xs pt-1 border-t border-border/30">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Company Name</Label>
                      <Input value={company.name || ""} onChange={e => setCompany((c: Partial<CompanyContext>) => ({ ...c, name: e.target.value }))}
                        className="h-8 text-xs bg-muted/40 border-border/60" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Industry</Label>
                      <select value={company.industry || "Technology"}
                        onChange={e => setCompany((c: Partial<CompanyContext>) => ({ ...c, industry: e.target.value }))}
                        className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8">
                        {(industryList.length > 0 ? industryList : ["Mining & Metals", "Heavy Manufacturing", "Construction", "Engineering", "Technology", "Logistics & Supply Chain", "Energy", "Financial Services"]).map(i => <option key={i}>{i}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Company Size</Label>
                        <select value={company.size || "Enterprise (1000+)"}
                          onChange={e => setCompany((c: Partial<CompanyContext>) => ({ ...c, size: e.target.value as CompanyContext['size'] }))}
                          className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8">
                          {["Startup (<50)", "SMB (50-250)", "Mid-Market (250-1000)", "Enterprise (1000+)"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Location</Label>
                        <Input value={company.location || ""} onChange={e => setCompany((c: Partial<CompanyContext>) => ({ ...c, location: e.target.value }))}
                          className="h-8 text-xs bg-muted/40 border-border/60" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Recent News / Trigger Event</Label>
                      <Input value={company.recent_news || ""} onChange={e => setCompany((c: Partial<CompanyContext>) => ({ ...c, recent_news: e.target.value }))}
                        className="h-8 text-xs bg-muted/40 border-border/60" />
                    </div>
                  </div>
                </Card>

                {/* Sender Identity */}
                <Card className="bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Send className="h-3.5 w-3.5 text-emerald-400" /> Sender Identity
                    </div>
                    {dbUser && (
                      <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono">
                        Authenticated
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Your Name</Label>
                      <Input value={senderName} onChange={e => setSenderName(e.target.value)} className="h-8 text-xs bg-muted/40 border-border/60" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Your Title</Label>
                      <Input value={senderTitle} onChange={e => setSenderTitle(e.target.value)} className="h-8 text-xs bg-muted/40 border-border/60" />
                    </div>
                  </div>
                </Card>

                {/* Generate Button */}
                <Button onClick={handleGenerate} disabled={loading || !person.fname || !company.name}
                  className="w-full h-11 gap-2 font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                  {loading ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Generating Outreach…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Personalized Messages</>
                  )}
                </Button>

                {/* Industry Pain Points Quick Reference */}
                {company.industry && painPoints.length > 0 && (
                  <Card className="border-border/40 bg-muted/20 p-3 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{company.industry} — Key Pain Points</p>
                    <ul className="space-y-1">
                      {painPoints.map((p: string) => (
                        <li key={p} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <ChevronRight className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" /> {p}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>

              {/* ─── RIGHT: Generated Messages ───────────────────────────── */}
              <div className="space-y-4">
                {result ? (
                  <>
                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="border-border/50 bg-card p-3 text-center">
                        <div className="text-xl font-extrabold font-mono text-indigo-300">{avgScore}</div>
                        <div className="text-[10px] text-muted-foreground">Avg Personalization Score</div>
                      </Card>
                      <Card className="border-border/50 bg-card p-3 text-center">
                        <div className="text-xl font-extrabold font-mono text-emerald-400">{editableMessages.length}</div>
                        <div className="text-[10px] text-muted-foreground">Messages Generated</div>
                      </Card>
                      <Card className="border-border/50 bg-card p-3 text-center">
                        <div className="text-xl font-extrabold font-mono text-purple-400">
                          {new Set(editableMessages.flatMap(m => m.hooks_used)).size}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Data Points Used</div>
                      </Card>
                    </div>

                    {/* Context Summary */}
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-card border border-border/40 rounded-xl text-[10px]">
                      <span className="font-bold text-foreground">{result.person.full_name}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                      <span className="text-muted-foreground">{result.person.title}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                      <span className="text-indigo-400 font-semibold">{result.company.name}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px]">{result.company.industry}</Badge>
                      <Badge className="bg-muted/40 text-muted-foreground border-border/40 text-[9px]">{result.person.seniority}</Badge>
                      <Badge className="bg-muted/40 text-muted-foreground border-border/40 text-[9px]">{result.company.size}</Badge>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {FILTERS.map((f, i) => (
                        <button key={f.label} onClick={() => setActiveFilter(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activeFilter === i ? "bg-indigo-600 text-white border-indigo-600" : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"}`}>
                          {f.label}
                          <span className="ml-1.5 font-mono text-[10px] opacity-70">
                            ({editableMessages.filter(m => f.types.includes(m.type)).length})
                          </span>
                        </button>
                      ))}
                      <div className="ml-auto flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleOptimizeCurrentSequence}
                          disabled={optimizingSeq}
                          className="h-8 px-2.5 text-xs gap-1.5 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                        >
                          {optimizingSeq ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-indigo-400" />}
                          {optimizingSeq ? "Optimizing..." : "AI Sequence Copilot"}
                        </Button>
                        <button onClick={handleGenerate} disabled={loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all disabled:opacity-50 h-8">
                          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Regenerate
                        </button>
                      </div>
                    </div>

                    {/* Message Cards */}
                    <div className="space-y-4">
                      {displayedMessages.map((msg) => {
                        const globalIdx = editableMessages.findIndex(m => m.type === msg.type);
                        return (
                          <MessageCard
                            key={msg.type}
                            msg={msg}
                            editable={true}
                            onChange={content => updateMessage(globalIdx, content)}
                            onSend={handleOpenDispatch}
                          />
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Idle State */
                  <div className="flex flex-col items-center justify-center h-full min-h-[480px] border border-dashed border-border/40 rounded-xl space-y-4 p-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold">Ready to Generate</p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Select a contact or organization from the database on the left, then click <strong>Generate</strong> to create 7 personalized messages.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-left w-full max-w-xs">
                      {[
                        { icon: <Mail className="h-3 w-3 text-indigo-400" />, label: "Email Sequence (4 steps)" },
                        { icon: <Linkedin className="h-3 w-3 text-blue-400" />, label: "LinkedIn Message" },
                        { icon: <Phone className="h-3 w-3 text-purple-400" />, label: "Call Script" },
                        { icon: <Zap className="h-3 w-3 text-amber-400" />, label: "Personalization Score" },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2 text-muted-foreground">
                          {item.icon} {item.label}
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleGenerate} disabled={loading || !person.fname || !company.name}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold gap-2 shadow-lg shadow-indigo-500/20">
                      <Sparkles className="h-4 w-4" /> Generate Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ─── AI Sequence Copilot Modal ─── */}
      <Dialog open={optimizeModalOpen} onOpenChange={setOptimizeModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> AI Sequence Copilot (Science-Based Optimization)
              </span>
              {optimizeResult && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                  Grade {optimizeResult.overall_grade} · {optimizeResult.overall_score}/100
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {optimizeResult && (
            <div className="space-y-4 text-xs pt-2">
              {/* Metrics Lift Forecast */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                  <div className="text-lg font-black text-indigo-400 font-mono">+{optimizeResult.predicted_open_rate_boost_pct}%</div>
                  <div className="text-[10px] text-muted-foreground">Predicted Open Rate Lift</div>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <div className="text-lg font-black text-emerald-400 font-mono">+{optimizeResult.predicted_reply_rate_boost_pct}%</div>
                  <div className="text-[10px] text-muted-foreground">Predicted Reply Rate Lift</div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-1.5 p-3 bg-muted/20 border border-border/40 rounded-xl">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Behavioral Psychology Insights
                </p>
                <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                  {optimizeResult.key_recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Optimized Steps Preview */}
              <div className="space-y-3">
                <p className="font-bold text-foreground text-[11px]">Optimized Steps Preview ({optimizeResult.optimized_steps.length} steps):</p>
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {optimizeResult.optimized_steps.map((st) => (
                    <div key={st.step_number} className="p-3 bg-card border border-border/50 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-indigo-300">Step {st.step_number} (Day {st.day}) · {st.type}</span>
                        <span className="text-[10px] text-muted-foreground italic">{st.rationale}</span>
                      </div>
                      <div className="font-semibold text-foreground bg-muted/30 px-2 py-1 rounded text-[11px]">
                        {st.subject}
                      </div>
                      <div className="text-muted-foreground text-[11px] whitespace-pre-wrap line-clamp-3 bg-muted/10 p-2 rounded">
                        {st.body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                <Button type="button" size="sm" onClick={() => setOptimizeModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Quick Outbound Dispatch Modal ─── */}
      <Dialog open={dispatchModalOpen} onOpenChange={setDispatchModalOpen}>
        <DialogContent className="max-w-xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              {dispatchChannel === "LinkedIn" ? (
                <Linkedin className="h-4 w-4 text-blue-400" />
              ) : (
                <Mail className="h-4 w-4 text-indigo-400" />
              )}
              {dispatchChannel === "LinkedIn" ? "Send LinkedIn Outreach" : "Send Outreach Email"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Sender Account Selection */}
            <div className="space-y-1.5 p-3 bg-muted/20 border border-border/40 rounded-xl">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold text-foreground">
                  Sending Channel / Connected Account
                </Label>
                <a
                  href="/settings"
                  target="_blank"
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Manage in Settings →
                </a>
              </div>
              {connectedAccounts.filter(a => a.channel === dispatchChannel && a.is_active).length > 0 ? (
                <select
                  value={dispatchAccountId}
                  onChange={e => setDispatchAccountId(e.target.value)}
                  className="w-full bg-card border border-border/60 rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none"
                >
                  {connectedAccounts
                    .filter(a => a.channel === dispatchChannel && a.is_active)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({dispatchChannel === "Email" ? a.email_config?.from_email : a.linkedin_config?.account_name}) {a.is_default ? "— Default" : ""}
                      </option>
                    ))}
                </select>
              ) : (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px]">
                  No active {dispatchChannel} accounts found. Please connect an account in Settings &gt; Integrations.
                </div>
              )}
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Recipient Name</Label>
                <Input
                  value={dispatchRecipientName}
                  onChange={e => setDispatchRecipientName(e.target.value)}
                  className="bg-muted/40 text-xs h-8"
                />
              </div>
              {dispatchChannel === "Email" ? (
                <div className="space-y-1">
                  <Label className="text-[11px]">Recipient Email</Label>
                  <Input
                    value={dispatchRecipientEmail}
                    onChange={e => setDispatchRecipientEmail(e.target.value)}
                    className="bg-muted/40 text-xs h-8 font-mono"
                    placeholder="prospect@company.com"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-[11px]">LinkedIn Profile URL</Label>
                  <Input
                    value={dispatchRecipientLinkedin}
                    onChange={e => setDispatchRecipientLinkedin(e.target.value)}
                    className="bg-muted/40 text-xs h-8 font-mono"
                    placeholder="https://linkedin.com/in/prospect"
                  />
                </div>
              )}
            </div>

            {dispatchChannel === "Email" && (
              <div className="space-y-1">
                <Label className="text-[11px]">Subject Line</Label>
                <Input
                  value={dispatchSubject}
                  onChange={e => setDispatchSubject(e.target.value)}
                  className="bg-muted/40 text-xs h-8"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-[11px]">Message Content</Label>
              <Textarea
                value={dispatchBody}
                onChange={e => setDispatchBody(e.target.value)}
                className="bg-muted/30 border-border/40 text-xs font-mono min-h-[140px] resize-y leading-relaxed"
              />
            </div>

            {dispatchResult && (
              <div className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${dispatchResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}>
                {dispatchResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{dispatchResult.success ? "Message Dispatched Successfully!" : "Dispatch Failed"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {dispatchResult.success
                      ? `Delivered via connected sender. Activity logged in Outreach Activity Center (#${dispatchResult.messageId || 'sent'}).`
                      : dispatchResult.error}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t border-border/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDispatchModalOpen(false)}
              className="text-xs h-8"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={dispatching || (dispatchChannel === "Email" ? !dispatchRecipientEmail : !dispatchRecipientName)}
              onClick={handleExecuteDispatch}
              className={`text-white text-xs h-8 gap-1.5 shadow-md ${dispatchChannel === "LinkedIn"
                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                }`}
            >
              {dispatching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {dispatching ? "Dispatching..." : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}

export default function AiMessagingPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">Loading AI messaging engine...</div>}>
      <AiMessagingContent />
    </React.Suspense>
  );
}
