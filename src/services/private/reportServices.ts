'use server';

import {
  CompanyAnalyticsReport,
  IndustryAnalyticsReport,
  LeadConversionReport,
  EmailPerformanceReport,
  OutreachPerformanceReport,
  SalesActivityReport,
} from '@/lib/types';
import * as organizationServices from '../public/organizationServices';
import * as industryServices from '../public/industryServices';
import * as leadServices from './leadServices';
import * as outreachServices from './outreachServices';
import * as campaignServices from './campaignServices';
import { toTitleCase } from '@/lib/utils';

function parseDealValue(val: number | string | undefined | null): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function getCompanyAnalyticsReportsActionByToken(token: string): Promise<CompanyAnalyticsReport[]> {
  try {
    const [orgsRes, leads] = await Promise.all([
      organizationServices.getOrganizations({ limit: 50 }),
      leadServices.getLeadsActionByToken(token),
    ]);

    const orgs = orgsRes?.organizations || [];
    const leadsList = Array.isArray(leads) ? leads : [];

    return orgs.map((org: any) => {
      const orgName = org.name || "Unnamed";
      const matchingLeads = leadsList.filter((l) => l.company_name === orgName);

      const dealsWon = matchingLeads.filter(
        (l) => l.stage === "Customer" || l.stage === "Closed Won"
      ).length;

      const pipelineTotal = matchingLeads.reduce((acc: number, l) => acc + (l.lead_score || 0), 0);
      const leadsCount = matchingLeads.length > 0
        ? matchingLeads.length
        : (org.people_list ? org.people_list.length : (org.decision_makers ? org.decision_makers.length : 0));

      return {
        company_id: String(org.id),
        company_name: orgName,
        industry: toTitleCase(org.primary_industry || org.industry || "General Industry"),
        employee_count: org.estimated_num_employees ?? org.employee_count ?? 0,
        revenue: org.organization_revenue_str || (org.organization_revenue ? `$${(org.organization_revenue / 1000000).toFixed(1)}M` : "N/A"),
        leads_count: leadsCount,
        deals_won: dealsWon,
        pipeline_value: pipelineTotal > 0 ? `Score: ${pipelineTotal}` : "0",
      };
    });
  } catch (err) {
    console.error("getCompanyAnalyticsReports error:", err);
    return [];
  }
}

export async function getIndustryAnalyticsReportsActionByToken(token: string): Promise<IndustryAnalyticsReport[]> {
  try {
    const [indRes, leads] = await Promise.all([
      industryServices.getIndustries({ limit: 50 }),
      leadServices.getLeadsActionByToken(token),
    ]);

    const industries = indRes?.industries || [];
    const leadsList = Array.isArray(leads) ? leads : [];
    const totalAllLeads = leadsList.length;

    return industries.map((ind: any) => {
      const indName = toTitleCase(ind.name || "Industry");
      const matchingLeads = leadsList.filter((l) => l.industry === indName);
      const totalLeads = matchingLeads.length;
      const customers = matchingLeads.filter((l) => l.stage === "Customer" || l.stage === "Closed Won").length;
      const convRate = totalLeads > 0 ? `${Math.round((customers / totalLeads) * 100)}%` : "0%";

      const totalValue = matchingLeads.reduce((acc: number, l) => acc + (l.lead_score || 0), 0);
      const avgValue = totalLeads > 0 ? totalValue / totalLeads : 0;
      const avgDealSize = avgValue > 0 ? `${Math.round(avgValue)} score` : "0";

      const sharePct = totalAllLeads > 0 ? Math.round((totalLeads / totalAllLeads) * 100) : 0;
      const growthRate = sharePct > 0 ? `+${sharePct}%` : "0%";

      return {
        industry_name: indName,
        company_count: ind.organization_count ?? 0,
        total_leads: totalLeads,
        conversion_rate: convRate,
        avg_deal_size: avgDealSize,
        growth_rate: growthRate,
      };
    });
  } catch (err) {
    console.error("getIndustryAnalyticsReports error:", err);
    return [];
  }
}

