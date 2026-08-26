'use server';

import { sendGraphQL, getGraphQLOne } from "@/graphql";
import { IndustrySignal } from "@/lib/types";

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
    created_at: s.created_at ?? null,
    updated_at: s.updated_at ?? null,
    industry: s.industry ? {
      id: s.industry.id,
      name: s.industry.name || "",
      active: s.industry.active,
    } : null,
  };
}

export async function getIndustrySignals(params?: {
  industry_id?: number;
  country?: string;
  metric?: string;
  trend?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ signals: IndustrySignal[]; total: number }> {
  try {
    const where: any = {};

    if (params?.industry_id) {
      where.industry_id = { _eq: params.industry_id };
    }
    if (params?.country && params.country !== "all") {
      where.country = { _ilike: `%${params.country}%` };
    }
    if (params?.metric && params.metric !== "all") {
      where.metric = { _ilike: `%${params.metric}%` };
    }
    if (params?.trend && params.trend !== "all") {
      where.trend = { _eq: params.trend };
    }
    if (params?.search && params.search.trim()) {
      where._or = [
        { metric: { _ilike: `%${params.search.trim()}%` } },
        { sales_signal: { _ilike: `%${params.search.trim()}%` } },
        { summary: { _ilike: `%${params.search.trim()}%` } },
        { country: { _ilike: `%${params.search.trim()}%` } },
        { source_name: { _ilike: `%${params.search.trim()}%` } },
      ];
    }

    const query = `
      query GetIndustrySignals($where: aa_s_industry_signals_bool_exp, $limit: Int, $offset: Int) {
        aa_s_industry_signals(
          where: $where
          order_by: { published_at: desc_nulls_last, id: desc }
          limit: $limit
          offset: $offset
        ) {
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
          industry {
            id
            name
            active
          }
        }
        aa_s_industry_signals_aggregate(distinct_on: [id], where: $where) {
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
        limit: params?.limit || 30,
        offset: params?.offset || 0,
      },
      operationName: "GetIndustrySignals",
      multi_queries: true,
    });

    const {
      aa_s_industry_signals: rawList,
      aa_s_industry_signals_aggregate: { aggregate: { count: total } }
    } = res || {
      aa_s_industry_signals: [],
      aa_s_industry_signals_aggregate: { aggregate: { count: 0 } }
    };

    const items: IndustrySignal[] = (rawList || []).map(mapDbIndustrySignal).filter(Boolean);

    return { signals: items, total };
  } catch (err) {
    console.error("Hasura getIndustrySignals error:", err);
    return { signals: [], total: 0 };
  }
}

export async function getIndustrySignalById(id: string | number): Promise<IndustrySignal | null> {
  try {
    const numId = Number(id);
    if (isNaN(numId)) return null;

    const query = `
      query GetIndustrySignalById($id: Int!) {
        aa_s_industry_signals_by_pk(id: $id) {
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
          industry {
            id
            name
            active
          }
        }
      }
    `;
    const item = await getGraphQLOne({
      query,
      variables: { id: numId },
      operationName: "GetIndustrySignalById",
    });

    if (item && item.id !== undefined) {
      return mapDbIndustrySignal(item);
    }
  } catch (err) {
    console.error("Hasura getIndustrySignalById error:", err);
  }

  return null;
}

export async function getIndustrySignalsByIndustryId(
  industryId: number | string,
  params?: { limit?: number; offset?: number }
): Promise<{ signals: IndustrySignal[]; total: number }> {
  const numId = Number(industryId);
  if (isNaN(numId)) return { signals: [], total: 0 };
  return getIndustrySignals({
    industry_id: numId,
    limit: params?.limit || 50,
    offset: params?.offset || 0,
  });
}
