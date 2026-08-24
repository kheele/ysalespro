'use server';

import { Subscription, BillingPlan, SouthernAfricanCountry } from '@/lib/types';
import { listGraphQL, getGraphQLOne, insertGraphQL } from '@/graphql';
import { getCustomClaimsByAuth } from '@/lib/auth-utils';
import { getAccountCompanyById, updateAccountCompany } from '@/services/private/accountCompanyService';

export type { SouthernAfricanCountry };

export const SOUTHERN_AFRICAN_COUNTRIES: SouthernAfricanCountry[] = [
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currency_symbol: 'R' },
  { code: 'LS', name: 'Lesotho', currency: 'LSL', currency_symbol: 'L' },
  { code: 'NA', name: 'Namibia', currency: 'NAD', currency_symbol: 'N$' },
  { code: 'SZ', name: 'Eswatini', currency: 'SZL', currency_symbol: 'E' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', currency_symbol: 'P' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', currency_symbol: '$' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', currency_symbol: 'K' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN', currency_symbol: 'MT' },
  { code: 'US', name: 'United States (Global)', currency: 'USD', currency_symbol: '$' },
];

// Country-Based Billing Plans for South Africa, Lesotho, Southern African countries & Global
export const DEFAULT_BILLING_PLANS: BillingPlan[] = [
  // --- South Africa (ZA) ---
  {
    id: 'starter_za',
    name: 'Starter',
    price: 0,
    currency: 'ZAR',
    currency_symbol: 'R',
    country_code: 'ZA',
    country_name: 'South Africa',
    interval: 'month',
    description: 'Essential CRM data enrichment and lead tracking for individual South African sales reps.',
    paypal_plan_id: 'P-STARTER-ZA',
    features: [
      'Up to 100 lead lookups / month',
      'Basic contact details & email status',
      'Standard outreach activity logs',
      'Community support',
    ],
  },
  {
    id: 'pro_za',
    name: 'Pro',
    price: 899,
    currency: 'ZAR',
    currency_symbol: 'R',
    country_code: 'ZA',
    country_name: 'South Africa',
    interval: 'month',
    description: 'Advanced AI messaging, lead scoring, and automated follow-ups tailored for growing SA teams.',
    paypal_plan_id: 'P-PRO-ZA',
    features: [
      'Up to 2,500 lead lookups / month',
      'AI email outreach suggestion engine',
      'Intent signal account detection',
      'Real-time team performance reporting',
      'Priority email & chat support',
    ],
  },
  {
    id: 'enterprise_za',
    name: 'Enterprise',
    price: 3499,
    currency: 'ZAR',
    currency_symbol: 'R',
    country_code: 'ZA',
    country_name: 'South Africa',
    interval: 'month',
    description: 'Full-scale revenue operations platform with dedicated local support & custom integrations.',
    paypal_plan_id: 'P-ENTERPRISE-ZA',
    features: [
      'Unlimited lead & decision maker lookups',
      'Custom AI sales prompt templates & GenKit integration',
      'Dedicated account manager & SLA governance',
      'Advanced role-based access control (RBAC)',
      'Custom webhook & API data exports',
    ],
  },

  // --- Lesotho (LS) ---
  {
    id: 'starter_ls',
    name: 'Starter',
    price: 0,
    currency: 'LSL',
    currency_symbol: 'L',
    country_code: 'LS',
    country_name: 'Lesotho',
    interval: 'month',
    description: 'Essential CRM data enrichment and lead tracking for sales teams in Lesotho.',
    paypal_plan_id: 'P-STARTER-LS',
    features: [
      'Up to 100 lead lookups / month',
      'Basic contact details & email status',
      'Standard outreach activity logs',
      'Community support',
    ],
  },
  {
    id: 'pro_ls',
    name: 'Pro',
    price: 899,
    currency: 'LSL',
    currency_symbol: 'L',
    country_code: 'LS',
    country_name: 'Lesotho',
    interval: 'month',
    description: 'Advanced AI messaging and automated follow-ups in Maloti (LSL) for Lesotho businesses.',
    paypal_plan_id: 'P-PRO-LS',
    features: [
      'Up to 2,500 lead lookups / month',
      'AI email outreach suggestion engine',
      'Intent signal account detection',
      'Real-time team performance reporting',
      'Priority email & chat support',
    ],
  },
  {
    id: 'enterprise_ls',
    name: 'Enterprise',
    price: 3499,
    currency: 'LSL',
    currency_symbol: 'L',
    country_code: 'LS',
    country_name: 'Lesotho',
    interval: 'month',
    description: 'Enterprise revenue operations platform with custom integrations for Lesotho organizations.',
    paypal_plan_id: 'P-ENTERPRISE-LS',
    features: [
      'Unlimited lead & decision maker lookups',
      'Custom AI sales prompt templates & GenKit integration',
      'Dedicated account manager & SLA governance',
      'Advanced role-based access control (RBAC)',
      'Custom webhook & API data exports',
    ],
  },

  // --- Namibia (NA) ---
  {
    id: 'starter_na',
    name: 'Starter',
    price: 0,
    currency: 'NAD',
    currency_symbol: 'N$',
    country_code: 'NA',
    country_name: 'Namibia',
    interval: 'month',
    description: 'Essential CRM data enrichment for Namibian sales reps.',
    paypal_plan_id: 'P-STARTER-NA',
    features: ['Up to 100 lead lookups / month', 'Basic contact details', 'Community support'],
  },
  {
    id: 'pro_na',
    name: 'Pro',
    price: 899,
    currency: 'NAD',
    currency_symbol: 'N$',
    country_code: 'NA',
    country_name: 'Namibia',
    interval: 'month',
    description: 'Growth AI outreach and lead management in Namibian Dollars (N$).',
    paypal_plan_id: 'P-PRO-NA',
    features: ['Up to 2,500 lead lookups / month', 'AI email outreach engine', 'Priority support'],
  },
  {
    id: 'enterprise_na',
    name: 'Enterprise',
    price: 3499,
    currency: 'NAD',
    currency_symbol: 'N$',
    country_code: 'NA',
    country_name: 'Namibia',
    interval: 'month',
    description: 'Enterprise revenue platform for Namibian businesses.',
    paypal_plan_id: 'P-ENTERPRISE-NA',
    features: ['Unlimited lead lookups', 'Custom AI prompts', 'Dedicated SLA'],
  },

  // --- Eswatini (SZ) ---
  {
    id: 'starter_sz',
    name: 'Starter',
    price: 0,
    currency: 'SZL',
    currency_symbol: 'E',
    country_code: 'SZ',
    country_name: 'Eswatini',
    interval: 'month',
    description: 'Free starter tier for Eswatini sales representatives.',
    paypal_plan_id: 'P-STARTER-SZ',
    features: ['Up to 100 lead lookups / month', 'Basic contact details', 'Community support'],
  },
  {
    id: 'pro_sz',
    name: 'Pro',
    price: 899,
    currency: 'SZL',
    currency_symbol: 'E',
    country_code: 'SZ',
    country_name: 'Eswatini',
    interval: 'month',
    description: 'AI sales automation and enrichment priced in Lilangeni (E).',
    paypal_plan_id: 'P-PRO-SZ',
    features: ['Up to 2,500 lead lookups / month', 'AI email outreach engine', 'Priority support'],
  },
  {
    id: 'enterprise_sz',
    name: 'Enterprise',
    price: 3499,
    currency: 'SZL',
    currency_symbol: 'E',
    country_code: 'SZ',
    country_name: 'Eswatini',
    interval: 'month',
    description: 'Full-suite sales intelligence for organizations in Eswatini.',
    paypal_plan_id: 'P-ENTERPRISE-SZ',
    features: ['Unlimited lead lookups', 'Custom AI prompts', 'Dedicated SLA'],
  },

  // --- Botswana (BW) ---
  {
    id: 'starter_bw',
    name: 'Starter',
    price: 0,
    currency: 'BWP',
    currency_symbol: 'P',
    country_code: 'BW',
    country_name: 'Botswana',
    interval: 'month',
    description: 'Free CRM data enrichment for Botswana sales reps.',
    paypal_plan_id: 'P-STARTER-BW',
    features: ['Up to 100 lead lookups / month', 'Basic contact details', 'Community support'],
  },
  {
    id: 'pro_bw',
    name: 'Pro',
    price: 650,
    currency: 'BWP',
    currency_symbol: 'P',
    country_code: 'BW',
    country_name: 'Botswana',
    interval: 'month',
    description: 'AI sales acceleration in Botswana Pula (P).',
    paypal_plan_id: 'P-PRO-BW',
    features: ['Up to 2,500 lead lookups / month', 'AI email outreach engine', 'Priority support'],
  },
  {
    id: 'enterprise_bw',
    name: 'Enterprise',
    price: 2500,
    currency: 'BWP',
    currency_symbol: 'P',
    country_code: 'BW',
    country_name: 'Botswana',
    interval: 'month',
    description: 'Enterprise revenue operations platform for Botswana businesses.',
    paypal_plan_id: 'P-ENTERPRISE-BW',
    features: ['Unlimited lead lookups', 'Custom AI prompts', 'Dedicated SLA'],
  },

  // --- Global / Default (US & Others) ---
  {
    id: 'starter_us',
    name: 'Starter',
    price: 0,
    currency: 'USD',
    currency_symbol: '$',
    country_code: 'US',
    country_name: 'United States (Global)',
    interval: 'month',
    description: 'Essential CRM data enrichment and lead tracking for global reps.',
    paypal_plan_id: 'P-STARTER-FREE',
    features: [
      'Up to 100 lead lookups / month',
      'Basic contact details & email status',
      'Standard outreach activity logs',
      'Community support',
    ],
  },
  {
    id: 'pro_us',
    name: 'Pro',
    price: 49,
    currency: 'USD',
    currency_symbol: '$',
    country_code: 'US',
    country_name: 'United States (Global)',
    interval: 'month',
    description: 'Advanced AI messaging, lead scoring, and automated follow-ups for growing teams.',
    paypal_plan_id: 'P-PRO-GROWTH',
    features: [
      'Up to 2,500 lead lookups / month',
      'AI email outreach suggestion engine',
      'Intent signal account detection',
      'Real-time team performance reporting',
      'Priority email & chat support',
    ],
  },
  {
    id: 'enterprise_us',
    name: 'Enterprise',
    price: 199,
    currency: 'USD',
    currency_symbol: '$',
    country_code: 'US',
    country_name: 'United States (Global)',
    interval: 'month',
    description: 'Full-scale revenue operations platform with custom integrations and dedicated support.',
    paypal_plan_id: 'P-ENTERPRISE-UNLIMITED',
    features: [
      'Unlimited lead & decision maker lookups',
      'Custom AI sales prompt templates & GenKit integration',
      'Dedicated account manager & SLA governance',
      'Advanced role-based access control (RBAC)',
      'Custom webhook & API data exports',
    ],
  },
];

