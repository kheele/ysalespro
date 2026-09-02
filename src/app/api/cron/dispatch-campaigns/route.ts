import { NextRequest, NextResponse } from 'next/server';
import { processAllActiveCampaignsAction, processSingleCampaign } from '@/services/private/campaignCronService';

// export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for batch sending

/**
 * Endpoint for automated cron triggers (e.g., n8n, Vercel Cron, Google Cloud Scheduler).
 * Usage:
 *   POST /api/cron/dispatch-campaigns
 *   Header: Authorization: Bearer YOUR_CRON_SECRET
 *   Body (optional JSON): { "force": true, "campaign_id": 123 }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    // Verify secret via Bearer Authorization header if CRON_SECRET is configured
    if (expectedSecret) {
      const providedSecret = authHeader?.replace(/^Bearer\s+/i, '').trim();
      if (!providedSecret || providedSecret !== expectedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing Bearer token in Authorization header' },
          { status: 401 }
        );
      }
    }

    let forceWindow = false;
    let specificCampaignId: number | undefined;

    // Parse parameters from JSON body
    if (req.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await req.json();
        if (body?.force !== undefined) {
          forceWindow = Boolean(body.force);
        }
        if (body?.campaign_id !== undefined && body?.campaign_id !== null) {
          const parsedId = parseInt(String(body.campaign_id), 10);
          if (!isNaN(parsedId)) {
            specificCampaignId = parsedId;
          }
        }
      } catch {
        // Empty body or non-JSON body is acceptable for default cron runs
      }
    }

    if (specificCampaignId !== undefined) {
      const result = await processSingleCampaign(specificCampaignId, { forceWindow });
      return NextResponse.json({
        success: true,
        campaign_id: specificCampaignId,
        emails_sent: result.emailsSent,
        logs: result.logs,
      });
    }

    const result = await processAllActiveCampaignsAction({ forceWindow });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Cron dispatch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error during campaign dispatch',
      },
      { status: 500 }
    );
  }
}
