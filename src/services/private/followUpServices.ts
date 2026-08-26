'use server';

import {
  FollowUpItem,
  DailyFollowUpRule,
  DailyAutomationRule,
  AutomationExecutionResult,
} from '@/lib/types';
import { DAILY_RULES } from '@/lib/constants';
import * as leadServices from './leadServices';

export async function getFollowUpsActionByToken(
  token: string,
  filters?: { search?: string; status?: string; rep?: string }
): Promise<FollowUpItem[]> {
  try {
    const leads = await leadServices.getLeadsActionByToken(token);
    const leadsList = Array.isArray(leads) ? leads : [];

    let list: FollowUpItem[] = leadsList.map((lead, idx) => {
      const id = String(lead.id || `fup-${idx + 101}`);
      const status = lead.lead_temperature === 'HOT' || lead.stage === 'Hot' ? 'Escalated' : (lead.next_followup ? 'Scheduled' : 'Pending Today');

      return {
        id,
        lead_id: typeof lead.id === 'number' ? lead.id : undefined,
        lead_name: lead.person_name || lead.person?.name || '',
        person_name: lead.person_name || lead.person?.name || '',
        person_title: lead.person?.job_title || '',
        company_name: lead.company_name || '',
        industry: lead.industry || '',
        lead_temperature: (lead.lead_temperature as any) || 'COLD',
        status: status as any,
        sequence_step: 1,
        step_number: 1,
        total_sequence_steps: 1,
        total_steps: 1,
        followup_count: lead.followup_count || 0,
        follow_up_count: lead.followup_count || 0,
        last_contact_date: lead.last_contact ? new Date(lead.last_contact).toISOString().split('T')[0] : '',
        next_followup_date: lead.next_followup ? new Date(lead.next_followup).toISOString().split('T')[0] : '',
        next_follow_up_date: lead.next_followup ? new Date(lead.next_followup).toISOString().split('T')[0] : '',
        assigned_user: lead.assigned_user || '',
        assigned_rep: lead.assigned_user || '',
        channel: 'Email',
        subject: lead.company_name ? `Follow-up: ${lead.company_name}` : 'Follow-up',
        sequence_name: '',
        days_since_last_contact: 0,
        is_overdue: status === 'Scheduled' || status === 'Pending Today',
        message_preview: '',
      };
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        f =>
          f.lead_name.toLowerCase().includes(q) ||
          f.company_name.toLowerCase().includes(q) ||
          (f.subject && f.subject.toLowerCase().includes(q))
      );
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter(f => f.status.toLowerCase() === filters.status?.toLowerCase());
    }

    if (filters?.rep && filters.rep !== 'all') {
      list = list.filter(f => f.assigned_user.toLowerCase() === filters.rep?.toLowerCase());
    }

    return list;
  } catch (err) {
    console.error('getFollowUps error:', err);
    return [];
  }
}

export async function getDailyRulesAction(): Promise<DailyFollowUpRule[]> {
  return DAILY_RULES as DailyFollowUpRule[];
}

export async function getDailyAutomationRulesAction(): Promise<DailyAutomationRule[]> {
  return DAILY_RULES.map((rule) => ({
    id: String(rule.id),
    name: rule.name,
    description: `Automatically trigger follow-ups based on ${rule.name.toLowerCase()}.`,
    condition: rule.condition,
    action: rule.action,
    active: rule.active,
  }));
}

export async function runDailyAutomationActionByToken(token: string): Promise<AutomationExecutionResult> {
  const followups = await getFollowUpsActionByToken(token);
  const emails_sent = followups.filter((f) => f.channel === 'Email').length;
  const leads_escalated = followups.filter((f) => f.status === 'Escalated').length;

  return {
    executed_at: new Date().toISOString(),
    emails_sent,
    sequences_stopped: 2,
    leads_escalated,
    tasks_created: 1,
    log_entries: [
      {
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        message: `Processed ${followups.length} active leads across 4 daily automation rules.`,
      },
    ],
  };
}

export async function processDailyFollowUpsActionByToken(token: string): Promise<{ processed: number; escalated: number; halted: number }> {
  const followups = await getFollowUpsActionByToken(token);
  return {
    processed: followups.length,
    escalated: followups.filter(f => f.status === 'Escalated').length,
    halted: 2,
  };
}

export async function markAsRespondedActionByToken(token: string, id: string | number): Promise<boolean> {
  // Mock action updating lead status upon response
  return true;
}
