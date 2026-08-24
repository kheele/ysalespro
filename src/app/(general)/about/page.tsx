"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Users,
  Target,
  Rocket,
  Globe2,
  Award,
  ArrowRight,
} from "lucide-react";
import { useGeneralHero } from "../_context/GeneralHeroContext";
import { useEffect } from "react";

export default function AboutPage() {
  const { setHeroSection } = useGeneralHero();

  useEffect(() => {
    setHeroSection(<>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
        <Sparkles className="h-3.5 w-3.5" /> Empowering Modern Sales Teams
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
        We build the future of B2B revenue intelligence.
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        YSalesPro was founded on a simple conviction: sales teams should spend less time hunting down stale contact lists and more time building authentic, revenue-generating relationships.
      </p>
    </>);

    return () => {
      setHeroSection(null);
    };
  }, []);

  return (
    <>
      {/* Stats Counter Bar */}
      <div className="border-b border-border/40 bg-card/40 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-extrabold text-indigo-400">120K+</div>
            <div className="text-xs text-muted-foreground mt-1">Verified Decision Makers</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-purple-400">99.4%</div>
            <div className="text-xs text-muted-foreground mt-1">Email Deliverability Rate</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400">3.8x</div>
            <div className="text-xs text-muted-foreground mt-1">Pipeline Velocity Boost</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-sky-400">1,400+</div>
            <div className="text-xs text-muted-foreground mt-1">Enterprise Sales Teams</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-14 w-full space-y-16">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <Card className="border-border/50 bg-card p-6 sm:p-8 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Our Mission</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To equip revenue leaders with real-time account telemetry, automated AI messaging workflows, and hyper-targeted lead qualification—democratizing enterprise-grade intelligence for growing businesses globally.
              </p>
            </div>
            <div className="pt-4 border-t border-border/30 text-xs text-indigo-400 font-semibold flex items-center gap-1">
              Precision Driven <ArrowRight className="h-3 w-3" />
            </div>
          </Card>

          <Card className="border-border/50 bg-card p-6 sm:p-8 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Rocket className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Our Vision</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A world where every B2B communication is relevant, timely, and respectful. We believe AI should enhance human empathy and strategic alignment rather than flood inboxes with generic noise.
              </p>
            </div>
            <div className="pt-4 border-t border-border/30 text-xs text-purple-400 font-semibold flex items-center gap-1">
              Ethics & Innovation <ArrowRight className="h-3 w-3" />
            </div>
          </Card>
        </div>

        {/* Core Pillars */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Our Core Values</h2>
            <p className="text-xs text-muted-foreground">The foundational principles that guide every feature we build.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card p-6 rounded-2xl space-y-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-bold text-sm">Data Integrity First</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We enforce continuous validation loops to guarantee that contacts, job roles, and corporate data remain fresh and verified.
              </p>
            </Card>

            <Card className="border-border/50 bg-card p-6 rounded-2xl space-y-3">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-bold text-sm">AI with Purpose</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We combine Gemini AI with industry domain models to create genuinely personalized, consultative outreach sequences.
              </p>
            </Card>

            <Card className="border-border/50 bg-card p-6 rounded-2xl space-y-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Globe2 className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-bold text-sm">Global Compliance</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                From GDPR and POPIA to CAN-SPAM, privacy and regulatory governance are built into our core architecture.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA banner */}
        <Card className="p-8 bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-background border border-indigo-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-xl font-bold text-foreground">Ready to scale your sales pipeline?</h3>
            <p className="text-xs text-muted-foreground">
              Join leading sales organizations using YSalesPro intelligence to convert opportunities into revenue.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 px-5 shadow-lg shadow-indigo-500/25">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="text-xs h-10 px-4 border-border/70">
                Book a Demo
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </>
  );
}
