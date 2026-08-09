-- =============================================================================
-- Hasura Complete Schema Migration for aa_s_organizations & Metadata Tables
-- =============================================================================

BEGIN;

-- 1. Organizations Table (Full Column Definition from Organization service)
CREATE TABLE IF NOT EXISTS public.aa_s_organizations (
  id SERIAL PRIMARY KEY,
  apollo_id TEXT UNIQUE,
  name TEXT,
  website_url TEXT,
  angellist_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  crunchbase_url TEXT,
  primary_domain TEXT,
  logo_url TEXT,
  phone TEXT,
  sanitized_phone TEXT,
  primary_phone_number TEXT,
  primary_phone_source TEXT,
  primary_phone_sanitized TEXT,
  alexa_ranking INT,
  linkedin_uid BIGINT,
  founded_year INT,
  publicly_traded_symbol TEXT,
  publicly_traded_exchange TEXT,
  market_cap TEXT,
  estimated_num_employees INT,
  organization_revenue_str TEXT,
  organization_revenue BIGINT,
  primary_industry TEXT,
  industry_tag_id TEXT,
  raw_address TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  snippets_loaded BOOLEAN DEFAULT FALSE,
  retail_location_count INT DEFAULT 0,
  show_intent BOOLEAN DEFAULT FALSE,
  intent_strength TEXT,
  has_intent_signal_account BOOLEAN DEFAULT FALSE,
  intent_signal_account TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lookup / Classification Tables
CREATE TABLE IF NOT EXISTS public.aa_s_industries (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS public.aa_s_keywords (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS public.aa_s_languages (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE
);

-- 3. Junction / Relationship Tables (as defined in Hasura metadata)

CREATE TABLE IF NOT EXISTS public.aa_s_organization_industries (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES public.aa_s_organizations(id) ON DELETE CASCADE,
  industry_id INT REFERENCES public.aa_s_industries(id) ON DELETE CASCADE,
  is_secondary BOOLEAN DEFAULT FALSE,
  industry_tag_hash_key TEXT
);

CREATE TABLE IF NOT EXISTS public.aa_s_organization_keywords (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES public.aa_s_organizations(id) ON DELETE CASCADE,
  keyword_id INT REFERENCES public.aa_s_keywords(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.aa_s_organization_languages (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES public.aa_s_organizations(id) ON DELETE CASCADE,
  language_id INT REFERENCES public.aa_s_languages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.aa_s_organization_naics_codes (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES public.aa_s_organizations(id) ON DELETE CASCADE,
  naics_code TEXT
);

CREATE TABLE IF NOT EXISTS public.aa_s_organization_sic_codes (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES public.aa_s_organizations(id) ON DELETE CASCADE,
  sic_code TEXT
);

-- ==============================================================================
-- 4. People (Contacts / Decision Makers) — matches Person interface
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.aa_s_people (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  job_title     TEXT,
  company_id    INT REFERENCES public.aa_s_organizations(id) ON DELETE SET NULL,
  company_name  TEXT,
  industry      TEXT,
  department    TEXT,
  seniority     TEXT,
  email         TEXT,
  phone         TEXT,
  location      TEXT,
  score         INT DEFAULT 0,
  linkedin_url  TEXT,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- matches PersonTimelineEvent interface
CREATE TABLE IF NOT EXISTS public.aa_s_person_timeline_events (
  id         SERIAL PRIMARY KEY,
  person_id  INT REFERENCES public.aa_s_people(id) ON DELETE CASCADE,
  type       TEXT CHECK (type IN ('Email','Call','Meeting','Note','Task')),
  title      TEXT,
  date       TIMESTAMPTZ,
  details    TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. Leads — matches Lead interface
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.aa_s_leads (
  id               SERIAL PRIMARY KEY,
  person_id        INT REFERENCES public.aa_s_people(id) ON DELETE SET NULL,
  person_name      TEXT,
  company_name     TEXT,
  industry         TEXT,
  lead_temperature TEXT CHECK (lead_temperature IN ('COLD','WARM','HOT')) DEFAULT 'COLD',
  lead_score       INT DEFAULT 0,
  stage            TEXT DEFAULT 'Cold',
  last_contact     TIMESTAMPTZ,
  next_followup    TIMESTAMPTZ,
  assigned_user    TEXT,
  followup_count   INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. Outreach Activities — matches OutreachActivity interface
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.aa_s_outreach_activities (
  id               SERIAL PRIMARY KEY,
  lead_id          INT REFERENCES public.aa_s_leads(id) ON DELETE SET NULL,
  date             TIMESTAMPTZ,
  channel          TEXT CHECK (channel IN ('Email','Phone','LinkedIn','Meeting')),
  lead_name        TEXT,
  company_name     TEXT,
  subject_or_type  TEXT,
  status           TEXT CHECK (status IN ('Sent','Delivered','Opened','Clicked','Replied','Bounced')),
  response_preview TEXT,
  next_followup    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. Campaigns — matches Campaign & CampaignSequenceStep interfaces
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.aa_s_campaigns (
  id                      SERIAL PRIMARY KEY,
  name                    TEXT NOT NULL,
  status                  TEXT CHECK (status IN ('Active','Draft','Completed','Paused')) DEFAULT 'Draft',
  target_companies_count  INT DEFAULT 0,
  target_people_count     INT DEFAULT 0,
  schedule                TEXT,
  stop_on_reply           BOOLEAN DEFAULT TRUE,
  stop_on_meeting         BOOLEAN DEFAULT TRUE,
  update_lead_status      BOOLEAN DEFAULT TRUE,
  create_followup_task    BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.aa_s_campaign_target_industries (
  id          SERIAL PRIMARY KEY,
  campaign_id INT REFERENCES public.aa_s_campaigns(id) ON DELETE CASCADE,
  industry_id INT REFERENCES public.aa_s_industries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.aa_s_campaign_sequence_steps (
  id          SERIAL PRIMARY KEY,
  campaign_id INT REFERENCES public.aa_s_campaigns(id) ON DELETE CASCADE,
  day         INT NOT NULL,
  type        TEXT CHECK (type IN ('Email','Follow-up','Case Study','Final Message')),
  subject     TEXT,
  preview     TEXT
);

-- ==============================================================================
-- 8. Follow-Up System — matches FollowUpItem & DailyFollowUpRule interfaces
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.aa_s_followup_items (
  id                    SERIAL PRIMARY KEY,
  lead_id               INT REFERENCES public.aa_s_leads(id) ON DELETE CASCADE,
  lead_name             TEXT,
  company_name          TEXT,
  lead_temperature      TEXT CHECK (lead_temperature IN ('COLD','WARM','HOT')),
  sequence_step         INT DEFAULT 1,
  total_sequence_steps  INT DEFAULT 1,
  last_contact_date     TIMESTAMPTZ,
  next_followup_date    TIMESTAMPTZ,
  followup_count        INT DEFAULT 0,
  status                TEXT CHECK (status IN ('Scheduled','Pending Today','Sent','Response Received','Escalated to HOT')) DEFAULT 'Scheduled',
  assigned_user         TEXT,
  created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.aa_s_daily_followup_rules (
  id          SERIAL PRIMARY KEY,
  rule_name   TEXT NOT NULL,
  condition   TEXT,
  action      TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. Tasks — matches TaskItem interface
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.aa_s_tasks (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  type             TEXT CHECK (type IN ('Call','Email','Meeting','Follow-up')),
  priority         TEXT CHECK (priority IN ('Low','Medium','High','Urgent')) DEFAULT 'Medium',
  status           TEXT CHECK (status IN ('To Do','In Progress','Completed','Cancelled')) DEFAULT 'To Do',
  due_date         TIMESTAMPTZ,
  due_time         TEXT,
  assigned_to      TEXT,
  related_lead_id  INT REFERENCES public.aa_s_leads(id) ON DELETE SET NULL,
  related_lead_name TEXT,
  related_company  TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. Notifications — matches NotificationItem interface
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.aa_s_notifications (
  id                    SERIAL PRIMARY KEY,
  type                  TEXT CHECK (type IN ('Follow-up due','New hot lead','Reply received','Campaign completed','Task overdue')),
  title                 TEXT NOT NULL,
  message               TEXT,
  timestamp             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  read                  BOOLEAN DEFAULT FALSE,
  priority              TEXT CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  action_url            TEXT,
  related_entity_type   TEXT CHECK (related_entity_type IN ('lead','company','campaign','task')),
  related_entity_name   TEXT,
  related_entity_id     TEXT,
  created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. User Devices (FCM push notification tokens) — matches UserDevice interface
-- ==============================================================================
CREATE SEQUENCE IF NOT EXISTS aa_s_user_devices_id_seq;

CREATE TABLE IF NOT EXISTS public.aa_s_user_devices (
  id         BIGINT PRIMARY KEY UNIQUE DEFAULT nextval('aa_s_user_devices_id_seq'),
  user_id    BIGINT NOT NULL,
  token      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMIT;

