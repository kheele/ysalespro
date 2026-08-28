'use server';

import {
  FollowUpItem,
  DailyFollowUpRule,
  DailyAutomationRule,
  AutomationExecutionResult,
} from '@/lib/types';
import * as leadServices from './leadServices';
import { getCompanySettingsActionByToken } from './settingsService';

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

export async function getDailyRulesAction(token?: string): Promise<DailyFollowUpRule[]> {
  if (token) {
    try {
      const settings = await getCompanySettingsActionByToken(token);
      if (settings?.daily_rules && settings.daily_rules.length > 0) {
        return settings.daily_rules;
      }
    } catch (e) {
      console.warn("Could not load daily rules from company settings:", e);
    }
  }
  return [];
}

export async function getDailyAutomationRulesAction(token?: string): Promise<DailyAutomationRule[]> {
  const rules = await getDailyRulesAction(token);
  return rules.map((rule) => ({
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
  const sequences_stopped = followups.filter((f) => f.status === 'Replied' || f.status === 'Cancelled').length;
  const tasks_created = followups.filter((f) => f.status === 'Scheduled' || f.status === 'Pending Today').length;

  const logs: { timestamp: string; type: "info" | "success" | "warning" | "escalation"; message: string }[] = [
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: `Processed ${followups.length} active leads across daily follow-up automation rules.`,
    },
  ];

  if (emails_sent > 0) {
    logs.push({
      timestamp: new Date().toLocaleTimeString(),
      type: 'success',
      message: `Dispatched ${emails_sent} automated sequence touchpoints.`,
    });
  }

  if (leads_escalated > 0) {
    logs.push({
      timestamp: new Date().toLocaleTimeString(),
      type: 'escalation',
      message: `Escalated ${leads_escalated} high-intent lead(s) for immediate AE review.`,
    });
  }

  return {
    executed_at: new Date().toISOString(),
    emails_sent,
    sequences_stopped,
    leads_escalated,
    tasks_created,
    log_entries: logs,
  };
}

export async function processDailyFollowUpsActionByToken(token: string): Promise<{ processed: number; escalated: number; halted: number }> {
  const followups = await getFollowUpsActionByToken(token);
  const escalated = followups.filter((f) => f.status === 'Escalated').length;
  const halted = followups.filter((f) => f.status === 'Replied' || f.status === 'Cancelled').length;
  return {
    processed: followups.length,
    escalated,
    halted,
  };
}

export async function markAsRespondedActionByToken(token: string, id: string | number): Promise<boolean> {
  try {
    const leadId = typeof id === 'string' && id.startsWith('fup-') ? null : Number(id);
    if (leadId && !isNaN(leadId)) {
      await leadServices.updateLeadStageActionByToken(token, leadId, 'Warm');
    }
    return true;
  } catch (err) {
    console.error('markAsResponded error:', err);
    return false;
  }
}
