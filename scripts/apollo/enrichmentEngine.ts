import dotenv from 'dotenv';
import path from 'path';
import { queryHasura } from './hasuraClient';
import { enrichApolloPerson } from './apolloApiClient';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export function parseMaxEnrich(val: any): number {
  if (val === undefined || val === null || val === '') {
    const envVal = (process.env.MAX_ENRICH_PER_ORGANIZATION || '').toLowerCase().trim();
    if (envVal === 'unlimited' || envVal === 'all' || envVal === '-1') return Infinity;
    const num = Number(envVal);
    return isNaN(num) || num <= 0 ? 3 : num;
  }
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower === 'unlimited' || lower === 'all' || lower === '-1') return Infinity;
    const num = Number(lower);
    return isNaN(num) ? 3 : (num <= 0 ? Infinity : num);
  }
  if (typeof val === 'number') {
    return val <= 0 ? Infinity : val;
  }
  return 3;
}

// ─── Apollo Candidate Enrichment Execution ─────────────────────────────────
export async function enrichTopCandidatesForOrg(
  organization: { id: number | string; name: string },
  people: any[],
  maxEnrich?: number | string,
  forceReEnrich = false,
  dryRun = false
): Promise<{ enrichedCount: number; emailsFoundCount: number; phonesFoundCount: number }> {
  let enrichedCount = 0;
  let emailsFoundCount = 0;
  let phonesFoundCount = 0;

  const limit = parseMaxEnrich(maxEnrich);

  // Filter candidates that need enrichment and rank by score descending
  const sorted = people
    .filter(p => p.apollo_id && (forceReEnrich || !p.apollo_enriched))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const candidatesToEnrich = isFinite(limit) ? sorted.slice(0, limit) : sorted;

  for (const person of candidatesToEnrich) {
    if (!person.apollo_id) continue;

    if (dryRun) {
      enrichedCount++;
      emailsFoundCount++;
      phonesFoundCount++;
      continue;
    }

    const enrichedData = await enrichApolloPerson(person.apollo_id);
    if (!enrichedData) continue;

    enrichedCount++;

    const email = enrichedData.email || null;
    const rawPhone = enrichedData.sanitized_phone ||
      (Array.isArray(enrichedData.phone_numbers) && enrichedData.phone_numbers.length > 0
        ? (enrichedData.phone_numbers[0].raw_number || enrichedData.phone_numbers[0].number)
        : null);

    const updateAttrs: Record<string, any> = {
      apollo_enriched: true,
      updated_at: new Date().toISOString(),
    };

    if (email) {
      updateAttrs.email = email;
      updateAttrs.has_email = true;
      updateAttrs.email_status = enrichedData.email_status || 'verified';
      emailsFoundCount++;
    } else if (person.email) {
      updateAttrs.has_email = true;
    }

    if (rawPhone) {
      updateAttrs.phone = rawPhone;
      updateAttrs.has_phone = true;
      phonesFoundCount++;
    } else if (person.phone) {
      updateAttrs.has_phone = true;
    }

    try {
      await queryHasura(`
        mutation EnrichPerson($id: Int!, $_set: aa_s_people_set_input!) {
          update_aa_s_people_by_pk(pk_columns: { id: $id }, _set: $_set) {
            id
            email
            phone
            has_email
            has_phone
            apollo_enriched
            email_status
          }
        }
      `, { id: Number(person.id), _set: updateAttrs });
    } catch (err) {
      console.error(`Failed to save enrichment for person ID ${person.id}:`, err);
    }
  }

  return { enrichedCount, emailsFoundCount, phonesFoundCount };
}
