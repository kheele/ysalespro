import { NextRequest, NextResponse } from 'next/server';
import { recordEmailClick } from '@/services/private/trackingService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/track/click?url=https://target.com&outreach_id=123&lead_id=456&campaign_id=789
 * Dual Fallback & Engagement Route:
 * If the tracking pixel was blocked or stripped by an email client, clicking this link
 * proves the recipient opened the email. It marks the outreach as Opened + Clicked,
 * increments lead engagement, and redirects to the target destination.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawUrl = searchParams.get('url');
  const outreachIdStr = searchParams.get('outreach_id') || searchParams.get('oid');
  const leadIdStr = searchParams.get('lead_id') || searchParams.get('lid');
  const campaignIdStr = searchParams.get('campaign_id') || searchParams.get('cid');

  if (!rawUrl) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Sanitize target URL to ensure legitimate web protocols
  let targetUrl: string;
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    targetUrl = parsed.toString();
  } catch {
    // If not a valid absolute URL, fallback to home
    return NextResponse.redirect(new URL('/', req.url));
  }

  const outreachId = outreachIdStr ? parseInt(outreachIdStr, 10) : null;
  const leadId = leadIdStr ? parseInt(leadIdStr, 10) : null;
  const campaignId = campaignIdStr ? parseInt(campaignIdStr, 10) : null;
  const action = searchParams.get('action') || undefined;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  // Record click & dual open fallback in background
  if (outreachId || leadId) {
    recordEmailClick({
      targetUrl,
      outreachId,
      leadId,
      campaignId,
      action,
      ip,
      userAgent,
    }).catch((err) => {
      console.error('[track/click] Async click recording error:', err);
    });
  }

  // Redirect to target URL
  return NextResponse.redirect(targetUrl, { status: 302 });
}
