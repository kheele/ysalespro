import dotenv from 'dotenv';
import path from 'path';
import { queryHasura } from './apollo/hasuraClient';
import { searchApolloPeopleForOrg } from './apollo/apolloApiClient';
import { upsertDiscoveredPeople } from './apollo/upsertEngine';
import { enrichTopCandidatesForOrg, parseMaxEnrich } from './apollo/enrichmentEngine';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ─── Main CLI Execution Routine ─────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  let mode: 'discovery' | 'discovery_and_enrichment' | 'dry_run' = 'discovery_and_enrichment';
  let maxEnrich: string | number | undefined;
  let maxSearchPages: string | number | undefined;
  let perPage: number | undefined;
  let startOffset = 0;
  let pageLimit = 50;

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '--dryrun') {
      mode = 'dry_run';
    } else if (arg === '--discovery-only') {
      mode = 'discovery';
    } else if (arg.startsWith('--enrich-top=')) {
      const val = arg.split('=')[1];
      maxEnrich = val.toLowerCase() === 'unlimited' || val.toLowerCase() === 'all' || val === '-1' ? 'unlimited' : (parseInt(val, 10) || 3);
    } else if (arg.startsWith('--max-pages=')) {
      const val = arg.split('=')[1];
      maxSearchPages = val.toLowerCase() === 'unlimited' || val.toLowerCase() === 'all' || val === '0' || val === '-1' ? 'unlimited' : (parseInt(val, 10) || 5);
    } else if (arg.startsWith('--per-page=')) {
      perPage = parseInt(arg.split('=')[1], 10) || 25;
    } else if (arg.startsWith('--start=')) {
      startOffset = parseInt(arg.split('=')[1], 10) || 0;
    } else if (arg.startsWith('--offset=')) {
      startOffset = parseInt(arg.split('=')[1], 10) || 0;
    } else if (arg.startsWith('--limit=')) {
      pageLimit = parseInt(arg.split('=')[1], 10) || 50;
    }
  }

  const dryRun = mode === 'dry_run';
  const parsedLimit = parseMaxEnrich(maxEnrich);
  const displayMaxEnrich = isFinite(parsedLimit) ? parsedLimit : 'UNLIMITED';

  console.log("=================================================");
  console.log("🚀 Starting Apollo SHEQ Decision-Maker Script");
  console.log(`   Mode:                ${mode.toUpperCase()}`);
  console.log(`   Pagination Start:    ${startOffset}`);
  console.log(`   Pagination Limit:    ${pageLimit}`);
  console.log(`   Max Enrich Per Org:  ${displayMaxEnrich}`);
  if (maxSearchPages) console.log(`   Max Search Pages:    ${maxSearchPages}`);
  if (perPage) console.log(`   Results Per Page:    ${perPage}`);
  console.log("=================================================");

  const startTime = Date.now();

  const summary = {
    mode,
    startOffset,
    pageLimit,
    totalMatchingOrgs: 0,
    organizationsProcessed: 0,
    peopleDiscovered: 0,
    newPeopleSaved: 0,
    peopleUpdated: 0,
    topDecisionMakersCount: 0,
    peopleEnriched: 0,
    emailsFound: 0,
    phonesFound: 0,
    errors: [] as string[],
  };

  try {
    // Query Hasura for organizations where apollo_id IS NOT NULL AND industry.active = true
    const data = await queryHasura(`
      query GetOrgsForApolloDiscovery($limit: Int!, $offset: Int!) {
        aa_s_organizations(
          where: {
            apollo_id: { _is_null: false }
            industry_list: { industry: { active: { _eq: true } } }
          }
          limit: $limit
          offset: $offset
          order_by: { id: asc }
        ) {
          id
          name
          apollo_id
          primary_industry
        }
        aa_s_organizations_aggregate(
          where: {
            apollo_id: { _is_null: false }
            industry_list: { industry: { active: { _eq: true } } }
          }
        ) {
          aggregate {
            count
          }
        }
      }
    `, { limit: pageLimit, offset: startOffset });

    const orgsToProcess = data?.aa_s_organizations || [];
    summary.totalMatchingOrgs = data?.aa_s_organizations_aggregate?.aggregate?.count ?? orgsToProcess.length;

    console.log(`\n🔍 Total Matching Organizations (Active Industry & Apollo ID): ${summary.totalMatchingOrgs}`);
    console.log(`📦 Fetched Batch Range: Offset ${startOffset} to ${startOffset + orgsToProcess.length} (Limit ${pageLimit})`);

    if (orgsToProcess.length === 0) {
      summary.errors.push(`No organizations found matching criteria (apollo_id != null & active industry) for offset ${startOffset}, limit ${pageLimit}.`);
    }

    for (const org of orgsToProcess) {
      if (!org.apollo_id) {
        summary.errors.push(`Organization "${org.name}" (ID ${org.id}) has no apollo_id. Skipped.`);
        continue;
      }

      summary.organizationsProcessed++;
      console.log(`\n▶ Processing Org [ID ${org.id}]: "${org.name}" (Apollo ID: ${org.apollo_id})`);

      try {
        // Step 1: Search Apollo People
        const rawCandidates = await searchApolloPeopleForOrg(String(org.apollo_id), {
          perPage,
          maxPages: maxSearchPages,
        });

        summary.peopleDiscovered += rawCandidates.length;
        console.log(`  Found ${rawCandidates.length} SHEQ candidate(s) in Apollo.`);

        // Step 2: Local Scoring & Database Upsert
        const { newCount, updatedCount, savedPeople } = await upsertDiscoveredPeople(
          org,
          rawCandidates,
          dryRun
        );

        summary.newPeopleSaved += newCount;
        summary.peopleUpdated += updatedCount;
        console.log(`  Upsert Results: ${newCount} new, ${updatedCount} updated.`);

        // Rank candidates
        const rankedCandidates = savedPeople.sort((a, b) => (b.score || 0) - (a.score || 0));
        const selectedCandidates = isFinite(parsedLimit) ? rankedCandidates.slice(0, parsedLimit) : rankedCandidates;
        summary.topDecisionMakersCount += selectedCandidates.length;

        // Step 3: Candidate Enrichment (if mode is discovery_and_enrichment or dry_run)
        if (mode === 'discovery_and_enrichment' || dryRun) {
          const enrichStats = await enrichTopCandidatesForOrg(
            org,
            selectedCandidates,
            maxEnrich,
            false,
            dryRun
          );

          summary.peopleEnriched += enrichStats.enrichedCount;
          summary.emailsFound += enrichStats.emailsFoundCount;
          summary.phonesFound += enrichStats.phonesFoundCount;
          console.log(`  Enrichment: ${enrichStats.enrichedCount} enriched (${enrichStats.emailsFoundCount} emails, ${enrichStats.phonesFoundCount} phones).`);
        }
      } catch (orgErr: any) {
        const errMsg = `Error processing organization "${org.name}" (ID ${org.id}): ${orgErr.message}`;
        console.error(`  ❌ ${errMsg}`);
        summary.errors.push(errMsg);
      }
    }
  } catch (err: any) {
    console.error("❌ Fatal Error executing Apollo script:", err);
    summary.errors.push(`Critical error: ${err.message}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n=================================================");
  console.log("📊 Apollo SHEQ Script Summary Report");
  console.log("=================================================");
  console.log(`⏱️ Execution Time:             ${duration}s`);
  console.log(`🎯 Total Matching Active Orgs:  ${summary.totalMatchingOrgs}`);
  console.log(`🏢 Organizations Processed:     ${summary.organizationsProcessed} (Offset ${startOffset}, Limit ${pageLimit})`);
  console.log(`👥 People Discovered:           ${summary.peopleDiscovered}`);
  console.log(`✨ New People Saved:            ${summary.newPeopleSaved}`);
  console.log(`🔄 People Updated:              ${summary.peopleUpdated}`);
  console.log(`🏆 Decision-Makers Selected:    ${summary.topDecisionMakersCount}`);
  console.log(`⚡ People Enriched:              ${summary.peopleEnriched}`);
  console.log(`📧 Emails Found:                 ${summary.emailsFound}`);
  console.log(`📞 Phones Found:                 ${summary.phonesFound}`);
  if (summary.errors.length > 0) {
    console.log(`⚠️ Errors / Warnings:           ${summary.errors.length}`);
    summary.errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }
  console.log("=================================================\n");
}

main();
