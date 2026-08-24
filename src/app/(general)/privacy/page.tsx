"use client"

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl p-1 bg-card scrollbar-none text-xs">
        <Link href="/terms" className="px-3.5 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-border/30 bg-card/40">
          Terms of Service
        </Link>
        <Link href="/privacy" className="px-3.5 py-2 rounded-xl font-semibold bg-indigo-600 text-white shadow-sm">
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
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
          <Shield className="h-3.5 w-3.5" /> GDPR & POPIA Compliant
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground">Last updated: August 19, 2026 · Committed to data protection</p>
      </div>

      {/* Policy content */}
      <Card className="border-border/50 bg-card p-6 sm:p-8 space-y-6 leading-relaxed text-sm text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">01.</span> Overview & Scope
          </h2>
          <p>
            YSalesPro (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting the privacy and personal data of our users, clients, and corporate business contacts. This Privacy Policy explains how we collect, process, store, and safeguard information across our enterprise sales intelligence platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">02.</span> Information We Collect
          </h2>
          <div className="space-y-2 pl-2">
            <p><strong className="text-foreground">Account Data:</strong> Name, work email, company name, job title, phone number, and encrypted authentication tokens.</p>
            <p><strong className="text-foreground">Business Contact Telemetry:</strong> Publicly available professional contact details (such as executive name, business email, corporate domain, LinkedIn profile URL, and industry sector).</p>
            <p><strong className="text-foreground">Usage Telemetry:</strong> Anonymized query latency, outreach status metrics, browser type, and feature utilization.</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">03.</span> How We Use Your Information
          </h2>
          <p>
            We process personal data solely for legitimate business purposes including providing CRM data synchronization, powering AI sales outreach suggestions, managing subscriptions, verifying security credentials, and improving platform performance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">04.</span> Data Sharing & Sub-Processors
          </h2>
          <p>
            We never sell personal user data to third parties. We share data only with vetted enterprise sub-processors essential for service operations (e.g. Firebase Auth for authentication, Google Cloud for scalable hosting, and Hasura GraphQL for database query routing).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">05.</span> Data Security & Encryption
          </h2>
          <p>
            All data transmitted to and from YSalesPro is encrypted in transit via TLS 1.3 and at rest using AES-256 enterprise encryption. We maintain strict role-based access controls (RBAC) and periodic security audits.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">06.</span> Your Data Rights & Opt-Out
          </h2>
          <p>
            Under GDPR, POPIA, and CCPA, you have the right to access, rectify, port, or request the deletion of your personal data from our directory. To submit a removal or data subject request, email{" "}
            <Link href="/contact" className="text-indigo-400 hover:underline font-semibold">
              privacy@salespro.ai
            </Link>.
          </p>
        </section>
      </Card>
    </>
  );
}
