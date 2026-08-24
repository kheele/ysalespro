"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Zap,
  ArrowLeft,
  Search,
  BookOpen,
  LifeBuoy,
  MessageSquare,
  FileQuestion,
  Sparkles,
  Layers,
  ShieldCheck,
  Send,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useGeneralHero } from "../_context/GeneralHeroContext";
import { useEffect } from "react";

const HELP_CATEGORIES = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Learn account setup, workspace onboarding, and syncing your initial lead lists.",
    articles: [
      { title: "Quickstart: Setting up your organization profile", time: "3 min read" },
      { title: "Importing contacts and company CSV datasets", time: "4 min read" },
      { title: "Configuring user permissions & team seats", time: "2 min read" },
    ],
  },
  {
    icon: Sparkles,
    title: "AI Messaging & Sequences",
    description: "Harness Gemini-powered cold outreach generation, multi-stage follow-ups, and email tone tuning.",
    articles: [
      { title: "Crafting personalized outreach for C-suite leads", time: "5 min read" },
      { title: "Using industry pain point generators", time: "3 min read" },
      { title: "Setting automated follow-up cadences", time: "4 min read" },
    ],
  },
  {
    icon: Layers,
    title: "Pipeline & Campaign Tracking",
    description: "Track conversion funnels, schedule outreach, and monitor deals in real-time.",
    articles: [
      { title: "Understanding executive pipeline telemetry", time: "4 min read" },
      { title: "Managing multi-channel sales campaigns", time: "3 min read" },
      { title: "Exporting conversion analytics and reports", time: "2 min read" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security, Integrations & API",
    description: "Manage 2FA, API keys, Zoom/Slack webhooks, and GraphQL endpoints.",
    articles: [
      { title: "Connecting Slack, Zoom, and CRM webhooks", time: "4 min read" },
      { title: "Setting up Two-Factor Authentication (2FA)", time: "2 min read" },
      { title: "Session timeout and security best practices", time: "3 min read" },
    ],
  },
];

export default function HelpPage() {
  const { setHeroSection } = useGeneralHero();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [ticketSubmitted, setTicketSubmitted] = React.useState(false);
  const [ticketEmail, setTicketEmail] = React.useState("");
  const [ticketMessage, setTicketMessage] = React.useState("");

  useEffect(() => {
    setHeroSection(<>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
        <LifeBuoy className="h-3.5 w-3.5" /> Knowledge Base & Customer Support
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
        How can we help you today?
      </h1>
      <p className="text-sm text-muted-foreground max-w-xl mx-auto">
        Search our comprehensive documentation, workflow guides, and tutorials or connect directly with our engineering support team.
      </p>

      <div className="max-w-xl mx-auto relative pt-2">
        <Search className="absolute left-3.5 top-5.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search guides, AI outreach, integrations, billing..."
          className="pl-10 h-11 bg-card/90 border-border/60 shadow-lg text-sm rounded-xl"
        />
      </div>
    </>);

    return () => {
      setHeroSection(null);
    };
  }, []);

  const filteredCategories = HELP_CATEGORIES.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.articles.length > 0 || !searchQuery);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail || !ticketMessage) return;
    setTicketSubmitted(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCategories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <Card key={idx} className="border-border/50 bg-card/70 hover:border-indigo-500/40 transition-all p-6 rounded-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{cat.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {cat.articles.map((art, aIdx) => (
                    <div
                      key={aIdx}
                      className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 cursor-pointer border border-transparent hover:border-border/40 transition-colors"
                    >
                      <span className="text-xs font-medium text-foreground group-hover:text-indigo-400 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {art.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{art.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-border/30">
                <Link href="/faq" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  View related FAQs <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Support Ticket Section */}
      <Card className="border-border/50 bg-card p-6 sm:p-8 rounded-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <MessageSquare className="h-3.5 w-3.5" /> 24/7 Enterprise Assistance
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Need dedicated help from a sales engineer?</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our support team is available around the clock. Submit your inquiry below and one of our specialists will respond within 2 hours.
            </p>
            <div className="space-y-2 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Guaranteed SLA for Enterprise accounts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Direct screen-share and pipeline triage</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/20 border border-border/40 p-5 rounded-xl">
            {ticketSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base">Support Ticket Created</h3>
                <p className="text-xs text-muted-foreground">
                  We received your ticket and dispatched an engineer. A confirmation was sent to {ticketEmail}.
                </p>
                <Button variant="outline" size="sm" onClick={() => setTicketSubmitted(false)} className="text-xs mt-2">
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Your Work Email</label>
                  <Input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={ticketEmail}
                    onChange={(e) => setTicketEmail(e.target.value)}
                    className="bg-background/60 text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">How can we help?</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the issue or question..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-background/60 border border-border/60 rounded-md p-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Submit Support Request
                </Button>
              </form>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
