'use server';

import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL, deleteGraphQL } from '@/graphql';
import type { User, UserRole, AaUser } from '@/lib/types';
import type { CreateUserInput, UpdateUserInput } from '@/lib/types_params';
import { adminAuth } from '@/lib/firebase-admin';
import * as accountCompanyService from '@/services/private/accountCompanyService';

const USER_FIELDS = `
  id
  account_company_id
  auth_id
  email
  fname
  lname
  role
  avatar_url
  is_active
  created_at
  updated_at
  account_company {
    id
    name
    domain
    subscription_tier
  }
`;

function mapDbUser(u: any): User | null {
  if (!u) return null;
  const fname = u.fname || '';
  const lname = u.lname || '';
  const fullName = `${fname} ${lname}`.trim() || u.email || 'User';

  return {
    id: String(u.id),
    fname,
    lname,
    name: fullName,
    email: u.email,
    role: u.role || 'Admin',
    avatar_url: u.avatar_url,
    auth_id: u.auth_id,
    account_company_id: u.account_company_id,
    account_company: u.account_company ? {
      id: Number(u.account_company.id),
      name: u.account_company.name,
      domain: u.account_company.domain,
      subscription_tier: u.account_company.subscription_tier,
    } : null,
    created_at: u.created_at,
  };
}

export async function getUsersAction(accountCompanyId: number): Promise<User[]> {
  try {
    const query = `
      query GetUsersByAccountCompany($accountCompanyId: Int!) {
        aa_s_users(where: {account_company_id: {_eq: $accountCompanyId}}, order_by: [{created_at: desc}]) {
          ${USER_FIELDS}
        }
      }
    `;
    const list = await listGraphQL({
      query,
      operationName: 'GetUsersByAccountCompany',
      variables: { accountCompanyId }
    });
    return Array.isArray(list) ? list.map(mapDbUser).filter(Boolean) as User[] : [];
  } catch (err) {
    console.error("getUsersAction error:", err);
    return [];
  }
}

export async function getUsersCountByOrganizationIdAction(accountCompanyId: number | string): Promise<number> {
  try {
    const query = `
      query GetUsersCount($accountCompanyId: Int!) {
        aa_s_users_aggregate(where: {account_company_id: {_eq: $accountCompanyId}}) {
          aggregate {
            count
          }
        }
      }
    `;
    const result = await getGraphQLOne({
      query,
      operationName: 'GetUsersCount',
      variables: { accountCompanyId: Number(accountCompanyId) },
    });
    return result?.aggregate?.count || 0;
  } catch (err) {
    console.error("getUsersCountByOrganizationIdAction error:", err);
    return 0;
  }
}

export async function getUserByIdAction(id: string | number): Promise<User | null> {
  try {
    const query = `
      query GetUserById($id: Int!) {
        aa_s_users_by_pk(id: $id) {
          ${USER_FIELDS}
        }
      }
    `;
    const res = await getGraphQLOne({
      query,
      operationName: 'GetUserById',
      variables: { id: Number(id) },
    });
    return mapDbUser(res);
  } catch (err) {
    console.error("getUserByIdAction error:", err);
    return null;
  }
}

export async function getUserByAuthIdAction(authId: string): Promise<User | null> {
  try {
    const query = `
      query GetUserByAuthId($authId: String!) {
        aa_s_users(where: {auth_id: {_eq: $authId}}, limit: 1) {
          ${USER_FIELDS}
        }
      }
    `;
    const list = await listGraphQL({
      query,
      operationName: 'GetUserByAuthId',
      variables: { authId }
    });
    if (!Array.isArray(list) || list.length === 0) return null;
    return mapDbUser(list[0]);
  } catch (err) {
    console.error("getUserByAuthIdAction error:", err);
    return null;
  }
}export async function getUserByEmailAction(email: string): Promise<User | null> {
  try {
    const query = `
      query GetUserByEmail($email: String!) {
        aa_s_users(where: {email: {_eq: $email}}, limit: 1) {
          ${USER_FIELDS}
        }
      }
    `;
    const list = await listGraphQL({
      query,
      operationName: 'GetUserByEmail',
      variables: { email }
    });
    if (!Array.isArray(list) || list.length === 0) return null;
    return mapDbUser(list[0]);
  } catch (err) {
    console.error("getUserByEmailAction error:", err);
    return null;
  }
}


