-- ============================================================================
-- Scribe AI — Baseline Schema Migration
-- File: supabase/migrations/20260901000000_initial_schema.sql
-- ============================================================================

-- 1. Enable Required Extensions
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

-- 5. Contacts Table (Legacy)
CREATE TABLE IF NOT EXISTS "Contact" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'Other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Contact_userId_idx" ON "Contact"("userId");

-- 6. Email Table (Legacy)
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
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

-- 12. Profiles Table (Referencing auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- 13. Gmail Connections Table (Server-side Encrypted Google OAuth Credentials)
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

-- Connected Accounts Compatibility Table
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

-- 14. Canonical Emails Table
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
CREATE INDEX IF NOT EXISTS emails_user_id_idx ON public.emails(user_id);
CREATE INDEX IF NOT EXISTS emails_user_id_created_at_idx ON public.emails(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS emails_user_id_status_idx ON public.emails(user_id, status);
CREATE INDEX IF NOT EXISTS emails_user_id_direction_idx ON public.emails(user_id, direction);
CREATE INDEX IF NOT EXISTS emails_user_id_email_type_idx ON public.emails(user_id, email_type);
CREATE UNIQUE INDEX IF NOT EXISTS emails_user_id_gmail_message_id_idx ON public.emails(user_id, gmail_message_id) WHERE gmail_message_id IS NOT NULL;

-- 15. Email Events Table (Audit & Real-time Analytics Logging)
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

-- 16. Email Analytics Table (Backward Compatibility)
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

-- 17. Drafts Table (Backward Compatibility)
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

-- 18. Contacts Table (Canonical)
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

-- 19. Enable Row Level Security (RLS) on all base tables
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GmailAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "UserSignature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Email" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SystemConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;

-- 20. Service Role Policies
DO $$ BEGIN
  CREATE POLICY "Service role full access User" ON "User" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access GmailAccount" ON "GmailAccount" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access UserSignature" ON "UserSignature" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Contact" ON "Contact" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Email" ON "Email" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Attachment" ON "Attachment" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Notification" ON "Notification" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access Template" ON "Template" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access PushSubscription" ON "PushSubscription" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access SystemConfig" ON "SystemConfig" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access gmail_connections" ON public.gmail_connections FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access connected_accounts" ON public.connected_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access emails" ON public.emails FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access email_events" ON public.email_events FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access email_analytics" ON public.email_analytics FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access drafts" ON public.drafts FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access contacts" ON public.contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

-- 21. Authenticated User Policies (Strictly User Isolated)
DO $$ BEGIN
  CREATE POLICY "Users can only access their own profile" ON public.profiles
    FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own gmail connections" ON public.gmail_connections
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own connected accounts" ON public.connected_accounts
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own emails" ON public.emails
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own email events" ON public.email_events
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own email analytics" ON public.email_analytics
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own drafts" ON public.drafts
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own contacts" ON public.contacts
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view and manage their own legacy emails" ON "Email"
    FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;

-- 22. Safe Realtime Publications
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emails') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
    END IF;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_events') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.email_events;
    END IF;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gmail_connections') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.gmail_connections;
    END IF;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
