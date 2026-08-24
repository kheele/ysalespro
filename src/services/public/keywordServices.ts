'use server';

import { listGraphQL, getGraphQLOne } from "@/graphql";
import { Keyword } from "@/lib/types";

export async function getKeywords(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ keywords: Keyword[]; total: number }> {
  try {
    const query = `
      query GetKeywords($limit: Int, $offset: Int) {
        aa_s_keywords(
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
      }
    `;
    const res = await listGraphQL({
      query,
      variables: {
        limit: params?.limit || 100,
        offset: params?.offset || 0,
      },
      operationName: "GetKeywords",
    });

    const rawList = Array.isArray(res) ? res : [];

    let items: Keyword[] = rawList.map((k: any) => {
      const orgCount = k.organization_list_aggregate?.aggregate?.count || 0;
      return {
        id: k.id,
        name: k.name,
        organization_count: orgCount,
        usage_count: orgCount,
      };
    });

    if (params?.search) {
      const s = params.search.toLowerCase();
      items = items.filter(k => (k.name || "").toLowerCase().includes(s));
    }

    return { keywords: items, total: items.length };
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
      query GetKeywordById($id: bigint!) {
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
      const orgCount = item.organization_list_aggregate?.aggregate?.count || 0;
      return {
        id: item.id,
        name: item.name,
        organization_count: orgCount,
        usage_count: orgCount,
      };
    }
  } catch (err) {
    console.error("Hasura getKeywordById error:", err);
  }

  return null;
}
