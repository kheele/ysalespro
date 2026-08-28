"use client";

import * as React from "react";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  getCampaignsActionByToken,
  createCampaignActionByToken,
  updateCampaignStatusActionByToken,
} from "@/services/private/campaignServices";
import type {
  Campaign,
  CampaignStatus,
} from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Rocket } from "lucide-react";
import { CampaignCard, CampaignBuilderModal } from "./_components";

export default function CampaignsPage() {
  const { user } = useAuth();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<CampaignStatus | "all">("all");
  const [builderOpen, setBuilderOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const data = await getCampaignsActionByToken(token, { search, status: statusFilter });
      setCampaigns(data || []);
    } catch (e) {
      console.error("Failed to load campaigns:", e);
    } finally {
      setLoading(false);
    }
  }, [user, search, statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (input: Partial<Campaign>) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await createCampaignActionByToken(token, input);
      load();
    } catch (e) {
      console.error("Failed to create campaign:", e);
    }
  };

  const handleStatusChange = async (id: string | number, status: CampaignStatus) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await updateCampaignStatusActionByToken(token, id, status);
      load();
    } catch (e) {
      console.error("Failed to update campaign status:", e);
    }
  };

  const totalContacts = campaigns.reduce((s, c) => s + (c.total_contacts || 0), 0);
  const totalMeetings = campaigns.reduce((s, c) => s + (c.meetings_booked || 0), 0);
  const avgOpenRate = campaigns.length
    ? Math.round(campaigns.reduce((s, c) => s + (c.open_rate || 0), 0) / campaigns.length)
    : 0;
  const avgReplyRate = campaigns.length
    ? Math.round(campaigns.reduce((s, c) => s + (c.reply_rate || 0), 0) / campaigns.length)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="Email Campaigns"
          subtitle="Build multi-step sequences with audience targeting, day-based scheduling, and automation rules"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />
        <main className="flex-1 p-6 space-y-5 w-full mx-auto overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Campaigns", value: campaigns.length, color: "text-foreground" },
              { label: "Contacts Enrolled", value: totalContacts, color: "text-indigo-300" },
              { label: "Avg Open Rate", value: `${avgOpenRate}%`, color: "text-emerald-400" },
              { label: "Meetings Booked", value: totalMeetings, color: "text-purple-400" },
            ].map((s) => (
              <Card key={s.label} className="bg-card p-4 text-center">
                <div className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl backdrop-blur-xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 border-border/60 text-xs h-9"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              {(["all", "Active", "Draft", "Paused", "Completed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as CampaignStatus | "all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    statusFilter === s
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => setBuilderOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold h-9 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> New Campaign
            </Button>
          </div>

          {/* Campaign List */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-card/40 border border-border/40 rounded-xl animate-pulse"
                />
              ))
            ) : campaigns.length > 0 ? (
              campaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} onStatusChange={handleStatusChange} />
              ))
            ) : (
              <div className="p-16 text-center border border-dashed border-border/40 rounded-xl space-y-3">
                <Rocket className="h-8 w-8 mx-auto text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">
                  No campaigns yet. Build your first sequence.
                </p>
                <Button
                  size="sm"
                  onClick={() => setBuilderOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Create First Campaign
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <CampaignBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSave={handleSave}
      />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
