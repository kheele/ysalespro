"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard, CheckCircle2, Zap, Building2, Star, ChevronDown,
  ArrowUpCircle, ArrowDownCircle, XCircle, RefreshCcw, Download,
  Shield, Users, Cpu, TrendingUp, Globe, AlertTriangle,
} from "lucide-react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  getBillingOverviewActionByToken,
  changeSubscriptionPlanActionByToken,
  cancelSubscriptionActionByToken,
  resumeSubscriptionActionByToken,
  SOUTHERN_AFRICAN_COUNTRIES,
  type BillingOverviewResult,
  type BillingOverviewSubscription,
  type BillingInvoiceItem,
  type BillingUsage,
} from "@/services/private/billingService";
import type { BillingPlan } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatCurrency(amount: number, currency: string): string {
  const sym: Record<string, string> = {
    ZAR: "R", USD: "$", LSL: "L", NAD: "N$", SZL: "E", BWP: "P", ZMW: "K", MZN: "MT",
  };
  const s = sym[currency] || currency + " ";
  return `${s}${amount.toLocaleString()}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return "—"; }
}

function pct(used: number, limit: number) {
  if (limit <= 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

function usageColor(p: number) {
  if (p >= 90) return "bg-red-500";
  if (p >= 70) return "bg-amber-500";
  return "bg-indigo-500";
}

// ---------------------------------------------------------------------------
// Tier meta
// ---------------------------------------------------------------------------
const TIER_META: Record<string, { icon: React.ReactNode; gradient: string; badge: string; tagline: string }> = {
  starter: {
    icon: <CheckCircle2 className="h-6 w-6 text-zinc-400" />,
    gradient: "from-zinc-900 to-zinc-800",
    badge: "bg-zinc-700 text-zinc-300",
    tagline: "Free forever",
  },
  pro: {
    icon: <Star className="h-6 w-6 text-indigo-400" />,
    gradient: "from-indigo-950 to-indigo-900",
    badge: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    tagline: "Most popular",
  },
  enterprise: {
    icon: <Building2 className="h-6 w-6 text-purple-400" />,
    gradient: "from-purple-950 to-purple-900",
    badge: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    tagline: "Full power",
  },
};

// ---------------------------------------------------------------------------
// Tier card component
// ---------------------------------------------------------------------------
function PlanCard({
  plan,
  isActive,
  billingCycle,
  activeTierLevel,
  onSelect,
  loading,
}: {
  plan: BillingPlan;
  isActive: boolean;
  billingCycle: "monthly" | "annual";
  activeTierLevel: number;
  onSelect: (plan: BillingPlan) => void;
  loading: boolean;
}) {
  const tier = plan.name.toLowerCase() as "starter" | "pro" | "enterprise";
  const meta = TIER_META[tier] || TIER_META.starter;
  const rawPrice = Number(plan.price) || 0;
  const price = billingCycle === "annual" ? Math.round(rawPrice * 0.8) : rawPrice;
  const tierLevel = tier === "starter" ? 0 : tier === "pro" ? 1 : 2;
  const isUpgrade = tierLevel > activeTierLevel;
  const isDowngrade = tierLevel < activeTierLevel;
  const features: string[] = Array.isArray(plan.features) ? plan.features : [];

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 flex flex-col ${
        isActive
          ? "border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02]"
          : "border-border/30 hover:border-border/60 hover:shadow-lg"
      }`}
    >
      {/* Popular badge */}
      {tier === "pro" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 uppercase tracking-wider">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`rounded-t-2xl bg-gradient-to-br ${meta.gradient} p-5`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {meta.icon}
            <span className="font-bold text-foreground text-lg">{plan.name}</span>
          </div>
          {isActive && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ACTIVE
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          {price === 0 ? (
            <span className="text-3xl font-extrabold text-foreground">Free</span>
          ) : (
            <>
              <span className="text-3xl font-extrabold text-foreground">
                {formatCurrency(price, plan.currency || 'ZAR')}
              </span>
              <span className="text-xs text-muted-foreground">/mo</span>
              {billingCycle === "annual" && (
                <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  20% off
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
      </div>

      {/* Features */}
      <div className="flex-1 p-5 space-y-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-5 pt-0">
        {isActive ? (
          <Button disabled className="w-full text-xs" variant="outline">
            Current Plan
          </Button>
        ) : isUpgrade ? (
          <Button
            onClick={() => onSelect(plan)}
            disabled={loading}
            className="w-full text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
          >
            <ArrowUpCircle className="h-3.5 w-3.5" />
            Upgrade to {plan.name}
          </Button>
        ) : (
          <Button
            onClick={() => onSelect(plan)}
            disabled={loading}
            variant="outline"
            className="w-full text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowDownCircle className="h-3.5 w-3.5" />
            Downgrade to {plan.name}
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Usage bar
// ---------------------------------------------------------------------------
function UsageBar({ label, used, limit, icon }: { label: string; used: number; limit: number; icon: React.ReactNode }) {
  const p = pct(used, limit);
  const isUnlimited = limit <= 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-xs font-mono text-foreground">
          {isUnlimited ? "Unlimited" : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${usageColor(p)}`}
            style={{ width: `${p}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm modal
// ---------------------------------------------------------------------------
function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <h2 className="font-bold text-foreground text-base">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={confirmVariant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className={confirmVariant !== "destructive" ? "bg-indigo-600 hover:bg-indigo-500 text-white" : ""}
          >
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [data, setData] = React.useState<BillingOverviewResult | null>(null);

  // UI state
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "annual">("monthly");
  const [selectedCountry, setSelectedCountry] = React.useState("ZA");
  const [countryOpen, setCountryOpen] = React.useState(false);

  // Modal state
  const [confirmModal, setConfirmModal] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant?: "default" | "destructive";
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", confirmLabel: "Confirm", onConfirm: () => {} });

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const res = await getBillingOverviewActionByToken(token, selectedCountry);
      setData(res);
    } catch (e) {
      console.error("Billing load error:", e);
      toast({ title: "Error", description: "Could not load billing info.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast, selectedCountry]);

  React.useEffect(() => { load(); }, [load]);

  const closeModal = () => setConfirmModal((m) => ({ ...m, open: false }));

  // --- Change plan ---
  const handlePlanSelect = (plan: BillingPlan) => {
    const isUpgrade = (plan.name.toLowerCase() === "pro" || plan.name.toLowerCase() === "enterprise");
    const planPrice = Number(plan.price) || 0;
    const planCurrency = plan.currency || 'ZAR';
    const priceLabel = billingCycle === "annual"
      ? formatCurrency(Math.round(planPrice * 0.8), planCurrency) + "/mo (billed annually)"
      : planPrice === 0 ? "Free" : formatCurrency(planPrice, planCurrency) + "/mo";

    setConfirmModal({
      open: true,
      title: isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`,
      description: isUpgrade
        ? `You'll be switched to the ${plan.name} plan at ${priceLabel}. Your access to all new features will be activated immediately.`
        : `You'll be downgraded to ${plan.name}. Some features will be disabled at the end of your current billing period.`,
      confirmLabel: isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const token = await user!.getIdToken(true);
          const res = await changeSubscriptionPlanActionByToken(token, plan.id, billingCycle);
          if (res.success) {
            toast({ title: "Plan updated!", description: res.message });
            await load();
          } else {
            toast({ title: "Error", description: res.message, variant: "destructive" });
          }
        } catch (e: any) {
          toast({ title: "Error", description: e?.message || "Failed to change plan.", variant: "destructive" });
        } finally {
          setActionLoading(false);
          closeModal();
        }
      },
    });
  };

  // --- Cancel ---
  const handleCancel = () => {
    setConfirmModal({
      open: true,
      title: "Cancel Subscription",
      description: "Your subscription will remain active until the end of the current billing period. After that, you'll be downgraded to Starter (free). Are you sure?",
      confirmLabel: "Cancel Subscription",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const token = await user!.getIdToken(true);
          const res = await cancelSubscriptionActionByToken(token);
          if (res.success) {
            toast({ title: "Cancellation scheduled", description: res.message });
            await load();
          } else {
            toast({ title: "Error", description: res.message, variant: "destructive" });
          }
        } catch (e: any) {
          toast({ title: "Error", description: e?.message, variant: "destructive" });
        } finally {
          setActionLoading(false);
          closeModal();
        }
      },
    });
  };

  // --- Resume ---
  const handleResume = async () => {
    setActionLoading(true);
    try {
      const token = await user!.getIdToken(true);
      const res = await resumeSubscriptionActionByToken(token);
      if (res.success) {
        toast({ title: "Subscription resumed!", description: res.message });
        await load();
      } else {
        toast({ title: "Error", description: res.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const sub = data?.subscription;
  const plans = data?.available_plans || [];
  const invoices = data?.invoices || [];
  const usage = data?.usage;

  const activeTierLevel = sub?.plan_tier === "enterprise" ? 2 : sub?.plan_tier === "pro" ? 1 : 0;
  const country = SOUTHERN_AFRICAN_COUNTRIES.find((c) => c.code === selectedCountry);

  const statusBadge = sub?.cancel_at_period_end
    ? { label: "Cancels " + formatDate(sub.current_period_end), cls: "bg-amber-500/15 text-amber-400 border border-amber-500/30" }
    : sub?.status === "active"
    ? { label: "Active", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" }
    : { label: sub?.status || "—", cls: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30" };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SalesProSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SalesProHeader title="Billing & Subscription" onOpenCommandPalette={() => setCommandOpen(true)} />
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

          {/* ── Header Banner ── */}
          <div className="rounded-2xl border border-border/30 bg-gradient-to-r from-indigo-950/60 via-card to-purple-950/40 p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">Billing & Subscription</h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${TIER_META[sub?.plan_tier || "starter"]?.badge || ""}`}>
                    {sub?.plan?.name || "Starter"}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
                    {statusBadge.label}
                  </span>
                </div>
                {sub && !sub.cancel_at_period_end && (
                  <p className="text-xs text-muted-foreground">
                    Renews <strong className="text-foreground">{formatDate(sub.current_period_end)}</strong>
                    {sub.price_paid > 0 && (
                      <> · {formatCurrency(sub.price_paid, sub.currency)}/mo ({sub.billing_cycle})</>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Billing cycle toggle */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${billingCycle === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${billingCycle === "annual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    Annual
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">-20%</span>
                  </button>
                </div>

                {/* Country selector */}
                <div className="relative">
                  <button
                    onClick={() => setCountryOpen(!countryOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-card text-xs text-muted-foreground hover:text-foreground hover:border-border transition-all"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {country?.name || "South Africa"} · {country?.currency || "ZAR"}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {countryOpen && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                      {SOUTHERN_AFRICAN_COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => { setSelectedCountry(c.code); setCountryOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between ${selectedCountry === c.code ? "text-indigo-400 bg-indigo-500/5" : "text-muted-foreground"}`}
                        >
                          <span>{c.name}</span>
                          <span className="text-muted-foreground/60">{c.currency_symbol}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Cancellation alert ── */}
          {sub?.cancel_at_period_end && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-300">Subscription scheduled for cancellation</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your access continues until <strong>{formatDate(sub.current_period_end)}</strong>. You can resume at any time before then.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleResume} disabled={actionLoading} className="shrink-0 text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                <RefreshCcw className="h-3 w-3" />
                Resume
              </Button>
            </div>
          )}

          {/* ── Pricing Cards ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-border/20 bg-card h-72 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isActive={sub?.plan_tier === plan.name.toLowerCase()}
                  billingCycle={billingCycle}
                  activeTierLevel={activeTierLevel}
                  onSelect={handlePlanSelect}
                  loading={actionLoading}
                />
              ))}
            </div>
          )}

          {/* ── Usage & Controls row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Resource Usage */}
            <div className="lg:col-span-2">
              <Card className="p-5 space-y-5 rounded-2xl border-border/30">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm text-foreground">Resource Usage</h2>
                  <span className="text-[10px] text-muted-foreground">
                    {MONTH_NAMES[(usage?.period_month || 1) - 1]} {usage?.period_year}
                  </span>
                </div>
                {usage ? (
                  <div className="space-y-4">
                    <UsageBar
                      label="Lead Lookups"
                      used={usage.lead_lookups_used}
                      limit={usage.lead_lookups_limit}
                      icon={<TrendingUp className="h-3.5 w-3.5" />}
                    />
                    <UsageBar
                      label="AI Credits"
                      used={usage.ai_credits_used}
                      limit={usage.ai_credits_limit}
                      icon={<Cpu className="h-3.5 w-3.5" />}
                    />
                    <UsageBar
                      label="Team Seats"
                      used={usage.team_seats_used}
                      limit={usage.team_seats_limit}
                      icon={<Users className="h-3.5 w-3.5" />}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No usage data for this period.</p>
                )}
              </Card>
            </div>

            {/* Subscription controls */}
            <div className="space-y-3">
              <Card className="p-5 rounded-2xl border-border/30 space-y-4">
                <h2 className="font-semibold text-sm text-foreground">Subscription</h2>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Plan</span>
                    <span className="text-foreground font-medium">{sub?.plan?.name || "Starter"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing cycle</span>
                    <span className="text-foreground font-medium capitalize">{sub?.billing_cycle || "monthly"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period start</span>
                    <span className="text-foreground font-medium">{formatDate(sub?.current_period_start)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period end</span>
                    <span className="text-foreground font-medium">{formatDate(sub?.current_period_end)}</span>
                  </div>
                </div>
                {sub && !sub.cancel_at_period_end && sub.plan_tier !== "starter" && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full text-xs text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-1.5 pt-1 border-t border-border/30 mt-2"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel subscription
                  </button>
                )}
              </Card>

              <Card className="p-5 rounded-2xl border-border/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-400" />
                  <h2 className="font-semibold text-sm text-foreground">Secure Payments</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Payments are processed securely via PayPal. We never store card details.
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono">VISA</span>
                  <span className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono">MC</span>
                  <span className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono">PayPal</span>
                </div>
              </Card>
            </div>
          </div>

          {/* ── Invoice History ── */}
          <Card className="rounded-2xl border-border/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/20 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-foreground">Invoice History</h2>
              {invoices.length > 0 && (
                <span className="text-xs text-muted-foreground">{invoices.length} invoice{invoices.length > 1 ? "s" : ""}</span>
              )}
            </div>
            {invoices.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                {loading ? "Loading invoices…" : "No invoices yet. Invoices will appear here after your first billing event."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/20 bg-muted/30">
                      <th className="text-left px-5 py-3 text-muted-foreground font-medium">Date</th>
                      <th className="text-left px-3 py-3 text-muted-foreground font-medium">Invoice #</th>
                      <th className="text-left px-3 py-3 text-muted-foreground font-medium">Plan</th>
                      <th className="text-left px-3 py-3 text-muted-foreground font-medium">Amount</th>
                      <th className="text-left px-3 py-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-right px-5 py-3 text-muted-foreground font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3 text-muted-foreground">{formatDate(inv.created_at)}</td>
                        <td className="px-3 py-3 font-mono text-foreground">{inv.invoice_number}</td>
                        <td className="px-3 py-3 text-foreground">{inv.plan_name}</td>
                        <td className="px-3 py-3 font-semibold text-foreground">{formatCurrency(inv.amount, inv.currency)}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            inv.status === "paid" || inv.status === "free"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : inv.status === "pending"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {inv.receipt_url ? (
                            <a href={inv.receipt_url} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
                                <Download className="h-3 w-3" />
                                PDF
                              </Button>
                            </a>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => window.print()}
                            >
                              <Download className="h-3 w-3" />
                              Print
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeModal}
        loading={actionLoading}
      />
    </div>
  );
}
