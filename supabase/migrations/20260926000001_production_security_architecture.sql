-- ============================================================================
-- Scribe AI — Migration: Production Security Architecture & RLS Hardening
-- File: supabase/migrations/20260926000001_production_security_architecture.sql
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Schema Hardening & Column Additions (Idempotent, Zero Data Loss)
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'google';
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- gmail_connections
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS google_account_id TEXT;
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT;
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT;
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS scopes TEXT[];
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'idle';
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS needs_reauth BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.gmail_connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS gmail_conn_user_email_uidx ON public.gmail_connections (user_id, gmail_email);

-- emails
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS gmail_connection_id UUID REFERENCES public.gmail_connections(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS from_email TEXT;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS from_name TEXT;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS to_emails TEXT[];
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS cc_emails TEXT[];
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS bcc_emails TEXT[];
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'received';
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS is_spam BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS is_trash BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS situation TEXT DEFAULT '💼 Official / Professional';
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'Professional';
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS labels TEXT[];
ALTER TABLE IF EXISTS public.emails ADD COLUMN IF NOT EXISTS attachments_metadata JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS emails_user_gmail_msg_uidx ON public.emails (user_id, gmail_message_id) WHERE gmail_message_id IS NOT NULL;

-- email_drafts
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS scribe_draft_id TEXT;
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS gmail_draft_id TEXT;
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS to_emails TEXT[];
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS cc_emails TEXT[];
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS bcc_emails TEXT[];
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS body_text TEXT;
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS body_html TEXT;
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS instruction TEXT;
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Official/Professional';
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'Professional';
ALTER TABLE IF EXISTS public.email_drafts ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
CREATE UNIQUE INDEX IF NOT EXISTS drafts_user_gmail_draft_uidx ON public.email_drafts (user_id, gmail_draft_id) WHERE gmail_draft_id IS NOT NULL;

-- scheduled_emails (create if not exists)
CREATE TABLE IF NOT EXISTS public.scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_connection_id UUID REFERENCES public.gmail_connections(id) ON DELETE SET NULL,
  to_emails TEXT[] NOT NULL DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'Official/Professional',
  situation TEXT DEFAULT '💼 Official / Professional',
  priority TEXT DEFAULT 'Normal',
  tone TEXT DEFAULT 'Professional',
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'sent', 'failed', 'cancelled', 'reauth_required')),
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sched_user_status_idx ON public.scheduled_emails (user_id, status);
CREATE INDEX IF NOT EXISTS sched_time_status_idx ON public.scheduled_emails (scheduled_for, status);

-- contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  relationship TEXT DEFAULT 'Contact',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS contacts_user_email_uidx ON public.contacts (user_id, lower(email));

-- email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Official/Professional',
  title TEXT NOT NULL,
  instruction TEXT,
  sample_text TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE IF EXISTS public.email_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.email_templates ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS public.email_templates ADD COLUMN IF NOT EXISTS instruction TEXT;
ALTER TABLE IF EXISTS public.email_templates ADD COLUMN IF NOT EXISTS sample_text TEXT;
ALTER TABLE IF EXISTS public.email_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Official/Professional';


-- email_sync_state
CREATE UNIQUE INDEX IF NOT EXISTS sync_state_user_id_uidx ON public.email_sync_state (user_id);

-- Legacy tables reference additions
ALTER TABLE IF EXISTS public."Notification" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public."Template" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public."UserSignature" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Non-destructive Data Bridge (Preserving all existing users & connections)
-- Populate missing gmail_connections from legacy GmailAccount for users where encrypted tokens exist
INSERT INTO public.gmail_connections (
  id,
  user_id,
  gmail_email,
  gmail_address,
  access_token_encrypted,
  refresh_token_encrypted,
  scopes,
  connected_at,
  updated_at,
  sync_status
)
SELECT
  gen_random_uuid(),
  u.id AS user_id,
  lower(ga."gmailEmail"),
  lower(ga."gmailEmail"),
  ga."encryptedAccessToken",
  ga."encryptedRefreshToken",
  string_to_array(COALESCE(ga.scope, 'openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose'), ' '),
  COALESCE(ga."createdAt"::timestamptz, now()),
  now(),
  'idle'
