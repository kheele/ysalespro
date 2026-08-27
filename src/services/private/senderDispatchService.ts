'use server';

import nodemailer from 'nodemailer';
import { getAccountCompanyIdFromClaims } from '@/lib/auth-utils';
import {
  getActiveSendingAccountByChannel,
  incrementAccountSentCount,
} from './connectedAccountsService';
import { logOutreachActionByToken } from './outreachServices';
import type {
  SendEmailPayload,
  SendLinkedInPayload,
  DispatchResult,
} from '@/lib/types';

export async function sendEmailOutreachActionByToken(
  token: string,
  payload: SendEmailPayload
): Promise<DispatchResult> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error('Unauthorized: Account company ID missing from token claims');
  }

  if (!payload.to || !payload.to.includes('@')) {
    return {
      success: false,
      channel: 'Email',
      recipient: payload.to || 'Unknown',
      status: 'Failed',
      error: 'Invalid recipient email address.',
      timestamp: new Date().toISOString(),
    };
  }

  if (!payload.subject || !payload.subject.trim()) {
    return {
      success: false,
      channel: 'Email',
      recipient: payload.to,
      status: 'Failed',
      error: 'Email subject is required.',
      timestamp: new Date().toISOString(),
    };
  }

  const account = await getActiveSendingAccountByChannel(companyId, 'Email', payload.account_id);
  if (!account || !account.email_config) {
    return {
      success: false,
      channel: 'Email',
      recipient: payload.to,
      status: 'Failed',
      error: 'No active email sending mailbox configured. Please connect a mailbox in Settings > Integrations.',
      timestamp: new Date().toISOString(),
    };
  }

  const config = account.email_config;
  const now = new Date().toISOString();
  let messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    if (config.password && (config.provider === 'google_workspace' || config.provider === 'smtp')) {
      const transporter = nodemailer.createTransport({
        host: config.host || (config.provider === 'google_workspace' ? 'smtp.gmail.com' : 'localhost'),
        port: config.port || (config.provider === 'google_workspace' ? 465 : 587),
        secure: config.secure ?? (config.port === 465),
        auth: {
          user: config.username || config.from_email,
          pass: config.password,
        },
        connectionTimeout: 8000,
      });

      const info = await transporter.sendMail({
        from: `"${config.from_name || 'SalesPro'}" <${config.from_email}>`,
        to: payload.to_name ? `"${payload.to_name}" <${payload.to}>` : payload.to,
        subject: payload.subject,
        text: payload.text || payload.html?.replace(/<[^>]*>?/gm, ''),
        html: payload.html || (payload.text ? payload.text.replace(/\n/g, '<br/>') : undefined),
        replyTo: payload.reply_to || config.reply_to || config.from_email,
        headers: {
          'X-SalesPro-Outreach': 'true',
          'X-SalesPro-Account-Id': account.id,
          'X-SalesPro-Lead-Id': String(payload.lead_id || ''),
          'X-SalesPro-Campaign-Id': String(payload.campaign_id || ''),
        },
      });

      if (info?.messageId) {
        messageId = info.messageId;
      }
    }

    // Increment sender account volume
    await incrementAccountSentCount(companyId, account.id);

    // Automatically record outreach activity in Hasura database
    const loggedActivity = await logOutreachActionByToken(token, {
      channel: 'Email',
      recipient_name: payload.to_name || payload.to.split('@')[0],
      recipient_email: payload.to,
      subject: payload.subject,
      subject_or_type: payload.subject,
      message: payload.text || payload.html || '',
      status: 'Sent',
      outcome: 'Dispatched via ' + account.name,
      lead_id: payload.lead_id ? Number(payload.lead_id) : undefined,
      campaign_id: payload.campaign_id ? Number(payload.campaign_id) : undefined,
      date: now.split('T')[0],
    });

    return {
      success: true,
      messageId,
      channel: 'Email',
      recipient: payload.to,
      status: 'Sent',
      timestamp: now,
      outreach_activity_id: loggedActivity?.id,
    };
  } catch (err: any) {
    console.error('sendEmailOutreachActionByToken error:', err);

    // Still log failed attempt for auditable tracking
    await logOutreachActionByToken(token, {
      channel: 'Email',
      recipient_name: payload.to_name || payload.to.split('@')[0],
      recipient_email: payload.to,
      subject: payload.subject,
      message: payload.text || payload.html || '',
      status: 'Bounced',
      outcome: `Failed to deliver: ${err?.message || 'SMTP Dispatch Error'}`,
      lead_id: payload.lead_id ? Number(payload.lead_id) : undefined,
      campaign_id: payload.campaign_id ? Number(payload.campaign_id) : undefined,
      date: now.split('T')[0],
    }).catch(() => null);

    return {
      success: false,
      channel: 'Email',
      recipient: payload.to,
      status: 'Failed',
      error: err?.message || 'Failed to dispatch email via SMTP provider.',
      timestamp: now,
    };
  }
}

