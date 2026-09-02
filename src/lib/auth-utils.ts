import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserByAuthIdAction, getUserByEmailAction, updateUserAction } from '@/services/private/userService';
import type { User } from '@/lib/types';

export type Role = 'SuperAdmin' | 'Admin' | 'Manager' | 'SalesRep' | 'Member' | 'User' | 'any';

export type AuthResult =
  | { user: User; account_company_id: number | null; error: null }
  | { user: null; account_company_id: null; error: NextResponse };

export async function getCustomClaimsByAuth(
  token: string,
  roleCheck: Role | Role[] | 'any' = 'any'
): Promise<AuthResult> {
  if (!token) {
    return {
      user: null,
      account_company_id: null,
      error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  try {
    const decodedClaims = await adminAuth().verifyIdToken(token, true);

    const claimAccountCompanyId = decodedClaims.account_company_id
      ? Number(decodedClaims.account_company_id)
      : null;

    // Fetch full user profile from DB for other details
    let user = await getUserByAuthIdAction(decodedClaims.uid);
    if (!user && decodedClaims.email) {
      user = await getUserByEmailAction(decodedClaims.email);
      if (user) {
        await updateUserAction(user.id, { auth_id: decodedClaims.uid, is_active: true });
        user = { ...user, auth_id: decodedClaims.uid, is_active: true };
      }
    }

    if (!user) {
      return {
        user: null,
        account_company_id: null,
        error: NextResponse.json({ error: 'Forbidden: User not found in DB' }, { status: 403 }),
      };
    }

    const account_company_id = claimAccountCompanyId ?? user.account_company_id ?? null;

    if (Array.isArray(roleCheck)) {
      if (!roleCheck.includes(user.role as Role)) {
        return {
          user: null,
          account_company_id: null,
          error: NextResponse.json(
            { error: `Forbidden: Insufficient permissions. Requires ${roleCheck.join(', ')} role.` },
            { status: 403 }
          ),
        };
      }
    } else if (roleCheck !== 'any' && user.role !== roleCheck) {
      return {
        user: null,
        account_company_id: null,
        error: NextResponse.json(
          { error: `Forbidden: Insufficient permissions. Requires ${roleCheck} role.` },
          { status: 403 }
        ),
      };
    }

    return { user, account_company_id, error: null };
  } catch (error: any) {
    console.error('Auth check failed:', error.message);
    return {
      user: null,
      account_company_id: null,
      error: NextResponse.json(
        { error: 'Authentication token is invalid or has expired.' },
        { status: 401 }
      ),
    };
  }
}

export async function checkAuth(roleCheck: Role | Role[] | 'any' = 'any'): Promise<AuthResult> {
  const requestHeaders = await headers();
  const authorization = requestHeaders.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return {
      user: null,
      account_company_id: null,
      error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  const token = authorization.split('Bearer ')[1];
  return getCustomClaimsByAuth(token, roleCheck);
}

/**
 * Resolves account_company_id ONLY from CustomClaims of the passed ID token.
 */
export async function getAccountCompanyIdFromClaims(token?: string | null): Promise<number | null> {
  if (!token) return null;
  try {
    const res = await getCustomClaimsByAuth(token);
    return res.account_company_id ?? null;
  } catch (e) {
    console.error("Failed to extract account_company_id from token claims:", e);
    return null;
  }
}