FROM public."GmailAccount" ga
JOIN auth.users u ON lower(u.email) = lower(ga."gmailEmail")
WHERE (ga."encryptedAccessToken" IS NOT NULL OR ga."encryptedRefreshToken" IS NOT NULL)
ON CONFLICT (user_id, gmail_email) DO UPDATE
SET
  access_token_encrypted = COALESCE(EXCLUDED.access_token_encrypted, public.gmail_connections.access_token_encrypted),
  refresh_token_encrypted = COALESCE(EXCLUDED.refresh_token_encrypted, public.gmail_connections.refresh_token_encrypted),
  scopes = COALESCE(EXCLUDED.scopes, public.gmail_connections.scopes),
  updated_at = now();

-- Bridge user_id onto legacy Notification and Template
UPDATE public."Notification" n
SET user_id = u.id
FROM auth.users u
JOIN public."User" lu ON lower(lu.email) = lower(u.email)
WHERE n."userId" = lu.id AND n.user_id IS NULL;

UPDATE public."Template" t
SET user_id = u.id
FROM auth.users u
JOIN public."User" lu ON lower(lu.email) = lower(u.email)
WHERE t."userId" = lu.id AND t.user_id IS NULL;

-- 4. Idempotent Profile Trigger on auth.users
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

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Enable Row Level Security (RLS) on Every User Table
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
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

-- 6. Clean Drop of Legacy / Duplicate Permissive Policies
DO $$ BEGIN
  -- profiles
  DROP POLICY IF EXISTS "Users can only access their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can only select own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can only update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;

  -- gmail_connections
  DROP POLICY IF EXISTS "Users can only access their own gmail_connections" ON public.gmail_connections;
  DROP POLICY IF EXISTS "Service role full access gmail_connections" ON public.gmail_connections;

  -- emails
  DROP POLICY IF EXISTS "Users can only access their own emails" ON public.emails;
  DROP POLICY IF EXISTS "Service role full access emails" ON public.emails;

  -- email_drafts
  DROP POLICY IF EXISTS "Users can only access their own email_drafts" ON public.email_drafts;
  DROP POLICY IF EXISTS "Service role full access email_drafts" ON public.email_drafts;

  -- scheduled_emails
  DROP POLICY IF EXISTS "Users can only access their own scheduled_emails" ON public.scheduled_emails;
  DROP POLICY IF EXISTS "Service role full access scheduled_emails" ON public.scheduled_emails;

  -- contacts
  DROP POLICY IF EXISTS "Users can only access their own contacts" ON public.contacts;
  DROP POLICY IF EXISTS "Service role full access contacts" ON public.contacts;

  -- email_templates
  DROP POLICY IF EXISTS "Users can read templates" ON public.email_templates;
  DROP POLICY IF EXISTS "Users can manage own templates" ON public.email_templates;
  DROP POLICY IF EXISTS "Service role full access email_templates" ON public.email_templates;

  -- email_sync_state
  DROP POLICY IF EXISTS "Users can only access their own email_sync_state" ON public.email_sync_state;
  DROP POLICY IF EXISTS "Service role full access email_sync_state" ON public.email_sync_state;

  -- email_threads
  DROP POLICY IF EXISTS "Users can only access their own email_threads" ON public.email_threads;
  DROP POLICY IF EXISTS "Service role full access email_threads" ON public.email_threads;

  -- email_labels
  DROP POLICY IF EXISTS "Users can only access their own email_labels" ON public.email_labels;
  DROP POLICY IF EXISTS "Service role full access email_labels" ON public.email_labels;

  -- email_events
  DROP POLICY IF EXISTS "Users can only access their own email events" ON public.email_events;
  DROP POLICY IF EXISTS "Service role full access email_events" ON public.email_events;

  -- Notification
  DROP POLICY IF EXISTS "Users can only access their own notifications" ON public."Notification";
  DROP POLICY IF EXISTS "Users can view own notifications" ON public."Notification";
  DROP POLICY IF EXISTS "Users can view own notifications by uuid" ON public."Notification";
  DROP POLICY IF EXISTS "Users can view and manage their own notifications" ON public."Notification";
  DROP POLICY IF EXISTS "Service role full access Notification" ON public."Notification";

  -- Template
  DROP POLICY IF EXISTS "Users can read default and own templates" ON public."Template";
  DROP POLICY IF EXISTS "Users can manage own templates" ON public."Template";
  DROP POLICY IF EXISTS "Users can view templates" ON public."Template";
  DROP POLICY IF EXISTS "Service role full access Template" ON public."Template";

  -- UserSignature
  DROP POLICY IF EXISTS "Users can only access their own signature" ON public."UserSignature";
  DROP POLICY IF EXISTS "Users can view own signature" ON public."UserSignature";
  DROP POLICY IF EXISTS "Users can view and manage their signature" ON public."UserSignature";
  DROP POLICY IF EXISTS "Service role full access UserSignature" ON public."UserSignature";

  -- Email (legacy)
  DROP POLICY IF EXISTS "Users can only access their own legacy emails" ON public."Email";
  DROP POLICY IF EXISTS "Users can view own emails" ON public."Email";
  DROP POLICY IF EXISTS "Users can view and manage their own emails" ON public."Email";
  DROP POLICY IF EXISTS "Service role full access Email" ON public."Email";

  -- GmailAccount (legacy)
  DROP POLICY IF EXISTS "Users can only access their own legacy gmail accounts" ON public."GmailAccount";
  DROP POLICY IF EXISTS "Service role full access GmailAccount" ON public."GmailAccount";

  -- User (legacy)
  DROP POLICY IF EXISTS "Users can only view their own legacy user profile" ON public."User";
  DROP POLICY IF EXISTS "Service role full access User" ON public."User";
