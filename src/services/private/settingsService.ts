'use server';

import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL, deleteGraphQL, sendGraphQL } from '@/graphql';
import { getAccountCompanyIdFromClaims } from '@/lib/auth-utils';
import type {
  CompanySettings,
  LeadStage,
  SequenceStep,
  CampaignRules,
  CampaignSchedule,
  DailyFollowUpRule,
  NotificationSettings,
  AppearanceSettings,
  SecuritySettings,
} from '@/lib/types';

/**
 * Loads all settings across normalized database tables (aa_s_settings_*) for the given company.
 * Single source of truth is the PostgreSQL database.
 */
export async function getCompanySettingsActionByToken(token: string): Promise<CompanySettings> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  const query = `
    query GetNormalizedCompanySettings($companyId: Int!) {
      aa_s_settings_pipeline_stages(where: { account_company_id: { _eq: $companyId }, is_active: { _eq: true } }, order_by: [{ stage_order: asc }]) {
        id
        name
        stage_order
        bg_color
        text_color
        border_color
        dot_color
      }
      aa_s_settings_lead_temperatures(where: { account_company_id: { _eq: $companyId }, is_active: { _eq: true } }) {
        id
        name
        badge_style
        text_color
      }
      aa_s_settings_campaign_sequences(where: { account_company_id: { _eq: $companyId } }, order_by: [{ step_number: asc }]) {
        id
        step_number
        day
        type
        subject
        body
        enabled
      }
      aa_s_settings_campaign_rules(where: { account_company_id: { _eq: $companyId } }, limit: 1) {
        id
        stop_on_reply
        stop_on_meeting_booked
        update_lead_status
        create_follow_up_task
        exclude_customers
        exclude_competitors
        track_opens
      }
      aa_s_settings_campaign_schedules(where: { account_company_id: { _eq: $companyId } }, limit: 1) {
        id
        send_days
        send_time_from
        send_time_to
        timezone
      }
      aa_s_settings_daily_automation_rules(where: { account_company_id: { _eq: $companyId } }, order_by: [{ rule_order: asc }]) {
        id
        name
        condition_desc
        action_desc
        is_active
        rule_order
      }
      aa_s_settings_notifications(where: { account_company_id: { _eq: $companyId } }, limit: 1) {
        id
        email_new_lead
        email_followup
        email_won
        push_calls
        push_meetings
        push_pipeline
        slack_hot_leads
        slack_daily_digest
      }
      aa_s_settings_appearance(where: { account_company_id: { _eq: $companyId } }, limit: 1) {
        id
        theme
        sidebar_collapsed
        compact_rows
        animations
      }
      aa_s_settings_security(where: { account_company_id: { _eq: $companyId } }, limit: 1) {
        id
        two_factor_auth
        session_timeout
        ip_whitelist
      }
    }
  `;

  try {
    const res = await sendGraphQL({
      query,
      operationName: "GetNormalizedCompanySettings",
      variables: { companyId },
      multi_queries: true,
    });

    const data: any = res || {};

    // 1. Pipeline Stages & Stage Colors (read directly from aa_s_settings_pipeline_stages)
    const rawStages = Array.isArray(data.aa_s_settings_pipeline_stages) ? data.aa_s_settings_pipeline_stages : [];
    const pipeline_stages: LeadStage[] = rawStages.map((s: any) => s.name as LeadStage);
    const stage_colors: Record<string, { bg: string; text: string; border: string; dot: string }> = {};
    for (const s of rawStages) {
      stage_colors[s.name] = {
        bg: s.bg_color || "",
        text: s.text_color || "",
        border: s.border_color || "",
        dot: s.dot_color || "",
      };
    }

    // 2. Lead Temperatures (read directly from aa_s_settings_lead_temperatures)
    const rawTemps = Array.isArray(data.aa_s_settings_lead_temperatures) ? data.aa_s_settings_lead_temperatures : [];
    const temp_colors: Record<string, { badge: string }> = {};
    for (const t of rawTemps) {
      temp_colors[t.name] = { badge: t.badge_style || "" };
    }

    // 3. Campaign Template Sequence Steps (read directly from aa_s_settings_campaign_sequences)
    const rawSequences = Array.isArray(data.aa_s_settings_campaign_sequences) ? data.aa_s_settings_campaign_sequences : [];
    const default_sequence: SequenceStep[] = rawSequences.map((s: any) => ({
      id: s.id,
      step_number: s.step_number,
      day: s.day,
      type: s.type || "Email",
      subject: s.subject || "",
      body: s.body || "",
      enabled: s.enabled ?? true,
    }));

    // 4. Default Rules (read directly from aa_s_settings_campaign_rules)
    const rulesRow = Array.isArray(data.aa_s_settings_campaign_rules) && data.aa_s_settings_campaign_rules.length > 0
      ? data.aa_s_settings_campaign_rules[0]
      : null;
    const default_rules: CampaignRules = {
      stop_on_reply: rulesRow?.stop_on_reply ?? true,
      stop_on_meeting_booked: rulesRow?.stop_on_meeting_booked ?? true,
      update_lead_status: rulesRow?.update_lead_status ?? true,
      create_follow_up_task: rulesRow?.create_follow_up_task ?? true,
      exclude_customers: rulesRow?.exclude_customers ?? true,
      exclude_competitors: rulesRow?.exclude_competitors ?? true,
      track_opens: rulesRow?.track_opens ?? true,
    };

    // 5. Default Schedule (read directly from aa_s_settings_campaign_schedules)
    const schedRow = Array.isArray(data.aa_s_settings_campaign_schedules) && data.aa_s_settings_campaign_schedules.length > 0
      ? data.aa_s_settings_campaign_schedules[0]
      : null;
    const default_schedule: CampaignSchedule = {
      send_days: Array.isArray(schedRow?.send_days) ? schedRow.send_days : [],
      send_time_from: schedRow?.send_time_from || "09:00",
      send_time_to: schedRow?.send_time_to || "17:00",
      timezone: schedRow?.timezone || "SAST (UTC+2 - Johannesburg / South Africa)",
      start_date: new Date().toISOString().split("T")[0],
    };

    // 6. Daily Automation Rules (read directly from aa_s_settings_daily_automation_rules)
    const rawDailyRules = Array.isArray(data.aa_s_settings_daily_automation_rules) ? data.aa_s_settings_daily_automation_rules : [];
    const daily_rules: DailyFollowUpRule[] = rawDailyRules.map((r: any) => ({
      id: r.id,
      name: r.name,
      condition: r.condition_desc,
      action: r.action_desc,
      active: r.is_active ?? true,
    }));

    // 7. Notification Preferences (read directly from aa_s_settings_notifications)
    const notifsRow = Array.isArray(data.aa_s_settings_notifications) && data.aa_s_settings_notifications.length > 0
      ? data.aa_s_settings_notifications[0]
      : null;
    const notifications: NotificationSettings = {
      email_new_lead: notifsRow?.email_new_lead ?? true,
      email_followup: notifsRow?.email_followup ?? true,
      email_won: notifsRow?.email_won ?? true,
      push_calls: notifsRow?.push_calls ?? false,
      push_meetings: notifsRow?.push_meetings ?? true,
      push_pipeline: notifsRow?.push_pipeline ?? false,
      slack_hot_leads: notifsRow?.slack_hot_leads ?? true,
      slack_daily_digest: notifsRow?.slack_daily_digest ?? false,
    };

    // 8. Appearance Settings (read directly from aa_s_settings_appearance)
    const appRow = Array.isArray(data.aa_s_settings_appearance) && data.aa_s_settings_appearance.length > 0
      ? data.aa_s_settings_appearance[0]
      : null;
    const appearance: AppearanceSettings = {
      theme: (appRow?.theme as any) || "Dark",
      sidebar_collapsed: appRow?.sidebar_collapsed ?? false,
      compact_rows: appRow?.compact_rows ?? true,
      animations: appRow?.animations ?? true,
    };

    // 9. Security Settings (read directly from aa_s_settings_security)
    const secRow = Array.isArray(data.aa_s_settings_security) && data.aa_s_settings_security.length > 0
      ? data.aa_s_settings_security[0]
      : null;
    const security: SecuritySettings = {
      two_factor_auth: secRow?.two_factor_auth ?? false,
      session_timeout: secRow?.session_timeout || "30 minutes",
    };

    return {
      account_company_id: companyId,
      pipeline_stages,
      stage_colors,
      temp_colors,
      default_sequence,
      default_rules,
      default_schedule,
      daily_rules,
      notifications,
      appearance,
      security,
    };
  } catch (err) {
    console.error("getCompanySettingsActionByToken database query error:", err);
    throw err;
  }
}

