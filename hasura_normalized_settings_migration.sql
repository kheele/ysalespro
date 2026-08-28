-- =============================================================================
-- Hasura PostgreSQL Migration: Settings & App Constants Tables (aa_s_settings_*)
-- Splits application configuration and constants into 9 dedicated relational tables
-- with auto-seeding for each registered account company.
-- =============================================================================

BEGIN;

-- 1. Pipeline Stages Table
CREATE TABLE IF NOT EXISTS public.aa_s_settings_pipeline_stages (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_order INT NOT NULL DEFAULT 1,
  bg_color TEXT DEFAULT 'bg-slate-500/10',
  text_color TEXT DEFAULT 'text-slate-400',
  border_color TEXT DEFAULT 'border-slate-500/30',
  dot_color TEXT DEFAULT 'bg-slate-400',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_company_id, name)
);

-- 2. Lead Temperature Styling Table
CREATE TABLE IF NOT EXISTS public.aa_s_settings_lead_temperatures (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  badge_style TEXT NOT NULL,
  text_color TEXT DEFAULT 'text-blue-400',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_company_id, name)
);

-- 3. Campaign Template Sequence Steps Table
CREATE TABLE IF NOT EXISTS public.aa_s_settings_campaign_sequences (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  day INT NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('Email', 'Follow-up', 'Case Study', 'Final Message')) DEFAULT 'Email',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Campaign Default Automation Rules Table
CREATE TABLE IF NOT EXISTS public.aa_s_settings_campaign_rules (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL UNIQUE REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  stop_on_reply BOOLEAN DEFAULT true,
  stop_on_meeting_booked BOOLEAN DEFAULT true,
  update_lead_status BOOLEAN DEFAULT true,
  create_follow_up_task BOOLEAN DEFAULT true,
  exclude_customers BOOLEAN DEFAULT true,
  exclude_competitors BOOLEAN DEFAULT true,
  track_opens BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Campaign Default Schedules Table
CREATE TABLE IF NOT EXISTS public.aa_s_settings_campaign_schedules (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL UNIQUE REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  send_days JSONB DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]'::jsonb,
  send_time_from VARCHAR(10) DEFAULT '09:00',
  send_time_to VARCHAR(10) DEFAULT '17:00',
  timezone TEXT DEFAULT 'SAST (UTC+2 - Johannesburg / South Africa)',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Daily Follow-Up Automation Rules Table
CREATE TABLE IF NOT EXISTS public.aa_s_settings_daily_automation_rules (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition_desc TEXT NOT NULL,
  action_desc TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rule_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.aa_s_settings_notifications (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL UNIQUE REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  email_new_lead BOOLEAN DEFAULT true,
  email_followup BOOLEAN DEFAULT true,
  email_won BOOLEAN DEFAULT true,
  push_calls BOOLEAN DEFAULT false,
  push_meetings BOOLEAN DEFAULT true,
  push_pipeline BOOLEAN DEFAULT false,
  slack_hot_leads BOOLEAN DEFAULT true,
  slack_daily_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Appearance Settings Table
CREATE TABLE IF NOT EXISTS public.aa_s_settings_appearance (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL UNIQUE REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'Dark',
  sidebar_collapsed BOOLEAN DEFAULT false,
  compact_rows BOOLEAN DEFAULT true,
  animations BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Security Settings Table
CREATE TABLE IF NOT EXISTS public.aa_s_settings_security (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL UNIQUE REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  two_factor_auth BOOLEAN DEFAULT false,
  session_timeout VARCHAR(50) DEFAULT '30 minutes',
  ip_whitelist TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SEEDING DEFAULT SETTINGS FOR EVERY EXISTING ACCOUNT COMPANY
-- =============================================================================

-- Seed 1: Pipeline Stages
INSERT INTO public.aa_s_settings_pipeline_stages (account_company_id, name, stage_order, bg_color, text_color, border_color, dot_color)
SELECT c.id, stage.name, stage.stage_order, stage.bg_color, stage.text_color, stage.border_color, stage.dot_color
FROM public.aa_s_account_companies c
CROSS JOIN (
  VALUES 
    ('Cold', 1, 'bg-slate-500/10', 'text-slate-400', 'border-slate-500/30', 'bg-slate-400'),
    ('Contacted', 2, 'bg-blue-500/10', 'text-blue-400', 'border-blue-500/30', 'bg-blue-400'),
    ('Warm', 3, 'bg-amber-500/10', 'text-amber-400', 'border-amber-500/30', 'bg-amber-400'),
    ('Hot', 4, 'bg-red-500/10', 'text-red-400', 'border-red-500/30', 'bg-red-400'),
    ('Customer', 5, 'bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/30', 'bg-emerald-400'),
    ('Lost', 6, 'bg-zinc-500/10', 'text-zinc-500', 'border-zinc-500/30', 'bg-zinc-500')
) AS stage(name, stage_order, bg_color, text_color, border_color, dot_color)
ON CONFLICT (account_company_id, name) DO NOTHING;

-- Seed 2: Lead Temperatures
INSERT INTO public.aa_s_settings_lead_temperatures (account_company_id, name, badge_style, text_color)
SELECT c.id, temp.name, temp.badge_style, temp.text_color
FROM public.aa_s_account_companies c
CROSS JOIN (
  VALUES
    ('Cold', 'bg-blue-500/10 text-blue-400 border-blue-500/20', 'text-blue-400'),
    ('Warm', 'bg-amber-500/10 text-amber-400 border-amber-500/20', 'text-amber-400'),
    ('Hot', 'bg-red-500/10 text-red-400 border-red-500/20', 'text-red-400')
) AS temp(name, badge_style, text_color)
ON CONFLICT (account_company_id, name) DO NOTHING;

-- Seed 3: Campaign Template Sequence Steps (4-Step Standard Cadence: Day 1, 3, 7, 14)
INSERT INTO public.aa_s_settings_campaign_sequences (account_company_id, step_number, day, type, subject, body, enabled)
SELECT c.id, seq.step_number, seq.day, seq.type, seq.subject, seq.body, true
FROM public.aa_s_account_companies c
CROSS JOIN (
  VALUES
    (1, 1, 'Email', 'Personalized Outreach: {{company}}', 'Hi {{name}},\n\nI noticed {{company}} has been expanding in your sector...'),
    (2, 3, 'Follow-up', 'Thought on {{company}}''s speed-to-lead', 'Hi {{name}},\n\nWanted to quickly follow up on my previous note regarding your expansion plans...'),
    (3, 7, 'Case Study', 'Peer benchmark: How similar teams scaled throughput', 'Hi {{name}},\n\nSharing a brief case study on how peer teams automated manual CRM logging while cutting cycle times...'),
    (4, 14, 'Final Message', 'Closing the loop — {{name}}', 'Hi {{name}},\n\nAssuming you have all hands on deck with higher priorities right now, so I will respectfully step back and close this thread.')
) AS seq(step_number, day, type, subject, body)
WHERE NOT EXISTS (
  SELECT 1 FROM public.aa_s_settings_campaign_sequences cts WHERE cts.account_company_id = c.id
);

-- Seed 4: Campaign Default Rules
INSERT INTO public.aa_s_settings_campaign_rules (account_company_id)
SELECT id FROM public.aa_s_account_companies
ON CONFLICT (account_company_id) DO NOTHING;

-- Seed 5: Campaign Default Schedules
INSERT INTO public.aa_s_settings_campaign_schedules (account_company_id)
SELECT id FROM public.aa_s_account_companies
ON CONFLICT (account_company_id) DO NOTHING;

-- Seed 6: Daily Follow-up Rules
INSERT INTO public.aa_s_settings_daily_automation_rules (account_company_id, name, condition_desc, action_desc, is_active, rule_order)
SELECT c.id, r.name, r.condition_desc, r.action_desc, true, r.rule_order
FROM public.aa_s_account_companies c
CROSS JOIN (
  VALUES
    ('Follow-up Delay (3 Days)', 'No response after 3 business days', 'Send next sequence touchpoint', 1),
    ('Stop on Reply', 'Lead replies to any touchpoint', 'Halt all automated campaign emails immediately', 2),
    ('Escalate High Intent', 'Email link clicked 2+ times or hot intent signal', 'Tag as HOT and alert assigned account executive', 3)
) AS r(name, condition_desc, action_desc, rule_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.aa_s_settings_daily_automation_rules dar WHERE dar.account_company_id = c.id
);

-- Seed 7: Notification Preferences
INSERT INTO public.aa_s_settings_notifications (account_company_id)
SELECT id FROM public.aa_s_account_companies
ON CONFLICT (account_company_id) DO NOTHING;

-- Seed 8: Appearance Settings
INSERT INTO public.aa_s_settings_appearance (account_company_id)
SELECT id FROM public.aa_s_account_companies
ON CONFLICT (account_company_id) DO NOTHING;

-- Seed 9: Security Settings
INSERT INTO public.aa_s_settings_security (account_company_id)
SELECT id FROM public.aa_s_account_companies
ON CONFLICT (account_company_id) DO NOTHING;

COMMIT;
