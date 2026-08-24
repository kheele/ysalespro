'use server';

import { listGraphQL, getGraphQLOne } from "@/graphql";
import { Industry } from "@/lib/types";

export async function getIndustries(params?: {
  search?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ industries: Industry[]; total: number }> {
  try {
    const query = `
      query GetIndustries($limit: Int, $offset: Int) {
        aa_s_industries(
          order_by: { name: asc }
          limit: $limit
          offset: $offset
        ) {
          id
          name
          active
          organization_list_aggregate {
            aggregate {
              count
            }
          }
          campaign_target_list_aggregate {
            aggregate {
              count
            }
          }
        }
      }
    `;
    const res = await listGraphQL({
      query,
      variables: {
        limit: params?.limit || 100,
        offset: params?.offset || 0,
      },
      operationName: "GetIndustries",
    });

    const rawList = Array.isArray(res) ? res : [];

    let items: Industry[] = rawList.map((i: any) => ({
      id: i.id,
      name: i.name,
      active: i.active !== false,
      organization_count: i.organization_list_aggregate?.aggregate?.count || 0,
      campaign_target_count: i.campaign_target_list_aggregate?.aggregate?.count || 0,
    }));

    if (params?.active !== undefined) {
      items = items.filter(i => i.active === params.active);
    }

    if (params?.search) {
      const s = params.search.toLowerCase();
      items = items.filter(i => (i.name || "").toLowerCase().includes(s));
    }

    return { industries: items, total: items.length };
  } catch (err) {
    console.error("Hasura industry services error:", err);
    return { industries: [], total: 0 };
  }
}

export async function getIndustryById(id: string | number): Promise<Industry | null> {
  try {
    const numId = Number(id);
    if (isNaN(numId)) return null;

    const query = `
      query GetIndustryById($id: Int!) {
        aa_s_industries_by_pk(id: $id) {
          id
          name
          active
          organization_list_aggregate {
            aggregate {
              count
            }
          }
          campaign_target_list_aggregate {
            aggregate {
              count
            }
          }
        }
      }
    `;
    const item = await getGraphQLOne({
      query,
      variables: { id: numId },
      operationName: "GetIndustryById",
    });

    if (item && item.id !== undefined) {
      return {
        id: item.id,
        name: item.name,
        active: item.active !== false,
        organization_count: item.organization_list_aggregate?.aggregate?.count || 0,
        campaign_target_count: item.campaign_target_list_aggregate?.aggregate?.count || 0,
      };
    }
  } catch (err) {
    console.error("Hasura getIndustryById error:", err);
  }

  return null;
}
