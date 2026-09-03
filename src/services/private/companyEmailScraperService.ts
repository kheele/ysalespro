'use server';

import dns from 'dns/promises';
import { listGraphQL, sendGraphQL, insertGraphQL } from '@/graphql';

export interface CategorizedEmail {
  email: string;
  email_type: 'internal' | 'external';
}

export interface ScrapeTarget {
  id?: number | string;
  name?: string;
  website?: string;
  domain?: string;
  industry?: string;
  emails?: string[];
  categorized_emails?: CategorizedEmail[];
  source?: 'website_scrape' | 'mx_fallback' | 'cross_referenced_scrape' | 'existing';
  status?: 'success' | 'not_found' | 'error';
  error?: string;
}

export interface ScrapeOptions {
  timeoutMs?: number;
  concurrency?: number;
  checkMxFallback?: boolean;
  persistToDb?: boolean;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const INVALID_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp|svg|css|js|woff|woff2|ico|ttf|eot)$/i;
const IGNORED_DOMAINS = [
  'example.com',
  'domain.com',
  'sentry.io',
  'wixpress.com',
  'schema.org',
  'w3.org',
  'google.com',
  'facebook.com',
  'twitter.com',
  'linkedin.com',
  'instagram.com',
  'youtube.com',
  'github.com',
  'cloudflare.com',
  'gravatar.com',
  'wordpress.org',
];

const COMMON_PUBLIC_MAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'aol.com',
  'zoho.com',
];

/**
 * Normalizes and cleans a website URL to a standard origin without trailing slash.
 */
export async function normalizeWebsiteUrl(rawUrl: string): Promise<{ baseUrl: string; cleanDomain: string } | null> {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  let trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Prepend protocol if missing
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const cleanDomain = hostname.replace(/^www\./, '');
    const baseUrl = `${parsed.protocol}//${parsed.host}`;
    return { baseUrl, cleanDomain };
  } catch {
    const cleanDomain = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].trim().toLowerCase();
    if (!cleanDomain || !cleanDomain.includes('.')) return null;
    return { baseUrl: `https://${cleanDomain}`, cleanDomain };
  }
}

/**
 * Checks if an email address belongs or relates to the target company domain.
 */
export async function isEmailRelatedToDomain(email: string, domain?: string): Promise<boolean> {
  if (!domain || !email || !email.includes('@')) return false;
  const emailHost = email.split('@')[1]?.toLowerCase().trim();
  const targetDomain = domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].trim();

  if (!emailHost || !targetDomain) return false;

  // Exact domain match (e.g., info@acme.com on acme.com)
  if (emailHost === targetDomain) return true;

  // Subdomain match (e.g., contact@us.acme.com on acme.com)
  if (emailHost.endsWith(`.${targetDomain}`)) return true;

  // Root domain match if targetDomain was a subdomain (e.g., info@acme.com on app.acme.com)
  if (targetDomain.endsWith(`.${emailHost}`)) return true;

  return false;
}

// In-memory DNS MX verification cache to prevent redundant network lookups
const mxCache = new Map<string, boolean>();

/**
 * Checks if a domain has active DNS MX records to receive email.
 */
export async function hasValidMxRecords(domain: string): Promise<boolean> {
  if (!domain || typeof domain !== 'string') return false;
  const clean = domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].trim();
  if (!clean || !clean.includes('.')) return false;

  if (mxCache.has(clean)) {
    return mxCache.get(clean)!;
  }

  try {
    const records = await dns.resolveMx(clean);
    const isValid = Boolean(records && records.length > 0);
    mxCache.set(clean, isValid);
    return isValid;
  } catch {
    mxCache.set(clean, false);
    return false;
  }
}

/**
 * Cleans, sanitizes, and categorizes found email addresses into internal (domain match) and external.
 * Validates every email against DNS MX records to eliminate bounce risks.
 */
