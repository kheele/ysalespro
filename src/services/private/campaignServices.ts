'use server';

import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL } from "@/graphql";
import * as industryServices from "@/services/public/industryServices";
import { getAccountCompanyIdFromClaims } from "@/lib/auth-utils";
import {
  CampaignStatus,
  SequenceStep,
  CampaignRules,
  CampaignSchedule,
  CampaignAudience,
  Campaign,
} from '@/lib/types';
import {
  DEFAULT_SEQUENCE,
  DEFAULT_RULES,
  DEFAULT_SCHEDULE,
} from '@/lib/constants';

export async function getDefaultSequenceAction(): Promise<SequenceStep[]> {
  return JSON.parse(JSON.stringify(DEFAULT_SEQUENCE));
}

export async function getDefaultRulesAction(): Promise<CampaignRules> {
  return { ...DEFAULT_RULES };
}

export async function getDefaultScheduleAction(): Promise<CampaignSchedule> {
  return { ...DEFAULT_SCHEDULE };
}

function mapDbCampaign(c: any): Campaign {
  if (!c) return c;

  const sequenceSteps: SequenceStep[] = Array.isArray(c.sequence_step_list) && c.sequence_step_list.length > 0
    ? c.sequence_step_list.map((st: any, idx: number) => ({
        id: st.id || `step-${idx + 1}`,
        day: st.day ?? (idx * 2),
        step_number: st.step_number ?? (idx + 1),
        type: st.type || 'Introduction',
        subject: st.subject || '',
        body: st.preview || '',
        enabled: st.is_active ?? true,
      }))
    : DEFAULT_SEQUENCE;

  const industries: string[] = Array.isArray(c.target_industry_list) && c.target_industry_list.length > 0
    ? c.target_industry_list.map((ti: any) => ti.industry?.name || ti.industry_name || (ti.industry_id ? `Industry #${ti.industry_id}` : "All")).filter(Boolean)
    : ["All"];

  const targetCompanies = c.target_companies_count ?? 0;
  const targetPeople = c.target_people_count ?? 0;
  const totalContacts = c.total_contacts ?? (targetCompanies + targetPeople || 100);

  const scheduleObj: CampaignSchedule = {
    send_days: Array.isArray(c.send_days) && c.send_days.length > 0 ? c.send_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    send_time_from: c.send_time_from || '09:00',
    send_time_to: c.send_time_to || '17:00',
    timezone: c.timezone || 'SAST (UTC+2 - Johannesburg / South Africa)',
    start_date: c.start_date ? String(c.start_date).split('T')[0] : (c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
  };

  const audience: CampaignAudience = {
    industries,
    companies: ["All"],
    people: ["All"],
    estimated_contacts: totalContacts,
  };

  return {
    id: c.id,
    account_company_id: c.account_company_id,
    name: c.name || "Campaign",
    description: c.description || "",
    status: (c.status || "Draft") as CampaignStatus,
    target_companies_count: targetCompanies,
    target_people_count: targetPeople,
    total_contacts: totalContacts,
    emails_sent: c.emails_sent ?? 0,
    open_rate: c.open_rate ?? 0,
    reply_rate: c.reply_rate ?? 0,
    meetings_booked: c.meetings_booked ?? 0,
    unsubscribes: c.unsubscribes ?? 0,
    stop_on_reply: c.stop_on_reply ?? true,
    stop_on_meeting: c.stop_on_meeting ?? true,
    update_lead_status: c.update_lead_status ?? true,
    create_followup_task: c.create_followup_task ?? true,
    schedule: scheduleObj,
    audience,
    sequence: sequenceSteps,
    sequence_steps: c.sequence_step_list || [],
    target_industry_list: c.target_industry_list || [],
    outreach_activity_list: c.outreach_activity_list || [],
    start_date: c.start_date ? String(c.start_date).split('T')[0] : (c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    end_date: c.end_date || undefined,
    created_by: c.created_by || "Admin",
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
}

export async function getCampaignsActionByToken(
  token: string,
  params?: { search?: string; status?: CampaignStatus | 'all' }
): Promise<Campaign[]> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const whereConditions: Record<string, any>[] = [
      { account_company_id: { _eq: companyId } }
    ];

    if (params?.search) {
      const s = `%${params.search}%`;
      whereConditions.push({
        _or: [
          { name: { _ilike: s } },
          { description: { _ilike: s } },
        ],
      });
    }

    if (params?.status && params.status !== "all") {
      whereConditions.push({ status: { _eq: params.status } });
    }

    const where = { _and: whereConditions };

    const q = `
      query GetCampaigns($where: aa_s_campaigns_bool_exp) {
        aa_s_campaigns(where: $where, order_by: [{ created_at: desc }]) {
          id
          account_company_id
          name
          description
          status
          send_time_from
          send_time_to
          timezone
          send_days
          start_date
          end_date
          stop_on_reply
          stop_on_meeting
          update_lead_status
          create_followup_task
          target_companies_count
          target_people_count
          total_contacts
          emails_sent
          open_rate
          reply_rate
          meetings_booked
          unsubscribes
          created_at
          updated_at
          sequence_step_list {
            id
            day
            step_number
            type
            subject
            preview
            is_active
          }
          target_industry_list {
            id
            industry_id
            industry {
              id
              name
            }
          }
          outreach_activity_list {
            id
            lead_id
            date
            channel
            lead_name
            company_name
            subject_or_type
            status
            response_preview
            next_followup
            created_at
          }
        }
      }
    `;
    const res = await listGraphQL({ query: q, variables: { where }, operationName: "GetCampaigns" });
    const list = Array.isArray(res) ? res : [];
    return list.map(mapDbCampaign);
  } catch (err) {
    console.error("Hasura getCampaignsActionByToken error:", err);
    throw err;
  }
}

export async function getCampaignByIdActionByToken(
  token: string,
  id: string | number
): Promise<Campaign | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const q = `
      query GetCampaignById($id: Int!) {
        aa_s_campaigns_by_pk(id: $id) {
          id
          account_company_id
          name
          description
          status
          send_time_from
          send_time_to
          timezone
          send_days
          start_date
          end_date
          stop_on_reply
          stop_on_meeting
          update_lead_status
          create_followup_task
          target_companies_count
          target_people_count
          total_contacts
          emails_sent
          open_rate
          reply_rate
          meetings_booked
          unsubscribes
          created_at
          updated_at
          sequence_step_list {
            id
            day
            step_number
            type
            subject
            preview
            is_active
          }
          target_industry_list {
            id
            industry_id
            industry {
              id
              name
            }
          }
          outreach_activity_list {
            id
            lead_id
            date
            channel
            lead_name
            company_name
            subject_or_type
            status
            response_preview
            next_followup
            created_at
          }
        }
      }
    `;
    const res = await getGraphQLOne({ query: q, variables: { id: Number(id) }, operationName: "GetCampaignById" });
    if (!res) return null;
    return mapDbCampaign(res);
  } catch (err) {
    console.error("Hasura getCampaignByIdActionByToken error:", err);
    throw err;
  }
}

