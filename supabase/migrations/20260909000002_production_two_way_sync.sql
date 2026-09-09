-- ============================================================================
-- Scribe AI — Migration: Production Two-Way Gmail Synchronization System
-- File: supabase/migrations/20260909000002_production_two_way_sync.sql
-- ============================================================================

-- 1. Gmail Connections Table Enhancements
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS gmail_address TEXT;
UPDATE public.gmail_connections SET gmail_address = gmail_email WHERE gmail_address IS NULL AND gmail_email IS NOT NULL;

ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS gmail_connections_user_address_idx ON public.gmail_connections(user_id, gmail_address);

-- 2. Emails Canonical Table Enhancements
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS from_email TEXT;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS from_name TEXT;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS to_emails TEXT[];
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'scribe_ai';
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS attachments_metadata JSONB DEFAULT '[]'::jsonb;

-- Backfill from existing columns
UPDATE public.emails SET from_email = sender_email WHERE from_email IS NULL AND sender_email IS NOT NULL;
UPDATE public.emails SET from_name = sender_name WHERE from_name IS NULL AND sender_name IS NOT NULL;
UPDATE public.emails SET to_emails = recipient_emails WHERE to_emails IS NULL AND recipient_emails IS NOT NULL;
UPDATE public.emails SET is_draft = true WHERE is_draft = false AND (status = 'draft' OR direction = 'draft');
UPDATE public.emails SET source = 'gmail' WHERE source = 'scribe_ai' AND gmail_message_id IS NOT NULL AND direction IN ('received', 'incoming');

CREATE INDEX IF NOT EXISTS emails_user_id_source_idx ON public.emails(user_id, source);
CREATE INDEX IF NOT EXISTS emails_user_id_is_draft_idx ON public.emails(user_id, is_draft);
CREATE INDEX IF NOT EXISTS emails_user_id_from_email_idx ON public.emails(user_id, from_email);

-- 3. Dedicated Email Drafts Table
CREATE TABLE IF NOT EXISTS public.email_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scribe_draft_id TEXT UNIQUE,
    gmail_draft_id TEXT,
    gmail_message_id TEXT,
    to_emails TEXT[],
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject TEXT NOT NULL DEFAULT '(No Subject)',
    body_text TEXT NOT NULL DEFAULT '',
    body_html TEXT,
    snippet TEXT,
    instruction TEXT,
    category TEXT NOT NULL DEFAULT 'Official / Professional',
    tone TEXT NOT NULL DEFAULT 'Professional',
    priority TEXT NOT NULL DEFAULT 'Normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_drafts_user_id_idx ON public.email_drafts(user_id);
CREATE INDEX IF NOT EXISTS email_drafts_gmail_draft_id_idx ON public.email_drafts(user_id, gmail_draft_id) WHERE gmail_draft_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS email_drafts_scribe_draft_id_idx ON public.email_drafts(scribe_draft_id);

-- 4. Email Sync State Table Alignments
ALTER TABLE IF EXISTS public.email_sync_state ADD COLUMN IF NOT EXISTS gmail_address TEXT;
ALTER TABLE IF EXISTS public.email_sync_state ADD COLUMN IF NOT EXISTS last_full_sync_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.email_sync_state ADD COLUMN IF NOT EXISTS last_incremental_sync_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.email_sync_state ADD COLUMN IF NOT EXISTS last_error TEXT;

