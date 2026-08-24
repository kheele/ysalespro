"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as aiMessageServices from "@/services/private/aiMessageServices";
import type {
  MessageType,
  PersonContext,
  CompanyContext,
  GeneratedMessage,
  MessageGenerationResult,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles, Mail, Phone, Linkedin, Copy, Check,
  ChevronRight, User, Building2, Zap, RefreshCw,
  Send, ArrowRight, MessageSquare, FileText,
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

// ─── Message Card ─────────────────────────────────────────────────────────────
function MessageCard({ msg, editable, onChange }: { msg: GeneratedMessage; editable: boolean; onChange: (content: string) => void }) {
  const [editing, setEditing] = React.useState(false);
  const meta = MSG_META[msg.type];

  return (
    <Card className={`${meta.border} bg-card marker:backdrop-blur-sm p-4 space-y-3 transition-all hover:bg-card/80`}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
const FILTERS: { label: string; types: MessageType[] }[] = [
  { label: "All Messages", types: ["email_subject", "initial_email", "followup_1", "followup_2", "final", "linkedin", "call_script"] },
  { label: "Email Sequence", types: ["email_subject", "initial_email", "followup_1", "followup_2", "final"] },
  { label: "LinkedIn", types: ["linkedin"] },
  { label: "Call Script", types: ["call_script"] },
];

const INDUSTRIES = ["Cloud Infrastructure", "Cybersecurity", "Fintech & AI", "Healthcare Tech", "Logistics & Supply Chain", "Robotics & Automation", "Retail Tech", "Mining & Resources"];

export default function AiMessagingPage() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [result, setResult] = React.useState<MessageGenerationResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState(0);
  const [editableMessages, setEditableMessages] = React.useState<GeneratedMessage[]>([]);
  const [painPoints, setPainPoints] = React.useState<string[]>([]);

  const [person, setPerson] = React.useState<Partial<PersonContext>>({
    first_name: "Sarah", last_name: "Jenkins", full_name: "Sarah Jenkins",
    title: "Chief Technology Officer", department: "Engineering",
    seniority: "C-Suite",
  });

  const [company, setCompany] = React.useState<Partial<CompanyContext>>({
    name: "Acme Enterprise Corp", industry: "Cloud Infrastructure",
    size: "Enterprise (1000+)", location: "San Francisco", country: "USA",
    recent_news: "Acme's recent $200M cloud expansion initiative",
    challenges: [],
  });

  const [senderName, setSenderName] = React.useState("Alex Rivers");
  const [senderTitle, setSenderTitle] = React.useState("Sales Director, YSalesPro");

  React.useEffect(() => {
    if (company.industry) {
      aiMessageServices.getIndustryPainPoints(company.industry)
        .then((pts: string[]) => setPainPoints(Array.isArray(pts) ? pts : []))
        .catch(() => setPainPoints([]));
    }
  }, [company.industry]);

  const handleGenerate = async () => {
    if (!person.first_name || !company.name) return;
    setLoading(true);
    const fullPerson: PersonContext = {
      first_name: person.first_name || "",
      last_name: person.last_name || "",
      full_name: person.full_name || `${person.first_name} ${person.last_name}`,
      title: person.title || "Decision Maker",
      department: person.department || "Operations",
      seniority: person.seniority || "VP",
    };
    const fullCompany: CompanyContext = {
      name: company.name || "",
      industry: company.industry || "Technology",
      size: company.size || "Mid-Market (250-1000)",
      location: company.location || "New York",
      country: company.country || "USA",
      recent_news: company.recent_news,
      challenges: company.challenges,
    };
    const res = await aiMessageServices.generateMessages(fullPerson, fullCompany, senderName, senderTitle);
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
          subtitle="Generate hyper-personalized emails, LinkedIn messages, and call scripts using company and person intelligence"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

              {/* ─── LEFT: Context Form ──────────────────────────────────── */}
              <div className="space-y-4">

                {/* Before / After Example */}
                <Card className=" bg-indigo-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Sparkles className="h-4 w-4" /> Personalization Engine
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 bg-muted/30 rounded-lg border border-border/30 text-muted-foreground">
                      <span className="text-[9px] font-bold uppercase text-red-400/80 block mb-1">❌ Generic</span>
                      "Hello John, we help companies improve safety."
                    </div>
                    <div className="p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/20 text-foreground leading-relaxed">
                      <span className="text-[9px] font-bold uppercase text-emerald-400 block mb-1">✓ Personalized</span>
                      "Hello John, companies in the mining sector often struggle with contractor compliance, incident reporting, and audit readiness. Our platform helps operations teams manage these areas centrally."
                    </div>
                  </div>
                </Card>

                {/* Person Context */}
                <Card className="bg-card p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <User className="h-3.5 w-3.5 text-indigo-400" /> Person Context
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">First Name</Label>
                        <Input value={person.first_name || ""} onChange={e => setPerson((p: Partial<PersonContext>) => ({ ...p, first_name: e.target.value, full_name: `${e.target.value} ${p.last_name || ""}`.trim() }))}
                          className="h-8 text-xs bg-muted/40 border-border/60" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Last Name</Label>
                        <Input value={person.last_name || ""} onChange={e => setPerson((p: Partial<PersonContext>) => ({ ...p, last_name: e.target.value, full_name: `${p.first_name || ""} ${e.target.value}`.trim() }))}
                          className="h-8 text-xs bg-muted/40 border-border/60" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Job Title</Label>
                      <Input value={person.title || ""} onChange={e => setPerson((p: Partial<PersonContext>) => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Chief Technology Officer" className="h-8 text-xs bg-muted/40 border-border/60" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Department</Label>
                        <select value={person.department || "Engineering"}
                          onChange={e => setPerson((p: Partial<PersonContext>) => ({ ...p, department: e.target.value }))}
                          className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8">
                          {["Operations", "Engineering", "Finance", "Sales", "Marketing", "IT", "Legal", "HR", "Security"].map(d => <option key={d}>{d}</option>)}
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
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Building2 className="h-3.5 w-3.5 text-purple-400" /> Company Context
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Company Name</Label>
                      <Input value={company.name || ""} onChange={e => setCompany((c: Partial<CompanyContext>) => ({ ...c, name: e.target.value }))}
                        placeholder="e.g. Acme Enterprise Corp" className="h-8 text-xs bg-muted/40 border-border/60" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Industry</Label>
                      <select value={company.industry || "Technology"}
                        onChange={e => setCompany((c: Partial<CompanyContext>) => ({ ...c, industry: e.target.value }))}
                        className="w-full bg-muted/40 border border-border/60 rounded-md px-2 py-1.5 text-xs outline-none text-foreground h-8">
                        {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
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
                          placeholder="e.g. San Francisco" className="h-8 text-xs bg-muted/40 border-border/60" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Recent News / Trigger Event <span className="text-muted-foreground/50">(optional)</span></Label>
                      <Input value={company.recent_news || ""} onChange={e => setCompany((c: Partial<CompanyContext>) => ({ ...c, recent_news: e.target.value }))}
                        placeholder="e.g. $200M cloud expansion, new product launch, IPO..." className="h-8 text-xs bg-muted/40 border-border/60" />
                    </div>
                  </div>
                </Card>

                {/* Sender Identity */}
                <Card className="bg-card p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Send className="h-3.5 w-3.5 text-emerald-400" /> Sender Identity
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
                <Button onClick={handleGenerate} disabled={loading || !person.first_name || !company.name}
                  className="w-full h-11 gap-2 font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                  {loading ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
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
                      <Card className="border-border/50 bg-card/60 p-3 text-center">
                        <div className="text-xl font-extrabold font-mono text-indigo-300">{avgScore}</div>
                        <div className="text-[10px] text-muted-foreground">Avg Personalization Score</div>
                      </Card>
                      <Card className="border-border/50 bg-card/60 p-3 text-center">
                        <div className="text-xl font-extrabold font-mono text-emerald-400">{editableMessages.length}</div>
                        <div className="text-[10px] text-muted-foreground">Messages Generated</div>
                      </Card>
                      <Card className="border-border/50 bg-card/60 p-3 text-center">
                        <div className="text-xl font-extrabold font-mono text-purple-400">
                          {new Set(editableMessages.flatMap(m => m.hooks_used)).size}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Data Points Used</div>
                      </Card>
                    </div>

                    {/* Context Summary */}
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-card/40 border border-border/40 rounded-xl text-[10px]">
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
                    <div className="flex items-center gap-2">
                      {FILTERS.map((f, i) => (
                        <button key={f.label} onClick={() => setActiveFilter(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activeFilter === i ? "bg-indigo-600 text-white border-indigo-600" : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"}`}>
                          {f.label}
                          <span className="ml-1.5 font-mono text-[10px] opacity-70">
                            ({editableMessages.filter(m => f.types.includes(m.type)).length})
                          </span>
                        </button>
                      ))}
                      <button onClick={handleGenerate} disabled={loading}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all disabled:opacity-50">
                        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Regenerate
                      </button>
                    </div>

                    {/* Message Cards */}
                    <div className="space-y-4">
                      {displayedMessages.map((msg) => {
                        const globalIdx = editableMessages.findIndex(m => m.type === msg.type);
                        return (
                          <MessageCard key={msg.type} msg={msg} editable={true}
                            onChange={content => updateMessage(globalIdx, content)} />
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
                        Fill in the person and company context on the left, then click <strong>Generate</strong> to create 7 personalized messages.
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
                    <Button onClick={handleGenerate} disabled={loading}
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

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