export async function createCampaignActionByToken(
  token: string,
  input: Partial<Campaign>
): Promise<Campaign | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation CreateCampaign($object: aa_s_campaigns_insert_input!) {
        insert_aa_s_campaigns_one(object: $object) {
          id
          account_company_id
          name
          description
          status
          send_time_from
          send_time_to
          timezone
          send_days
          start_date
          end_date
          stop_on_reply
          stop_on_meeting
          update_lead_status
          create_followup_task
          target_companies_count
          target_people_count
          total_contacts
          emails_sent
          open_rate
          reply_rate
          meetings_booked
          unsubscribes
          created_at
          updated_at
          sequence_step_list {
            id
            day
            step_number
            type
            subject
            preview
            is_active
          }
          target_industry_list {
            id
            industry_id
            industry {
              id
              name
            }
          }
          outreach_activity_list {
            id
            lead_id
            date
            channel
            lead_name
            company_name
            subject_or_type
            status
            response_preview
            next_followup
            created_at
          }
        }
      }
    `;

    const sched = (input.schedule as CampaignSchedule) || DEFAULT_SCHEDULE;

    const object: Record<string, any> = {
      account_company_id: companyId,
      name: input.name || "New Campaign",
      description: input.description || "",
      status: input.status || "Draft",
      send_time_from: sched.send_time_from || "09:00",
      send_time_to: sched.send_time_to || "17:00",
      timezone: sched.timezone || "SAST (UTC+2 - Johannesburg / South Africa)",
      send_days: sched.send_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      start_date: input.start_date || sched.start_date || new Date().toISOString().split('T')[0],
      stop_on_reply: input.rules?.stop_on_reply ?? true,
      stop_on_meeting: input.rules?.stop_on_meeting_booked ?? true,
      update_lead_status: input.rules?.update_lead_status ?? true,
      create_followup_task: input.rules?.create_follow_up_task ?? true,
    };

    if (Array.isArray(input.sequence) && input.sequence.length > 0) {
      object.sequence_step_list = {
        data: input.sequence.map((stepItem, idx) => ({
          day: stepItem.day ?? (idx * 2),
          step_number: idx + 1,
          type: stepItem.type || 'Introduction',
          subject: stepItem.subject || '',
          preview: stepItem.body || '',
          is_active: stepItem.enabled ?? true,
        })),
      };
    }

    if (Array.isArray(input.audience?.industries) && input.audience.industries.length > 0) {
      const selectedInds = input.audience.industries.filter(i => i && i !== "All");
      if (selectedInds.length > 0) {
        try {
          const { industries: allInds } = await industryServices.getIndustries({ limit: 100 });
          const indMap = new Map(allInds.map(i => [i.name?.toLowerCase(), i.id]));
          const targetIndData = selectedInds
            .map(indName => {
              const matchedId = indMap.get(indName.toLowerCase());
              return matchedId ? { industry_id: Number(matchedId) } : null;
            })
            .filter(Boolean);

          if (targetIndData.length > 0) {
            object.target_industry_list = {
              data: targetIndData,
            };
          }
        } catch (indErr) {
          console.warn("Could not resolve target industry IDs for campaign insertion:", indErr);
        }
      }
    }

    const res = await insertGraphQL({
      mutation,
      input: object,
      operationName: "CreateCampaign",
    });

    if (!res) return null;
    return mapDbCampaign(res);
  } catch (err) {
    console.error("Hasura createCampaignActionByToken error:", err);
    throw err;
  }
}

export async function updateCampaignStatusActionByToken(
  token: string,
  id: string | number,
  status: CampaignStatus
): Promise<Campaign | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation UpdateCampaignStatus($id: Int!, $status: String!) {
        update_aa_s_campaigns_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
          id
          account_company_id
          name
          description
          status
          send_time_from
          send_time_to
          timezone
          send_days
          start_date
          end_date
          stop_on_reply
          stop_on_meeting
          update_lead_status
          create_followup_task
          target_companies_count
          target_people_count
          total_contacts
          emails_sent
          open_rate
          reply_rate
          meetings_booked
          unsubscribes
          created_at
          updated_at
          sequence_step_list {
            id
            day
            step_number
            type
            subject
            preview
            is_active
          }
          target_industry_list {
            id
            industry_id
            industry {
              id
              name
            }
          }
          outreach_activity_list {
            id
            lead_id
            date
            channel
            lead_name
            company_name
            subject_or_type
            status
            response_preview
            next_followup
            created_at
          }
        }
      }
    `;
    const res = await updateGraphQL({
      mutation,
      id: Number(id),
      attrs: { status },
      operationName: "UpdateCampaignStatus",
    });
    if (!res) return null;
    return mapDbCampaign(res);
  } catch (err) {
    console.error("Hasura updateCampaignStatusActionByToken error:", err);
    throw err;
  }
}