const BILLING_PLAN_FIELDS = `
  id
  name
  price
  currency
  currency_symbol
  country_code
  country_name
  interval
  description
  paypal_plan_id
  features
  active
  created_at
  updated_at
`;

function mapDbBillingPlan(p: any): BillingPlan | null {
  if (!p) return null;
  return {
    id: String(p.id),
    name: p.name || 'Plan',
    price: typeof p.price === 'number' ? p.price : Number(p.price || 0),
    currency: p.currency || 'USD',
    currency_symbol: p.currency_symbol || (p.currency === 'ZAR' ? 'R' : p.currency === 'LSL' ? 'L' : '$'),
    country_code: p.country_code || 'US',
    country_name: p.country_name || 'United States',
    interval: p.interval || 'month',
    description: p.description || '',
    paypal_plan_id: p.paypal_plan_id || '',
    features: Array.isArray(p.features) ? p.features : typeof p.features === 'string' ? JSON.parse(p.features) : [],
  };
}

/**
 * Seeds country-based billing plans into Hasura database `aa_s_billing_plans` table.
 */
export async function seedBillingPlans(): Promise<boolean> {
  try {
    const mutation = `
      mutation SeedBillingPlans($objects: [aa_s_billing_plans_insert_input!]!) {
        insert_aa_s_billing_plans(
          objects: $objects,
          on_conflict: {
            constraint: aa_s_billing_plans_pkey,
            update_columns: [name, price, currency, currency_symbol, country_code, country_name, interval, description, paypal_plan_id, features]
          }
        ) {
          affected_rows
        }
      }
    `;

    const objects = DEFAULT_BILLING_PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency || 'USD',
      currency_symbol: plan.currency_symbol || '$',
      country_code: plan.country_code || 'US',
      country_name: plan.country_name || 'United States',
      interval: plan.interval || 'month',
      description: plan.description,
      paypal_plan_id: plan.paypal_plan_id,
      features: plan.features,
    }));

    const res = await insertGraphQL({
      mutation,
      operationName: 'SeedBillingPlans',
      input: { objects },
    });

    return !!res;
  } catch (error) {
    console.warn('seedBillingPlans notice (using fallback if table not yet created):', error);
    return false;
  }
}

