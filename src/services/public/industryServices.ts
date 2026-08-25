'use server';

import { sendGraphQL, getGraphQLOne } from "@/graphql";
import { Industry } from "@/lib/types";
import { toTitleCase } from "@/lib/utils";

function mapDbIndustry(i: any): Industry {
  if (!i) return null as any;

  return {
    id: i.id,
    name: toTitleCase(i.name),
    active: i.active,
    organization_count: i.organization_list_aggregate?.aggregate?.count || 0,
    campaign_target_count: i.campaign_target_list_aggregate?.aggregate?.count || 0,
  };
}

export async function getIndustries(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ industries: Industry[]; total: number }> {
  try {
    const where: any = { active: { _eq: true } };

    if (params?.search && params.search.trim()) {
      where.name = { _ilike: `%${params.search.trim()}%` };
    }

    const query = `
      query GetIndustries($where: aa_s_industries_bool_exp, $limit: Int, $offset: Int) {
        aa_s_industries(
          where: $where
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
        aa_s_industries_aggregate(where: $where) {
          aggregate {
            count
          }
        }
      }
    `;

    const res = await sendGraphQL({
      query,
      variables: {
        where: Object.keys(where).length > 0 ? where : undefined,
        limit: params?.limit || 15,
        offset: params?.offset || 0,
      },
      operationName: "GetIndustries",
      multi_queries: true,
    });

    const {
      aa_s_industries: rawList,
      aa_s_industries_aggregate: { aggregate: { count: total } }
    } = res || {
      aa_s_industries: [],
      aa_s_industries_aggregate: { aggregate: { count: 0 } }
    };

    const items: Industry[] = rawList.map(mapDbIndustry).filter(Boolean);

    return { industries: items, total };
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
      return mapDbIndustry(item);
    }
  } catch (err) {
    console.error("Hasura getIndustryById error:", err);
  }

  return null;
}
