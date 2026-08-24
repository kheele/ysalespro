'use server';

import * as organizationServices from "../public/organizationServices";
import * as industryServices from "../public/industryServices";
import * as peopleServices from "../public/peopleServices";
import * as leadServices from "./leadServices";
import * as outreachServices from "./outreachServices";
import { DashboardKPIs, ActivityFeedItem } from "@/lib/types";

export async function getKPIsActionByToken(token: string): Promise<DashboardKPIs> {
  try {
    const [
      orgsRes,
      indRes,
      peopleRes,
      leads,
      outreachList,
    ] = await Promise.all([
      organizationServices.getOrganizations({ limit: 1 }),
      industryServices.getIndustries({ limit: 100 }),
      peopleServices.getDecisionMakersAction({ limit: 1 }),
      leadServices.getLeadsActionByToken(token),
      outreachServices.getOutreachActivitiesActionByToken(token),
    ]);

    const totalOrgs = orgsRes?.total || 0;
    const totalIndustries = indRes?.total || 0;
    const industriesList = indRes?.industries || [];
    const totalPeople = peopleRes?.total || 0;

    const leadsList = Array.isArray(leads) ? leads : [];
    const cold = leadsList.filter(l => (l.status || l.stage) === 'Cold' || l.pipeline_stage === 'Cold').length;
    const warm = leadsList.filter(l => (l.status || l.stage) === 'Warm' || l.pipeline_stage === 'Warm').length;
    const hot = leadsList.filter(l => (l.status || l.stage) === 'Hot' || l.pipeline_stage === 'Hot' || l.pipeline_stage === 'Customer').length;

    const activities = Array.isArray(outreachList) ? outreachList : [];
    const emailsSent = activities.filter(a => a.channel === "Email" || !a.channel).length;
    const callsMade = activities.filter(a => a.channel === "Phone").length;
    const followupsPending = activities.filter(a => a.status === "Scheduled" || a.next_followup).length;
    const meetingsScheduled = activities.filter(a => a.outcome === "Meeting Booked" || a.response === "Scheduled").length;

    const topIndustries = [...industriesList]
      .sort((a, b) => (b.organization_count || 0) - (a.organization_count || 0))
      .slice(0, 5)
      .map(ind => ({
        name: ind.name || "Unnamed",
        count: ind.organization_count || 0,
      }));

    return {
      companies: {
        total: totalOrgs,
        newToday: 0,
        newThisMonth: totalOrgs,
      },
      industries: {
        total: totalIndustries,
        topIndustries,
      },
      people: {
        totalDecisionMakers: totalPeople,
      },
      leads: {
        total: leadsList.length,
        cold,
        warm,
        hot,
      },
      outreach: {
        emailsSent,
        callsMade,
        followupsPending,
        meetingsScheduled,
      },
    };
  } catch (err) {
    console.error("Dashboard KPIs error:", err);
    return {
      companies: { total: 0, newToday: 0, newThisMonth: 0 },
      industries: { total: 0, topIndustries: [] },
      people: { totalDecisionMakers: 0 },
      leads: { total: 0, cold: 0, warm: 0, hot: 0 },
      outreach: { emailsSent: 0, callsMade: 0, followupsPending: 0, meetingsScheduled: 0 },
    };
  }
}

export async function getActivityFeedActionByToken(token: string): Promise<ActivityFeedItem[]> {
  try {
    const activities = await outreachServices.getOutreachActivitiesActionByToken(token);
    if (Array.isArray(activities) && activities.length > 0) {
      return activities.slice(0, 10).map((a: any) => ({
        id: a.id,
        type: a.channel === "Phone" ? "call_completed" : "email_sent",
        title: a.subject || `${a.channel || "Outreach"} activity`,
        description: a.message || `Outreach to ${a.recipient_name || "contact"} at ${a.recipient_org || "organization"}`,
        timestamp: a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (a.date || "Recent"),
        user: a.assigned_to || "Sales Team",
        badgeColor: a.channel === "Phone"
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-blue-500/10 text-blue-400 border-blue-500/20",
      }));
    }
  } catch (err) {
    console.error("Hasura getActivityFeed error:", err);
  }
  return [];
}
