import { NextRequest, NextResponse } from 'next/server';
import {
  scrapeCompanyEmails,
  batchScrapeDatabaseOrganizations,
  ScrapeTarget,
} from '@/services/private/companyEmailScraperService';

export const maxDuration = 300; // Allow up to 5 min execution time
export const dynamic = 'force-dynamic';

/**
 * Webhook / Cron endpoint for periodic execution from n8n.
 *
 * Authentication:
 *   Header: Authorization: Bearer <CRON_SECRET> (if CRON_SECRET is set in .env)
 *
 * Usage with n8n:
 *   1. Sweep All Database Organizations (Default / Scheduled Cron):
 *      POST /api/cron/scrape-company-emails
 *      {
 *        "limit": 50,
 *        "only_unscraped": true
 *      }
 *      (Or simply empty body `{}` - sweeps the next batch of un-scraped companies)
 *
 *   2. Custom Companies Payload (Optional):
 *      POST /api/cron/scrape-company-emails
 *      {
 *        "companies": [
 *          { "name": "Acme Corp", "website": "acme.com" }
 *        ]
 *      }
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

    let body: any = {};
    if (req.headers.get('content-type')?.includes('application/json')) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const persist = body.persist !== undefined ? Boolean(body.persist) : true;
    const timeoutMs = typeof body.timeout_ms === 'number' ? body.timeout_ms : 5000;
    const concurrency = typeof body.concurrency === 'number' ? body.concurrency : 5;

    // Mode 1: Array of companies / websites provided directly by n8n
    const rawCompanies = Array.isArray(body.companies)
      ? body.companies
      : Array.isArray(body.places)
      ? body.places
      : Array.isArray(body.domains)
      ? body.domains
      : null;

    if (rawCompanies && rawCompanies.length > 0) {
      const targets: ScrapeTarget[] = rawCompanies.map((c: any) => {
        if (typeof c === 'string') {
          return { website: c, domain: c };
        }
        return {
          id: c.id,
          name: c.name,
          website: c.website || c.url || c.domain,
          domain: c.domain,
          industry: c.industry,
        };
      });

      const result = await scrapeCompanyEmails(targets, {
        timeoutMs,
        concurrency,
        persistToDb: persist,
      });

      return NextResponse.json({
        success: true,
        mode: 'direct_payload',
        timestamp: new Date().toISOString(),
        total_targets: result.total,
        emails_found: result.successful,
        results: result.targets,
      });
    }

    // Mode 2: Run companies from aa_s_organizations with safe batch pagination
    const limit = typeof body.limit === 'number' && body.limit > 0 ? body.limit : 50;
    const offset = typeof body.offset === 'number' && body.offset >= 0 ? body.offset : 0;
    const onlyUnscraped = body.only_unscraped !== undefined ? Boolean(body.only_unscraped) : false;

    const result = await batchScrapeDatabaseOrganizations({
      limit,
      offset,
      concurrency,
      timeoutMs,
      onlyUnscraped,
    });

    return NextResponse.json({
      success: true,
      mode: 'all_organizations_sweep',
      timestamp: new Date().toISOString(),
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total_in_db: result.total_in_db,
        has_more: result.has_more,
        next_offset: result.next_offset,
      },
      only_unscraped: onlyUnscraped,
      total_processed: result.total,
      emails_found: result.successful,
      results: result.targets,
    });
  } catch (error: any) {
    console.error('API scrape company emails error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error while scraping company emails',
      },
      { status: 500 }
    );
  }
}

/**
 * Health check & status endpoint for n8n workflow verification
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const providedSecret = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing Bearer token in Authorization header' },
        { status: 401 }
      );
    }
  }

  return NextResponse.json({
    status: 'online',
    endpoint: '/api/cron/scrape-company-emails',
    description: 'Periodical company email scraper webhook for n8n',
    methods: ['POST', 'GET'],
  });
}
