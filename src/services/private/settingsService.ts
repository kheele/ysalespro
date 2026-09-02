'use server';

import nodemailer from 'nodemailer';
import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL, deleteGraphQL, sendGraphQL } from '@/graphql';
import { getAccountCompanyIdFromClaims } from '@/lib/auth-utils';
import { adminAuth } from '@/lib/firebase-admin';
import { getActiveSendingAccountByChannel } from './connectedAccountsService';
import { getUserByAuthIdAction, getUserByEmailAction, updateUserAction } from './userService';
import { updateAccountCompany } from './accountCompanyService';
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
  User,
  UserRole,
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

  console.log('updateCompanySettingsActionByToken', updates)

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
          email_new_lead: updates.notifications.email_new_lead ?? true,
          email_followup: updates.notifications.email_followup ?? true,
          email_won: updates.notifications.email_won ?? true,
          push_calls: updates.notifications.push_calls ?? false,
          push_meetings: updates.notifications.push_meetings ?? true,
          push_pipeline: updates.notifications.push_pipeline ?? false,
          slack_hot_leads: updates.notifications.slack_hot_leads ?? true,
          slack_daily_digest: updates.notifications.slack_daily_digest ?? false,
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
          theme: updates.appearance.theme || "Dark",
          sidebar_collapsed: updates.appearance.sidebar_collapsed ?? false,
          compact_rows: updates.appearance.compact_rows ?? true,
          animations: updates.appearance.animations ?? true,
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
          two_factor_auth: updates.security.two_factor_auth ?? false,
          session_timeout: updates.security.session_timeout || "30 minutes",
          ip_whitelist: updates.security.ip_whitelist || "",
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
          stop_on_reply: updates.default_rules.stop_on_reply ?? true,
          stop_on_meeting_booked: updates.default_rules.stop_on_meeting_booked ?? true,
          update_lead_status: updates.default_rules.update_lead_status ?? true,
          create_follow_up_task: updates.default_rules.create_follow_up_task ?? true,
          exclude_customers: updates.default_rules.exclude_customers ?? true,
          exclude_competitors: updates.default_rules.exclude_competitors ?? true,
          track_opens: updates.default_rules.track_opens ?? true,
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
          send_days: Array.isArray(updates.default_schedule.send_days) ? updates.default_schedule.send_days : ["Mon", "Tue", "Wed", "Thu", "Fri"],
          send_time_from: updates.default_schedule.send_time_from || "09:00",
          send_time_to: updates.default_schedule.send_time_to || "17:00",
          timezone: updates.default_schedule.timezone || "SAST (UTC+2 - Johannesburg / South Africa)",
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

/**
 * Updates the user's profile information (name, company, etc.)
 */
export async function updateUserProfileActionByToken(
  token: string,
  profile: {
    name?: string;
    fname?: string;
    lname?: string;
    email?: string;
    title?: string;
    company?: string;
    timezone?: string;
    language?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth().verifyIdToken(token, true);
    const { uid, email } = decodedToken;

    let dbUser = await getUserByAuthIdAction(uid);
    if (!dbUser && email) {
      dbUser = await getUserByEmailAction(email);
      if (dbUser) {
        await updateUserAction(dbUser.id, { auth_id: uid, is_active: true });
      }
    }

    if (!dbUser) {
      throw new Error("User record not found in database");
    }

    let fname = profile.fname ?? dbUser.fname;
    let lname = profile.lname ?? dbUser.lname;

    if (profile.name !== undefined) {
      const parts = profile.name.trim().split(/\s+/);
      fname = parts[0] || '';
      lname = parts.slice(1).join(' ') || '';
    }

    await updateUserAction(dbUser.id, {
      fname,
      lname,
      email: profile.email || dbUser.email,
    });

    if (profile.company && dbUser.account_company_id) {
      await updateAccountCompany(dbUser.account_company_id, {
        name: profile.company,
      });
    }

    return { success: true, message: "Profile updated successfully" };
  } catch (err: any) {
    console.error("updateUserProfileActionByToken error:", err);
    throw new Error(err?.message || "Failed to update profile");
  }
}

