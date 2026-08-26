'use server';

import {
  GrowthTrendPoint,
  IndustryDistributionPoint,
  LocationDistributionPoint,
  SizeDistributionPoint,
  PipelineStagePoint,
  OutreachPerfPoint,
} from '@/lib/types';
import * as organizationServices from '../public/organizationServices';
import * as industryServices from '../public/industryServices';
import * as leadServices from './leadServices';
import * as outreachServices from './outreachServices';

const INDUSTRY_COLORS = [
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
];

export async function getOrganizationGrowthTrendActionByToken(token: string): Promise<GrowthTrendPoint[]> {
  try {
    const [orgsRes, leadsList] = await Promise.all([
      organizationServices.getOrganizations({ limit: 1 }),
      leadServices.getLeadsActionByToken(token),
    ]);

    const totalOrgs = orgsRes?.total || 0;
    const leads = Array.isArray(leadsList) ? leadsList : [];
    const totalLeads = leads.length;
    const totalScore = leads.reduce((sum: number, l) => sum + Number(l.lead_score || 0), 0);

    // Generate rolling last 6 calendar months from today
    const now = new Date();
    const monthNames: string[] = [];
    const monthDates: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthNames.push(d.toLocaleDateString('en-US', { month: 'short' }));
      monthDates.push(new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59));
    }

    return monthNames.map((month, idx) => {
      const cutoff = monthDates[idx].getTime();
      const leadsUpToMonth = leads.filter((l) => {
        if (!l.created_at) return true;
        return new Date(l.created_at).getTime() <= cutoff;
      });

      const leadsCount = leads.some((l) => !!l.created_at)
        ? leadsUpToMonth.length
        : Math.round(totalLeads * ((idx + 1) / monthNames.length));

      const scoreUpToMonth = leads.some((l) => !!l.created_at)
        ? leadsUpToMonth.reduce((sum, l) => sum + Number(l.lead_score || 0), 0)
        : Math.round(totalScore * ((idx + 1) / monthNames.length));

      const factor = (idx + 1) / monthNames.length;
      const orgsCount = Math.round(totalOrgs * factor);

      return {
        month,
        organizations: orgsCount,
        leads: leadsCount,
        revenue: scoreUpToMonth,
      };
    });
  } catch (err) {
    console.error('getOrganizationGrowthTrend error:', err);
    return [];
  }
}

export async function getIndustryDistributionAction(): Promise<IndustryDistributionPoint[]> {
  try {
    const indRes = await industryServices.getIndustries({ limit: 8 });
    const list = indRes?.industries || [];

    return list.map((ind, idx) => ({
      name: ind.name || 'Other',
      value: ind.organization_count || 0,
      color: INDUSTRY_COLORS[idx % INDUSTRY_COLORS.length],
    }));
  } catch (err) {
    console.error('getIndustryDistribution error:', err);
    return [];
  }
}

export async function getLocationDistributionAction(): Promise<LocationDistributionPoint[]> {
  try {
    const orgsRes = await organizationServices.getOrganizations({ limit: 100 });
    const list = orgsRes?.organizations || [];

    const countryMap: Record<string, number> = {};
    for (const org of list) {
      const country = org.country || org.headquarters_location?.split(',')[0]?.trim() || 'Global';
      countryMap[country] = (countryMap[country] || 0) + 1;
    }

    return Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));
  } catch (err) {
    console.error('getLocationDistribution error:', err);
    return [];
  }
}

export async function getEmployeeSizeDistributionAction(): Promise<SizeDistributionPoint[]> {
  try {
    const orgsRes = await organizationServices.getOrganizations({ limit: 100 });
    const list = orgsRes?.organizations || [];

    let micro = 0;
    let small = 0;
    let mid1 = 0;
    let mid2 = 0;
    let ent = 0;

    for (const org of list) {
      const count = org.employee_count || 0;
      if (count <= 10) micro++;
      else if (count <= 50) small++;
      else if (count <= 200) mid1++;
      else if (count <= 1000) mid2++;
      else ent++;
    }

    return [
      { range: '1-10', count: micro },
      { range: '11-50', count: small },
      { range: '51-200', count: mid1 },
      { range: '201-1000', count: mid2 },
      { range: '1000+', count: ent },
    ];
  } catch (err) {
    console.error('getEmployeeSizeDistribution error:', err);
    return [];
  }
}

export async function getLeadPipelineDataActionByToken(token: string): Promise<PipelineStagePoint[]> {
  try {
    const leads = await leadServices.getLeadsActionByToken(token);
    const leadsList = Array.isArray(leads) ? leads : [];

    const stages: Record<string, { count: number; value: number }> = {
      Cold: { count: 0, value: 0 },
      Warm: { count: 0, value: 0 },
      Hot: { count: 0, value: 0 },
    };

    for (const l of leadsList) {
      const stage = l.stage || (l.lead_temperature === 'HOT' ? 'Hot' : l.lead_temperature === 'WARM' ? 'Warm' : 'Cold');
      if (!stages[stage]) {
        stages[stage] = { count: 0, value: 0 };
      }
      stages[stage].count += 1;
      stages[stage].value += Number(l.lead_score || 0);
    }

    return Object.entries(stages).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value,
    }));
  } catch (err) {
    console.error('getLeadPipelineData error:', err);
    return [];
  }
}

export async function getOutreachPerformanceActionByToken(token: string): Promise<OutreachPerfPoint[]> {
  try {
    const activities = await outreachServices.getOutreachActivitiesActionByToken(token);
    const actList = Array.isArray(activities) ? activities : [];

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dayMap: Record<string, { sent: number; opened: number; clicked: number }> = {
      Mon: { sent: 0, opened: 0, clicked: 0 },
      Tue: { sent: 0, opened: 0, clicked: 0 },
      Wed: { sent: 0, opened: 0, clicked: 0 },
      Thu: { sent: 0, opened: 0, clicked: 0 },
      Fri: { sent: 0, opened: 0, clicked: 0 },
    };

    actList.forEach((act) => {
      const date = act.created_at || act.date ? new Date(act.created_at || act.date) : new Date();
      const dayName = date.toLocaleDateString('en-ZA', { weekday: 'short' });
      if (dayMap[dayName]) {
        dayMap[dayName].sent += 1;
        if (act.status === 'Opened' || act.status === 'Replied' || act.status === 'Completed') {
          dayMap[dayName].opened += 1;
        }
        if (act.status === 'Clicked' || act.status === 'Replied') {
          dayMap[dayName].clicked += 1;
        }
      }
    });

    return days.map((day) => ({
      day,
      sent: dayMap[day].sent,
      opened: dayMap[day].opened,
      clicked: dayMap[day].clicked,
    }));
  } catch (err) {
    console.error('getOutreachPerformance error:', err);
    return [];
  }
}
