import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowLeft, Cookie, CheckCircle2, Sliders, Shield } from "lucide-react";

export default function CookiePolicyPage() {
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
        <Link href="/acceptable-use" className="px-3.5 py-2 rounded-xl font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-border/30 bg-card/40">
          Acceptable Use
        </Link>
        <Link href="/cookie-policy" className="px-3.5 py-2 rounded-xl font-semibold bg-indigo-600 text-white shadow-sm">
          Cookie Policy
        </Link>
      </div>

      {/* Hero title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 text-[11px] font-semibold">
          <Cookie className="h-3.5 w-3.5" /> Transparency & Tracking Controls
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Cookie Policy</h1>
        <p className="text-xs text-muted-foreground">Last updated: August 19, 2026 · Understanding our cookie usage</p>
      </div>

      {/* Policy content */}
      <Card className="border-border/50 bg-card p-6 sm:p-8 space-y-6 leading-relaxed text-sm text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">01.</span> What Are Cookies?
          </h2>
          <p>
            Cookies and local storage tokens are small text files placed on your device by your web browser when you visit websites. They help authenticate sessions, store user interface preferences (such as dark mode), and provide aggregated analytics to enhance platform speed.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">02.</span> Categories of Cookies We Use
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider">1. Strictly Necessary Cookies</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Essential</Badge>
              </div>
              <p className="text-xs">Required for user authentication, security verification, CSRF protection, and session maintenance.</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider">2. Preference & Customization Cookies</span>
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px]">Functional</Badge>
              </div>
              <p className="text-xs">Stores UI preferences such as theme selection (dark/light), sidebar state, and filter presets.</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider">3. Performance & Telemetry Cookies</span>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">Analytics</Badge>
              </div>
              <p className="text-xs">Collects aggregated, anonymized usage metrics on query response times and system performance.</p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">03.</span> Managing Your Cookie Preferences
          </h2>
          <p>
            You can control or disable non-essential cookies at any time through your browser settings. Note that disabling strictly necessary cookies may prevent authentication and access to your YSalesPro account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-mono text-xs">04.</span> Questions & Consent Verification
          </h2>
          <p>
            If you have any questions about our use of cookies or tracking technologies, please contact{" "}
            <Link href="/contact" className="text-indigo-400 hover:underline font-semibold">
              security@salespro.ai
            </Link>.
          </p>
        </section>
      </Card>
    </>
  );
}
