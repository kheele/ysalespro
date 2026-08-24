'use server';

import { listGraphQL, getGraphQLOne, insertGraphQL, updateGraphQL, deleteGraphQL } from "@/graphql";
import { TaskItem, TaskPriority, TaskStatus, TaskType } from '@/lib/types';
import { GetTasksParams } from '@/lib/types_params';
import { getAccountCompanyIdFromClaims } from '@/lib/auth-utils';

function mapDbTask(t: any): TaskItem {
  return {
    id: t.id,
    title: t.title || "Untitled Task",
    type: (t.type as TaskType) || "Follow-up",
    priority: (t.priority as TaskPriority) || "Medium",
    status: (t.status as TaskStatus) || "To Do",
    due_date: t.due_date ? new Date(t.due_date).toISOString().split("T")[0] : "",
    due_time: t.due_time || "",
    assigned_to: t.assigned_to || "Alex Rivers",
    related_lead_id: t.related_lead_id,
    related_lead_name: t.related_lead_name || t.related_lead?.person_name || "",
    related_company: t.related_company || t.related_lead?.company_name || "",
    notes: t.notes || "",
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

export async function getTasksActionByToken(
  token: string,
  params?: GetTasksParams
): Promise<TaskItem[]> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const whereConditions: Record<string, any>[] = [
      { account_company_id: { _eq: companyId } }
    ];

    if (params?.type && params.type !== "all") {
      whereConditions.push({ type: { _eq: params.type } });
    }

    if (params?.status && params.status !== "all") {
      whereConditions.push({ status: { _eq: params.status } });
    }

    if (params?.assigned_to && params.assigned_to !== "all") {
      whereConditions.push({ assigned_to: { _eq: params.assigned_to } });
    }

    if (params?.lead_id) {
      whereConditions.push({ related_lead_id: { _eq: params.lead_id } });
    }

    if (params?.search) {
      const s = `%${params.search}%`;
      whereConditions.push({
        _or: [
          { title: { _ilike: s } },
          { related_company: { _ilike: s } },
          { related_lead_name: { _ilike: s } },
          { notes: { _ilike: s } },
          { assigned_to: { _ilike: s } },
        ],
      });
    }

    const where = { _and: whereConditions };

    const query = `
      query GetTasks($where: aa_s_tasks_bool_exp) {
        aa_s_tasks(where: $where, order_by: [{ created_at: desc }]) {
          id
          title
          type
          priority
          status
          due_date
          due_time
          assigned_to
          related_lead_id
          related_lead_name
          related_company
          notes
          created_at
          updated_at
          related_lead {
            id
            person_name
            company_name
          }
        }
      }
    `;

    const data = await listGraphQL({ query, variables: { where }, operationName: "GetTasks" });
    return Array.isArray(data) ? data.map(mapDbTask) : [];
  } catch (err) {
    console.error("Hasura getTasksActionByToken error:", err);
    throw err;
  }
}

export async function getTaskByIdActionByToken(
  token: string,
  id: string | number
): Promise<TaskItem | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const query = `
      query GetTaskById($id: Int!) {
        aa_s_tasks_by_pk(id: $id) {
          id
          title
          type
          priority
          status
          due_date
          due_time
          assigned_to
          related_lead_id
          related_lead_name
          related_company
          notes
          created_at
          updated_at
          related_lead {
            id
            person_name
            company_name
          }
        }
      }
    `;
    const res = await getGraphQLOne({ query, variables: { id: Number(id) }, operationName: "GetTaskById" });
    return res ? mapDbTask(res) : null;
  } catch (err) {
    console.error("Hasura getTaskByIdActionByToken error:", err);
    throw err;
  }
}

