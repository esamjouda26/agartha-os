-- ============================================================
-- AGARTHA OS — SCHEMA REVIEW v2
-- PURPOSE: Review before applying. Do NOT run directly.
-- ============================================================


-- ============================================================
-- SECTION 1: ENUM CHANGES
-- NOTE: PostgreSQL cannot DROP enum values in-place.
-- Strategy: create new type → migrate data → drop old → rename.
-- ============================================================


-- ────────────────────────────────────────
-- 1A. employment_status — KEEP 'pending' WITH NEW MEANING
-- VALUES: active, pending, on_leave, suspended, terminated
--
-- 'pending' NEW MEANING:
--   IT has approved the IAM request.
--   Auth account IS created and magic link IS sent.
--   But staff_records.contract_start is in the future.
--   Staff cannot log in effectively until system flips to 'active'.
--   A scheduled cron job checks daily and sets 'active' on contract_start date.
--
-- 'terminated' TWO TRIGGERS:
--   1. HR submits a termination IAM request → IT approves → set terminated.
--   2. System cron detects contract_end < CURRENT_DATE → auto-terminates.
--      In both cases: auth account is banned + employment_status = 'terminated'.
-- ────────────────────────────────────────

-- NO enum type change needed — 'pending' stays.
-- The enum already has all required values:
--   active, pending, on_leave, suspended, terminated


-- ────────────────────────────────────────
-- 1B. termination_reason — DROP ENTIRE ENUM
-- BEFORE: resignation, contract_expired, misconduct, other
-- AFTER:  (deleted — no longer needed)
--
-- Reason: Termination is now an IAM request (termination type).
--         Reason is captured in hr_remark on the iam_request.
--         The status_reason col on profiles covers the lock reason.
-- ────────────────────────────────────────

-- First drop the column from staff_records that references it
ALTER TABLE public.staff_records
  DROP COLUMN IF EXISTS termination_reason;

ALTER TABLE public.staff_records
  DROP COLUMN IF EXISTS terminated_at;

ALTER TABLE public.staff_records
  DROP COLUMN IF EXISTS terminated_by;

-- Now safe to drop the type
DROP TYPE public.termination_reason;


-- ────────────────────────────────────────
-- 1C. iam_request_status — REMOVE 'pending_hr' and 'executed'
-- BEFORE: pending_hr, pending_it, approved, rejected, executed
-- AFTER:  pending_it, approved, rejected
--
-- Reason: HR submits → goes directly to IT (no HR approval step).
--         'executed' was a separate state after 'approved', 
--         now approval IS execution (auth account created on approve).
-- ────────────────────────────────────────

CREATE TYPE iam_request_status_new AS ENUM (
  'pending_it',
  'approved',
  'rejected'
);

-- Migrate existing rows:
--   pending_hr → pending_it  (skip HR step, go straight to IT)
--   executed   → approved    (collapse into approved)
UPDATE public.iam_requests
  SET status = 'pending_it'
  WHERE status::text = 'pending_hr';

UPDATE public.iam_requests
  SET status = 'approved'
  WHERE status::text = 'executed';

ALTER TABLE public.iam_requests
  ALTER COLUMN status
  TYPE iam_request_status_new
  USING status::text::iam_request_status_new;

-- Update the column default
ALTER TABLE public.iam_requests
  ALTER COLUMN status
  SET DEFAULT 'pending_it'::iam_request_status_new;

DROP TYPE public.iam_request_status;
ALTER TYPE iam_request_status_new RENAME TO iam_request_status;


-- ────────────────────────────────────────
-- 1D. iam_request_type — NO CHANGE NEEDED ✓
-- Current values: provisioning, transfer, termination
-- These already match the intended business rules:
--   'provisioning' → HR creates a new staff member
--   'transfer'     → HR changes a staff member's role
--   'termination'  → HR terminates a staff member
-- ────────────────────────────────────────


-- ============================================================
-- SECTION 2: iam_requests TABLE — COLUMN CHANGES
--
-- CURRENT COLUMNS:
--   id, request_type, status, staff_record_id,
--   target_role, current_role, justification,
--   hr_approved_by, hr_approved_at,
--   it_approved_by, it_approved_at, it_auth_note,
--   created_at, updated_at, created_by
--
-- FINAL COLUMNS:
--   id, request_type, status, staff_record_id,
--   target_role, current_role,
--   work_email,
--   hr_remark, it_remark,
--   reviewed_by, reviewed_at,
--   created_at, updated_at, created_by
-- ============================================================


