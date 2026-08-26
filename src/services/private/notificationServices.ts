'use server';

import { listGraphQL, sendGraphQL, insertGraphQL, updateGraphQL } from '@/graphql';
import { NotificationItem, NotificationPriority, NotificationType } from '@/lib/types';
import { CreateNotificationInput } from '@/lib/types_params';
import { getAccountCompanyIdFromClaims } from "@/lib/auth-utils";

function mapDbNotification(n: any): NotificationItem {
  return {
    id: n.id,
    title: n.title || "Notification",
    message: n.message || "",
    type: (n.type as NotificationType) || "info",
    priority: (n.priority as NotificationPriority) || "normal",
    read: !!n.read,
    timestamp: n.timestamp ? new Date(n.timestamp).toISOString() : new Date().toISOString(),
    action_url: n.action_url || undefined,
    related_entity_type: n.related_entity_type,
    related_entity_name: n.related_entity_name,
    related_entity_id: n.related_entity_id,
    created_at: n.created_at || n.timestamp,
  };
}

export async function getNotificationsActionByToken(
  token: string,
  filterRead?: 'all' | 'unread'
): Promise<NotificationItem[]> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const whereConditions: Record<string, any>[] = [
      { account_company_id: { _eq: companyId } }
    ];

    if (filterRead === 'unread') {
      whereConditions.push({ read: { _eq: false } });
    }

    const where = { _and: whereConditions };

    const query = `
      query GetNotifications($where: aa_s_notifications_bool_exp) {
        aa_s_notifications(
          distinct_on: [id]
          where: $where
          order_by: [{ id: desc }]
        ) {
          id
          title
          message
          type
          priority
          read
          timestamp
          action_url
          related_entity_type
          related_entity_name
          related_entity_id
          created_at
        }
      }
    `;

    const res = await listGraphQL({ query, variables: { where }, operationName: "GetNotifications" });
    return Array.isArray(res) ? res.map(mapDbNotification) : [];
  } catch (err) {
    console.error("Hasura getNotificationsActionByToken error:", err);
    throw err;
  }
}

export async function markAsReadActionByToken(
  token: string,
  id: number | string
): Promise<NotificationItem | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation MarkNotificationAsRead($id: Int!) {
        update_aa_s_notifications_by_pk(
          pk_columns: { id: $id }
          _set: { read: true }
        ) {
          id
          title
          message
          type
          priority
          read
          timestamp
          action_url
          related_entity_type
          related_entity_name
          related_entity_id
          created_at
        }
      }
    `;

    const res = await updateGraphQL({
      mutation,
      id: Number(id),
      attrs: { read: true },
      operationName: "MarkNotificationAsRead",
    });

    return res ? mapDbNotification(res) : null;
  } catch (err) {
    console.error("Hasura markAsReadActionByToken error:", err);
    throw err;
  }
}

export async function markAllAsReadActionByToken(token: string): Promise<void> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const whereCondition: Record<string, any> = {
      read: { _eq: false },
      account_company_id: { _eq: companyId },
    };

    const mutation = `
      mutation MarkAllNotificationsAsRead($where: aa_s_notifications_bool_exp!) {
        update_aa_s_notifications(
          where: $where
          _set: { read: true }
        ) {
          affected_rows
        }
      }
    `;

    await sendGraphQL({
      mutation,
      variables: { where: whereCondition },
      operationName: "MarkAllNotificationsAsRead",
    });
  } catch (err) {
    console.error("Hasura markAllAsReadActionByToken error:", err);
    throw err;
  }
}

export async function createNotificationActionByToken(
  token: string,
  input: CreateNotificationInput
): Promise<NotificationItem | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation CreateNotification($object: aa_s_notifications_insert_input!) {
        insert_aa_s_notifications_one(object: $object) {
          id
          title
          message
          type
          priority
          read
          timestamp
          action_url
          related_entity_type
          related_entity_name
          related_entity_id
          created_at
        }
      }
    `;

    const res = await insertGraphQL({
      mutation,
      input: {
        account_company_id: companyId,
        title: input.title,
        message: input.message || "",
        type: input.type || "lead_scored",
        priority: input.priority || "normal",
        read: false,
        timestamp: new Date().toISOString(),
        action_url: input.action_url,
        related_entity_type: input.related_entity_type,
        related_entity_name: input.related_entity_name,
        related_entity_id: input.related_entity_id,
      },
      operationName: "CreateNotification",
    });

    return res ? mapDbNotification(res) : null;
  } catch (err) {
    console.error("Hasura createNotificationActionByToken error:", err);
    throw err;
  }
}
