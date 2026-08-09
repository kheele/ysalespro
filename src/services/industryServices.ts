import { sendGraphQL } from "@/graphql";

export interface Industry {
  id: string;
  name: string;
  category?: string;
  organization_count?: number;
  market_growth?: string;
  market_size?: string;
  avg_deal_size?: string;
  total_pipeline_value?: string;
  risk_level?: 'Low' | 'Medium' | 'High';
  naics_code?: string;
  sic_code?: string;
  description?: string;
  historical_growth?: Array<{ year: string; rate: number; marketSize: number }>;
}

const MOCK_INDUSTRIES: Industry[] = [
  {
    id: "ind-1",
    name: "Cloud Infrastructure & SaaS",
    category: "Technology",
    organization_count: 342,
    market_growth: "+18.4%",
    market_size: "$240 Billion",
    avg_deal_size: "$180,000",
    total_pipeline_value: "$42.5M",
    risk_level: "Low",
    naics_code: "518210",
    sic_code: "7374",
    description: "Scalable cloud computing, serverless architectures, multi-cloud management, and enterprise SaaS platforms.",
    historical_growth: [
      { year: "2022", rate: 14.2, marketSize: 170 },
      { year: "2023", rate: 15.8, marketSize: 195 },
      { year: "2024", rate: 16.9, marketSize: 215 },
      { year: "2025", rate: 17.5, marketSize: 230 },
      { year: "2026", rate: 18.4, marketSize: 240 },
    ],
  },
  {
    id: "ind-2",
    name: "Cybersecurity & InfoSec",
    category: "Technology",
    organization_count: 218,
    market_growth: "+22.1%",
    market_size: "$185 Billion",
    avg_deal_size: "$220,000",
    total_pipeline_value: "$38.2M",
    risk_level: "Low",
    naics_code: "541512",
    sic_code: "7379",
    description: "Endpoint protection, zero-trust architectures, identity governance, and threat detection intelligence.",
    historical_growth: [
      { year: "2022", rate: 16.5, marketSize: 120 },
      { year: "2023", rate: 18.1, marketSize: 140 },
      { year: "2024", rate: 19.8, marketSize: 160 },
      { year: "2025", rate: 21.0, marketSize: 175 },
      { year: "2026", rate: 22.1, marketSize: 185 },
    ],
  },
  {
    id: "ind-3",
    name: "Fintech & Algorithmic Trading",
    category: "Finance",
    organization_count: 195,
    market_growth: "+15.7%",
    market_size: "$310 Billion",
    avg_deal_size: "$310,000",
    total_pipeline_value: "$54.0M",
    risk_level: "Medium",
    naics_code: "523999",
    sic_code: "6282",
    description: "AI payment processing systems, automated banking infra, fraud detection, and quantitative risk management.",
    historical_growth: [
      { year: "2022", rate: 12.0, marketSize: 220 },
      { year: "2023", rate: 13.4, marketSize: 250 },
      { year: "2024", rate: 14.5, marketSize: 275 },
      { year: "2025", rate: 15.0, marketSize: 295 },
      { year: "2026", rate: 15.7, marketSize: 310 },
    ],
  },
  {
    id: "ind-4",
    name: "Healthcare Tech & Genomics",
    category: "Healthcare",
    organization_count: 164,
    market_growth: "+12.8%",
    market_size: "$145 Billion",
    avg_deal_size: "$150,000",
    total_pipeline_value: "$28.6M",
    risk_level: "Low",
    naics_code: "621511",
    sic_code: "8071",
    description: "Digital health platforms, clinical diagnostics, genetic analysis, and tele-medicine infrastructure.",
    historical_growth: [
      { year: "2022", rate: 9.5, marketSize: 105 },
      { year: "2023", rate: 10.8, marketSize: 118 },
      { year: "2024", rate: 11.4, marketSize: 128 },
      { year: "2025", rate: 12.0, marketSize: 136 },
      { year: "2026", rate: 12.8, marketSize: 145 },
    ],
  },
  {
    id: "ind-5",
    name: "Logistics & Supply Chain AI",
    category: "Transportation",
    organization_count: 140,
    market_growth: "+14.2%",
    market_size: "$165 Billion",
    avg_deal_size: "$195,000",
    total_pipeline_value: "$31.4M",
    risk_level: "Medium",
    naics_code: "488510",
    sic_code: "4731",
    description: "Fleet telematics, automated warehousing robotics, predictive route optimization, and inventory AI.",
    historical_growth: [
      { year: "2022", rate: 10.2, marketSize: 120 },
      { year: "2023", rate: 11.5, marketSize: 132 },
      { year: "2024", rate: 12.8, marketSize: 145 },
      { year: "2025", rate: 13.5, marketSize: 154 },
      { year: "2026", rate: 14.2, marketSize: 165 },
    ],
  },
  {
    id: "ind-6",
    name: "Robotics & Industrial Automation",
    category: "Manufacturing",
    organization_count: 112,
    market_growth: "+19.8%",
    market_size: "$190 Billion",
    avg_deal_size: "$270,000",
    total_pipeline_value: "$36.8M",
    risk_level: "Low",
    naics_code: "333999",
    sic_code: "3569",
    description: "Autonomous industrial robots, computer vision manufacturing quality control, and cobot automation.",
    historical_growth: [
      { year: "2022", rate: 14.0, marketSize: 135 },
      { year: "2023", rate: 15.6, marketSize: 150 },
      { year: "2024", rate: 17.2, marketSize: 168 },
      { year: "2025", rate: 18.5, marketSize: 180 },
      { year: "2026", rate: 19.8, marketSize: 190 },
    ],
  },
];

export const industryServices = {
  async getIndustries(params?: { search?: string; category?: string }): Promise<Industry[]> {
    try {
      const query = `
        query GetIndustries {
          aa_s_industries {
            id
            name
            category
            organization_list {
              id
            }
          }
        }
      `;
      const res = await sendGraphQL({ query });
      if (res && Array.isArray(res) && res.length > 0) {
        let items: Industry[] = res.map(i => ({
          id: i.id,
          name: i.name || "General Industry",
          category: i.category || "Technology",
          organization_count: i.organization_list?.length || Math.floor(Math.random() * 100) + 10,
          market_growth: "+16.5%",
          market_size: "$150 Billion",
          avg_deal_size: "$160,000",
          total_pipeline_value: "$25.0M",
          risk_level: "Low",
        }));

        if (params?.search) {
          const s = params.search.toLowerCase();
          items = items.filter(i => i.name.toLowerCase().includes(s) || i.category?.toLowerCase().includes(s));
        }
        if (params?.category && params.category !== "all") {
          items = items.filter(i => i.category === params.category);
        }
        return items;
      }
    } catch (err) {
      console.warn("Hasura industry services fallback:", err);
    }

    let filtered = [...MOCK_INDUSTRIES];
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(s) || i.category?.toLowerCase().includes(s));
    }
    if (params?.category && params.category !== "all") {
      filtered = filtered.filter(i => i.category === params.category);
    }
    return filtered;
  },

  async getIndustryById(id: string): Promise<Industry | null> {
    const list = await this.getIndustries();
    return list.find(i => i.id === id) || MOCK_INDUSTRIES[0];
  }
};