-- ── REMOVE: HR approval audit trail (no HR approval step anymore)
ALTER TABLE public.iam_requests DROP COLUMN IF EXISTS hr_approved_by;
ALTER TABLE public.iam_requests DROP COLUMN IF EXISTS hr_approved_at;


-- ── RENAME: justification → hr_remark
--    This is the text box HR fills when submitting the request.
ALTER TABLE public.iam_requests
  RENAME COLUMN justification TO hr_remark;


-- ── RENAME: it_approved_by → reviewed_by
--    The IT admin who approved or rejected.
ALTER TABLE public.iam_requests
  RENAME COLUMN it_approved_by TO reviewed_by;


-- ── RENAME: it_approved_at → reviewed_at
ALTER TABLE public.iam_requests
  RENAME COLUMN it_approved_at TO reviewed_at;


-- ── RENAME: it_auth_note → it_remark
--    Text box IT fills when rejecting so HR can see the reason.
ALTER TABLE public.iam_requests
  RENAME COLUMN it_auth_note TO it_remark;


-- ── NO work_email column on iam_requests.
--    Work email is AUTO-GENERATED at approval time:
--    Format: first.last@agarthaworld.com (derived from staff_records.legal_name)
--    IT does not enter it — the backend generates it from the HR record.
--    It is written directly to auth.users.email and profiles.email on approval.


-- ============================================================
-- SECTION 3: FINAL iam_requests COLUMN ORDER (for reference)
-- ============================================================

-- id                uuid        PK, NOT NULL, DEFAULT gen_random_uuid()
-- request_type      enum        NOT NULL  (provisioning | transfer | termination)
-- status            enum        NOT NULL  DEFAULT 'pending_it'
--                                         (pending_it | approved | rejected)
-- staff_record_id   uuid        FK → staff_records.id
-- target_role       staff_role  NULLABLE  (NULL for termination type)
-- current_role      staff_role  NULLABLE  (NULL for provisioning type)
-- hr_remark         text        NULLABLE  (HR fills on submission — reason/context)
-- it_remark         text        NULLABLE  (IT fills on rejection — reason shown to HR)
-- reviewed_by       uuid        FK → profiles.id (IT admin who acted)
-- reviewed_at       timestamptz NULLABLE
-- created_by        uuid        FK → profiles.id (HR manager who submitted)
-- created_at        timestamptz NOT NULL DEFAULT now()
-- updated_at        timestamptz NULLABLE


-- ============================================================
-- SECTION 4: profiles TABLE — COLUMN CHANGES
--
-- DESIGN DECISIONS RECAP:
--   - profiles = IT-managed identity & access control layer
--   - staff_record_id: FK added to profiles pointing TO staff_records
--     (direction: profiles → staff_records, not the other way)
--   - email in profiles = WORK email, auto-generated by IT admin
--     on provisioning approval (NOT auto-synced from auth.users)
--   - email in staff_records = PERSONAL email submitted by HR (renamed)
--   - employment_status MOVES from staff_records → profiles (unified)
--   - is_locked, locked_*, is_mfa_enabled, last_sign_in_at: all dropped
--     (replaced by employment_status + status audit trail)
--   - display_name: kept, auto-generated as First + Last from legal_name
--   - avatar_url: kept, optional profile picture URL
-- ============================================================


-- ── STEP 4.1: ADD new columns to profiles

-- Link to HR record (set by IT approval action, nullable until then)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS staff_record_id uuid UNIQUE
  REFERENCES public.staff_records(id) ON DELETE SET NULL;

-- Unique staff code e.g. EMP-1234 (moved from staff_records, set on approval)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employee_id text UNIQUE;