END $$;

-- 7. High-Performance RLS Policies using (select auth.uid())
-- profiles
DROP POLICY IF EXISTS "profiles_user_isolation" ON public.profiles;
CREATE POLICY "profiles_user_isolation"
  ON public.profiles FOR ALL TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_service_role" ON public.profiles;
CREATE POLICY "profiles_service_role"
  ON public.profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- gmail_connections
DROP POLICY IF EXISTS "gmail_connections_user_isolation" ON public.gmail_connections;
CREATE POLICY "gmail_connections_user_isolation"
  ON public.gmail_connections FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "gmail_connections_service_role" ON public.gmail_connections;
CREATE POLICY "gmail_connections_service_role"
  ON public.gmail_connections FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- emails
DROP POLICY IF EXISTS "emails_user_isolation" ON public.emails;
CREATE POLICY "emails_user_isolation"
  ON public.emails FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "emails_service_role" ON public.emails;
CREATE POLICY "emails_service_role"
  ON public.emails FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- email_drafts
DROP POLICY IF EXISTS "email_drafts_user_isolation" ON public.email_drafts;
CREATE POLICY "email_drafts_user_isolation"
  ON public.email_drafts FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "email_drafts_service_role" ON public.email_drafts;
CREATE POLICY "email_drafts_service_role"
  ON public.email_drafts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- scheduled_emails
DROP POLICY IF EXISTS "scheduled_emails_user_isolation" ON public.scheduled_emails;
CREATE POLICY "scheduled_emails_user_isolation"
  ON public.scheduled_emails FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "scheduled_emails_service_role" ON public.scheduled_emails;
CREATE POLICY "scheduled_emails_service_role"
  ON public.scheduled_emails FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- contacts
DROP POLICY IF EXISTS "contacts_user_isolation" ON public.contacts;
CREATE POLICY "contacts_user_isolation"
  ON public.contacts FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "contacts_service_role" ON public.contacts;
