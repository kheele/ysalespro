import { NextRequest, NextResponse } from 'next/server';
import { processInboundReplyAndEscalate } from '@/services/private/trackingService';

export const dynamic = 'force-dynamic';

/**
 * Clean up reply email text by removing previous email quotation chains
 * (e.g. "On Mon, Sep 7, 2026 at 2:00 PM ... wrote:")
 */
function cleanReplyBody(text: string): string {
  if (!text) return '';
  // Strip common email quote dividers
  const quoteDividers = [
    /\r?\nOn .*? wrote:\r?\n[\s\S]*/i,
    /\r?\n-----Original Message-----\r?\n[\s\S]*/i,
    /\r?\n_{10,}\r?\n[\s\S]*/,
    /\r?\nFrom: .*?Sent: .*?\r?\n[\s\S]*/i,
  ];

  let cleaned = text;
  for (const divider of quoteDividers) {
    cleaned = cleaned.split(divider)[0];
  }
  return cleaned.trim() || text.trim();
}

/**
 * POST /api/webhooks/inbound-reply
 * Universal inbound reply webhook endpoint.
 * Supports:
 *   - JSON payloads (Postmark, Resend, Google Workspace push, Custom)
 *   - Multipart / form-data payloads (SendGrid Inbound Parse, Mailgun)
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let fromEmail = '';
    let fromName = '';
    let subject = '';
    let body = '';
    let leadId: number | undefined;
    let outreachId: number | undefined;
    let campaignId: number | undefined;
    const extractedHeaders: Record<string, string> = {};

    if (contentType.includes('application/json')) {
      const json = await req.json();

      // Flexible mapping across SendGrid / Postmark / Resend / Google Push formats
      fromEmail = json.from || json.From || json.sender || json.from_email || '';
      fromName = json.from_name || json.FromName || '';
      subject = json.subject || json.Subject || 'Re: Outreach';
      body = json.text || json.TextBody || json.body || json.html || '';

      // Check if custom salespro metadata was attached in headers or payload
      if (json.headers) {
        if (typeof json.headers === 'object') {
          Object.assign(extractedHeaders, json.headers);
        }
      }

      if (json.lead_id) leadId = parseInt(String(json.lead_id), 10);
      if (json.outreach_id) outreachId = parseInt(String(json.outreach_id), 10);
      if (json.campaign_id) campaignId = parseInt(String(json.campaign_id), 10);

    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // SendGrid Inbound Parse / Mailgun multipart format
      const formData = await req.formData();
      fromEmail = String(formData.get('from') || formData.get('sender') || '');
      subject = String(formData.get('subject') || 'Re: Outreach');
      body = String(formData.get('text') || formData.get('html') || '');

      const headersRaw = formData.get('headers');
      if (headersRaw && typeof headersRaw === 'string') {
        try {
          const parsed = JSON.parse(headersRaw);
          Object.assign(extractedHeaders, parsed);
        } catch {
          // Plain text headers parsing
          headersRaw.split('\n').forEach((line) => {
            const [k, ...v] = line.split(':');
            if (k && v.length) extractedHeaders[k.trim().toLowerCase()] = v.join(':').trim();
          });
        }
      }

      const rawLead = formData.get('lead_id');
      if (rawLead) leadId = parseInt(String(rawLead), 10);
      const rawOutreach = formData.get('outreach_id');
      if (rawOutreach) outreachId = parseInt(String(rawOutreach), 10);
    } else {
      const rawText = await req.text();
      body = rawText;
    }

    // Extract sender email if formatted like "John Doe <john@company.com>"
    const emailMatch = fromEmail.match(/<([^>]+)>/);
    if (emailMatch && emailMatch[1]) {
      fromName = fromEmail.split('<')[0].trim().replace(/^"/, '').replace(/"$/, '');
      fromEmail = emailMatch[1].trim();
    }

    // Check custom headers for SalesPro routing metadata if not passed directly
    if (!leadId && extractedHeaders['x-salespro-lead-id']) {
      leadId = parseInt(extractedHeaders['x-salespro-lead-id'], 10);
    }
    if (!outreachId && extractedHeaders['x-salespro-outreach-id']) {
      outreachId = parseInt(extractedHeaders['x-salespro-outreach-id'], 10);
    }
    if (!campaignId && extractedHeaders['x-salespro-campaign-id']) {
      campaignId = parseInt(extractedHeaders['x-salespro-campaign-id'], 10);
    }

    if (!fromEmail && !body) {
      return NextResponse.json(
        { error: 'Invalid inbound payload: missing from email and message body' },
        { status: 400 }
      );
    }

    const cleanBody = cleanReplyBody(body);

    // Run AI reply classification & automatic lead escalation
    const result = await processInboundReplyAndEscalate({
      fromEmail,
      fromName,
      subject,
      body: cleanBody,
      leadId,
      outreachId,
      campaignId,
      headers: extractedHeaders,
    });

    return NextResponse.json({
      success: result.success,
      action: result.escalation_action,
      classification: result.classification,
      lead_id: result.lead_id,
      outreach_id: result.outreach_id,
    });
  } catch (err: any) {
    console.error('[webhooks/inbound-reply] Webhook processing error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error processing reply' },
      { status: 500 }
    );
  }
}
