'use server';

import nodemailer from 'nodemailer';
import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL, sendGraphQL } from '@/graphql';
import { getActiveSendingAccountByChannel, incrementAccountSentCount } from './connectedAccountsService';
import { getAccountCompanyById } from './accountCompanyService';
import { injectTrackingToEmailHtml } from '@/lib/tracking-utils';
import type { Campaign, SequenceStep, Lead } from '@/lib/types';
import { TrendingUp } from 'lucide-react';

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

interface TemplateContext {
  senderName?: string;
  senderTitle?: string;
  senderCompany?: string;
  senderEmail?: string;
}

/**
 * Interpolates lead tokens and sender placeholders into subject and body templates.
 */
function interpolateTemplate(template: string, lead: any, context?: TemplateContext): string {
  if (!template) return '';

  // 1. Resolve lead data
  const fullName = lead?.person_name || lead?.person?.name || 'there';
  const firstName = fullName.split(' ')[0] || fullName;
  const lastName = fullName.split(' ').slice(1).join(' ') || '';
  const company = lead?.company_name || lead?.person?.company_name || 'your team';
  const title = lead?.person?.job_title || lead?.job_title || 'Leader';
  const industry = lead?.industry || 'your industry';

  // 2. Resolve sender data
  const senderName =
    context?.senderName ||
    lead?.assigned_user ||
    (lead?.assigned_user_obj ? `${lead.assigned_user_obj.fname || ''} ${lead.assigned_user_obj.lname || ''}`.trim() : null) ||
    'Sales Team';
  const senderFirstName = senderName.split(' ')[0] || senderName;
  const senderTitle = context?.senderTitle || '';
  const senderCompany = context?.senderCompany || '';

  let text = template
    // Lead curly-brace tokens
    .replace(/\{\{\s*name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*full_name\s*\}\}/gi, fullName)
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*firstname\s*\}\}/gi, firstName)
    .replace(/\{\{\s*fname\s*\}\}/gi, firstName)
    .replace(/\{\{\s*last_name\s*\}\}/gi, lastName)
    .replace(/\{\{\s*lname\s*\}\}/gi, lastName)
    .replace(/\{\{\s*company\s*\}\}/gi, company)
    .replace(/\{\{\s*company_name\s*\}\}/gi, company)
    .replace(/\{\{\s*title\s*\}\}/gi, title)
    .replace(/\{\{\s*job_title\s*\}\}/gi, title)
    .replace(/\{\{\s*industry\s*\}\}/gi, industry)

    // Sender curly-brace tokens
    .replace(/\{\{\s*sender_name\s*\}\}/gi, senderName)
    .replace(/\{\{\s*sendername\s*\}\}/gi, senderName)
    .replace(/\{\{\s*from_name\s*\}\}/gi, senderName)
    .replace(/\{\{\s*sender_first_name\s*\}\}/gi, senderFirstName)
    .replace(/\{\{\s*sender_fname\s*\}\}/gi, senderFirstName)
    .replace(/\{\{\s*sender_title\s*\}\}/gi, senderTitle)
    .replace(/\{\{\s*sender_company\s*\}\}/gi, senderCompany)

    // Bracketed / generic placeholders common from AI copywriters and templates
    .replace(/\[\s*Your\s+Name\s*\]/gi, senderName)
    .replace(/\[\s*Sender\s+Name\s*\]/gi, senderName)
    .replace(/<\s*Your\s+Name\s*>/gi, senderName)
    .replace(/\[\s*Your\s+Full\s+Name\s*\]/gi, senderName)
    .replace(/\[\s*Your\s+First\s+Name\s*\]/gi, senderFirstName)
    .replace(/\[\s*Your\s+Company(?:\s+Name)?\s*\]/gi, senderCompany || '')
    .replace(/\[\s*Company\s+Name\s*\]/gi, company);

  // If a senderTitle is provided, replace placeholders with it; otherwise cleanly strip the title line
  if (senderTitle) {
    text = text
      .replace(/\[\s*Your\s+Title\s*\]/gi, senderTitle)
      .replace(/\[\s*Sender\s+Title\s*\]/gi, senderTitle)
      .replace(/<\s*Your\s+Title\s*>/gi, senderTitle)
      .replace(/\{\{\s*sender_title\s*\}\}/gi, senderTitle);
  } else {
    text = text
      .replace(/\r?\n[ \t]*\[\s*Your\s+Title\s*\]/gi, '')
      .replace(/\[\s*Your\s+Title\s*\]/gi, '')
      .replace(/\r?\n[ \t]*\[\s*Sender\s+Title\s*\]/gi, '')
      .replace(/\[\s*Sender\s+Title\s*\]/gi, '')
      .replace(/\r?\n[ \t]*<\s*Your\s+Title\s*>/gi, '')
      .replace(/<\s*Your\s+Title\s*>/gi, '')
      .replace(/\r?\n[ \t]*\{\{\s*sender_title\s*\}\}/gi, '')
      .replace(/\{\{\s*sender_title\s*\}\}/gi, '');
  }

  return text;
}

