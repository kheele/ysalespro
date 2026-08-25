'use server';

import { sendGraphQL, getGraphQLOne } from "@/graphql";
import { Organization, OrganizationNote, OrganizationActivity } from "@/lib/types";

function mapDbOrganization(o: any): Organization {
  if (!o) return null as any;
  const location = o.street_address || o.raw_address || [o.city, o.state, o.country].filter(Boolean).join(", ");
  const primaryDomain = o.primary_domain || (o.website_url ? o.website_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : "");
  const industry = o.primary_industry || (o.industry_list?.[0]?.industry?.name) || "";
  const revenue = o.organization_revenue_str || (o.organization_revenue ? `$${Number(o.organization_revenue).toLocaleString()}` : "");

  return {
    ...o,
    id: o.id,
    apollo_id: o.apollo_id,
    name: o.name || "",
    website_url: o.website_url || (primaryDomain ? `https://${primaryDomain}` : ""),
    primary_domain: o.primary_domain || primaryDomain,
    logo_url: o.logo_url || null,
    industry: industry || o.industry,
    primary_industry: o.primary_industry || industry,
    employee_count: o.estimated_num_employees ?? o.employee_count ?? 0,
    estimated_num_employees: o.estimated_num_employees ?? o.employee_count ?? 0,
    revenue: revenue || o.revenue,
    annual_revenue: revenue || o.annual_revenue,
    organization_revenue_str: o.organization_revenue_str || revenue,
    organization_revenue: o.organization_revenue ?? null,
    location: location || o.location,
    headquarters_location: location || o.headquarters_location,
    city: o.city || null,
    state: o.state || null,
    country: o.country || null,
    postal_code: o.postal_code || null,
    founded_year: o.founded_year ?? null,
    status: o.status || (o.show_intent ? "Active" : "Prospect"),
    lead_status: o.lead_status || (o.intent_strength === "High" ? "Hot" : o.intent_strength === "Medium" ? "Warm" : "Cold"),
    score: o.score ?? (o.alexa_ranking ? Math.max(60, Math.min(99, Math.round(100 - Math.log10(Math.max(1, o.alexa_ranking)) * 6))) : 88),
    last_activity: o.last_activity || (o.updated_at ? new Date(o.updated_at).toLocaleDateString() : "Recently"),
    created_at: o.created_at,
    updated_at: o.updated_at,
    industry_list: o.industry_list || [],
    keywords_list: o.keywords_list || [],
    language_list: o.language_list || [],
    naics_code_list: o.naics_code_list?.map((n: any) => ({
      id: n.id,
      organization_id: n.organization_id,
      naics_code: n.naics_code,
      code: n.naics_code || n.code || "",
      title: n.title || n.naics_code || "",
    })) || [],
    sic_code_list: o.sic_code_list?.map((s: any) => ({
      id: s.id,
      organization_id: s.organization_id,
      sic_code: s.sic_code,
      code: s.sic_code || s.code || "",
      title: s.title || s.sic_code || "",
    })) || [],
    people_list: o.people_list || [],
  };
}

