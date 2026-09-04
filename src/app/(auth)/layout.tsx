import * as React from "react";
import Link from "next/link";
import { CookieNotice } from "@/components/cookie-notice";
import { Sparkles, Building2, Send, Radio, CheckCircle2, TrendingUp, ShieldCheck, Users } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Enterprise Sales Intelligence Showcase (Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 relative overflow-hidden flex-col justify-between p-12 text-white border-r border-border/40 select-none">
        {/* Ambient background glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top Branding */}
        <div className="relative z-10">
          <Link href="/dashboard" className="inline-flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  YSalesPro
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">B2B Sales Intelligence & Revenue Operations</p>
            </div>
          </Link>

          {/* Hero Pitch */}
          <div className="space-y-4 max-w-lg mt-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry & Account Enrichment Active
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
              Turn verified account intelligence into{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                predictable revenue
              </span>
              .
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Enrich 44,000+ corporate accounts, uncover verified decision-makers, and orchestrate hyper-personalized multichannel outreach with AI sales hooks.
            </p>
          </div>
        </div>

        {/* Dynamic Metric Badges & Capabilities */}
        <div className="relative z-10 space-y-6 my-auto py-8">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold">
                <Building2 className="h-3.5 w-3.5" /> Database
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-white font-mono">44.7k+</p>
              <p className="text-[10px] text-zinc-400">Enriched Accounts</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Accuracy
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-emerald-400 font-mono">98.4%</p>
              <p className="text-[10px] text-zinc-400">Verified Direct Emails</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold">
                <TrendingUp className="h-3.5 w-3.5" /> Pipeline
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-purple-300 font-mono">3.8x</p>
              <p className="text-[10px] text-zinc-400">Outreach Velocity</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-zinc-200">
              <div className="h-6 w-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Send className="h-3.5 w-3.5" />
              </div>
              <span>Automated Cold Email & LinkedIn outreach sequences</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-200">
              <div className="h-6 w-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <span>Real-time buying intent velocity & market trigger signals</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-200">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <span>SOC2 compliant enterprise account data & governance</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-white/[0.08]">
          <span>© {new Date().getFullYear()} YSalesPro. All Rights Reserved.</span>
          <span className="font-mono text-[11px] text-zinc-400">v1.0 Enterprise Intelligence</span>
        </div>
      </div>

      {/* Right Side - Form Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-3 mb-6 text-center">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">YSalesPro</span>
            </Link>
            <p className="text-xs text-muted-foreground">Enterprise B2B Sales Intelligence Platform</p>
          </div>

          {children}
        </div>
      </div>

      <CookieNotice />
    </div>
  );
}