/**
 * Fetches campaign details with steps and target industries for cron processing.
 */
async function fetchCampaignForCron(campaignId: number): Promise<any> {
  const qCampaign = `
    query GetCampaignForCron($id: Int!) {
      aa_s_campaigns_by_pk(id: $id) {
        id
        account_company_id
        target_organization_id
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

  return await getGraphQLOne({
    query: qCampaign,
    variables: { id: campaignId },
    operationName: 'GetCampaignForCron',
  });
}

/**
 * Resolves the active sending mailbox and verifies daily quota constraints.
 */
async function resolveSendingMailboxAndQuota(accountCompanyId: number): Promise<{
  account?: any;
  config?: any;
  remainingQuota: number;
  dailyLimit: number;
  sentToday: number;
  errorReason?: string;
}> {
  const account = await getActiveSendingAccountByChannel(accountCompanyId, 'Email');
  // console.log('processSingleCampaign campaign account', account);

  if (!account || !account.email_config) {
    return {
      remainingQuota: 0,
      dailyLimit: 0,
      sentToday: 0,
      errorReason: 'No active email sending mailbox connected in Settings > Integrations',
    };
  }

  // console.log('processSingleCampaign account', account);

  const config = account.email_config;
  const dailyLimit = account.email_config?.daily_send_limit || 200;
  const todayStr = new Date().toISOString().split('T')[0];

  // Auto-reset daily sent counter if new calendar day
  let sentToday = account.sent_today || 0;
  if (account.last_used_at) {
    const lastUsedDate = new Date(account.last_used_at).toISOString().split('T')[0];
    if (lastUsedDate !== todayStr) {
      sentToday = 0;
      await sendGraphQL({
        mutation: `
          mutation ResetAccountDailySent($id: Int!) {
            update_aa_s_connected_accounts_by_pk(
              pk_columns: { id: $id },
              _set: { sent_today: 0 }
            ) {
              id
            }
          }
        `,
        variables: { id: account.id },
        operationName: 'ResetAccountDailySent',
      }).catch(() => { });
    }
  }

  const remainingQuota = Math.max(0, dailyLimit - sentToday);
  if (remainingQuota <= 0) {
    return {
      account,
      config,
      remainingQuota: 0,
      dailyLimit,
      sentToday,
      errorReason: `Daily quota limit reached (${sentToday}/${dailyLimit})`,
    };
  }

  return {
    account,
    config,
    remainingQuota,
    dailyLimit,
    sentToday,
  };
}

/**
 * Queries enrolled leads for a campaign matching company and industry filters.
 */
async function fetchExistingLeads(campaign: any, targetIndustryNames: string[], queryLimit: number): Promise<any[]> {
  const leadWhereConditions: Record<string, any>[] = [];

  if (campaign.account_company_id) {
    leadWhereConditions.push({
      account_company_id: { _eq: campaign.account_company_id }
    });
  }

  if (campaign.target_organization_id) {
    leadWhereConditions.push({
      target_organization_id: { _eq: campaign.target_organization_id }
    });
  } else if (targetIndustryNames.length > 0) {
    leadWhereConditions.push({
      _or: [
        ...targetIndustryNames.map((name: string) => ({ industry: { _ilike: `%${name}%` } })),
        { industry: { _is_null: true } },
      ],
    });
  }

  const where = leadWhereConditions.length > 0 ? { _and: leadWhereConditions } : {};

  const qLeads = `
    query GetLeadsForCampaign($where: aa_s_leads_bool_exp, $limit: Int) {
      aa_s_leads(where: $where, limit: $limit, order_by: [{ id: asc }]) {
        id
        account_company_id
        target_organization_id
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
          subject_or_type
          created_at
        }
      }
    }
  `;

  const leadsRes = await listGraphQL({
    query: qLeads,
    variables: { where, limit: queryLimit },
    operationName: 'GetLeadsForCampaign',
  });

  return Array.isArray(leadsRes) ? leadsRes : [];
}

/**
 * Auto-discovers and enrolls contacts from aa_s_people into aa_s_leads.
 */
async function autoEnrollEligiblePeople(campaign: any, targetIndustryNames: string[], queryLimit: number): Promise<any[]> {
  const peopleWhereConditions: Record<string, any>[] = [
    { email: { _is_null: false, _neq: "" } },
  ];

  if (campaign.target_organization_id) {
    peopleWhereConditions.push({ company_id: { _eq: campaign.target_organization_id } });
  } else if (targetIndustryNames.length > 0) {
    peopleWhereConditions.push({
      _or: targetIndustryNames.map((name: string) => ({ industry: { _ilike: `%${name}%` } })),
    });
  }

  const qPeople = `
    query GetEligiblePeopleForCampaign($where: aa_s_people_bool_exp, $limit: Int) {
      aa_s_people(where: $where, limit: $limit, order_by: [{ id: asc }]) {
        id
        name
        email
        job_title
        company_name
        industry
      }
    }
  `;

  const enrolledLeads: any[] = [];

  try {
    const peopleRes = await listGraphQL({
      query: qPeople,
      variables: { where: { _and: peopleWhereConditions }, limit: queryLimit },
      operationName: 'GetEligiblePeopleForCampaign',
    });

    const peopleList: any[] = Array.isArray(peopleRes) ? peopleRes : [];
    console.log(`Discovered ${peopleList.length} eligible decision maker(s) for auto-enrollment in campaign #${campaign.id}`);

    for (const p of peopleList) {
      if (!p.email || !p.email.includes('@')) continue;

      const insertLeadMutation = `
        mutation AutoEnrollLead($object: aa_s_leads_insert_input!) {
          insert_aa_s_leads_one(object: $object) {
            id
            account_company_id
            target_organization_id
            person_id
            person_name
            company_name
            industry
            lead_temperature
            stage
            person {
              id
              name
              email
              job_title
              company_name
            }
          }
        }
      `;

      try {
        const newLead = await insertGraphQL({
          mutation: insertLeadMutation,
          operationName: 'AutoEnrollLead',
          input: {
            account_company_id: campaign.account_company_id,
            target_organization_id: campaign.target_organization_id ? Number(campaign.target_organization_id) : (p.company_id ? Number(p.company_id) : null),
            person_id: p.id,
            person_name: p.name || null,
            company_name: p.company_name || null,
            industry: p.industry || null,
            stage: 'Contacted',
            lead_temperature: 'COLD',
            lead_score: 50,
          },
        });

        if (newLead) {
          enrolledLeads.push({
            ...newLead,
            person: newLead.person || p,
            outreach_activity_list: [],
          });
        }
      } catch (insertErr) {
        console.error('Auto-enroll lead failed:', insertErr);
      }
    }
  } catch (err) {
    console.error('Auto-discovery from aa_s_people failed:', err);
  }

  return enrolledLeads;
}

