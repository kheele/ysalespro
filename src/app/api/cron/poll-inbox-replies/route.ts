import { NextRequest, NextResponse } from 'next/server';
import { pollInboxReplies } from '@/services/private/inboxReplyPollerService';

export const maxDuration = 300; // Allow up to 5 min execution time
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/poll-inbox-replies
 * POST /api/cron/poll-inbox-replies
 *
 * Automated IMAP inbox poller — batched, rolling architecture.
 * Each execution picks the N accounts polled least recently (last_polled_at ASC NULLS FIRST),
 * processes them with a concurrency limit, and stamps last_polled_at = NOW().
 *
 * Authentication:
 *   Header: Authorization: Bearer <CRON_SECRET>  (if CRON_SECRET env var is set)
 *
 * Optional POST body:
 *   { company_id?: number, batch_size?: number }
 */
async function handlePolling(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    const isInternalUi =
      req.headers.get('x-salespro-ui') === 'true' ||
      req.headers.get('sec-fetch-site') === 'same-origin' ||
      Boolean(req.headers.get('cookie'));

    if (expectedSecret && !isInternalUi) {
      const providedSecret = authHeader?.replace(/^Bearer\s+/i, '').trim();
      if (!providedSecret || providedSecret !== expectedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing Bearer token in Authorization header' },
          { status: 401 }
        );
      }
    }

    let companyId: number | undefined;
    let batchSize: number | undefined;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.company_id) companyId = Number(body.company_id);
        if (body.batch_size) batchSize = Number(body.batch_size);
      } catch {
        // empty body is acceptable
      }
    }

    const result = await pollInboxReplies(companyId, batchSize);

    return NextResponse.json({
      success: result.success,
      accounts_checked: result.accounts_checked,
      replies_detected: result.replies_detected,
      replies_escalated: result.replies_escalated,
      batch_size: result.batch_size,
      details: result.details,
      timestamp: result.timestamp,
    });
  } catch (err: any) {
    console.error('[cron/poll-inbox-replies] Execution failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to poll inbox replies' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handlePolling(req);
}

export async function POST(req: NextRequest) {
  return handlePolling(req);
}
