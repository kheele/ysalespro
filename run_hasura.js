const endpoint = 'https://hasura.ticketsum.com/v1/query';
const secret = 'rhespo-g';

async function run() {
  const sql = `
    ALTER TABLE public.aa_s_billing_plans
    ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'ZA',
    ADD COLUMN IF NOT EXISTS country_name TEXT NOT NULL DEFAULT 'South Africa',
    ADD COLUMN IF NOT EXISTS currency_symbol TEXT NOT NULL DEFAULT 'R',
    ADD COLUMN IF NOT EXISTS interval TEXT NOT NULL DEFAULT 'month',
    ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paypal_plan_id TEXT;
  `;

  let res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': secret },
    body: JSON.stringify({
      type: 'run_sql',
      args: { source: 'automate_agents', sql, cascade: true }
    })
  });
  console.log('SQL:', await res.text());

  // Reload metadata so Hasura picks up the new columns
  res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': secret },
    body: JSON.stringify({
      type: 'pg_track_table',
      args: { source: 'automate_agents', table: 'aa_s_billing_plans' }
    })
  });
  const resText = await res.text();
  console.log('Track Table:', resText);
  if (resText.includes('already tracked')) {
    res = await fetch('https://hasura.ticketsum.com/v1/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': secret },
      body: JSON.stringify({
        type: 'reload_metadata',
        args: { reload_remote_schemas: true }
      })
    });
    console.log('Reload Metadata:', await res.text());
  }
}
run();
