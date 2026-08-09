import { TaskItem, TaskType, TaskPriority, TaskStatus } from '@/lib/types';
import { MOCK_TASKS } from '@/mock-data/tasks';

export type { TaskItem, TaskType, TaskPriority, TaskStatus };

export async function getTasks(params?: { type?: string; status?: string; search?: string }): Promise<TaskItem[]> {
  let list = [...MOCK_TASKS];
  if (params?.type && params.type !== "all") {
    list = list.filter(t => t.type === params.type);
  }
  if (params?.status && params.status !== "all") {
    list = list.filter(t => t.status === params.status);
  }
  if (params?.search) {
    const s = params.search.toLowerCase();
    list = list.filter(t =>
      t.title.toLowerCase().includes(s) ||
      (t.related_company && t.related_company.toLowerCase().includes(s)) ||
      (t.related_lead_name && t.related_lead_name.toLowerCase().includes(s))
    );
  }
  return list;
}

export async function createTask(newTask: Omit<TaskItem, 'id' | 'created_at'>): Promise<TaskItem> {
  const item: TaskItem = {
    ...newTask,
    id: `task-${Date.now()}`,
    created_at: new Date().toISOString().split('T')[0],
  };
  MOCK_TASKS.unshift(item);
  return item;
}

export async function updateTaskStatus(id: string, newStatus: TaskStatus): Promise<TaskItem> {
  const item = MOCK_TASKS.find(t => t.id === id);
  if (!item) throw new Error("Task not found");
  item.status = newStatus;
  return item;
}

export async function deleteTask(id: string): Promise<boolean> {
  const idx = MOCK_TASKS.findIndex(t => t.id === id);
  if (idx !== -1) {
    MOCK_TASKS.splice(idx, 1);
    return true;
  }
  return false;
}

export const taskServices = {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
};