/**
 * Retrieves country-specific billing plans from the database (falling back to South Africa or Global defaults).
 */
export async function getBillingPlansByCountryAction(countryCode: string = 'ZA'): Promise<BillingPlan[]> {
  const targetCode = (countryCode || 'ZA').toUpperCase();
  try {
    const query = `
      query GetBillingPlansByCountry($countryCode: String!) {
        aa_s_billing_plans(
          where: { country_code: { _eq: $countryCode } },
          order_by: [{ price: asc }]
        ) {
          ${BILLING_PLAN_FIELDS}
        }
      }
    `;

    const res = await listGraphQL({
      query,
      variables: { countryCode: targetCode },
      operationName: 'GetBillingPlansByCountry',
    });

    const list = Array.isArray(res) ? res : [];
    if (list.length > 0) {
      return list.map(mapDbBillingPlan).filter(Boolean) as BillingPlan[];
    }
  } catch (err) {
    console.warn(`Unable to fetch billing plans for country ${targetCode} from DB, utilizing default country plans:`, err);
  }

  // Filter default in-memory plans by country code
  const filtered = DEFAULT_BILLING_PLANS.filter((p) => p.country_code === targetCode);
  if (filtered.length > 0) {
    return filtered;
  }

  // Fall back to South Africa ('ZA') or Global ('US')
  const zaPlans = DEFAULT_BILLING_PLANS.filter((p) => p.country_code === 'ZA');
  return zaPlans.length > 0 ? zaPlans : DEFAULT_BILLING_PLANS.filter((p) => p.country_code === 'US');
}

