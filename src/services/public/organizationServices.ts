'use server';

import { sendGraphQL, getGraphQLOne } from "@/graphql";
import { Organization, OrganizationNote, OrganizationActivity } from "@/lib/types";
import { toTitleCase } from "@/lib/utils";

function mapDbOrganization(o: any): Organization {
  if (!o) return null as any;
  const location = o.street_address || o.raw_address || [o.city, o.state, o.country].filter(Boolean).join(", ");
  const primaryDomain = o.primary_domain || (o.website_url ? o.website_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : "");
  const rawIndustry = o.primary_industry || (o.industry_list?.[0]?.industry?.name) || o.industry || "";
  const industry = toTitleCase(rawIndustry);
  const revenue = o.organization_revenue_str || (o.organization_revenue ? `$${Number(o.organization_revenue).toLocaleString()}` : "");

  return {
    ...o,
    id: o.id,
    apollo_id: o.apollo_id,
    name: o.name || "",
    website_url: o.website_url || (primaryDomain ? `https://${primaryDomain}` : ""),
    primary_domain: o.primary_domain || primaryDomain,
    logo_url: o.logo_url || null,
    industry: industry,
    primary_industry: industry,
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
    score: o.score !== undefined && o.score !== null ? Number(o.score) : null,
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
    email_list: o.email_list || [],
    people_list: o.people_list || [],
  };
}