export async function createUserAction(input: CreateUserInput): Promise<User | null> {
  try {
    let accountCompanyId = input.account_company_id;

    const companyName =
      typeof input.account_company === 'string'
        ? input.account_company
        : input.account_company?.name || null;

    // Create Account Company if company name is passed and accountCompanyId is missing
    if (!accountCompanyId && companyName) {
      const newAcc = await accountCompanyService.createAccountCompany({
        name: companyName,
      });
      if (newAcc) {
        accountCompanyId = newAcc.id;
      }
    }

    if (!accountCompanyId) {
      throw new Error("Cannot create user: account_company_id or account_company is required.");
    }

    const fname = input.fname || '';
    const lname = input.lname || '';

    const mutation = `
      mutation CreateUser($object: aa_s_users_insert_input!) {
        insert_aa_s_users_one(object: $object) {
          ${USER_FIELDS}
        }
      }
    `;

    const object = {
      account_company_id: Number(accountCompanyId),
      auth_id: input.auth_id,
      email: input.email,
      fname,
      lname,
      role: input.role || 'Admin',
      avatar_url: input.avatar_url || '',
      is_active: true,
    };

    const res = await insertGraphQL({
      mutation,
      operationName: 'CreateUser',
      input: object,
    });

    return mapDbUser(res);
  } catch (err) {
    console.error("createUserAction error:", err);
    return null;
  }
}



export async function updateUserAction(id: number | string, updates: UpdateUserInput): Promise<User | null> {
  try {
    const mutation = `
      mutation UpdateUser($id: Int!, $_set: aa_s_users_set_input!) {
        update_aa_s_users_by_pk(pk_columns: { id: $id }, _set: $_set) {
          ${USER_FIELDS}
        }
      }
    `;

    const _set: Record<string, any> = {};

    if (updates.auth_id !== undefined) _set.auth_id = updates.auth_id;
    if (updates.fname !== undefined) _set.fname = updates.fname;
    if (updates.lname !== undefined) _set.lname = updates.lname;
    if (updates.email) _set.email = updates.email;
    if (updates.role) _set.role = updates.role;
    if (updates.avatar_url !== undefined) _set.avatar_url = updates.avatar_url;
    if (updates.is_active !== undefined) _set.is_active = updates.is_active;
    if (updates.account_company_id !== undefined) _set.account_company_id = Number(updates.account_company_id);

    const res = await updateGraphQL({
      mutation,
      operationName: 'UpdateUser',
      id: Number(id),
      attrs: _set,
    });

    return mapDbUser(res);
  } catch (err) {
    console.error("updateUserAction error:", err);
    return null;
  }
}

export async function deleteUserAction(id: number | string): Promise<boolean> {
  try {
    const mutation = `
      mutation DeleteUser($id: Int!) {
        delete_aa_s_users_by_pk(id: $id) {
          id
        }
      }
    `;
    const res = await deleteGraphQL({ mutation, operationName: 'DeleteUser', id: Number(id) });
    return !!res;
  } catch (err) {
    console.error("deleteUserAction error:", err);
    return false;
  }
}

export async function getAllPlatformUsersAction(): Promise<User[]> {
  try {
    const query = `
      query GetAllPlatformUsers {
        aa_s_users(order_by: [{ created_at: desc }]) {
          ${USER_FIELDS}
        }
      }
    `;
    const list = await listGraphQL({ query, operationName: 'GetAllPlatformUsers' });
    return Array.isArray(list) ? list.map(mapDbUser).filter(Boolean) as User[] : [];
  } catch (err) {
    console.error('getAllPlatformUsersAction error:', err);
    return [];
  }
}

export async function completionAccountActionByToken(
  token: string,
  updates: {
    fname?: string;
    lname?: string;
    email?: string;
    account_company?: string | { name: string };
    invitation_token?: string;
  }
): Promise<any> {
  try {
    const decodedToken = await adminAuth().verifyIdToken(token, true);
    const { uid, email } = decodedToken;

    let accountCompanyId = 1;

    const companyName =
      typeof updates.account_company === 'string'
        ? updates.account_company
        : updates.account_company?.name || null;

    // Create Account Company if name is provided
    if (companyName) {
      const newAcc = await accountCompanyService.createAccountCompany({
        name: companyName,
      });
      if (newAcc) {
        accountCompanyId = newAcc.id;
      }
    }

    const existingUser = await getUserByAuthIdAction(uid);
    let userResult: User | null;

    if (!existingUser) {
      userResult = await createUserAction({
        account_company_id: accountCompanyId,
        auth_id: uid,
        email: updates.email || email || '',
        fname: updates.fname || '',
        lname: updates.lname || '',
        role: 'Admin',
      });
    } else {
      userResult = await updateUserAction(existingUser.id, {
        account_company_id: accountCompanyId,
        fname: updates.fname || existingUser.fname,
        lname: updates.lname || existingUser.lname,
        email: updates.email || existingUser.email,
      });
    }

    return {
      success: true,
      userId: userResult?.id,
      accountCompanyId,
      message: "Account setup completed successfully.",
    };
  } catch (err: any) {
    console.error("completionAccountActionByToken error:", err);
    throw new Error(err.message || "Failed to complete account setup.");
  }
}