-- WORK email — auto-generated at IT approval time.
-- Format: first.last@agarthaworld.com (derived from staff_records.legal_name).
-- Written here by the approveIamRequestAction server action.
-- This is the login email in auth.users. It is NEVER entered manually.
-- Distinct from staff_records.personal_email (HR-submitted personal/home email).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Unified employment status. CURRENT STATE flag only — not an audit trail.
-- Full audit history lives in iam_requests (reviewed_by, reviewed_at, hr_remark).
--
-- Values:
--   pending    = Auth account created + magic link sent, contract_start not yet reached.
--               Set by approveIamRequestAction when contract_start > TODAY.
--               Flipped to 'active' automatically by daily cron on contract_start date.
--   active     = Contract started, full portal access granted.
--               Set immediately on approval if contract_start <= TODAY.
--   on_leave   = Approved leave. Set by HR via leave management system.
--   suspended  = IT security lockout or HR disciplinary action.
--   terminated = Contract ended. Set by IT on termination IAM approval
--               OR automatically by daily cron when contract_end < TODAY.
--               In both cases: auth.users is banned (ban_duration = 876600h).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employment_status public.employment_status
  NOT NULL DEFAULT 'pending';

-- NOTE: No status_updated_at / status_updated_by / status_reason on profiles.
--       Query iam_requests WHERE staff_record_id = profiles.staff_record_id
--       ORDER BY reviewed_at DESC to get the full status audit trail.


-- ── STEP 4.2: DATA MIGRATIONS (must run before dropping old columns)

-- 4.2a: Reverse the FK direction.
--       OLD: staff_records.user_id → auth.users.id (= profiles.id)
--       NEW: profiles.staff_record_id → staff_records.id
UPDATE public.profiles p
SET staff_record_id = sr.id
FROM public.staff_records sr
WHERE sr.user_id = p.id
  AND sr.user_id IS NOT NULL;

-- 4.2b: Migrate employee_id from staff_records → profiles.
--       (only runs after 4.2a so staff_record_id is already linked)
UPDATE public.profiles p
SET employee_id = sr.employee_id
FROM public.staff_records sr
WHERE sr.id = p.staff_record_id;

-- 4.2c: Migrate employment_status from staff_records → profiles.
--       After this, profiles is the authoritative source of status.
UPDATE public.profiles p
SET employment_status = sr.employment_status
FROM public.staff_records sr
WHERE sr.id = p.staff_record_id;

-- 4.2d: Migrate is_locked → employment_status = 'suspended'.
--       Any profile currently locked becomes suspended.
--       Reason/who/when is not migrated — those columns are being dropped.
--       Historical lock context is lost (acceptable: no locked rows exist in prod).
UPDATE public.profiles
SET employment_status = 'suspended'
WHERE is_locked = true
  AND employment_status = 'active';


-- ── STEP 4.3: REMOVE obsolete columns from profiles

-- Removed: replaced by employment_status = 'suspended'
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_locked;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS locked_reason;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS locked_at;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS locked_by;

-- Removed: sync was unreliable (no trigger kept these updated)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_mfa_enabled;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_sign_in_at;


-- ── FINAL profiles SCHEMA (reference)
--
-- id                uuid         PK = auth.users.id (set by trigger)
-- staff_record_id   uuid         UNIQUE FK → staff_records.id (set on IT approval)
-- employee_id       text         UNIQUE (e.g. EMP-1234, moved from staff_records)
-- email             text         UNIQUE WORK email (auto-generated: first.last@agarthaworld.com)
-- display_name      text         Auto: First + Last from legal_name
-- avatar_url        text         Optional profile picture URL
-- staff_role        staff_role   Active role (synced from auth app_metadata)
-- employment_status enum         pending | active | on_leave | suspended | terminated
--                                DEFAULT 'pending' (flipped to active by cron on contract_start)
-- password_set      boolean      false until staff completes forced password reset
-- created_at        timestamptz  NOT NULL DEFAULT now()
-- updated_at        timestamptz
--
-- AUDIT TRAIL: query iam_requests WHERE staff_record_id = profiles.staff_record_id
--   reviewed_by + reviewed_at = who acted and when
--   hr_remark = HR's reason for the request
--   it_remark = IT's rejection note


-- ============================================================
-- SECTION 5: staff_records TABLE — COLUMN CHANGES
--
-- DESIGN DECISIONS RECAP:
--   - staff_records = HR-managed PII & employment contract data
--   - Has NO knowledge of auth.users — pure HR record
--   - Created the moment HR submits the provisioning form
--   - The link to auth is on profiles.staff_record_id (other direction)
--   - email renamed to personal_email (HR-submitted, pre-auth)
--   - role removed (flows through iam_requests.target_role → profiles.staff_role)
--   - employment_status removed (moved to profiles)
--   - user_id removed (profiles side now holds the FK)
--   - employee_id removed (moved to profiles)
--   - termination columns already dropped in Section 1B
-- ============================================================


