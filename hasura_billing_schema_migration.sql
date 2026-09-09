-- =============================================================================
-- Hasura PostgreSQL Migration: Billing & Subscription Management
-- Tables:
--   1. aa_s_billing_plans       – Plan catalog (Starter / Pro / Enterprise)
--   2. aa_s_subscriptions       – Per-company active subscription
--   3. aa_s_invoices            – Invoice / payment history
--   4. aa_s_payment_methods     – Stored cards / PayPal accounts
--   5. aa_s_usage_records       – Monthly resource usage tracking
-- =============================================================================

BEGIN;

-- 1. Billing Plans Catalog
CREATE TABLE IF NOT EXISTS public.aa_s_billing_plans (
  id           TEXT PRIMARY KEY,                  -- e.g. 'starter_za', 'pro_za', 'enterprise_za', 'pro_usd'
  name         TEXT NOT NULL,                     -- 'Starter', 'Pro', 'Enterprise'
  tier         TEXT NOT NULL DEFAULT 'starter',   -- 'starter' | 'pro' | 'enterprise'
  tier_level   INT  NOT NULL DEFAULT 0,           -- 0=starter, 1=pro, 2=enterprise (for comparison)
  currency     TEXT NOT NULL DEFAULT 'ZAR',       -- 'ZAR' | 'USD' | 'BWP' | 'LSL'
  region       TEXT NOT NULL DEFAULT 'za',        -- 'za' | 'global'
  price_monthly   NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_annual    NUMERIC(10,2) NOT NULL DEFAULT 0,   -- per month when billed annually
  description     TEXT,
  features        JSONB NOT NULL DEFAULT '[]',        -- array of feature strings
  limits          JSONB NOT NULL DEFAULT '{}',        -- { lead_lookups: 100, ai_credits: 500, team_seats: 1 }
  is_active       BOOLEAN NOT NULL DEFAULT true,
  paypal_plan_id_monthly TEXT,                   -- PayPal billing plan ID (monthly)
  paypal_plan_id_annual  TEXT,                   -- PayPal billing plan ID (annual)
  created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Per-Company Subscriptions
CREATE TABLE IF NOT EXISTS public.aa_s_subscriptions (
  id                      SERIAL PRIMARY KEY,
  account_company_id      INT NOT NULL UNIQUE REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  plan_id                 TEXT NOT NULL REFERENCES public.aa_s_billing_plans(id),
  plan_tier               TEXT NOT NULL DEFAULT 'starter',
  billing_cycle           TEXT NOT NULL DEFAULT 'monthly',  -- 'monthly' | 'annual'
  status                  TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'past_due' | 'canceled' | 'trialing'
  price_paid              NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency                TEXT NOT NULL DEFAULT 'ZAR',
  current_period_start    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end      TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 month'),
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  canceled_at             TIMESTAMPTZ,
  trial_ends_at           TIMESTAMPTZ,
  paypal_subscription_id  TEXT,
  paypal_order_id         TEXT,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.aa_s_subscriptions (account_company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON public.aa_s_subscriptions (status);

-- 3. Invoice / Payment History
CREATE TABLE IF NOT EXISTS public.aa_s_invoices (
  id              SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  subscription_id INT REFERENCES public.aa_s_subscriptions(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL,
  plan_name       TEXT NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'ZAR',
  status          TEXT NOT NULL DEFAULT 'paid',  -- 'paid' | 'pending' | 'failed' | 'refunded'
  billing_cycle   TEXT,
  period_start    TIMESTAMPTZ,
  period_end      TIMESTAMPTZ,
  receipt_url     TEXT,
  paypal_capture_id TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_company ON public.aa_s_invoices (account_company_id, created_at DESC);

-- 4. Payment Methods
CREATE TABLE IF NOT EXISTS public.aa_s_payment_methods (
  id              SERIAL PRIMARY KEY,
  account_company_id INT NOT NULL REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'card',  -- 'card' | 'paypal' | 'bank_transfer'
  provider        TEXT,                          -- 'visa' | 'mastercard' | 'amex' | 'paypal'
  last_four       TEXT,
  expiry_month    INT,
  expiry_year     INT,
  cardholder_name TEXT,
  paypal_email    TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  token_ref       TEXT,                          -- tokenized payment reference (never raw card)
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_company ON public.aa_s_payment_methods (account_company_id);

-- 5. Monthly Usage Records
CREATE TABLE IF NOT EXISTS public.aa_s_usage_records (
  id                      SERIAL PRIMARY KEY,
  account_company_id      INT NOT NULL REFERENCES public.aa_s_account_companies(id) ON DELETE CASCADE,
  period_year             INT NOT NULL,
  period_month            INT NOT NULL,                       -- 1-12
  lead_lookups_used       INT NOT NULL DEFAULT 0,
  lead_lookups_limit      INT NOT NULL DEFAULT 100,
  ai_credits_used         INT NOT NULL DEFAULT 0,
  ai_credits_limit        INT NOT NULL DEFAULT 500,
  emails_sent             INT NOT NULL DEFAULT 0,
  team_seats_used         INT NOT NULL DEFAULT 1,
  team_seats_limit        INT NOT NULL DEFAULT 1,
  created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (account_company_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_usage_records_company ON public.aa_s_usage_records (account_company_id, period_year DESC, period_month DESC);

-- =============================================================================
-- Seed: Standard Billing Plans
-- =============================================================================

INSERT INTO public.aa_s_billing_plans (id, name, tier, tier_level, currency, region, price_monthly, price_annual, description, features, limits) VALUES
-- South Africa (ZAR)
('starter_za', 'Starter', 'starter', 0, 'ZAR', 'za', 0, 0,
 'Perfect for solo sales reps getting started.',
 '["100 Lead Lookups / month","Email campaign tools","Basic contact data","Standard support","1 Team Seat"]',
 '{"lead_lookups": 100, "ai_credits": 0, "team_seats": 1, "campaigns": 2}'),

('pro_za', 'Pro', 'pro', 1, 'ZAR', 'za', 899, 719,
 'Most popular. Everything you need to scale outreach.',
 '["2,500 Lead Lookups / month","AI Outreach Suggestion Engine","Intent Signals & Scoring","Real-time Reports & Analytics","Follow-up Automation","5 Team Seats","Priority Support"]',
 '{"lead_lookups": 2500, "ai_credits": 5000, "team_seats": 5, "campaigns": 20}'),

('enterprise_za', 'Enterprise', 'enterprise', 2, 'ZAR', 'za', 3499, 2799,
 'For high-volume sales operations with custom AI needs.',
 '["Unlimited Lead Lookups","Custom AI Prompts & GenKit Integration","Dedicated Account Manager","Advanced Audience Intelligence","White-glove Onboarding","Unlimited Team Seats","API Access","Custom Integrations","SLA Support"]',
 '{"lead_lookups": -1, "ai_credits": -1, "team_seats": -1, "campaigns": -1}'),

-- Global (USD)
('starter_usd', 'Starter', 'starter', 0, 'USD', 'global', 0, 0,
 'Perfect for solo sales reps getting started.',
 '["100 Lead Lookups / month","Email campaign tools","Basic contact data","Standard support","1 Team Seat"]',
 '{"lead_lookups": 100, "ai_credits": 0, "team_seats": 1, "campaigns": 2}'),

('pro_usd', 'Pro', 'pro', 1, 'USD', 'global', 49, 39,
 'Most popular. Everything you need to scale outreach.',
 '["2,500 Lead Lookups / month","AI Outreach Suggestion Engine","Intent Signals & Scoring","Real-time Reports & Analytics","Follow-up Automation","5 Team Seats","Priority Support"]',
 '{"lead_lookups": 2500, "ai_credits": 5000, "team_seats": 5, "campaigns": 20}'),

('enterprise_usd', 'Enterprise', 'enterprise', 2, 'USD', 'global', 199, 159,
 'For high-volume sales operations with custom AI needs.',
 '["Unlimited Lead Lookups","Custom AI Prompts & GenKit Integration","Dedicated Account Manager","Advanced Audience Intelligence","White-glove Onboarding","Unlimited Team Seats","API Access","Custom Integrations","SLA Support"]',
 '{"lead_lookups": -1, "ai_credits": -1, "team_seats": -1, "campaigns": -1}')

ON CONFLICT (id) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_annual  = EXCLUDED.price_annual,
  features      = EXCLUDED.features,
  limits        = EXCLUDED.limits;

-- =============================================================================
-- Seed: Bootstrap starter subscriptions for all existing companies
-- that don't yet have a subscription row.
-- =============================================================================

INSERT INTO public.aa_s_subscriptions (
  account_company_id, plan_id, plan_tier, billing_cycle, status, price_paid, currency,
  current_period_start, current_period_end
)
SELECT
  ac.id,
  'starter_za',
  'starter',
  'monthly',
  'active',
  0,
  'ZAR',
  date_trunc('month', CURRENT_TIMESTAMP),
  date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
FROM public.aa_s_account_companies ac
WHERE NOT EXISTS (
  SELECT 1 FROM public.aa_s_subscriptions s WHERE s.account_company_id = ac.id
);

COMMIT;
