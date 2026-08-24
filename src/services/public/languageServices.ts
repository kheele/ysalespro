'use server';

import { listGraphQL, getGraphQLOne } from "@/graphql";
import { Language } from "@/lib/types";

export async function getLanguages(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ languages: Language[]; total: number }> {
  try {
    const query = `
      query GetLanguages($limit: Int, $offset: Int) {
        aa_s_languages(
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
      operationName: "GetLanguages",
    });

    const rawList = Array.isArray(res) ? res : [];

    let items: Language[] = rawList.map((l: any) => {
      const orgCount = l.organization_list_aggregate?.aggregate?.count || 0;
      return {
        id: l.id,
        name: l.name,
        organization_count: orgCount,
        org_count: orgCount,
      };
    });

    if (params?.search) {
      const s = params.search.toLowerCase();
      items = items.filter(l => (l.name || "").toLowerCase().includes(s));
    }

    return { languages: items, total: items.length };
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
      operationName: "GetLanguageById",
    });

    if (item && item.id !== undefined) {
      const orgCount = item.organization_list_aggregate?.aggregate?.count || 0;
      return {
        id: item.id,
        name: item.name,
        organization_count: orgCount,
        org_count: orgCount,
      };
    }
  } catch (err) {
    console.error("Hasura getLanguageById error:", err);
  }

  return null;
}
