/**
 * Pure email tracking and URL rewriting utilities.
 * (No 'use server' directive so RSC / Vite does not treat helper functions as server actions)
 */

export function createTrackedLink(
  targetUrl: string,
  meta: {
    outreachId?: number;
    leadId?: number;
    campaignId?: number;
    baseUrl: string;
    extraParams?: Record<string, string>;
  }
): string {
  const { outreachId, leadId, campaignId, baseUrl, extraParams } = meta;
  const cleanBase = (baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://ysalespro.ticketsum.com').replace(/\/$/, '');
  const clickParams = new URLSearchParams({
    url: targetUrl,
    ...(outreachId ? { outreach_id: String(outreachId) } : {}),
    ...(leadId ? { lead_id: String(leadId) } : {}),
    ...(campaignId ? { campaign_id: String(campaignId) } : {}),
    ...(extraParams || {}),
  });
  return `${cleanBase}/api/track/click?${clickParams.toString()}`;
}

/**
 * Injects tracking pixel and rewrites links for dual click-fallback tracking into HTML email.
 * - Auto-links raw URLs not enclosed in <a> tags
 * - Rewrites existing <a href="..."> links
 * - Appends a clean CAN-SPAM compliant Opt-out / Unsubscribe footer link
 * - Injects a Gmail & Outlook compliant 1x1 tracking pixel (no display:none / zero-opacity which Gmail strips)
 * - Wraps in a standard HTML document envelope so email clients properly render HTML
 */
export function injectTrackingToEmailHtml(
  html: string,
  meta: {
    outreachId?: number;
    leadId?: number;
    campaignId?: number;
    baseUrl: string;
    includeOptOut?: boolean;
  }
): string {
  if (!html) return '';

  const { outreachId, leadId, campaignId, baseUrl, includeOptOut = true } = meta;
  const cleanBase = (baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://ysalespro.ticketsum.com').replace(/\/$/, '');

  let processed = html;

  // Convert plain text line breaks if no HTML tags exist
  if (!/<[a-z][\s\S]*>/i.test(processed)) {
    processed = processed.replace(/\n/g, '<br/>');
  }

  // 1. Rewrite existing <a href="..."> links for dual-fallback click tracking
  processed = processed.replace(
    /<a\s+([^>]*?)href=(["'])(https?:\/\/[^"'\s>]+)\2([^>]*?)>/gi,
    (match, before, quote, targetUrl, after) => {
      // Don't double wrap if already tracked
      if (targetUrl.includes('/api/track/')) {
        return match;
      }
      const trackedUrl = createTrackedLink(targetUrl, meta);
      return `<a ${before}href=${quote}${trackedUrl}${quote}${after}>`;
    }
  );

  // 2. Auto-link RAW URLs not enclosed in an <a> tag
  processed = processed.replace(
    /(^|[^"'>])(https?:\/\/[^\s<>"']+)/gi,
    (match, prefix, rawUrl) => {
      if (rawUrl.includes('/api/track/')) {
        return match;
      }
      // Strip trailing punctuation (.,!?;:))
      const punctMatch = rawUrl.match(/[.,!?;:)]+$/);
      let cleanUrl = rawUrl;
      let trailing = '';
      if (punctMatch) {
        trailing = punctMatch[0];
        cleanUrl = cleanUrl.slice(0, -trailing.length);
      }
      const trackedUrl = createTrackedLink(cleanUrl, meta);
      return `${prefix}<a href="${trackedUrl}" style="color:#2563eb;text-decoration:underline;">${cleanUrl}</a>${trailing}`;
    }
  );

  // 3. Embed Automatic CAN-SPAM Opt-Out / Unsubscribe Footer Link
  let optOutFooter = '';
  if (includeOptOut && !processed.toLowerCase().includes('unsubscribe')) {
    const unsubDestination = `${cleanBase}/unsubscribe?lead_id=${leadId || ''}&outreach_id=${outreachId || ''}`;
    const trackedUnsubUrl = createTrackedLink(unsubDestination, {
      ...meta,
      extraParams: { action: 'unsubscribe' },
    });
    optOutFooter = `
<div style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;line-height:1.4;">
  If you'd prefer not to receive future emails, you can <a href="${trackedUnsubUrl}" style="color:#6b7280;text-decoration:underline;">unsubscribe here</a>.
</div>`;
  }

  // 4. Inject 1x1 tracking pixel (Gmail-compliant: NO display:none, NO zero opacity which Gmail strips)
  const pixelParams = new URLSearchParams({
    ...(outreachId ? { outreach_id: String(outreachId) } : {}),
    ...(leadId ? { lead_id: String(leadId) } : {}),
    ...(campaignId ? { campaign_id: String(campaignId) } : {}),
  });
  const pixelUrl = `${cleanBase}/api/track/open?${pixelParams.toString()}`;
  const pixelTag = `<table border="0" cellpadding="0" cellspacing="0" width="1" height="1" style="border:0;padding:0;margin:0;line-height:0;font-size:0;display:block;"><tr><td><img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:block;width:1px!important;min-width:1px!important;height:1px!important;min-height:1px!important;margin:0!important;padding:0!important;border:0!important;outline:none!important;" /></td></tr></table>`;

  const footerAndPixel = `${optOutFooter}\n${pixelTag}`;

  // 5. Wrap into valid full HTML email envelope if missing
  if (processed.includes('</body>')) {
    processed = processed.replace('</body>', `${footerAndPixel}</body>`);
  } else if (processed.includes('</html>')) {
    processed = processed.replace('</html>', `${footerAndPixel}</html>`);
  } else {
    processed = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <div>${processed}</div>
  ${footerAndPixel}
</body>
</html>`;
  }

  return processed;
}
