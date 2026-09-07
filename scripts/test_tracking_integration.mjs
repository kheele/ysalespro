// scripts/test_tracking_integration.mjs
import assert from 'node:assert';

function createTrackedLink(targetUrl, meta) {
  const { outreachId, leadId, campaignId, baseUrl, extraParams } = meta;
  const cleanBase = (baseUrl || 'https://ysalespro.ticketsum.com').replace(/\/$/, '');
  const clickParams = new URLSearchParams({
    url: targetUrl,
    ...(outreachId ? { outreach_id: String(outreachId) } : {}),
    ...(leadId ? { lead_id: String(leadId) } : {}),
    ...(campaignId ? { campaign_id: String(campaignId) } : {}),
    ...(extraParams || {}),
  });
  return `${cleanBase}/api/track/click?${clickParams.toString()}`;
}

function injectTrackingToEmailHtml(html, meta) {
  if (!html) return '';

  const { outreachId, leadId, campaignId, baseUrl, includeOptOut = true } = meta;
  const cleanBase = (baseUrl || 'https://ysalespro.ticketsum.com').replace(/\/$/, '');

  let processed = html;

  // Convert plain text line breaks if no HTML tags exist
  if (!/<[a-z][\s\S]*>/i.test(processed)) {
    processed = processed.replace(/\n/g, '<br/>');
  }

  // 1. Rewrite existing <a href="..."> links for dual-fallback click tracking
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
  processed = processed.replace(
    /(^|[^"'>])(https?:\/\/[^\s<>"']+)/gi,
    (match, prefix, rawUrl) => {
      if (rawUrl.includes('/api/track/')) {
        return match;
      }
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

function cleanReplyBody(text) {
  if (!text) return '';
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

console.log('--- TEST 1: Plain Email Without Any Links ---');
const plainEmail = 'Hi John,\nJust checking if you are open to exploring our sales platform.\nThanks!';
const trackedPlain = injectTrackingToEmailHtml(plainEmail, {
  outreachId: 101,
  leadId: 202,
  baseUrl: 'https://ysalespro.ticketsum.com',
});

assert(trackedPlain.includes('<!DOCTYPE html>'), 'Must wrap in full HTML envelope');
assert(trackedPlain.includes('unsubscribe here'), 'Must embed automatic unsubscribe footer link');
assert(trackedPlain.includes('action=unsubscribe'), 'Must attach action=unsubscribe param');
assert(trackedPlain.includes('https://ysalespro.ticketsum.com/api/track/click?'), 'Must route unsubscribe through click tracking');
assert(trackedPlain.includes('https://ysalespro.ticketsum.com/api/track/open?outreach_id=101&lead_id=202'), 'Must include 1x1 pixel');
assert(!trackedPlain.includes('display:none'), 'Must not use display:none');
console.log('✓ PASS: Automatic opt-out footer link and Gmail pixel verified for plain emails.');

console.log('--- TEST 2: Email With Existing & Raw URLs ---');
const emailWithLinks = 'Check out https://company.com/deck and <a href="https://company.com/book">Book a Call</a>.';
const trackedWithLinks = injectTrackingToEmailHtml(emailWithLinks, {
  outreachId: 102,
  leadId: 203,
  baseUrl: 'https://ysalespro.ticketsum.com',
});

assert(trackedWithLinks.includes('url=https%3A%2F%2Fcompany.com%2Fdeck'), 'Must rewrite raw URL');
assert(trackedWithLinks.includes('url=https%3A%2F%2Fcompany.com%2Fbook'), 'Must rewrite anchor link');
assert(trackedWithLinks.includes('unsubscribe here'), 'Must still embed unsubscribe footer');
console.log('✓ PASS: Both user links and automatic unsubscribe link properly tracked.');

console.log('--- TEST 3: Inbound Reply Quotation Trimming ---');
const rawReply = `
Let's talk on Tuesday!

On Mon, Sep 7, 2026 at 2:15 PM Sales Operations <rep@salespro.com> wrote:
> Hi Alex,
> Wanted to reach out regarding our sales intelligence pipeline...
`;
assert.strictEqual(cleanReplyBody(rawReply), "Let's talk on Tuesday!");
console.log('✓ PASS: Quote divider trimming verified.');

console.log('--- TEST 4: Transparent 1x1 GIF Byte Signature ---');
const TRANSPARENT_1X1_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);
assert.strictEqual(TRANSPARENT_1X1_GIF.length, 42, 'Must be exactly 42 bytes');
assert.strictEqual(TRANSPARENT_1X1_GIF.toString('ascii', 0, 6), 'GIF89a', 'Must start with GIF89a header');
console.log('✓ PASS: 1x1 transparent GIF binary verified.');

console.log('\n======================================================');
console.log(' ALL 4 SUITE CHECKS (INCLUDING OPT-OUT FOOTER) PASSED!');
console.log('======================================================\n');
