import { FollowUpItem, DailyFollowUpRule, LeadTemperature } from '@/lib/types';
import { MOCK_FOLLOWUPS, DAILY_RULES } from '@/mock-data/followUp';

export type { FollowUpItem, DailyFollowUpRule, LeadTemperature };

export async function getFollowUps(): Promise<FollowUpItem[]> {
  return [...MOCK_FOLLOWUPS];
}

export async function getDailyRules(): Promise<DailyFollowUpRule[]> {
  return [...DAILY_RULES];
}

export async function processDailyFollowUps(): Promise<{ processed: number; escalated: number; halted: number }> {
  let processed = 0;
  let escalated = 0;
  let halted = 0;

  MOCK_FOLLOWUPS.forEach(fup => {
    if (fup.status === "Pending Today" || fup.status === "Scheduled") {
      fup.followup_count += 1;
      fup.last_contact_date = new Date().toISOString().split('T')[0];
      fup.status = "Sent";
      processed++;
    } else if (fup.status === "Response Received") {
      halted++;
    } else if (fup.status === "Escalated to HOT") {
      escalated++;
    }
  });

  return { processed, escalated, halted };
}

export async function markAsReplied(id: string): Promise<FollowUpItem> {
  const fup = MOCK_FOLLOWUPS.find(f => f.id === id);
  if (!fup) throw new Error("Follow-up item not found");
  fup.status = "Response Received";
  fup.lead_temperature = "HOT";
  return fup;
}

export const followUpServices = {
  getFollowUps,
  getDailyRules,
  processDailyFollowUps,
  markAsReplied,
};