/**
 * Auto-discovers verified company emails from aa_s_organizations into aa_s_leads.
 */
async function autoEnrollEligibleOrganizations(campaign: any, targetIndustryNames: string[], queryLimit: number): Promise<any[]> {
  const orgWhereConditions: Record<string, any>[] = [
    {
      _or: [
        { primary_domain: { _is_null: false, _neq: "" } },
        { website_url: { _is_null: false, _neq: "" } },
      ],
    },
  ];

  if (campaign.target_organization_id) {
    orgWhereConditions.push({ id: { _eq: campaign.target_organization_id } });
  } else if (targetIndustryNames.length > 0) {
    orgWhereConditions.push({
      _or: targetIndustryNames.map((name: string) => ({ primary_industry: { _ilike: `%${name}%` } })),
    });
  }

  const qOrgs = `
    query GetEligibleOrgsForCampaign($where: aa_s_organizations_bool_exp, $limit: Int) {
      aa_s_organizations(where: $where, limit: $limit, order_by: [{ id: asc }]) {
        id
        name
        primary_domain
        website_url
        primary_industry
        city
        country
        email_list(
          where: {
            email_type: { _eq: "internal" },
            source: { _in: ["website_scrape", "cross_referenced_scrape", "mx_fallback"] }
          },
          order_by: [{ id: asc }]
        ) {
          id
          email
          email_type
          source
        }
      }
    }
  `;

  const enrolledLeads: any[] = [];

  try {
    const orgsRes = await listGraphQL({
      query: qOrgs,
      variables: { where: { _and: orgWhereConditions }, limit: queryLimit },
      operationName: 'GetEligibleOrgsForCampaign',
    });

    const orgsList: any[] = Array.isArray(orgsRes) ? orgsRes : [];
    console.log(`Discovered ${orgsList.length} eligible company/organization(s) for campaign #${campaign.id}`);

    for (const org of orgsList) {
      const domainRawCandidate = typeof org.primary_domain === 'string'
        ? org.primary_domain
        : (typeof org.primary_domain === 'object' && org.primary_domain ? (org.primary_domain.domain || org.primary_domain.name || '') : '');

      const urlRawCandidate = typeof org.website_url === 'string'
        ? org.website_url
        : (typeof org.website_url === 'object' && org.website_url ? (org.website_url.url || org.website_url.domain || '') : '');

      const rawDomain = domainRawCandidate || urlRawCandidate || '';
      const cleanDomain = String(rawDomain)
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0]
        .trim()
        .toLowerCase();

      // Extract all verified internal emails from aa_s_organization_emails
      const orgEmails: string[] = (org.email_list || [])
        .map((e: any) => e.email?.toLowerCase().trim())
        .filter((e: string) => e && e.includes('@'));

      if (orgEmails.length === 0) {
        continue;
      }

      for (const companyEmail of orgEmails) {
        const insertLeadMutation = `
          mutation AutoEnrollOrgLead($object: aa_s_leads_insert_input!) {
            insert_aa_s_leads_one(object: $object) {
              id
              account_company_id
              target_organization_id
              person_name
              company_name
              industry
              lead_temperature
              stage
            }
          }
        `;

        try {
          const newLead = await insertGraphQL({
            mutation: insertLeadMutation,
            operationName: 'AutoEnrollOrgLead',
            input: {
              account_company_id: campaign.account_company_id,
              target_organization_id: campaign.target_organization_id ? Number(campaign.target_organization_id) : (org.id ? Number(org.id) : null),
              person_name: org.name || 'Executive Team',
              company_name: org.name || cleanDomain,
              industry: org.primary_industry || null,
              stage: 'Contacted',
              lead_temperature: 'COLD',
              lead_score: 50,
            },
          });

          if (newLead) {
            enrolledLeads.push({
              ...newLead,
              person: {
                id: 0,
                name: org.name || 'Executive Team',
                email: companyEmail,
                job_title: 'Executive Team',
                company_name: org.name || cleanDomain,
              },
              outreach_activity_list: [],
            });
          }
        } catch (enrollErr) {
          console.warn(`Could not auto-enroll organization #${org.id} (${companyEmail}):`, enrollErr);
        }
      }
    }
  } catch (orgErr) {
    console.error('Auto-discovery from aa_s_organizations failed:', orgErr);
  }

  return enrolledLeads;
}

