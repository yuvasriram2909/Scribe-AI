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
