/**
 * Pure email tracking and URL rewriting utilities.
 * (No 'use server' directive so RSC / Vite does not treat helper functions as server actions)
 */

export function createTrackedLink(
  targetUrl: string,
  meta: { outreachId?: number; leadId?: number; campaignId?: number; baseUrl: string }
): string {
  const { outreachId, leadId, campaignId, baseUrl } = meta;
  // const cleanBase = "https://ae39-129-232-117-242.ngrok-free.app";
  const cleanBase = (baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://ysalespro.com').replace(/\/$/, '');
  const clickParams = new URLSearchParams({
    url: targetUrl,
    ...(outreachId ? { outreach_id: String(outreachId) } : {}),
    ...(leadId ? { lead_id: String(leadId) } : {}),
    ...(campaignId ? { campaign_id: String(campaignId) } : {}),
  });
  return `${cleanBase}/api/track/click?${clickParams.toString()}`;
}

/**
 * Injects tracking pixel and rewrites links for dual click-fallback tracking into HTML email.
 * - Auto-links raw URLs not enclosed in <a> tags
 * - Rewrites existing <a href="..."> links
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
  }
): string {
  if (!html) return '';

  const { outreachId, leadId, campaignId, baseUrl } = meta;
  // const cleanBase = "https://ae39-129-232-117-242.ngrok-free.app";
  const cleanBase = (baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://ysalespro.com').replace(/\/$/, '');

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

  // 3. Inject 1x1 tracking pixel (Gmail-compliant: NO display:none, NO zero opacity which Gmail strips)
  const pixelParams = new URLSearchParams({
    ...(outreachId ? { outreach_id: String(outreachId) } : {}),
    ...(leadId ? { lead_id: String(leadId) } : {}),
    ...(campaignId ? { campaign_id: String(campaignId) } : {}),
  });
  const pixelUrl = `${cleanBase}/api/track/open?${pixelParams.toString()}`;
  const pixelTag = `<table border="0" cellpadding="0" cellspacing="0" width="1" height="1" style="border:0;padding:0;margin:0;line-height:0;font-size:0;display:block;"><tr><td><img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:block;width:1px!important;min-width:1px!important;height:1px!important;min-height:1px!important;margin:0!important;padding:0!important;border:0!important;outline:none!important;" /></td></tr></table>`;

  // 4. Wrap into valid full HTML email envelope if missing
  if (processed.includes('</body>')) {
    processed = processed.replace('</body>', `${pixelTag}</body>`);
  } else if (processed.includes('</html>')) {
    processed = processed.replace('</html>', `${pixelTag}</html>`);
  } else {
    processed = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <div>${processed}</div>
  ${pixelTag}
</body>
</html>`;
  }

  return processed;
}
