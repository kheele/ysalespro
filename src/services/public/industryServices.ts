'use server';

import { sendGraphQL, getGraphQLOne } from "@/graphql";
import { Industry, IndustrySignal } from "@/lib/types";
import { toTitleCase } from "@/lib/utils";

function mapDbIndustrySignal(s: any): IndustrySignal {
  if (!s) return null as any;

  return {
    id: s.id,
    industry_id: s.industry_id,
    country: s.country ?? null,
    metric: s.metric || "",
    unit: s.unit ?? null,
    data_type: s.data_type ?? null,
    period_start: s.period_start ?? null,
    period_end: s.period_end ?? null,
    yoy: s.yoy !== null && s.yoy !== undefined ? Number(s.yoy) : null,
    mom: s.mom !== null && s.mom !== undefined ? Number(s.mom) : null,
    qoq: s.qoq !== null && s.qoq !== undefined ? Number(s.qoq) : null,
    trend: s.trend ?? null,
    sales_signal: s.sales_signal ?? null,
    summary: s.summary ?? null,
    source_name: s.source_name ?? null,
    source_url: s.source_url ?? null,
    published_at: s.published_at ?? null,
    retrieved_at: s.retrieved_at ?? null,
  };
}

function mapDbIndustry(i: any): Industry {
  if (!i) return null as any;

  const signals = (i.industry_signal_list || []).map(mapDbIndustrySignal).filter(Boolean);
  const signalCount = i.industry_signal_list_aggregate?.aggregate?.count ?? signals.length;

  return {
    id: i.id,
    name: toTitleCase(i.name),
    active: i.active,
    organization_count: i.organization_list_aggregate?.aggregate?.count || 0,
    campaign_target_count: i.campaign_target_list_aggregate?.aggregate?.count || 0,
    industry_signal_count: signalCount,
    industry_signal_list: signals,
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
          industry_signal_list_aggregate {
            aggregate {
              count
            }
          }
          industry_signal_list(order_by: { published_at: desc_nulls_last, id: desc }) {
            id
            industry_id
            country
            metric
            unit
            data_type
            period_start
            period_end
            yoy
            mom
            qoq
            trend
            sales_signal
            summary
            source_name
            source_url
            published_at
            retrieved_at
            created_at
            updated_at
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
        limit: params?.limit === 0 ? undefined : (params?.limit ?? 15),
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
          industry_signal_list_aggregate {
            aggregate {
              count
            }
          }
          industry_signal_list(order_by: { published_at: desc_nulls_last, id: desc }) {
            id
            industry_id
            country
            metric
            unit
            data_type
            period_start
            period_end
            yoy
            mom
            qoq
            trend
            sales_signal
            summary
            source_name
            source_url
            published_at
            retrieved_at
            created_at
            updated_at
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
