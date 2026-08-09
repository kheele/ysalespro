export interface GrowthTrendPoint {
  month: string;
  organizations: number;
  leads: number;
  revenue: number;
}

export interface IndustryDistributionPoint {
  name: string;
  value: number;
  color: string;
}

export interface LocationDistributionPoint {
  country: string;
  count: number;
}

export interface SizeDistributionPoint {
  range: string;
  count: number;
}

export interface PipelineStagePoint {
  stage: string;
  count: number;
  value: number;
}

export interface OutreachPerfPoint {
  day: string;
  sent: number;
  opened: number;
  clicked: number;
}

export const analyticsServices = {
  async getOrganizationGrowthTrend(): Promise<GrowthTrendPoint[]> {
    return [
      { month: "Jan", organizations: 820, leads: 310, revenue: 140000 },
      { month: "Feb", organizations: 890, leads: 340, revenue: 165000 },
      { month: "Mar", organizations: 960, leads: 390, revenue: 190000 },
      { month: "Apr", organizations: 1040, leads: 420, revenue: 210000 },
      { month: "May", organizations: 1110, leads: 460, revenue: 245000 },
      { month: "Jun", organizations: 1180, leads: 490, revenue: 280000 },
      { month: "Jul", organizations: 1248, leads: 520, revenue: 315000 },
    ];
  },

  async getIndustryDistribution(): Promise<IndustryDistributionPoint[]> {
    return [
      { name: "Cloud Infrastructure", value: 35, color: "#6366f1" },
      { name: "Cybersecurity", value: 25, color: "#a855f7" },
      { name: "Fintech & AI", value: 20, color: "#ec4899" },
      { name: "Healthcare Tech", value: 12, color: "#10b981" },
      { name: "Logistics", value: 8, color: "#f59e0b" },
    ];
  },

  async getLocationDistribution(): Promise<LocationDistributionPoint[]> {
    return [
      { country: "United States", count: 720 },
      { country: "United Kingdom", count: 180 },
      { country: "Germany", count: 140 },
      { country: "Canada", count: 110 },
      { country: "Australia", count: 98 },
    ];
  },

  async getEmployeeSizeDistribution(): Promise<SizeDistributionPoint[]> {
    return [
      { range: "1-50", count: 280 },
      { range: "51-200", count: 420 },
      { range: "201-500", count: 310 },
      { range: "501-1000", count: 140 },
      { range: "1000+", count: 98 },
    ];
  },

  async getLeadPipelineData(): Promise<PipelineStagePoint[]> {
    return [
      { stage: "Prospect Orgs", count: 1248, value: 3100000 },
      { stage: "Cold Leads", count: 210, value: 1250000 },
      { stage: "Warm Leads", count: 180, value: 940000 },
      { stage: "Hot Leads", count: 130, value: 680000 },
      { stage: "Closed Won", count: 48, value: 410000 },
    ];
  },

  async getOutreachPerformance(): Promise<OutreachPerfPoint[]> {
    return [
      { day: "Mon", sent: 2400, opened: 1650, clicked: 720 },
      { day: "Tue", sent: 2800, opened: 1980, clicked: 890 },
      { day: "Wed", sent: 3100, opened: 2200, clicked: 990 },
      { day: "Thu", sent: 2900, opened: 2050, clicked: 910 },
      { day: "Fri", sent: 2100, opened: 1420, clicked: 610 },
      { day: "Sat", sent: 500, opened: 280, clicked: 90 },
      { day: "Sun", sent: 450, opened: 260, clicked: 80 },
    ];
  }
};
