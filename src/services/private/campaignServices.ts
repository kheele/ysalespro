'use server';

import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL, deleteGraphQL, sendGraphQL } from "@/graphql";
import * as industryServices from "@/services/public/industryServices";
import { getAccountCompanyIdFromClaims } from "@/lib/auth-utils";
import {
  CampaignStatus,
  SequenceStep,
  SequenceStepType,
  CampaignRules,
  CampaignSchedule,
  CampaignAudience,
  Campaign,
} from '@/lib/types';
import { getCompanySettingsActionByToken } from './settingsService';
import { prepareCampaignForDuplication } from '@/lib/campaign-utils';

export async function getDefaultSequenceAction(token?: string): Promise<SequenceStep[]> {
  if (token) {
    try {
      const settings = await getCompanySettingsActionByToken(token);
      if (settings?.default_sequence && settings.default_sequence.length > 0) {
        return settings.default_sequence;
      }
    } catch (e) {
      console.warn("Could not load sequence from company settings:", e);
    }
  }
  return [];
}

export async function getDefaultRulesAction(token?: string): Promise<CampaignRules> {
  if (token) {
    try {
      const settings = await getCompanySettingsActionByToken(token);
      if (settings?.default_rules) {
        return settings.default_rules;
      }
    } catch (e) {
      console.warn("Could not load rules from company settings:", e);
    }
  }
  return {
    stop_on_reply: true,
    stop_on_meeting_booked: true,
    update_lead_status: true,
    create_follow_up_task: true,
    exclude_customers: true,
    exclude_competitors: true,
    track_opens: true,
  };
}

export async function getDefaultScheduleAction(token?: string): Promise<CampaignSchedule> {
  if (token) {
    try {
      const settings = await getCompanySettingsActionByToken(token);
      if (settings?.default_schedule) {
        return settings.default_schedule;
      }
    } catch (e) {
      console.warn("Could not load schedule from company settings:", e);
    }
  }
  return {
    send_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    send_time_from: '09:00',
    send_time_to: '17:00',
    timezone: 'SAST (UTC+2 - Johannesburg / South Africa)',
    start_date: new Date().toISOString().split('T')[0],
  };
}

function normalizeSequenceStepType(type?: string): SequenceStepType {
  if (!type) return 'Email';
  if (type === 'Email' || type === 'Custom' || type.toLowerCase() === 'email') return 'Email';
  if (type === 'Follow-up' || type.toLowerCase() === 'follow-up' || type.toLowerCase() === 'followup') return 'Follow-up';
  if (type === 'Case Study' || type.toLowerCase() === 'case study') return 'Case Study';
  if (type === 'Final Message' || type.toLowerCase() === 'final message') return 'Final Message';
  return 'Email';
}

