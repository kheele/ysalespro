-- =============================================================================
-- Hasura PostgreSQL Migration: SalesPro Missing Tables & Schema Setup
-- Generated from SalesPro TypeScript domain models & Hasura metadata diff
-- =============================================================================

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Organization & Core Entities
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sfc_organizations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  logo_url TEXT,
  industry VARCHAR(255),
  employee_count INT DEFAULT 0,
  revenue VARCHAR(100),
  location VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Prospect',
  lead_status VARCHAR(50) DEFAULT 'Cold',
  score INT DEFAULT 0,
  is_contractor BOOLEAN DEFAULT false,
  last_activity VARCHAR(255),
  founded_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sfc_users (
  id BIGSERIAL PRIMARY KEY,
  auth_id VARCHAR(255) UNIQUE,
  fname VARCHAR(100) NOT NULL,
  lname VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'Admin',
  avatar_url TEXT,
  phone VARCHAR(50),
  organization_id BIGINT REFERENCES public.sfc_organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sfc_contractor_relationships (
  id BIGSERIAL PRIMARY KEY,
  contractor_organization_id BIGINT REFERENCES public.sfc_organizations(id) ON DELETE CASCADE,
  target_organization_id BIGINT REFERENCES public.sfc_organizations(id) ON DELETE CASCADE,
  email VARCHAR(255),
  invitation_token VARCHAR(255) UNIQUE,
  invitation_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Billing & Subscription Management
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sfc_billing_plans (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sfc_subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  organization_id BIGINT REFERENCES public.sfc_organizations(id) ON DELETE CASCADE,
  plan_id VARCHAR(100) REFERENCES public.sfc_billing_plans(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sfc_permissions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES public.sfc_organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  feature VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, role, feature)
);

-- -----------------------------------------------------------------------------
-- 3. Lead & Decision Maker Intelligence Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.aa_s_decision_makers (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'person-' || gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  organization_id VARCHAR(100),
  organization_name VARCHAR(255),
  industry VARCHAR(255),
  department VARCHAR(100),
  seniority VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  linkedin_url TEXT,
  location VARCHAR(255),
  decision_power VARCHAR(50) DEFAULT 'VP/Director',
  verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  score INT DEFAULT 50,
  score_factors JSONB DEFAULT '{}'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.aa_s_leads (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'lead-' || gen_random_uuid(),
  contact_name VARCHAR(255) NOT NULL,
  contact_title VARCHAR(255),
  contact_avatar TEXT,
  contact_email VARCHAR(255),
  organization_id VARCHAR(100),
  organization_name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  pipeline_stage VARCHAR(50) NOT NULL DEFAULT 'Cold',
  temperature VARCHAR(50) NOT NULL DEFAULT 'Cold',
  score INT DEFAULT 50,
  deal_value NUMERIC(12, 2) DEFAULT 0,
  probability INT DEFAULT 10,
  last_contact VARCHAR(100),
  next_followup VARCHAR(100),
  followup_count INT DEFAULT 0,
  assigned_to VARCHAR(255) DEFAULT 'Unassigned',
  tags JSONB DEFAULT '[]'::jsonb,
  next_step TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. Campaigns, Sequences & Outreach Activity
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.aa_s_campaigns (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'camp-' || gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  audience JSONB DEFAULT '{}'::jsonb,
  sequence JSONB DEFAULT '[]'::jsonb,
  rules JSONB DEFAULT '{}'::jsonb,
  schedule JSONB DEFAULT '{}'::jsonb,
  total_contacts INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  open_rate INT DEFAULT 0,
  reply_rate INT DEFAULT 0,
  meetings_booked INT DEFAULT 0,
  unsubscribes INT DEFAULT 0,
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  created_by VARCHAR(255),
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.aa_s_outreach_activities (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'out-' || gen_random_uuid(),
  channel VARCHAR(50) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_title VARCHAR(255),
  recipient_org VARCHAR(255),
  recipient_email VARCHAR(255),
  subject VARCHAR(500),
  message TEXT,
  date VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'Sent',
  response TEXT,
  outcome TEXT,
  next_followup VARCHAR(50),
  followup_days INT DEFAULT 3,
  assigned_to VARCHAR(255),
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. Tasks & Notifications
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.aa_s_tasks (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'task-' || gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'Email',
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
  status VARCHAR(50) NOT NULL DEFAULT 'To Do',
  due_date VARCHAR(50) NOT NULL,
  due_time VARCHAR(50),
  assigned_to VARCHAR(255) NOT NULL,
  related_lead_name VARCHAR(255),
  related_company VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.aa_s_notifications (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'notif-' || gen_random_uuid(),
  user_id BIGINT REFERENCES public.sfc_users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  priority VARCHAR(50) DEFAULT 'medium',
  action_url TEXT,
  related_entity JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Indexes for High Performance Querying
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_sfc_users_org_id ON public.sfc_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_sfc_users_auth_id ON public.sfc_users(auth_id);
CREATE INDEX IF NOT EXISTS idx_aa_s_leads_org_id ON public.aa_s_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_aa_s_leads_stage ON public.aa_s_leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_aa_s_decision_makers_org ON public.aa_s_decision_makers(organization_id);
CREATE INDEX IF NOT EXISTS idx_aa_s_outreach_status ON public.aa_s_outreach_activities(status);
CREATE INDEX IF NOT EXISTS idx_aa_s_tasks_assigned ON public.aa_s_tasks(assigned_to);

COMMIT;