export async function cleanAndCategorizeEmails(
  rawEmails: string[],
  cleanDomain?: string
): Promise<CategorizedEmail[]> {
  const seen = new Set<string>();
  const results: CategorizedEmail[] = [];

  for (const email of rawEmails) {
    if (!email || typeof email !== 'string') continue;
    const trimmed = email.trim().toLowerCase();

    // Check invalid file extensions matching regex by mistake
    if (INVALID_EXTENSIONS.test(trimmed)) continue;

    // Check ignored third-party tracking/vendor domains
    if (IGNORED_DOMAINS.some((d) => trimmed.endsWith(`@${d}`) || trimmed.includes(`.${d}`))) continue;

    // Must match valid email format
    if (!trimmed.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) continue;

    if (seen.has(trimmed)) continue;
    seen.add(trimmed);

    // DNS MX Deliverability Protection: Verify the email host actually has active mail servers
    const emailHost = trimmed.split('@')[1]?.toLowerCase().trim();
    if (!emailHost) continue;

    const hasMx = await hasValidMxRecords(emailHost);
    if (!hasMx) {
      // Discard dead/unverified mail domains
      continue;
    }

    const isInternal = cleanDomain ? await isEmailRelatedToDomain(trimmed, cleanDomain) : true;
    results.push({
      email: trimmed,
      email_type: isInternal ? 'internal' : 'external',
    });
  }

  // Prioritize internal emails first
  results.sort((a, b) => (a.email_type === 'internal' ? -1 : 1));

  return results;
}

/**
 * Backward-compatible helper returning plain email string array
 */
export async function cleanAndFilterEmails(rawEmails: string[], cleanDomain?: string): Promise<string[]> {
  const list = await cleanAndCategorizeEmails(rawEmails, cleanDomain);
  return list.map((item) => item.email);
}

/**
 * Safely fetches a webpage's HTML without using AbortController or abort signals.
 * Gracefully times out by resolving empty string if the remote host is slow.
 */
async function fetchPageHtmlGracefully(url: string, timeoutMs: number): Promise<string> {
  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => resolve(''), timeoutMs);
  });

  const fetchPromise = (async (): Promise<string> => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SalesPro/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });
      if (!res.ok) return '';
      return await res.text();
    } catch {
      return '';
    }
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Scrapes a single website across its homepage and contact subpages for email addresses.
 */
export async function scrapeSingleTarget(
  target: ScrapeTarget,
  options: ScrapeOptions = {}
): Promise<ScrapeTarget> {
  const websiteInput = target.website || target.domain || '';
  const normalized = await normalizeWebsiteUrl(websiteInput);

  if (!normalized) {
    return {
      ...target,
      emails: [],
      categorized_emails: [],
      status: 'error',
      error: `Invalid website or domain format: ${websiteInput}`,
    };
  }

  const { baseUrl, cleanDomain } = normalized;
  const timeoutMs = options.timeoutMs ?? 5000;
  const subpages = [
    baseUrl,
    `${baseUrl}/contact`,
    `${baseUrl}/contact-us`,
    `${baseUrl}/contact_us`,
    `${baseUrl}/about`,
    `${baseUrl}/about-us`,
    `${baseUrl}/team`,
    `${baseUrl}/our-team`,
    `${baseUrl}/privacy`,
    `${baseUrl}/privacy-policy`,
    `${baseUrl}/support`,
    `${baseUrl}/help`,
  ];

  const extractedEmails: string[] = [];
  let reachedAnyPage = false;

  const subpageFetches = subpages.map(async (url) => {
    const html = await fetchPageHtmlGracefully(url, timeoutMs);
    if (!html) return [];

    reachedAnyPage = true;
    const pageEmails: string[] = [];

    const mailtoMatches = Array.from(html.matchAll(/href=["']mailto:([^"'>?\s]+)/gi)).map((m) => m[1]);
    if (mailtoMatches.length > 0) {
      pageEmails.push(...mailtoMatches);
    }

    const textMatches = html.match(EMAIL_REGEX) || [];
    if (textMatches.length > 0) {
      pageEmails.push(...textMatches);
    }

    return pageEmails;
  });

  const resultsByPage = await Promise.allSettled(subpageFetches);
  for (const r of resultsByPage) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      extractedEmails.push(...r.value);
    }
  }

  let finalCategorized = await cleanAndCategorizeEmails(extractedEmails, cleanDomain);
  let source: ScrapeTarget['source'] = 'website_scrape';

  // Fallback: If no internal email found on page, test MX records and supply standard role mailbox
  const hasInternal = finalCategorized.some((e) => e.email_type === 'internal');
  if (!hasInternal && options.checkMxFallback !== false) {
    const hasMx = await hasValidMxRecords(cleanDomain);
    if (hasMx) {
      finalCategorized.unshift({
        email: `info@${cleanDomain}`,
        email_type: 'internal',
      });
      source = 'mx_fallback';
    }
  }

  const finalEmails = finalCategorized.map((e) => e.email);

  return {
    ...target,
    website: baseUrl,
    domain: cleanDomain,
    emails: finalEmails,
    categorized_emails: finalCategorized,
    source: finalEmails.length > 0 ? source : undefined,
    status: finalEmails.length > 0 ? 'success' : (reachedAnyPage ? 'not_found' : 'error'),
    error: finalEmails.length === 0 && !reachedAnyPage ? 'Could not reach target website or subpages' : undefined,
  };
}

/**
 * Concurrently scrapes a list of targets with a given concurrency pool.
 */
export async function scrapeCompanyEmails(
  targets: ScrapeTarget[],
  options: ScrapeOptions = {}
): Promise<{ total: number; successful: number; targets: ScrapeTarget[] }> {
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 5, 20));
  const results: ScrapeTarget[] = [];
  const queue = [...targets];

  const workers = Array.from({ length: concurrency }).map(async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const res = await scrapeSingleTarget(item, options);
      results.push(res);
    }
  });

  await Promise.all(workers);

  const successful = results.filter((r) => r.emails && r.emails.length > 0).length;

  // Persist to database if requested
  if (options.persistToDb) {
    await persistScrapedEmailsToDb(results);
  }

  return {
    total: results.length,
    successful,
    targets: results,
  };
}

