'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { getUserByAuthIdAction } from './userService';

/**
 * Bootstraps and synchronizes custom claims when a user authenticates.
 * Saves account_company_id and role in CustomClaims,
 * and strips out deprecated claims (projectId, viewMode, organization_id).
 */
export async function initializeUserClaimsAction(token: string): Promise<void> {
  const auth = adminAuth();
  const decodedToken = await auth.verifyIdToken(token);
  const { uid } = decodedToken;

  const userRecord = await auth.getUser(uid);
  const currentClaims = userRecord.customClaims || {};

  const dbUser = await getUserByAuthIdAction(uid);
  if (!dbUser) {
    throw new Error('User not found in database');
  }

  const account_company_id = dbUser.account_company_id ?? 1;

  // Clean up legacy claims (projectId, viewMode, organization_id)
  const { projectId: _, viewMode: __, organization_id: ___, ...cleanedClaims } = currentClaims;

  const updatedClaims = {
    ...cleanedClaims,
    role: dbUser.role,
    account_company_id,
  };

  await auth.setCustomUserClaims(uid, updatedClaims);
}

/**
 * Alias for synchronizing Firebase CustomClaims after authentication.
 */
export async function syncCustomClaimsAction(token: string): Promise<void> {
  return initializeUserClaimsAction(token);
}