// ─── Team & Permissions ───────────────────────────────────────────────────────

const TEAM_USER_FIELDS = `
  id
  account_company_id
  auth_id
  email
  fname
  lname
  role
  avatar_url
  is_active
  created_at
`;

function mapTeamUser(u: any): User | null {
  if (!u) return null;
  const fname = u.fname || '';
  const lname = u.lname || '';
  return {
    id: String(u.id),
    fname,
    lname,
    name: `${fname} ${lname}`.trim() || u.email || 'Team Member',
    email: u.email,
    role: (u.role as UserRole) || 'Viewer',
    avatar_url: u.avatar_url,
    auth_id: u.auth_id,
    account_company_id: u.account_company_id,
    created_at: u.created_at,
  };
}

/**
 * Fetches all users belonging to the same account company as the caller.
 */
export async function getTeamMembersActionByToken(token: string): Promise<User[]> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized');

  const query = `
    query GetTeamMembers($companyId: Int!) {
      aa_s_users(
        where: { account_company_id: { _eq: $companyId } }
        order_by: [{ created_at: asc }]
      ) {
        ${TEAM_USER_FIELDS}
      }
    }
  `;
  try {
    const list = await listGraphQL({
      query,
      operationName: 'GetTeamMembers',
      variables: { companyId },
    });
    return Array.isArray(list) ? list.map(mapTeamUser).filter(Boolean) as User[] : [];
  } catch (err) {
    console.error('getTeamMembersActionByToken error:', err);
    return [];
  }
}

/**
 * Sends a Firebase invite email and pre-creates a pending user record so the
 * invitee is visible in the team list immediately.
 */
