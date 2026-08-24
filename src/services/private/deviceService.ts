'use server';

/**
 * Registers an FCM device token for push notifications.
 * Called after the user grants notification permission.
 */

import { insertGraphQL } from '@/graphql';
import { getCustomClaimsByAuth } from '@/lib/auth-utils';

export async function registerDeviceTokenAction(
  userToken: string,
  fcmToken: string
): Promise<{ success: boolean; }> {
  const { user, error } = await getCustomClaimsByAuth(userToken);
  if (error) throw new Error('Unauthorized');

  if (!fcmToken) {
    throw new Error('Device token is required');
  }

  const mutation = `
    mutation InsertDeviceToken($object: aa_s_user_devices_insert_input!) {
      insert_aa_s_user_devices_one(
        object: $object,
        on_conflict: {
          constraint: aa_s_user_devices_pkey,
          update_columns: [created_at]
        }
      ) {
        id
      }
    }
  `;

  const result = await insertGraphQL({
    mutation,
    operationName: 'InsertDeviceToken',
    input: {
      user_id: typeof user.id === 'string' ? parseInt(user.id, 10) || 0 : user.id,
      token: fcmToken,
    },
  });

  if (!result) {
    throw new Error('Failed to insert device token');
  }

  return { success: true };
}