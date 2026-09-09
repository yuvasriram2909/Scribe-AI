-- ============================================================================
-- Scribe AI — Migration: Complete Two-Way Gmail Synchronization
-- File: supabase/migrations/20260909000001_gmail_two_way_sync.sql
-- ============================================================================

-- 1. Canonical emails table schema enhancements
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS gmail_draft_id TEXT;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- 2. Legacy Email table schema enhancements (dual-table compatibility)
ALTER TABLE IF EXISTS public."Email" ADD COLUMN IF NOT EXISTS "gmailDraftId" TEXT;
ALTER TABLE IF EXISTS public."Email" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- 3. Synchronization State Table: Concurrency Lock & History Tracking
ALTER TABLE IF EXISTS public.email_sync_state ADD COLUMN IF NOT EXISTS sync_locked_until TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.email_sync_state ADD COLUMN IF NOT EXISTS watch_resource_id TEXT;
ALTER TABLE IF EXISTS public.email_sync_state ADD COLUMN IF NOT EXISTS watch_expiration TIMESTAMPTZ;

-- 4. Gmail Connections Table: Scopes & Status
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS scopes TEXT[];
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS needs_reauth BOOLEAN NOT NULL DEFAULT false;

-- 5. Performance and Query Indexes
CREATE INDEX IF NOT EXISTS emails_user_id_gmail_draft_id_idx ON public.emails(user_id, gmail_draft_id) WHERE gmail_draft_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS emails_user_id_is_starred_idx ON public.emails(user_id, is_starred);
CREATE INDEX IF NOT EXISTS emails_user_id_is_archived_idx ON public.emails(user_id, is_archived);
CREATE INDEX IF NOT EXISTS emails_user_id_is_trash_idx ON public.emails(user_id, is_trash);
CREATE INDEX IF NOT EXISTS emails_user_id_is_read_idx ON public.emails(user_id, is_read);
CREATE INDEX IF NOT EXISTS email_sync_state_sync_locked_until_idx ON public.email_sync_state(sync_locked_until);
