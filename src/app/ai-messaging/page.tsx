"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { SalesProSidebar } from "@/components/layout/salespro-sidebar";
import { SalesProHeader } from "@/components/layout/salespro-header";
import { CommandPalette } from "@/components/layout/command-palette";
import * as aiMessageServices from "@/services/private/aiMessageServices";
import { getDecisionMakers, getDecisionMakerById } from "@/services/public/peopleServices";
import { getOrganizations, getOrganizationById } from "@/services/public/organizationServices";
import { getIndustries } from "@/services/public/industryServices";
import { useAuth } from "@/hooks/use-auth";
import {
  sendEmailOutreachActionByToken,
  sendLinkedInOutreachActionByToken,
} from "@/services/private/senderDispatchService";
import { getConnectedAccountsActionByToken } from "@/services/private/connectedAccountsService";
import { createCampaignActionByToken } from "@/services/private/campaignServices";
import type {
  PersonContext,
  CompanyContext,
  GeneratedMessage,
  MessageGenerationResult,
  DecisionMaker,
  Organization,
  ConnectedAccount,
  DispatchResult,
  OutreachOfferContext,
  Campaign,
  CampaignSchedule,
  SequenceStep,
  SequenceStepType,
} from "@/lib/types";
import type { OptimizeSequenceOutput } from "@/ai/schemas/sequence-optimizer";

import { ContextForm } from "./_components/context-form";
import { FILTERS, GeneratedMessages } from "./_components/generated-messages";
import { SequenceCopilotModal } from "./_components/sequence-copilot-modal";
import { DispatchModal } from "./_components/dispatch-modal";
import { SaveCampaignModal } from "./_components/save-campaign-modal";

