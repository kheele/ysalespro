'use server';

import { adminAuth } from '@/lib/firebase-admin';
import { getUserByAuthId } from '@/services/userService';

/**
 * Sets (or clears) the active projectId in the user's Firebase custom claims.
 * Called on every project navigation / project selection.
 * Pass null or undefined to clear the projectId claim.
 */
export async function setProjectClaimByToken(token: string, projectId: string | null): Promise<void> {
  const auth = adminAuth();
  const decodedToken = await auth.verifyIdToken(token);
  const { uid } = decodedToken;

  const userRecord = await auth.getUser(uid);
  const currentClaims = userRecord.customClaims || {};

  let newClaims: Record<string, any>;
  if (!projectId) {
    const { projectId: _, ...rest } = currentClaims;
    newClaims = rest;
  } else {
    newClaims = { ...currentClaims, projectId };
  }

  await auth.setCustomUserClaims(uid, newClaims);
}

/**
 * Bootstraps initial claims when a user logs in. 
 * This is called before the client token has claims embedded, so it must verify the raw token using adminAuth.
 */
export async function initializeUserClaimsAction(token: string): Promise<void> {
  const auth = adminAuth();
  const decodedToken = await auth.verifyIdToken(token);
  const { uid } = decodedToken;

  const userRecord = await auth.getUser(uid);
  const { customClaims = {} } = userRecord;

  const dbUser = await getUserByAuthId(uid);
  if (!dbUser) {
    throw new Error('User not found in database');
  }

  await auth.setCustomUserClaims(uid, {
    ...(customClaims || {}),
    role: dbUser.role,
    organization_id: dbUser.organization_id,
  });
}

/**
 * Sets (or clears) the viewMode in the user's Firebase custom claims.
 * Called when the user switches between company and contractor views.
 */
export async function setViewModeClaimByToken(
  token: string,
  viewMode: 'company' | 'contractor' | 'clear'
): Promise<void> {
  const auth = adminAuth();
  const decodedToken = await auth.verifyIdToken(token);
  const { uid } = decodedToken;

  const userRecord = await auth.getUser(uid);
  const currentClaims = userRecord.customClaims || {};

  let newClaims: Record<string, any>;
  if (viewMode === 'clear') {
    const { viewMode: _, ...rest } = currentClaims;
    newClaims = rest;
  } else {
    newClaims = { ...currentClaims, viewMode };
  }

  await auth.setCustomUserClaims(uid, newClaims);
}
