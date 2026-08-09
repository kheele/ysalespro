'use server';

import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL, deleteGraphQL, sendGraphQL } from '@/graphql';
import type { User, UserOrganization, Subscription, UserRole } from '@/lib/types';
import { adminAuth } from '@/lib/firebase-admin';
import { getPermissionsByOrganization, seedDefaultPermissions } from './permissionService';
import { getNotifications } from './notificationServices';
import { getCustomClaimsByAuth } from '@/lib/auth-utils';
import { getSubscriptionByOrganizationId, getBillingPlanById } from './billingService';

const USER_FIELDS = `
  id
  fname
  lname
  email
  role
  avatar_url
  phone
  auth_id
  organization_id
  organization {
    id
    name
    is_contractor
    subscription: subscription_list(where: {status: {_in: ["active", "trialing"]}}, limit: 1) {
      plan {
        name
      }
    }
  }
`;

export async function getUsers(organizationId: number): Promise<User[]> {
  const query = `
    query GetUsersByOrganization($organizationId: bigint!) {
      sfc_users(where: {organization_id: {_eq: $organizationId}}) {
        id
        fname
        lname
        email
        role
        avatar_url
      }
    }
  `;
  const users: { id: string; fname: string; lname: string; email: string; role: 'Admin' | 'Editor' | 'Viewer' | 'Approver'; avatar_url: string; }[] = await listGraphQL({
    query,
    operationName: 'GetUsersByOrganization',
    variables: { organizationId }
  });
  return (users as any[]).map(u => ({ ...u, name: `${u.fname} ${u.lname}` })) as User[];
}

export async function getUsersCountByOrganizationId(organizationId: string): Promise<number> {
  const query = `
        query GetUsersCount($organizationId: bigint!) {
            sfc_users_aggregate(where: {organization_id: {_eq: $organizationId}}) {
                aggregate {
                    count
                }
            }
        }
    `;
  const result = await getGraphQLOne({
    query,
    operationName: 'GetUsersCount',
    variables: { organizationId },
  });
  return result?.aggregate?.count || 0;
}


export async function getUserById(id: string): Promise<User | null> {
  const query = `
    query GetUserById($id: bigint!) {
      sfc_users_by_pk(id: $id) {
        ${USER_FIELDS}
      }
    }
  `;
  const user = await getGraphQLOne({
    query,
    operationName: 'GetUserById',
    variables: { id },
  });

  if (user?.organization?.subscription) {
    user.organization.subscription = user.organization.subscription.length > 0 ? user.organization.subscription[0] : null;
  }
  return user && [user].map(({ organization, ...rest }) => ({
    ...rest,
    subscription: organization?.subscription
  }));
}

export async function getUserByAuthId(authId: string): Promise<User | null> {
  const query = `
        query GetUserByAuthId($authId: String!) {
            sfc_users(where: {auth_id: {_eq: $authId}}, limit: 1) {
                ${USER_FIELDS}
            }
        }
    `;
  const user: User | null = await getGraphQLOne({
    query,
    operationName: 'GetUserByAuthId',
    variables: { authId }
  }).then((user: User) => {
    if (!user) return null;
    if (user?.organization?.subscription) {
      user.organization.subscription = (user.organization.subscription as [Subscription]).length > 0 ? (user.organization.subscription as [Subscription])[0] : null;
      user.subscription = user.organization.subscription as Subscription;
    }
    return user;
  });

  if (user && user.organization_id && user.role) {
    const allPermissions = await getPermissionsByOrganization(user.organization_id);
    const userPermissions: Record<string, boolean> = {};

    allPermissions
      .filter((p: any) => p.role === user.role)
      .forEach((p: any) => {
        userPermissions[p.feature] = p.enabled;
      });

    user.permissions = userPermissions;

    const notifications = await getNotifications();
    user.unreadNotificationCount = notifications.filter((n: any) => !n.is_read).length;
  }

  return user;
}

