"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  ArrowRight,
  FileText,
  MessageSquare,
  Linkedin,
  Phone,
  Sparkles,
  RefreshCw,
  Send,
  Loader2,
  ChevronRight,
  Zap,
  Copy,
  Check,
  Rocket,
  Bookmark,
} from "lucide-react";
import type {
  MessageType,
  GeneratedMessage,
  MessageGenerationResult,
} from "@/lib/types";

// ─── Message Type Metadata ────────────────────────────────────────────────────
const MSG_META: Record<
  MessageType,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  email_subject: {
    icon: <Mail className="h-3.5 w-3.5" />,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/25",
  },
  initial_email: {
    icon: <Mail className="h-3.5 w-3.5" />,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/25",
  },
  followup_1: {
    icon: <ArrowRight className="h-3.5 w-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
  followup_2: {
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  final: {
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
  },
  linkedin: {
    icon: <Linkedin className="h-3.5 w-3.5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
  },
  call_script: {
    icon: <Phone className="h-3.5 w-3.5" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
  },
};

const SCORE_COLOR = (s: number) =>
  s >= 88 ? "text-emerald-400" : s >= 75 ? "text-amber-400" : "text-muted-foreground";

function ScoreRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 88 ? "#10b981" : score >= 75 ? "#f59e0b" : "#6b7280";
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#27272a" strokeWidth="3.5" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[10px] font-extrabold font-mono ${SCORE_COLOR(score)}`}>
          {score}
        </span>
      </div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${
        copied ? "text-emerald-400" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" /> Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Copy
        </>
      )}
    </button>
  );
}

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
          <div
            className={`h-7 w-7 rounded-lg ${meta.bg} ${meta.border} flex items-center justify-center ${meta.color} shrink-0`}
          >
            {meta.icon}
          </div>
          <span className={`text-xs font-bold ${meta.color}`}>{msg.label}</span>
          {msg.subject && msg.type !== "email_subject" && (
            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[240px]">
              Subject: {msg.subject}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ScoreRing score={msg.personalization_score} />
          <div className="flex flex-col items-end gap-1">
            <span className="text-[8px] uppercase font-bold text-muted-foreground">
              Personalization
            </span>
            <div className="flex items-center gap-2">
              <CopyBtn text={msg.content} />
              {editable && (
                <button
                  onClick={() => setEditing((e) => !e)}
                  className="text-[10px] text-muted-foreground hover:text-indigo-400 font-semibold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> {editing ? "Preview" : "Edit"}
                </button>
              )}
              {onSend && (isEmail || isLinkedIn) && (
                <Button
                  size="sm"
                  onClick={() => onSend(msg)}
                  className={`text-[11px] h-7 gap-1 px-2.5 shadow-sm text-white ${
                    isLinkedIn
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
        <Textarea
          value={msg.content}
          onChange={(e) => onChange(e.target.value)}
          className="bg-muted/30 border-border/40 text-xs font-mono min-h-[160px] resize-y leading-relaxed"
        />
      ) : (
        <pre className="text-xs text-muted-foreground font-sans whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/30 max-h-48 overflow-y-auto">
          {msg.content}
        </pre>
      )}

      {/* Hooks Used */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/20">
        <span className="text-[9px] uppercase font-bold text-muted-foreground/60 mr-1">
          Personalized with:
        </span>
        {msg.hooks_used.slice(0, 5).map((h: string) => (
          <Badge
            key={h}
            variant="outline"
            className="text-[9px] bg-muted/20 font-mono px-1.5 text-muted-foreground"
          >
            {h}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export const FILTERS: { label: string; types: MessageType[] }[] = [
  {
    label: "All Outreach",
    types: [
      "email_subject",
      "initial_email",
      "followup_1",
      "followup_2",
      "final",
      "linkedin",
      "call_script",
    ],
  },
  {
    label: "Email Sequence",
    types: [
      "email_subject",
      "initial_email",
      "followup_1",
      "followup_2",
      "final",
    ],
  },
  { label: "LinkedIn", types: ["linkedin"] },
  { label: "Call Script", types: ["call_script"] },
];

interface GeneratedMessagesProps {
  result: MessageGenerationResult | null;
  loading: boolean;
  editableMessages: GeneratedMessage[];
  activeFilter: number;
  setActiveFilter: (index: number) => void;
  onUpdateMessage: (index: number, content: string) => void;
  onSend: (msg: GeneratedMessage) => void;
  onOpenCopilot: () => void;
  optimizingSeq: boolean;
  onRegenerate: () => void;
  canGenerate: boolean;
  onSaveAndLaunchCampaign: () => void;
  onSaveCampaignDraft: () => void;
  savingCampaign: boolean;
  savingDraft: boolean;
}

export function GeneratedMessages({
  result,
  loading,
  editableMessages,
  activeFilter,
  setActiveFilter,
  onUpdateMessage,
  onSend,
  onOpenCopilot,
  optimizingSeq,
  onRegenerate,
  canGenerate,
  onSaveAndLaunchCampaign,
  onSaveCampaignDraft,
  savingCampaign,
  savingDraft,
}: GeneratedMessagesProps) {
  const avgScore = editableMessages.length
    ? Math.round(
        editableMessages.reduce((s, m) => s + m.personalization_score, 0) /
          editableMessages.length
      )
    : 0;

  const displayedMessages = editableMessages.filter((m) =>
    FILTERS[activeFilter]?.types.includes(m.type)
  );

  return (
    <div className="space-y-4">
      {result ? (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-border/50 bg-card p-3 text-center">
              <div className="text-xl font-extrabold font-mono text-indigo-300">
                {avgScore}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Avg Personalization Score
              </div>
            </Card>
            <Card className="border-border/50 bg-card p-3 text-center">
              <div className="text-xl font-extrabold font-mono text-emerald-400">
                {editableMessages.length}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Messages Generated
              </div>
            </Card>
            <Card className="border-border/50 bg-card p-3 text-center">
              <div className="text-xl font-extrabold font-mono text-purple-400">
                {new Set(editableMessages.flatMap((m) => m.hooks_used)).size}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Data Points Used
              </div>
            </Card>
          </div>

          {/* Context Summary */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-card border border-border/40 rounded-xl text-[10px]">
            <span className="font-bold text-foreground">
              {result.person.full_name}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-muted-foreground">{result.person.title}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-indigo-400 font-semibold">
              {result.company.name}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px]">
              {result.company.industry}
            </Badge>
            <Badge className="bg-muted/40 text-muted-foreground border-border/40 text-[9px]">
              {result.person.seniority}
            </Badge>
            <Badge className="bg-muted/40 text-muted-foreground border-border/40 text-[9px]">
              {result.company.size}
            </Badge>
            {result.offer?.product_service && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-semibold">
                Selling: {result.offer.product_service}
              </Badge>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map((f, i) => (
              <button
                key={f.label}
                onClick={() => setActiveFilter(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeFilter === i
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"
                }`}
              >
                {f.label}
                <span className="ml-1.5 font-mono text-[10px] opacity-70">
                  ({editableMessages.filter((m) => f.types.includes(m.type)).length})
                </span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={onSaveCampaignDraft}
                disabled={savingDraft || savingCampaign || editableMessages.length === 0}
                className="h-8 px-3 text-xs gap-1.5 font-medium border-border/70 bg-card hover:bg-muted/70 text-foreground"
              >
                {savingDraft ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {savingDraft ? "Saving Draft…" : "Save as Campaign Draft"}
              </Button>
              <Button
                size="sm"
                onClick={onSaveAndLaunchCampaign}
                disabled={savingDraft || savingCampaign || editableMessages.length === 0}
                className="h-8 px-3 text-xs gap-1.5 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20"
              >
                {savingCampaign ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Rocket className="h-3.5 w-3.5" />
                )}
                {savingCampaign ? "Launching Campaign…" : "Save & Launch as Campaign"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenCopilot}
                disabled={optimizingSeq}
                className="h-8 px-2.5 text-xs gap-1.5 border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
              >
                {optimizingSeq ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                )}
                {optimizingSeq ? "Optimizing..." : "AI Sequence Copilot"}
              </Button>
              <button
                onClick={onRegenerate}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all disabled:opacity-50 h-8"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />{" "}
                Regenerate
              </button>
            </div>
          </div>

          {/* Message Cards */}
          <div className="space-y-4">
            {displayedMessages.map((msg) => {
              const globalIdx = editableMessages.findIndex(
                (m) => m.type === msg.type
              );
              return (
                <MessageCard
                  key={msg.type}
                  msg={msg}
                  editable={true}
                  onChange={(content) => onUpdateMessage(globalIdx, content)}
                  onSend={onSend}
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
              Select a contact or organization above, then click{" "}
              <strong>Generate</strong> to create 7 personalized messages.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-left w-full max-w-xs">
            {[
              {
                icon: <Mail className="h-3 w-3 text-indigo-400" />,
                label: "Email Sequence (4 steps)",
              },
              {
                icon: <Linkedin className="h-3 w-3 text-blue-400" />,
                label: "LinkedIn Message",
              },
              {
                icon: <Phone className="h-3 w-3 text-purple-400" />,
                label: "Call Script",
              },
              {
                icon: <Zap className="h-3 w-3 text-amber-400" />,
                label: "Personalization Score",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-muted-foreground"
              >
                {item.icon} {item.label}
              </div>
            ))}
          </div>
          <Button
            onClick={onRegenerate}
            disabled={loading || !canGenerate}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Sparkles className="h-4 w-4" /> Generate Now
          </Button>
        </div>
      )}
    </div>
  );
}
