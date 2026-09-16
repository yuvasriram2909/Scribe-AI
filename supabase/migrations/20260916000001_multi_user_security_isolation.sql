-- ============================================================================
-- Scribe AI — Migration: Multi-User Security & Data Isolation System
-- File: supabase/migrations/20260916000001_multi_user_security_isolation.sql
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Schema Hardening & Column Additions
ALTER TABLE IF EXISTS public."Email" ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS public."Notification" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public."Template" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public."UserSignature" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS notif_user_id_uuid_idx ON public."Notification"("user_id") WHERE "user_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS template_user_id_uuid_idx ON public."Template"("user_id") WHERE "user_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS signature_user_id_uuid_idx ON public."UserSignature"("user_id") WHERE "user_id" IS NOT NULL;

-- 3. Automatic Profile Creation Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_provider TEXT;
BEGIN
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_avatar_url := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  v_provider := COALESCE(
    new.raw_app_meta_data->>'provider',
    'google'
  );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    provider,
    created_at,
    updated_at,
    last_login_at
  )
  VALUES (
    new.id,
    new.email,
    v_full_name,
    v_avatar_url,
    v_provider,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, public.profiles.provider),
    updated_at = now(),
    last_login_at = now();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable Row Level Security (RLS) on Every User-Owned Table
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."UserSignature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Email" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."GmailAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."User" ENABLE ROW LEVEL SECURITY;

-- 5. Drop Permissive / Outdated Policies
DO $$ BEGIN
  -- Profiles
  DROP POLICY IF EXISTS "Users can only select own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can only update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can only access their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;

  -- Gmail Connections
  DROP POLICY IF EXISTS "Users can only access their own gmail_connections" ON public.gmail_connections;
  DROP POLICY IF EXISTS "Service role full access gmail_connections" ON public.gmail_connections;

  -- Emails
  DROP POLICY IF EXISTS "Users can only access their own emails" ON public.emails;
  DROP POLICY IF EXISTS "Service role full access emails" ON public.emails;

  -- Email Drafts
  DROP POLICY IF EXISTS "Users can only access their own email_drafts" ON public.email_drafts;
  DROP POLICY IF EXISTS "Service role full access email_drafts" ON public.email_drafts;

  -- Contacts
  DROP POLICY IF EXISTS "Users can only access their own contacts" ON public.contacts;
  DROP POLICY IF EXISTS "Service role full access contacts" ON public.contacts;

  -- Notification
  DROP POLICY IF EXISTS "Users can view own notifications by uuid" ON public."Notification";
  DROP POLICY IF EXISTS "Users can view and manage their own notifications" ON public."Notification";
  DROP POLICY IF EXISTS "Service role full access Notification" ON public."Notification";

  -- Template
  DROP POLICY IF EXISTS "Users can read templates" ON public."Template";
  DROP POLICY IF EXISTS "Users can manage own templates" ON public."Template";
  DROP POLICY IF EXISTS "Users can view templates" ON public."Template";
  DROP POLICY IF EXISTS "Service role full access Template" ON public."Template";

  -- UserSignature
  DROP POLICY IF EXISTS "Users can view own signature" ON public."UserSignature";
  DROP POLICY IF EXISTS "Users can view and manage their signature" ON public."UserSignature";
  DROP POLICY IF EXISTS "Service role full access UserSignature" ON public."UserSignature";

  -- Legacy Email
  DROP POLICY IF EXISTS "Users can view own emails" ON public."Email";
  DROP POLICY IF EXISTS "Users can view and manage their own emails" ON public."Email";
  DROP POLICY IF EXISTS "Service role full access Email" ON public."Email";

  -- Legacy GmailAccount
  DROP POLICY IF EXISTS "Users can view own gmail accounts" ON public."GmailAccount";
  DROP POLICY IF EXISTS "Service role full access GmailAccount" ON public."GmailAccount";

  -- Legacy User
  DROP POLICY IF EXISTS "Service role full access User" ON public."User";
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. Apply Strict Zero-Trust RLS Policies

-- PROFILES: Users can only read and modify their own profile
CREATE POLICY "Service role full access profiles" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only access their own profile" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- GMAIL CONNECTIONS: Users can only access their own connection
CREATE POLICY "Service role full access gmail_connections" ON public.gmail_connections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only access their own gmail_connections" ON public.gmail_connections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- EMAILS: Users can only read/manage their own emails
CREATE POLICY "Service role full access emails" ON public.emails
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only access their own emails" ON public.emails
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- EMAIL DRAFTS: Users can only access their own drafts
CREATE POLICY "Service role full access email_drafts" ON public.email_drafts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only access their own email_drafts" ON public.email_drafts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CONTACTS: Users can only access their own contacts
CREATE POLICY "Service role full access contacts" ON public.contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only access their own contacts" ON public.contacts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS: Users can only access their own notifications
CREATE POLICY "Service role full access Notification" ON public."Notification"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only access their own notifications" ON public."Notification"
  FOR ALL TO authenticated
  USING ((auth.uid() = user_id) OR (auth.uid()::text = "userId"))
  WITH CHECK ((auth.uid() = user_id) OR (auth.uid()::text = "userId"));

-- TEMPLATES: Users can view defaults and access their own custom templates
CREATE POLICY "Service role full access Template" ON public."Template"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read default and own templates" ON public."Template"
  FOR SELECT TO authenticated
  USING ("isDefault" = true OR auth.uid() = user_id OR auth.uid()::text = "userId");

CREATE POLICY "Users can manage own templates" ON public."Template"
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR auth.uid()::text = "userId")
  WITH CHECK (auth.uid() = user_id OR auth.uid()::text = "userId");

