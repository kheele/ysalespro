import { queryHasura } from './hasuraClient';
import { scoreCandidateTitle } from './scoring';
import { ApolloRawPerson } from './apolloApiClient';

// ─── Database Upsert Engine (aa_s_people) ──────────────────────────────────
export async function upsertDiscoveredPeople(
  organization: { id: number | string; name: string; primary_industry?: string; industry?: string },
  rawCandidates: ApolloRawPerson[],
  dryRun = false
): Promise<{ newCount: number; updatedCount: number; savedPeople: any[] }> {
  let newCount = 0;
  let updatedCount = 0;
  const savedPeople: any[] = [];

  // Fetch existing people for this company to match by apollo_id or name
  let existingDbPeople: any[] = [];
  try {
    const data = await queryHasura(`
      query GetPeopleByCompany($companyId: Int!) {
        aa_s_people(where: { company_id: { _eq: $companyId } }) {
          id
          apollo_id
          name
          job_title
          email
          phone
          score
          apollo_enriched
          has_email
          has_phone
          email_status
          country
          state
          city
          location
          linkedin_url
        }
      }
    `, { companyId: Number(organization.id) });
    existingDbPeople = data?.aa_s_people || [];
  } catch (err) {
    console.error("Error fetching existing people for company:", err);
  }

  for (const candidate of rawCandidates) {
    const apolloId = candidate.id;
    if (!apolloId) continue;

    const candidateName = candidate.name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Unknown Candidate';
    const jobTitle = candidate.title || candidate.headline || 'Decision Maker';
    const score = scoreCandidateTitle(jobTitle);

    const country = candidate.country || null;
    const state = candidate.state || null;
    const city = candidate.city || null;
    const location = [city, state, country].filter(Boolean).join(', ') || null;
    const department = Array.isArray(candidate.departments) ? candidate.departments[0] : (candidate.departments || null);
    const seniority = candidate.seniority || null;
    const linkedinUrl = candidate.linkedin_url || null;

    // Check if person already exists by apollo_id or name
    const existing = existingDbPeople.find(
      (p) => String(p.apollo_id) === String(apolloId) || p.name?.toLowerCase() === candidateName.toLowerCase()
    );

    if (dryRun) {
      if (existing) updatedCount++; else newCount++;
      savedPeople.push({
        id: existing ? existing.id : `dry_run_${apolloId}`,
        apollo_id: apolloId,
        name: candidateName,
        job_title: jobTitle,
        company_id: organization.id,
        company_name: organization.name || "Company",
        organization_id: organization.id,
        organization_name: organization.name || "Company",
        industry: organization.primary_industry || organization.industry,
        department: department || existing?.department,
        seniority: seniority || existing?.seniority,
        country: country || existing?.country,
        state: state || existing?.state,
        city: city || existing?.city,
        location: location || existing?.location,
        linkedin_url: linkedinUrl || existing?.linkedin_url,
        score,
        email: existing?.email || candidate.email || undefined,
        phone: existing?.phone || undefined,
        apollo_enriched: Boolean(existing?.apollo_enriched),
        has_email: Boolean(existing?.has_email || existing?.email || candidate.email),
        has_phone: Boolean(existing?.has_phone || existing?.phone),
      });
      continue;
    }

    if (existing) {
      // Update existing person while preserving existing non-null data
      updatedCount++;
      const updateAttrs: Record<string, any> = {};
      if (apolloId && !existing.apollo_id) updateAttrs.apollo_id = apolloId;
      if (candidateName && existing.name !== candidateName) updateAttrs.name = candidateName;
      if (jobTitle && existing.job_title !== jobTitle) updateAttrs.job_title = jobTitle;
      if (score > (existing.score || 0)) updateAttrs.score = score;
      if (department && !existing.department) updateAttrs.department = department;
      if (seniority && !existing.seniority) updateAttrs.seniority = seniority;
      if (country && !existing.country) updateAttrs.country = country;
      if (state && !existing.state) updateAttrs.state = state;
      if (city && !existing.city) updateAttrs.city = city;
      if (location && !existing.location) updateAttrs.location = location;
      if (linkedinUrl && !existing.linkedin_url) updateAttrs.linkedin_url = linkedinUrl;
      if (candidate.email && !existing.email) {
        updateAttrs.email = candidate.email;
        updateAttrs.has_email = true;
      }

      if (Object.keys(updateAttrs).length > 0) {
        updateAttrs.updated_at = new Date().toISOString();
        try {
          await queryHasura(`
            mutation UpdatePerson($id: Int!, $_set: aa_s_people_set_input!) {
              update_aa_s_people_by_pk(pk_columns: { id: $id }, _set: $_set) {
                id
                apollo_id
                name
                job_title
                score
                email
                phone
                apollo_enriched
                has_email
                has_phone
              }
            }
          `, { id: Number(existing.id), _set: updateAttrs });
        } catch (err) {
          console.error(`Error updating person ${existing.id}:`, err);
        }
      }

      savedPeople.push({
        ...existing,
        ...updateAttrs,
        id: existing.id,
        apollo_id: apolloId,
        score: updateAttrs.score ?? existing.score ?? score,
      });
    } else {
      // Insert new person
      newCount++;
      const insertObject: Record<string, any> = {
        apollo_id: apolloId,
        name: candidateName,
        job_title: jobTitle,
        company_id: Number(organization.id),
        company_name: organization.name || "Company",
        industry: organization.primary_industry || organization.industry || "General Industry",
        department: department || null,
        seniority: seniority || null,
        country: country || null,
        state: state || null,
        city: city || null,
        location: location || null,
        linkedin_url: linkedinUrl || null,
        score,
        email: candidate.email || null,
        phone: null,
        apollo_enriched: false,
        has_email: Boolean(candidate.email),
        has_phone: false,
        email_status: candidate.email_status || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const res = await queryHasura(`
          mutation InsertPerson($object: aa_s_people_insert_input!) {
            insert_aa_s_people_one(object: $object) {
              id
              apollo_id
              name
              job_title
              company_id
              company_name
              score
              apollo_enriched
              has_email
              has_phone
            }
          }
        `, { object: insertObject });

        const insertedId = res?.insert_aa_s_people_one?.id || `new_${apolloId}`;
        savedPeople.push({
          id: insertedId,
          ...insertObject,
        });
      } catch (err) {
        console.error(`Error inserting person for apollo_id ${apolloId}:`, err);
      }
    }
  }

  return { newCount, updatedCount, savedPeople };
}