export async function createUser(
  input: Partial<User> & { organization?: Partial<UserOrganization>; invitation_token?: string }
): Promise<{ returning: { id: string }[] }> {
  const mutation = `
    mutation CreateUserWithOrganization($object: sfc_users_insert_input!) {
      insert_sfc_users_one(object: $object) {
        id
        organization {
          id
        }
      }
    }
  `;
  const { organization, invitation_token, ...userInput } = input;

  let organizationId = input.organization_id;
  let contractorRelationshipId;

  // If an invitation token is provided, use it to find the organization
  if (invitation_token) {
    const relQuery = `
        query GetRelByToken($token: String!) {
            sfc_contractor_relationships(where: {invitation_token: {_eq: $token}}, limit: 1) {
                id
                contractor_organization_id
                email
                invitation_expires_at
            }
        }
    `;
    const relResult = await getGraphQLOne({
      query: relQuery,
      operationName: 'GetRelByToken',
      variables: { token: invitation_token }
    });

    if (!relResult) {
      throw new Error("Invalid invitation token.");
    }

    if (relResult.invitation_expires_at && new Date(relResult.invitation_expires_at) < new Date()) {
      throw new Error("This invitation has expired.");
    }

    organizationId = relResult.contractor_organization_id;
  }

  const dataToInsert: any = {
    ...userInput,
    role: input.role || 'Admin',
    organization_id: organizationId,
  };

  if (organization && organization.name && !invitation_token) {
    dataToInsert.organization = {
      data: {
        name: organization.name
      }
    };
    delete dataToInsert.organization_id; // Avoid conflict if both are present
  }

  const result = await insertGraphQL({
    mutation,
    operationName: 'CreateUserWithOrganization',
    input: dataToInsert,
  });

  const newOrgId = result.organization?.id;
  if (newOrgId) {
    await seedDefaultPermissions(newOrgId);
  }

  // If token was used, invalidate it
  if (invitation_token) {
    const consumeMutation = `
        mutation ConsumeToken($token: String!) {
            update_sfc_contractor_relationships(
                where: {invitation_token: {_eq: $token}},
                _set: {invitation_token: null, invitation_expires_at: null}
            ) {
                affected_rows
            }
        }
    `;
    await sendGraphQL({
      mutation: consumeMutation,
      operationName: 'ConsumeToken',
      variables: { token: invitation_token }
    });
  }

  return result;
}

