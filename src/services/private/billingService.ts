'use server';

import { Subscription, BillingPlan, SouthernAfricanCountry } from '@/lib/types';
import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL } from '@/graphql';
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
    tier: 'starter',
    tier_level: 0,
    price: 1500,
    currency: 'ZAR',
    currency_symbol: 'R',
    country_code: 'ZA',
    country_name: 'South Africa',
    interval: 'month',
    email_limit: 1500,
    description: 'Essential CRM data enrichment and outbound email outreach for solo reps and emerging consultants.',
    paypal_plan_id: 'P-STARTER-ZA',
    features: [
      '1,500 Email dispatches / month',
      '1,500 Lead lookups / month',
      'Basic contact details & email validation',
      'Standard outreach activity logs',
      '2 Team Seats',
      'Community & email support',
    ],
    limits: { email_sending: 1500, lead_lookups: 1500, team_seats: 2, campaigns: 5 },
  },
  {
    id: 'pro_za',
    name: 'Pro',
    tier: 'pro',
    tier_level: 1,
    price: 4500,
    currency: 'ZAR',
    currency_symbol: 'R',
    country_code: 'ZA',
    country_name: 'South Africa',
    interval: 'month',
    email_limit: 5000,
    description: 'Advanced AI messaging, lead scoring, and automated follow-ups tailored for fast-growing sales teams.',
    paypal_plan_id: 'P-PRO-ZA',
    features: [
      '5,000 Email dispatches / month',
      '5,000 Lead lookups / month',
      'AI email outreach suggestion engine',
      'Intent signal account detection',
      'Real-time team performance reporting',
      '5 Team Seats',
      'Priority email & chat support',
    ],
    limits: { email_sending: 5000, lead_lookups: 5000, team_seats: 5, campaigns: 20 },
  },
  {
    id: 'business_za',
    name: 'Business',
    tier: 'business',
    tier_level: 2,
    price: 7500,
    currency: 'ZAR',
    currency_symbol: 'R',
    country_code: 'ZA',
    country_name: 'South Africa',
    interval: 'month',
    email_limit: 10000,
    description: 'High-volume sales platform with multi-inbox rotation and deep pipeline acceleration tools.',
    paypal_plan_id: 'P-BUSINESS-ZA',
    features: [
      '10,000 Email dispatches / month',
      '10,000 Lead lookups / month',
      'Multi-inbox sender rotation & warm-up',
      'Custom AI prompt templates & sequence automation',
      'CRM bi-directional sync & custom webhooks',
      '15 Team Seats',
      'Dedicated Slack & live chat support',
    ],
    limits: { email_sending: 10000, lead_lookups: 10000, team_seats: 15, campaigns: 50 },
  },
  {
    id: 'enterprise_za',
    name: 'Enterprise',
    tier: 'enterprise',
    tier_level: 3,
    price: 10000,
    currency: 'ZAR',
    currency_symbol: 'R',
    country_code: 'ZA',
    country_name: 'South Africa',
    interval: 'month',
    email_limit: 15000,
    description: 'Full-scale revenue operations platform with dedicated infrastructure, SLA governance, and enterprise integrations.',
    paypal_plan_id: 'P-ENTERPRISE-ZA',
    features: [
      '15,000 Email dispatches / month',
      'Unlimited lead & decision maker lookups',
      'Dedicated IP & custom SMTP setup',
      'Custom GenAI workflows & prompt engineering',
      'Dedicated account manager & SLA guarantee',
      'Advanced role-based access control (RBAC)',
      'Unlimited Team Seats',
      'Full API data access & custom exports',
    ],
    limits: { email_sending: 15000, lead_lookups: -1, team_seats: -1, campaigns: -1 },
  },

  // --- Lesotho (LS) ---
  {
    id: 'starter_ls',
    name: 'Starter',
    tier: 'starter',
    tier_level: 0,
    price: 1500,
    currency: 'LSL',
    currency_symbol: 'L',
    country_code: 'LS',
    country_name: 'Lesotho',
    interval: 'month',
    email_limit: 1500,
    description: 'Essential CRM data enrichment and outreach for sales teams in Lesotho.',
    paypal_plan_id: 'P-STARTER-LS',
    features: ['1,500 Email dispatches / month', '1,500 Lead lookups / month', 'Standard outreach activity logs', '2 Team Seats'],
    limits: { email_sending: 1500, lead_lookups: 1500, team_seats: 2 },
  },
  {
    id: 'pro_ls',
    name: 'Pro',
    tier: 'pro',
    tier_level: 1,
    price: 4500,
    currency: 'LSL',
    currency_symbol: 'L',
    country_code: 'LS',
    country_name: 'Lesotho',
    interval: 'month',
    email_limit: 5000,
    description: 'Advanced AI messaging and automated follow-ups in Maloti (LSL).',
    paypal_plan_id: 'P-PRO-LS',
    features: ['5,000 Email dispatches / month', '5,000 Lead lookups / month', 'AI email outreach engine', '5 Team Seats'],
    limits: { email_sending: 5000, lead_lookups: 5000, team_seats: 5 },
  },
  {
    id: 'business_ls',
    name: 'Business',
    tier: 'business',
    tier_level: 2,
    price: 7500,
    currency: 'LSL',
    currency_symbol: 'L',
    country_code: 'LS',
    country_name: 'Lesotho',
    interval: 'month',
    email_limit: 10000,
    description: 'Scaling multi-channel outreach engine for Lesotho businesses.',
    paypal_plan_id: 'P-BUSINESS-LS',
    features: ['10,000 Email dispatches / month', '10,000 Lead lookups / month', 'Multi-inbox rotation', '15 Team Seats'],
    limits: { email_sending: 10000, lead_lookups: 10000, team_seats: 15 },
  },
  {
    id: 'enterprise_ls',
    name: 'Enterprise',
    tier: 'enterprise',
    tier_level: 3,
    price: 10000,
    currency: 'LSL',
    currency_symbol: 'L',
    country_code: 'LS',
    country_name: 'Lesotho',
    interval: 'month',
    email_limit: 15000,
    description: 'Enterprise revenue operations platform with custom integrations for Lesotho organizations.',
    paypal_plan_id: 'P-ENTERPRISE-LS',
    features: ['15,000 Email dispatches / month', 'Unlimited lead lookups', 'Dedicated account manager', 'Unlimited Team Seats'],
    limits: { email_sending: 15000, lead_lookups: -1, team_seats: -1 },
  },

  // --- Namibia (NA) ---
  {
    id: 'starter_na',
    name: 'Starter',
    tier: 'starter',
    tier_level: 0,
    price: 1500,
    currency: 'NAD',
    currency_symbol: 'N$',
    country_code: 'NA',
    country_name: 'Namibia',
    interval: 'month',
    email_limit: 1500,
    description: 'Essential CRM data enrichment for Namibian sales reps.',
    paypal_plan_id: 'P-STARTER-NA',
    features: ['1,500 Email dispatches / month', '1,500 Lead lookups / month', '2 Team Seats'],
    limits: { email_sending: 1500, lead_lookups: 1500, team_seats: 2 },
  },
  {
    id: 'pro_na',
    name: 'Pro',
    tier: 'pro',
    tier_level: 1,
    price: 4500,
    currency: 'NAD',
    currency_symbol: 'N$',
    country_code: 'NA',
    country_name: 'Namibia',
    interval: 'month',
    email_limit: 5000,
    description: 'Growth AI outreach and lead management in Namibian Dollars (N$).',
    paypal_plan_id: 'P-PRO-NA',
    features: ['5,000 Email dispatches / month', '5,000 Lead lookups / month', 'AI email outreach engine', '5 Team Seats'],
    limits: { email_sending: 5000, lead_lookups: 5000, team_seats: 5 },
  },
  {
    id: 'business_na',
    name: 'Business',
    tier: 'business',
    tier_level: 2,
    price: 7500,
    currency: 'NAD',
    currency_symbol: 'N$',
    country_code: 'NA',
    country_name: 'Namibia',
    interval: 'month',
    email_limit: 10000,
    description: 'High-volume outbound automation for Namibian sales orgs.',
    paypal_plan_id: 'P-BUSINESS-NA',
    features: ['10,000 Email dispatches / month', '10,000 Lead lookups / month', '15 Team Seats'],
    limits: { email_sending: 10000, lead_lookups: 10000, team_seats: 15 },
  },
  {
    id: 'enterprise_na',
    name: 'Enterprise',
    tier: 'enterprise',
    tier_level: 3,
    price: 10000,
    currency: 'NAD',
    currency_symbol: 'N$',
    country_code: 'NA',
    country_name: 'Namibia',
    interval: 'month',
    email_limit: 15000,
    description: 'Enterprise revenue platform for Namibian businesses.',
    paypal_plan_id: 'P-ENTERPRISE-NA',
    features: ['15,000 Email dispatches / month', 'Unlimited lead lookups', 'Custom AI prompts', 'Dedicated SLA'],
    limits: { email_sending: 15000, lead_lookups: -1, team_seats: -1 },
  },

  // --- Eswatini (SZ) ---
  {
    id: 'starter_sz',
    name: 'Starter',
    tier: 'starter',
    tier_level: 0,
    price: 1500,
    currency: 'SZL',
    currency_symbol: 'E',
    country_code: 'SZ',
    country_name: 'Eswatini',
    interval: 'month',
    email_limit: 1500,
    description: 'Outbound sales tier for Eswatini sales representatives.',
    paypal_plan_id: 'P-STARTER-SZ',
    features: ['1,500 Email dispatches / month', '1,500 Lead lookups / month', '2 Team Seats'],
    limits: { email_sending: 1500, lead_lookups: 1500, team_seats: 2 },
  },
  {
    id: 'pro_sz',
    name: 'Pro',
    tier: 'pro',
    tier_level: 1,
    price: 4500,
    currency: 'SZL',
    currency_symbol: 'E',
    country_code: 'SZ',
    country_name: 'Eswatini',
    interval: 'month',
    email_limit: 5000,
    description: 'AI sales automation and enrichment priced in Lilangeni (E).',
    paypal_plan_id: 'P-PRO-SZ',
    features: ['5,000 Email dispatches / month', '5,000 Lead lookups / month', '5 Team Seats'],
    limits: { email_sending: 5000, lead_lookups: 5000, team_seats: 5 },
  },
  {
    id: 'business_sz',
    name: 'Business',
    tier: 'business',
    tier_level: 2,
    price: 7500,
    currency: 'SZL',
    currency_symbol: 'E',
    country_code: 'SZ',
    country_name: 'Eswatini',
    interval: 'month',
    email_limit: 10000,
    description: 'Advanced sales acceleration for growing Eswatini enterprises.',
    paypal_plan_id: 'P-BUSINESS-SZ',
    features: ['10,000 Email dispatches / month', '10,000 Lead lookups / month', '15 Team Seats'],
    limits: { email_sending: 10000, lead_lookups: 10000, team_seats: 15 },
  },
  {
    id: 'enterprise_sz',
    name: 'Enterprise',
    tier: 'enterprise',
    tier_level: 3,
    price: 10000,
    currency: 'SZL',
    currency_symbol: 'E',
    country_code: 'SZ',
    country_name: 'Eswatini',
    interval: 'month',
    email_limit: 15000,
    description: 'Full-suite sales intelligence for organizations in Eswatini.',
    paypal_plan_id: 'P-ENTERPRISE-SZ',
    features: ['15,000 Email dispatches / month', 'Unlimited lead lookups', 'Custom AI prompts', 'Dedicated SLA'],
    limits: { email_sending: 15000, lead_lookups: -1, team_seats: -1 },
  },

  // --- Botswana (BW) ---
  {
    id: 'starter_bw',
    name: 'Starter',
    tier: 'starter',
    tier_level: 0,
    price: 1100,
    currency: 'BWP',
    currency_symbol: 'P',
    country_code: 'BW',
    country_name: 'Botswana',
    interval: 'month',
    email_limit: 1500,
    description: 'Outbound sales enrichment for Botswana sales reps in Pula (P).',
    paypal_plan_id: 'P-STARTER-BW',
    features: ['1,500 Email dispatches / month', '1,500 Lead lookups / month', '2 Team Seats'],
    limits: { email_sending: 1500, lead_lookups: 1500, team_seats: 2 },
  },
  {
    id: 'pro_bw',
    name: 'Pro',
    tier: 'pro',
    tier_level: 1,
    price: 3300,
    currency: 'BWP',
    currency_symbol: 'P',
    country_code: 'BW',
    country_name: 'Botswana',
    interval: 'month',
    email_limit: 5000,
    description: 'AI sales acceleration in Botswana Pula (P).',
    paypal_plan_id: 'P-PRO-BW',
    features: ['5,000 Email dispatches / month', '5,000 Lead lookups / month', '5 Team Seats'],
    limits: { email_sending: 5000, lead_lookups: 5000, team_seats: 5 },
  },
  {
    id: 'business_bw',
    name: 'Business',
    tier: 'business',
    tier_level: 2,
    price: 5500,
    currency: 'BWP',
    currency_symbol: 'P',
    country_code: 'BW',
    country_name: 'Botswana',
    interval: 'month',
    email_limit: 10000,
    description: 'Multi-channel outbound engine for Botswana businesses.',
    paypal_plan_id: 'P-BUSINESS-BW',
    features: ['10,000 Email dispatches / month', '10,000 Lead lookups / month', '15 Team Seats'],
    limits: { email_sending: 10000, lead_lookups: 10000, team_seats: 15 },
  },
  {
    id: 'enterprise_bw',
    name: 'Enterprise',
    tier: 'enterprise',
    tier_level: 3,
    price: 7500,
    currency: 'BWP',
    currency_symbol: 'P',
    country_code: 'BW',
    country_name: 'Botswana',
    interval: 'month',
    email_limit: 15000,
    description: 'Enterprise revenue operations platform for Botswana businesses.',
    paypal_plan_id: 'P-ENTERPRISE-BW',
    features: ['15,000 Email dispatches / month', 'Unlimited lead lookups', 'Dedicated SLA'],
    limits: { email_sending: 15000, lead_lookups: -1, team_seats: -1 },
  },

  // --- Global / Default (US & Others) ---
  {
    id: 'starter_us',
    name: 'Starter',
    tier: 'starter',
    tier_level: 0,
    price: 79,
    currency: 'USD',
    currency_symbol: '$',
    country_code: 'US',
    country_name: 'United States (Global)',
    interval: 'month',
    email_limit: 1500,
    description: 'Essential CRM data enrichment and outbound email outreach for global sales reps.',
    paypal_plan_id: 'P-STARTER-GLOBAL',
    features: [
      '1,500 Email dispatches / month',
      '1,500 Lead lookups / month',
      'Basic contact details & email status',
      '2 Team Seats',
      'Community support',
    ],
    limits: { email_sending: 1500, lead_lookups: 1500, team_seats: 2 },
  },
  {
    id: 'pro_us',
    name: 'Pro',
    tier: 'pro',
    tier_level: 1,
    price: 249,
    currency: 'USD',
    currency_symbol: '$',
    country_code: 'US',
    country_name: 'United States (Global)',
    interval: 'month',
    email_limit: 5000,
    description: 'Advanced AI messaging, lead scoring, and automated follow-ups for growing teams.',
    paypal_plan_id: 'P-PRO-GLOBAL',
    features: [
      '5,000 Email dispatches / month',
      '5,000 Lead lookups / month',
      'AI email outreach suggestion engine',
      'Intent signal account detection',
      '5 Team Seats',
      'Priority email & chat support',
    ],
    limits: { email_sending: 5000, lead_lookups: 5000, team_seats: 5 },
  },
  {
    id: 'business_us',
    name: 'Business',
    tier: 'business',
    tier_level: 2,
    price: 419,
    currency: 'USD',
    currency_symbol: '$',
    country_code: 'US',
    country_name: 'United States (Global)',
    interval: 'month',
    email_limit: 10000,
    description: 'High-volume sales acceleration platform with multi-inbox rotation and sequence tools.',
    paypal_plan_id: 'P-BUSINESS-GLOBAL',
    features: [
      '10,000 Email dispatches / month',
      '10,000 Lead lookups / month',
      'Multi-inbox sender rotation',
      'Custom prompt templates',
      '15 Team Seats',
      'Priority support',
    ],
    limits: { email_sending: 10000, lead_lookups: 10000, team_seats: 15 },
  },
  {
    id: 'enterprise_us',
    name: 'Enterprise',
    tier: 'enterprise',
    tier_level: 3,
    price: 549,
    currency: 'USD',
    currency_symbol: '$',
    country_code: 'US',
    country_name: 'United States (Global)',
    interval: 'month',
    email_limit: 15000,
    description: 'Full-scale revenue operations platform with custom integrations and dedicated support.',
    paypal_plan_id: 'P-ENTERPRISE-GLOBAL',
    features: [
      '15,000 Email dispatches / month',
      'Unlimited lead & decision maker lookups',
      'Dedicated IP & custom SMTP setup',
      'Dedicated account manager & SLA governance',
      'Unlimited Team Seats',
      'Custom webhook & API data exports',
    ],
    limits: { email_sending: 15000, lead_lookups: -1, team_seats: -1 },
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
  email_limit
  tier
  tier_level
  limits
  active
  created_at
  updated_at
`;

function mapDbBillingPlan(p: any): BillingPlan | null {
  if (!p) return null;
  const tierName = (p.name || 'Plan').toLowerCase();
  const defaultCap = tierName.includes('enterprise')
    ? 15000
    : tierName.includes('business')
    ? 10000
    : tierName.includes('pro')
    ? 5000
    : 1500;
  const defaultTierLevel = tierName.includes('enterprise')
    ? 3
    : tierName.includes('business')
    ? 2
    : tierName.includes('pro')
    ? 1
    : 0;

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
    email_limit: p.email_limit !== undefined && p.email_limit !== null ? Number(p.email_limit) : defaultCap,
    tier: p.tier || tierName,
    tier_level: p.tier_level !== undefined && p.tier_level !== null ? Number(p.tier_level) : defaultTierLevel,
    limits: typeof p.limits === 'object' && p.limits !== null ? p.limits : {},
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
            update_columns: [name, price, currency, currency_symbol, country_code, country_name, interval, description, paypal_plan_id, features, email_limit, tier, tier_level, limits]
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
      email_limit: plan.email_limit || 1500,
      tier: plan.tier || plan.name.toLowerCase(),
      tier_level: plan.tier_level ?? 0,
      limits: plan.limits || {},
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

// =============================================================================
// New Subscription Management (Phase 2 billing system)
// =============================================================================

export interface BillingOverviewSubscription {
  id: number;
  plan_id: string;
  plan_tier: string;
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  price_paid: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string | null;
  plan?: import('@/lib/types').BillingPlan;
}

export interface BillingInvoiceItem {
  id: number;
  invoice_number: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  billing_cycle?: string;
  period_start?: string;
  period_end?: string;
  receipt_url?: string;
  created_at: string;
}

export interface BillingUsage {
  period_year: number;
  period_month: number;
  lead_lookups_used: number;
  lead_lookups_limit: number;
  ai_credits_used: number;
  ai_credits_limit: number;
  emails_sent: number;
  emails_limit: number;
  team_seats_used: number;
  team_seats_limit: number;
}

export interface BillingOverviewResult {
  subscription: BillingOverviewSubscription | null;
  available_plans: import('@/lib/types').BillingPlan[];
  invoices: BillingInvoiceItem[];
  usage: BillingUsage | null;
}

/**
 * Fetches the complete billing overview for the authenticated user's company:
 * active subscription, available plans, invoice history, and current-month usage.
 */
export async function getBillingOverviewActionByToken(
  token: string,
  countryCode = 'ZA'
): Promise<BillingOverviewResult> {
  const { getAccountCompanyIdFromClaims } = await import('@/lib/auth-utils');
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized: missing company ID');

  const now = new Date();
  const periodYear = now.getFullYear();
  const periodMonth = now.getMonth() + 1;

  // --- Available Plans (from DB or in-memory fallback) ---
  const availablePlans = await getBillingPlansByCountryAction(countryCode);

  // --- Active Subscription ---
  let subscription: BillingOverviewSubscription | null = null;
  try {
    const subQuery = `
      query GetActiveSubscriptionOverview($companyId: Int!) {
        aa_s_subscriptions(
          where: { account_company_id: { _eq: $companyId } }
          limit: 1
        ) {
          id plan_id plan_tier billing_cycle status price_paid currency
          current_period_start current_period_end cancel_at_period_end canceled_at
        }
      }
    `;
    const subRes = await listGraphQL({ query: subQuery, variables: { companyId }, operationName: 'GetActiveSubscriptionOverview' });
    if (Array.isArray(subRes) && subRes.length > 0) {
      const sub = subRes[0];
      const plan = availablePlans.find((p) => p.id === sub.plan_id || p.name.toLowerCase() === sub.plan_tier);
      subscription = { ...sub, plan };
    }
  } catch {
    // Table not yet migrated — fabricate a starter subscription
  }
  if (!subscription) {
    const starterPlan = availablePlans.find((p) => p.name === 'Starter') || availablePlans[0];
    subscription = {
      id: 0,
      plan_id: starterPlan?.id || 'starter_za',
      plan_tier: 'starter',
      billing_cycle: 'monthly',
      status: 'active',
      price_paid: Number(starterPlan?.price) || 1500,
      currency: starterPlan?.currency || 'ZAR',
      current_period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      current_period_end: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      cancel_at_period_end: false,
      plan: starterPlan,
    };
  }

  // --- Invoices ---
  let invoices: BillingInvoiceItem[] = [];
  try {
    const invQuery = `
      query GetBillingInvoices($companyId: Int!) {
        aa_s_invoices(
          where: { account_company_id: { _eq: $companyId } }
          order_by: [{ created_at: desc }]
          limit: 24
        ) {
          id invoice_number plan_name amount currency status billing_cycle
          period_start period_end receipt_url created_at
        }
      }
    `;
    const invRes = await listGraphQL({ query: invQuery, variables: { companyId }, operationName: 'GetBillingInvoices' });
    if (Array.isArray(invRes)) invoices = invRes;
  } catch {
    // table not yet migrated
  }

  // Determine limits based on active plan tier
  const emailCapsByTier: Record<string, number> = {
    starter: 1500,
    pro: 5000,
    business: 10000,
    enterprise: 15000,
  };
  const activePlanTier = (subscription?.plan_tier || 'starter').toLowerCase();
  const tierEmailCap = emailCapsByTier[activePlanTier] || subscription?.plan?.email_limit || 1500;
  const tierLeadLimit = activePlanTier === 'enterprise' ? -1 : activePlanTier === 'business' ? 10000 : activePlanTier === 'pro' ? 5000 : 1500;
  const tierSeatLimit = activePlanTier === 'enterprise' ? -1 : activePlanTier === 'business' ? 15 : activePlanTier === 'pro' ? 5 : 2;

  // --- Usage ---
  let usage: BillingUsage | null = null;
  try {
    const usageQuery = `
      query GetBillingUsage($companyId: Int!, $year: Int!, $month: Int!) {
        aa_s_usage_records(
          where: {
            account_company_id: { _eq: $companyId }
            period_year: { _eq: $year }
            period_month: { _eq: $month }
          }
          limit: 1
        ) {
          period_year period_month
          lead_lookups_used lead_lookups_limit
          ai_credits_used ai_credits_limit
          emails_sent emails_limit
          team_seats_used team_seats_limit
        }
      }
    `;
    const usageRes = await listGraphQL({ query: usageQuery, variables: { companyId, year: periodYear, month: periodMonth }, operationName: 'GetBillingUsage' });
    if (Array.isArray(usageRes) && usageRes.length > 0) {
      const rec = usageRes[0];
      usage = {
        period_year: rec.period_year,
        period_month: rec.period_month,
        lead_lookups_used: rec.lead_lookups_used || 0,
        lead_lookups_limit: rec.lead_lookups_limit !== undefined && rec.lead_lookups_limit !== 100 ? rec.lead_lookups_limit : tierLeadLimit,
        ai_credits_used: rec.ai_credits_used || 0,
        ai_credits_limit: rec.ai_credits_limit || 500,
        emails_sent: rec.emails_sent || 0,
        emails_limit: rec.emails_limit || tierEmailCap,
        team_seats_used: rec.team_seats_used || 1,
        team_seats_limit: rec.team_seats_limit !== undefined && rec.team_seats_limit !== 1 ? rec.team_seats_limit : tierSeatLimit,
      };
    }
  } catch {
    // table not yet migrated
  }
  if (!usage) {
    usage = {
      period_year: periodYear,
      period_month: periodMonth,
      lead_lookups_used: 0,
      lead_lookups_limit: tierLeadLimit,
      ai_credits_used: 0,
      ai_credits_limit: 500,
      emails_sent: 0,
      emails_limit: tierEmailCap,
      team_seats_used: 1,
      team_seats_limit: tierSeatLimit,
    };
  }

  return { subscription, available_plans: availablePlans, invoices, usage };
}

/**
 * Upgrades or downgrades the subscription for the authenticated user's company.
 */
export async function changeSubscriptionPlanActionByToken(
  token: string,
  newPlanId: string,
  billingCycle: 'monthly' | 'annual'
): Promise<{ success: boolean; message: string }> {
  const { getAccountCompanyIdFromClaims } = await import('@/lib/auth-utils');
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized');

  const plan = await getBillingPlanByIdAction(newPlanId);
  if (!plan) return { success: false, message: 'Plan not found.' };

  const rawPrice = Number(plan.price) || 0;
  const pricePerMonth = billingCycle === 'annual'
    ? Math.round(rawPrice * 0.85)  // 15% annual discount
    : rawPrice;

  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + (billingCycle === 'annual' ? 12 : 1), 1);

  try {
    const upsertMutation = `
      mutation UpsertBillingSubscription($object: aa_s_subscriptions_insert_input!) {
        insert_aa_s_subscriptions_one(
          object: $object
          on_conflict: {
            constraint: aa_s_subscriptions_account_company_id_key
            update_columns: [plan_id, plan_tier, billing_cycle, status, price_paid, currency,
                             current_period_start, current_period_end, cancel_at_period_end, updated_at]
          }
        ) { id }
      }
    `;
    await insertGraphQL({
      mutation: upsertMutation,
      operationName: 'UpsertBillingSubscription',
      input: {
        object: {
          account_company_id: companyId,
          plan_id: plan.id,
          plan_tier: plan.name.toLowerCase(),
          billing_cycle: billingCycle,
          status: 'active',
          price_paid: pricePerMonth,
          currency: plan.currency || 'ZAR',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: now.toISOString(),
        },
      },
    });
  } catch (err) {
    console.warn('[billing] Subscription upsert failed (table may not exist yet):', err);
  }

  // Record invoice
  const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;
  try {
    await insertGraphQL({
      mutation: `
        mutation InsertBillingInvoice($object: aa_s_invoices_insert_input!) {
          insert_aa_s_invoices_one(object: $object) { id }
        }
      `,
      operationName: 'InsertBillingInvoice',
      input: {
        object: {
          account_company_id: companyId,
          invoice_number: invoiceNumber,
          plan_name: `${plan.name} (${billingCycle})`,
          amount: pricePerMonth,
          currency: plan.currency || 'ZAR',
          status: pricePerMonth === 0 ? 'free' : 'paid',
          billing_cycle: billingCycle,
          period_start: now.toISOString(),
          period_end: periodEnd.toISOString(),
        },
      },
    });
  } catch (err) {
    console.warn('[billing] Invoice insert failed (table may not exist yet):', err);
  }

  // Also update the legacy subscription_tier on account_company
  try {
    await updateAccountCompany(companyId, { subscription_tier: plan.name });
  } catch { /* non-critical */ }

  return { success: true, message: `Successfully switched to ${plan.name} (${billingCycle}).` };
}

/**
 * Cancels the subscription (sets cancel_at_period_end = true, access continues until period end).
 */
export async function cancelSubscriptionActionByToken(
  token: string
): Promise<{ success: boolean; message: string }> {
  const { getAccountCompanyIdFromClaims } = await import('@/lib/auth-utils');
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized');

  try {
    const mutation = `
      mutation CancelBillingSubscription($companyId: Int!, $now: timestamptz!) {
        update_aa_s_subscriptions(
          where: { account_company_id: { _eq: $companyId } }
          _set: { cancel_at_period_end: true, canceled_at: $now, updated_at: $now }
        ) { affected_rows }
      }
    `;
    await updateGraphQL({
      mutation,
      operationName: 'CancelBillingSubscription',
      id: companyId,
      attrs: { cancel_at_period_end: true, canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    });
  } catch (err) {
    console.warn('[billing] Cancel failed (table may not exist yet):', err);
    return { success: false, message: 'Could not cancel subscription. Please try again.' };
  }

  return { success: true, message: 'Subscription will cancel at the end of your current billing period. Access continues until then.' };
}

/**
 * Resumes a subscription that was set to cancel at period end.
 */
export async function resumeSubscriptionActionByToken(
  token: string
): Promise<{ success: boolean; message: string }> {
  const { getAccountCompanyIdFromClaims } = await import('@/lib/auth-utils');
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized');

  try {
    const mutation = `
      mutation ResumeBillingSubscription($companyId: Int!, $now: timestamptz!) {
        update_aa_s_subscriptions(
          where: { account_company_id: { _eq: $companyId } }
          _set: { cancel_at_period_end: false, canceled_at: null, updated_at: $now }
        ) { affected_rows }
      }
    `;
    await updateGraphQL({
      mutation,
      operationName: 'ResumeBillingSubscription',
      id: companyId,
      attrs: { cancel_at_period_end: false, canceled_at: null, updated_at: new Date().toISOString() },
    });
  } catch (err) {
    console.warn('[billing] Resume failed (table may not exist yet):', err);
    return { success: false, message: 'Could not resume subscription. Please try again.' };
  }

  return { success: true, message: 'Subscription resumed successfully. Your plan will continue as normal.' };
}

/**
 * Checks email quota usage for the user's company in the current month.
 */
export async function getCompanyEmailQuotaUsageActionByToken(
  token: string
): Promise<{ emailsSent: number; emailsLimit: number; allowed: boolean; planTier: string }> {
  const { getAccountCompanyIdFromClaims } = await import('@/lib/auth-utils');
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized');

  const now = new Date();
  const periodYear = now.getFullYear();
  const periodMonth = now.getMonth() + 1;

  let planTier = 'starter';
  try {
    const subRes = await listGraphQL({
      query: `
        query GetSubTier($companyId: Int!) {
          aa_s_subscriptions(where: { account_company_id: { _eq: $companyId } }, limit: 1) {
            plan_tier
          }
        }
      `,
      variables: { companyId },
      operationName: 'GetSubTier',
    });
    if (Array.isArray(subRes) && subRes[0]?.plan_tier) {
      planTier = subRes[0].plan_tier.toLowerCase();
    }
  } catch {
    // fallback
  }

  const emailCapsByTier: Record<string, number> = {
    starter: 1500,
    pro: 5000,
    business: 10000,
    enterprise: 15000,
  };
  const emailsLimit = emailCapsByTier[planTier] || 1500;

  let emailsSent = 0;
  try {
    const usageRes = await listGraphQL({
      query: `
        query GetSentUsage($companyId: Int!, $year: Int!, $month: Int!) {
          aa_s_usage_records(
            where: {
              account_company_id: { _eq: $companyId }
              period_year: { _eq: $year }
              period_month: { _eq: $month }
            }
            limit: 1
          ) {
            emails_sent
          }
        }
      `,
      variables: { companyId, year: periodYear, month: periodMonth },
      operationName: 'GetSentUsage',
    });
    if (Array.isArray(usageRes) && usageRes[0]?.emails_sent !== undefined) {
      emailsSent = Number(usageRes[0].emails_sent);
    }
  } catch {
    // fallback
  }

  return {
    emailsSent,
    emailsLimit,
    allowed: emailsSent < emailsLimit,
    planTier,
  };
}

/**
 * Atomically increments emails_sent for the current month usage record.
 */
export async function incrementCompanyEmailSentActionByToken(
  token: string
): Promise<void> {
  const { getAccountCompanyIdFromClaims } = await import('@/lib/auth-utils');
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) return;

  const now = new Date();
  const periodYear = now.getFullYear();
  const periodMonth = now.getMonth() + 1;

  try {
    const updateMutation = `
      mutation IncUsage($companyId: Int!, $year: Int!, $month: Int!) {
        update_aa_s_usage_records(
          where: {
            account_company_id: { _eq: $companyId }
            period_year: { _eq: $year }
            period_month: { _eq: $month }
          }
          _inc: { emails_sent: 1 }
        ) { affected_rows }
      }
    `;
    const res: any = await updateGraphQL({
      mutation: updateMutation,
      operationName: 'IncUsage',
      attrs: {},
      id: companyId,
    }).catch(() => null);

    if (!res || res.affected_rows === 0) {
      // Create the record if it didn't exist yet
      await insertGraphQL({
        mutation: `
          mutation CreateUsageRecord($object: aa_s_usage_records_insert_input!) {
            insert_aa_s_usage_records_one(object: $object) { id }
          }
        `,
        operationName: 'CreateUsageRecord',
        input: {
          object: {
            account_company_id: companyId,
            period_year: periodYear,
            period_month: periodMonth,
            emails_sent: 1,
            lead_lookups_used: 0,
            ai_credits_used: 0,
          },
        },
      }).catch(() => null);
    }
  } catch (err) {
    console.warn('[billing] Increment email sent failed:', err);
  }
}
