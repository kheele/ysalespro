import dotenv from 'dotenv';
import path from 'path';
import { SHEQ_TARGET_TITLES, SHEQ_TARGET_SENIORITIES } from './scoring';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const getApiKey = () => (process.env.APOLLO_API_KEY || '').trim();

export function parsePerPage(val?: any): number {
  if (val) {
    const num = Number(val);
    if (!isNaN(num) && num > 0) return Math.min(num, 100);
  }
  const envVal = Number(process.env.APOLLO_PER_PAGE);
  return !isNaN(envVal) && envVal > 0 ? Math.min(envVal, 100) : 25;
}

export function parseMaxSearchPages(val?: any): number {
  if (val !== undefined && val !== null && val !== '') {
    const str = String(val).toLowerCase().trim();
    if (str === 'unlimited' || str === 'all' || str === '0' || str === '-1') return Infinity;
    const num = Number(str);
    return isNaN(num) || num <= 0 ? Infinity : num;
  }
  const envVal = (process.env.MAX_SEARCH_PAGES || '').toLowerCase().trim();
  if (envVal === 'unlimited' || envVal === 'all' || envVal === '0' || envVal === '-1') return Infinity;
  const num = Number(envVal);
  return isNaN(num) || num <= 0 ? 5 : num;
}

export interface ApolloRawPerson {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  headline?: string;
  organization_id?: string;
  organization_name?: string;
  departments?: string[];
  seniority?: string;
  city?: string;
  state?: string;
  country?: string;
  linkedin_url?: string;
  email?: string;
  email_status?: string;
  phone_numbers?: Array<{ raw_number?: string; number?: string; type?: string }>;
  sanitized_phone?: string;
}

// ─── 1. Apollo API HTTP Client with Dual Auth & Error Diagnostics ───────────
export async function fetchApolloApi(endpoint: string, bodyData: Record<string, any>, retries = 3): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Apollo API key is missing. Please set APOLLO_API_KEY in your environment.");
  }

  const url = `https://api.apollo.io/v1/${endpoint}`;
  const payload = {
    api_key: apiKey,
    ...bodyData,
  };

  let attempt = 0;
  let delay = 1000;

  while (attempt < retries) {
    attempt++;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'x-api-key': apiKey,
          'api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await res.json();
      }

      const status = res.status;
      const errText = await res.text().catch(() => '');

      let detailedReason = errText;
      try {
        const parsed = JSON.parse(errText);
        detailedReason = parsed.error || parsed.message || parsed.errors?.join(', ') || errText;
      } catch { }

      if (status === 401 || status === 403) {
        throw new Error(
          `Apollo API Authentication Error (HTTP ${status}): ${detailedReason}. ` +
          `Please check that your APOLLO_API_KEY is correct and has active access to the '${endpoint}' endpoint.`
        );
      }

      if (status === 404 || status === 422) {
        console.warn(`Apollo API Request Warning (HTTP ${status}) on '${endpoint}': ${detailedReason}`);
        return null;
      }

      if (status === 429 || (status >= 500 && status <= 503)) {
        console.warn(`Apollo API temporary error (HTTP ${status}) on attempt ${attempt}/${retries}. Retrying in ${delay}ms...`);
        if (attempt >= retries) {
          throw new Error(`Apollo API failed with HTTP ${status} after ${retries} attempts: ${detailedReason}`);
        }
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      throw new Error(`Apollo API returned HTTP ${status}: ${detailedReason}`);
    } catch (err: any) {
      if (err.message?.includes('Authentication Error') || attempt >= retries) {
        throw err;
      }
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  return null;
}

// ─── 2. Apollo People Search with Endpoint Fallback ─────────────────────────
export async function searchApolloPeopleForOrg(
  orgApolloId: string,
  options?: { perPage?: number; maxPages?: number | string }
): Promise<ApolloRawPerson[]> {
  const perPage = parsePerPage(options?.perPage);
  const maxPages = parseMaxSearchPages(options?.maxPages);
  const allPeople: ApolloRawPerson[] = [];

  const endpoints = ['mixed_people/api_search'];

  let page = 1;
  while (page <= maxPages) {
    let success = false;
    let lastError: Error | null = null;

    for (const ep of endpoints) {
      try {
        const data = await fetchApolloApi(ep, {
          organization_ids: [orgApolloId],
          person_titles: SHEQ_TARGET_TITLES,
          person_seniorities: SHEQ_TARGET_SENIORITIES,
          page,
          per_page: perPage,
        });

        if (!data) continue;

        const people = data?.people || data?.contacts || [];
        if (!Array.isArray(people) || people.length === 0) {
          return allPeople;
        }

        allPeople.push(...people);
        success = true;

        const totalPages = data?.pagination?.total_pages || Math.ceil((data?.pagination?.total_entries || 0) / perPage);
        if (page >= totalPages || people.length < perPage) {
          return allPeople;
        }
        break;
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('Authentication Error')) {
          throw err;
        }
      }
    }

    if (!success && lastError) {
      console.error(`Apollo search failed for org Apollo ID "${orgApolloId}" on page ${page}:`, lastError.message);
      break;
    }

    page++;
  }

  return allPeople;
}

// ─── 3. Apollo People Enrichment ───────────────────────────────────────────
export async function enrichApolloPerson(apolloId: string): Promise<Partial<ApolloRawPerson> | null> {
  try {
    const data = await fetchApolloApi('people/match', {
      id: apolloId,
      reveal_personal_emails: true,
      reveal_phone_number: true,
    });

    const person = data?.person || data?.contact || null;
    return person;
  } catch (err: any) {
    console.error(`Apollo enrichment failed for person apollo_id "${apolloId}":`, err.message);
    return null;
  }
}
