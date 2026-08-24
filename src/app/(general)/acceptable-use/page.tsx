"use client"

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function AcceptableUsePolicyPage() {
  return (
    <>
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl p-1 bg-card scrollbar-none text-xs">
        <Link href="/terms" className="px-3.5 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-border/30 bg-card/40">
          Terms of Service
        </Link>
        <Link href="/privacy" className="px-3.5 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-border/30 bg-card/40">
          Privacy Policy
        </Link>
        <Link href="/acceptable-use" className="px-3.5 py-2 rounded-xl font-semibold bg-indigo-600 text-white shadow-sm">
          Acceptable Use
        </Link>
        <Link href="/cookie-policy" className="px-3.5 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-border/30 bg-card/40">
          Cookie Policy
        </Link>
      </div>

      {/* Hero title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[11px] font-semibold">
          <MailCheck className="h-3.5 w-3.5" /> Ethical Sales Standards & Anti-Spam
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Acceptable Use Policy</h1>
        <p className="text-xs text-muted-foreground">Last updated: August 19, 2026 · Governing all platform outreach</p>
      </div>

      {/* Policy content */}
      <Card className="border-border/50 bg-card p-6 sm:p-8 space-y-6 leading-relaxed text-sm text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">01.</span> Purpose & Scope
          </h2>
          <p>
            This Acceptable Use Policy (&ldquo;AUP&rdquo;) defines the rules and standards governing the use of YSalesPro&apos;s intelligence dataset, AI sequence generator, and communication tools. We are dedicated to promoting professional, ethical, and lawful business communications.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">02.</span> Anti-Spam & Email Standards
          </h2>
          <p>
            Users must strictly adhere to all applicable electronic communication laws (including the CAN-SPAM Act, GDPR, and CASL). You agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Include accurate sender identification and valid physical corporate addresses in all outreach.</li>
            <li>Provide clear, working opt-out mechanisms or unsubscribe links in all automated marketing communications.</li>
            <li>Promptly honor unsubscribe and opt-out requests within 48 hours.</li>
            <li>Avoid deceptive, misleading, or deceptive subject lines and spoofed header data.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">03.</span> Prohibited Activities
          </h2>
          <p>You may not use YSalesPro to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Distribute malware, phishing attempts, fraudulent schemes, or defamatory material.</li>
            <li>Systematically scrape, reverse engineer, or bulk-export database telemetry for reselling as a standalone dataset.</li>
            <li>Attempt to circumvent platform rate limits, authentication barriers, or security controls.</li>
            <li>Harass, intimidate, or threaten any individual through outreach channels.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">04.</span> Account Enforcement & Violations
          </h2>
          <p>
            YSalesPro monitors platform activity for compliance. Suspected violations of this policy may result in immediate warning, temporary sequence throttling, API rate limitation, or permanent account termination without refund.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">05.</span> Reporting Violations
          </h2>
          <p>
            To report abuse or non-compliant communications originating from our platform, please contact{" "}
            <Link href="/contact" className="text-indigo-400 hover:underline font-semibold">
              abuse@salespro.ai
            </Link>.
          </p>
        </section>
      </Card>
    </>
  );
}
