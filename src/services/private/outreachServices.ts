'use server';

import { listGraphQL, insertGraphQL } from "@/graphql";
import { OutreachActivity, OutreachChannel, OutreachStatus } from '@/lib/types';
import { GetOutreachParams } from '@/lib/types_params';
import { getAccountCompanyIdFromClaims } from '@/lib/auth-utils';

function mapDbOutreach(item: any): OutreachActivity {
  const channelName = (item.channel as OutreachChannel) || "Email";
  const name = item.lead_name || "";
  const company = item.company_name || "";
  const subj = item.subject_or_type || "";

  return {
    id: item.id,
    account_company_id: item.account_company_id,
    lead_id: item.lead_id,
    campaign_id: item.campaign_id,
    channel: channelName,
    type: channelName,
    recipient_name: name,
    lead_name: name,
    company_name: company,
    recipient_org: company,
    recipient_title: item.recipient_title || "",
    recipient_email: item.recipient_email || "",
    subject_or_type: subj,
    subject: subj,
    message: item.response_preview || "",
    date: item.date
      ? new Date(item.date).toISOString().split("T")[0]
      : item.created_at
      ? new Date(item.created_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    timestamp: item.date || item.created_at || new Date().toISOString(),
    status: (item.status as OutreachStatus) || "Sent",
    response_preview: item.response_preview || "",
    response: item.response_preview || "",
    outcome: item.status || "",
    next_followup: item.next_followup
      ? new Date(item.next_followup).toISOString().split("T")[0]
      : "",
    followup_days: 3,
    created_at: item.created_at,
    account_company: item.account_company,
    campaign: item.campaign,
    lead: item.lead,
  };
}

export async function getOutreachActivitiesActionByToken(
  token: string,
  params?: GetOutreachParams
): Promise<OutreachActivity[]> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const whereConditions: Record<string, any>[] = [
      { account_company_id: { _eq: companyId } }
    ];

    if (params?.channel && params.channel !== 'all') {
      whereConditions.push({ channel: { _eq: params.channel } });
    }

    if (params?.status && params.status !== 'all') {
      whereConditions.push({ status: { _eq: params.status } });
    }

    if (params?.lead_id) {
      whereConditions.push({ lead_id: { _eq: params.lead_id } });
    }

    if (params?.search) {
      const s = `%${params.search}%`;
      whereConditions.push({
        _or: [
          { lead_name: { _ilike: s } },
          { company_name: { _ilike: s } },
          { subject_or_type: { _ilike: s } },
          { response_preview: { _ilike: s } },
          { channel: { _ilike: s } },
        ],
      });
    }

    const where = { _and: whereConditions };

    const query = `
      query GetOutreach($where: aa_s_outreach_activities_bool_exp) {
        aa_s_outreach_activities(where: $where, order_by: [{ created_at: desc }]) {
          id
          account_company_id
          lead_id
          campaign_id
          date
          channel
          lead_name
          company_name
          subject_or_type
          status
          response_preview
          next_followup
          created_at
        }
      }
    `;

    const data = await listGraphQL({ query, variables: { where }, operationName: "GetOutreach" });
    return Array.isArray(data) ? data.map(mapDbOutreach) : [];
  } catch (err) {
    console.error("Hasura getOutreachActivitiesActionByToken error:", err);
    throw err;
  }
}

export async function logOutreachActionByToken(
  token: string,
  activity: Partial<OutreachActivity>
): Promise<OutreachActivity | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation InsertOutreachActivity($object: aa_s_outreach_activities_insert_input!) {
        insert_aa_s_outreach_activities_one(object: $object) {
          id
          account_company_id
          lead_id
          campaign_id
          date
          channel
          lead_name
          company_name
          subject_or_type
          status
          response_preview
          next_followup
          created_at
        }
      }
    `;

    const res = await insertGraphQL({
      mutation,
      input: {
        account_company_id: companyId,
        channel: activity.channel || activity.type || "Email",
        lead_id: activity.lead_id ? Number(activity.lead_id) : undefined,
        campaign_id: activity.campaign_id ? Number(activity.campaign_id) : undefined,
        lead_name: activity.lead_name || activity.recipient_name || undefined,
        company_name: activity.company_name || activity.recipient_org || undefined,
        subject_or_type: activity.subject_or_type || activity.subject || "Outreach",
        status: activity.status || "Completed",
        response_preview: activity.response_preview || activity.message || undefined,
        date: activity.date ? new Date(activity.date).toISOString() : new Date().toISOString(),
        next_followup: activity.next_followup ? new Date(activity.next_followup).toISOString() : undefined,
      },
      operationName: "InsertOutreachActivity",
    });

    return res ? mapDbOutreach(res) : null;
  } catch (err) {
    console.error("Hasura logOutreachActionByToken error:", err);
    throw err;
  }
}