/**
 * Queries existing leads, falling back to auto-discovering from people or organizations if needed.
 */
async function fetchOrDiscoverLeads(campaign: any, queryLimit: number): Promise<any[]> {
  const targetIndustryNames = campaign.target_organization_id
    ? []
    : (campaign.target_industry_list || [])
      .map((ti: any) => ti.industry?.name || ti.name)
      .filter(Boolean)
      .filter((n: string) => n.toLowerCase() !== 'all');

  if (campaign.target_organization_id) {
    console.log(`fetchOrDiscoverLeads filtering by target_organization_id #${campaign.target_organization_id}`);
  } else {
    console.log('fetchOrDiscoverLeads targetIndustryNames', targetIndustryNames);
  }

  let leads = await fetchExistingLeads(campaign, targetIndustryNames, queryLimit);
  console.log(`processSingleCampaign #${campaign.id} [${campaign.name}] existing leads count:`, leads.length);

  // Auto-discover and enroll decision makers (aa_s_people) if no leads exist in aa_s_leads
  if (leads.length === 0) {
    console.log(`No existing leads found in aa_s_leads for campaign #${campaign.id}. Auto-discovering contacts from aa_s_people...`);
    const peopleLeads = await autoEnrollEligiblePeople(campaign, targetIndustryNames, queryLimit);
    leads.push(...peopleLeads);

    // If still no leads (e.g. no records in aa_s_people), auto-discover from Companies/Organizations (aa_s_organizations)
    if (leads.length === 0) {
      console.log(`No people found in aa_s_people. Auto-discovering company emails from Organizations (aa_s_organizations)...`);
      const orgLeads = await autoEnrollEligibleOrganizations(campaign, targetIndustryNames, queryLimit);
      leads.push(...orgLeads);
    }
  }

  return leads;
}

