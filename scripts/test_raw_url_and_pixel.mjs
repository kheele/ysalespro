// scripts/test_raw_url_and_pixel.mjs
import assert from 'node:assert';

function createTrackedLink(targetUrl, meta) {
  const { outreachId, leadId, campaignId, baseUrl } = meta;
  const cleanBase = (baseUrl || 'https://ysalespro.ticketsum.com').replace(/\/$/, '');
  const clickParams = new URLSearchParams({
    url: targetUrl,
    ...(outreachId ? { outreach_id: String(outreachId) } : {}),
    ...(leadId ? { lead_id: String(leadId) } : {}),
    ...(campaignId ? { campaign_id: String(campaignId) } : {}),
  });
  return `${cleanBase}/api/track/click?${clickParams.toString()}`;
}

export function injectTrackingToEmailHtml(
  rawContent,
  meta
) {
  if (!rawContent) return '';

  const { outreachId, leadId, campaignId, baseUrl } = meta;
  const cleanBase = (baseUrl || 'https://ysalespro.ticketsum.com').replace(/\/$/, '');

  let processed = rawContent;

  // Convert plain text line breaks if no HTML tags exist
  if (!/<[a-z][\s\S]*>/i.test(processed)) {
    processed = processed.replace(/\n/g, '<br/>');
  }

  // 1. Rewrite existing <a href="..."> tags
  processed = processed.replace(
    /<a\s+([^>]*?)href=(["'])(https?:\/\/[^"'\s>]+)\2([^>]*?)>/gi,
    (match, before, quote, targetUrl, after) => {
      if (targetUrl.includes('/api/track/')) {
        return match;
      }
      const trackedUrl = createTrackedLink(targetUrl, meta);
      return `<a ${before}href=${quote}${trackedUrl}${quote}${after}>`;
    }
  );

  // 2. Auto-link RAW URLs not enclosed in an <a> tag
  // Matches http(s)://... not preceded by href=" or href=' or >
  processed = processed.replace(
    /(^|[^"'>])(https?:\/\/[a-zA-Z0-9-._~:/?#[\]@!$&'*+,;=%]+)/gi,
    (match, prefix, rawUrl) => {
      if (rawUrl.includes('/api/track/')) {
        return match;
      }
      const trackedUrl = createTrackedLink(rawUrl, meta);
      return `${prefix}<a href="${trackedUrl}" style="color:#2563eb;text-decoration:underline;">${rawUrl}</a>`;
    }
  );

  // 3. Build 1x1 tracking pixel (Gmail-compliant: NO display:none, NO zero opacity)
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

console.log('--- TEST: Plain Text with Raw URL ---');
const plainText = 'Hi John,\nCheck out our website at https://example.com/demo.\nThanks!';
const result1 = injectTrackingToEmailHtml(plainText, {
  outreachId: 555,
  leadId: 777,
  baseUrl: 'https://ae39-129-232-117-242.ngrok-free.app',
});

console.log('Result 1:\n', result1);
assert(result1.includes('<!DOCTYPE html>'), 'Must wrap in full HTML');
assert(result1.includes('<a href="https://ae39-129-232-117-242.ngrok-free.app/api/track/click?url=https%3A%2F%2Fexample.com%2Fdemo'), 'Raw URL must be auto-linked into tracked link');
assert(result1.includes('<img src="https://ae39-129-232-117-242.ngrok-free.app/api/track/open?outreach_id=555&lead_id=777"'), 'Pixel must be injected with valid table and styles');
assert(!result1.includes('display:none'), 'Must NOT have display:none which Gmail strips');

console.log('✓ PASS: All plain text autolinking, HTML wrapping, and Gmail-compliant pixel tests succeeded!');