async function updateUser(auth_id_or_db_id: string, updates: Partial<User> & { invitation_token?: string }): Promise<any> {
  const existingUser = await (auth_id_or_db_id.length > 20 ? getUserByAuthId(auth_id_or_db_id) : getUserById(auth_id_or_db_id));

  const { organization, invitation_token, ...userUpdates } = updates;

  // SCENARIO 1: User does not exist in DB at all. Create them.
  if (!existingUser) {
    let organizationId = userUpdates.organization_id;

    // If an invitation token is provided, use it to find the organization
    if (invitation_token) {
      const relQuery = `
                query GetRelByToken($token: String!) {
                    sfc_contractor_relationships(where: {invitation_token: {_eq: $token}}, limit: 1) {
                        contractor_organization_id
                        email
                        invitation_expires_at
                    }
                }
            `;
      const relResult = await getGraphQLOne({
        query: relQuery,
        operationName: 'GetRelByToken',
        variables: { token: invitation_token }
      });

      if (!relResult) {
        throw new Error("Invalid invitation token.");
      }

      if (relResult.invitation_expires_at && new Date(relResult.invitation_expires_at) < new Date()) {
        throw new Error("This invitation has expired.");
      }

      organizationId = relResult.contractor_organization_id;
    }

    if (!organization?.name && !organizationId) {
      throw new Error("Organization name or invitation token is required for new user creation.");
    }
    const newUserPayload: Partial<User> & { organization?: Partial<UserOrganization> } = {
      auth_id: auth_id_or_db_id,
      fname: userUpdates.fname || '',
      lname: userUpdates.lname || '',
      email: userUpdates.email!,
      phone: userUpdates.phone || null,
      role: userUpdates.role || 'Admin',
      organization: organizationId ? undefined : (organization || undefined),
      organization_id: organizationId,
    };
    // The `createUser` function will handle permission seeding
    return await createUser(newUserPayload);
  }

  // SCENARIO 2: User exists in DB, but may need organization update.
  const userDbId = existingUser.id;
  const userOrgId = existingUser.organization_id;

  // If an organization name is provided...
  if (organization?.name) {
    if (userOrgId) {
      // ...and user already has an org, update the org name.
      const updateOrgMutation = `
                mutation UpdateOrganization($id: bigint!, $_set: sfc_organizations_set_input!) {
                    update_sfc_organizations_by_pk(pk_columns: {id: $id}, _set: $_set) { id }
                }
            `;
      await updateGraphQL({
        mutation: updateOrgMutation,
        operationName: 'UpdateOrganization',
        id: userOrgId,
        attrs: { name: organization.name },
      });
    } else {
      // ...and user has NO org, create one and link it to the user.
      const orgMutation = `
                mutation CreateOrganization($object: sfc_organizations_insert_input!) {
                  insert_sfc_organizations_one(object: $object) { id }
                }
            `;
      const newOrg = await insertGraphQL({
        mutation: orgMutation,
        operationName: 'CreateOrganization',
        input: { name: organization.name },
      });

      if (newOrg.id) {
        userUpdates.organization_id = newOrg.id;
        await seedDefaultPermissions(newOrg.id);
      }
    }
  }

  // Finally, update the user record itself if there are any changes.
  if (Object.keys(userUpdates).length > 0) {
    const updateUserMutation = `
            mutation UpdateUser($id: bigint!, $_set: sfc_users_set_input!) {
                update_sfc_users_by_pk(pk_columns: {id: $id}, _set: $_set) { id }
            }
        `;
    await updateGraphQL({
      mutation: updateUserMutation,
      operationName: 'UpdateUser',
      id: userDbId,
      attrs: userUpdates,
    });
  }

  // If token was used, invalidate it
  if (invitation_token) {
    const consumeMutation = `
            mutation ConsumeToken($token: String!) {
                update_sfc_contractor_relationships(
                    where: {invitation_token: {_eq: $token}},
                    _set: {invitation_token: null, invitation_expires_at: null}
                ) {
                    affected_rows
                }
            }
        `;
    await sendGraphQL({
      mutation: consumeMutation,
      operationName: 'ConsumeToken',
      variables: { token: invitation_token }
    });
  }

  return { success: true, message: 'User profile updated successfully.' };
}

export async function updateUserEmailByAuth(token: string, email: string): Promise<any> {
  const { user, error } = await getCustomClaimsByAuth(token);
  if (error || !user) throw new Error('Unauthorized');

  const existingUser = await getUserByAuthId(user.auth_id!);
  if (!existingUser) {
    throw new Error('User does not exist in DB.');
  }

  if (email.length > 0) {
    const updateUserMutation = `
            mutation UpdateUser($id: bigint!, $_set: sfc_users_set_input!) {
                update_sfc_users_by_pk(pk_columns: {id: $id}, _set: $_set) { id }
            }
        `;
    await updateGraphQL({
      mutation: updateUserMutation,
      operationName: 'UpdateUser',
      id: user.id,
      attrs: { email },
    });
  }

  return { success: true, message: 'User profile updated successfully.' };
}

export async function deleteUser(id: string): Promise<any> {
  const user = await getUserById(id);
  if (!user || !user.auth_id) throw new Error("User not found or missing auth_id");

  await adminAuth().deleteUser(user.auth_id);

  const mutation = `
        mutation DeleteUser($id: bigint!) {
            delete_sfc_users_by_pk(id: $id) { id }
        }
    `;
  return await deleteGraphQL({ mutation, operationName: 'DeleteUser', id });
}

// --- Auth-aware wrappers (for use in client-side server actions) ---

export async function getUsersByToken(token: string): Promise<User[]> {
  const { user, error } = await getCustomClaimsByAuth(token);
  if (error || !user) throw new Error('Unauthorized');
  if (!user.organization_id) throw new Error('User is not associated with an organization.');
  return getUsers(Number(user.organization_id));
}

