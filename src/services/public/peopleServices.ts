'use server';

import { sendGraphQL, getGraphQLOne } from "@/graphql";
import { DecisionMaker } from "@/lib/types";
import { toTitleCase } from "@/lib/utils";

const DECISION_MAKER_FIELDS = `
  id
  name
  job_title
  company_id
  company_name
  industry
  department
  seniority
  email
  phone
  location
  score
  linkedin_url
  created_at
  updated_at
  apollo_id
  country
  state
  city
  apollo_enriched
  has_email
  has_phone
  email_status
  company {
    id
    name
    primary_domain
    logo_url
  }
  lead_list(distinct_on: [id], order_by: [{ id: desc }]) {
    id
  }
  timeline_event_list(distinct_on: [id], order_by: [{ id: desc }]) {
    id
    person_id
    type
    title
    date
    details
    created_at
  }
`;

function mapDbDecisionMaker(p: any): DecisionMaker {
  if (!p) return null as any;

  const orgName = p.company_name || p.company?.name || "";
  const orgId = p.company_id || p.company?.id;
  const title = p.job_title || "";
  const computedLocation = p.location || [p.city, p.state, p.country].filter(Boolean).join(", ") || "";

  const timeline = (p.timeline_event_list || []).map((e: any) => ({
    id: e.id,
    type: e.type || "note",
    title: e.title || "",
    timestamp: e.date ? new Date(e.date).toLocaleDateString() : (e.created_at ? new Date(e.created_at).toLocaleDateString() : ""),
    description: e.details || "",
    date: e.date,
    details: e.details,
    created_at: e.created_at,
  }));

  return {
    id: p.id,
    apollo_id: p.apollo_id,
    name: p.name || "",
    job_title: p.job_title || title,
    title,
    company_id: orgId ? Number(orgId) : null,
    company_name: orgName,
    company: p.company,
    industry: toTitleCase(p.industry || p.company?.primary_industry || ""),
    department: p.department || "",
    seniority: p.seniority || "",
    email: p.email || "",
    phone: p.phone || "",
    location: computedLocation,
    score: p.score ?? 0,
    linkedin_url: p.linkedin_url || "",
    country: p.country ?? null,
    state: p.state ?? null,
    city: p.city ?? null,
    apollo_enriched: !!p.apollo_enriched,
    has_email: !!p.has_email,
    has_phone: !!p.has_phone,
    email_status: p.email_status || null,
    lead_list: p.lead_list || [],
    timeline: timeline,
    timeline_event_list: timeline,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export async function getDecisionMakers(params?: {
  search?: string;
  industry?: string;
  department?: string;
  seniority?: string;
  country?: string;
  location?: string;
  company_id?: number | string;
  company_name?: string;
  has_email?: boolean;
  has_phone?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}): Promise<{ people: DecisionMaker[]; total: number }> {
  try {
    const whereConditions: Record<string, any>[] = [];

    if (params?.search) {
      const s = `%${params.search}%`;
      whereConditions.push({
        _or: [
          { name: { _ilike: s } },
          { job_title: { _ilike: s } },
          { company_name: { _ilike: s } },
          { email: { _ilike: s } },
          { city: { _ilike: s } },
          { country: { _ilike: s } },
        ],
      });
    }

    if (params?.industry && params.industry !== "all") {
      whereConditions.push({ industry: { _eq: params.industry } });
    }

    if (params?.department && params.department !== "all") {
      whereConditions.push({ department: { _eq: params.department } });
    }

    if (params?.seniority && params.seniority !== "all") {
      whereConditions.push({ seniority: { _eq: params.seniority } });
    }

    if (params?.country && params.country !== "all") {
      whereConditions.push({ country: { _eq: params.country } });
    }

    if (params?.company_name && params.company_name !== "all") {
      whereConditions.push({ company_name: { _ilike: `%${params.company_name}%` } });
    }

    if (params?.location && params.location !== "all") {
      whereConditions.push({ location: { _ilike: `%${params.location}%` } });
    }

    if (params?.company_id) {
      whereConditions.push({ company_id: { _eq: Number(params.company_id) } });
    }

    if (params?.has_email !== undefined) {
      whereConditions.push({ has_email: { _eq: params.has_email } });
    }

    if (params?.has_phone !== undefined) {
      whereConditions.push({ has_phone: { _eq: params.has_phone } });
    }

    const where = whereConditions.length > 0 ? { _and: whereConditions } : {};
    const sortBy = params?.sortBy || "id";
    const sortOrder = params?.sortOrder === "desc" ? "desc" : "asc";
    const order_by = [{ [sortBy]: sortOrder }];

    const query = `
      query GetDecisionMakers(
        $where: aa_s_people_bool_exp
        $order_by: [aa_s_people_order_by!]
        $limit: Int
        $offset: Int
      ) {
        aa_s_people(
          where: $where
          order_by: $order_by
          limit: $limit
          offset: $offset
        ) {
          ${DECISION_MAKER_FIELDS}
        }
        aa_s_people_aggregate(distinct_on: [id], where: $where) {
          aggregate {
            count
          }
        }
      }
    `;

    const res = await sendGraphQL({
      query,
      variables: {
        where,
        order_by,
        limit: params?.limit || 30,
        offset: params?.offset || 0,
      },
      operationName: "GetDecisionMakers",
      multi_queries: true,
    });

    const {
      aa_s_people: rawList,
      aa_s_people_aggregate: { aggregate: { count: total } }
    } = res || {
      aa_s_people: [],
      aa_s_people_aggregate: { aggregate: { count: 0 } }
    };

    const people = rawList.map(mapDbDecisionMaker).filter(Boolean);

    return {
      people,
      total,
    };
  } catch (err) {
    console.error("Hasura peopleServices getDecisionMakers error:", err);
    return { people: [], total: 0 };
  }
}

export async function getDecisionMakerById(id: string | number): Promise<DecisionMaker | null> {
  try {
    const numId = Number(id);
    if (isNaN(numId)) return null;

    const query = `
      query GetDecisionMakerById($id: Int!) {
        aa_s_people_by_pk(id: $id) {
          ${DECISION_MAKER_FIELDS}
        }
      }
    `;

    const res = await getGraphQLOne({
      query,
      variables: { id: numId },
      operationName: "GetDecisionMakerById",
    });

    if (res && res.id !== undefined) {
      return mapDbDecisionMaker(res);
    }
  } catch (err) {
    console.error("Hasura getDecisionMakerById error:", err);
  }
  return null;
}

export async function getDecisionMakersAction(params?: {
  search?: string;
  industry?: string;
  department?: string;
  seniority?: string;
  country?: string;
  location?: string;
  company_id?: number | string;
  company_name?: string;
  has_email?: boolean;
  has_phone?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}): Promise<{ people: DecisionMaker[]; total: number }> {
  return getDecisionMakers(params);
}

export async function getDecisionMakerByIdAction(id: string | number): Promise<DecisionMaker | null> {
  return getDecisionMakerById(id);
}

export async function searchDecisionMakers(queryStr: string): Promise<DecisionMaker[]> {
  const result = await getDecisionMakers({ search: queryStr, limit: 20 });
  return result.people;
}

export async function getDecisionMakersCount(): Promise<number> {
  try {
    const query = `
      query GetDecisionMakersCount {
        aa_s_people_aggregate {
          aggregate {
            count
          }
        }
      }
    `;
    const res = await getGraphQLOne({ query, operationName: "GetDecisionMakersCount", variables: {} });
    return res?.aggregate?.count || 0;
  } catch (err) {
    console.error("Hasura getDecisionMakersCount error:", err);
    return 0;
  }
}
