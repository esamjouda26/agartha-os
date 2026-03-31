-- ============================================================
-- AGARTHA OS — FULL SCHEMA MIGRATION (APPLY MANUALLY)
-- Run this in Supabase Dashboard > SQL Editor
-- Production project: dloftzjbbhkisqrgjqgr
--
-- PREREQUISITES (enable in Dashboard > Database > Extensions):
--   ✓ pg_cron
--   ✓ pg_net
--
-- REPLACE BEFORE RUNNING:
--   YOUR_CRON_SECRET_HERE  →  your generated secret (see README below)
-- ============================================================


-- ============================================================
-- STEP 1: ENUM CHANGES
-- ============================================================

-- 1A. Drop obsolete termination columns (referenced enum before DROP)
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS termination_reason;
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS terminated_at;
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS terminated_by;

-- Drop old enum (type must be un-referenced before dropping)
DROP TYPE IF EXISTS public.termination_reason;


-- 1B. Simplify iam_request_status: remove pending_hr and executed
--     pending_hr → pending_it  (HR submits and it goes straight to IT)
--     executed   → approved    (approval IS execution in the new flow)

CREATE TYPE iam_request_status_new AS ENUM ('pending_it', 'approved', 'rejected');

UPDATE public.iam_requests SET status = 'pending_it' WHERE status::text = 'pending_hr';
UPDATE public.iam_requests SET status = 'approved'   WHERE status::text = 'executed';

ALTER TABLE public.iam_requests
  ALTER COLUMN status TYPE iam_request_status_new
  USING status::text::iam_request_status_new;

ALTER TABLE public.iam_requests
  ALTER COLUMN status SET DEFAULT 'pending_it'::iam_request_status_new;

DROP TYPE IF EXISTS public.iam_request_status;
ALTER TYPE iam_request_status_new RENAME TO iam_request_status;


-- ============================================================
-- STEP 2: iam_requests — COLUMN CHANGES
-- ============================================================

-- Remove HR approval audit columns (no HR approval step anymore)
ALTER TABLE public.iam_requests DROP COLUMN IF EXISTS hr_approved_by;
ALTER TABLE public.iam_requests DROP COLUMN IF EXISTS hr_approved_at;

-- Rename: justification → hr_remark
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'iam_requests' AND column_name = 'justification'
  ) THEN
    ALTER TABLE public.iam_requests RENAME COLUMN justification TO hr_remark;
  END IF;
END $$;

-- Rename: it_approved_by → reviewed_by
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'iam_requests' AND column_name = 'it_approved_by'
  ) THEN
    ALTER TABLE public.iam_requests RENAME COLUMN it_approved_by TO reviewed_by;
  END IF;
END $$;

-- Rename: it_approved_at → reviewed_at
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'iam_requests' AND column_name = 'it_approved_at'
  ) THEN
    ALTER TABLE public.iam_requests RENAME COLUMN it_approved_at TO reviewed_at;
  END IF;
END $$;

-- Rename: it_auth_note → it_remark
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'iam_requests' AND column_name = 'it_auth_note'
  ) THEN
    ALTER TABLE public.iam_requests RENAME COLUMN it_auth_note TO it_remark;
  END IF;
END $$;


-- ============================================================
-- STEP 3: profiles — ADD NEW COLUMNS
-- ============================================================

-- FK → staff_records (set by IT approval action)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS staff_record_id uuid UNIQUE
  REFERENCES public.staff_records(id) ON DELETE SET NULL;

-- Unique staff code (migrated from staff_records)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employee_id text UNIQUE;

-- Work email — auto-generated: first.last@agarthaworld.com
-- Written by approveIamRequestAction. NEVER entered manually.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Unified employment lifecycle status
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employment_status public.employment_status
  NOT NULL DEFAULT 'pending';

-- First-login gate flag — false until forced password reset is completed
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_set boolean NOT NULL DEFAULT false;


-- ============================================================
-- STEP 4: DATA MIGRATIONS (run before dropping old columns)
-- ============================================================

-- 4a. Reverse FK direction: staff_records.user_id → profiles.staff_record_id
UPDATE public.profiles p
SET    staff_record_id = sr.id
FROM   public.staff_records sr
WHERE  sr.user_id = p.id
  AND  sr.user_id IS NOT NULL;

-- 4b. Migrate employee_id: staff_records → profiles
UPDATE public.profiles p
SET    employee_id = sr.employee_id
FROM   public.staff_records sr
WHERE  sr.id = p.staff_record_id;

-- 4c. Migrate employment_status: staff_records → profiles
UPDATE public.profiles p
SET    employment_status = sr.employment_status
FROM   public.staff_records sr
WHERE  sr.id = p.staff_record_id
  AND  sr.employment_status IS NOT NULL;