export interface GetOrganizationsParams {
  search?: string;
  industry?: string;
  industry_id?: number | string;
  country?: string;
  status?: string;
  employee_range?: string;
  min_employees?: number;
  max_employees?: number;
  revenue_range?: string;
  min_revenue?: number;
  max_revenue?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedOrganizationsResponse {
  organizations: Organization[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export async function getOrganizations(params?: GetOrganizationsParams): Promise<PaginatedOrganizationsResponse> {
  const limit = params?.pageSize ?? params?.limit ?? 30;
  const offset = params?.offset !== undefined
    ? params.offset
    : params?.page
      ? (params.page - 1) * limit
      : 0;
  const page = params?.page ?? (limit > 0 ? Math.floor(offset / limit) + 1 : 1);

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
      const numInd = Number(params.industry);
      if (!isNaN(numInd) && numInd > 0) {
        whereConditions.push({
          industry_list: { industry_id: { _eq: numInd } }
        });
      } else {
        whereConditions.push({
          _or: [
            { primary_industry: { _eq: params.industry } },
            { industry_list: { industry: { name: { _ilike: `%${params.industry}%` } } } },
          ],
        });
      }
    }

    if (params?.industry_id) {
      const numIndId = Number(params.industry_id);
      whereConditions.push({
        industry_list: { industry_id: { _eq: isNaN(numIndId) ? params.industry_id : numIndId } }
      });
    }

    if (params?.employee_range && params.employee_range !== "all") {
      switch (params.employee_range) {
        case "1-10":
          whereConditions.push({ estimated_num_employees: { _gte: 1, _lte: 10 } });
          break;
        case "11-50":
          whereConditions.push({ estimated_num_employees: { _gte: 11, _lte: 50 } });
          break;
        case "51-200":
          whereConditions.push({ estimated_num_employees: { _gte: 51, _lte: 200 } });
          break;
        case "201-500":
          whereConditions.push({ estimated_num_employees: { _gte: 201, _lte: 500 } });
          break;
        case "501-1000":
          whereConditions.push({ estimated_num_employees: { _gte: 501, _lte: 1000 } });
          break;
        case "1000+":
          whereConditions.push({ estimated_num_employees: { _gte: 1000 } });
          break;
      }
    } else {
      if (params?.min_employees !== undefined) {
        whereConditions.push({ estimated_num_employees: { _gte: params.min_employees } });
      }
      if (params?.max_employees !== undefined) {
        whereConditions.push({ estimated_num_employees: { _lte: params.max_employees } });
      }
    }

    if (params?.revenue_range && params.revenue_range !== "all") {
      switch (params.revenue_range) {
        case "<1M":
          whereConditions.push({ organization_revenue: { _gt: 0, _lt: 1000000 } });
          break;
        case "1M-10M":
          whereConditions.push({ organization_revenue: { _gte: 1000000, _lte: 10000000 } });
          break;
        case "10M-50M":
          whereConditions.push({ organization_revenue: { _gte: 10000000, _lte: 50000000 } });
          break;
        case "50M-100M":
          whereConditions.push({ organization_revenue: { _gte: 50000000, _lte: 100000000 } });
          break;
        case "100M+":
          whereConditions.push({ organization_revenue: { _gte: 100000000 } });
          break;
      }
    } else {
      if (params?.min_revenue !== undefined) {
        whereConditions.push({ organization_revenue: { _gte: params.min_revenue } });
      }
      if (params?.max_revenue !== undefined) {
        whereConditions.push({ organization_revenue: { _lte: params.max_revenue } });
      }
    }

    if (params?.country && params.country !== "all") {
      whereConditions.push({ country: { _eq: params.country } });
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
          industry_list(distinct_on: [industry_id], order_by: [{ industry_id: asc }]) {
            id
            industry {
              id
              name
            }
          }
          keywords_list(distinct_on: [keyword_id], order_by: [{ keyword_id: asc }]) {
            id
            keyword {
              name
            }
          }
          language_list(distinct_on: [language_id], order_by: [{ language_id: asc }]) {
            id
            language {
              name
            }
          }
          naics_code_list(distinct_on: [naics_code], order_by: [{ naics_code: asc }]) {
            id
            naics_code
          }
          sic_code_list(distinct_on: [sic_code], order_by: [{ sic_code: asc }]) {
            id
            sic_code
          }
          email_list(
            where: {email_type: {_eq: "internal"}, source: {_neq: "mx_fallback"}},
            order_by: [{ email: asc }]
          ) {
            id
            email
            email_type
            source
            created_at
          }
        }
        aa_s_organizations_aggregate(distinct_on: [id], where: $where) {
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
        limit,
        offset,
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
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    const hasMore = offset + orgs.length < total;

    return {
      organizations: orgs,
      total,
      page,
      pageSize: limit,
      totalPages,
      hasMore,
    };
  } catch (err) {
    console.error("Hasura organization query error:", err);
    return {
      organizations: [],
      total: 0,
      page: 1,
      pageSize: limit,
      totalPages: 0,
      hasMore: false,
    };
  }
}

export async function getOrganizationsAction(params?: GetOrganizationsParams): Promise<PaginatedOrganizationsResponse> {
  return getOrganizations(params);
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
          industry_list(distinct_on: [industry_id], order_by: [{ industry_id: asc }]) {
            id
            industry {
              id
              name
            }
          }
          keywords_list(distinct_on: [keyword_id], order_by: [{ keyword_id: asc }]) {
            id
            keyword {
              name
            }
          }
          language_list(distinct_on: [language_id], order_by: [{ language_id: asc }]) {
            id
            language {
              name
            }
          }
          naics_code_list(distinct_on: [naics_code], order_by: [{ naics_code: asc }]) {
            id
            naics_code
          }
          sic_code_list(distinct_on: [sic_code], order_by: [{ sic_code: asc }]) {
            id
            sic_code
          }
          people_list(distinct_on: [id], order_by: [{ id: asc }]) {
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
          email_list(
            where: {email_type: {_eq: "internal"}, source: {_neq: "mx_fallback"}},
            order_by: [{ email: asc }]
          ) {
            id
            email
            email_type
            source
            created_at
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

export async function getOrganizationsByIndustryId(
  industryId: number | string,
  options?: { page?: number; pageSize?: number; limit?: number; offset?: number }
): Promise<PaginatedOrganizationsResponse> {
  try {
    return await getOrganizations({
      industry_id: industryId,
      page: options?.page,
      pageSize: options?.pageSize ?? options?.limit ?? 30,
      offset: options?.offset,
    });
  } catch (err) {
    console.error("getOrganizationsByIndustryId error:", err);
    return {
      organizations: [],
      total: 0,
      page: 1,
      pageSize: options?.pageSize ?? options?.limit ?? 30,
      totalPages: 0,
      hasMore: false,
    };
  }
}

