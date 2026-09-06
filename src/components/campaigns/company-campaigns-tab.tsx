"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Rocket } from "lucide-react";
import { CampaignCard } from "@/app/campaigns/_components/campaign-card";
import { CampaignBuilderModal } from "@/app/campaigns/_components/campaign-builder-modal";
import { CampaignDetailsModal } from "@/components/campaigns/campaign-details-modal";
import * as campaignServices from "@/services/private/campaignServices";
import { prepareCampaignForDuplication } from "@/lib/campaign-utils";
import type { Campaign, CampaignStatus } from "@/lib/types";

export interface CompanyCampaignsTabProps {
  orgId: string | number;
  orgName: string;
  campaigns: Campaign[];
  onStatusChange?: (id: string | number, status: CampaignStatus) => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
  onCampaignsChange?: (campaigns: Campaign[]) => void;
}

export function CompanyCampaignsTab({
  orgId,
  orgName,
  campaigns,
  onStatusChange,
  onRefresh,
  onCampaignsChange,
}: CompanyCampaignsTabProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<CampaignStatus | "all">("all");

  // Modal states
  const [viewModalOpen, setViewModalOpen] = React.useState(false);
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = React.useState<Campaign | null>(null);
  const [builderOpen, setBuilderOpen] = React.useState(false);

  const reloadCampaigns = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      const updated = await campaignServices.getCampaignsActionByToken(token, { orgId });
      if (onCampaignsChange) {
        onCampaignsChange(updated || []);
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Failed to reload company campaigns:", err);
    }
  };

  const handleView = (c: Campaign) => {
    setSelectedCampaign(c);
    setViewModalOpen(true);
  };

  const handleEdit = (c: Campaign) => {
    setEditingCampaign(c);
    setBuilderOpen(true);
  };

  const handleDuplicate = (c: Campaign) => {
    const duplicated = prepareCampaignForDuplication(c);
    setEditingCampaign(duplicated);
    setViewModalOpen(false);
    setSelectedCampaign(null);
    setBuilderOpen(true);
    toast({
      title: "Duplicating Campaign",
      description: `Loaded "${c.name} (Copy)" into campaign builder. You can customize messaging or details before saving.`,
    });
  };

  const handleDelete = async (c: Campaign) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      await campaignServices.deleteCampaignActionByToken(token, c.id);
      toast({
        title: "Campaign Deleted",
        description: `"${c.name}" has been permanently removed.`,
      });
      await reloadCampaigns();
    } catch (e: any) {
      console.error("Failed to delete campaign:", e);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: e?.message || "Could not delete campaign.",
      });
    }
  };

  const handleSaveCampaign = async (input: Partial<Campaign>, existingId?: string | number) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      if (existingId) {
        await campaignServices.updateCampaignActionByToken(token, existingId, input);
        toast({
          title: "Campaign Updated",
          description: `"${input.name}" has been updated successfully.`,
        });
      } else {
        await campaignServices.createCampaignActionByToken(token, {
          ...input,
          target_organization_id: Number(orgId),
        });
        toast({
          title: "Campaign Created",
          description: `"${input.name}" has been created.`,
        });
      }
      setEditingCampaign(null);
      await reloadCampaigns();
    } catch (e: any) {
      console.error("Failed to save campaign:", e);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: e?.message || "Could not save campaign.",
      });
    }
  };

  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, statusFilter, search]);

  const totalContacts = campaigns.reduce((s, c) => s + (c.total_contacts || 0), 0);
  const totalMeetings = campaigns.reduce((s, c) => s + (c.meetings_booked || 0), 0);
  const avgOpenRate = campaigns.length
    ? Math.round(campaigns.reduce((s, c) => s + (c.open_rate || 0), 0) / campaigns.length)
    : 0;
  const avgReplyRate = campaigns.length
    ? Math.round(campaigns.reduce((s, c) => s + (c.reply_rate || 0), 0) / campaigns.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* 1. Summary Stats (same design as Campaigns page) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Company Campaigns", value: campaigns.length, color: "text-foreground" },
          { label: "Contacts Enrolled", value: totalContacts, color: "text-indigo-300" },
          { label: "Avg Open Rate", value: `${avgOpenRate}%`, color: "text-emerald-400" },
          { label: "Meetings Booked", value: totalMeetings, color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-card p-4 text-center border-border/50">
            <div className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* 2. Controls & Filter Bar (same design as Campaigns page) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-xl backdrop-blur-xl border border-border/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search campaigns targeting ${orgName}...`}
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
          onClick={() => router.push(`/ai-messaging?org_id=${orgId}`)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 font-semibold h-9 shrink-0 shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" /> Launch AI Campaign
        </Button>
      </div>

      {/* 3. Campaign Cards List (same reusable CampaignCard with View/Edit/Copy/Delete) */}
      <div className="space-y-4">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onStatusChange={onStatusChange}
              onView={handleView}
              onEdit={handleEdit}
              onCopy={handleDuplicate}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="p-16 text-center border border-dashed border-border/40 rounded-xl space-y-3 bg-card/40">
            <Rocket className="h-8 w-8 mx-auto text-muted-foreground/30" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">
                {campaigns.length === 0
                  ? `No campaigns targeting ${orgName} yet.`
                  : "No campaigns match your filter criteria."}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Generate an AI-personalized multi-touch sequence tailored specifically to decision makers at {orgName}.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push(`/ai-messaging?org_id=${orgId}`)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Launch First Campaign for {orgName}
            </Button>
          </div>
        )}
      </div>

      {/* Modals for View & Edit */}
      <CampaignDetailsModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        onEdit={handleEdit}
        onCopy={handleDuplicate}
      />

      <CampaignBuilderModal
        open={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditingCampaign(null);
        }}
        initialCampaign={editingCampaign}
        onSave={handleSaveCampaign}
      />
    </div>
  );
}
