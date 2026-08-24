'use server';

import { listGraphQL, getGraphQLOne } from "@/graphql";
import { Organization, OrganizationNote, OrganizationActivity } from "@/lib/types";

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
          { domain: { _ilike: s } },
          { industry: { _ilike: s } },
          { city: { _ilike: s } },
          { country: { _ilike: s } },
        ],
      });
    }

    if (params?.industry && params.industry !== "all") {
      whereConditions.push({ industry: { _eq: params.industry } });
    }

    if (params?.country && params.country !== "all") {
      whereConditions.push({ country: { _eq: params.country } });
    }

    if (params?.status && params.status !== "all") {
      whereConditions.push({ status: { _eq: params.status } });
    }

    const where = whereConditions.length > 0 ? { _and: whereConditions } : {};
    const sortBy = params?.sortBy || "created_at";
    const sortOrder = params?.sortOrder === "asc" ? "asc" : "desc";
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
          name
          domain
          logo_url
          industry
          employee_count
          revenue
          location
          city
          country
          status
          last_activity
          founded_year
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
      }
    `;

    const res = await listGraphQL({
      query,
      variables: {
        where,
        order_by,
        limit: params?.limit || 100,
        offset: params?.offset || 0,
      },
      operationName: "GetOrganizations",
    });

    const rawList = Array.isArray(res) ? res : [];
    const orgs: Organization[] = rawList.map((o: any) => ({
      ...o,
      naics_code_list: o.naics_code_list?.map((n: any) => ({
        id: n.id,
        naics_code: n.naics_code,
        code: n.naics_code || n.code || "",
        title: n.title || n.naics_code || "",
      })),
      sic_code_list: o.sic_code_list?.map((s: any) => ({
        id: s.id,
        sic_code: s.sic_code,
        code: s.sic_code || s.code || "",
        title: s.title || s.sic_code || "",
      })),
    }));

    return {
      organizations: orgs,
      total: orgs.length,
    };
  } catch (err) {
    console.error("Hasura organization query error:", err);
  }

  return {
    organizations: [],
    total: 0,
  };
}

export async function getOrganizationById(id: string | number): Promise<Organization | null> {
  try {
    const query = `
      query GetOrganizationById($id: bigint!) {
        aa_s_organizations_by_pk(id: $id) {
          id
          name
          domain
          logo_url
          industry
          employee_count
          revenue
          location
          city
          country
          status
          last_activity
          founded_year
          created_at
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
      }
    `;
    const res = await getGraphQLOne({
      query,
      variables: { id: Number(id) },
      operationName: "GetOrganizationById",
    });

    if (res) {
      return {
        ...res,
        naics_code_list: res.naics_code_list?.map((n: any) => ({
          id: n.id,
          naics_code: n.naics_code,
          code: n.naics_code || n.code || "",
          title: n.title || n.naics_code || "",
        })),
        sic_code_list: res.sic_code_list?.map((s: any) => ({
          id: s.id,
          sic_code: s.sic_code,
          code: s.sic_code || s.code || "",
          title: s.title || s.sic_code || "",
        })),
      };
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
