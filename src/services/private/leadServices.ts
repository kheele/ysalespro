'use server';

import { listGraphQL, insertGraphQL, updateGraphQL } from "@/graphql";
import { LeadStage, LeadTemperature, Lead } from "@/lib/types";
import { GetLeadsParams } from "@/lib/types_params";
import { toTitleCase } from "@/lib/utils";
import { getAccountCompanyIdFromClaims } from "@/lib/auth-utils";

function mapDbLead(l: any): Lead {
  if (!l) return null as any;

  return {
    id: l.id,
    account_company_id: l.account_company_id,
    person_id: l.person_id ?? null,
    person_name: l.person_name ?? null,
    company_name: l.company_name ?? null,
    industry: toTitleCase(l.industry),
    lead_temperature: l.lead_temperature ?? 'COLD',
    lead_score: l.lead_score ?? 0,
    stage: l.stage ?? 'Cold',
    last_contact: l.last_contact ?? null,
    next_followup: l.next_followup ?? null,
    assigned_user: l.assigned_user ?? null,
    followup_count: l.followup_count ?? 0,
    created_at: l.created_at ?? null,
    updated_at: l.updated_at ?? null,
    person: l.person ? {
      id: l.person.id,
      name: l.person.name,
      job_title: l.person.job_title,
      company_name: l.person.company_name,
      email: l.person.email,
      phone: l.person.phone,
      linkedin_url: l.person.linkedin_url,
      score: l.person.score,
    } : null,
    account_company: l.account_company ?? null,
    followup_item_list: l.followup_item_list ?? [],
    outreach_activity_list: l.outreach_activity_list ?? [],
    task_list: l.task_list ?? [],
  };
}

export async function getLeadsActionByToken(
  token: string,
  params?: GetLeadsParams
): Promise<Lead[]> {
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
          { person_name: { _ilike: s } },
          { company_name: { _ilike: s } },
          { industry: { _ilike: s } },
        ],
      });
    }

    if (params?.stage && params.stage !== ('all' as any)) {
      whereConditions.push({ stage: { _eq: params.stage } });
    }

    const temp = params?.lead_temperature;
    if (temp && temp !== ('all' as any)) {
      whereConditions.push({ lead_temperature: { _eq: temp } });
    }

    const assigned = params?.assigned_user;
    if (assigned && assigned !== 'all') {
      whereConditions.push({ assigned_user: { _eq: assigned } });
    }

    const companyName = params?.company_name;
    if (companyName) {
      whereConditions.push({ company_name: { _eq: companyName } });
    }

    const where = { _and: whereConditions };

    const query = `
      query GetLeads($where: aa_s_leads_bool_exp) {
        aa_s_leads(
          where: $where
          order_by: { lead_score: desc_nulls_last, id: desc }
        ) {
          id
          account_company_id
          person_id
          person_name
          company_name
          industry
          lead_temperature
          lead_score
          stage
          last_contact
          next_followup
          assigned_user
          followup_count
          created_at
          updated_at
          person {
            id
            name
            job_title
            company_name
            email
            phone
            linkedin_url
            score
          }
        }
      }
    `;

    const res = await listGraphQL({
      query,
      variables: { where },
      operationName: "GetLeads",
    });

    const list = Array.isArray(res) ? res : [];
    return list.map(mapDbLead);
  } catch (err) {
    console.error("Hasura getLeadsActionByToken error:", err);
    throw err;
  }
}

export async function updateLeadStageActionByToken(
  token: string,
  id: string | number,
  newStage: LeadStage
): Promise<Lead | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const parsedId = Number(id);
    const temp = newStage === "Hot" || newStage === "Customer" ? "HOT"
      : newStage === "Cold" || newStage === "Lost" ? "COLD"
        : "WARM";

    const mutation = `
      mutation UpdateLeadStage($id: Int!, $stage: String!, $lead_temperature: String!) {
        update_aa_s_leads_by_pk(
          pk_columns: { id: $id }
          _set: { stage: $stage, lead_temperature: $lead_temperature }
        ) {
          id
          account_company_id
          person_id
          person_name
          company_name
          industry
          lead_temperature
          lead_score
          stage
          last_contact
          next_followup
          assigned_user
          followup_count
          created_at
          updated_at
        }
      }
    `;

    const res = await updateGraphQL({
      mutation,
      id: parsedId,
      attrs: {
        stage: newStage,
        lead_temperature: temp,
      },
      operationName: "UpdateLeadStage",
    });

    return res ? mapDbLead(res) : null;
  } catch (err) {
    console.error("Hasura updateLeadStageActionByToken error:", err);
    throw err;
  }
}

export async function updateLeadStatusActionByToken(
  token: string,
  id: string | number,
  newStatus: LeadTemperature
): Promise<Lead | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const parsedId = Number(id);
    const mutation = `
      mutation UpdateLeadStatus($id: Int!, $lead_temperature: String!) {
        update_aa_s_leads_by_pk(
          pk_columns: { id: $id }
          _set: { lead_temperature: $lead_temperature }
        ) {
          id
          account_company_id
          person_id
          person_name
          company_name
          industry
          lead_temperature
          lead_score
          stage
          last_contact
          next_followup
          assigned_user
          followup_count
          created_at
          updated_at
        }
      }
    `;

    const res = await updateGraphQL({
      mutation,
      id: parsedId,
      attrs: {
        lead_temperature: newStatus,
      },
      operationName: "UpdateLeadStatus",
    });

    return res ? mapDbLead(res) : null;
  } catch (err) {
    console.error("Hasura updateLeadStatusActionByToken error:", err);
    throw err;
  }
}

export async function createLeadActionByToken(
  token: string,
  input: {
    person_name?: string | null;
    person_id?: number | null;
    company_name?: string | null;
    industry?: string | null;
    stage?: string | null;
    lead_temperature?: string | null;
    lead_score?: number | null;
    assigned_user?: string | null;
    next_followup?: string | null;
    last_contact?: string | null;
  }
): Promise<Lead | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation CreateLead($object: aa_s_leads_insert_input!) {
        insert_aa_s_leads_one(object: $object) {
          id
          account_company_id
          person_id
          person_name
          company_name
          industry
          stage
          lead_temperature
          lead_score
          assigned_user
          next_followup
          last_contact
          created_at
          updated_at
        }
      }
    `;

    const res = await insertGraphQL({
      mutation,
      input: {
        account_company_id: companyId,
        person_id: input.person_id ?? null,
        person_name: input.person_name || null,
        company_name: input.company_name || null,
        industry: input.industry || null,
        stage: input.stage || "Cold",
        lead_temperature: input.lead_temperature || "COLD",
        lead_score: input.lead_score ?? 0,
        assigned_user: input.assigned_user || null,
        next_followup: input.next_followup || null,
        last_contact: input.last_contact || null,
      },
      operationName: "CreateLead",
    });

    return res ? mapDbLead(res) : null;
  } catch (err) {
    console.error("Hasura createLeadActionByToken error:", err);
    throw err;
  }
}