export async function sendLinkedInOutreachActionByToken(
  token: string,
  payload: SendLinkedInPayload
): Promise<DispatchResult> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error('Unauthorized: Account company ID missing from token claims');
  }

  if (!payload.recipient_name) {
    return {
      success: false,
      channel: 'LinkedIn',
      recipient: 'Unknown',
      status: 'Failed',
      error: 'Recipient name or profile is required for LinkedIn outreach.',
      timestamp: new Date().toISOString(),
    };
  }

  const account = await getActiveSendingAccountByChannel(companyId, 'LinkedIn', payload.account_id);
  if (!account || !account.linkedin_config) {
    return {
      success: false,
      channel: 'LinkedIn',
      recipient: payload.recipient_name,
      status: 'Failed',
      error: 'No active LinkedIn account connected. Please link a LinkedIn account in Settings > Integrations.',
      timestamp: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const messageId = `li_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    // If webhook url is configured, dispatch payload to webhook
    if (account.linkedin_config.webhook_url) {
      try {
        await fetch(account.linkedin_config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_name: account.linkedin_config.account_name,
            recipient_name: payload.recipient_name,
            recipient_profile_url: payload.recipient_profile_url,
            message: payload.message,
            message_type: payload.message_type || 'connect',
            timestamp: now,
          }),
        });
      } catch (webhookErr) {
        console.warn('LinkedIn webhook dispatch warning:', webhookErr);
      }
    }

    // Increment sender account volume
    await incrementAccountSentCount(companyId, account.id);

    // Automatically record outreach activity in Hasura database
    const loggedActivity = await logOutreachActionByToken(token, {
      channel: 'LinkedIn',
      recipient_name: payload.recipient_name,
      recipient_title: payload.recipient_title || undefined,
      recipient_org: payload.recipient_org || undefined,
      subject: payload.message_type === 'connect' ? 'Connection Request with Note' : 'LinkedIn InMail / Message',
      subject_or_type: payload.message_type === 'connect' ? 'LinkedIn Connection Note' : 'LinkedIn Message',
      message: payload.message,
      status: 'Sent',
      outcome: `Dispatched via LinkedIn account (${account.name})`,
      lead_id: payload.lead_id ? Number(payload.lead_id) : undefined,
      campaign_id: payload.campaign_id ? Number(payload.campaign_id) : undefined,
      date: now.split('T')[0],
    });

    return {
      success: true,
      messageId,
      channel: 'LinkedIn',
      recipient: payload.recipient_name,
      status: 'Sent',
      timestamp: now,
      outreach_activity_id: loggedActivity?.id,
    };
  } catch (err: any) {
    console.error('sendLinkedInOutreachActionByToken error:', err);
    return {
      success: false,
      channel: 'LinkedIn',
      recipient: payload.recipient_name,
      status: 'Failed',
      error: err?.message || 'Failed to dispatch LinkedIn message.',
      timestamp: now,
    };
  }
}
