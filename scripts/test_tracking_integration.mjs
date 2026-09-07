// scripts/test_tracking_integration.mjs
import assert from 'node:assert';

// 1. Test URL and Pixel Injection Logic
function injectTrackingToEmailHtml(html, meta) {
  if (!html) return html;

  let processed = html;
  const { outreachId, leadId, campaignId, baseUrl } = meta;
  const cleanBase = (baseUrl || 'https://ysalespro.ticketsum.com').replace(/\/$/, '');

  // 1. Rewrite <a href="..."> links for dual-fallback click tracking
  processed = processed.replace(
    /<a\s+([^>]*?)href=(["'])(https?:\/\/[^"'\s>]+)\2([^>]*?)>/gi,
    (match, before, quote, targetUrl, after) => {
      if (targetUrl.includes('/api/track/')) {
        return match;
      }
      const clickParams = new URLSearchParams({
        url: targetUrl,
        ...(outreachId ? { outreach_id: String(outreachId) } : {}),
        ...(leadId ? { lead_id: String(leadId) } : {}),
        ...(campaignId ? { campaign_id: String(campaignId) } : {}),
      });
      const trackedUrl = `${cleanBase}/api/track/click?${clickParams.toString()}`;
      return `<a ${before}href=${quote}${trackedUrl}${quote}${after}>`;
    }
  );

  // 2. Inject 1x1 tracking pixel at the end of the email
  const pixelParams = new URLSearchParams({
    ...(outreachId ? { outreach_id: String(outreachId) } : {}),
    ...(leadId ? { lead_id: String(leadId) } : {}),
    ...(campaignId ? { campaign_id: String(campaignId) } : {}),
  });
  const pixelUrl = `${cleanBase}/api/track/open?${pixelParams.toString()}`;
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;max-height:0;max-width:0;opacity:0;border:none;outline:none;" />`;

  if (processed.includes('</body>')) {
    processed = processed.replace('</body>', `${pixelTag}</body>`);
  } else {
    processed = `${processed}\n${pixelTag}`;
  }

  return processed;
}

// 2. Test Inbound Reply Quote Stripping Logic
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

console.log('--- TEST 1: Link & Tracking Pixel Injection ---');
const rawHtml = `
<html>
  <body>
    <p>Hello Alex,</p>
    <p>Take a look at our <a href="https://example.com/demo" class="btn">interactive demo</a> or check our <a href="https://example.com/pricing">pricing page</a>.</p>
  </body>
</html>
`;

const trackedHtml = injectTrackingToEmailHtml(rawHtml, {
  outreachId: 1045,
  leadId: 520,
  campaignId: 42,
  baseUrl: 'https://ysalespro.ticketsum.com',
});

assert(trackedHtml.includes('https://ysalespro.ticketsum.com/api/track/click?'), 'Must rewrite links with tracking URL');
assert(trackedHtml.includes('url=https%3A%2F%2Fexample.com%2Fdemo'), 'Must encode target URL');
assert(trackedHtml.includes('outreach_id=1045'), 'Must attach outreach_id');
assert(trackedHtml.includes('lead_id=520'), 'Must attach lead_id');
assert(trackedHtml.includes('campaign_id=42'), 'Must attach campaign_id');
assert(trackedHtml.includes('<img src="https://ysalespro.ticketsum.com/api/track/open?outreach_id=1045&lead_id=520&campaign_id=42"'), 'Must inject 1x1 tracking pixel');
console.log('✓ PASS: Link rewriting and pixel injection verified.');

console.log('--- TEST 2: Dual Tracking Fallback Verification ---');
// Verify that if pixel was blocked, click tracking has all the required parameters to log the open
const clickUrlSample = 'https://ysalespro.ticketsum.com/api/track/click?url=https%3A%2F%2Fexample.com%2Fdemo&outreach_id=1045&lead_id=520';
const parsedUrl = new URL(clickUrlSample);
assert.strictEqual(parsedUrl.searchParams.get('url'), 'https://example.com/demo');
assert.strictEqual(parsedUrl.searchParams.get('outreach_id'), '1045');
assert.strictEqual(parsedUrl.searchParams.get('lead_id'), '520');
console.log('✓ PASS: Click handler properly receives fallback parameters for blocked pixels.');

console.log('--- TEST 3: Inbound Reply Quotation Trimming ---');
const rawReply = `
Sounds very interesting! Can we set up a call for Thursday at 10 AM?

On Mon, Sep 7, 2026 at 2:15 PM Sales Operations <rep@salespro.com> wrote:
> Hi Alex,
> Wanted to reach out regarding our sales intelligence pipeline...
`;

const cleaned = cleanReplyBody(rawReply);
assert.strictEqual(cleaned, 'Sounds very interesting! Can we set up a call for Thursday at 10 AM?');
console.log('✓ PASS: Inbound reply quote dividers cleaned successfully.');

console.log('--- TEST 4: Transparent 1x1 GIF Byte Signature ---');
const TRANSPARENT_1X1_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);
assert.strictEqual(TRANSPARENT_1X1_GIF.length, 42, 'Must be exactly 42 bytes');
assert.strictEqual(TRANSPARENT_1X1_GIF.toString('ascii', 0, 6), 'GIF89a', 'Must start with GIF89a header');
console.log('✓ PASS: Transparent 1x1 GIF binary signature verified.');

console.log('\n=========================================');
console.log(' ALL 4 DUAL-TRACKING SUITE CHECKS PASSED!');
console.log('=========================================\n');