export async function getLeadConversionReportsActionByToken(token: string): Promise<LeadConversionReport[]> {
  try {
    const leads = await leadServices.getLeadsActionByToken(token);
    const leadsList = Array.isArray(leads) ? leads : [];
    const total = leadsList.length;

    const stages = ["Cold", "Contacted", "Warm", "Hot", "Customer"];
    return stages.map((stage) => {
      const stageLeads = leadsList.filter((l) => l.stage === stage);
      const count = stageLeads.length;
      const convRate = total > 0 ? `${Math.round((count / total) * 100)}%` : "0%";
      const dropRate = total > 0 ? `${Math.max(0, 100 - Math.round((count / total) * 100))}%` : "0%";

      const now = new Date().getTime();
      const daysSum = stageLeads.reduce((acc, l) => {
        const dateStr = l.updated_at || l.created_at;
        if (!dateStr) return acc + 1;
        const diffTime = Math.abs(now - new Date(dateStr).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return acc + (isNaN(diffDays) ? 1 : Math.max(1, diffDays));
      }, 0);

      const avgDays = stageLeads.length > 0 ? Math.round(daysSum / stageLeads.length) : 0;

      return {
        stage,
        count,
        conversion_rate: convRate,
        dropoff_rate: dropRate,
        avg_days_in_stage: avgDays,
      };
    });
  } catch (err) {
    console.error("getLeadConversionReports error:", err);
    return [];
  }
}

export async function getEmailPerformanceReportsActionByToken(token: string): Promise<EmailPerformanceReport[]> {
  try {
    const [activities, campaigns] = await Promise.all([
      outreachServices.getOutreachActivitiesActionByToken(token),
      campaignServices.getCampaignsActionByToken(token).catch(() => []),
    ]);

    const actList = Array.isArray(activities) ? activities : [];
    const campaignList = Array.isArray(campaigns) ? campaigns : [];
    const emailActs = actList.filter((a) => a.channel === "Email");

    if (campaignList.length > 0) {
      return campaignList.map((camp) => {
        const campEmails = emailActs.filter(
          (a) => String(a.campaign_id) === String(camp.id) || a.campaign_name === camp.name
        );
        const totalSent = campEmails.length > 0 ? campEmails.length : (camp.sent_count ?? 0);
        const delivered = campEmails.filter((a) => a.status !== "Bounced").length;
        const opened = campEmails.filter((a) => a.status === "Opened" || a.status === "Replied" || a.status === "Clicked").length;
        const clicked = campEmails.filter((a) => a.status === "Clicked").length;
        const replied = campEmails.filter((a) => a.status === "Replied").length;
        const bounced = campEmails.filter((a) => a.status === "Bounced").length;

        return {
          campaign_name: camp.name || "Untitled Campaign",
          emails_sent: totalSent,
          delivered_percent: totalSent > 0 ? `${Math.round((delivered / totalSent) * 100)}%` : "0%",
          open_rate: totalSent > 0 ? `${Math.round((opened / totalSent) * 100)}%` : "0%",
          click_rate: totalSent > 0 ? `${Math.round((clicked / totalSent) * 100)}%` : "0%",
          reply_rate: totalSent > 0 ? `${Math.round((replied / totalSent) * 100)}%` : "0%",
          bounce_rate: totalSent > 0 ? `${Math.round((bounced / totalSent) * 100)}%` : "0%",
        };
      });
    }

    const total = emailActs.length;
    const delivered = emailActs.filter((a) => a.status !== "Bounced").length;
    const opened = emailActs.filter((a) => a.status === "Opened" || a.status === "Replied" || a.status === "Clicked").length;
    const clicked = emailActs.filter((a) => a.status === "Clicked").length;
    const replied = emailActs.filter((a) => a.status === "Replied").length;
    const bounced = emailActs.filter((a) => a.status === "Bounced").length;

    return [
      {
        campaign_name: "All Email Sequences",
        emails_sent: total,
        delivered_percent: total > 0 ? `${Math.round((delivered / total) * 100)}%` : "0%",
        open_rate: total > 0 ? `${Math.round((opened / total) * 100)}%` : "0%",
        click_rate: total > 0 ? `${Math.round((clicked / total) * 100)}%` : "0%",
        reply_rate: total > 0 ? `${Math.round((replied / total) * 100)}%` : "0%",
        bounce_rate: total > 0 ? `${Math.round((bounced / total) * 100)}%` : "0%",
      },
    ];
  } catch (err) {
    console.error("getEmailPerformanceReports error:", err);
    return [];
  }
}

export async function getOutreachPerformanceReportsActionByToken(token: string): Promise<OutreachPerformanceReport[]> {
  try {
    const activities = await outreachServices.getOutreachActivitiesActionByToken(token);
    const actList = Array.isArray(activities) ? activities : [];

    const channels = ["Email", "Phone", "LinkedIn"] as const;
    return channels.map((channel) => {
      const channelActs = actList.filter((a) => a.channel === channel);
      const total = channelActs.length;
      const connected = channelActs.filter(
        (a) => a.status === "Connected" || a.status === "Delivered" || a.status === "Replied" || a.status === "Opened" || a.status === "Completed"
      ).length;
      const meetings = channelActs.filter((a) => a.status === "Meeting Set" || a.status === "Completed").length;

      return {
        channel,
        total_attempts: total,
        connected_count: connected,
        connect_rate: total > 0 ? `${Math.round((connected / total) * 100)}%` : "0%",
        meetings_booked: meetings,
        conversion_rate: total > 0 ? `${Math.round((meetings / total) * 100)}%` : "0%",
      };
    });
  } catch (err) {
    console.error("getOutreachPerformanceReports error:", err);
    return [];
  }
}

export async function getSalesActivityReportsActionByToken(token: string): Promise<SalesActivityReport[]> {
  try {
    const [activities, leads] = await Promise.all([
      outreachServices.getOutreachActivitiesActionByToken(token),
      leadServices.getLeadsActionByToken(token),
    ]);

    const actList = Array.isArray(activities) ? activities : [];
    const leadsList = Array.isArray(leads) ? leads : [];

    const repsFromActs = actList.map((a) => a.assigned_to).filter(Boolean) as string[];
    const repsFromLeads = leadsList.map((l) => l.assigned_user).filter(Boolean) as string[];
    const activeReps = Array.from(new Set([...repsFromActs, ...repsFromLeads]));

    if (activeReps.length === 0) {
      return [];
    }

    return activeReps.map((repName) => {
      const repActs = actList.filter((a) => a.assigned_to === repName);
      const repLeads = leadsList.filter((l) => l.assigned_user === repName);

      const emails = repActs.filter((a) => a.channel === "Email").length;
      const calls = repActs.filter((a) => a.channel === "Phone").length;
      const linkedin = repActs.filter((a) => a.channel === "LinkedIn").length;
      const meetings = repActs.filter((a) => a.status === "Meeting Set" || a.status === "Completed").length;

      const closedLeads = repLeads.filter((l) => l.stage === "Customer" || l.stage === "Closed Won");
      const dealsClosed = closedLeads.length;
      const totalScore = closedLeads.reduce((acc: number, l) => acc + (l.lead_score || 0), 0);

      return {
        rep_name: repName,
        emails_sent: emails,
        calls_made: calls,
        linkedin_messages: linkedin,
        meetings_held: meetings,
        deals_closed: dealsClosed,
        revenue_generated: totalScore > 0 ? `Score: ${totalScore}` : "0",
      };
    });
  } catch (err) {
    console.error("getSalesActivityReports error:", err);
    return [];
  }
}
