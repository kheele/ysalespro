-- =============================================================================
-- Hasura PostgreSQL Migration: Normalized Connected Accounts & Channel Configs
-- Tables:
--   1. public.aa_s_connected_accounts (Core Account/Channel Table)
--   2. public.aa_s_connected_email_configs (Joined 1:1 Email Mailbox Config)
--   3. public.aa_s_connected_linkedin_configs (Joined 1:1 LinkedIn Config)
-- =============================================================================

BEGIN;

-- 1. Core Connected Accounts Table
CREATE TABLE IF NOT EXISTS public.aa_s_connected_accounts (
  id SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Connected Channel',
  channel TEXT NOT NULL DEFAULT 'Email', -- 'Email' | 'LinkedIn' | 'SMS' | 'Phone'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'disconnected' | 'error' | 'rate_limited'
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sent_today INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMPTZ,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_company_channel 
  ON public.aa_s_connected_accounts (account_company_id, channel, is_active);

-- 2. Joined Email Configuration Table (1:1 with aa_s_connected_accounts)
CREATE TABLE IF NOT EXISTS public.aa_s_connected_email_configs (
  id SERIAL PRIMARY KEY,
  connected_account_id INT NOT NULL UNIQUE REFERENCES public.aa_s_connected_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'smtp', -- 'smtp' | 'google_workspace' | 'resend' | 'sendgrid'
  host TEXT,
  port INT DEFAULT 465,
  secure BOOLEAN DEFAULT true,
  username TEXT,
  password TEXT,
  api_key TEXT,
  from_name TEXT NOT NULL DEFAULT '',
  from_email TEXT NOT NULL,
  reply_to TEXT,
  daily_send_limit INT DEFAULT 250,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_configs_account_id 
  ON public.aa_s_connected_email_configs (connected_account_id);

-- 3. Joined LinkedIn Configuration Table (1:1 with aa_s_connected_accounts)
CREATE TABLE IF NOT EXISTS public.aa_s_connected_linkedin_configs (
  id SERIAL PRIMARY KEY,
  connected_account_id INT NOT NULL UNIQUE REFERENCES public.aa_s_connected_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'linkedin_oauth', -- 'linkedin_oauth' | 'linkedin_api' | 'webhook' | 'unipile'
  account_name TEXT NOT NULL DEFAULT '',
  vanity_name TEXT,
  profile_url TEXT,
  access_token TEXT,
  session_cookie TEXT,
  webhook_url TEXT,
  daily_connection_limit INT DEFAULT 30,
  daily_message_limit INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_linkedin_configs_account_id 
  ON public.aa_s_connected_linkedin_configs (connected_account_id);

COMMIT;
