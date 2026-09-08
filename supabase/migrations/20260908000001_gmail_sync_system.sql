-- ============================================================================
-- Scribe AI — Migration: Gmail Synchronization & Data System
-- File: supabase/migrations/20260908000001_gmail_sync_system.sql
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Email Synchronization State Table
CREATE TABLE IF NOT EXISTS public.email_sync_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    history_id TEXT,
    last_synced_at TIMESTAMPTZ,
    sync_status TEXT NOT NULL DEFAULT 'idle',
    sync_error TEXT,
    messages_synced INTEGER NOT NULL DEFAULT 0,
    new_messages INTEGER NOT NULL DEFAULT 0,
    updated_messages INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT email_sync_state_user_id_unique UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS email_sync_state_user_id_idx ON public.email_sync_state(user_id);
CREATE INDEX IF NOT EXISTS email_sync_state_last_synced_at_idx ON public.email_sync_state(last_synced_at DESC);

-- 3. Email Threads Table
CREATE TABLE IF NOT EXISTS public.email_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail_thread_id TEXT NOT NULL,
    snippet TEXT,
    history_id TEXT,
    message_count INTEGER NOT NULL DEFAULT 1,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT email_threads_user_thread_unique UNIQUE(user_id, gmail_thread_id)
);
CREATE INDEX IF NOT EXISTS email_threads_user_id_idx ON public.email_threads(user_id);
CREATE INDEX IF NOT EXISTS email_threads_last_message_at_idx ON public.email_threads(last_message_at DESC);

-- 4. Email Labels Table
CREATE TABLE IF NOT EXISTS public.email_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail_label_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT email_labels_user_label_unique UNIQUE(user_id, gmail_label_id)
);
CREATE INDEX IF NOT EXISTS email_labels_user_id_idx ON public.email_labels(user_id);

-- 5. Standardize public.emails Table Columns
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS recipient_emails TEXT[];
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS cc_emails TEXT[];
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS bcc_emails TEXT[];
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS body_text TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS body_html TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS snippet TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS is_spam BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS is_trash BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS labels TEXT[];
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS history_id TEXT;

-- 6. Performance & Integrity Indexes on public.emails
CREATE INDEX IF NOT EXISTS emails_user_id_created_at_idx ON public.emails(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS emails_user_id_received_at_idx ON public.emails(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS emails_user_id_sent_at_idx ON public.emails(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS emails_user_id_direction_idx ON public.emails(user_id, direction);
CREATE INDEX IF NOT EXISTS emails_user_id_is_spam_idx ON public.emails(user_id, is_spam);
CREATE INDEX IF NOT EXISTS emails_user_id_is_read_idx ON public.emails(user_id, is_read);
CREATE INDEX IF NOT EXISTS emails_user_id_gmail_thread_id_idx ON public.emails(user_id, gmail_thread_id);
CREATE UNIQUE INDEX IF NOT EXISTS emails_user_id_gmail_message_id_unique ON public.emails(user_id, gmail_message_id) WHERE gmail_message_id IS NOT NULL;

-- 7. Dual-Table Column Migrations for Legacy "Email" Table
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "sender_email" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "sender_name" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "body_text" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "body_html" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "snippet" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "isStarred" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "isImportant" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "isTrash" BOOLEAN NOT NULL DEFAULT false;

-- 8. Row Level Security (RLS) Configuration
ALTER TABLE public.email_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Service Role Policies (Full access for Edge Functions)
DO $$ BEGIN
  CREATE POLICY "Service role full access email_sync_state" ON public.email_sync_state FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access email_threads" ON public.email_threads FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access email_labels" ON public.email_labels FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access emails" ON public.emails FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access gmail_connections" ON public.gmail_connections FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated Users Policies (Strictly auth.uid() = user_id)
DO $$ BEGIN
  CREATE POLICY "Users can only access their own email_sync_state" ON public.email_sync_state
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own email_threads" ON public.email_threads
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own email_labels" ON public.email_labels
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own emails" ON public.emails
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own gmail_connections" ON public.gmail_connections
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. Enable Realtime Publications
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.email_sync_state;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.email_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gmail_connections;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 10. Helper Function: get_dashboard_analytics (Strictly Authenticated Real Stats)
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
      CASE WHEN "isReceived" = true THEN 'received' ELSE 'sent' END as direction,
      CASE WHEN "isSpam" = true THEN 'spam' ELSE 'clean' END as spam_status,
      COALESCE("isSpam", false) as is_spam,
      COALESCE("isRead", true) as is_read,
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
    'sent', COUNT(*) FILTER (WHERE (direction = 'sent' OR status = 'sent') AND status != 'draft' AND status != 'failed' AND NOT is_spam),
    'received', COUNT(*) FILTER (WHERE (direction = 'received' OR status = 'received') AND status != 'draft' AND NOT is_spam),
    'drafts', COUNT(*) FILTER (WHERE status = 'draft' OR direction = 'draft'),
    'scheduled', COUNT(*) FILTER (WHERE status IN ('scheduled', 'sending')),
    'emergency', COUNT(*) FILTER (WHERE importance IN ('urgent', 'high', 'critical') OR email_type ILIKE '%emergency%'),
    'spam', COUNT(*) FILTER (WHERE is_spam OR spam_status = 'spam' OR status = 'spam'),
    'pendingReview', COUNT(*) FILTER (WHERE status IN ('pending', 'pending_review', 'generated')),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'unread', COUNT(*) FILTER (WHERE NOT is_read AND NOT is_spam),
    'total', COUNT(*),
    'sentToday', COUNT(*) FILTER (
      WHERE (direction = 'sent' OR status = 'sent') AND NOT is_spam AND COALESCE(sent_at, created_at) >= date_trunc('day', now())
    ),
    'receivedToday', COUNT(*) FILTER (
      WHERE (direction = 'received' OR status = 'received') AND NOT is_spam AND COALESCE(received_at, created_at) >= date_trunc('day', now())
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
