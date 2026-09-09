'use server';

import { Subscription, BillingPlan } from '@/lib/types';
import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL } from '@/graphql';
import { getCustomClaimsByAuth } from '@/lib/auth-utils';
import { getAccountCompanyById, updateAccountCompany } from '@/services/private/accountCompanyService';
import {
  SOUTHERN_AFRICAN_COUNTRIES as _SOUTHERN_AFRICAN_COUNTRIES,
} from '@/lib/billingConstants';

// Local aliases — used internally by this file only.
// Client code must import SOUTHERN_AFRICAN_COUNTRIES directly from '@/lib/billingConstants'.
const SOUTHERN_AFRICAN_COUNTRIES = _SOUTHERN_AFRICAN_COUNTRIES;
void SOUTHERN_AFRICAN_COUNTRIES;

const BILLING_PLAN_FIELDS = `
  id
  name
  price_monthly
  currency
  currency_symbol
  region
  country_name
  interval
  description
  paypal_plan_id
  features
  email_limit
  tier
  tier_level
  limits
  is_active
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
    price_monthly: typeof p.price_monthly === 'number' ? p.price_monthly : Number(p.price_monthly || 0),
    currency: p.currency || 'USD',
    currency_symbol: p.currency_symbol || (p.currency === 'ZAR' ? 'R' : p.currency === 'LSL' ? 'L' : '$'),
    region: p.region || 'za',
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
 * Retrieves country-specific billing plans from the database (falling back to South Africa or Global defaults).
 */
export async function getBillingPlansByCountryAction(region: string = 'za'): Promise<BillingPlan[]> {
  let targetCode = (region || 'za').toLowerCase();
  if (targetCode === 'us') targetCode = 'global';
  try {
    const query = `
      query GetBillingPlansByCountry($region: String!) {
        aa_s_billing_plans(
          where: { region: { _eq: $region } },
          order_by: [{ price_monthly: asc }]
        ) {
          ${BILLING_PLAN_FIELDS}
        }
      }
    `;

    const res = await listGraphQL({
      query,
      variables: { region: targetCode },
      operationName: 'GetBillingPlansByCountry',
    });

    const list = Array.isArray(res) ? res : [];
    if (list.length > 0) {
      return list.map(mapDbBillingPlan).filter(Boolean) as BillingPlan[];
    }
  } catch (err) {
    console.warn(`Unable to fetch billing plans for country ${targetCode} from DB:`, err);
  }

  return [];
}

/**
 * Retrieves active billing plans (defaulting to South Africa ZA).
 */
export async function getActiveBillingPlansAction(region: string = 'za'): Promise<BillingPlan[]> {
  return getBillingPlansByCountryAction(region);
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
    console.warn('Unable to query billing plan by ID from DB:', err);
  }

  return null;
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
    ) || plans[1];

    if (!plan) return null;

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
  region = 'za'
): Promise<BillingOverviewResult> {
  const { getAccountCompanyIdFromClaims } = await import('@/lib/auth-utils');
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) throw new Error('Unauthorized: missing company ID');

  const now = new Date();
  const periodYear = now.getFullYear();
  const periodMonth = now.getMonth() + 1;

  // --- Available Plans (from DB or in-memory fallback) ---
  const availablePlans = await getBillingPlansByCountryAction(region);

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
      price_paid: Number(starterPlan?.price_monthly) || 1500,
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

  const rawPrice = Number(plan.price_monthly) || 0;
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
