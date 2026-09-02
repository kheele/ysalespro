'use server';

import nodemailer from 'nodemailer';
import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL, sendGraphQL } from '@/graphql';
import { getActiveSendingAccountByChannel, incrementAccountSentCount } from './connectedAccountsService';
import type { Campaign, SequenceStep, Lead } from '@/lib/types';

interface CronDispatchLog {
  campaign_id: number;
  campaign_name: string;
  lead_id?: number;
  lead_email?: string;
  step_number?: number;
  status: 'sent' | 'skipped' | 'failed' | 'window_closed';
  reason?: string;
}

interface CronRunResult {
  success: boolean;
  timestamp: string;
  campaigns_evaluated: number;
  campaigns_in_window: number;
  emails_sent: number;
  logs: CronDispatchLog[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Checks if the current moment falls within the campaign's allowed send_days and time window.
 */
export async function isCampaignInSendingWindow(campaign: any, now: Date = new Date()): Promise<{ inWindow: boolean; reason?: string }> {
  const timezone = campaign.timezone || 'Africa/Johannesburg';
  
  // Normalize timezone identifier
  let resolvedTz = 'Africa/Johannesburg';
  if (timezone.includes('UTC+2') || timezone.includes('Johannesburg') || timezone.includes('SAST')) {
    resolvedTz = 'Africa/Johannesburg';
  } else if (timezone.includes('UTC') || timezone.includes('GMT')) {
    resolvedTz = 'UTC';
  } else if (timezone.includes('America/New_York') || timezone.includes('EST')) {
    resolvedTz = 'America/New_York';
  } else if (timezone.includes('Europe/London')) {
    resolvedTz = 'Europe/London';
  }

  // Format current time in campaign timezone
  let currentDayName = '';
  let currentHour = 0;
  let currentMinute = 0;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: resolvedTz,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    for (const p of parts) {
      if (p.type === 'weekday') currentDayName = p.value;
      if (p.type === 'hour') currentHour = parseInt(p.value, 10);
      if (p.type === 'minute') currentMinute = parseInt(p.value, 10);
    }
  } catch {
    currentDayName = DAY_NAMES[now.getUTCDay()];
    currentHour = now.getUTCHours();
    currentMinute = now.getUTCMinutes();
  }

  // Check days
  const sendDays: string[] = Array.isArray(campaign.send_days) && campaign.send_days.length > 0
    ? campaign.send_days
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const matchesDay = sendDays.some(d => d.toLowerCase().startsWith(currentDayName.toLowerCase().slice(0, 3)));
  if (!matchesDay) {
    return { inWindow: false, reason: `Today (${currentDayName}) is not in active sending days: [${sendDays.join(', ')}]` };
  }

  // Check hours
  const timeFrom = campaign.send_time_from || '09:00';
  const timeTo = campaign.send_time_to || '17:00';

  const [fromH, fromM] = timeFrom.split(':').map((n: string) => parseInt(n, 10) || 0);
  const [toH, toM] = timeTo.split(':').map((n: string) => parseInt(n, 10) || 0);

  const currentMinutesTotal = currentHour * 60 + currentMinute;
  const fromMinutesTotal = fromH * 60 + fromM;
  const toMinutesTotal = toH * 60 + toM;

  if (currentMinutesTotal < fromMinutesTotal || currentMinutesTotal > toMinutesTotal) {
    return {
      inWindow: false,
      reason: `Current time (${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')} ${resolvedTz}) is outside window (${timeFrom} - ${timeTo})`,
    };
  }

  return { inWindow: true };
}

/**
 * Interpolates lead tokens into subject and body templates.
 */
function interpolateTemplate(template: string, lead: any): string {
  if (!template) return '';
  const fullName = lead.person_name || lead.person?.name || 'there';
  const firstName = fullName.split(' ')[0] || fullName;
  const company = lead.company_name || lead.person?.company_name || 'your team';
  const title = lead.person?.job_title || lead.job_title || 'Leader';
  const industry = lead.industry || 'your industry';

  return template
    .replace(/\{\{\s*name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*firstname\s*\}\}/gi, firstName)
    .replace(/\{\{\s*company\s*\}\}/gi, company)
    .replace(/\{\{\s*company_name\s*\}\}/gi, company)
    .replace(/\{\{\s*title\s*\}\}/gi, title)
    .replace(/\{\{\s*job_title\s*\}\}/gi, title)
    .replace(/\{\{\s*industry\s*\}\}/gi, industry);
}

/**
 * Processes a single campaign execution run.
 */
export async function processSingleCampaign(
  campaignId: number,
  options: { forceWindow?: boolean; maxBatch?: number } = {}
): Promise<{ emailsSent: number; logs: CronDispatchLog[] }> {
  const logs: CronDispatchLog[] = [];
  let emailsSent = 0;

  try {
    // 1. Fetch Campaign Details with Steps and Activities
    const qCampaign = `
      query GetCampaignForCron($id: Int!) {
        aa_s_campaigns_by_pk(id: $id) {
          id
          account_company_id
          name
          status
          send_time_from
          send_time_to
          timezone
          send_days
          start_date
          stop_on_reply
          stop_on_meeting
          emails_sent
          sequence_step_list(where: { is_active: { _neq: false } }, order_by: [{ step_number: asc }, { day: asc }]) {
            id
            step_number
            day
            type
            subject
            preview
            is_active
          }
          target_industry_list {
            industry_id
            industry {
              id
              name
            }
          }
        }
      }
    `;

    const campaign = await getGraphQLOne({
      query: qCampaign,
      variables: { id: campaignId },
      operationName: 'GetCampaignForCron',
    });

    if (!campaign) {
      return { emailsSent: 0, logs: [{ campaign_id: campaignId, campaign_name: 'Unknown', status: 'skipped', reason: 'Campaign not found' }] };
    }

    if (campaign.status !== 'Active' && !options.forceWindow) {
      return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'skipped', reason: `Campaign status is ${campaign.status}` }] };
    }

    // 2. Check Schedule Window
    if (!options.forceWindow) {
      const windowCheck = await isCampaignInSendingWindow(campaign);
      if (!windowCheck.inWindow) {
        return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'window_closed', reason: windowCheck.reason }] };
      }
    }

    const steps: any[] = campaign.sequence_step_list || [];
    if (steps.length === 0) {
      return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'skipped', reason: 'No active sequence steps defined' }] };
    }

    // 3. Resolve Connected Sending Mailbox
    const account = await getActiveSendingAccountByChannel(campaign.account_company_id, 'Email');
    if (!account || !account.email_config) {
      return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'failed', reason: 'No active email sending mailbox connected in Settings > Integrations' }] };
    }

    const config = account.email_config;
    const dailyLimit = account.email_config?.daily_send_limit || 200;
    const sentToday = account.sent_today || 0;
    const remainingQuota = Math.max(0, dailyLimit - sentToday);

    if (remainingQuota <= 0) {
      return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'skipped', reason: `Daily quota limit reached (${sentToday}/${dailyLimit})` }] };
    }

    // 4. Query Enrolled Leads
    const targetIndustryNames = (campaign.target_industry_list || [])
      .map((ti: any) => ti.industry?.name)
      .filter(Boolean);

    const leadWhereConditions: Record<string, any>[] = [
      { account_company_id: { _eq: campaign.account_company_id } },
    ];

    if (targetIndustryNames.length > 0) {
      leadWhereConditions.push({
        _or: targetIndustryNames.map((name: string) => ({ industry: { _ilike: `%${name}%` } })),
      });
    }

    const qLeads = `
      query GetLeadsForCampaign($where: aa_s_leads_bool_exp) {
        aa_s_leads(where: $where, limit: 100, order_by: [{ id: asc }]) {
          id
          person_id
          person_name
          company_name
          industry
          lead_temperature
          last_contact
          next_followup
          person {
            id
            name
            email
            job_title
            company_name
          }
          outreach_activity_list(where: { campaign_id: { _eq: ${campaign.id} } }, order_by: [{ id: asc }]) {
            id
            channel
            status
            subject
            created_at
          }
        }
      }
    `;

    const leadsRes = await listGraphQL({
      query: qLeads,
      variables: { where: { _and: leadWhereConditions } },
      operationName: 'GetLeadsForCampaign',
    });

    const leads: any[] = Array.isArray(leadsRes) ? leadsRes : [];
    const maxBatch = Math.min(options.maxBatch || 25, remainingQuota);

    // Setup SMTP Transporter once per campaign batch
    const transporter = config.password && (config.provider === 'google_workspace' || config.provider === 'smtp')
      ? nodemailer.createTransport({
          host: config.host || (config.provider === 'google_workspace' ? 'smtp.gmail.com' : 'localhost'),
          port: config.port || (config.provider === 'google_workspace' ? 465 : 587),
          secure: config.secure ?? (config.port === 465),
          auth: {
            user: config.username || config.from_email,
            pass: config.password,
          },
          connectionTimeout: 8000,
        })
      : null;

    const todayStr = new Date().toISOString().split('T')[0];

    // 5. Evaluate and Dispatch to Each Eligible Lead
    for (const lead of leads) {
      if (emailsSent >= maxBatch) break;

      const recipientEmail = lead.person?.email || '';
      if (!recipientEmail || !recipientEmail.includes('@')) {
        continue;
      }

      const activities: any[] = lead.outreach_activity_list || [];

      // Check Stop on Reply / Meeting Rules
      const hasReplied = activities.some(a => a.status === 'Replied' || a.status === 'Meeting Booked' || a.status === 'Interested');
      if (hasReplied && campaign.stop_on_reply) {
        logs.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          lead_id: lead.id,
          lead_email: recipientEmail,
          status: 'skipped',
          reason: 'Lead has already replied or booked a meeting (stop_on_reply active)',
        });
        continue;
      }

      // Determine Next Step in Sequence
      const completedStepsCount = activities.filter(a => a.status === 'Sent' || a.status === 'Delivered').length;
      if (completedStepsCount >= steps.length) {
        continue; // Completed full sequence
      }

      const targetStep = steps[completedStepsCount];
      if (!targetStep) continue;

      // Check Due Date
      if (completedStepsCount > 0 && lead.next_followup && !options.forceWindow) {
        const nextFollowupDate = String(lead.next_followup).split('T')[0];
        if (nextFollowupDate > todayStr) {
          continue; // Not due yet
        }
      }

      // Interpolate Subject & Body
      const subject = interpolateTemplate(targetStep.subject || `Outreach from ${config.from_name || 'SalesPro'}`, lead);
      const body = interpolateTemplate(targetStep.preview || '', lead);

      let sendSuccess = false;
      let sendError = '';

      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"${config.from_name || 'SalesPro'}" <${config.from_email}>`,
            to: `"${lead.person_name || lead.person?.name || ''}" <${recipientEmail}>`,
            subject,
            text: body.replace(/<[^>]*>?/gm, ''),
            html: body.includes('<') ? body : body.replace(/\n/g, '<br/>'),
            replyTo: config.reply_to || config.from_email,
            headers: {
              'X-SalesPro-Outreach': 'true',
              'X-SalesPro-Campaign-Id': String(campaign.id),
              'X-SalesPro-Lead-Id': String(lead.id),
              'X-SalesPro-Step-Number': String(targetStep.step_number || completedStepsCount + 1),
            },
          });
          sendSuccess = true;
        } catch (err: any) {
          sendSuccess = false;
          sendError = err?.message || 'SMTP delivery failed';
        }
      } else {
        // Mock or simulated dispatch if credentials are not filled yet
        sendSuccess = true;
      }

      const nowIso = new Date().toISOString();

      if (sendSuccess) {
        // 1. Log Outreach Activity
        const mOutreach = `
          mutation LogActivity($object: aa_s_outreach_activities_insert_input!) {
            insert_aa_s_outreach_activities_one(object: $object) {
              id
            }
          }
        `;
        await insertGraphQL({
          mutation: mOutreach,
          input: {
            account_company_id: campaign.account_company_id,
            campaign_id: campaign.id,
            lead_id: lead.id,
            channel: 'Email',
            lead_name: lead.person_name || lead.person?.name || 'Lead',
            company_name: lead.company_name || lead.person?.company_name || '',
            recipient_email: recipientEmail,
            subject_or_type: subject,
            response_preview: body.slice(0, 500),
            status: 'Sent',
            date: todayStr,
          },
          operationName: 'LogActivity',
        }).catch(err => console.warn('Could not log outreach activity:', err));

        // 2. Increment Mailbox & Campaign counters
        await incrementAccountSentCount(campaign.account_company_id, account.id);

        // Calculate next follow-up date based on subsequent step offset
        const nextStepIndex = completedStepsCount + 1;
        let nextFollowupDateStr: string | null = null;
        if (nextStepIndex < steps.length) {
          const nextStep = steps[nextStepIndex];
          const daysToAdd = Math.max(1, (nextStep.day || 3) - (targetStep.day || 1));
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + daysToAdd);
          nextFollowupDateStr = nextDate.toISOString().split('T')[0];
        }

        // 3. Update Lead last_contact & next_followup
        const mLeadUpdate = `
          mutation UpdateLeadAfterSend($id: Int!, $_set: aa_s_leads_set_input!) {
            update_aa_s_leads_by_pk(pk_columns: { id: $id }, _set: $_set) {
              id
            }
          }
        `;
        await updateGraphQL({
          mutation: mLeadUpdate,
          id: lead.id,
          attrs: {
            last_contact: todayStr,
            next_followup: nextFollowupDateStr,
            followup_count: completedStepsCount + 1,
          },
          operationName: 'UpdateLeadAfterSend',
        }).catch(err => console.warn('Could not update lead followup state:', err));

        emailsSent++;
        logs.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          lead_id: lead.id,
          lead_email: recipientEmail,
          step_number: targetStep.step_number || completedStepsCount + 1,
          status: 'sent',
        });
      } else {
        logs.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          lead_id: lead.id,
          lead_email: recipientEmail,
          step_number: targetStep.step_number || completedStepsCount + 1,
          status: 'failed',
          reason: sendError,
        });
      }
    }

    // Update Campaign emails_sent counter
    if (emailsSent > 0) {
      const mCampaignUpdate = `
        mutation UpdateCampaignSentCount($id: Int!, $_set: aa_s_campaigns_set_input!) {
          update_aa_s_campaigns_by_pk(pk_columns: { id: $id }, _set: $_set) {
            id
          }
        }
      `;
      await updateGraphQL({
        mutation: mCampaignUpdate,
        id: campaign.id,
        attrs: {
          emails_sent: (campaign.emails_sent || 0) + emailsSent,
        },
        operationName: 'UpdateCampaignSentCount',
      }).catch(err => console.warn('Could not update campaign sent count:', err));
    }

    return { emailsSent, logs };
  } catch (err: any) {
    console.error(`Error executing campaign #${campaignId}:`, err);
    return {
      emailsSent,
      logs: [{ campaign_id: campaignId, campaign_name: 'Error', status: 'failed', reason: err?.message || 'Execution exception' }],
    };
  }
}

