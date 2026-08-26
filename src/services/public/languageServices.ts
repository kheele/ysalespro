'use server';

import { sendGraphQL, getGraphQLOne } from "@/graphql";
import { Language } from "@/lib/types";

function mapDbLanguage(l: any): Language {
  if (!l) return null as any;

  const orgCount = l.organization_list_aggregate?.aggregate?.count || 0;
  return {
    id: l.id,
    name: l.name,
    organization_count: orgCount,
    org_count: orgCount,
  };
}

export async function getLanguages(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ languages: Language[]; total: number }> {
  try {
    const where: any = {};
    if (params?.search && params.search.trim()) {
      where.name = { _ilike: `%${params.search.trim()}%` };
    }

    const query = `
      query GetLanguages($where: aa_s_languages_bool_exp, $limit: Int, $offset: Int) {
        aa_s_languages(
          distinct_on: [name]
          where: $where
          order_by: [{ name: asc }]
          limit: $limit
          offset: $offset
        ) {
          id
          name
          organization_list_aggregate(distinct_on: [organization_id]) {
            aggregate {
              count
            }
          }
        }
        aa_s_languages_aggregate(distinct_on: [name], where: $where) {
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
      operationName: "GetLanguages",
      multi_queries: true,
    });

    const {
      aa_s_languages: rawList,
      aa_s_languages_aggregate: aggregateRes,
    } = res || {
      aa_s_languages: [],
      aa_s_languages_aggregate: { aggregate: { count: 0 } },
    };

    const mapped = (rawList || []).map(mapDbLanguage).filter(Boolean);
    const totalCount = aggregateRes?.aggregate?.count || mapped.length;

    return { languages: mapped, total: totalCount };
  } catch (err) {
    console.error("Hasura languageServices error:", err);
    return { languages: [], total: 0 };
  }
}

export async function getLanguageById(id: string | number): Promise<Language | null> {
  try {
    const numId = Number(id);
    if (isNaN(numId)) return null;

    const query = `
      query GetLanguageById($id: Int!) {
        aa_s_languages_by_pk(id: $id) {
          id
          name
          organization_list_aggregate(distinct_on: [organization_id]) {
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
      operationName: "GetLanguageById",
    });

    if (item && item.id !== undefined) {
      return mapDbLanguage(item);
    }
  } catch (err) {
    console.error("Hasura getLanguageById error:", err);
  }

  return null;
}