/**
 * Sets up SMTP Transporter once per campaign batch.
 */
function createSmtpTransporter(config: any) {
  if (config?.password && (config.provider === 'google_workspace' || config.provider === 'smtp')) {
    return nodemailer.createTransport({
      host: config.host || (config.provider === 'google_workspace' ? 'smtp.gmail.com' : 'localhost'),
      port: config.port || (config.provider === 'google_workspace' ? 465 : 587),
      secure: config.secure ?? (config.port === 465),
      auth: {
        user: config.username || config.from_email,
        pass: config.password,
      },
      connectionTimeout: 8000,
    });
  }
  return null;
}

/**
 * Evaluates whether a lead is eligible for the next sequence step dispatch.
 */
function evaluateLeadEligibility(
  lead: any,
  campaign: any,
  steps: any[],
  todayStr: string,
  forceWindow?: boolean
): {
  eligible: boolean;
  recipientEmail?: string;
  targetStep?: any;
  completedStepsCount?: number;
  skipLog?: CronDispatchLog;
} {
  const recipientEmail = 'rkheele@gmail.com';//lead.person?.email || '';
  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { eligible: false };
  }

  const activities: any[] = lead.outreach_activity_list || [];

  // Check Stop on Reply / Meeting Rules
  const hasReplied = activities.some((a: any) => a.status === 'Replied' || a.status === 'Meeting Booked' || a.status === 'Interested');
  if (hasReplied && campaign.stop_on_reply) {
    return {
      eligible: false,
      skipLog: {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        lead_id: lead.id,
        lead_email: recipientEmail,
        status: 'skipped',
        reason: 'Lead has already replied or booked a meeting (stop_on_reply active)',
      },
    };
  }

  // Determine Next Step in Sequence
  const completedStepsCount = activities.filter((a: any) => a.status === 'Sent' || a.status === 'Delivered').length;
  if (completedStepsCount >= steps.length) {
    return { eligible: false }; // Completed full sequence
  }

  const targetStep = steps[completedStepsCount];
  if (!targetStep) {
    return { eligible: false };
  }

  // Check Due Date
  if (completedStepsCount > 0 && lead.next_followup && !forceWindow) {
    const nextFollowupDate = String(lead.next_followup).split('T')[0];
    if (nextFollowupDate > todayStr) {
      return { eligible: false }; // Not due yet
    }
  }

  return {
    eligible: true,
    recipientEmail,
    targetStep,
    completedStepsCount,
  };
}

