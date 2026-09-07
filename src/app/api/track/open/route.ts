import { NextRequest, NextResponse } from 'next/server';
import { recordEmailOpen } from '@/services/private/trackingService';

export const dynamic = 'force-dynamic';

// 1x1 transparent GIF binary buffer (43 bytes)
const TRANSPARENT_1X1_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * GET /api/track/open?outreach_id=123&lead_id=456&campaign_id=789
 * Returns a 1x1 transparent GIF while logging the email open event asynchronously.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const outreachIdStr = searchParams.get('outreach_id') || searchParams.get('oid');
  const leadIdStr = searchParams.get('lead_id') || searchParams.get('lid');
  const campaignIdStr = searchParams.get('campaign_id') || searchParams.get('cid');

  const outreachId = outreachIdStr ? parseInt(outreachIdStr, 10) : null;
  const leadId = leadIdStr ? parseInt(leadIdStr, 10) : null;
  const campaignId = campaignIdStr ? parseInt(campaignIdStr, 10) : null;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  // Fire and record tracking without blocking the response
  if (outreachId || leadId) {
    recordEmailOpen({
      outreachId,
      leadId,
      campaignId,
      ip,
      userAgent,
    }).catch((err) => {
      console.error('[track/open] Async open recording error:', err);
    });
  }

  // Return 1x1 transparent GIF with aggressive anti-caching headers
  return new NextResponse(TRANSPARENT_1X1_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_1X1_GIF.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
