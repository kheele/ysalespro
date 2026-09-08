"use client";

import * as React from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Server,
  Activity,
  Zap,
  Clock,
  BookOpen,
  Headphones,
} from "lucide-react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function SupportPage() {
  const { user, dbUser } = useAuth();
  const { toast } = useToast();

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const [form, setForm] = React.useState({
    subject: "",
    category: "Technical Issue & Bug Report",
    priority: "medium",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast({
        title: "Incomplete details",
        description: "Please provide a subject and a description of your request.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    // Simulate support ticket creation and notification
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast({
        title: "✅ Support Ticket Dispatched",
        description: "Your priority ticket has been registered. Our engineering support desk will reply promptly.",
      });
    }, 700);
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({
      subject: "",
      category: "Technical Issue & Bug Report",
      priority: "medium",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Help & Support Desk"
          subtitle="Priority technical assistance, incident reporting, and platform knowledge resources"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-6xl mx-auto w-full">
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border/60 p-6 sm:p-8 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                <Headphones className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Dedicated Enterprise Assistance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl tracking-tight text-foreground">
                How can our support team assist you today?
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Whether you need help with email mailbox synchronization, AI message prompt customization, or troubleshooting team permissions, our engineers are here to assist.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Ticket Submission Form */}
            <div className="lg:col-span-7">
              <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-indigo-400" />
                        Submit a Priority Ticket
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Direct ticket routing to our engineering and product reliability teams.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      SLA: &lt; 2 Hours
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-2">
                  {submitted ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground">Support Request Received!</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                          Ticket ID <strong className="text-foreground font-mono">#TK-{Math.floor(100000 + Math.random() * 900000)}</strong> has been opened and assigned. We have sent a confirmation email to <strong className="text-foreground">{user?.email || "your registered address"}</strong>.
                        </p>
                      </div>
                      <div className="pt-2">
                        <Button size="sm" onClick={handleReset} variant="outline" className="text-xs">
                          Submit Another Ticket
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Category</Label>
                          <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="w-full h-9 rounded-md bg-muted/40 border border-border/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Technical Issue & Bug Report">Technical Issue & Bug Report</option>
                            <option value="Email & IMAP Synchronization">Email & IMAP Synchronization</option>
                            <option value="AI Sequencing & Triage">AI Sequencing & Triage</option>
                            <option value="Account, Team & Permissions">Account, Team & Permissions</option>
                            <option value="Billing & Subscription Plans">Billing & Subscription Plans</option>
                            <option value="Feature Request & Feedback">Feature Request & Feedback</option>
                          </select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Priority Level</Label>
                          <select
                            value={form.priority}
                            onChange={(e) => setForm({ ...form, priority: e.target.value })}
                            className="w-full h-9 rounded-md bg-muted/40 border border-border/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="low">Low — General inquiry</option>
                            <option value="medium">Medium — Normal operational request</option>
                            <option value="high">High — Partial workflow blockage</option>
                            <option value="urgent">Urgent — Critical system outage</option>
                          </select>
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Subject</Label>
                        <Input
                          placeholder="Brief description of the issue or inquiry..."
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="bg-muted/40 border-border/50 text-xs h-9"
                          required
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Detailed Description</Label>
                        <Textarea
                          placeholder="Describe the behavior you are seeing, steps to reproduce, or what you need assistance with..."
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          className="bg-muted/40 border-border/50 text-xs min-h-[120px] resize-y"
                          required
                        />
                      </div>

                      {/* Context metadata */}
                      <div className="p-3 bg-muted/20 border border-border/30 rounded-lg flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Requester: <strong className="text-foreground">{user?.email || "Authenticated User"}</strong></span>
                        <span>Workspace: <strong className="text-foreground">Connected</strong></span>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold h-9 shadow-md shadow-indigo-600/20"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {submitting ? "Dispatching Ticket..." : "Submit Ticket"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right 5 Columns: Direct Channels & System Status */}
            <div className="lg:col-span-5 space-y-4">
              {/* Direct Channels */}
              <Card className="border-border/50 bg-card p-5 rounded-xl space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-indigo-400" />
                    Direct Contact Channels
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Connect directly with our support specialists.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground block">Email Support</span>
                      <a href="mailto:support@ysalespro.com" className="text-muted-foreground hover:text-indigo-400 transition-colors">
                        support@ysalespro.com
                      </a>
                      <span className="text-[10px] text-muted-foreground block">24/7 dedicated support inbox</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground block">Emergency Hotline</span>
                      <span className="text-muted-foreground font-mono block">+27 11 450 8900</span>
                      <span className="text-muted-foreground font-mono block">+266 5604 7042</span>
                      <span className="text-[10px] text-muted-foreground block">Mon–Fri: 08:00 – 18:00 (SAST)</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Knowledge Base */}
              <Card className="border-border/50 bg-card p-5 rounded-xl space-y-3 shadow-sm">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  Self-Service Documentation
                </h3>
                <div className="space-y-1.5 text-xs">
                  <Link
                    href="/help"
                    target="_blank"

                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <span className="font-medium text-foreground group-hover:text-indigo-400">Help Center & Guides</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/faq"
                    target="_blank"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <span className="font-medium text-foreground group-hover:text-indigo-400">Frequently Asked Questions</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <span className="font-medium text-foreground group-hover:text-indigo-400">Email & IMAP Account Settings</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