/**
 * Updates settings across the normalized tables (aa_s_settings_*).
 */
export async function updateCompanySettingsActionByToken(
  token: string,
  updates: Partial<CompanySettings>
): Promise<CompanySettings | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    // 1. Update Notification Preferences
    if (updates.notifications) {
      const notifMutation = `
        mutation UpsertNotificationPreferences($object: aa_s_settings_notifications_insert_input!) {
          insert_aa_s_settings_notifications_one(
            object: $object,
            on_conflict: {
              constraint: aa_s_settings_notifications_account_company_id_key,
              update_columns: [
                email_new_lead,
                email_followup,
                email_won,
                push_calls,
                push_meetings,
                push_pipeline,
                slack_hot_leads,
                slack_daily_digest,
                updated_at
              ]
            }
          ) {
            id
          }
        }
      `;
      await insertGraphQL({
        mutation: notifMutation,
        operationName: "UpsertNotificationPreferences",
        input: {
          account_company_id: companyId,
          ...updates.notifications,
          updated_at: new Date().toISOString(),
        },
      });
    }

    // 2. Update Appearance Settings
    if (updates.appearance) {
      const appMutation = `
        mutation UpsertAppearanceSettings($object: aa_s_settings_appearance_insert_input!) {
          insert_aa_s_settings_appearance_one(
            object: $object,
            on_conflict: {
              constraint: aa_s_settings_appearance_account_company_id_key,
              update_columns: [
                theme,
                sidebar_collapsed,
                compact_rows,
                animations,
                updated_at
              ]
            }
          ) {
            id
          }
        }
      `;
      await insertGraphQL({
        mutation: appMutation,
        operationName: "UpsertAppearanceSettings",
        input: {
          account_company_id: companyId,
          ...updates.appearance,
          updated_at: new Date().toISOString(),
        },
      });
    }

    // 3. Update Security Settings
    if (updates.security) {
      const secMutation = `
        mutation UpsertSecuritySettings($object: aa_s_settings_security_insert_input!) {
          insert_aa_s_settings_security_one(
            object: $object,
            on_conflict: {
              constraint: aa_s_settings_security_account_company_id_key,
              update_columns: [
                two_factor_auth,
                session_timeout,
                ip_whitelist,
                updated_at
              ]
            }
          ) {
            id
          }
        }
      `;
      await insertGraphQL({
        mutation: secMutation,
        operationName: "UpsertSecuritySettings",
        input: {
          account_company_id: companyId,
          ...updates.security,
          updated_at: new Date().toISOString(),
        },
      });
    }

    // 4. Update Campaign Default Rules
    if (updates.default_rules) {
      const rulesMutation = `
        mutation UpsertCampaignDefaultRules($object: aa_s_settings_campaign_rules_insert_input!) {
          insert_aa_s_settings_campaign_rules_one(
            object: $object,
            on_conflict: {
              constraint: aa_s_settings_campaign_rules_account_company_id_key,
              update_columns: [
                stop_on_reply,
                stop_on_meeting_booked,
                update_lead_status,
                create_follow_up_task,
                exclude_customers,
                exclude_competitors,
                track_opens,
                updated_at
              ]
            }
          ) {
            id
          }
        }
      `;
      await insertGraphQL({
        mutation: rulesMutation,
        operationName: "UpsertCampaignDefaultRules",
        input: {
          account_company_id: companyId,
          ...updates.default_rules,
          updated_at: new Date().toISOString(),
        },
      });
    }

    // 5. Update Campaign Default Schedules
    if (updates.default_schedule) {
      const schedMutation = `
        mutation UpsertCampaignDefaultSchedules($object: aa_s_settings_campaign_schedules_insert_input!) {
          insert_aa_s_settings_campaign_schedules_one(
            object: $object,
            on_conflict: {
              constraint: aa_s_settings_campaign_schedules_account_company_id_key,
              update_columns: [
                send_days,
                send_time_from,
                send_time_to,
                timezone,
                updated_at
              ]
            }
          ) {
            id
          }
        }
      `;
      await insertGraphQL({
        mutation: schedMutation,
        operationName: "UpsertCampaignDefaultSchedules",
        input: {
          account_company_id: companyId,
          ...updates.default_schedule,
          updated_at: new Date().toISOString(),
        },
      });
    }

    return getCompanySettingsActionByToken(token);
  } catch (err) {
    console.error("updateCompanySettingsActionByToken error:", err);
    throw err;
  }
}
