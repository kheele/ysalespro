import { UserPermission } from '@/lib/types';

export async function getPermissionsByOrganization(orgId: string | number): Promise<UserPermission[]> {
  return [];
}

export async function seedDefaultPermissions(orgId: string | number): Promise<void> {
  return;
}