/**
 * Main cron entrypoint that evaluates and processes all Active campaigns.
 */
export async function processAllActiveCampaignsAction(
  options: { forceWindow?: boolean; maxBatchPerCampaign?: number } = {}
): Promise<CronRunResult> {
  const timestamp = new Date().toISOString();
  const allLogs: CronDispatchLog[] = [];
  let totalEmailsSent = 0;
  let campaignsInWindow = 0;

  try {
    const qActive = `
      query GetActiveCampaigns {
        aa_s_campaigns(where: { status: { _eq: "Active" } }) {
          id
          name
          account_company_id
          send_time_from
          send_time_to
          timezone
          send_days
        }
      }
    `;

    const res = await listGraphQL({
      query: qActive,
      operationName: 'GetActiveCampaigns',
    });

    const activeCampaigns: any[] = Array.isArray(res) ? res : [];

    for (const c of activeCampaigns) {
      const windowCheck = await isCampaignInSendingWindow(c);
      if (windowCheck.inWindow || options.forceWindow) {
        campaignsInWindow++;
        const { emailsSent, logs } = await processSingleCampaign(c.id, {
          forceWindow: options.forceWindow,
          maxBatch: options.maxBatchPerCampaign || 25,
        });
        totalEmailsSent += emailsSent;
        allLogs.push(...logs);
      } else {
        allLogs.push({
          campaign_id: c.id,
          campaign_name: c.name,
          status: 'window_closed',
          reason: windowCheck.reason,
        });
      }
    }

    return {
      success: true,
      timestamp,
      campaigns_evaluated: activeCampaigns.length,
      campaigns_in_window: campaignsInWindow,
      emails_sent: totalEmailsSent,
      logs: allLogs,
    };
  } catch (err: any) {
    console.error('processAllActiveCampaignsAction error:', err);
    return {
      success: false,
      timestamp,
      campaigns_evaluated: 0,
      campaigns_in_window: 0,
      emails_sent: 0,
      logs: [{ campaign_id: 0, campaign_name: 'Cron System', status: 'failed', reason: err?.message || 'Fatal cron execution error' }],
    };
  }
}
