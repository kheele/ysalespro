'use server';

import { listGraphQL } from "@/graphql";
import { NAICSCode, SICCode } from "@/lib/types";

function mapDbCode(key: "naics_code" | "sic_code", title: "NAICS Code" | "SIC Code") {
  return (c: NAICSCode | SICCode) => {
    if (!c) return null as any;

    return {
      id: c.id,
      organization_id: c.organization_id,
      ...(key === "naics_code" && ((n: NAICSCode) => ({
        naics_code: n.naics_code || "",
        code: n.naics_code || "",
        title: n.naics_code || title,
      }))(c as NAICSCode)),
      ...(key === "sic_code" && ((s: SICCode) => ({
        sic_code: s.sic_code || "",
        code: s.sic_code || "",
        title: s.sic_code || title,
      }))(c as SICCode)),
      organization_count: 1,
      organization: c.organization,
    };
  };
}

export async function getNAICSCodes(params?: {
  organization_id?: number;
  limit?: number;
  offset?: number;
}): Promise<NAICSCode[]> {
  try {
    const query = `
      query GetNAICS($limit: Int, $offset: Int) {
        aa_s_organization_naics_codes(
          distinct_on: [naics_code]
          order_by: [{ naics_code: asc }]
          limit: $limit
          offset: $offset
        ) {
          id
          organization_id
          naics_code
          organization {
            id
            name
          }
        }
      }
    `;
    const res = await listGraphQL({
      query,
      variables: {
        limit: params?.limit || 30,
        offset: params?.offset || 0,
      },
      operationName: "GetNAICS",
    });
    const rawList = Array.isArray(res) ? res : [];
    return rawList.map(mapDbCode("naics_code", "NAICS Code")).filter(Boolean);
  } catch (err) {
    console.error("Hasura NAICS error:", err);
    return [];
  }
}

export async function getSICCodes(params?: {
  organization_id?: number;
  limit?: number;
  offset?: number;
}): Promise<SICCode[]> {
  try {
    const query = `
      query GetSIC($limit: Int, $offset: Int) {
        aa_s_organization_sic_codes(
          distinct_on: [sic_code]
          order_by: [{ sic_code: asc }]
          limit: $limit
          offset: $offset
        ) {
          id
          organization_id
          sic_code
          organization {
            id
            name
          }
        }
      }
    `;
    const res = await listGraphQL({
      query,
      variables: {
        limit: params?.limit || 30,
        offset: params?.offset || 0,
      },
      operationName: "GetSIC",
    });
    const rawList = Array.isArray(res) ? res : [];
    return rawList.map(mapDbCode("sic_code", "SIC Code")).filter(Boolean);
  } catch (err) {
    console.error("Hasura SIC error:", err);
    return [];
  }
}
