// Centralized Domain Data Models & TypeScript Interfaces for YSalesPro Enterprise SaaS

// ─── User & Organization Management Models ──────────────────────────────────
export type UserRole = 'SuperAdmin' | 'Admin' | 'Editor' | 'Viewer';

export interface UserOrganization {
  id: string;
  name: string;
  is_contractor?: boolean;
  subscription?: Subscription | [Subscription] | null;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  plan?: {
    name: string;
  };
}

export interface UserPermission {
  id?: string;
  organization_id: string;
  role: UserRole;
  feature: string;
  enabled: boolean;
}

export interface User {
  id: string;
  fname: string;
  lname: string;
  name?: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string | null;
  auth_id?: string;
  organization_id?: string;
  organization?: UserOrganization | null;
  subscription?: Subscription | null;
  permissions?: Record<string, boolean>;
  unreadNotificationCount?: number;
  created_at?: string;
}

export interface UserDevice {
  id: number;
  user_id: number;
  token: string;
  created_at?: string;
}

// Organization Model matching public.aa_s_organizations PostgreSQL table
export interface Organization {
  id: number;
  apollo_id?: string | null;
  name?: string | null;
  website_url?: string | null;
  angellist_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  facebook_url?: string | null;
  crunchbase_url?: string | null;
  primary_domain?: string | null;
  logo_url?: string | null;
  phone?: string | null;
  sanitized_phone?: string | null;
  primary_phone_number?: string | null;
  primary_phone_source?: string | null;
  primary_phone_sanitized?: string | null;
  alexa_ranking?: number | null;
  linkedin_uid?: number | null;
  founded_year?: number | null;
  publicly_traded_symbol?: string | null;
  publicly_traded_exchange?: string | null;
  market_cap?: string | null;
  estimated_num_employees?: number | null;
  organization_revenue_str?: string | null;
  organization_revenue?: number | null;
  primary_industry?: string | null;
  industry_tag_id?: string | null;
  raw_address?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  snippets_loaded?: boolean;
  retail_location_count?: number;
  show_intent?: boolean;
  intent_strength?: string | null;
  has_intent_signal_account?: boolean;
  intent_signal_account?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Industry {
  id: number;
  name?: string | null;
}

export interface Keyword {
  id: number;
  name?: string | null;
}

export interface Language {
  id: number;
  name?: string | null;
}

export interface OrganizationIndustry {
  id: number;
  organization_id?: number | null;
  industry_id?: number | null;
  is_secondary?: boolean;
  industry_tag_hash_key?: string | null;
}

export interface OrganizationKeyword {
  id: number;
  organization_id?: number | null;
  keyword_id?: number | null;
}

export interface OrganizationLanguage {
  id: number;
  organization_id?: number | null;
  language_id?: number | null;
}

export interface OrganizationNaicsCode {
  id: number;
  organization_id?: number | null;
  naics_code?: string | null;
}

export interface OrganizationSicCode {
  id: number;
  organization_id?: number | null;
  sic_code?: string | null;
}

export interface Person {
  id: number;
  name: string;
  job_title: string;
  company_id: number;
  company_name: string;
  industry: string;
  department: string;
  seniority: string;
  email: string;
  phone: string;
  location: string;
  score: number;
  linkedin_url?: string;
  decision_factors?: string[];
  timeline?: PersonTimelineEvent[];
  created_at?: string;
  updated_at?: string;
}

export interface PersonTimelineEvent {
  id: number;
  person_id?: number;
  type: 'Email' | 'Call' | 'Meeting' | 'Note' | 'Task';
  title: string;
  date: string;
  details: string;
  created_at?: string;
}

// ─── Lead Management Models ──────────────────────────────────────────────────
export type LeadTemperature = 'COLD' | 'WARM' | 'HOT';
export type LeadStage = 'Cold' | 'Contacted' | 'Warm Engaged' | 'Hot Qualified' | 'Demo Scheduled' | 'Closed Won' | 'Lost';

export interface Lead {
  id: number;
  person_id?: number | null;
  person_name: string;
  company_name: string;
  industry: string;
  lead_temperature: LeadTemperature;
  lead_score: number;
  stage: LeadStage | string;
  last_contact: string;
  next_followup: string;
  assigned_user: string;
  followup_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Outreach & Campaign Models ──────────────────────────────────────────────
export type OutreachChannel = 'Email' | 'Phone' | 'LinkedIn' | 'Meeting';
export type OutreachStatus = 'Sent' | 'Delivered' | 'Opened' | 'Clicked' | 'Replied' | 'Bounced';

export interface OutreachActivity {
  id: number;
  lead_id?: number | null;
  date: string;
  channel: OutreachChannel;
  lead_name: string;
  company_name: string;
  subject_or_type: string;
  status: OutreachStatus;
  response_preview?: string;
  next_followup: string;
  created_at?: string;
}

export interface CampaignSequenceStep {
  id?: number;
  campaign_id?: number;
  day: number;
  type: 'Email' | 'Follow-up' | 'Case Study' | 'Final Message';
  subject: string;
  preview: string;
}

export interface Campaign {
  id: number;
  name: string;
  status: 'Active' | 'Draft' | 'Completed' | 'Paused';
  target_companies_count: number;
  target_people_count: number;
  sequence_steps?: CampaignSequenceStep[];
  schedule?: string;
  stop_on_reply?: boolean;
  stop_on_meeting?: boolean;
  update_lead_status?: boolean;
  create_followup_task?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── AI Personalized Messaging Models ───────────────────────────────────────
export type AIMessageType =
  | 'Email Subject'
  | 'Initial Outreach'
  | 'Follow-up'
  | 'Case Study Pitch'
  | 'LinkedIn Message'
  | 'Call Script'
  | 'Objection Handler';

export interface AIMessageRequest {
  company: {
    name: string;
    industry: string;
    employee_count: number;
    location: string;
    business_challenges?: string[];
  };
  person: {
    name: string;
    role: string;
    department: string;
    seniority: string;
  };
  message_type: AIMessageType;
}

export interface AIMessageResponse {
  message_type: AIMessageType;
  subject?: string;
  content: string;
  key_hooks_used: string[];
}

// ─── Follow-Up System Models ────────────────────────────────────────────────
export interface FollowUpItem {
  id: number;
  lead_id?: number | null;
  lead_name: string;
  company_name: string;
  lead_temperature: LeadTemperature;
  sequence_step: number;
  total_sequence_steps: number;
  last_contact_date: string;
  next_followup_date: string;
  followup_count: number;
  status: 'Scheduled' | 'Pending Today' | 'Sent' | 'Response Received' | 'Escalated to HOT';
  assigned_user: string;
  created_at?: string;
}

export interface DailyFollowUpRule {
  id: number;
  rule_name: string;
  condition: string;
  action: string;
  active: boolean;
  created_at?: string;
}

// ─── Task Management Models ─────────────────────────────────────────────────
export type TaskType = 'Call' | 'Email' | 'Meeting' | 'Follow-up';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';

export interface TaskItem {
  id: number;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  due_time?: string;
  assigned_to: string;
  related_lead_id?: number | null;
  related_lead_name?: string;
  related_company?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Notification Engine Models ──────────────────────────────────────────────
export type NotificationType =
  | 'Follow-up due'
  | 'New hot lead'
  | 'Reply received'
  | 'Campaign completed'
  | 'Task overdue';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: NotificationPriority;
  action_url?: string;
  related_entity_type?: 'lead' | 'company' | 'campaign' | 'task';
  related_entity_name?: string;
  related_entity_id?: string;
  created_at?: string;
}

// ─── Analytics & Report Models ──────────────────────────────────────────────
export interface CompanyAnalyticsReport {
  company_id: string;
  company_name: string;
  industry: string;
  employee_count: number;
  revenue: string;
  leads_count: number;
  deals_won: number;
  pipeline_value: string;
}

export interface IndustryAnalyticsReport {
  industry_name: string;
  company_count: number;
  total_leads: number;
  conversion_rate: string;
  avg_deal_size: string;
  growth_rate: string;
}

export interface LeadConversionReport {
  stage: string;
  count: number;
  conversion_rate: string;
  dropoff_rate: string;
  avg_days_in_stage: number;
}

export interface EmailPerformanceReport {
  campaign_name: string;
  emails_sent: number;
  delivered_percent: string;
  open_rate: string;
  click_rate: string;
  reply_rate: string;
  bounce_rate: string;
}

export interface OutreachPerformanceReport {
  channel: OutreachChannel;
  total_attempts: number;
  connected_count: number;
  connect_rate: string;
  meetings_booked: number;
  conversion_rate: string;
}

export interface SalesActivityReport {
  rep_name: string;
  emails_sent: number;
  calls_made: number;
  linkedin_messages: number;
  meetings_held: number;
  deals_closed: number;
  revenue_generated: string;
}

// ─── Generic Pagination Helpers ──────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}