export async function getOrganizations(params?: {
  search?: string;
  industry?: string;
  country?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}): Promise<{ organizations: Organization[]; total: number }> {
  try {
    const whereConditions: Record<string, any>[] = [];

    if (params?.search) {
      const s = `%${params.search}%`;
      whereConditions.push({
        _or: [
          { name: { _ilike: s } },
          { primary_domain: { _ilike: s } },
          { website_url: { _ilike: s } },
          { primary_industry: { _ilike: s } },
          { city: { _ilike: s } },
          { country: { _ilike: s } },
        ],
      });
    }

    if (params?.industry && params.industry !== "all") {
      whereConditions.push({ primary_industry: { _eq: params.industry } });
    }

    if (params?.country && params.country !== "all") {
      whereConditions.push({ country: { _eq: params.country } });
    }

    if (params?.status && params.status !== "all") {
      if (params.status === "Active") {
        whereConditions.push({ show_intent: { _eq: true } });
      }
    }

    const where = whereConditions.length > 0 ? { _and: whereConditions } : {};
    const sortBy = params?.sortBy || "id";
    const sortOrder = params?.sortOrder === "desc" ? "desc" : "asc";
    const order_by = [{ [sortBy]: sortOrder }];

    const query = `
      query GetOrganizations(
        $where: aa_s_organizations_bool_exp
        $order_by: [aa_s_organizations_order_by!]
        $limit: Int
        $offset: Int
      ) {
        aa_s_organizations_aggregate(where: $where) {
          aggregate {
            count
          }
        }
        aa_s_organizations(
          where: $where
          order_by: $order_by
          limit: $limit
          offset: $offset
        ) {
          id
          apollo_id
          name
          website_url
          angellist_url
          linkedin_url
          twitter_url
          facebook_url
          crunchbase_url
          primary_domain
          logo_url
          phone
          sanitized_phone
          primary_phone_number
          primary_phone_source
          primary_phone_sanitized
          alexa_ranking
          linkedin_uid
          founded_year
          publicly_traded_symbol
          publicly_traded_exchange
          market_cap
          estimated_num_employees
          organization_revenue_str
          organization_revenue
          primary_industry
          industry_tag_id
          raw_address
          street_address
          city
          state
          country
          postal_code
          snippets_loaded
          retail_location_count
          show_intent
          intent_strength
          has_intent_signal_account
          intent_signal_account
          created_at
          updated_at
          industry_list {
            id
            industry {
              id
              name
            }
          }
          keywords_list {
            id
            keyword {
              name
            }
          }
          language_list {
            id
            language {
              name
            }
          }
          naics_code_list {
            id
            naics_code
          }
          sic_code_list {
            id
            sic_code
          }
        }
        aa_s_organizations_aggregate(where: $where) {
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
      operationName: "GetOrganizations",
      multi_queries: true,
    });

    const {
      aa_s_organizations: rawList,
      aa_s_organizations_aggregate: { aggregate: { count: total } }
    } = res || {
      aa_s_organizations: [],
      aa_s_organizations_aggregate: { aggregate: { count: 0 } }
    };

    const orgs = rawList.map(mapDbOrganization).filter(Boolean);

    return {
      organizations: orgs,
      total,
    };
  } catch (err) {
    console.error("Hasura organization query error:", err);
    return {
      organizations: [],
      total: 0,
    };
  }
}

export async function getOrganizationById(id: string | number): Promise<Organization | null> {
  try {
    const numId = Number(id);
    if (isNaN(numId)) return null;

    const query = `
      query GetOrganizationById($id: Int!) {
        aa_s_organizations_by_pk(id: $id) {
          id
          apollo_id
          name
          website_url
          angellist_url
          linkedin_url
          twitter_url
          facebook_url
          crunchbase_url
          primary_domain
          logo_url
          phone
          sanitized_phone
          primary_phone_number
          primary_phone_source
          primary_phone_sanitized
          alexa_ranking
          linkedin_uid
          founded_year
          publicly_traded_symbol
          publicly_traded_exchange
          market_cap
          estimated_num_employees
          organization_revenue_str
          organization_revenue
          primary_industry
          industry_tag_id
          raw_address
          street_address
          city
          state
          country
          postal_code
          snippets_loaded
          retail_location_count
          show_intent
          intent_strength
          has_intent_signal_account
          intent_signal_account
          created_at
          updated_at
          industry_list {
            id
            industry {
              id
              name
            }
          }
          keywords_list {
            id
            keyword {
              name
            }
          }
          language_list {
            id
            language {
              name
            }
          }
          naics_code_list {
            id
            naics_code
          }
          sic_code_list {
            id
            sic_code
          }
          people_list {
            id
            name
            job_title
            email
            phone
            linkedin_url
            city
            state
            country
          }
        }
      }
    `;
    const res = await getGraphQLOne({
      query,
      variables: { id: numId },
      operationName: "GetOrganizationById",
    });

    if (res) {
      return mapDbOrganization(res);
    }
  } catch (err) {
    console.error("Hasura getOrganizationById error:", err);
  }
  return null;
}

export async function createOrganization(input: Partial<Organization>): Promise<Organization | null> {
  return null;
}

export async function addNote(organization_id: string | number, content: string, author: string = "Admin"): Promise<OrganizationNote | null> {
  return null;
}

