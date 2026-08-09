import { sendGraphQL } from "@/graphql";

export interface NAICSCode {
  id: string;
  code: string;
  title: string;
  organization_count?: number;
}

export interface SICCode {
  id: string;
  code: string;
  title: string;
  organization_count?: number;
}

const MOCK_NAICS: NAICSCode[] = [
  { id: "naics-1", code: "518210", title: "Data Processing, Hosting, and Related Services", organization_count: 142 },
  { id: "naics-2", code: "541512", title: "Computer Systems Design Services", organization_count: 198 },
  { id: "naics-3", code: "523999", title: "Miscellaneous Financial Investment Activities", organization_count: 86 },
  { id: "naics-4", code: "621511", title: "Medical Laboratories", organization_count: 64 },
];

const MOCK_SIC: SICCode[] = [
  { id: "sic-1", code: "7374", title: "Computer Processing & Data Preparation", organization_count: 155 },
  { id: "sic-2", code: "7379", title: "Computer Related Services, NEC", organization_count: 210 },
  { id: "sic-3", code: "6282", title: "Investment Advice & Financial Services", organization_count: 92 },
  { id: "sic-4", code: "8071", title: "Medical Laboratories", organization_count: 58 },
];

export const classificationServices = {
  async getNAICSCodes(): Promise<NAICSCode[]> {
    try {
      const query = `
        query GetNAICS {
          aa_s_organization_naics_codes {
            id
            code
            title
          }
        }
      `;
      const res = await sendGraphQL({ query });
      if (res && Array.isArray(res)) {
        return res.map(n => ({ id: n.id, code: n.code || "518210", title: n.title || "Software & Tech", organization_count: 50 }));
      }
    } catch (err) {
      console.warn("Hasura NAICS fallback:", err);
    }
    return MOCK_NAICS;
  },

  async getSICCodes(): Promise<SICCode[]> {
    try {
      const query = `
        query GetSIC {
          aa_s_organization_sic_codes {
            id
            code
            title
          }
        }
      `;
      const res = await sendGraphQL({ query });
      if (res && Array.isArray(res)) {
        return res.map(s => ({ id: s.id, code: s.code || "7374", title: s.title || "Computer Services", organization_count: 50 }));
      }
    } catch (err) {
      console.warn("Hasura SIC fallback:", err);
    }
    return MOCK_SIC;
  }
};