CREATE POLICY "contacts_service_role"
  ON public.contacts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- email_templates
DROP POLICY IF EXISTS "email_templates_read" ON public.email_templates;
CREATE POLICY "email_templates_read"
  ON public.email_templates FOR SELECT TO authenticated
  USING (is_default = true OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "email_templates_write" ON public.email_templates;
CREATE POLICY "email_templates_write"
  ON public.email_templates FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "email_templates_service_role" ON public.email_templates;
CREATE POLICY "email_templates_service_role"
  ON public.email_templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- email_sync_state
DROP POLICY IF EXISTS "email_sync_state_user_isolation" ON public.email_sync_state;
CREATE POLICY "email_sync_state_user_isolation"
  ON public.email_sync_state FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "email_sync_state_service_role" ON public.email_sync_state;
CREATE POLICY "email_sync_state_service_role"
  ON public.email_sync_state FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- email_threads
DROP POLICY IF EXISTS "email_threads_user_isolation" ON public.email_threads;
CREATE POLICY "email_threads_user_isolation"
  ON public.email_threads FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "email_threads_service_role" ON public.email_threads;
CREATE POLICY "email_threads_service_role"
  ON public.email_threads FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- email_labels
DROP POLICY IF EXISTS "email_labels_user_isolation" ON public.email_labels;
CREATE POLICY "email_labels_user_isolation"
  ON public.email_labels FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "email_labels_service_role" ON public.email_labels;
CREATE POLICY "email_labels_service_role"
  ON public.email_labels FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- email_events
DROP POLICY IF EXISTS "email_events_user_isolation" ON public.email_events;
CREATE POLICY "email_events_user_isolation"
  ON public.email_events FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "email_events_service_role" ON public.email_events;
CREATE POLICY "email_events_service_role"
  ON public.email_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Notification (consolidating into a single, unambiguous policy)
DROP POLICY IF EXISTS "Notification_user_isolation" ON public."Notification";
CREATE POLICY "Notification_user_isolation"
  ON public."Notification" FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id OR ((select auth.uid())::text = "userId"))
  WITH CHECK ((select auth.uid()) = user_id OR ((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "Notification_service_role" ON public."Notification";
CREATE POLICY "Notification_service_role"
  ON public."Notification" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- UserSignature
DROP POLICY IF EXISTS "UserSignature_user_isolation" ON public."UserSignature";
CREATE POLICY "UserSignature_user_isolation"
  ON public."UserSignature" FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id OR ((select auth.uid())::text = "userId"))
  WITH CHECK ((select auth.uid()) = user_id OR ((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "UserSignature_service_role" ON public."UserSignature";
CREATE POLICY "UserSignature_service_role"
  ON public."UserSignature" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Email (legacy)
DROP POLICY IF EXISTS "Email_legacy_user_isolation" ON public."Email";
CREATE POLICY "Email_legacy_user_isolation"
  ON public."Email" FOR ALL TO authenticated
  USING (((select auth.uid())::text = "userId"))
  WITH CHECK (((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "Email_legacy_service_role" ON public."Email";
CREATE POLICY "Email_legacy_service_role"
  ON public."Email" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- GmailAccount (legacy)
DROP POLICY IF EXISTS "GmailAccount_legacy_user_isolation" ON public."GmailAccount";
CREATE POLICY "GmailAccount_legacy_user_isolation"
  ON public."GmailAccount" FOR ALL TO authenticated
  USING (((select auth.uid())::text = "userId"))
  WITH CHECK (((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "GmailAccount_legacy_service_role" ON public."GmailAccount";
CREATE POLICY "GmailAccount_legacy_service_role"
  ON public."GmailAccount" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- User (legacy)
DROP POLICY IF EXISTS "User_legacy_read" ON public."User";
CREATE POLICY "User_legacy_read"
  ON public."User" FOR SELECT TO authenticated
  USING (((select auth.uid())::text = id));

DROP POLICY IF EXISTS "User_legacy_service_role" ON public."User";
CREATE POLICY "User_legacy_service_role"
  ON public."User" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 8. Secure RPC Functions & Revoke Unprivileged Execution
REVOKE EXECUTE ON FUNCTION public.associate_legacy_user_data(UUID, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.associate_legacy_user_data(UUID, TEXT) TO service_role;

-- Secure get_dashboard_analytics to strictly derive caller from auth.uid()
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total INT := 0;
  v_sent INT := 0;
  v_received INT := 0;
  v_unread INT := 0;
  v_starred INT := 0;
  v_trash INT := 0;
  v_spam INT := 0;
  v_draft INT := 0;
  v_scheduled INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT
    count(*),
    count(CASE WHEN direction = 'sent' OR status = 'sent' OR status = 'delivered' THEN 1 END),
    count(CASE WHEN direction = 'received' OR status = 'received' OR status = 'incoming' THEN 1 END),
    count(CASE WHEN is_read = false THEN 1 END),
    count(CASE WHEN is_starred = true THEN 1 END),
    count(CASE WHEN is_trash = true THEN 1 END),
    count(CASE WHEN is_spam = true THEN 1 END),
    count(CASE WHEN is_draft = true OR status = 'draft' THEN 1 END)
  INTO v_total, v_sent, v_received, v_unread, v_starred, v_trash, v_spam, v_draft
  FROM public.emails
  WHERE user_id = v_user_id;

  SELECT count(*) INTO v_scheduled
  FROM public.scheduled_emails
  WHERE user_id = v_user_id AND status = 'scheduled';

  RETURN jsonb_build_object(
    'total', v_total,
    'sent', v_sent,
    'received', v_received,
    'unread', v_unread,
    'starred', v_starred,
    'trash', v_trash,
    'spam', v_spam,
    'draft', v_draft,
    'scheduled', v_scheduled
  );
END;
$$;

-- Template (unambiguous, non-overlapping policies)
DROP POLICY IF EXISTS "Template_user_read" ON public."Template";
CREATE POLICY "Template_user_read"
  ON public."Template" FOR SELECT TO authenticated
  USING ("isDefault" = true OR (select auth.uid()) = user_id OR ((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "Template_user_write" ON public."Template";
CREATE POLICY "Template_user_write"
  ON public."Template" FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id OR ((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "Template_user_update" ON public."Template";
CREATE POLICY "Template_user_update"
  ON public."Template" FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id OR ((select auth.uid())::text = "userId"))
  WITH CHECK ((select auth.uid()) = user_id OR ((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "Template_user_delete" ON public."Template";
CREATE POLICY "Template_user_delete"
  ON public."Template" FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id OR ((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "Template_service_role" ON public."Template";
CREATE POLICY "Template_service_role"
  ON public."Template" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Contact (legacy)
DROP POLICY IF EXISTS "Users can view own contacts" ON public."Contact";
DROP POLICY IF EXISTS "Contact_user_isolation" ON public."Contact";
CREATE POLICY "Contact_user_isolation"
  ON public."Contact" FOR ALL TO authenticated
  USING (((select auth.uid())::text = "userId"))
  WITH CHECK (((select auth.uid())::text = "userId"));

DROP POLICY IF EXISTS "Contact_service_role" ON public."Contact";
CREATE POLICY "Contact_service_role"
  ON public."Contact" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Restrict get_dashboard_analytics to service_role only
REVOKE EXECUTE ON FUNCTION public.get_dashboard_analytics() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_analytics() TO service_role;

-- 9. Comprehensive Performance & Isolation Indexes
CREATE INDEX IF NOT EXISTS emails_user_created_desc_idx ON public.emails (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS emails_user_thread_idx ON public.emails (user_id, gmail_thread_id);
CREATE INDEX IF NOT EXISTS drafts_user_updated_desc_idx ON public.email_drafts (user_id, updated_at DESC);

