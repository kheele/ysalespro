"use client"

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Scale } from "lucide-react";

export default function TermsPage() {

  return (
    <>
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl p-1 bg-card scrollbar-none text-xs">
        <Link href="/terms" className="px-3.5 py-2 rounded-xl font-semibold bg-indigo-600 text-white shadow-sm">
          Terms of Service
        </Link>
        <Link href="/privacy" className="px-3.5 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-border/30 bg-card/40">
          Privacy Policy
        </Link>
        <Link href="/acceptable-use" className="px-3.5 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-border/30 bg-card/40">
          Acceptable Use
        </Link>
        <Link href="/cookie-policy" className="px-3.5 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-border/30 bg-card/40">
          Cookie Policy
        </Link>
      </div>

      {/* Hero title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[11px] font-semibold">
          <Scale className="h-3.5 w-3.5" /> Enterprise SaaS Agreement
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="text-xs text-muted-foreground">Last updated: August 19, 2026 · Effective immediately</p>
      </div>

      {/* Terms content */}
      <Card className="border-border/50 bg-card p-6 sm:p-8 space-y-6 leading-relaxed text-sm text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">01.</span> Acceptance of Terms
          </h2>
          <p>
            By accessing, registering for, or using the YSalesPro platform, APIs, applications, or services (collectively, the &ldquo;Services&rdquo;), you (&ldquo;Customer&rdquo; or &ldquo;User&rdquo;) agree to be legally bound by these Terms of Service. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the legal authority to bind such entity.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">02.</span> Description of Services
          </h2>
          <p>
            YSalesPro provides B2B sales intelligence, decision-maker data telemetry, AI-assisted outreach sequence generation, campaign scheduling, and CRM pipeline analytics. We continuously update and refine our dataset to maintain accuracy and compliance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">03.</span> Account Registration & Security
          </h2>
          <p>
            You must provide accurate, current, and complete registration information and maintain the confidentiality of your account credentials. You are responsible for all activities occurring under your account. You agree to notify YSalesPro immediately of any unauthorized use or security compromise.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">04.</span> Subscription, Billing & Cancellation
          </h2>
          <p>
            Access to paid tiers of YSalesPro is billed on a recurring monthly or annual subscription basis. Fees are non-refundable except where required by law. You may cancel your subscription at any time via your Account Settings, and your access will continue through the conclusion of the current billing cycle.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">05.</span> Customer Data & Intellectual Property
          </h2>
          <p>
            You retain all ownership rights to the proprietary lead lists, notes, and outreach templates you upload to the platform (&ldquo;Customer Data&rdquo;). YSalesPro and its licensors retain all intellectual property rights in and to the platform, UI, algorithms, telemetry databases, and software.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">06.</span> Service Level Agreement (SLA) & Uptime
          </h2>
          <p>
            YSalesPro aims to maintain 99.9% uptime for core database query and outreach endpoints, excluding planned maintenance windows communicated in advance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">07.</span> Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, neither party shall be liable for indirect, incidental, special, consequential, or punitive damages, or loss of revenue or data arising out of or related to the Services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">08.</span> Contact & Inquiries
          </h2>
          <p>
            For legal questions regarding these Terms, please contact our legal team at{" "}
            <Link href="/contact" className="text-indigo-400 hover:underline font-semibold">
              legal@salespro.ai
            </Link>.
          </p>
        </section>
      </Card>
    </>
  );
}