function mapDbCampaign(c: any): Campaign {
  if (!c) return c;

  const sequenceSteps: SequenceStep[] = Array.isArray(c.sequence_step_list) && c.sequence_step_list.length > 0
    ? c.sequence_step_list.map((st: any, idx: number) => ({
      id: st.id || st.step_number || (idx + 1),
      day: st.day ?? (idx * 2 + 1),
      step_number: st.step_number ?? (idx + 1),
      type: normalizeSequenceStepType(st.type),
      subject: st.subject || '',
      body: st.preview || '',
      enabled: st.is_active ?? true,
    }))
    : [];

  const rawIndustries: string[] = Array.isArray(c.target_industry_list) && c.target_industry_list.length > 0
    ? c.target_industry_list.map((ti: any) => ti.industry?.name || ti.industry_name || (ti.industry_id ? `Industry #${ti.industry_id}` : null)).filter(Boolean)
    : [];
  const industries = Array.from(new Set(rawIndustries));

  const targetCompanies = c.target_companies_count ?? 0;
  const targetPeople = c.target_people_count ?? 0;
  const totalContacts = c.total_contacts ?? (targetCompanies + targetPeople || 1);

  const scheduleObj: CampaignSchedule = {
    send_days: Array.isArray(c.send_days) && c.send_days.length > 0 ? c.send_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    send_time_from: c.send_time_from || '09:00',
    send_time_to: c.send_time_to || '17:00',
    timezone: c.timezone || 'SAST (UTC+2 - Johannesburg / South Africa)',
    start_date: c.start_date ? String(c.start_date).split('T')[0] : (c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
  };

  const audience: CampaignAudience = {
    industries,
    companies: c.target_organization_id ? [`Organization #${c.target_organization_id}`] : (industries.length > 0 ? ["All"] : ["Selected Account"]),
    people: industries.length > 0 ? ["All"] : ["Selected Decision Maker"],
    estimated_contacts: totalContacts,
  };

  return {
    id: c.id,
    account_company_id: c.account_company_id,
    target_organization_id: c.target_organization_id ?? null,
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
  params?: { search?: string; status?: CampaignStatus | 'all'; orgId?: string | number; org_id?: string | number } | string | number
): Promise<Campaign[]> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  const normalizedParams = typeof params === "object" && params !== null
    ? params
    : (typeof params === "string" || typeof params === "number")
      ? { orgId: params }
      : undefined;

  const targetOrgId = normalizedParams?.orgId ?? normalizedParams?.org_id;

  try {
    const whereConditions: Record<string, any>[] = [
      { account_company_id: { _eq: companyId } }
    ];

    if (targetOrgId) {
      whereConditions.push({
        target_organization_id: { _eq: Number(targetOrgId) }
      });
    }

    if (normalizedParams?.search) {
      const s = `%${normalizedParams.search}%`;
      whereConditions.push({
        _or: [
          { name: { _ilike: s } },
          { description: { _ilike: s } },
        ],
      });
    }

    if (normalizedParams?.status && normalizedParams.status !== "all") {
      whereConditions.push({ status: { _eq: normalizedParams.status } });
    }

    const where = { _and: whereConditions };

    const q = `
      query GetCampaigns($where: aa_s_campaigns_bool_exp) {
        aa_s_campaigns(where: $where, order_by: [{ created_at: desc }]) {
          id
          account_company_id
          target_organization_id
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
          sequence_step_list(distinct_on: [id], order_by: [{ id: asc }]) {
            id
            day
            step_number
            type
            subject
            preview
            is_active
          }
          target_industry_list(distinct_on: [industry_id], order_by: [{ industry_id: asc }]) {
            id
            industry_id
            industry {
              id
              name
            }
          }
          outreach_activity_list(distinct_on: [id], order_by: [{ id: desc }]) {
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
    return list.map(mapDbCampaign).filter(Boolean);
  } catch (err) {
    console.error("Hasura getCampaignsActionByToken error:", err);
    throw err;
  }
}

export async function getCampaignsByOrgIdActionByToken(
  token: string,
  orgId: string | number
): Promise<Campaign[]> {
  return getCampaignsActionByToken(token, { orgId });
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
          target_organization_id
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
          sequence_step_list(distinct_on: [id], order_by: [{ id: asc }]) {
            id
            day
            step_number
            type
            subject
            preview
            is_active
          }
          target_industry_list(distinct_on: [industry_id], order_by: [{ industry_id: asc }]) {
            id
            industry_id
            industry {
              id
              name
            }
          }
          outreach_activity_list(distinct_on: [id], order_by: [{ id: desc }]) {
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
          target_organization_id
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

    const sched = (typeof input.schedule === "object" && input.schedule !== null ? input.schedule : {}) as Partial<CampaignSchedule>;

    const object: Record<string, any> = {
      account_company_id: companyId,
      target_organization_id: input.target_organization_id ? Number(input.target_organization_id) : undefined,
      name: input.name || "New Campaign",
      description: input.description || "",
      status: input.status || "Draft",
      target_companies_count: input.target_companies_count ?? (Array.isArray(input.audience?.companies) ? input.audience.companies.length : 1),
      target_people_count: input.target_people_count ?? (Array.isArray(input.audience?.people) ? input.audience.people.length : 1),
      total_contacts: input.total_contacts ?? (Array.isArray(input.audience?.people) ? input.audience.people.length : 1),
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
          type: normalizeSequenceStepType(stepItem.type),
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

    // Attach campaign directly to selected company and person (instead of target industries)
    const targetCompany = Array.isArray(input.audience?.companies) && input.audience.companies.length > 0
      ? input.audience.companies[0]
      : "";
    const targetPeopleList = Array.isArray(input.audience?.people) && input.audience.people.length > 0
      ? input.audience.people
      : [];

    if (targetCompany || targetPeopleList.length > 0) {
      try {
        const peopleToProcess = targetPeopleList.length > 0 ? targetPeopleList : [targetCompany ? `${targetCompany} Contact` : "Decision Maker"];
        for (const personStr of peopleToProcess) {
          const personName = personStr.split(" (")[0]?.trim();
          let personObj: any = null;

          if (personName && !personName.endsWith("Contact") && personName !== "Decision Maker") {
            const findQ = `
              query FindPersonByName($name: String!) {
                aa_s_people(where: { name: { _ilike: $name } }, limit: 1) {
                  id
                  name
                  company_name
                  industry
                }
              }
            `;
            const found = await listGraphQL({
              query: findQ,
              variables: { name: personName },
              operationName: "FindPersonByName",
            });
            personObj = Array.isArray(found) && found.length > 0 ? found[0] : null;
          }

          const compName = personObj?.company_name || targetCompany || "Target Account";
          const pName = personObj?.name || (personName || "Decision Maker");

          // Auto-enroll lead into aa_s_leads
          let leadId: number | undefined = undefined;
          try {
            const insertLeadQ = `
              mutation EnrollCampaignLead($object: aa_s_leads_insert_input!) {
                insert_aa_s_leads_one(object: $object) {
                  id
                }
              }
            `;
            const leadRes = await insertGraphQL({
              mutation: insertLeadQ,
              operationName: "EnrollCampaignLead",
              input: {
                account_company_id: companyId,
                person_id: personObj?.id ? Number(personObj.id) : undefined,
                person_name: pName,
                company_name: compName,
                industry: personObj?.industry || undefined,
                stage: "Cold",
                lead_temperature: "COLD",
                lead_score: 50,
              },
            });
            if (leadRes?.id) {
              leadId = Number(leadRes.id);
            }
          } catch (leadErr) {
            console.warn("Lead already exists or failed to insert:", leadErr);
          }
        }
      } catch (enrollErr) {
        console.warn("Could not auto-enroll selected audience people into leads:", enrollErr);
      }
    }

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
      mutation UpdateCampaignStatus($id: Int!, $_set: aa_s_campaigns_set_input!) {
        update_aa_s_campaigns_by_pk(pk_columns: { id: $id }, _set: $_set) {
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

export async function updateCampaignActionByToken(
  token: string,
  id: string | number,
  input: Partial<Campaign>
): Promise<Campaign | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  const numId = Number(id);

  try {
    const sched = (typeof input.schedule === "object" && input.schedule !== null ? input.schedule : {}) as Partial<CampaignSchedule>;
    const attrs: Record<string, any> = {};

    if (input.name !== undefined) attrs.name = input.name;
    if (input.description !== undefined) attrs.description = input.description;
    if (input.status !== undefined) attrs.status = input.status;
    if (input.target_organization_id !== undefined) {
      attrs.target_organization_id = input.target_organization_id ? Number(input.target_organization_id) : null;
    }
    if (input.total_contacts !== undefined) attrs.total_contacts = input.total_contacts;
    if (input.target_companies_count !== undefined) attrs.target_companies_count = input.target_companies_count;
    if (input.target_people_count !== undefined) attrs.target_people_count = input.target_people_count;

    if (sched.send_time_from !== undefined) attrs.send_time_from = sched.send_time_from;
    if (sched.send_time_to !== undefined) attrs.send_time_to = sched.send_time_to;
    if (sched.timezone !== undefined) attrs.timezone = sched.timezone;
    if (sched.send_days !== undefined) attrs.send_days = sched.send_days;
    if (input.start_date !== undefined || sched.start_date !== undefined) {
      attrs.start_date = input.start_date || sched.start_date;
    }

    if (input.rules) {
      if (input.rules.stop_on_reply !== undefined) attrs.stop_on_reply = input.rules.stop_on_reply;
      if (input.rules.stop_on_meeting_booked !== undefined) attrs.stop_on_meeting = input.rules.stop_on_meeting_booked;
      if (input.rules.update_lead_status !== undefined) attrs.update_lead_status = input.rules.update_lead_status;
      if (input.rules.create_follow_up_task !== undefined) attrs.create_followup_task = input.rules.create_follow_up_task;
    }

    // 1. Update scalar fields
    if (Object.keys(attrs).length > 0) {
      const updateMutation = `
        mutation UpdateCampaignScalars($id: Int!, $_set: aa_s_campaigns_set_input!) {
          update_aa_s_campaigns_by_pk(pk_columns: { id: $id }, _set: $_set) {
            id
          }
        }
      `;
      await updateGraphQL({
        mutation: updateMutation,
        id: numId,
        attrs,
        operationName: "UpdateCampaignScalars",
      });
    }

    // 2. Update sequence steps if provided
    if (Array.isArray(input.sequence)) {
      const deleteStepsQ = `
        mutation DeleteOldSteps($campaignId: Int!) {
          delete_aa_s_campaign_sequence_steps(where: { campaign_id: { _eq: $campaignId } }) {
            affected_rows
          }
        }
      `;
      await sendGraphQL({
        mutation: deleteStepsQ,
        variables: { campaignId: numId },
        operationName: "DeleteOldSteps",
      });

      if (input.sequence.length > 0) {
        const stepObjects = input.sequence.map((stepItem, idx) => ({
          campaign_id: numId,
          day: stepItem.day ?? (idx * 2),
          step_number: idx + 1,
          type: normalizeSequenceStepType(stepItem.type),
          subject: stepItem.subject || '',
          preview: stepItem.body || '',
          is_active: stepItem.enabled ?? true,
        }));

        const insertStepsQ = `
          mutation InsertNewSteps($objects: [aa_s_campaign_sequence_steps_insert_input!]!) {
            insert_aa_s_campaign_sequence_steps(objects: $objects) {
              affected_rows
            }
          }
        `;
        await sendGraphQL({
          mutation: insertStepsQ,
          variables: { objects: stepObjects },
          operationName: "InsertNewSteps",
        });
      }
    }

    // 3. Update target industries if provided
    if (Array.isArray(input.audience?.industries)) {
      const deleteIndsQ = `
        mutation DeleteOldIndustries($campaignId: Int!) {
          delete_aa_s_campaign_target_industries(where: { campaign_id: { _eq: $campaignId } }) {
            affected_rows
          }
        }
      `;
      await sendGraphQL({
        mutation: deleteIndsQ,
        variables: { campaignId: numId },
        operationName: "DeleteOldIndustries",
      });

      const selectedInds = input.audience.industries.filter(i => i && i !== "All");
      if (selectedInds.length > 0) {
        try {
          const { industries: allInds } = await industryServices.getIndustries({ limit: 100 });
          const indMap = new Map(allInds.map(i => [i.name?.toLowerCase(), i.id]));
          const targetIndData = selectedInds
            .map(indName => {
              const matchedId = indMap.get(indName.toLowerCase());
              return matchedId ? { campaign_id: numId, industry_id: Number(matchedId) } : null;
            })
            .filter(Boolean);

          if (targetIndData.length > 0) {
            const insertIndsQ = `
              mutation InsertNewIndustries($objects: [aa_s_campaign_target_industries_insert_input!]!) {
                insert_aa_s_campaign_target_industries(objects: $objects) {
                  affected_rows
                }
              }
            `;
            await sendGraphQL({
              mutation: insertIndsQ,
              variables: { objects: targetIndData },
              operationName: "InsertNewIndustries",
            });
          }
        } catch (indErr) {
          console.warn("Could not update target industries:", indErr);
        }
      }
    }

    return await getCampaignByIdActionByToken(token, numId);
  } catch (err) {
    console.error("Hasura updateCampaignActionByToken error:", err);
    throw err;
  }
}

export async function deleteCampaignActionByToken(
  token: string,
  id: string | number
): Promise<boolean> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  const numId = Number(id);

  try {
    const cleanupQ = `
      mutation CleanupCampaignChildren($campaignId: Int!) {
        delete_aa_s_campaign_sequence_steps(where: { campaign_id: { _eq: $campaignId } }) {
          affected_rows
        }
        delete_aa_s_campaign_target_industries(where: { campaign_id: { _eq: $campaignId } }) {
          affected_rows
        }
        delete_aa_s_outreach_activities(where: { campaign_id: { _eq: $campaignId } }) {
          affected_rows
        }
      }
    `;
    await sendGraphQL({
      mutation: cleanupQ,
      variables: { campaignId: numId },
      operationName: "CleanupCampaignChildren",
    }).catch(err => {
      console.warn("Campaign cleanup of related rows warning:", err);
    });

    const deleteMainQ = `
      mutation DeleteCampaign($id: Int!) {
        delete_aa_s_campaigns_by_pk(id: $id) {
          id
        }
      }
    `;
    const res = await deleteGraphQL({
      mutation: deleteMainQ,
      id: numId,
      operationName: "DeleteCampaign",
    });

    return !!res;
  } catch (err) {
    console.error("Hasura deleteCampaignActionByToken error:", err);
    throw err;
  }
}

export async function duplicateCampaignActionByToken(
  token: string,
  id: string | number
): Promise<Campaign | null> {
  const existing = await getCampaignByIdActionByToken(token, id);
  if (!existing) {
    throw new Error(`Campaign #${id} not found`);
  }

  const clonedInput = prepareCampaignForDuplication(existing);
  return await createCampaignActionByToken(token, clonedInput);
}
