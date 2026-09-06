"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Linkedin,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { ConnectedAccount, DispatchResult } from "@/lib/types";

interface DispatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: "Email" | "LinkedIn";
  connectedAccounts: ConnectedAccount[];
  recipientName: string;
  setRecipientName: (val: string) => void;
  recipientEmail: string;
  setRecipientEmail: (val: string) => void;
  recipientLinkedin: string;
  setRecipientLinkedin: (val: string) => void;
  subject: string;
  setSubject: (val: string) => void;
  body: string;
  setBody: (val: string) => void;
  accountId: string;
  setAccountId: (val: string) => void;
  dispatching: boolean;
  dispatchResult: DispatchResult | null;
  onExecuteDispatch: () => void;
}

export function DispatchModal({
  open,
  onOpenChange,
  channel,
  connectedAccounts,
  recipientName,
  setRecipientName,
  recipientEmail,
  setRecipientEmail,
  recipientLinkedin,
  setRecipientLinkedin,
  subject,
  setSubject,
  body,
  setBody,
  accountId,
  setAccountId,
  dispatching,
  dispatchResult,
  onExecuteDispatch,
}: DispatchModalProps) {
  const activeAccounts = connectedAccounts.filter(
    (a) => a.channel === channel && a.is_active
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            {channel === "LinkedIn" ? (
              <Linkedin className="h-4 w-4 text-blue-400" />
            ) : (
              <Mail className="h-4 w-4 text-indigo-400" />
            )}
            {channel === "LinkedIn" ? "Send LinkedIn Outreach" : "Send Outreach Email"}
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
            {activeAccounts.length > 0 ? (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-card border border-border/60 rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none"
              >
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({channel === "Email" ? a.email_config?.from_email : a.linkedin_config?.account_name}) {a.is_default ? "— Default" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px]">
                No active {channel} accounts found. Please connect an account in Settings &gt; Integrations.
              </div>
            )}
          </div>

          {/* Recipient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Recipient Name</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="bg-muted/40 text-xs h-8"
              />
            </div>
            {channel === "Email" ? (
              <div className="space-y-1">
                <Label className="text-[11px]">Recipient Email</Label>
                <Input
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="bg-muted/40 text-xs h-8 font-mono"
                  placeholder="prospect@company.com"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-[11px]">LinkedIn Profile URL</Label>
                <Input
                  value={recipientLinkedin}
                  onChange={(e) => setRecipientLinkedin(e.target.value)}
                  className="bg-muted/40 text-xs h-8 font-mono"
                  placeholder="https://linkedin.com/in/prospect"
                />
              </div>
            )}
          </div>

          {channel === "Email" && (
            <div className="space-y-1">
              <Label className="text-[11px]">Subject Line</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-muted/40 text-xs h-8"
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-[11px]">Message Content</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="bg-muted/30 border-border/40 text-xs font-mono min-h-[140px] resize-y leading-relaxed"
            />
          </div>

          {dispatchResult && (
            <div
              className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                dispatchResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              {dispatchResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {dispatchResult.success
                    ? "Message Dispatched Successfully!"
                    : "Dispatch Failed"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {dispatchResult.success
                    ? `Delivered via connected sender. Activity logged in Outreach Activity Center (#${
                        dispatchResult.messageId || "sent"
                      }).`
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
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={
              dispatching ||
              (channel === "Email" ? !recipientEmail : !recipientName)
            }
            onClick={onExecuteDispatch}
            className={`text-white text-xs h-8 gap-1.5 shadow-md ${
              channel === "LinkedIn"
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
  );
}