-- 4d. Migrate is_locked → employment_status = 'suspended'
UPDATE public.profiles
SET    employment_status = 'suspended'
WHERE  is_locked = true
  AND  employment_status = 'active';

-- 4e. Mark all pre-existing users as password_set = true
--     (they already have real passwords — only new provisioned users start as false)
UPDATE public.profiles
SET    password_set = true
WHERE  created_at < now();


-- ============================================================
-- STEP 5: profiles — DROP OBSOLETE COLUMNS
-- ============================================================

ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_locked;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS locked_reason;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS locked_at;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS locked_by;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_mfa_enabled;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_sign_in_at;


-- ============================================================
-- STEP 6: staff_records — COLUMN CHANGES
-- ============================================================

-- Rename: email → personal_email (distinguishes from profiles.email = work email)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff_records' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.staff_records RENAME COLUMN email TO personal_email;
  END IF;
END $$;

-- Drop columns that are no longer in staff_records
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS user_id;        -- FK direction reversed
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS employee_id;    -- moved to profiles
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS role;           -- flows through iam_requests
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS employment_status; -- moved to profiles


-- ============================================================
-- STEP 7: RLS POLICY FIXES
-- ============================================================

-- Fix staff_select policy: was referencing staff_records.user_id (dropped)
-- Now looks up via profiles.staff_record_id
DROP POLICY IF EXISTS staff_select ON public.staff_records;

CREATE POLICY staff_select ON public.staff_records
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT staff_record_id
      FROM   public.profiles
      WHERE  id = auth.uid()
    )
  );

-- Fix shift_schedules self-access policy (same pattern)
DROP POLICY IF EXISTS staff_own_shifts ON public.shift_schedules;

CREATE POLICY staff_own_shifts ON public.shift_schedules
  FOR SELECT
  TO authenticated
  USING (
    staff_record_id = (
      SELECT staff_record_id
      FROM   public.profiles
      WHERE  id = auth.uid()
    )
  );


-- ============================================================
-- STEP 8: VERIFY RESULT (optional — run to inspect)
-- ============================================================

-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name IN ('profiles', 'staff_records', 'iam_requests')
--   AND table_schema = 'public'
-- ORDER BY table_name, ordinal_position;

-- SELECT typname, enumlabel
-- FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
-- WHERE typname IN ('employment_status', 'iam_request_status', 'iam_request_type')
-- ORDER BY typname, enumsortorder;


-- ============================================================
-- STEP 9: pg_cron SCHEDULE — Daily employment status sync
--
-- HOW TO GET YOUR CRON_SECRET:
--   Run this in your terminal (or PowerShell):
--     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
--   Copy the 64-char hex string.
--   Replace YOUR_CRON_SECRET_HERE below AND add it as a Supabase secret:
--     supabase secrets set CRON_SECRET=<your_generated_secret>
--
-- PREREQUISITES:
--   1. pg_cron extension enabled  (Dashboard > Database > Extensions > pg_cron)
--   2. pg_net extension enabled   (Dashboard > Database > Extensions > pg_net)
--   3. Edge Function deployed:
--        supabase functions deploy cron-employment-sync --no-verify-jwt
--   4. Secret added to Edge Function environment (step above)
-- ============================================================

-- 9a. Store the Supabase project URL in a DB-level setting
--     (pg_cron reads this at job runtime to build the HTTP call)
ALTER DATABASE postgres
  SET app.supabase_url = 'https://dloftzjbbhkisqrgjqgr.supabase.co';

-- 9b. Store your CRON_SECRET — REPLACE THE VALUE BELOW
ALTER DATABASE postgres
  SET app.cron_secret = 'YOUR_CRON_SECRET_HERE';

-- 9c. Register the daily schedule (runs at 00:05 UTC every day)
--     If the job already exists, unschedule first:
--       SELECT cron.unschedule('employment-status-sync');
SELECT cron.schedule(
  'employment-status-sync',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/cron-employment-sync',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);


-- ============================================================
-- VERIFY CRON IS REGISTERED
-- ============================================================

-- SELECT jobid, jobname, schedule, active
-- FROM cron.job
-- WHERE jobname = 'employment-status-sync';


-- ============================================================
-- MANUAL TEST: Force-run the Edge Function immediately
-- (useful to test before the first scheduled run)
-- Replace YOUR_CRON_SECRET_HERE with your actual secret.
-- ============================================================

-- SELECT net.http_post(
--   url     := 'https://dloftzjbbhkisqrgjqgr.supabase.co/functions/v1/cron-employment-sync',
--   headers := jsonb_build_object(
--     'Content-Type',  'application/json',
--     'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'
--   ),
--   body    := '{}'::jsonb
-- );
