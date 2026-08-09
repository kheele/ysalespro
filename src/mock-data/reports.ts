import {
  CompanyAnalyticsReport,
  IndustryAnalyticsReport,
  LeadConversionReport,
  EmailPerformanceReport,
  OutreachPerformanceReport,
  SalesActivityReport,
} from '@/lib/types';

export const MOCK_COMPANY_ANALYTICS: CompanyAnalyticsReport[] = [
  { company_id: "org-1", company_name: "Apex CyberSecurity Corp", industry: "Cybersecurity", employee_count: 1450, revenue: "$180M", leads_count: 42, deals_won: 8, pipeline_value: "$1.2M" },
  { company_id: "org-2", company_name: "FinPulse Financial AI", industry: "Fintech", employee_count: 820, revenue: "$95M", leads_count: 28, deals_won: 5, pipeline_value: "$850k" },
  { company_id: "org-3", company_name: "BioHealth Diagnostics", industry: "Healthcare", employee_count: 3100, revenue: "$420M", leads_count: 64, deals_won: 12, pipeline_value: "$2.8M" },
  { company_id: "org-4", company_name: "OmniLogistics Supply Systems", industry: "Logistics", employee_count: 5400, revenue: "$610M", leads_count: 51, deals_won: 9, pipeline_value: "$1.9M" },
  { company_id: "org-5", company_name: "RoboTech Industrial Automation", industry: "Manufacturing", employee_count: 2200, revenue: "$290M", leads_count: 37, deals_won: 6, pipeline_value: "$1.4M" },
];

export const MOCK_INDUSTRY_ANALYTICS: IndustryAnalyticsReport[] = [
  { industry_name: "Cybersecurity & SaaS", company_count: 340, total_leads: 1280, conversion_rate: "24.5%", avg_deal_size: "$145,000", growth_rate: "+18.2%" },
  { industry_name: "Fintech & Banking", company_count: 280, total_leads: 940, conversion_rate: "21.8%", avg_deal_size: "$180,000", growth_rate: "+14.6%" },
  { industry_name: "Healthcare & Biotech", company_count: 410, total_leads: 1650, conversion_rate: "19.2%", avg_deal_size: "$210,000", growth_rate: "+22.1%" },
  { industry_name: "Supply Chain & Logistics", company_count: 520, total_leads: 1890, conversion_rate: "17.4%", avg_deal_size: "$125,000", growth_rate: "+9.8%" },
  { industry_name: "Heavy Manufacturing", company_count: 390, total_leads: 1120, conversion_rate: "15.8%", avg_deal_size: "$160,000", growth_rate: "+11.3%" },
];

export const MOCK_LEAD_CONVERSION: LeadConversionReport[] = [
  { stage: "Cold Prospects", count: 5000, conversion_rate: "100%", dropoff_rate: "0%", avg_days_in_stage: 1 },
  { stage: "First Contacted", count: 3200, conversion_rate: "64.0%", dropoff_rate: "36.0%", avg_days_in_stage: 3 },
  { stage: "Warm Engaged", count: 1850, conversion_rate: "37.0%", dropoff_rate: "42.2%", avg_days_in_stage: 6 },
  { stage: "Hot Qualified", count: 890, conversion_rate: "17.8%", dropoff_rate: "51.9%", avg_days_in_stage: 8 },
  { stage: "Demo Scheduled", count: 420, conversion_rate: "8.4%", dropoff_rate: "52.8%", avg_days_in_stage: 5 },
  { stage: "Closed Won", count: 215, conversion_rate: "4.3%", dropoff_rate: "48.8%", avg_days_in_stage: 14 },
];

export const MOCK_EMAIL_PERFORMANCE: EmailPerformanceReport[] = [
  { campaign_name: "Q3 CTO Enterprise Outreach", emails_sent: 1420, delivered_percent: "99.2%", open_rate: "48.5%", click_rate: "18.2%", reply_rate: "12.4%", bounce_rate: "0.8%" },
  { campaign_name: "SOC-2 Compliance Automation", emails_sent: 980, delivered_percent: "98.8%", open_rate: "52.1%", click_rate: "22.4%", reply_rate: "15.8%", bounce_rate: "1.2%" },
  { campaign_name: "Healthcare HIPAA Solutions", emails_sent: 1650, delivered_percent: "99.5%", open_rate: "44.2%", click_rate: "14.6%", reply_rate: "9.1%", bounce_rate: "0.5%" },
  { campaign_name: "Logistics Fleet Operations", emails_sent: 1100, delivered_percent: "98.5%", open_rate: "41.8%", click_rate: "12.9%", reply_rate: "8.3%", bounce_rate: "1.5%" },
];

export const MOCK_OUTREACH_PERFORMANCE: OutreachPerformanceReport[] = [
  { channel: "Email", total_attempts: 5150, connected_count: 2470, connect_rate: "48.0%", meetings_booked: 185, conversion_rate: "3.6%" },
  { channel: "Phone", total_attempts: 1420, connected_count: 610, connect_rate: "43.0%", meetings_booked: 112, conversion_rate: "7.9%" },
  { channel: "LinkedIn", total_attempts: 2100, connected_count: 1180, connect_rate: "56.2%", meetings_booked: 94, conversion_rate: "4.5%" },
  { channel: "Meeting", total_attempts: 391, connected_count: 391, connect_rate: "100%", meetings_booked: 215, conversion_rate: "55.0%" },
];

export const MOCK_SALES_ACTIVITY: SalesActivityReport[] = [
  { rep_name: "Alex Rivers", emails_sent: 1840, calls_made: 420, linkedin_messages: 650, meetings_held: 84, deals_closed: 28, revenue_generated: "$1,450,000" },
  { rep_name: "Sarah Connor", emails_sent: 1620, calls_made: 380, linkedin_messages: 590, meetings_held: 76, deals_closed: 24, revenue_generated: "$1,280,000" },
  { rep_name: "David Kim", emails_sent: 1450, calls_made: 310, linkedin_messages: 510, meetings_held: 62, deals_closed: 19, revenue_generated: "$940,000" },
  { rep_name: "Elena Vance", emails_sent: 1290, calls_made: 290, linkedin_messages: 480, meetings_held: 55, deals_closed: 16, revenue_generated: "$810,000" },
];
