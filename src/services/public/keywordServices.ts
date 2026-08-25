'use server';

import { sendGraphQL, getGraphQLOne } from "@/graphql";
import { Keyword } from "@/lib/types";

function mapDbKeyword(k: any): Keyword {
  if (!k) return null as any;

  const orgCount = k.organization_list_aggregate?.aggregate?.count || 0;
  return {
    id: k.id,
    name: k.name,
    organization_count: orgCount,
    usage_count: orgCount,
  };
}

export async function getKeywords(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ keywords: Keyword[]; total: number }> {
  try {
    const where: any = {};
    if (params?.search && params.search.trim()) {
      where.name = { _ilike: `%${params.search.trim()}%` };
    }

    const query = `
      query GetKeywords($where: aa_s_keywords_bool_exp, $limit: Int, $offset: Int) {
        aa_s_keywords(
          where: $where
          order_by: { name: asc }
          limit: $limit
          offset: $offset
        ) {
          id
          name
          organization_list_aggregate {
            aggregate {
              count
            }
          }
        }
        aa_s_keywords_aggregate(where: $where) {
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
      operationName: "GetKeywords",
      multi_queries: true,
    });

    const {
      aa_s_keywords: rawList,
      aa_s_keywords_aggregate: { aggregate: { count: total } }
    } = res || {
      aa_s_keywords: [],
      aa_s_keywords_aggregate: { aggregate: { count: 0 } }
    };

    const items: Keyword[] = rawList.map(mapDbKeyword).filter(Boolean);

    return { keywords: items, total };
  } catch (err) {
    console.error("Hasura keywordServices error:", err);
    return { keywords: [], total: 0 };
  }
}

export async function getKeywordById(id: string | number): Promise<Keyword | null> {
  try {
    const numId = Number(id);
    if (isNaN(numId)) return null;

    const query = `
      query GetKeywordById($id: Int!) {
        aa_s_keywords_by_pk(id: $id) {
          id
          name
          organization_list_aggregate {
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
      operationName: "GetKeywordById",
    });

    if (item && item.id !== undefined) {
      return mapDbKeyword(item);
    }
  } catch (err) {
    console.error("Hasura getKeywordById error:", err);
  }

  return null;
}
