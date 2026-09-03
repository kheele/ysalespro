import { NextRequest, NextResponse } from 'next/server';
import { crossReferenceExternalEmails } from '@/services/private/companyEmailScraperService';

export const maxDuration = 300; // Allow up to 5 min execution time
export const dynamic = 'force-dynamic';

/**
 * Webhook / Cron endpoint for n8n to cross-reference external emails.
 *
 * Expected Body:
 * {
 *   "items": [{{ $json.results.map(item => item.id) }}]
 * }
 *
 * Filters external emails specifically belonging to the provided organization IDs,
 * resolves their domains, and cross-references them to matching organizations.
 */
export async function POST(req: NextRequest) {
  try {
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

    let body: any = {};
    if (req.headers.get('content-type')?.includes('application/json')) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    // Extract organization IDs from body.items (supporting flat arrays, nested arrays, and objects)
    const rawItems = Array.isArray(body.items)
      ? body.items
      : Array.isArray(body.results)
        ? body.results
        : [];

    const organizationIds: number[] = rawItems
      .flat(Infinity)
      .map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return item.id !== undefined ? Number(item.id) : null;
        }
        return Number(item);
      })
      .filter((id: number): id is number => typeof id === 'number' && !isNaN(id) && id > 0);

    if (organizationIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or empty "items" array in request body. Expected: { "items": [id1, id2, ...] }',
        },
        { status: 400 }
      );
    }

    const result = await crossReferenceExternalEmails({ organizationIds });

    return NextResponse.json({
      success: true,
      mode: 'cross_reference_items',
      timestamp: new Date().toISOString(),
      total_items: organizationIds.length,
      total_external_evaluated: result.total_external_evaluated,
      companies_matched: result.companies_matched,
      emails_linked: result.emails_linked,
      matches: result.matches,
    });
  } catch (error: any) {
    console.error('API cross reference external emails error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error while cross-referencing external emails',
      },
      { status: 500 }
    );
  }
}

/**
 * Health check & info endpoint
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
    endpoint: '/api/cron/cross-reference-external-emails',
    description: 'Cross-references external emails from items payload to match and link organizations',
    expected_body: {
      items: '[{{ $json.results.map(item => item.id) }}]',
    },
    methods: ['POST', 'GET'],
  });
}
