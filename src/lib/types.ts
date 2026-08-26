export type UserRole = 'SuperAdmin' | 'Admin' | 'Editor' | 'Viewer';

export interface SouthernAfricanCountry {
  code: string;
  name: string;
  currency: string;
  currency_symbol: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: string | number;
  currency?: string;
  currency_symbol?: string;
  country_code?: string;
  country_name?: string;
  interval?: 'month' | 'year';
  description?: string;
  paypal_plan_id?: string;
  features?: any[];
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DecisionMaker {
  id: string | number;
  apollo_id?: string | null;
  name: string;
  job_title?: string | null;
  title?: string | null;
  company_id?: number | null;
  company_name?: string | null;
  company?: any;
  industry?: string | null;
  department?: string | null;
  seniority?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  score?: number | null;
  linkedin_url?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  apollo_enriched?: boolean | null;
  has_email?: boolean | null;
  has_phone?: boolean | null;
  email_status?: string | null;
  lead_list?: any[];
  timeline_event_list?: any[];
  verified?: boolean;
  decision_power?: string;
  score_factors?: { fit_score?: number; intent_score?: number; activity_score?: number; timing_score?: number;[key: string]: any };
  timeline?: any;
  created_at?: string;
  updated_at?: string;
}

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

export interface AccountCompany {
  id: number;
  name: string;
  domain?: string | null;
  logo_url?: string | null;
  subscription_tier?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AaUser {
  id: number;
  account_company_id: number;
  auth_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  account_company?: AccountCompany | null;
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
  account_company_id?: number;
  account_company?: AccountCompany | null;
  fname: string;
  lname: string;
  name?: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string | null;
  auth_id?: string;
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

export interface OrganizationNote {
  id: string;
  organization_id: string;
  author: string;
  content: string;
  created_at: string;
}

export interface OrganizationActivity {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'Email' | 'Call' | 'Meeting' | 'StatusChange' | 'Note';
}

// Organization Model matching public.aa_s_organizations PostgreSQL table
export interface Organization {
  id: string | number;
  apollo_id?: string | null;
  name: string;
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
  employee_count?: number | null;
  revenue?: string | null;
  annual_revenue?: string | number | null;
  organization_revenue_str?: string | null;
  organization_revenue?: number | null;
  primary_industry?: string | null;
  industry?: string | null;
  industry_tag_id?: string | null;
  raw_address?: string | null;
  street_address?: string | null;
  headquarters_location?: string | null;
  location?: string | null;
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
  status?: 'Active' | 'Prospect' | 'Customer' | 'Churned' | string;
  lead_status?: 'Cold' | 'Warm' | 'Hot' | string;
  score?: number;
  last_activity?: string;
  created_at?: string;
  updated_at?: string;
  industry_list?: Array<{ id: string | number; name?: string; industry?: { id?: string | number; name: string } }>;
  keywords_list?: Array<{ id: string | number; keyword?: { name: string } }>;
  language_list?: Array<{ id: string | number; language?: { name: string } }>;
  naics_code_list?: Array<{ id: string | number; organization_id?: number | null; naics_code?: string | null; code?: string; title?: string }>;
  sic_code_list?: Array<{ id: string | number; organization_id?: number | null; sic_code?: string | null; code?: string; title?: string }>;
  notes?: OrganizationNote[];
  activities?: OrganizationActivity[];
}

export interface IndustrySignal {
  id: number;
  industry_id: number;
  country?: string | null;
  metric: string;
  unit?: string | null;
  data_type?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  yoy?: number | null;
  mom?: number | null;
  qoq?: number | null;
  trend?: string | null;
  sales_signal?: string | null;
  summary?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  published_at?: string | null;
  retrieved_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  industry?: Industry | null;
}

export interface Industry {
  id: string | number;
  name: string;
  active?: boolean;
  organization_count?: number;
  campaign_target_count?: number;
  campaign_target_list?: any[];
  organization_list?: any[];
  industry_signal_count?: number;
  industry_signal_list?: IndustrySignal[];
  market_growth?: string;
  market_size?: string;
  avg_deal_size?: string;
  total_pipeline_value?: string;
  risk_level?: 'Low' | 'Medium' | 'High';
  naics_code?: string;
  sic_code?: string;
  description?: string;
  historical_growth?: Array<{ year: string; rate: number; marketSize: number }>;
}

export interface Keyword {
  id: string | number;
  name: string;
  organization_list?: any[];
  usage_count?: number;
  organization_count?: number;
}

export interface Language {
  id: string | number;
  name: string;
  code?: string;
  organization_list?: any[];
  organization_count?: number;
  org_count?: number;
}

export interface NAICSCode {
  id: string | number;
  organization_id?: number | null;
  naics_code?: string;
  code?: string;
  title?: string;
  organization_count?: number;
  organization?: Organization | null;
}

export interface SICCode {
  id: string | number;
  organization_id?: number | null;
  sic_code?: string;
  code?: string;
  title?: string;
  organization_count?: number;
  organization?: Organization | null;
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
export type LeadTemperature = 'COLD' | 'WARM' | 'HOT' | 'Cold' | 'Warm' | 'Hot';
export type LeadStage = 'New' | 'Cold' | 'Contacted' | 'Warm Engaged' | 'Hot Qualified' | 'Demo Scheduled' | 'Closed Won' | 'Lost' | 'Engaged' | 'Qualified' | 'Unresponsive' | 'Warm' | 'Hot' | 'Customer';

export interface Lead {
  id: number;
  account_company_id: number;
  person_id?: number | null;
  person_name?: string | null;
  company_name?: string | null;
  industry?: string | null;
  lead_temperature?: LeadTemperature | string | null;
  lead_score?: number | null;
  stage?: LeadStage | string | null;
  last_contact?: string | null;
  next_followup?: string | null;
  assigned_user?: string | null;
  followup_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  // Relationships
  account_company?: AccountCompany | null;
  person?: DecisionMaker | null;
  followup_item_list?: any[];
  outreach_activity_list?: any[];
  task_list?: any[];
}

// ─── Outreach & Campaign Models ──────────────────────────────────────────────
export type OutreachChannel = 'Email' | 'Phone' | 'LinkedIn' | 'Meeting';
export type OutreachStatus = 'Sent' | 'Delivered' | 'Opened' | 'Clicked' | 'Replied' | 'Bounced' | 'Connected' | 'Completed' | 'Meeting Set' | 'Scheduled' | string;

export interface OutreachActivity {
  id: number | string;
  account_company_id: number;
  lead_id?: number | null;
  campaign_id?: number | null;
  date: string;
  channel: OutreachChannel;
  lead_name?: string | null;
  company_name?: string | null;
  subject_or_type?: string | null;
  status: OutreachStatus;
  response_preview?: string | null;
  next_followup?: string | null;
  created_at?: string;
  // Relationships
  account_company?: AccountCompany | null;
  campaign?: Campaign | null;
  lead?: Lead | null;
  // UI & compatibility aliases
  timestamp?: string;
  type?: string;
  recipient_name?: string;
  recipient_title?: string;
  recipient_email?: string;
  recipient_org?: string;
  subject?: string;
  message?: string;
  response?: string;
  outcome?: string;
  followup_days?: number;
  campaign_name?: string;
  assigned_to?: string;
  tags?: string[];
}

export interface CampaignSequenceStep {
  id?: number;
  campaign_id?: number;
  day: number;
  type: 'Email' | 'Follow-up' | 'Case Study' | 'Final Message';
  subject: string;
  preview: string;
}

export type CampaignStatus = 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
export type SequenceStepType = 'Introduction' | 'Follow-up' | 'Case Study' | 'Final Message' | 'Custom';

export interface SequenceStep {
  id: string;
  day: number;
  step_number?: number;
  type: SequenceStepType;
  subject: string;
  body: string;
  enabled: boolean;
}

export interface CampaignAudience {
  industries: string[];
  companies: string[];
  people: string[];
  estimated_contacts: number;
}

export interface CampaignRules {
  stop_on_reply: boolean;
  stop_on_meeting_booked: boolean;
  update_lead_status: boolean;
  create_follow_up_task: boolean;
  exclude_customers: boolean;
  exclude_competitors: boolean;
  track_opens?: boolean;
}

export interface CampaignSchedule {
  send_days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  send_time_from: string;
  send_time_to: string;
  send_time?: string;
  timezone: string;
  start_date: string;
}

export interface Campaign {
  id: string | number;
  account_company_id?: number;
  name: string;
  description?: string;
  status: CampaignStatus;
  target_companies_count?: number;
  target_people_count?: number;
  audience?: CampaignAudience;
  sequence?: SequenceStep[];
  sequence_steps?: CampaignSequenceStep[];
  target_industry_list?: any[];
  outreach_activity_list?: any[];
  rules?: CampaignRules;
  schedule?: CampaignSchedule | string;
  stop_on_reply?: boolean;
  stop_on_meeting?: boolean;
  update_lead_status?: boolean;
  create_followup_task?: boolean;
  total_contacts?: number;
  emails_sent?: number;
  sent_count?: number;
  open_rate?: number;
  reply_rate?: number;
  meetings_booked?: number;
  unsubscribes?: number;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

// ─── AI Personalized Messaging Models ───────────────────────────────────────
export type MessageType =
  | 'email_subject'
  | 'initial_email'
  | 'followup_1'
  | 'followup_2'
  | 'final'
  | 'linkedin'
  | 'call_script';

export interface PersonContext {
  first_name: string;
  last_name: string;
  full_name: string;
  title: string;
  department: string;
  seniority: 'C-Suite' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor' | string;
}

export interface CompanyContext {
  name: string;
  industry: string;
  size: 'Startup (<50)' | 'SMB (50-250)' | 'Mid-Market (250-1000)' | 'Enterprise (1000+)' | string;
  location: string;
  country?: string;
  recent_news?: string;
  challenges?: string[];
}

export interface GeneratedMessage {
  type: MessageType;
  label: string;
  subject?: string;
  content: string;
  personalization_score: number;
  hooks_used: string[];
}

export interface MessageGenerationResult {
  person: PersonContext;
  company: CompanyContext;
  messages: GeneratedMessage[];
  avg_score: number;
}

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
  id: number | string;
  lead_id?: number | null;
  lead_name: string;
  person_name?: string;
  person_title?: string;
  company_name: string;
  organization_name?: string;
  industry?: string;
  lead_temperature: LeadTemperature;
  sequence_step: number;
  total_sequence_steps: number;
  last_contact_date: string;
  next_followup_date: string;
  followup_count: number;
  status: 'Scheduled' | 'Pending Today' | 'Sent' | 'Response Received' | 'Escalated to HOT' | 'Escalated' | string;
  assigned_user: string;
  assigned_to?: string;
  assigned_rep?: string;
  sequence_name?: string;
  step_number?: number;
  total_steps?: number;
  follow_up_count?: number;
  next_follow_up_date?: string;
  days_since_last_contact?: number;
  is_overdue?: boolean;
  subject?: string;
  channel?: string;
  message_preview?: string;
  created_at?: string;
}

export interface DailyFollowUpRule {
  id: number;
  name: string;
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

// ─── Dashboard & Analytics Point Models ──────────────────────────────────────
export interface DashboardKPIs {
  companies: {
    total: number;
    newToday: number;
    newThisMonth: number;
  };
  industries: {
    total: number;
    topIndustries: Array<{ name: string; count: number }>;
  };
  people: {
    totalDecisionMakers: number;
  };
  leads: {
    total: number;
    cold: number;
    warm: number;
    hot: number;
  };
  outreach: {
    emailsSent: number;
    callsMade: number;
    followupsPending: number;
    meetingsScheduled: number;
  };
}

export interface ActivityFeedItem {
  id: string | number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  badgeColor?: string;
}

export interface GrowthTrendPoint {
  month: string;
  organizations: number;
  leads: number;
  revenue: number;
}

export interface IndustryDistributionPoint {
  name: string;
  value: number;
  color: string;
}

export interface LocationDistributionPoint {
  country: string;
  count: number;
}

export interface SizeDistributionPoint {
  range: string;
  count: number;
}

export interface PipelineStagePoint {
  stage: string;
  count: number;
  value: number;
}

export interface OutreachPerfPoint {
  day: string;
  sent: number;
  opened: number;
  clicked: number;
}

export interface DailyAutomationRule {
  id: string | number;
  name: string;
  description?: string;
  condition?: string;
  action?: string;
  active: boolean;
}

export interface AutomationExecutionResult {
  executed_at: string;
  emails_sent: number;
  sequences_stopped: number;
  leads_escalated: number;
  tasks_created: number;
  log_entries: Array<{
    timestamp: string;
    type: 'info' | 'success' | 'warning' | 'escalation' | string;
    message: string;
  }>;
}

