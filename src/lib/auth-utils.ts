
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserByAuthId } from '@/services/userService';
import type { User } from '@/lib/types';

type Role = 'SuperAdmin' | 'Admin' | 'Editor' | 'Viewer' | 'Approver' | 'any';

type AuthResult = { user: User; projectId: string | null; viewMode: 'company' | 'contractor' | null; error: null } | { user: null; projectId: null; viewMode: null; error: NextResponse };

export async function getCustomClaimsByAuth(token: string, roleCheck: Role | Role[] | 'any' = 'any'): Promise<AuthResult> {
  if (!token) {
    return {
      user: null,
      projectId: null,
      viewMode: null,
      error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    };
  }

  try {
    const decodedClaims = await adminAuth().verifyIdToken(token, true);

    const projectId = decodedClaims.projectId || null;
    const viewMode = (decodedClaims.viewMode as 'company' | 'contractor') || null;

    // Fetch full user profile from DB for other details
    const user = await getUserByAuthId(decodedClaims.uid);
    if (!user) {
      return {
        user: null,
        projectId: null,
        viewMode: null,
        error: NextResponse.json({ error: 'Forbidden: User not found in DB' }, { status: 403 })
      };
    }

    if (Array.isArray(roleCheck)) {
      if (!roleCheck.includes(user.role)) {
        return {
          user: null,
          projectId: null,
          viewMode: null,
          error: NextResponse.json({ error: `Forbidden: Insufficient permissions. Requires ${roleCheck} role.` }, { status: 403 })
        };
      }
    }
    if (roleCheck !== 'any' && user.role !== roleCheck) {
      return {
        user: null,
        projectId: null,
        viewMode: null,
        error: NextResponse.json({ error: `Forbidden: Insufficient permissions. Requires ${roleCheck} role.` }, { status: 403 })
      };
    }

    return { user, projectId, viewMode, error: null };
  } catch (error: any) {
    console.error('Auth check failed:', error.message);
    return {
      user: null,
      projectId: null,
      viewMode: null,
      error: NextResponse.json({ error: 'Authentication token is invalid or has expired.' }, { status: 401 })
    };
  }
}

export async function checkAuth(roleCheck: Role | Role[] | 'any' = 'any'): Promise<AuthResult> {
  const requestHeaders = await headers();
  const authorization = requestHeaders.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return {
      user: null,
      projectId: null,
      viewMode: null,
      error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    };
  }
  const token = authorization.split('Bearer ')[1];
  if (!token) {
    return {
      user: null,
      projectId: null,
      viewMode: null,
      error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    };
  }

  return await getCustomClaimsByAuth(token, roleCheck);
}
