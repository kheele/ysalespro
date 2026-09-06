import type { Campaign, CampaignSchedule } from "@/lib/types";

/**
 * Clones a campaign into memory for review and customization before saving.
 * Clears the id so it is created as a new draft upon submission.
 */
export function prepareCampaignForDuplication(campaign: Campaign): Campaign {
  const schedObj: CampaignSchedule | undefined = campaign.schedule
    ? typeof campaign.schedule === "object"
      ? {
          ...campaign.schedule,
          start_date: new Date().toISOString().split("T")[0],
        }
      : undefined
    : undefined;

  return {
    ...campaign,
    id: undefined as any,
    name: `${campaign.name} (Copy)`,
    description: campaign.description || "",
    status: "Draft",
    target_organization_id: campaign.target_organization_id,
    target_companies_count: campaign.target_companies_count,
    target_people_count: campaign.target_people_count,
    total_contacts: campaign.total_contacts,
    audience: campaign.audience
      ? {
          industries: [...(campaign.audience.industries || [])],
          companies: [...(campaign.audience.companies || [])],
          people: [...(campaign.audience.people || [])],
          estimated_contacts: campaign.audience.estimated_contacts || campaign.total_contacts || 0,
        }
      : undefined,
    sequence: (campaign.sequence && campaign.sequence.length > 0)
      ? campaign.sequence.map((s, idx) => ({
          id: `dup-${idx + 1}`,
          step_number: s.step_number || idx + 1,
          day: s.day,
          type: s.type,
          subject: s.subject || "",
          body: s.body || "",
          enabled: s.enabled !== false,
        }))
      : undefined,
    rules: campaign.rules
      ? { ...campaign.rules }
      : {
          stop_on_reply: campaign.stop_on_reply ?? true,
          stop_on_meeting_booked: campaign.stop_on_meeting ?? true,
          update_lead_status: campaign.update_lead_status ?? true,
          create_follow_up_task: campaign.create_followup_task ?? true,
          exclude_customers: true,
          exclude_competitors: true,
          track_opens: true,
        },
    schedule: schedObj || campaign.schedule,
    start_date: new Date().toISOString().split("T")[0],
    emails_sent: 0,
    open_rate: 0,
    reply_rate: 0,
    meetings_booked: 0,
    unsubscribes: 0,
  };
}
