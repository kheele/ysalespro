'use server';

import { listGraphQL, insertGraphQL, updateGraphQL } from "@/graphql";
import { LeadStage, LeadTemperature, Lead } from "@/lib/types";
import { GetLeadsParams } from "@/lib/types_params";
import { toTitleCase } from "@/lib/utils";
import { getAccountCompanyIdFromClaims } from "@/lib/auth-utils";

function mapDbLead(l: any): Lead {
  if (!l) return l;
  const stage = (l.stage || 'Cold') as LeadStage;
  const temp = (l.lead_temperature || (stage === 'Hot' ? 'Hot' : stage === 'Warm' ? 'Warm' : 'Cold')) as LeadTemperature;

  return {
    id: l.id,
    account_company_id: l.account_company_id,
    person_id: l.person_id,
    contact_name: l.person_name || l.person?.name || "Contact",
    person_name: l.person_name || l.person?.name || "Contact",
    contact_title: l.person?.job_title || "Decision Maker",
    contact_email: l.person?.email || "",
    contact_avatar: l.person?.avatar_url,
    organization_id: l.person_id || l.id,
    organization_name: l.company_name || "Company",
    company_name: l.company_name || "Company",
    industry: toTitleCase(l.industry || "Technology"),
    stage,
    pipeline_stage: stage,
    temperature: temp,
    lead_temperature: temp,
    score: l.lead_score ?? 0,
    lead_score: l.lead_score ?? 0,
    deal_value: 50000,
    probability: stage === 'Hot' ? 80 : stage === 'Warm' ? 50 : 25,
    last_contact: l.last_contact ? new Date(l.last_contact).toLocaleDateString('en-ZA') : undefined,
    next_followup: l.next_followup ? new Date(l.next_followup).toLocaleDateString('en-ZA') : undefined,
    followup_count: l.followup_count || 0,
    assigned_to: l.assigned_user || "Sales Team",
    assigned_user: l.assigned_user || "Sales Team",
    created_at: l.created_at,
    updated_at: l.updated_at,
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

    if (params?.temperature && params.temperature !== ('all' as any)) {
      whereConditions.push({ lead_temperature: { _eq: params.temperature } });
    }

    if (params?.assigned_to && params.assigned_to !== 'all') {
      whereConditions.push({ assigned_user: { _eq: params.assigned_to } });
    }

    if (params?.organization_name) {
      whereConditions.push({ company_name: { _eq: params.organization_name } });
    }

    const where = { _and: whereConditions };

    const query = `
      query GetLeads($where: aa_s_leads_bool_exp) {
        aa_s_leads(
          where: $where
          order_by: { lead_score: desc }
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
    const temp = newStage === "Hot" || newStage === "Customer" ? "Hot"
      : newStage === "Cold" || newStage === "Lost" ? "Cold"
        : "Warm";

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
  input: Partial<Lead>
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
          person_name
          company_name
          industry
          stage
          lead_temperature
          lead_score
          assigned_user
          created_at
        }
      }
    `;

    const res = await insertGraphQL({
      mutation,
      input: {
        account_company_id: companyId,
        person_name: input.contact_name || input.person_name || "New Contact",
        company_name: input.organization_name || input.company_name || "Target Company",
        industry: input.industry || "Technology",
        stage: input.pipeline_stage || input.stage || "Cold",
        lead_temperature: input.temperature || input.lead_temperature || "Cold",
        lead_score: input.score ?? input.lead_score ?? 50,
        assigned_user: input.assigned_to || input.assigned_user || "Unassigned",
      },
      operationName: "CreateLead",
    });

    return res ? mapDbLead(res) : null;
  } catch (err) {
    console.error("Hasura createLeadActionByToken error:", err);
    throw err;
  }
}