/**
 * Persists newly scraped emails into aa_s_organization_emails table with email_type: 'internal' | 'external'
 */
async function persistScrapedEmailsToDb(targets: ScrapeTarget[]) {
  // 1. Collect all candidate emails across all targets in this batch
  const pendingItems: Array<{
    organization_id: number;
    email: string;
    email_type: 'internal' | 'external';
    source: string;
  }> = [];

  const orgIdsSet = new Set<number>();

  for (const t of targets) {
    const categorized = t.categorized_emails || [];
    if (categorized.length === 0 && (!t.emails || t.emails.length === 0)) continue;

    let orgId: number | null = t.id ? Number(t.id) : null;
    const cleanDomain = t.domain || (t.website ? t.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : null);

    if (!orgId && cleanDomain) {
      try {
        const findOrgQ = `
          query FindOrgByDomain($domain: String!) {
            aa_s_organizations(
              where: {
                _or: [
                  { primary_domain: { _ilike: $domain } },
                  { website_url: { _ilike: $domain } }
                ]
              },
              limit: 1
            ) {
              id
            }
          }
        `;
        const found = await listGraphQL({
          query: findOrgQ,
          variables: { domain: `%${cleanDomain}%` },
          operationName: 'FindOrgByDomain',
        });
        if (Array.isArray(found) && found.length > 0) {
          orgId = Number(found[0].id);
        }
      } catch (findErr) {
        console.warn(`[Scraper] Organization lookup error for ${cleanDomain}:`, findErr);
      }
    }

    if (!orgId) continue;

    orgIdsSet.add(orgId);

    const emailList: CategorizedEmail[] =
      categorized.length > 0
        ? categorized
        : (t.emails || []).map((e) => ({
            email: e,
            email_type: 'internal',
          }));

    for (const item of emailList) {
      if (!item.email || !item.email.includes('@')) continue;
      pendingItems.push({
        organization_id: orgId,
        email: item.email.trim().toLowerCase(),
        email_type: item.email_type || 'internal',
        source: t.source || 'website_scrape',
      });
    }
  }

  if (pendingItems.length === 0 || orgIdsSet.size === 0) return;

  try {
    // 2. Fetch existing emails for all organization IDs in this batch in ONE query
    const checkBatchQ = `
      query CheckBatchOrgEmails($orgIds: [Int!]!) {
        aa_s_organization_emails(
          where: { organization_id: { _in: $orgIds } }
        ) {
          organization_id
          email
        }
      }
    `;

    const existingRes = await listGraphQL({
      query: checkBatchQ,
      variables: { orgIds: Array.from(orgIdsSet) },
      operationName: 'CheckBatchOrgEmails',
    });

    const existingList: any[] = Array.isArray(existingRes) ? existingRes : [];
    const existingSet = new Set<string>();
    for (const e of existingList) {
      if (e?.organization_id && e?.email) {
        existingSet.add(`${e.organization_id}:${e.email.toLowerCase().trim()}`);
      }
    }

    // 3. Keep only emails that don't already exist and deduplicate within the batch
    const toInsert: Array<{
      organization_id: number;
      email: string;
      email_type: string;
      source: string;
    }> = [];
    const seenInBatch = new Set<string>();

    for (const p of pendingItems) {
      const key = `${p.organization_id}:${p.email}`;
      if (!existingSet.has(key) && !seenInBatch.has(key)) {
        seenInBatch.add(key);
        toInsert.push(p);
      }
    }

    if (toInsert.length === 0) return;

    // 4. Batch insert new records in chunks of 50 in ONE mutation per chunk
    const chunkSize = 50;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const insertBulkM = `
        mutation InsertBatchOrgEmails($objects: [aa_s_organization_emails_insert_input!]!) {
          insert_aa_s_organization_emails(objects: $objects) {
            affected_rows
          }
        }
      `;

      await insertGraphQL({
        mutation: insertBulkM,
        input: chunk,
        operationName: 'InsertBatchOrgEmails',
      });
    }
  } catch (dbErr) {
    console.warn(`[Scraper] Could not batch persist company emails:`, dbErr);
  }
}

