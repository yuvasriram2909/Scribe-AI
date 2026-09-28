-- ==============================================================================
-- MIGRATION: 20260928000001_dynamic_scheduled_email_system.sql
-- DESCRIPTION: Dynamic Scheduled Email System with Server-Side Claim & Timezones
-- ==============================================================================

-- 1. Ensure scheduled_emails columns
ALTER TABLE IF EXISTS public.scheduled_emails 
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS scheduled_for_local TEXT,
  ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;

CREATE INDEX IF NOT EXISTS sched_time_status_idx 
  ON public.scheduled_emails (scheduled_for, status);

CREATE INDEX IF NOT EXISTS sched_user_status_idx 
  ON public.scheduled_emails (user_id, status);

-- 2. Ensure emails & Email tables have scheduling timezone columns
ALTER TABLE IF EXISTS public.emails 
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS scheduled_for_local TEXT;

ALTER TABLE IF EXISTS public."Email" 
  ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS "scheduledForLocal" TEXT;

-- 3. Atomic Job Claim Function (FOR UPDATE SKIP LOCKED)
-- Prevents race conditions and duplicate dispatches when background runners tick
CREATE OR REPLACE FUNCTION public.claim_due_scheduled_emails(batch_size INT DEFAULT 10)
RETURNS SETOF public.scheduled_emails
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.scheduled_emails
  SET status = 'processing',
      attempts = COALESCE(attempts, 0) + 1,
      last_attempt_at = now(),
      updated_at = now()
  WHERE id IN (
    SELECT id FROM public.scheduled_emails
    WHERE status = 'scheduled'
      AND scheduled_for <= now()
    ORDER BY scheduled_for ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- 4. Cancellation Function
CREATE OR REPLACE FUNCTION public.cancel_scheduled_email(p_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.scheduled_emails
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_id 
    AND (user_id = p_user_id OR (select auth.uid()) = p_user_id)
    AND status IN ('scheduled', 'processing');
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    UPDATE public.emails
    SET status = 'Cancelled',
        updated_at = now()
    WHERE id = p_id AND user_id = p_user_id;

    UPDATE public."Email"
    SET status = 'Cancelled',
        "updatedAt" = now()
    WHERE id = p_id AND ("userId" = p_user_id::text OR user_id = p_user_id);

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 5. Reschedule Function
CREATE OR REPLACE FUNCTION public.reschedule_email(
  p_id UUID, 
  p_user_id UUID, 
  p_scheduled_for TIMESTAMPTZ, 
  p_timezone TEXT, 
  p_scheduled_for_local TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.scheduled_emails
  SET scheduled_for = p_scheduled_for,
      timezone = p_timezone,
      scheduled_for_local = p_scheduled_for_local,
      status = 'scheduled',
      updated_at = now()
  WHERE id = p_id 
    AND (user_id = p_user_id OR (select auth.uid()) = p_user_id)
    AND status IN ('scheduled', 'failed', 'cancelled');
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    UPDATE public.emails
    SET scheduled_at = p_scheduled_for,
        timezone = p_timezone,
        scheduled_for_local = p_scheduled_for_local,
        status = 'Scheduled',
        updated_at = now()
    WHERE id = p_id AND user_id = p_user_id;

    UPDATE public."Email"
    SET "scheduledAt" = p_scheduled_for,
        timezone = p_timezone,
        "scheduledForLocal" = p_scheduled_for_local,
        status = 'Scheduled',
        "updatedAt" = now()
    WHERE id = p_id AND ("userId" = p_user_id::text OR user_id = p_user_id);

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 6. Grant Permissions
GRANT EXECUTE ON FUNCTION public.claim_due_scheduled_emails(INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_scheduled_email(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reschedule_email(UUID, UUID, TIMESTAMPTZ, TEXT, TEXT) TO authenticated, service_role;