/**
 * Dispatches an email for a sequence step via SMTP or simulated provider with pacing jitter.
 */
async function dispatchStepEmail({
  transporter,
  config,
  accountCompany,
  lead,
  targetStep,
  campaignId,
  completedStepsCount,
  recipientEmail,
  emailsSentSoFar,
}: {
  transporter: any;
  config: any;
  accountCompany?: any;
  lead: any;
  targetStep: any;
  campaignId: number;
  completedStepsCount: number;
  recipientEmail: string;
  emailsSentSoFar: number;
}): Promise<{ success: boolean; subject: string; body: string; error?: string }> {
  const companyName = config?.company_name || accountCompany?.name || '';

  // Construct sender context from connected mailbox config, account company, and lead assignment
  const senderContext: TemplateContext = {
    senderName: config?.from_name || lead?.assigned_user || 'Sales Team',
    senderTitle: config?.sender_title || (lead?.assigned_user_obj as any)?.title || '',
    senderCompany: companyName,
    senderEmail: config?.from_email,
  };

  // Interpolate Subject & Body
  const subject = interpolateTemplate(targetStep.subject || `Outreach from ${senderContext.senderName}`, lead, senderContext);
  const body = interpolateTemplate(targetStep.preview || '', lead, senderContext);

  // Production deliverability safeguard: Human-like inter-email jitter delay
  // Prevents sudden burst spikes that trigger provider rate-limits or account bans (Google/M365)
  if (emailsSentSoFar > 0) {
    const jitterMs = Math.floor(Math.random() * 3000) + 2000; // 2s - 5s pacing
    await new Promise((resolve) => setTimeout(resolve, jitterMs));
  }

  if (transporter) {
    try {
      const fromDisplay = config.from_name || senderContext.senderName || companyName || '';
      // const trackingBaseUrl = "https://ae39-129-232-117-242.ngrok-free.app";
      const trackingBaseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        'https://ysalespro.com';

      const trackedHtml = injectTrackingToEmailHtml(body, {
        leadId: lead?.id ? Number(lead.id) : undefined,
        campaignId: campaignId ? Number(campaignId) : undefined,
        baseUrl: trackingBaseUrl,
      });

      await transporter.sendMail({
        from: fromDisplay ? `"${fromDisplay}" <${config.from_email}>` : config.from_email,
        to: `"${lead.person_name || lead.person?.name || ''}" <${recipientEmail}>`,
        subject,
        text: body.replace(/<[^>]*>?/gm, ''),
        html: trackedHtml,
        replyTo: config.reply_to || config.from_email,
        headers: {
          'X-Outreach': 'true',
          'X-Campaign-Id': String(campaignId),
          'X-Lead-Id': String(lead.id),
          'X-Step-Number': String(targetStep.step_number || completedStepsCount + 1),
        },
      });
      return { success: true, subject, body };
    } catch (err: any) {
      return { success: false, subject, body, error: err?.message || 'SMTP delivery failed' };
    }
  }

  // Mock or simulated dispatch if credentials are not filled yet
  return { success: true, subject, body };
}

/**
 * Records outreach activity, increments account sent count, and advances lead follow-up state.
 */