function AiMessagingContent() {
  const { user, dbUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [result, setResult] = React.useState<MessageGenerationResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState(0);
  const [editableMessages, setEditableMessages] = React.useState<GeneratedMessage[]>([]);
  const [painPoints, setPainPoints] = React.useState<string[]>([]);

  // Product & Offer Directive State
  const [offer, setOffer] = React.useState<OutreachOfferContext>({
    product_service: "",
    value_proposition: "",
    call_to_action: "",
  });
  const [savingCampaign, setSavingCampaign] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);

  // AI Sequence Copilot State
  const [optimizingSeq, setOptimizingSeq] = React.useState(false);
  const [optimizeModalOpen, setOptimizeModalOpen] = React.useState(false);
  const [optimizeResult, setOptimizeResult] = React.useState<OptimizeSequenceOutput | null>(null);

  // Campaign Save Modal State
  const [saveCampaignModalOpen, setSaveCampaignModalOpen] = React.useState(false);
  const [targetSaveStatus, setTargetSaveStatus] = React.useState<"Active" | "Draft">("Active");

  const handleOptimizeCurrentSequence = async () => {
    setOptimizingSeq(true);
    try {
      const emailSteps = [
        {
          step_number: 1,
          day: 1,
          type: "Introduction",
          subject: editableMessages.find((m) => m.type === "email_subject")?.content || `Quick question — ${company.name || "partnership"}`,
          body: editableMessages.find((m) => m.type === "initial_email")?.content || "",
        },
        {
          step_number: 2,
          day: 3,
          type: "Follow-up",
          subject: `Re: ${company.name || "Quick question"}`,
          body: editableMessages.find((m) => m.type === "followup_1")?.content || "",
        },
        {
          step_number: 3,
          day: 7,
          type: "Case Study",
          subject: `Case Study for ${company.name || "your team"}`,
          body: editableMessages.find((m) => m.type === "followup_2")?.content || "",
        },
        {
          step_number: 4,
          day: 14,
          type: "Final Message",
          subject: `Closing the loop — ${company.name || ""}`,
          body: editableMessages.find((m) => m.type === "final")?.content || "",
        },
      ].filter((s) => s.body.trim().length > 0);

      const res = await aiMessageServices.optimizeCampaignSequenceAction({
        campaign_name: `${company.name || "Target Account"} Outreach Sequence`,
        industry: company.industry || "",
        target_audience: `${person.seniority || "Executive"} Leader${person.department ? " in " + person.department : ""}`,
        current_steps: emailSteps,
      });
      setOptimizeResult(res);
      setOptimizeModalOpen(true);
    } catch (err) {
      console.error("Sequence Copilot optimization failed:", err);
    } finally {
      setOptimizingSeq(false);
    }
  };

  // Outbound Dispatch State
  const [connectedAccounts, setConnectedAccounts] = React.useState<ConnectedAccount[]>([]);
  const [dispatchModalOpen, setDispatchModalOpen] = React.useState(false);
  const [dispatchChannel, setDispatchChannel] = React.useState<"Email" | "LinkedIn">("Email");
  const [dispatchRecipientEmail, setDispatchRecipientEmail] = React.useState("");
  const [dispatchRecipientName, setDispatchRecipientName] = React.useState("");
  const [dispatchRecipientLinkedin, setDispatchRecipientLinkedin] = React.useState("");
  const [dispatchRecipientTitle, setDispatchRecipientTitle] = React.useState("");
  const [dispatchRecipientOrg, setDispatchRecipientOrg] = React.useState("");
  const [dispatchSubject, setDispatchSubject] = React.useState("");
  const [dispatchBody, setDispatchBody] = React.useState("");
  const [dispatchAccountId, setDispatchAccountId] = React.useState("");
  const [dispatching, setDispatching] = React.useState(false);
  const [dispatchResult, setDispatchResult] = React.useState<DispatchResult | null>(null);

  const loadConnectedAccounts = React.useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      const accs = await getConnectedAccountsActionByToken(token);
      setConnectedAccounts(accs || []);
    } catch (e) {
      console.error("Failed to load connected accounts for messaging:", e);
    }
  }, [user]);

  React.useEffect(() => {
    loadConnectedAccounts();
  }, [loadConnectedAccounts]);

  const handleOpenDispatch = (msg: GeneratedMessage) => {
    setDispatchResult(null);
    const selectedP = people.find(p => String(p.id) === String(selectedPersonId));
    const recipientEmail = selectedP?.email || (person.fname ? `${person.fname.toLowerCase()}@${company.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || "company"}.com` : "");
    const recipientName = person.full_name || `${person.fname || ""} ${person.lname || ""}`.trim() || "Decision Maker";
    const recipientLinkedin = selectedP?.linkedin_url || `https://linkedin.com/in/${recipientName.toLowerCase().replace(/\s+/g, '-')}`;

    if (msg.type === "linkedin") {
      setDispatchChannel("LinkedIn");
      setDispatchRecipientName(recipientName);
      setDispatchRecipientLinkedin(recipientLinkedin);
      setDispatchRecipientTitle(person.title || "");
      setDispatchRecipientOrg(company.name || "");
      setDispatchSubject("LinkedIn Message");
      setDispatchBody(msg.content);
      const defLi = connectedAccounts.find(a => a.channel === "LinkedIn" && a.is_default && a.is_active) || connectedAccounts.find(a => a.channel === "LinkedIn" && a.is_active);
      setDispatchAccountId(defLi ? String(defLi.id) : "");
    } else {
      setDispatchChannel("Email");
      setDispatchRecipientEmail(recipientEmail);
      setDispatchRecipientName(recipientName);
      setDispatchRecipientTitle(person.title || "");
      setDispatchRecipientOrg(company.name || "");
      const subjectMsg = editableMessages.find(m => m.type === "email_subject");
      setDispatchSubject(msg.subject || subjectMsg?.content || `Quick question — ${company.name || "partnership"}`);
      setDispatchBody(msg.content);
      const defEmail = connectedAccounts.find(a => a.channel === "Email" && a.is_default && a.is_active) || connectedAccounts.find(a => a.channel === "Email" && a.is_active);
      setDispatchAccountId(defEmail ? String(defEmail.id) : "");
    }
    setDispatchModalOpen(true);
  };

  const handleExecuteDispatch = async () => {
    if (!user) return;
    setDispatching(true);
    setDispatchResult(null);
    try {
      const token = await user.getIdToken(true);
      if (dispatchChannel === "Email") {
        const res = await sendEmailOutreachActionByToken(token, {
          to: dispatchRecipientEmail,
          to_name: dispatchRecipientName,
          subject: dispatchSubject,
          text: dispatchBody,
          account_id: dispatchAccountId || undefined,
          lead_id: selectedPersonId ? Number(selectedPersonId) : undefined,
        });
        setDispatchResult(res);
      } else {
        const res = await sendLinkedInOutreachActionByToken(token, {
          recipient_name: dispatchRecipientName,
          recipient_title: dispatchRecipientTitle,
          recipient_org: dispatchRecipientOrg,
          recipient_profile_url: dispatchRecipientLinkedin,
          message: dispatchBody,
          account_id: dispatchAccountId || undefined,
          lead_id: selectedPersonId ? Number(selectedPersonId) : undefined,
        });
        setDispatchResult(res);
      }
    } catch (err: any) {
      setDispatchResult({
        success: false,
        channel: dispatchChannel,
        recipient: dispatchChannel === "Email" ? dispatchRecipientEmail : dispatchRecipientName,
        status: "Failed",
        error: err?.message || "Outbound dispatch failed.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setDispatching(false);
    }
  };

  // Real Database Records
  const [people, setPeople] = React.useState<DecisionMaker[]>([]);
  const [companies, setCompanies] = React.useState<Organization[]>([]);
  const [industryList, setIndustryList] = React.useState<string[]>([]);
  const [, setLoadingDb] = React.useState(true);

  // Selected entities
  const [selectedPersonId, setSelectedPersonId] = React.useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("");

  const [person, setPerson] = React.useState<Partial<PersonContext>>({
    fname: "",
    lname: "",
    full_name: "",
    title: "",
    department: "",
    seniority: "",
  });

  const [company, setCompany] = React.useState<Partial<CompanyContext>>({
    name: "",
    industry: "",
    size: "",
    location: "",
    country: "",
    recent_news: "",
    challenges: [],
  });

  const [senderName, setSenderName] = React.useState("");
  const [senderTitle, setSenderTitle] = React.useState("");

  // Sync authenticated user profile as sender
  React.useEffect(() => {
    if (dbUser || user) {
      const fullName = dbUser?.fname || dbUser?.lname
        ? `${dbUser?.fname || ""} ${dbUser?.lname || ""}`.trim()
        : user?.displayName || "";
      const companyName = dbUser?.account_company?.name || "";
      const role = dbUser?.role || "Sales Representative";
      const title = companyName ? `${role}, ${companyName}` : role;

      if (fullName) setSenderName(fullName);
      if (title) setSenderTitle(title);
    }
  }, [user, dbUser]);

  const applyPersonData = React.useCallback((p: DecisionMaker) => {
    setSelectedPersonId(String(p.id));
    setPeople((prev) => (prev.some((item) => String(item.id) === String(p.id)) ? prev : [p, ...prev]));
    const names = (p.name || "").trim().split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";
    setPerson({
      fname: firstName,
      lname: lastName,
      full_name: p.name || "",
      title: p.job_title || p.title || "Executive",
      department: p.department || "Operations",
      seniority: (["C-Suite", "VP", "Director", "Manager", "Individual Contributor"].includes(p.seniority || "")
        ? (p.seniority as any)
        : "VP"),
    });

    if (p.company_name || p.company?.name) {
      const compName = p.company_name || p.company?.name || "";
      const compInd = p.industry || p.company?.primary_industry || "";
      const compLoc = p.location || p.city || p.country || "";
      setCompany(c => ({
        ...c,
        name: compName || c.name || "",
        industry: compInd || c.industry || "Technology",
        location: compLoc || c.location || "",
        country: p.country || c.country || "",
      }));
    }
  }, []);

  const applyCompanyData = React.useCallback((org: Organization) => {
    setSelectedCompanyId(String(org.id));
    setCompanies((prev) => (prev.some((item) => String(item.id) === String(org.id)) ? prev : [org, ...prev]));
    const employees = org.estimated_num_employees || org.employee_count || 0;
    const size: CompanyContext["size"] = employees >= 1000
      ? "Enterprise (1000+)"
      : employees >= 250
        ? "Mid-Market (250-1000)"
        : employees >= 50
          ? "SMB (50-250)"
          : "Startup (<50)";

    const loc = [org.city, org.state, org.country].filter(Boolean).join(", ") || org.headquarters_location || org.location || "";

    setCompany({
      name: org.name || "",
      industry: org.primary_industry || org.industry || "Technology",
      size,
      location: loc,
      country: org.country || "",
      recent_news: org.intent_signal_account || (org.show_intent ? `High buying intent detected (${org.intent_strength || "Strong"} signal)` : ""),
      challenges: (org.keywords_list || []).map(k => k.keyword?.name || (typeof k === "string" ? k : "")).filter(Boolean) as string[],
    });
  }, []);

  // Fetch real data from Hasura GraphQL backend
  React.useEffect(() => {
    async function loadRealData() {
      setLoadingDb(true);
      try {
        const indRes = await getIndustries({ limit: 60 }).catch(() => null);
        if (indRes?.industries?.length) {
          setIndustryList(indRes.industries.map((i) => i.name).filter(Boolean));
        }

        const paramPersonId = searchParams?.get("person_id");
        const paramOrgId = searchParams?.get("org_id");

        if (paramPersonId) {
          let matchPerson = await getDecisionMakerById(paramPersonId).catch(() => null);
          if (matchPerson) {
            applyPersonData(matchPerson);
            // Also link and populate their company context if available
            const compId = matchPerson.company_id || matchPerson.company?.id;
            if (compId) {
              const linkedOrg = await getOrganizationById(compId).catch(() => null);
              if (linkedOrg) {
                applyCompanyData(linkedOrg);
              }
            }
          }
        } else if (paramOrgId) {
          let matchOrg = await getOrganizationById(paramOrgId).catch(() => null);
          if (matchOrg) {
            applyCompanyData(matchOrg);
            // Look for any decision maker associated with this organization
            const dmRes = await getDecisionMakers({ company_id: matchOrg.id, limit: 1 }).catch(() => null);
            if (dmRes?.people?.length) {
              applyPersonData(dmRes.people[0]);
              // Ensure company data remains cleanly applied with the rich org details
              applyCompanyData(matchOrg);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load real data for AI messaging:", err);
      } finally {
        setLoadingDb(false);
      }
    }
    loadRealData();
  }, [searchParams, applyPersonData, applyCompanyData]);

  // Load real industry pain points dynamically
  React.useEffect(() => {
    if (company.industry) {
      aiMessageServices.getIndustryPainPoints(company.industry)
        .then((pts: string[]) => setPainPoints(Array.isArray(pts) ? pts : []))
        .catch(() => setPainPoints([]));
    }
  }, [company.industry]);

  const handleGenerate = async () => {
    if (!person.fname || !company.name) return;
    setLoading(true);
    const fullPerson: PersonContext = {
      fname: person.fname || "",
      lname: person.lname || "",
      full_name: person.full_name || `${person.fname} ${person.lname}`.trim(),
      title: person.title || "Decision Maker",
      department: person.department || "Operations",
      seniority: person.seniority || "VP",
    };
    const fullCompany: CompanyContext = {
      name: company.name || "",
      industry: company.industry || "Technology",
      size: company.size || "Mid-Market (250-1000)",
      location: company.location || "",
      country: company.country || "",
      recent_news: company.recent_news,
      challenges: company.challenges,
    };
    try {
      const res = await aiMessageServices.generateMessages(
        fullPerson,
        fullCompany,
        senderName || "Sales Executive",
        senderTitle || "Enterprise Account Executive",
        offer
      );
      setResult(res);
      setEditableMessages(res.messages);
    } catch (err: any) {
      console.error("AI Outreach generation failed:", err);
      toast({
        variant: "destructive",
        title: "Service Currently Unavailable",
        description: err?.message || "The AI generation service is currently not available. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSequenceStepsFromMessages = React.useCallback((): SequenceStep[] => {
    const subjectMsg = editableMessages.find((m) => m.type === "email_subject");
    const initialMsg = editableMessages.find((m) => m.type === "initial_email");
    const follow1Msg = editableMessages.find((m) => m.type === "followup_1");
    const follow2Msg = editableMessages.find((m) => m.type === "followup_2");
    const finalMsg = editableMessages.find((m) => m.type === "final");

    const defaultSubject =
      subjectMsg?.subject ||
      subjectMsg?.content?.split("\n")[0]?.replace(/^\d+\.\s*/, "") ||
      (initialMsg?.subject || `Quick question for ${person.fname || company.name || "your team"}`);

    return [
      {
        day: 1,
        step_number: 1,
        type: "Email" as SequenceStepType,
        subject: initialMsg?.subject || defaultSubject,
        body: initialMsg?.content || "",
        enabled: true,
      },
      {
        day: 3,
        step_number: 2,
        type: "Follow-up" as SequenceStepType,
        subject: follow1Msg?.subject || `Re: ${defaultSubject}`,
        body: follow1Msg?.content || "",
        enabled: true,
      },
      {
        day: 7,
        step_number: 3,
        type: "Case Study" as SequenceStepType,
        subject: follow2Msg?.subject || `Case study for ${company.name || "your team"}`,
        body: follow2Msg?.content || "",
        enabled: true,
      },
      {
        day: 14,
        step_number: 4,
        type: "Final Message" as SequenceStepType,
        subject: finalMsg?.subject || `Closing the loop — ${company.name || ""}`,
        body: finalMsg?.content || "",
        enabled: true,
      },
    ].filter((s) => s.body && s.body.trim().length > 0) as SequenceStep[];
  }, [editableMessages, person, company]);

  const handleSaveCampaign = (status: "Active" | "Draft") => {
    if (!editableMessages.length) {
      toast({
        variant: "destructive",
        title: "No Messages Generated",
        description: `Please generate an outreach sequence first before saving as a campaign ${status === "Draft" ? "draft" : ""}.`,
      });
      return;
    }
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to save campaigns to your workspace.",
      });
      return;
    }

    setTargetSaveStatus(status);
    setSaveCampaignModalOpen(true);
  };

  const handleConfirmSaveCampaign = async (data: {
    title: string;
    schedule: CampaignSchedule;
    status: "Active" | "Draft";
  }) => {
    if (!user) return;
    const { title, schedule, status } = data;

    if (status === "Active") {
      setSavingCampaign(true);
    } else {
      setSavingDraft(true);
    }

    try {
      const token = await user.getIdToken(true);
      const sequenceSteps = getSequenceStepsFromMessages();

      const campaignPayload: Partial<Campaign> = {
        name: title,
        target_organization_id: selectedCompanyId ? Number(selectedCompanyId) : undefined,
        description: `Multi-touch AI outreach targeting ${person.full_name || person.fname || "decision makers"} at ${company.name || "target accounts"}. Offering: ${offer.product_service || "B2B Solutions"}${offer.value_proposition ? " — " + offer.value_proposition : ""}`,
        status,
        sequence: sequenceSteps,
        schedule,
        start_date: schedule.start_date || new Date().toISOString().split("T")[0],
        target_companies_count: 1,
        target_people_count: 1,
        total_contacts: 1,
        audience: {
          industries: [],
          companies: company.name ? [company.name] : [],
          people: person.full_name ? [person.full_name] : (person.fname ? [`${person.fname} ${person.lname || ""}`.trim()] : []),
          estimated_contacts: 1,
        },
        rules: {
          stop_on_reply: true,
          stop_on_meeting_booked: true,
          update_lead_status: true,
          create_follow_up_task: true,
          exclude_customers: true,
          exclude_competitors: true,
          track_opens: true,
        },
      };

      await createCampaignActionByToken(token, campaignPayload);

      setSaveCampaignModalOpen(false);

      if (status === "Active") {
        toast({
          title: "🚀 Campaign Launched Successfully!",
          description: `"${title}" is now live in your Campaigns dashboard with ${sequenceSteps.length} sequence steps.`,
        });
      } else {
        toast({
          title: "📝 Campaign Draft Saved!",
          description: `"${title}" has been saved to your Campaigns dashboard as a Draft.`,
        });
      }

      router.push("/campaigns");
    } catch (err: any) {
      console.error(`Failed to save campaign as ${status}:`, err);
      toast({
        variant: "destructive",
        title: status === "Active" ? "Campaign Launch Failed" : "Save Draft Failed",
        description: err.message || "An unexpected error occurred while saving campaign.",
      });
    } finally {
      setSavingCampaign(false);
      setSavingDraft(false);
    }
  };

  const updateMessage = (index: number, content: string) => {
    setEditableMessages(msgs => msgs.map((m, i) => i === index ? { ...m, content } : m));
  };

  const displayedMessages = editableMessages.filter(m => FILTERS[activeFilter].types.includes(m.type));

  const avgScore = editableMessages.length
    ? Math.round(editableMessages.reduce((s, m) => s + m.personalization_score, 0) / editableMessages.length) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SalesProSidebar onOpenCommandPalette={() => setCommandOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SalesProHeader
          title="AI Personalized Messaging"
          subtitle="Generate hyper-personalized emails, LinkedIn messages, and call scripts using live database intelligence"
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="w-full mx-auto">
            <div className="space-y-6">

              {/* ─── TOP: Context Form ──────────────────────────────────── */}
              <ContextForm
                industryList={industryList}
                selectedPersonId={selectedPersonId}
                selectedCompanyId={selectedCompanyId}
                onSelectPerson={applyPersonData}
                onSelectCompany={applyCompanyData}
                person={person}
                setPerson={setPerson}
                company={company}
                setCompany={setCompany}
                offer={offer}
                setOffer={setOffer}
                senderName={senderName}
                setSenderName={setSenderName}
                senderTitle={senderTitle}
                setSenderTitle={setSenderTitle}
                painPoints={painPoints}
                loading={loading}
                onGenerate={handleGenerate}
              />

              {/* ─── BOTTOM: Generated Messages ───────────────────────────── */}
              <GeneratedMessages
                result={result}
                loading={loading}
                editableMessages={editableMessages}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                onUpdateMessage={(idx, content) => {
                  setEditableMessages(msgs => msgs.map((m, i) => i === idx ? { ...m, content } : m));
                }}
                onSend={handleOpenDispatch}
                onOpenCopilot={handleOptimizeCurrentSequence}
                optimizingSeq={optimizingSeq}
                onRegenerate={handleGenerate}
                canGenerate={Boolean(person.fname && company.name)}
                onSaveAndLaunchCampaign={() => handleSaveCampaign("Active")}
                onSaveCampaignDraft={() => handleSaveCampaign("Draft")}
                savingCampaign={savingCampaign}
                savingDraft={savingDraft}
              />
            </div>
          </div>
        </main>
      </div>

      {/* ─── AI Sequence Copilot Modal ─── */}
      <SequenceCopilotModal
        open={optimizeModalOpen}
        onOpenChange={setOptimizeModalOpen}
        result={optimizeResult}
      />

      {/* ─── Quick Outbound Dispatch Modal ─── */}
      <DispatchModal
        open={dispatchModalOpen}
        onOpenChange={setDispatchModalOpen}
        channel={dispatchChannel}
        connectedAccounts={connectedAccounts}
        recipientName={dispatchRecipientName}
        setRecipientName={setDispatchRecipientName}
        recipientEmail={dispatchRecipientEmail}
        setRecipientEmail={setDispatchRecipientEmail}
        recipientLinkedin={dispatchRecipientLinkedin}
        setRecipientLinkedin={setDispatchRecipientLinkedin}
        subject={dispatchSubject}
        setSubject={setDispatchSubject}
        body={dispatchBody}
        setBody={setDispatchBody}
        accountId={dispatchAccountId}
        setAccountId={setDispatchAccountId}
        dispatching={dispatching}
        dispatchResult={dispatchResult}
        onExecuteDispatch={handleExecuteDispatch}
      />

      {/* ─── Save & Configure Campaign Modal ─── */}
      <SaveCampaignModal
        open={saveCampaignModalOpen}
        onOpenChange={setSaveCampaignModalOpen}
        defaultTitle={`${company.name ? company.name + " - " : ""}${offer.product_service || "AI Multi-Touch"} ${targetSaveStatus === "Draft" ? "(Draft)" : "Campaign"}`}
        companyName={company.name || "Target Account"}
        sequenceSteps={getSequenceStepsFromMessages()}
        saving={savingCampaign || savingDraft}
        initialStatus={targetSaveStatus}
        onConfirmSave={handleConfirmSaveCampaign}
      />

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}

export default function AiMessagingPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">Loading AI messaging engine...</div>}>
      <AiMessagingContent />
    </React.Suspense>
  );
}