-- 5. Row Level Security Configuration for email_drafts
ALTER TABLE IF EXISTS public.email_drafts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role full access email_drafts" ON public.email_drafts
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own email_drafts" ON public.email_drafts
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Realtime Publication for email_drafts
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_drafts') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.email_drafts;
    END IF;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Update get_dashboard_analytics Function for Complete Dual-Direction Support
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH user_emails AS (
    SELECT 
      id::text as id,
      user_id::text as user_id,
      LOWER(COALESCE(status, '')) as status,
      LOWER(COALESCE(direction, '')) as direction,
      LOWER(COALESCE(spam_status, 'clean')) as spam_status,
      is_spam,
      is_read,
      COALESCE(is_draft, false) as is_draft,
      LOWER(COALESCE(email_type, 'other')) as email_type,
      LOWER(COALESCE(tone, 'professional')) as tone,
      LOWER(COALESCE(importance, 'normal')) as importance,
      created_at,
      sent_at,
      received_at
    FROM public.emails
    WHERE user_id::text = p_user_id
    UNION ALL
    SELECT 
      id::text as id,
      "userId"::text as user_id,
      LOWER(COALESCE("status", '')) as status,
      CASE WHEN "isReceived" = true THEN 'incoming' ELSE 'outgoing' END as direction,
      CASE WHEN "isSpam" = true THEN 'spam' ELSE 'clean' END as spam_status,
      COALESCE("isSpam", false) as is_spam,
      COALESCE("isRead", true) as is_read,
      CASE WHEN LOWER(COALESCE("status", '')) = 'draft' THEN true ELSE false END as is_draft,
      LOWER(COALESCE("category", "situation", 'other')) as email_type,
      LOWER(COALESCE("tone", 'professional')) as tone,
      LOWER(COALESCE("priority", 'normal')) as importance,
      "createdAt" as created_at,
      "sentAt" as sent_at,
      "receivedAt" as received_at
    FROM public."Email"
    WHERE "userId"::text = p_user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.emails e WHERE e.id::text = public."Email".id::text
      )
  )
  SELECT jsonb_build_object(
    'sent', COUNT(*) FILTER (WHERE (direction IN ('sent', 'outgoing') OR status = 'sent') AND status != 'draft' AND NOT is_draft AND status != 'failed' AND NOT is_spam),
    'received', COUNT(*) FILTER (WHERE (direction IN ('received', 'incoming') OR status = 'received') AND status != 'draft' AND NOT is_draft AND NOT is_spam),
    'drafts', COUNT(*) FILTER (WHERE status = 'draft' OR is_draft OR direction = 'draft'),
    'scheduled', COUNT(*) FILTER (WHERE status IN ('scheduled', 'sending')),
    'emergency', COUNT(*) FILTER (WHERE importance IN ('urgent', 'high', 'critical') OR email_type ILIKE '%emergency%'),
    'spam', COUNT(*) FILTER (WHERE is_spam OR spam_status = 'spam' OR status = 'spam'),
    'pendingReview', COUNT(*) FILTER (WHERE status IN ('pending', 'pending_review', 'generated')),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'unread', COUNT(*) FILTER (WHERE NOT is_read AND NOT is_spam),
    'total', COUNT(*),
    'sentToday', COUNT(*) FILTER (
      WHERE (direction IN ('sent', 'outgoing') OR status = 'sent') AND NOT is_spam AND NOT is_draft AND COALESCE(sent_at, created_at) >= date_trunc('day', now())
    ),
    'receivedToday', COUNT(*) FILTER (
      WHERE (direction IN ('received', 'incoming') OR status = 'received') AND NOT is_spam AND NOT is_draft AND COALESCE(received_at, created_at) >= date_trunc('day', now())
    ),
    'categories', jsonb_build_object(
      'leave', COUNT(*) FILTER (WHERE email_type ILIKE '%leave%' OR email_type ILIKE '%sick%'),
      'jobApplication', COUNT(*) FILTER (WHERE email_type ILIKE '%job%' OR email_type ILIKE '%resume%' OR email_type ILIKE '%application%'),
      'followUp', COUNT(*) FILTER (WHERE email_type ILIKE '%follow%' OR email_type ILIKE '%reminder%'),
      'complaint', COUNT(*) FILTER (WHERE email_type ILIKE '%complaint%'),
      'payment', COUNT(*) FILTER (WHERE email_type ILIKE '%payment%' OR email_type ILIKE '%fee%' OR email_type ILIKE '%receipt%' OR email_type ILIKE '%invoice%'),
      'request', COUNT(*) FILTER (WHERE email_type ILIKE '%request%' OR email_type ILIKE '%inquiry%'),
      'business', COUNT(*) FILTER (WHERE email_type ILIKE '%business%' OR email_type ILIKE '%proposal%'),
      'personal', COUNT(*) FILTER (WHERE email_type ILIKE '%personal%' OR email_type ILIKE '%casual%'),
      'meeting', COUNT(*) FILTER (WHERE email_type ILIKE '%meeting%' OR email_type ILIKE '%appointment%'),
      'official', COUNT(*) FILTER (WHERE email_type ILIKE '%official%' OR email_type ILIKE '%professional%'),
      'thankYou', COUNT(*) FILTER (WHERE email_type ILIKE '%thank%' OR email_type ILIKE '%appreciation%'),
      'apology', COUNT(*) FILTER (WHERE email_type ILIKE '%apology%'),
      'other', COUNT(*) FILTER (
        WHERE email_type NOT ILIKE '%leave%' AND email_type NOT ILIKE '%sick%' AND 
        email_type NOT ILIKE '%job%' AND email_type NOT ILIKE '%resume%' AND 
        email_type NOT ILIKE '%follow%' AND email_type NOT ILIKE '%complaint%' AND 
        email_type NOT ILIKE '%payment%' AND email_type NOT ILIKE '%fee%' AND
        email_type NOT ILIKE '%receipt%' AND email_type NOT ILIKE '%invoice%' AND
        email_type NOT ILIKE '%request%' AND email_type NOT ILIKE '%business%' AND 
        email_type NOT ILIKE '%personal%' AND email_type NOT ILIKE '%meeting%' AND
        email_type NOT ILIKE '%official%' AND email_type NOT ILIKE '%thank%' AND
        email_type NOT ILIKE '%apology%'
      )
    ),
    'tones', jsonb_build_object(
      'professional', COUNT(*) FILTER (WHERE tone ILIKE '%professional%'),
      'formal', COUNT(*) FILTER (WHERE tone ILIKE '%formal%'),
      'friendly', COUNT(*) FILTER (WHERE tone ILIKE '%friendly%'),
      'urgent', COUNT(*) FILTER (WHERE tone ILIKE '%urgent%'),
      'polite', COUNT(*) FILTER (WHERE tone ILIKE '%polite%'),
      'apologetic', COUNT(*) FILTER (WHERE tone ILIKE '%apologetic%'),
      'concise', COUNT(*) FILTER (WHERE tone ILIKE '%concise%')
    ),
    'importance', jsonb_build_object(
      'low', COUNT(*) FILTER (WHERE importance ILIKE '%low%'),
      'normal', COUNT(*) FILTER (WHERE importance ILIKE '%normal%' OR importance ILIKE '%medium%'),
      'high', COUNT(*) FILTER (WHERE importance ILIKE '%high%'),
      'urgent', COUNT(*) FILTER (WHERE importance ILIKE '%urgent%' OR importance ILIKE '%critical%')
    )
  ) INTO v_result
  FROM user_emails;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