-- ── STEP 5.1: RENAME columns

-- Distinguish from profiles.email (work email).
-- This is the personal email HR submits — used only pre-auth as invite target.
ALTER TABLE public.staff_records
  RENAME COLUMN email TO personal_email;


-- ── STEP 5.2: REMOVE obsolete columns from staff_records

-- Removed: FK direction reversed — profiles.staff_record_id now holds the link
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS user_id;

-- Removed: moved to profiles (employee_id migrated in Step 4.2b)
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS employee_id;

-- Removed: role flows through iam_requests.target_role → profiles.staff_role on IT approval.
--          staff_records no longer tracks role — that is IT/auth territory.
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS role;

-- Removed: employment_status moved to profiles (migrated in Step 4.2c)
ALTER TABLE public.staff_records DROP COLUMN IF EXISTS employment_status;

-- NOTE: termination_reason, terminated_at, terminated_by
--       were already dropped in Section 1B above.


-- ── FINAL staff_records SCHEMA (reference)
--
-- id               uuid         PK own UUID (created when HR submits form)
-- personal_email   text         NOT NULL — HR-submitted personal/home email
-- legal_name       text         NOT NULL — Full official name (for contracts)
-- national_id_enc  text         ⚠ Warning: stored as plaintext despite name
-- phone            text         Personal phone number
-- address          text
-- department_id    uuid         FK → departments.id
-- contract_start   date         NOT NULL
-- contract_end     date
-- salary_enc       text         ⚠ Warning: stored as plaintext despite name
-- bank_name        text
-- bank_account_enc text         ⚠ Warning: stored as plaintext despite name
-- kin_name         text         Next of kin
-- kin_relationship text
-- kin_phone        text
-- created_by       uuid         FK → profiles.id (HR manager who submitted)
-- created_at       timestamptz  NOT NULL DEFAULT now()
-- updated_at       timestamptz


-- ============================================================
-- SECTION 6: REMAINING IMPLEMENTATION TASKS
-- (Not SQL — backend and frontend work required after migration)
-- ============================================================


-- ────────────────────────────────────────
-- TASK 1: approveIamRequestAction — FULL REWRITE (Backend)
-- File: src/app/admin/admin-analytics-actions.ts
-- Trigger: IT admin clicks Approve on a 'provisioning' iam_request
-- ────────────────────────────────────────
--
-- Step 1 — Generate work email from legal_name:
--   Fetch staff_records.legal_name via iam_requests.staff_record_id
--   Split legal_name into tokens, take first and last word.
--   Generate: first.last@agarthaworld.com (lowercase, strip diacritics)
--   Collision check: if email already exists in auth.users, append a number.
--   e.g. john.doe2@agarthaworld.com
--
-- Step 2 — Create auth.users account:
--   supabaseAdmin.auth.admin.createUser({
--     email: work_email,
--     email_confirm: true,
--     password: crypto.randomBytes(32).toString('hex'),   -- random, never shown
--     app_metadata: { staff_role: iam_requests.target_role }
--   })
--   NOTE: Do NOT use inviteUserByEmail. Use createUser + generateLink instead.
--
-- Step 3 — Generate one-time recovery link:
--   supabaseAdmin.auth.admin.generateLink({
--     type: 'recovery',
--     email: work_email
--   })
--   Extracts: data.properties.action_link  (the magic link URL)
--
-- Step 4 — Fetch personal email from HR vault:
--   SELECT personal_email FROM public.staff_records
--   WHERE id = iam_requests.staff_record_id
--
-- Step 5 — Send onboarding email via transactional provider (Resend / SendGrid):
--   TO:      staff_records.personal_email  (personal/home email)
--   SUBJECT: "Your AgarthaOS workspace is ready"
--   BODY (HTML):
--     "Welcome to AgarthaOS.
--      Your designated work email is: {work_email}
--      [Click here to securely set your password and access your workspace]"
--   Link target: action_link from Step 3
--
-- Step 6 — Write to profiles (within same DB transaction):
--   Determine initial employment_status:
--     IF staff_records.contract_start <= CURRENT_DATE → 'active'
--     IF staff_records.contract_start >  CURRENT_DATE → 'pending'
--   UPDATE profiles SET
--     staff_record_id   = iam_request.staff_record_id,
--     employee_id       = staff_records.employee_id,
--     email             = work_email,
--     display_name      = first + ' ' + last,
--     staff_role        = iam_request.target_role,
--     employment_status = (contract_start <= today ? 'active' : 'pending')
--   WHERE id = new_auth_user_id
--
--   NOTE: If status = 'pending', the staff member receives the magic link
--   and can set their password, but middleware must block portal access
--   until employment_status flips to 'active'.
--
-- Step 7 — Update iam_request:
--   UPDATE iam_requests SET
--     status       = 'approved',
--     reviewed_by  = it_admin_profile_id,
--     reviewed_at  = now()
--   WHERE id = iam_request_id