export async function inviteTeamMemberActionByToken(
  token: string,
  invite: { email: string; role: UserRole; fname?: string; lname?: string }
): Promise<{ success: boolean; message: string; inviteLink?: string }> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized');

  try {
    // 1. Generate a Firebase email sign-in link (magic link for the invitee)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9005';
    const inviteLink = await adminAuth().generateSignInWithEmailLink(invite.email, {
      url: `${appUrl}/account-completion`,
      handleCodeInApp: true,
    });

    // 2. Pre-create the user record so they appear in the team list immediately
    const mutation = `
      mutation InviteTeamMember($object: aa_s_users_insert_input!) {
        insert_aa_s_users_one(
          object: $object,
          on_conflict: {
            constraint: aa_s_users_email_key,
            update_columns: [role, account_company_id, is_active, updated_at]
          }
        ) {
          ${TEAM_USER_FIELDS}
        }
      }
    `;
    await insertGraphQL({
      mutation,
      operationName: 'InviteTeamMember',
      input: {
        account_company_id: companyId,
        email: invite.email,
        fname: invite.fname || '',
        lname: invite.lname || '',
        role: invite.role,
        auth_id: `pending_${Date.now()}`,
        is_active: false,
      },
    });

    // 3. Send the invite email via the company's connected sending account,
    //    or fall back to system SMTP env vars.
    const recipientName = [invite.fname, invite.lname].filter(Boolean).join(' ') || invite.email;
    const roleLabels: Record<string, string> = {
      SuperAdmin: 'Super Admin', Admin: 'Admin', Editor: 'Editor', Viewer: 'Viewer',
    };
    const roleLabel = roleLabels[invite.role] || invite.role;

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f11; color: #e2e2e8; margin: 0; padding: 0; }
        .wrapper { max-width: 520px; margin: 40px auto; padding: 0 16px; }
        .card { background: #18181c; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #fff; }
        .header p { margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,0.75); }
        .body { padding: 28px 32px; }
        .body p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 16px; }
        .role-badge { display: inline-block; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #818cf8; border-radius: 8px; padding: 4px 12px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; margin: 8px 0 24px; }
        .link-fallback { font-size: 11px; color: #52525b; word-break: break-all; margin-top: 8px; }
        .footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 20px 32px; font-size: 11px; color: #52525b; }
      </style></head>
      <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>🚀 You're invited to SalesPro</h1>
            <p>Your team is waiting for you</p>
          </div>
          <div class="body">
            <p>Hi ${recipientName},</p>
            <p>You've been invited to join a SalesPro workspace. Click the button below to accept your invitation and set up your account.</p>
            <div class="role-badge">Your role: ${roleLabel}</div><br>
            <a href="${inviteLink}" class="btn">Accept Invitation &rarr;</a>
            <p style="font-size:12px;color:#71717a;">This link expires in 24 hours. If you didn't expect this invitation, you can safely ignore it.</p>
            <div class="link-fallback">Or copy this link: ${inviteLink}</div>
          </div>
          <div class="footer">Sent by SalesPro &middot; This is an automated message, please do not reply.</div>
        </div>
      </div>
      </body></html>`;

    let emailSent = false;
    let emailError = '';

    // Try company's connected sending account first
    try {
      const account = await getActiveSendingAccountByChannel(companyId, 'Email');
      if (account?.email_config?.password) {
        const cfg = account.email_config;
        const transporter = nodemailer.createTransport({
          host: cfg.host || (cfg.provider === 'google_workspace' ? 'smtp.gmail.com' : 'smtp.gmail.com'),
          port: cfg.port || 465,
          secure: cfg.secure ?? true,
          auth: { user: cfg.username || cfg.from_email, pass: cfg.password },
          connectionTimeout: 8000,
        });
        await transporter.sendMail({
          from: `"SalesPro" <${cfg.from_email}>`,
          to: invite.email,
          subject: `You're invited to join SalesPro`,
          html: htmlBody,
        });
        emailSent = true;
      }
    } catch (sendErr: any) {
      emailError = sendErr?.message;
    }

    // Fall back to system SMTP env vars
    if (!emailSent && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: `"SalesPro" <${process.env.SMTP_USER}>`,
          to: invite.email,
          subject: `You're invited to join SalesPro`,
          html: htmlBody,
        });
        emailSent = true;
      } catch (sysErr: any) {
        emailError = sysErr?.message;
      }
    }

    const message = emailSent
      ? `Invite email sent to ${invite.email}`
      : `Invite link generated for ${invite.email} (email delivery unavailable — copy the link below)`;

    return { success: true, message, inviteLink };
  } catch (err: any) {
    console.error('inviteTeamMemberActionByToken error:', err);
    return { success: false, message: err?.message || 'Failed to send invite' };
  }
}

/**
 * Updates the role of a team member.
 */
export async function updateTeamMemberRoleActionByToken(
  token: string,
  memberId: string | number,
  role: UserRole
): Promise<boolean> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized');

  try {
    const mutation = `
      mutation UpdateTeamMemberRole($id: Int!, $_set: aa_s_users_set_input!) {
        update_aa_s_users_by_pk(pk_columns: { id: $id }, _set: $_set) {
          id
          role
        }
      }
    `;
    await updateGraphQL({
      mutation,
      operationName: 'UpdateTeamMemberRole',
      id: Number(memberId),
      attrs: { role, updated_at: new Date().toISOString() },
    });
    return true;
  } catch (err) {
    console.error('updateTeamMemberRoleActionByToken error:', err);
    return false;
  }
}

/**
 * Removes a team member by deactivating their account.
 */
export async function removeTeamMemberActionByToken(
  token: string,
  memberId: string | number
): Promise<boolean> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized');

  try {
    const mutation = `
      mutation DeactivateTeamMember($id: Int!, $_set: aa_s_users_set_input!) {
        update_aa_s_users_by_pk(pk_columns: { id: $id }, _set: $_set) {
          id
          is_active
        }
      }
    `;
    await updateGraphQL({
      mutation,
      operationName: 'DeactivateTeamMember',
      id: Number(memberId),
      attrs: { is_active: false, updated_at: new Date().toISOString() },
    });
    return true;
  } catch (err) {
    console.error('removeTeamMemberActionByToken error:', err);
    return false;
  }
}
