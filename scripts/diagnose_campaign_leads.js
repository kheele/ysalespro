import dotenv from 'dotenv';
dotenv.config();

const HASURA_URL = process.env.ENDPOINT_HASURA_GRAPHQL || 'https://hasura.ticketsum.com/v1/graphql';
const ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || 'rhespo-g';

async function diagnose() {
  const query = `
    query DiagnoseCampaignsAndLeads {
      aa_s_campaigns {
        id
        name
        status
        account_company_id
        target_industry_list {
          id
          industry_id
          industry {
            id
            name
          }
        }
      }
      aa_s_leads(limit: 10) {
        id
        account_company_id
        person_name
        company_name
        industry
        person {
          id
          name
          email
        }
      }
      aa_s_decision_makers(limit: 5) {
        id
        name
        email
        company_name
      }
    }
  `;

  try {
    const res = await fetch(HASURA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': ADMIN_SECRET,
      },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    console.log('DIAGNOSIS_DATA:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Diagnosis failed:', err);
  }
}

diagnose();