-- ────────────────────────────────────────
-- TASK 2: approveIamRequestAction — TRANSFER flow (Backend)
-- Trigger: IT admin approves a 'transfer' iam_request
-- ────────────────────────────────────────
--
-- Step 1 — Update auth.users app_metadata:
--   supabaseAdmin.auth.admin.updateUserById(user_id, {
--     app_metadata: { staff_role: iam_request.target_role }
--   })
--
-- Step 2 — Update profiles:
--   UPDATE profiles SET staff_role = iam_request.target_role
--   WHERE id = user_id
--   (bypass_role_protection trigger must be disabled for this UPDATE)
--
-- Step 3 — Update iam_request: status = 'approved', reviewed_by, reviewed_at


-- ────────────────────────────────────────
-- TASK 3: approveIamRequestAction — TERMINATION flow (Backend)
-- Trigger: IT admin approves a 'termination' iam_request
-- Note: HR submits the request with hr_remark as the reason.
--       Audit trail is fully captured in the iam_request row.
-- ────────────────────────────────────────
--
-- Step 1 — Update profiles:
--   UPDATE profiles SET employment_status = 'terminated'
--   WHERE id = user_id
--
-- Step 2 — Revoke auth access permanently:
--   supabaseAdmin.auth.admin.updateUserById(user_id, {
--     ban_duration: '876600h'   -- 100 years = effectively permanent
--   })
--
-- Step 3 — Update iam_request: status = 'approved', reviewed_by, reviewed_at


-- ────────────────────────────────────────
-- TASK 4: rejectIamRequestAction — ALL types (Backend)
-- Trigger: IT admin clicks Reject on any iam_request
-- ────────────────────────────────────────
--
-- Step 1 — Update iam_request:
--   UPDATE iam_requests SET
--     status      = 'rejected',
--     it_remark   = it_admin_input,   -- required on rejection
--     reviewed_by = it_admin_profile_id,
--     reviewed_at = now()
--
-- Step 2 — No auth changes. HR can see the rejection + it_remark in their dashboard.


-- ────────────────────────────────────────
-- TASK 5: Force password reset on first login (Frontend)
-- File: src/middleware.ts + new page src/app/auth/set-password/page.tsx
-- ────────────────────────────────────────
--
-- When user clicks the recovery magic link:
--   Supabase processes it and sets a session.
--   The user is authenticated but has a system-generated random password.
--
-- Detection: Check auth.users.last_sign_in_at vs created_at.
--   If they are within a few seconds → first login via magic link.
--   OR: Add a flag to profiles: password_set boolean DEFAULT false.
--     Set to true only after user completes the forced reset.
--
-- Middleware rule (order matters — check in this sequence):
--   1. If NOT authenticated → redirect to /auth/login
--   2. If authenticated AND password_set = false → redirect to /auth/set-password
--   3. If authenticated AND employment_status = 'pending' → redirect to /auth/not-started
--      Show: "Your account is ready but your contract starts on {contract_start}."
--   4. If authenticated AND employment_status IN ('suspended','terminated') → redirect to /auth/access-revoked
--   5. Otherwise → route to correct portal based on staff_role
--
-- /auth/set-password page:
--   Show: "Set your password to activate your account"
--   On submit: supabase.auth.updateUser({ password: new_password })
--   On success: UPDATE profiles SET password_set = true WHERE id = auth.uid()
--   Then redirect to the correct portal based on staff_role.
--
-- NOTE: Add password_set boolean DEFAULT false to profiles (see below)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_set boolean NOT NULL DEFAULT false;
-- Set true for all existing users (they already have real passwords)
UPDATE public.profiles SET password_set = true WHERE created_at < now();


