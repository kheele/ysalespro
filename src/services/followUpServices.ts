import { FollowUpItem as BaseFollowUpItem, DailyFollowUpRule, LeadTemperature } from '@/lib/types';
import { MOCK_FOLLOWUPS, DAILY_RULES } from '@/mock-data/followUp';

export type { LeadTemperature, DailyFollowUpRule };

export interface FollowUpItem extends Omit<BaseFollowUpItem, 'id' | 'status'> {
  id: string;
  status: BaseFollowUpItem['status'] | 'Replied' | 'Escalated' | string;
  person_name?: string;
  person_title?: string;
  is_overdue?: boolean;
  days_since_last_contact?: number;
  channel?: string;
  subject?: string;
  assigned_rep?: string;
  sequence_name?: string;
  step_number?: number;
  total_steps?: number;
  follow_up_count?: number;
  next_follow_up_date?: string;
  message_preview?: string;
}

export interface DailyAutomationRule {
  id: string;
  name: string;
  description: string;
  rule_name?: string;
  condition?: string;
  action?: string;
  active?: boolean;
}

export interface AutomationExecutionResult {
  executed_at: string;
  emails_sent: number;
  sequences_stopped: number;
  leads_escalated: number;
  tasks_created: number;
  log_entries: Array<{
    timestamp: string;
    type: 'info' | 'success' | 'warning' | 'escalation';
    message: string;
  }>;
}

const ENHANCED_MOCK_FOLLOWUPS: FollowUpItem[] = MOCK_FOLLOWUPS.map((item, idx) => ({
  ...item,
  id: String(item.id || `fup-${idx + 101}`),
  person_name: item.lead_name,
  person_title: 'Decision Maker',
  is_overdue: item.status === 'Scheduled' || item.status === 'Pending Today',
  days_since_last_contact: 3,
  channel: 'Email',
  subject: 'Following up on our recent conversation',
  assigned_rep: item.assigned_user,
  sequence_name: 'Outbound Enterprise Sequence',
  step_number: item.sequence_step,
  total_steps: item.total_sequence_steps,
  follow_up_count: item.followup_count,
  next_follow_up_date: item.next_followup_date,
  message_preview: 'Hi, wanted to quickly check in on our proposal and see if you had any questions.',
}));

export async function getFollowUps(filters?: { search?: string; status?: string; rep?: string }): Promise<FollowUpItem[]> {
  let list = [...ENHANCED_MOCK_FOLLOWUPS];
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(item =>
      (item.person_name || item.lead_name || '').toLowerCase().includes(s) ||
      (item.company_name || '').toLowerCase().includes(s) ||
      (item.subject || '').toLowerCase().includes(s)
    );
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter(item => item.status === filters.status);
  }
  if (filters?.rep && filters.rep !== 'all') {
    list = list.filter(item => (item.assigned_rep || item.assigned_user) === filters.rep);
  }
  return list;
}

export function getAutomationRules(): DailyAutomationRule[] {
  return DAILY_RULES.map(r => ({
    id: String(r.id),
    name: r.rule_name,
    description: r.action,
    rule_name: r.rule_name,
    condition: r.condition,
    action: r.action,
    active: r.active,
  }));
}

export async function getDailyRules(): Promise<DailyFollowUpRule[]> {
  return [...DAILY_RULES];
}

export async function runDailyAutomation(): Promise<AutomationExecutionResult> {
  let emailsSent = 0;
  let sequencesStopped = 0;
  let leadsEscalated = 0;
  let tasksCreated = 0;

  ENHANCED_MOCK_FOLLOWUPS.forEach(fup => {
    if (fup.status === 'Pending Today' || fup.status === 'Scheduled') {
      fup.follow_up_count = (fup.follow_up_count || 0) + 1;
      fup.followup_count = fup.follow_up_count;
      fup.last_contact_date = new Date().toISOString().split('T')[0];
      fup.status = 'Sent';
      emailsSent++;
    } else if (fup.status === 'Response Received' || fup.status === 'Replied') {
      sequencesStopped++;
    } else if (fup.status === 'Escalated to HOT' || fup.status === 'Escalated') {
      leadsEscalated++;
      tasksCreated++;
    }
  });

  const now = new Date().toLocaleString();
  return {
    executed_at: now,
    emails_sent: emailsSent,
    sequences_stopped: sequencesStopped,
    leads_escalated: leadsEscalated,
    tasks_created: tasksCreated,
    log_entries: [
      { timestamp: now, type: 'info', message: `Processed ${emailsSent} scheduled follow-ups across active sequences.` },
      { timestamp: now, type: 'success', message: `Stopped ${sequencesStopped} sequences automatically upon detecting incoming responses.` },
      { timestamp: now, type: 'escalation', message: `Escalated ${leadsEscalated} high-intent replies to HOT status and assigned follow-up tasks.` },
    ],
  };
}

export async function processDailyFollowUps(): Promise<{ processed: number; escalated: number; halted: number }> {
  const result = await runDailyAutomation();
  return {
    processed: result.emails_sent,
    escalated: result.leads_escalated,
    halted: result.sequences_stopped,
  };
}

export async function markAsResponded(id: string): Promise<FollowUpItem> {
  const fup = ENHANCED_MOCK_FOLLOWUPS.find(f => String(f.id) === String(id));
  if (!fup) throw new Error('Follow-up item not found');
  fup.status = 'Replied';
  fup.lead_temperature = 'HOT';
  return fup;
}

export async function markAsReplied(id: string): Promise<FollowUpItem> {
  return markAsResponded(id);
}

export const followUpServices = {
  getFollowUps,
  getDailyRules,
  getAutomationRules,
  processDailyFollowUps,
  runDailyAutomation,
  markAsReplied,
  markAsResponded,
};
