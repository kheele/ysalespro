-- =============================================================================
-- Migration: Inbox Reply Poller Scaling (Phase 2)
-- Adds last_polled_at to aa_s_connected_accounts to enable rolling batch
-- polling across thousands of accounts without rate limits or timeouts.
-- =============================================================================

BEGIN;

-- Add last_polled_at column to track when each account was last IMAP-polled.
-- NULL = never polled (will be picked first in each batch).
ALTER TABLE public.aa_s_connected_accounts
  ADD COLUMN IF NOT EXISTS last_polled_at TIMESTAMPTZ DEFAULT NULL;

-- Index for the ORDER BY / WHERE query used in the batched poller.
-- Allows the DB to cheaply find the N accounts polled least recently.
CREATE INDEX IF NOT EXISTS idx_connected_accounts_last_polled
  ON public.aa_s_connected_accounts (last_polled_at ASC NULLS FIRST)
  WHERE channel = 'Email' AND is_active = true;

-- Optional: Reset all accounts so the first run re-polls all of them.
-- Comment this out if you want to preserve existing last_polled_at values.
-- UPDATE public.aa_s_connected_accounts SET last_polled_at = NULL WHERE channel = 'Email';

COMMIT;