-- ────────────────────────────────────────
-- TASK 6: HR Roster UI — Update provisioning form (Frontend)
-- File: src/app/management/hr-roster/
-- ────────────────────────────────────────
--
-- The provisioning form must now collect:
--   legal_name     (used to generate work email on IT approval)
--   personal_email (stored in staff_records, used for onboarding email)
--   phone
--   address
--   national_id
--   department_id
--   contract_start
--   salary
--   bank_name / bank_account
--   kin_name / kin_relationship / kin_phone
--
-- The form must NO LONGER collect:
--   - role (captured in iam_requests.target_role instead)
--   - work email (auto-generated by backend)
--   - employee_id (auto-generated by backend)
--
-- The iam_request row created alongside must set:
--   request_type    = 'provisioning'
--   status          = 'pending_it'
--   staff_record_id = newly created staff_records.id
--   target_role     = selected by HR in the form
--   hr_remark       = optional text
--   created_by      = HR manager profile id


-- ────────────────────────────────────────
-- TASK 7: IT Access Control UI — Update approval panel (Frontend)
-- File: src/app/admin/access-control/page.tsx
-- ────────────────────────────────────────
--
-- On Approve click for 'provisioning':
--   IT sees: name, personal_email (fetched from staff_records), target_role
--   IT does NOT enter work email — it is shown as a preview, auto-generated.
--   Confirmation modal: "Work email will be: john.doe@agarthaworld.com"
--   On confirm: calls approveIamRequestAction (Task 1 above)
--
-- On Approve click for 'transfer':
--   IT sees: current_role → target_role for this staff member
--   On confirm: calls approveIamRequestAction (Task 2)
--
-- On Approve click for 'termination':
--   IT sees: staff member name + hr_remark (HR's reason)
--   On confirm: calls approveIamRequestAction (Task 3)
--
-- On Reject (all types):
--   IT must enter it_remark (required, min 10 chars) before submitting
--   On confirm: calls rejectIamRequestAction (Task 4)


-- ────────────────────────────────────────
-- TASK 8: Scheduled cron job — Daily status enforcement (Backend)
-- Trigger: Runs once daily (e.g. 00:01 server time)
-- Implementation: Supabase Edge Function with pg_cron OR pg_cron directly
-- ────────────────────────────────────────
--
-- Job A — Activate pending accounts when contract_start is reached:
--   UPDATE public.profiles p
--   SET employment_status = 'active'
--   FROM public.staff_records sr
--   WHERE p.staff_record_id = sr.id
--     AND p.employment_status = 'pending'
--     AND sr.contract_start <= CURRENT_DATE;
--
-- Job B — Auto-terminate when contract_end is passed:
--   For each profile where employment_status NOT IN ('terminated')
--   AND staff_records.contract_end IS NOT NULL
--   AND staff_records.contract_end < CURRENT_DATE:
--
--   Step 1: UPDATE profiles SET employment_status = 'terminated'
--   Step 2: supabaseAdmin.auth.admin.updateUserById(user_id, {
--             ban_duration: '876600h'
--           })
--   Step 3: INSERT INTO iam_requests (
--             request_type    = 'termination',
--             status          = 'approved',
--             staff_record_id = sr.id,
--             current_role    = p.staff_role,
--             hr_remark       = 'Auto-terminated: contract end date reached.',
--             reviewed_at     = now()
--           )
--   NOTE: reviewed_by = NULL for system-initiated terminations.
--         The iam_request insert preserves the full audit trail.
--
-- ============================================================================
-- STEP 9: Configure pg_cron schedule for daily employment status sync
-- Run in Supabase Dashboard > SQL Editor (pg_cron + pg_net must be enabled)
-- ============================================================================

-- 9a. Set app-level settings (run once; replace values with secrets)
ALTER DATABASE postgres
  SET app.supabase_url = 'https://dloftzjbbhkisqrgjqgr.supabase.co';

ALTER DATABASE postgres
  SET app.cron_secret = 'YOUR_CRON_SECRET_HERE'; -- set a random secret and add to Edge Fn env

-- 9b. Schedule the cron job: daily at 00:05 UTC
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

-- To verify the schedule was created:
-- SELECT * FROM cron.job WHERE jobname = 'employment-status-sync';

-- To manually test / force-run:
-- SELECT net.http_post(
--   url     := 'https://dloftzjbbhkisqrgjqgr.supabase.co/functions/v1/cron-employment-sync',
--   headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'),
--   body    := '{}'::jsonb
-- );

