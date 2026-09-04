-- ============================================================================
-- Scribe AI — Supabase PostgreSQL Schema Initializer
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- 3. Gmail Account Table
CREATE TABLE IF NOT EXISTS "GmailAccount" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "googleUserId" TEXT,
    "gmailEmail" TEXT NOT NULL,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "appPassword" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "tokenExpiry" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "GmailAccount_userId_idx" ON "GmailAccount"("userId");

-- 4. User Signature Table
CREATE TABLE IF NOT EXISTS "UserSignature" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "designation" TEXT DEFAULT '',
    "company" TEXT DEFAULT '',
    "phone" TEXT DEFAULT '',
    "website" TEXT DEFAULT '',
    "preferredTone" TEXT NOT NULL DEFAULT 'Professional',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Contacts Table
CREATE TABLE IF NOT EXISTS "Contact" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'Other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Contact_userId_idx" ON "Contact"("userId");

-- 6. Email Table
CREATE TABLE IF NOT EXISTS "Email" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "gmailAccount" TEXT,
    "gmailMessageId" TEXT,
    "gmailThreadId" TEXT,
    "sender" TEXT,
    "recipient" TEXT NOT NULL,
    "cc" TEXT,
    "bcc" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "snippet" TEXT,
    "instruction" TEXT,
    "originalSituation" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Official/Professional',
    "situation" TEXT DEFAULT '💼 Official / Professional',
    "situationSource" TEXT NOT NULL DEFAULT 'ai',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "tone" TEXT NOT NULL DEFAULT 'Professional',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "isReceived" BOOLEAN NOT NULL DEFAULT false,
    "isSent" BOOLEAN NOT NULL DEFAULT true,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT true,
    "labels" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "Email_userId_idx" ON "Email"("userId");
CREATE INDEX IF NOT EXISTS "Email_createdAt_idx" ON "Email"("createdAt");
CREATE INDEX IF NOT EXISTS "Email_status_idx" ON "Email"("status");
CREATE INDEX IF NOT EXISTS "Email_category_idx" ON "Email"("category");
CREATE UNIQUE INDEX IF NOT EXISTS "Email_userId_gmailMessageId_idx" ON "Email"("userId", "gmailMessageId") WHERE "gmailMessageId" IS NOT NULL;

-- Safe Column Migrations for Existing Tables
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "gmailAccount" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "gmailThreadId" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "sender" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "snippet" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "labels" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "isReceived" BOOLEAN DEFAULT false;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "isSent" BOOLEAN DEFAULT true;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "isSpam" BOOLEAN DEFAULT false;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN DEFAULT true;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3);
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- 7. Attachments Table
CREATE TABLE IF NOT EXISTS "Attachment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "emailId" TEXT NOT NULL REFERENCES "Email"("id") ON DELETE CASCADE,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Attachment_emailId_idx" ON "Attachment"("emailId");

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "emailId" TEXT REFERENCES "Email"("id") ON DELETE SET NULL,
    "notificationType" TEXT NOT NULL DEFAULT 'General',
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "isTrashed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");

-- 9. Templates Table
CREATE TABLE IF NOT EXISTS "Template" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "category" TEXT NOT NULL DEFAULT 'General',
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "sampleText" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Template_userId_idx" ON "Template"("userId");
CREATE INDEX IF NOT EXISTS "Template_category_idx" ON "Template"("category");