/**
 * Retrieves active billing plans (defaulting to South Africa ZA).
 */
export async function getActiveBillingPlansAction(countryCode: string = 'ZA'): Promise<BillingPlan[]> {
  return getBillingPlansByCountryAction(countryCode);
}

/**
 * Retrieves details for a specific billing plan by ID.
 */
export async function getBillingPlanByIdAction(planId: string): Promise<BillingPlan | null> {
  try {
    const query = `
      query GetBillingPlanById($id: String!) {
        aa_s_billing_plans_by_pk(id: $id) {
          ${BILLING_PLAN_FIELDS}
        }
      }
    `;

    const res = await getGraphQLOne({
      query,
      operationName: 'GetBillingPlanById',
      variables: { id: planId },
    });

    if (res) {
      return mapDbBillingPlan(res);
    }
  } catch (err) {
    console.warn('Unable to query billing plan by ID from DB, checking default plans:', err);
  }

  const plans = DEFAULT_BILLING_PLANS;
  return plans.find((p) => p.id === planId || p.paypal_plan_id === planId) || null;
}

/**
 * Retrieves subscription details for a given organization / account_company_id.
 */
export async function getSubscriptionByOrganizationIdAction(orgId: string | number): Promise<Subscription | null> {
  try {
    const numId = Number(orgId);
    if (isNaN(numId)) return null;

    const company = await getAccountCompanyById(numId);
    if (!company) return null;

    const planTier = company.subscription_tier || 'Pro';
    const plans = await getActiveBillingPlansAction('ZA');
    const plan = plans.find(
      (p) => p.name.toLowerCase() === planTier.toLowerCase()
    ) || plans[1] || DEFAULT_BILLING_PLANS[1];

    return {
      id: `sub_${company.id}`,
      organization_id: String(company.id),
      plan_id: plan.id,
      status: 'active',
      plan: {
        name: plan.name,
      },
    };
  } catch (error) {
    console.error('getSubscriptionByOrganizationIdAction error:', error);
    return null;
  }
}

/**
 * Server action to initiate or register a PayPal subscription.
 */
export async function createPayPalSubscriptionActionByToken(
  token: string,
  planId: string
): Promise<{ subscriptionID: string }> {
  const { user, error } = await getCustomClaimsByAuth(token);
  if (error || !user) {
    throw new Error('Not authenticated');
  }

  const plan = await getBillingPlanByIdAction(planId);
  const paypalPlanId = plan?.paypal_plan_id || planId || 'P-PRO-ZA';

  // Generate subscription ID reference for PayPal subscription workflow
  const timestamp = Date.now();
  const subscriptionID = `SUB-${paypalPlanId}-${user.id}-${timestamp}`;

  return { subscriptionID };
}

/**
 * Server action called after PayPal subscription approval to update user's account_company subscription tier in DB.
 */
export async function handlePayPalSubscriptionSuccessActionByToken(
  token: string,
  subscriptionId: string,
  planId: string
): Promise<{ success: boolean }> {
  const { user, account_company_id, error } = await getCustomClaimsByAuth(token);
  if (error || !user) {
    throw new Error('Not authenticated');
  }

  const plan = await getBillingPlanByIdAction(planId);
  const newTier = plan ? plan.name : 'Pro';

  const companyId = account_company_id || user.account_company_id;
  if (!companyId) {
    throw new Error('Unauthorized: No account company associated with this user');
  }

  await updateAccountCompany(companyId, {
    subscription_tier: newTier,
  });

  return { success: true };
}