/**
 * Queries all database organizations (aa_s_organizations), extracts their domains,
 * scrapes their contact emails, and updates aa_s_organization_emails.
 */
export async function batchScrapeDatabaseOrganizations(
  options: {
    limit?: number;
    offset?: number;
    concurrency?: number;
    timeoutMs?: number;
    onlyUnscraped?: boolean;
  } = {}
): Promise<{
  total: number;
  successful: number;
  targets: ScrapeTarget[];
  limit: number;
  offset: number;
  total_in_db: number;
  has_more: boolean;
  next_offset: number | null;
}> {
  const limit = options.limit && options.limit > 0 ? options.limit : 50;
  const offset = options.offset && options.offset > 0 ? options.offset : 0;
  const onlyUnscraped = options.onlyUnscraped !== undefined ? options.onlyUnscraped : false;

  const whereConditions: Record<string, any>[] = [
    {
      _or: [
        { primary_domain: { _is_null: false, _neq: '' } },
        { website_url: { _is_null: false, _neq: '' } },
      ],
    },
  ];

  // If onlyUnscraped is true, pick organizations that don't yet have entries in aa_s_organization_emails
  if (onlyUnscraped) {
    whereConditions.push({
      _not: {
        email_list: { id: { _is_null: false } },
      },
    });
  }

  const q = `
    query GetAllOrgsToScrape($where: aa_s_organizations_bool_exp, $limit: Int, $offset: Int) {
      aa_s_organizations(where: $where, limit: $limit, offset: $offset, order_by: [{ id: asc }]) {
        id
        name
        primary_domain
        website_url
        primary_industry
        email_list {
          id
          email
          email_type
          source
        }
      }
      aa_s_organizations_aggregate(where: $where) {
        aggregate {
          count
        }
      }
    }
  `;

  let orgList: any[] = [];
  let totalInDb = 0;
  try {
    const rawRes = await sendGraphQL({
      query: q,
      variables: { where: { _and: whereConditions }, limit, offset },
      operationName: 'GetAllOrgsToScrape',
      multi_queries: true,
    });

    const {
      aa_s_organizations: rawList,
      aa_s_organizations_aggregate,
    } = (rawRes as any) || {};

    orgList = Array.isArray(rawList)
      ? rawList
      : Array.isArray(rawRes)
      ? rawRes
      : Array.isArray((rawRes as any)?.data?.aa_s_organizations)
      ? (rawRes as any).data.aa_s_organizations
      : [];

    totalInDb =
      aa_s_organizations_aggregate?.aggregate?.count ??
      (rawRes as any)?.data?.aa_s_organizations_aggregate?.aggregate?.count ??
      orgList.length;
  } catch (err) {
    console.error('[Scraper] Error querying organizations to scrape:', err);
    orgList = [];
    totalInDb = 0;
  }

  console.log(`[Scraper] Fetched batch of ${orgList.length} company/organization(s) (Total matching in DB: ${totalInDb}, offset: ${offset}, limit: ${limit}).`);

  const targets: ScrapeTarget[] = orgList.map((o: any) => {
    const domainRawCandidate = typeof o.primary_domain === 'string'
      ? o.primary_domain
      : (typeof o.primary_domain === 'object' && o.primary_domain ? (o.primary_domain.domain || o.primary_domain.name || '') : '');

    const urlRawCandidate = typeof o.website_url === 'string'
      ? o.website_url
      : (typeof o.website_url === 'object' && o.website_url ? (o.website_url.url || o.website_url.domain || '') : '');

    const rawDomain = domainRawCandidate || urlRawCandidate || '';
    const cleanDomain = String(rawDomain)
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .trim()
      .toLowerCase();
    const website = o.website_url || (cleanDomain ? `https://${cleanDomain}` : undefined);

    return {
      id: o.id,
      name: o.name || cleanDomain || `Company #${o.id}`,
      website,
      domain: cleanDomain,
      industry: o.primary_industry,
    };
  });

  const scrapeResult = await scrapeCompanyEmails(targets, {
    concurrency: options.concurrency ?? 15,
    timeoutMs: options.timeoutMs ?? 5000,
    persistToDb: true,
    checkMxFallback: true,
  });

  const hasMore = (offset + orgList.length) < totalInDb;
  const nextOffset = hasMore ? (offset + orgList.length) : null;

  return {
    ...scrapeResult,
    limit,
    offset,
    total_in_db: totalInDb,
    has_more: hasMore,
    next_offset: nextOffset,
  };
}