-- USER SIGNATURE: Users can only view/manage their own signature
CREATE POLICY "Service role full access UserSignature" ON public."UserSignature"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only access their own signature" ON public."UserSignature"
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR auth.uid()::text = "userId")
  WITH CHECK (auth.uid() = user_id OR auth.uid()::text = "userId");

-- LEGACY TABLES: Strict user ID match
CREATE POLICY "Service role full access Email" ON public."Email"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only access their own legacy emails" ON public."Email"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Service role full access GmailAccount" ON public."GmailAccount"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only access their own legacy gmail accounts" ON public."GmailAccount"
  FOR ALL TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Service role full access User" ON public."User"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can only view their own legacy user profile" ON public."User"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id);

-- 7. Fixed Dashboard Analytics Function (Strictly Scoped to Target User)
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_uid UUID;
BEGIN
  BEGIN
    v_uid := p_user_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_uid := NULL;
  END;

  WITH user_emails AS (
    SELECT 
      id::text as id,
      user_id::text as user_id,
      LOWER(COALESCE(status, '')) as status,
      LOWER(COALESCE(direction, '')) as direction,
      LOWER(COALESCE(spam_status, 'clean')) as spam_status,
      COALESCE(is_spam, false) as is_spam,
      COALESCE(is_read, true) as is_read,
      LOWER(COALESCE(email_type, 'other')) as email_type,
      LOWER(COALESCE(tone, 'professional')) as tone,
      LOWER(COALESCE(importance, 'normal')) as importance,
      created_at,
      sent_at,
      received_at
    FROM public.emails
    WHERE (v_uid IS NOT NULL AND user_id = v_uid) OR user_id::text = p_user_id
    UNION ALL
    SELECT 
      id::text as id,
      "userId"::text as user_id,
      LOWER(COALESCE("status", '')) as status,
      CASE WHEN "isReceived" = true THEN 'received' ELSE 'sent' END as direction,
      CASE WHEN "isSpam" = true THEN 'spam' ELSE 'clean' END as spam_status,
      COALESCE("isSpam", false) as is_spam,
      COALESCE("is_read", true) as is_read,
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

-- 8. Safe Legacy Data Association Helper
CREATE OR REPLACE FUNCTION public.associate_legacy_user_data(p_auth_user_id UUID, p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_legacy_user_id TEXT;
  v_migrated_emails INT := 0;
  v_migrated_notifs INT := 0;
BEGIN
  -- Find legacy user matching verified email exactly
  SELECT id INTO v_legacy_user_id FROM public."User" WHERE LOWER(email) = LOWER(p_email) LIMIT 1;

  IF v_legacy_user_id IS NOT NULL THEN
    -- Update Notification user_id
    UPDATE public."Notification"
    SET "user_id" = p_auth_user_id
    WHERE "userId" = v_legacy_user_id AND "user_id" IS NULL;
    GET DIAGNOSTICS v_migrated_notifs = ROW_COUNT;

    -- Update Template user_id
    UPDATE public."Template"
    SET "user_id" = p_auth_user_id
    WHERE "userId" = v_legacy_user_id AND "user_id" IS NULL;

    -- Update UserSignature user_id
    UPDATE public."UserSignature"
    SET "user_id" = p_auth_user_id
    WHERE "userId" = v_legacy_user_id AND "user_id" IS NULL;

    -- Migrate legacy emails to canonical emails table if missing
    INSERT INTO public.emails (
      user_id,
      gmail_message_id,
      gmail_thread_id,
      sender_email,
      from_email,
      sender_name,
      from_name,
      sender,
      recipient_email,
      recipient_emails,
      to_emails,
      subject,
      body,
      body_text,
      body_html,
      snippet,
      email_type,
      tone,
      importance,
      status,
      direction,
      spam_status,
      is_read,
      is_starred,
      is_important,
      is_spam,
      is_trash,
      is_archived,
      sent_at,
      received_at,
      created_at,
      updated_at
    )
    SELECT
      p_auth_user_id,
      e."gmailMessageId",
      e."gmailThreadId",
      COALESCE(e."sender_email", e."sender"),
      COALESCE(e."sender_email", e."sender"),
      e."sender_name",
      e."sender_name",
      e."sender",
      e."recipient",
      ARRAY[e."recipient"],
      ARRAY[e."recipient"],
      e."subject",
      e."body",
      COALESCE(e."body_text", e."body"),
      COALESCE(e."body_html", e."body"),
      e."snippet",
      COALESCE(e."category", 'other'),
      COALESCE(e."tone", 'professional'),
      COALESCE(e."priority", 'normal'),
      LOWER(e."status"),
      CASE WHEN e."isReceived" = true THEN 'received' ELSE 'sent' END,
      CASE WHEN e."isSpam" = true THEN 'spam' ELSE 'clean' END,
      COALESCE(e."is_read", true),
      COALESCE(e."isStarred", false),
      COALESCE(e."isImportant", false),
      COALESCE(e."isSpam", false),
      COALESCE(e."isTrash", false),
      COALESCE(e."isArchived", false),
      e."sentAt"::timestamptz,
      e."receivedAt"::timestamptz,
      e."createdAt"::timestamptz,
      e."updatedAt"::timestamptz
    FROM public."Email" e
    WHERE e."userId" = v_legacy_user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.emails ce
        WHERE ce.user_id = p_auth_user_id
          AND ce.gmail_message_id IS NOT NULL
          AND ce.gmail_message_id = e."gmailMessageId"
      )
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_migrated_emails = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'legacy_user_id', v_legacy_user_id,
    'migrated_emails', v_migrated_emails,
    'migrated_notifs', v_migrated_notifs
  );
END;
$$;
