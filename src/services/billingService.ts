import { Subscription } from '@/lib/types';

export async function getSubscriptionByOrganizationId(orgId: string): Promise<Subscription | null> {
  return null;
}

export async function getBillingPlanById(planId: string): Promise<{ name: string; features: { feature: { key: string; value: string } }[] } | null> {
  return null;
}