/**
 * Searches all external emails in aa_s_organization_emails, extracts their domain,
 * checks if matching organizations exist in aa_s_organizations, and adds the email to those companies.
 */
export async function crossReferenceExternalEmails(options: {
  organizationIds?: number[];
  limit?: number;
  offset?: number;
} = {}): Promise<{
  total_external_evaluated: number;
  companies_matched: number;
  emails_linked: number;
  matches: Array<{
    external_email: string;
    origin_org_id: number;
    matched_org_id: number;
    matched_org_name: string;
    matched_domain: string;
    already_existed: boolean;
  }>;
  limit?: number;
  offset?: number;
  total_in_db?: number;
  has_more?: boolean;
  next_offset?: number | null;
}> {
  const orgIds = options.organizationIds?.filter((id) => typeof id === 'number' && id > 0);
  const isTargeted = Boolean(orgIds && orgIds.length > 0);

  const whereConditions: Record<string, any>[] = [
    { email_type: { _eq: 'external' } },
  ];

  if (isTargeted) {
    whereConditions.push({
      organization_id: { _in: orgIds },
    });
  }

  const limit = isTargeted ? Math.max(orgIds!.length * 20, 100) : Math.max(1, Math.min(options.limit ?? 100, 500));
  const offset = options.offset ?? 0;

  // 1. Fetch external emails
  const qExternal = `
    query GetExternalEmails($where: aa_s_organization_emails_bool_exp, $limit: Int, $offset: Int) {
      aa_s_organization_emails(
        where: $where,
        limit: $limit,
        offset: $offset,
        order_by: [{ id: asc }]
      ) {
        id
        organization_id
        email
        source
      }
      aa_s_organization_emails_aggregate(where: $where) {
        aggregate {
          count
        }
      }
    }
  `;

  let externalEmailsList: any[] = [];
  let totalInDb = 0;
  try {
    const rawRes = await sendGraphQL({
      query: qExternal,
      variables: { where: { _and: whereConditions }, limit, offset },
      operationName: 'GetExternalEmails',
      multi_queries: true,
    });

    const {
      aa_s_organization_emails: rawList,
      aa_s_organization_emails_aggregate,
    } = (rawRes as any) || {};

    externalEmailsList = Array.isArray(rawList)
      ? rawList
      : Array.isArray(rawRes)
      ? rawRes
      : Array.isArray((rawRes as any)?.data?.aa_s_organization_emails)
      ? (rawRes as any).data.aa_s_organization_emails
      : [];

    totalInDb =
      aa_s_organization_emails_aggregate?.aggregate?.count ??
      (rawRes as any)?.data?.aa_s_organization_emails_aggregate?.aggregate?.count ??
      externalEmailsList.length;
  } catch (err) {
    console.error('[CrossReference] Error querying external emails:', err);
    return {
      total_external_evaluated: 0,
      companies_matched: 0,
      emails_linked: 0,
      matches: [],
      limit,
      offset,
      total_in_db: 0,
      has_more: false,
      next_offset: null,
    };
  }

  const matches: Array<{
    external_email: string;
    origin_org_id: number;
    matched_org_id: number;
    matched_org_name: string;
    matched_domain: string;
    already_existed: boolean;
  }> = [];

  let emailsLinked = 0;
  const matchedCompanyIds = new Set<number>();

  for (const ext of externalEmailsList) {
    const email = ext.email?.toLowerCase().trim();
    if (!email || !email.includes('@')) continue;

    const emailDomain = email.split('@')[1]?.toLowerCase().trim();
    if (!emailDomain || COMMON_PUBLIC_MAIL_PROVIDERS.includes(emailDomain) || IGNORED_DOMAINS.includes(emailDomain)) {
      continue;
    }

    const hasMx = await hasValidMxRecords(emailDomain);
    if (!hasMx) {
      continue;
    }

    try {
      // 2. Look for companies in aa_s_organizations matching this domain
      const findOrgQ = `
        query FindOrgByExtDomain($domain: String!) {
          aa_s_organizations(
            where: {
              _or: [
                { primary_domain: { _ilike: $domain } },
                { website_url: { _ilike: $domain } }
              ]
            },
            limit: 1
          ) {
            id
            name
            primary_domain
            website_url
          }
        }
      `;

      const foundOrgs = await listGraphQL({
        query: findOrgQ,
        variables: { domain: `%${emailDomain}%` },
        operationName: 'FindOrgByExtDomain',
      });

      const matchedOrg = Array.isArray(foundOrgs) && foundOrgs.length > 0 ? foundOrgs[0] : null;

      if (matchedOrg && matchedOrg.id !== ext.organization_id) {
        matchedCompanyIds.add(matchedOrg.id);

        // 3. Check if email already exists for this matched organization
        const checkOrgEmailQ = `
          query CheckMatchedEmail($orgId: Int!, $email: String!) {
            aa_s_organization_emails(
              where: {
                organization_id: { _eq: $orgId },
                email: { _ilike: $email }
              },
              limit: 1
            ) {
              id
            }
          }
        `;

        const existing = await listGraphQL({
          query: checkOrgEmailQ,
          variables: { orgId: matchedOrg.id, email },
          operationName: 'CheckMatchedEmail',
        });

        const alreadyExisted = Array.isArray(existing) && existing.length > 0;

        if (!alreadyExisted) {
          // 4. Add email as internal email to the matched organization
          const insertM = `
            mutation InsertLinkedOrgEmail($object: aa_s_organization_emails_insert_input!) {
              insert_aa_s_organization_emails_one(object: $object) {
                id
              }
            }
          `;

          await insertGraphQL({
            mutation: insertM,
            input: {
              organization_id: matchedOrg.id,
              email: email,
              email_type: 'internal',
              source: 'cross_referenced_scrape',
            },
            operationName: 'InsertLinkedOrgEmail',
          });
          emailsLinked++;
        }

        matches.push({
          external_email: email,
          origin_org_id: ext.organization_id,
          matched_org_id: matchedOrg.id,
          matched_org_name: matchedOrg.name || emailDomain,
          matched_domain: emailDomain,
          already_existed: alreadyExisted,
        });
      }
    } catch (matchErr) {
      console.warn(`[CrossReference] Error checking email ${email}:`, matchErr);
    }
  }

  const hasMore = (offset + externalEmailsList.length) < totalInDb;
  const nextOffset = hasMore ? (offset + limit) : null;

  return {
    total_external_evaluated: externalEmailsList.length,
    companies_matched: matchedCompanyIds.size,
    emails_linked: emailsLinked,
    matches,
    limit,
    offset,
    total_in_db: totalInDb,
    has_more: hasMore,
    next_offset: nextOffset,
  };
}
