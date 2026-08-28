import { LeadStage, LeadTemperature, OutreachChannel, NotificationType, NotificationPriority } from './types';

export type GetLeadsParams = {
  stage?: LeadStage;
  lead_temperature?: LeadTemperature;
  search?: string;
  assigned_user?: string;
  company_name?: string;
};

export type GetTasksParams = {
  type?: string;
  status?: string;
  search?: string;
  assigned_to?: string;
  assigned_to_id?: number;
  lead_id?: number;
  company_id?: number;
};

export type GetOutreachParams = {
  channel?: OutreachChannel | 'all';
  status?: string;
  search?: string;
  lead_id?: number;
  assigned_to?: string;
};

export type GetPeopleParams = {
  search?: string;
  industry?: string;
  organization_name?: string;
  title?: string;
  department?: string;
  seniority?: string;
  location?: string;
  organization_id?: string | number;
  limit?: number;
  offset?: number;
};

export interface CreateNotificationInput {
  title: string;
  message?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  action_url?: string;
  related_entity_type?: string;
  related_entity_name?: string;
  related_entity_id?: string;
}

export interface CreateUserInput {
  auth_id: string;
  email: string;
  fname?: string;
  lname?: string;
  phone?: string;
  role?: string;
  avatar_url?: string;
  account_company_id?: number;
  account_company?: string | { name: string };
  invitation_token?: string;
}

export interface UpdateUserInput {
  fname?: string;
  lname?: string;
  email?: string;
  role?: string;
  avatar_url?: string;
  is_active?: boolean;
  account_company_id?: number;
}