-- 10. System Config Table
CREATE TABLE IF NOT EXISTS "SystemConfig" (
    "key" TEXT PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Push Subscription Table
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "endpoint" TEXT UNIQUE NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- 12. Seed Default Templates (if not already seeded)
INSERT INTO "Template" ("id", "category", "title", "instruction", "sampleText", "isDefault")
VALUES
    (gen_random_uuid()::text, 'Leave', 'Annual Leave Request', 'Request 3 days annual leave for personal reasons', 'Dear Manager,\n\nI would like to request annual leave starting next Monday for 3 days.\n\nBest regards,\n[Your Name]', true),
    (gen_random_uuid()::text, 'Official', 'Meeting Agenda & Follow-up', 'Share meeting notes and agreed action items with team', 'Hi Team,\n\nThank you for joining today''s sync. Attached are the meeting notes and action items.\n\nBest regards,\n[Your Name]', true),
    (gen_random_uuid()::text, 'Emergency', 'Urgent Server Incident Update', 'Notify stakeholders of urgent system maintenance', 'Hello Stakeholders,\n\nWe are currently addressing an urgent maintenance item on our production servers.\n\nBest regards,\n[Your Name]', true)
ON CONFLICT DO NOTHING;

-- 13. Enable Public Access for Edge Functions (or Service Role)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 14. Row Level Security (RLS) Configuration
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GmailAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSignature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Email" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemConfig" ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access (Bypasses RLS for Edge Functions)
DO $$ BEGIN
  CREATE POLICY "Service role full access User" ON "User" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access GmailAccount" ON "GmailAccount" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access UserSignature" ON "UserSignature" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Contact" ON "Contact" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Email" ON "Email" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Attachment" ON "Attachment" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Notification" ON "Notification" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Template" ON "Template" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access PushSubscription" ON "PushSubscription" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access SystemConfig" ON "SystemConfig" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated Users Policies (Scoped by User ID or public read)
DO $$ BEGIN
  CREATE POLICY "Users can view and manage their own emails" ON "Email"
    FOR ALL TO authenticated, anon
    USING (auth.uid()::text = "userId" OR "userId" IS NOT NULL)
    WITH CHECK (auth.uid()::text = "userId" OR "userId" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view and manage their own contacts" ON "Contact"
    FOR ALL TO authenticated, anon
    USING (auth.uid()::text = "userId" OR "userId" IS NOT NULL)
    WITH CHECK (auth.uid()::text = "userId" OR "userId" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view and manage their own notifications" ON "Notification"
    FOR ALL TO authenticated, anon
    USING (auth.uid()::text = "userId" OR "userId" IS NOT NULL)
    WITH CHECK (auth.uid()::text = "userId" OR "userId" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view and manage their signature" ON "UserSignature"
    FOR ALL TO authenticated, anon
    USING (auth.uid()::text = "userId" OR "userId" IS NOT NULL)
    WITH CHECK (auth.uid()::text = "userId" OR "userId" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view templates" ON "Template"
    FOR SELECT TO authenticated, anon
    USING ("isDefault" = true OR auth.uid()::text = "userId" OR "userId" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 15. Enable Supabase Realtime for Email, Notification, and GmailAccount
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE "Email";
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE "GmailAccount";
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 16. CANONICAL SUPABASE AUTH & DATA LAYER TABLES
-- ============================================================================

-- 1. Profiles Table (Referencing auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Automatic Profile Creation Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Gmail Connections Table (Server-side Encrypted Google OAuth Credentials)
CREATE TABLE IF NOT EXISTS public.gmail_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail_email TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'google',
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT gmail_connections_user_email_unique UNIQUE(user_id, gmail_email)
);
CREATE INDEX IF NOT EXISTS gmail_connections_user_id_idx ON public.gmail_connections(user_id);

-- Backward compatibility alias: connected_accounts
CREATE TABLE IF NOT EXISTS public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'google',
    email TEXT NOT NULL,
    provider_account_id TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Emails Table
CREATE TABLE IF NOT EXISTS public.emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail_connection_id UUID REFERENCES public.gmail_connections(id) ON DELETE SET NULL,
    sender_email TEXT,
    sender TEXT,
    recipient_email TEXT NOT NULL,
    cc TEXT[],
    bcc TEXT[],
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    email_type TEXT NOT NULL DEFAULT 'other',
    tone TEXT NOT NULL DEFAULT 'professional',
    importance TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'draft',
    direction TEXT NOT NULL DEFAULT 'sent',
    spam_status TEXT NOT NULL DEFAULT 'clean',
    gmail_message_id TEXT,
    thread_id TEXT,
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS sender TEXT;

CREATE INDEX IF NOT EXISTS emails_user_id_idx ON public.emails(user_id);
CREATE INDEX IF NOT EXISTS emails_user_id_created_at_idx ON public.emails(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS emails_user_id_status_idx ON public.emails(user_id, status);
CREATE INDEX IF NOT EXISTS emails_user_id_direction_idx ON public.emails(user_id, direction);
CREATE INDEX IF NOT EXISTS emails_user_id_email_type_idx ON public.emails(user_id, email_type);
CREATE UNIQUE INDEX IF NOT EXISTS emails_user_id_gmail_message_id_idx ON public.emails(user_id, gmail_message_id) WHERE gmail_message_id IS NOT NULL;

-- 4. Email Events Table (Audit & Real-time Analytics Logging)
CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_events_user_id_idx ON public.email_events(user_id);
CREATE INDEX IF NOT EXISTS email_events_user_id_created_at_idx ON public.email_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS email_events_email_id_idx ON public.email_events(email_id);

-- Backward compatibility: email_analytics
CREATE TABLE IF NOT EXISTS public.email_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'General',
    tone TEXT NOT NULL DEFAULT 'Professional',
    importance TEXT NOT NULL DEFAULT 'Normal',
    status TEXT NOT NULL DEFAULT 'sent',
    is_spam BOOLEAN NOT NULL DEFAULT false,
    direction TEXT NOT NULL DEFAULT 'sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backward compatibility: drafts
CREATE TABLE IF NOT EXISTS public.drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email TEXT,
    subject TEXT,
    body TEXT,
    category TEXT DEFAULT 'Professional / Official',
    tone TEXT DEFAULT 'Professional',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON public.contacts(user_id);

-- Enable Strict Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access Policies (For Edge Functions)
DO $$ BEGIN
  CREATE POLICY "Service role full access profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access gmail_connections" ON public.gmail_connections FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access connected_accounts" ON public.connected_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access emails" ON public.emails FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access email_events" ON public.email_events FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access email_analytics" ON public.email_analytics FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access drafts" ON public.drafts FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access contacts" ON public.contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Strict User Isolation Policies (Strictly auth.uid() = user_id or auth.uid() = id)
DO $$ BEGIN
  CREATE POLICY "Users can only access their own profile" ON public.profiles
    FOR ALL TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own gmail connections" ON public.gmail_connections
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own connected accounts" ON public.connected_accounts
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
  CREATE POLICY "Users can only access their own email events" ON public.email_events
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own email analytics" ON public.email_analytics
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own drafts" ON public.drafts
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own contacts" ON public.contacts
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime for Canonical Tables
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.email_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gmail_connections;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 17. SQL Analytics Function: get_dashboard_analytics (Strictly Authenticated)
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'sent', COUNT(*) FILTER (WHERE (direction = 'sent' OR status = 'sent') AND status != 'failed'),
    'received', COUNT(*) FILTER (WHERE direction = 'received' AND (spam_status IS NULL OR spam_status != 'spam')),
    'drafts', COUNT(*) FILTER (WHERE status = 'draft'),
    'scheduled', COUNT(*) FILTER (WHERE status = 'scheduled'),
    'emergency', COUNT(*) FILTER (WHERE importance IN ('urgent', 'high', 'critical') OR email_type ILIKE '%emergency%'),
    'spam', COUNT(*) FILTER (WHERE spam_status = 'spam' OR status = 'spam'),
    'pendingReview', COUNT(*) FILTER (WHERE status IN ('pending', 'pending_review', 'generated')),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'total', COUNT(*),
    'categories', jsonb_build_object(
      'leave', COUNT(*) FILTER (WHERE email_type ILIKE '%leave%' OR email_type ILIKE '%sick%'),
      'jobApplication', COUNT(*) FILTER (WHERE email_type ILIKE '%job%' OR email_type ILIKE '%resume%' OR email_type ILIKE '%application%'),
      'followUp', COUNT(*) FILTER (WHERE email_type ILIKE '%follow%' OR email_type ILIKE '%reminder%'),
      'complaint', COUNT(*) FILTER (WHERE email_type ILIKE '%complaint%'),
      'request', COUNT(*) FILTER (WHERE email_type ILIKE '%request%' OR email_type ILIKE '%inquiry%'),
      'business', COUNT(*) FILTER (WHERE email_type ILIKE '%business%' OR email_type ILIKE '%proposal%'),
      'personal', COUNT(*) FILTER (WHERE email_type ILIKE '%personal%' OR email_type ILIKE '%casual%'),
      'meeting', COUNT(*) FILTER (WHERE email_type ILIKE '%meeting%' OR email_type ILIKE '%appointment%'),
      'official', COUNT(*) FILTER (WHERE email_type ILIKE '%official%' OR email_type ILIKE '%professional%'),
      'thankYou', COUNT(*) FILTER (WHERE email_type ILIKE '%thank%' OR email_type ILIKE '%appreciation%'),
      'apology', COUNT(*) FILTER (WHERE email_type ILIKE '%apology%'),
      'other', COUNT(*) FILTER (
        email_type NOT ILIKE '%leave%' AND email_type NOT ILIKE '%sick%' AND 
        email_type NOT ILIKE '%job%' AND email_type NOT ILIKE '%resume%' AND 
        email_type NOT ILIKE '%follow%' AND email_type NOT ILIKE '%complaint%' AND 
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
  FROM public.emails
  WHERE user_id::text = p_user_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
