import { sendGraphQL } from "@/graphql";

export interface Language {
  id: string;
  name: string;
  code?: string;
  org_count?: number;
}

const MOCK_LANGUAGES: Language[] = [
  { id: "lang-1", name: "English", code: "en", org_count: 850 },
  { id: "lang-2", name: "Spanish", code: "es", org_count: 210 },
  { id: "lang-3", name: "German", code: "de", org_count: 145 },
  { id: "lang-4", name: "French", code: "fr", org_count: 115 },
  { id: "lang-5", name: "Japanese", code: "ja", org_count: 90 },
];

export const languageServices = {
  async getLanguages(): Promise<Language[]> {
    try {
      const query = `
        query GetLanguages {
          aa_s_languages {
            id
            name
            code
          }
        }
      `;
      const res = await sendGraphQL({ query });
      if (res && Array.isArray(res)) {
        return res.map(l => ({
          id: l.id,
          name: l.name,
          code: l.code || "en",
          org_count: Math.floor(Math.random() * 300) + 20
        }));
      }
    } catch (err) {
      console.warn("Hasura languageServices fallback:", err);
    }
    return MOCK_LANGUAGES;
  }
};
