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
    "recipient" TEXT NOT NULL,
    "cc" TEXT,
    "bcc" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "instruction" TEXT,
    "originalSituation" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Official/Professional',
    "situation" TEXT DEFAULT '💼 Official / Professional',
    "situationSource" TEXT NOT NULL DEFAULT 'ai',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "tone" TEXT NOT NULL DEFAULT 'Professional',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "errorMessage" TEXT,
    "gmailMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "Email_userId_idx" ON "Email"("userId");
CREATE INDEX IF NOT EXISTS "Email_createdAt_idx" ON "Email"("createdAt");

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
