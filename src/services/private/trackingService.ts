'use server';

import { updateGraphQL, insertGraphQL, getGraphQLOne, listGraphQL } from '@/graphql';
import { classifyInboundReplyFlow } from '@/ai/flows/classify-inbound-reply';
import type { ClassifyInboundReplyOutput } from '@/ai/schemas/inbound-reply';

function cleanSubject(s?: string | null): string {
  if (!s) return '';
  return s
    .replace(/^(re|fwd|fw|external):\s*/gi, '')
    .replace(/\[external\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export interface RecordOpenResult {
  success: boolean;
  message?: string;
  outreach_id?: number;
  lead_id?: number;
}

export interface RecordClickResult {
  success: boolean;
  target_url: string;
  outreach_id?: number;
  lead_id?: number;
}

export interface InboundReplyResult {
  success: boolean;
  classification?: ClassifyInboundReplyOutput;
  lead_id?: number;
  outreach_id?: number;
  escalation_action?: string;
  error?: string;
}

import { injectTrackingToEmailHtml as syncInjectTrackingToEmailHtml } from '@/lib/tracking-utils';

/**
 * Async wrapper for injectTrackingToEmailHtml compliant with RSC / Server Action conventions.
 */
export async function injectTrackingToEmailHtml(
  html: string,
  meta: {
    outreachId?: number;
    leadId?: number;
    campaignId?: number;
    baseUrl: string;
  }
): Promise<string> {
  return syncInjectTrackingToEmailHtml(html, meta);
}

/**
 * Record an email open event (Tracking Pixel).
 * Updates aa_s_outreach_activities status to 'Opened' (if not already Clicked/Replied)
 * and updates the lead score and last_contact timestamp.
 */
export async function recordEmailOpen(params: {
  outreachId?: number | null;
  leadId?: number | null;
  campaignId?: number | null;
  ip?: string;
  userAgent?: string;
}): Promise<RecordOpenResult> {
  const { outreachId, leadId } = params;

  try {
    // 1. Update outreach activity if ID is present
    if (outreachId && !isNaN(outreachId)) {
      const getOutreachQuery = `
        query GetOutreachById($id: Int!) {
          aa_s_outreach_activities_by_pk(id: $id) {
            id
            status
            lead_id
            account_company_id
          }
        }
      `;
      const outreach = await getGraphQLOne({
        query: getOutreachQuery,
        variables: { id: Number(outreachId) },
        operationName: 'GetOutreachById',
      });

      if (outreach) {
        // Do not downgrade if already Clicked or Replied
        if (outreach.status !== 'Clicked' && outreach.status !== 'Replied') {
          const updateMutation = `
            mutation MarkOutreachOpened($id: Int!, $_set: aa_s_outreach_activities_set_input!) {
              update_aa_s_outreach_activities_by_pk(
                pk_columns: { id: $id }
                _set: $_set
              ) {
                id
                status
              }
            }
          `;
          await updateGraphQL({
            mutation: updateMutation,
            id: Number(outreachId),
            attrs: { status: "Opened" },
            operationName: 'MarkOutreachOpened',
          });
        }
      }
    }

    // 2. Update lead engagement metrics if leadId is present
    if (leadId && !isNaN(leadId)) {
      const getLeadQuery = `
        query GetLeadById($id: Int!) {
          aa_s_leads_by_pk(id: $id) {
            id
            lead_score
            lead_temperature
          }
        }
      `;
      const lead = await getGraphQLOne({
        query: getLeadQuery,
        variables: { id: Number(leadId) },
        operationName: 'GetLeadById',
      });

      if (lead) {
        const currentScore = lead.lead_score || 0;
        const newScore = currentScore + 5;
        // Warm up Cold leads to Warm on verified open if score passes threshold
        const newTemp = lead.lead_temperature === 'COLD' && newScore >= 20 ? 'WARM' : lead.lead_temperature;

        const updateLeadMutation = `
          mutation UpdateLeadOnOpen($id: Int!, $_set: aa_s_leads_set_input!) {
            update_aa_s_leads_by_pk(
              pk_columns: { id: $id }
              _set: $_set
            ) {
              id
            }
          }
        `;
        await updateGraphQL({
          mutation: updateLeadMutation,
          id: Number(leadId),
          attrs: {
            lead_score: newScore,
            lead_temperature: newTemp,
            last_contact: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          operationName: 'UpdateLeadOnOpen',
        });
      }
    }

    return { success: true, outreach_id: outreachId || undefined, lead_id: leadId || undefined };
  } catch (err: any) {
    console.error('[trackingService] recordEmailOpen error:', err);
    return { success: false, message: err?.message || 'Failed to record open' };
  }
}

/**
 * Record an email link click event (Fallback & High-Intent Tracking).
 * If the tracking pixel was blocked/deferred, this GUARANTEES the email was opened.
 * Marks outreach as Opened (if needed) and Clicked, and bumps the lead score (+10).
 */
export async function recordEmailClick(params: {
  targetUrl: string;
  outreachId?: number | null;
  leadId?: number | null;
  campaignId?: number | null;
  action?: string | null;
  ip?: string;
  userAgent?: string;
}): Promise<RecordClickResult> {
  const { targetUrl, outreachId, leadId, action } = params;
  const isUnsubscribe = action === 'unsubscribe';

  try {
    // 1. Dual Fallback: Mark Outreach as Opened & Clicked / Unsubscribed
    if (outreachId && !isNaN(outreachId)) {
      const newStatus = isUnsubscribe ? "Unsubscribed" : "Clicked";
      const updateMutation = `
        mutation MarkOutreachClicked($id: Int!, $_set: aa_s_outreach_activities_set_input!) {
          update_aa_s_outreach_activities_by_pk(
            pk_columns: { id: $id }
            _set: $_set
          ) {
            id
            status
          }
        }
      `;
      await updateGraphQL({
        mutation: updateMutation,
        id: Number(outreachId),
        attrs: { status: newStatus },
        operationName: 'MarkOutreachClicked',
      });
    }

    // 2. Handle Lead Update: Unsubscribe vs High-Intent Engagement Bump
    if (leadId && !isNaN(leadId)) {
      const nowIso = new Date().toISOString();

      if (isUnsubscribe) {
        // Mark lead as COLD & Lost / Unsubscribed
        const updateUnsubMutation = `
          mutation MarkLeadUnsubscribedOnClick($id: Int!, $_set: aa_s_leads_set_input!) {
            update_aa_s_leads_by_pk(
              pk_columns: { id: $id }
              _set: $_set
            ) {
              id
            }
          }
        `;
        await updateGraphQL({
          mutation: updateUnsubMutation,
          id: Number(leadId),
          attrs: {
            lead_temperature: "COLD",
            stage: "Lost",
            updated_at: nowIso,
          },
          operationName: 'MarkLeadUnsubscribedOnClick',
        });
      } else {
        // High intent signal: bump lead score (+10) and temperature to WARM
        const getLeadQuery = `
          query GetLeadById($id: Int!) {
            aa_s_leads_by_pk(id: $id) {
              id
              lead_score
              lead_temperature
            }
          }
        `;
        const lead = await getGraphQLOne({
          query: getLeadQuery,
          variables: { id: Number(leadId) },
          operationName: 'GetLeadById',
        });

        if (lead) {
          const currentScore = lead.lead_score || 0;
          const newScore = currentScore + 10;
          const newTemp = lead.lead_temperature === 'COLD' ? 'WARM' : lead.lead_temperature;

          const updateLeadMutation = `
            mutation UpdateLeadOnClick($id: Int!, $_set: aa_s_leads_set_input!) {
              update_aa_s_leads_by_pk(
                pk_columns: { id: $id }
                _set: $_set
              ) {
                id
              }
            }
          `;
          await updateGraphQL({
            mutation: updateLeadMutation,
            id: Number(leadId),
            attrs: {
              lead_score: newScore,
              lead_temperature: newTemp,
              last_contact: nowIso,
              updated_at: nowIso,
            },
            operationName: 'UpdateLeadOnClick',
          });
        }
      }
    }

    return {
      success: true,
      target_url: targetUrl,
      outreach_id: outreachId || undefined,
      lead_id: leadId || undefined,
    };
  } catch (err: any) {
    console.error('[trackingService] recordEmailClick error:', err);
    return {
      success: false,
      target_url: targetUrl,
      outreach_id: outreachId || undefined,
      lead_id: leadId || undefined,
    };
  }
}

/**
 * Inbound Email Reply Triage & AI Lead Escalation.
 * 1. Matches incoming reply to active Lead & Outreach Activity.
 * 2. Marks outreach as 'Replied'.
 * 3. Runs Genkit classifyInboundReplyFlow for sentiment & intent analysis.
 * 4. Automatically triggers lead escalation (HOT status, alert task, OOO rescheduling, unsubscribe).
 */
export async function processInboundReplyAndEscalate(payload: {
  fromEmail: string;
  fromName?: string;
  subject?: string;
  body: string;
  leadId?: number;
  outreachId?: number;
  campaignId?: number;
  headers?: Record<string, string>;
}): Promise<InboundReplyResult> {
  const { fromEmail, fromName, subject = 'Re: Outreach', body, headers = {} } = payload;
  let targetLeadId = payload.leadId;
  let targetOutreachId = payload.outreachId;
  let companyId: number | undefined;

  try {
    // 1. If outreachId or leadId not explicitly provided, resolve from outreach activities (up to 20)
    if (!targetOutreachId && (targetLeadId || fromEmail)) {
      const cleanEmail = fromEmail ? fromEmail.trim().toLowerCase() : '';
      const whereCondition = targetLeadId
        ? { lead_id: { _eq: Number(targetLeadId) } }
        : { recipient_email: { _ilike: cleanEmail } };

      const findOutreachQuery = `
        query FindCandidateOutreaches($where: aa_s_outreach_activities_bool_exp!) {
          aa_s_outreach_activities(
            where: $where
            order_by: [{ id: desc }]
            limit: 20
          ) {
            id
            lead_id
            campaign_id
            account_company_id
            status
            subject_or_type
            response_preview
          }
        }
      `;
      const candidateOutreaches: any[] = (await listGraphQL({
        query: findOutreachQuery,
        variables: { where: whereCondition },
        operationName: 'FindCandidateOutreaches',
      })) || [];

      if (candidateOutreaches.length > 0) {
        const incomingSubj = cleanSubject(subject);
        let bestOutreach: any = null;

        // A. Match by subject thread if available
        if (incomingSubj) {
          const subjectMatches = candidateOutreaches.filter((cand) => {
            const candSubj = cleanSubject(cand.subject_or_type);
            if (!candSubj) return false;
            return (
              candSubj === incomingSubj ||
              (candSubj.length >= 4 && incomingSubj.includes(candSubj)) ||
              (incomingSubj.length >= 4 && candSubj.includes(incomingSubj))
            );
          });

          if (subjectMatches.length > 0) {
            // Prioritize unreplied activity within matching subject thread
            bestOutreach =
              subjectMatches.find((c) => c.status !== 'Replied') ||
              subjectMatches[0];
          }
        }

        // B. If no subject match, pick the most recent UNREPLIED outreach activity
        if (!bestOutreach) {
          bestOutreach =
            candidateOutreaches.find((c) => c.status !== 'Replied') ||
            candidateOutreaches[0];
        }

        if (bestOutreach) {
          targetOutreachId = bestOutreach.id;
          if (!targetLeadId) targetLeadId = bestOutreach.lead_id;
          companyId = bestOutreach.account_company_id;
        }
      }
    }

    // 2. Fetch full Lead record
    let lead: any = null;
    if (targetLeadId) {
      const getLeadQuery = `
        query GetLeadForTriage($id: Int!) {
          aa_s_leads_by_pk(id: $id) {
            id
            account_company_id
            person_name
            company_name
            industry
            lead_temperature
            lead_score
            stage
            assigned_user_id
          }
        }
      `;
      lead = await getGraphQLOne({
        query: getLeadQuery,
        variables: { id: Number(targetLeadId) },
        operationName: 'GetLeadForTriage',
      });

      if (lead && !companyId) {
        companyId = lead.account_company_id;
      }
    }

    // 3. Mark outreach activity as 'Replied'
    if (targetOutreachId) {
      const markRepliedMutation = `
        mutation MarkOutreachReplied($id: Int!, $_set: aa_s_outreach_activities_set_input!) {
          update_aa_s_outreach_activities_by_pk(
            pk_columns: { id: $id }
            _set: $_set
          ) {
            id
            status
          }
        }
      `;
      await updateGraphQL({
        mutation: markRepliedMutation,
        id: Number(targetOutreachId),
        attrs: {
          status: "Replied",
          response_preview: body.slice(0, 300),
        },
        operationName: 'MarkOutreachReplied',
      });
    }

    // 4. Run AI Inbound Reply Classification Flow
    const prospectName = lead?.person_name || fromName || fromEmail.split('@')[0];
    const companyName = lead?.company_name || 'Prospect Company';

    const classification = await classifyInboundReplyFlow({
      inbound_message: body,
      prospect_name: prospectName,
      company_name: companyName,
      subject,
      original_outreach_context: 'Outbound sales sequence',
    });

    let escalationAction: string = classification.recommended_action || classification.intent;

    // 5. Automated Escalation Logic
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    // Resolve assigned user ID for task creation (aa_s_tasks requires non-null assigned_to_id)
    let assignedUserId: number | undefined = lead?.assigned_user_id ? Number(lead.assigned_user_id) : undefined;
    if (!assignedUserId && companyId) {
      try {
        const findUserQuery = `
          query GetFallbackUserForTask($companyId: Int!) {
            aa_s_users(
              where: { account_company_id: { _eq: $companyId } }
              order_by: [{ id: asc }]
              limit: 1
            ) {
              id
            }
          }
        `;
        const fallbackUser = await getGraphQLOne({
          query: findUserQuery,
          variables: { companyId: Number(companyId) },
          operationName: 'GetFallbackUserForTask',
        });
        if (fallbackUser?.id) {
          assignedUserId = Number(fallbackUser.id);
        }
      } catch (userErr) {
        console.warn('[TrackingService] Could not lookup company user:', userErr);
      }
    }

    if (!assignedUserId) {
      try {
        const findAnyUserQuery = `
          query GetAnyFallbackUser {
            aa_s_users(order_by: [{ id: asc }], limit: 1) {
              id
            }
          }
        `;
        const anyUser = await getGraphQLOne({
          query: findAnyUserQuery,
          operationName: 'GetAnyFallbackUser',
        });
        if (anyUser?.id) {
          assignedUserId = Number(anyUser.id);
        }
      } catch (anyUserErr) {
        console.warn('[TrackingService] Could not lookup global fallback user:', anyUserErr);
      }
    }

    if (classification.intent === 'interested' || classification.recommended_action === 'promote_to_hot') {
      // --- ESCALATE TO HOT LEAD ---
      if (lead) {
        const updateLeadMutation = `
          mutation EscalateLeadToHot($id: Int!, $_set: aa_s_leads_set_input!) {
            update_aa_s_leads_by_pk(
              pk_columns: { id: $id }
              _set: $_set
            ) {
              id
              lead_temperature
              lead_score
            }
          }
        `;
        await updateGraphQL({
          mutation: updateLeadMutation,
          id: lead.id,
          attrs: {
            lead_temperature: "HOT",
            stage: "Engaged",
            lead_score: (lead.lead_score || 0) + 35,
            assigned_user_id: lead.assigned_user_id || assignedUserId,
            last_contact: nowIso,
            updated_at: nowIso,
          },
          operationName: 'EscalateLeadToHot',
        });

        // Create high-priority task for sales rep with pre-drafted response
        if (companyId && assignedUserId) {
          const createTaskMutation = `
            mutation CreateHotReplyTask($object: aa_s_tasks_insert_input!) {
              insert_aa_s_tasks_one(object: $object) {
                id
                title
              }
            }
          `;
          await insertGraphQL({
            mutation: createTaskMutation,
            input: {
              account_company_id: companyId,
              title: `🔥 HOT Lead Reply: ${prospectName} (${companyName})`,
              type: 'Follow-up',
              priority: 'Urgent',
              status: 'To Do',
              due_date: todayDate,
              assigned_to_id: Number(assignedUserId),
              related_lead_id: lead.id,
              notes: `AI Summary: ${classification.summary}\n\nSuggested Draft Reply:\n${classification.draft_reply || 'Follow up immediately'}`,
            },
            operationName: 'CreateHotReplyTask',
          }).catch((taskErr) => {
            console.warn('[TrackingService] Could not insert hot reply task:', taskErr);
          });

          // Create in-app notification
          const createNotifMutation = `
            mutation CreateHotReplyNotification($object: aa_s_notifications_insert_input!) {
              insert_aa_s_notifications_one(object: $object) {
                id
              }
            }
          `;
          await insertGraphQL({
            mutation: createNotifMutation,
            input: {
              account_company_id: companyId,
              title: `🔥 Hot Lead Reply from ${prospectName}`,
              message: classification.summary,
              type: 'success',
              priority: 'urgent',
              read: false,
              action_url: `/dashboard/leads?id=${lead.id}`,
              related_entity_type: 'lead',
              related_entity_id: lead.id,
              related_entity_name: prospectName,
            },
            operationName: 'CreateHotReplyNotification',
          }).catch((notifErr) => {
            console.warn('[TrackingService] Could not insert hot reply notification:', notifErr);
          });
        }
      }
      escalationAction = 'escalated_to_hot';

    } else if (classification.intent === 'out_of_office') {
      // --- OUT OF OFFICE HANDLING ---
      const returnDate = classification.return_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      if (lead) {
        const updateOooMutation = `
          mutation RescheduleOooLead($id: Int!, $_set: aa_s_leads_set_input!) {
            update_aa_s_leads_by_pk(
              pk_columns: { id: $id }
              _set: $_set
            ) {
              id
            }
          }
        `;
        await updateGraphQL({
          mutation: updateOooMutation,
          id: lead.id,
          attrs: {
            next_followup: new Date(returnDate).toISOString(),
            updated_at: nowIso,
          },
          operationName: 'RescheduleOooLead',
        });

        // Add task for rescheduled date
        if (companyId && assignedUserId) {
          const createOooTaskMutation = `
            mutation CreateOooTask($object: aa_s_tasks_insert_input!) {
              insert_aa_s_tasks_one(object: $object) {
                id
              }
            }
          `;
          await insertGraphQL({
            mutation: createOooTaskMutation,
            input: {
              account_company_id: companyId,
              title: `OOO Follow-up: ${prospectName} (${companyName})`,
              type: 'Follow-up',
              priority: 'Medium',
              status: 'To Do',
              due_date: returnDate,
              assigned_to_id: Number(assignedUserId),
              related_lead_id: lead.id,
              notes: `Automated Out of Office reply received. Contact scheduled to return around ${returnDate}.`,
            },
            operationName: 'CreateOooTask',
          }).catch((taskErr) => {
            console.warn('[TrackingService] Could not insert OOO task:', taskErr);
          });
        }
      }
      escalationAction = 'rescheduled_for_return_date';

    } else if (classification.intent === 'not_interested') {
      // --- UNSUBSCRIBE / SUPPRESSION ---
      if (lead) {
        const updateUnsubMutation = `
          mutation MarkLeadUnsubscribed($id: Int!, $_set: aa_s_leads_set_input!) {
            update_aa_s_leads_by_pk(
              pk_columns: { id: $id }
              _set: $_set
            ) {
              id
            }
          }
        `;
        await updateGraphQL({
          mutation: updateUnsubMutation,
          id: lead.id,
          attrs: {
            lead_temperature: "COLD",
            stage: "Lost",
            updated_at: nowIso,
          },
          operationName: 'MarkLeadUnsubscribed',
        });
      }
      escalationAction = 'suppressed_and_unsubscribed';
    }

    return {
      success: true,
      classification,
      lead_id: targetLeadId || undefined,
      outreach_id: targetOutreachId || undefined,
      escalation_action: escalationAction,
    };
  } catch (err: any) {
    console.error('[trackingService] processInboundReplyAndEscalate error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to process inbound reply',
    };
  }
}
