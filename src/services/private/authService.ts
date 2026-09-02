'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { getUserByAuthIdAction, getUserByEmailAction, updateUserAction } from './userService';

/**
 * Bootstraps and synchronizes custom claims when a user authenticates.
 * Saves account_company_id and role in CustomClaims,
 * and strips out deprecated claims (projectId, viewMode, organization_id).
 */
export async function initializeUserClaimsAction(token: string): Promise<void> {
  const auth = adminAuth();
  const decodedToken = await auth.verifyIdToken(token);
  const { uid, email } = decodedToken;

  const userRecord = await auth.getUser(uid);
  const currentClaims = userRecord.customClaims || {};

  let dbUser = await getUserByAuthIdAction(uid);
  if (!dbUser && email) {
    dbUser = await getUserByEmailAction(email);
    if (dbUser) {
      await updateUserAction(dbUser.id, { auth_id: uid, is_active: true });
    }
  }

  if (!dbUser) {
    throw new Error('User not found in database');
  }

  const account_company_id = dbUser.account_company_id;
  if (!account_company_id) {
    throw new Error('User has no account_company_id assigned in database');
  }

  // Clean up legacy claims (projectId, viewMode, organization_id)
  const { ...cleanedClaims } = currentClaims;

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
