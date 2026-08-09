import { sendGraphQL } from "@/graphql";

export interface Keyword {
  id: string;
  name: string;
  usage_count?: number;
}

const MOCK_KEYWORDS: Keyword[] = [
  { id: "kw-1", name: "SaaS", usage_count: 450 },
  { id: "kw-2", name: "Kubernetes", usage_count: 230 },
  { id: "kw-3", name: "Zero Trust", usage_count: 180 },
  { id: "kw-4", name: "Machine Learning", usage_count: 390 },
  { id: "kw-5", name: "Fintech AI", usage_count: 140 },
  { id: "kw-6", name: "Cybersecurity", usage_count: 310 },
  { id: "kw-7", name: "Supply Chain", usage_count: 120 },
];

export const keywordServices = {
  async getKeywords(): Promise<Keyword[]> {
    try {
      const query = `
        query GetKeywords {
          aa_s_keywords {
            id
            name
          }
        }
      `;
      const res = await sendGraphQL({ query });
      if (res && Array.isArray(res)) {
        return res.map(k => ({
          id: k.id,
          name: k.name,
          usage_count: Math.floor(Math.random() * 200) + 50
        }));
      }
    } catch (err) {
      console.warn("Hasura keywordServices fallback:", err);
    }
    return MOCK_KEYWORDS;
  }
};
