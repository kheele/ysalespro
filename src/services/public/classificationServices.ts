'use server';

import { listGraphQL } from "@/graphql";
import { NAICSCode, SICCode } from "@/lib/types";

export async function getNAICSCodes(params?: {
  organization_id?: number;
  limit?: number;
  offset?: number;
}): Promise<NAICSCode[]> {
  try {
    const query = `
      query GetNAICS($limit: Int, $offset: Int) {
        aa_s_organization_naics_codes(limit: $limit, offset: $offset) {
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
        limit: params?.limit || 100,
        offset: params?.offset || 0,
      },
      operationName: "GetNAICS",
    });
    const rawList = Array.isArray(res) ? res : [];

    return rawList.map((n: any) => ({
      id: n.id,
      organization_id: n.organization_id,
      naics_code: n.naics_code || "",
      code: n.naics_code || "",
      title: n.naics_code || "NAICS Code",
      organization_count: 1,
      organization: n.organization,
    }));
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
        aa_s_organization_sic_codes(limit: $limit, offset: $offset) {
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
        limit: params?.limit || 100,
        offset: params?.offset || 0,
      },
      operationName: "GetSIC",
    });
    const rawList = Array.isArray(res) ? res : [];

    return rawList.map((s: any) => ({
      id: s.id,
      organization_id: s.organization_id,
      sic_code: s.sic_code || "",
      code: s.sic_code || "",
      title: s.sic_code || "SIC Code",
      organization_count: 1,
      organization: s.organization,
    }));
  } catch (err) {
    console.error("Hasura SIC error:", err);
    return [];
  }
}