async function recordOutreachActivityAndProgress({
  campaign,
  account,
  lead,
  targetStep,
  steps,
  completedStepsCount,
  recipientEmail,
  subject,
  body,
  todayStr,
}: {
  campaign: any;
  account: any;
  lead: any;
  targetStep: any;
  steps: any[];
  completedStepsCount: number;
  recipientEmail: string;
  subject: string;
  body: string;
  todayStr: string;
}): Promise<void> {
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

  // 2. Increment Mailbox counter
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
    // 1. Fetch Campaign Details
    const campaign = await fetchCampaignForCron(campaignId);
    if (!campaign) {
      return { emailsSent: 0, logs: [{ campaign_id: campaignId, campaign_name: 'Unknown', status: 'skipped', reason: 'Campaign not found' }] };
    }

    // console.log('processSingleCampaign campaign', campaign);

    if (campaign.status !== 'Active' && !options.forceWindow) {
      return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'skipped', reason: `Campaign status is ${campaign.status}` }] };
    }

    // 2. Check Schedule Window
    if (!options.forceWindow) {
      const windowCheck = await isCampaignInSendingWindow(campaign);
      console.log('processSingleCampaign campaign windowCheck', windowCheck);
      if (!windowCheck.inWindow) {
        return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'window_closed', reason: windowCheck.reason }] };
      }
    }

    const steps: any[] = campaign.sequence_step_list || [];
    console.log('processSingleCampaign campaign sequence_step_list', steps.length);
    if (steps.length === 0) {
      return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'skipped', reason: 'No active sequence steps defined' }] };
    }

    // 3. Resolve Connected Sending Mailbox & Quota
    const mailbox = await resolveSendingMailboxAndQuota(campaign.account_company_id);
    if (!mailbox.account || !mailbox.config) {
      return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'failed', reason: mailbox.errorReason || 'Mailbox resolution failed' }] };
    }
    if (mailbox.remainingQuota <= 0) {
      return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'skipped', reason: mailbox.errorReason || 'Quota exhausted' }] };
    }

    // 4. Resolve Account Company
    const accountCompany = campaign.account_company_id
      ? await getAccountCompanyById(campaign.account_company_id).catch(() => null)
      : null;

    console.log('processSingleCampaign campaign', campaign);

    // if (true) {
    //   return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'skipped', reason: 'No active sequence steps defined' }] };
    // }

    // 5. Query or Auto-Discover Eligible Leads
    const queryLimit = typeof options.maxBatch === 'number' && options.maxBatch > 100 ? options.maxBatch * 2 : 10000;
    const leads = await fetchOrDiscoverLeads(campaign, queryLimit);

    const maxBatch = Math.min(options.maxBatch || mailbox.remainingQuota, mailbox.remainingQuota);
    const transporter = createSmtpTransporter(mailbox.config);
    const todayStr = new Date().toISOString().split('T')[0];

    console.log('processSingleCampaign leads', leads);

    // if (true) {
    //   return { emailsSent: 0, logs: [{ campaign_id: campaign.id, campaign_name: campaign.name, status: 'skipped', reason: 'No active sequence steps defined' }] };
    // }

    // 6. Evaluate and Dispatch to Each Eligible Lead
    for (const lead of leads) {
      if (emailsSent >= maxBatch) break;

      const eligibility = evaluateLeadEligibility(lead, campaign, steps, todayStr, options.forceWindow);
      if (eligibility.skipLog) {
        logs.push(eligibility.skipLog);
      }
      if (!eligibility.eligible || !eligibility.targetStep || !eligibility.recipientEmail) {
        continue;
      }

      const { targetStep, recipientEmail, completedStepsCount = 0 } = eligibility;

      const sendResult = await dispatchStepEmail({
        transporter,
        config: mailbox.config,
        accountCompany,
        lead,
        targetStep,
        campaignId: campaign.id,
        completedStepsCount,
        recipientEmail,
        emailsSentSoFar: emailsSent,
      });

      if (sendResult.success) {
        await recordOutreachActivityAndProgress({
          campaign,
          account: mailbox.account,
          lead,
          targetStep,
          steps,
          completedStepsCount,
          recipientEmail,
          subject: sendResult.subject,
          body: sendResult.body,
          todayStr,
        });

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
          reason: sendResult.error,
        });
      }
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

    console.log('activeCampaigns', activeCampaigns.length)

    for (const c of activeCampaigns) {
      const windowCheck = await isCampaignInSendingWindow(c);
      console.log('activeCampaigns windowCheck', windowCheck)
      console.log('activeCampaigns forceWindow', options.forceWindow)
      if (windowCheck.inWindow || options.forceWindow) {
        campaignsInWindow++;
        const { emailsSent, logs } = await processSingleCampaign(c.id, {
          forceWindow: options.forceWindow,
          maxBatch: options.maxBatchPerCampaign,
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
