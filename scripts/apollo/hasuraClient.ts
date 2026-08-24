import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ENDPOINT_HASURA_GRAPHQL = process.env.ENDPOINT_HASURA_GRAPHQL || 'https://hasura.ticketsum.com/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || 'rhespo-g';

// ─── Hasura GraphQL Client ──────────────────────────────────────────────────
export async function queryHasura(queryOrMutation: string, variables: Record<string, any> = {}): Promise<any> {
  const res = await fetch(ENDPOINT_HASURA_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-access-key': HASURA_ADMIN_SECRET,
      'X-Hasura-Role': 'admin',
    },
    body: JSON.stringify({ query: queryOrMutation, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data;
}