export async function createTaskActionByToken(
  token: string,
  newTask: Partial<TaskItem>
): Promise<TaskItem | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation InsertTask($object: aa_s_tasks_insert_input!) {
        insert_aa_s_tasks_one(object: $object) {
          id
          title
          type
          priority
          status
          due_date
          due_time
          assigned_to
          related_lead_id
          related_lead_name
          related_company
          notes
          created_at
          updated_at
        }
      }
    `;

    const res = await insertGraphQL({
      mutation,
      input: {
        account_company_id: companyId,
        title: newTask.title || "New Task",
        type: newTask.type || "Follow-up",
        priority: newTask.priority || "Medium",
        status: newTask.status || "To Do",
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : new Date().toISOString(),
        due_time: newTask.due_time || undefined,
        assigned_to: newTask.assigned_to || "Alex Rivers",
        related_lead_id: newTask.related_lead_id ? Number(newTask.related_lead_id) : undefined,
        related_lead_name: newTask.related_lead_name || undefined,
        related_company: newTask.related_company || undefined,
        notes: newTask.notes || "",
      },
      operationName: "InsertTask",
    });

    return res ? mapDbTask(res) : null;
  } catch (err) {
    console.error("Hasura createTaskActionByToken error:", err);
    throw err;
  }
}

export async function updateTaskStatusActionByToken(
  token: string,
  id: string | number,
  status: TaskStatus
): Promise<TaskItem | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation UpdateTaskStatus($id: Int!, $status: String!) {
        update_aa_s_tasks_by_pk(
          pk_columns: { id: $id }
          _set: { status: $status }
        ) {
          id
          title
          type
          priority
          status
          due_date
          due_time
          assigned_to
          related_lead_id
          related_lead_name
          related_company
          notes
          created_at
          updated_at
        }
      }
    `;

    const res = await updateGraphQL({
      mutation,
      id: Number(id),
      attrs: { status },
      operationName: "UpdateTaskStatus",
    });

    return res ? mapDbTask(res) : null;
  } catch (err) {
    console.error("Hasura updateTaskStatusActionByToken error:", err);
    throw err;
  }
}

export async function updateTaskActionByToken(
  token: string,
  id: string | number,
  updates: Partial<TaskItem>
): Promise<TaskItem | null> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation UpdateTask($id: Int!, $_set: aa_s_tasks_set_input!) {
        update_aa_s_tasks_by_pk(
          pk_columns: { id: $id }
          _set: $_set
        ) {
          id
          title
          type
          priority
          status
          due_date
          due_time
          assigned_to
          related_lead_id
          related_lead_name
          related_company
          notes
          created_at
          updated_at
        }
      }
    `;

    const _set: Record<string, any> = {};
    if (updates.title) _set.title = updates.title;
    if (updates.type) _set.type = updates.type;
    if (updates.priority) _set.priority = updates.priority;
    if (updates.status) _set.status = updates.status;
    if (updates.due_date) _set.due_date = new Date(updates.due_date).toISOString();
    if (updates.due_time !== undefined) _set.due_time = updates.due_time;
    if (updates.assigned_to) _set.assigned_to = updates.assigned_to;
    if (updates.notes !== undefined) _set.notes = updates.notes;

    const res = await updateGraphQL({
      mutation,
      id: Number(id),
      attrs: _set,
      operationName: "UpdateTask",
    });

    return res ? mapDbTask(res) : null;
  } catch (err) {
    console.error("Hasura updateTaskActionByToken error:", err);
    throw err;
  }
}

export async function deleteTaskActionByToken(
  token: string,
  id: string | number
): Promise<boolean> {
  const companyId = await getAccountCompanyIdFromClaims(token);
  if (!companyId) {
    throw new Error("Unauthorized: Account company ID missing from token claims");
  }

  try {
    const mutation = `
      mutation DeleteTask($id: Int!) {
        delete_aa_s_tasks_by_pk(id: $id) {
          id
        }
      }
    `;

    const res = await deleteGraphQL({
      mutation,
      id: Number(id),
      operationName: "DeleteTask",
    });

    return !!res;
  } catch (err) {
    console.error("Hasura deleteTaskActionByToken error:", err);
    throw err;
  }
}