export async function inviteUserByToken(token: string, input: { fname: string; lname: string; email: string; role: 'Admin' | 'Editor' | 'Viewer' }) {
  const { user: inviter, error } = await getCustomClaimsByAuth(token, 'Admin');
  if (error || !inviter) throw new Error('Unauthorized or insufficient permissions');

  if (!inviter.organization_id) {
    throw new Error('Inviter is not associated with an organization.');
  }

  // Check subscription limits
  const subscription = await getSubscriptionByOrganizationId(inviter.organization_id);
  if (subscription) {
    const plan = await getBillingPlanById(subscription.plan_id);
    const maxUsersFeature = plan?.features.find((f: any) => f.feature.key === 'max_users');

    if (maxUsersFeature?.feature.value) {
      const maxUsersLimit = parseInt(maxUsersFeature.feature.value, 10);
      const currentUserCount = await getUsersCountByOrganizationId(inviter.organization_id);
      if (currentUserCount >= maxUsersLimit) {
        throw new Error(`You have reached the maximum of ${maxUsersLimit} users for the ${plan?.name} plan. Please upgrade your plan to invite more users.`);
      }
    }
  }

  const { email, role, fname, lname } = input;

  try {
    const createdUser = await adminAuth().createUser({ email, displayName: `${fname} ${lname}` });

    const result = await createUser({
      auth_id: createdUser.uid,
      email,
      role,
      fname,
      lname,
      organization_id: inviter.organization_id,
    });

    return result.returning[0];
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      throw new Error('A user with this email already exists.');
    }
    throw err;
  }
}

export async function updateUserRoleByToken(token: string, userId: string, role: UserRole) {
  const { user, error } = await getCustomClaimsByAuth(token, 'Admin');
  if (error || !user) throw new Error('Unauthorized or insufficient permissions');

  if (user.id === userId) {
    throw new Error('Cannot change your own role.');
  }

  return updateUser(userId, { role });
}

export async function deleteUserByToken(token: string, userId: string) {
  const { user, error } = await getCustomClaimsByAuth(token);
  if (error || !user) throw new Error('Unauthorized');

  // Allow either Admin of same org, or SuperAdmin
  if (user.role !== 'SuperAdmin' && user.role !== 'Admin') {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  if (user.id === userId) {
    throw new Error('Unauthorized: Cannot delete your own account.');
  }

  return deleteUser(userId);
}

// --- Auth-aware wrappers (for use in client-side server actions) ---

export async function getAllPlatformUsersAction(token: string): Promise<User[]> {
  const { error } = await getCustomClaimsByAuth(token, 'SuperAdmin');
  if (error) throw new Error('Unauthorized');

  const query = `
        query GetAllPlatformUsers {
            sfc_users(order_by: {created_at: desc}) {
                id
                fname
                lname
                email
                role
                avatar_url
                organization {
                    id
                    name
                }
            }
        }
    `;
  const result = await sendGraphQL({ query, operationName: 'GetAllPlatformUsers' });
  return result;
}

export async function completionAccountByToken(
  token: string,
  updates: Omit<Partial<User>, 'organization'> & { organization?: { name: string }; invitation_token?: string }
): Promise<any> {
  try {
    const decodedClaims = await adminAuth().verifyIdToken(token, true);
    return updateUser(decodedClaims.uid, updates as any);
  } catch (error) {
    console.log(error);
    throw new Error('Unauthorized: Invalid or expired token');
  }
}

export async function updateMyUserProfileByToken(
  token: string,
  updates: Omit<Partial<User>, 'organization'> & { organization?: { name: string }; }
): Promise<any> {
  const { user, error } = await getCustomClaimsByAuth(token);
  if (error || !user) throw new Error('Unauthorized');

  return updateUser(user.auth_id!, updates as any);
}

export async function updateUserProfileByToken(
  token: string,
  updates: Partial<User> & { organization?: { name: string }; auth_id: string }
): Promise<any> {
  const { user, error } = await getCustomClaimsByAuth(token);
  if (error || !user) throw new Error('Unauthorized');

  // Allow either Admin of same org, or SuperAdmin
  if (user.role !== 'SuperAdmin' && user.role !== 'Admin' && user.auth_id !== updates.auth_id) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  return updateUser(updates.auth_id, updates);
}
