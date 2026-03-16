-- =============================================================================
-- AgarthaOS — Exhaustive seed.sql Test Matrix (SOP 7.3)
-- =============================================================================
-- Deterministic test data for ALL roles, experiences, time_slots, inventory,
-- F&B menu items, recipes, and bookings. Run against a fresh Supabase project.
-- =============================================================================

-- ── 1. ENUM TYPES ───────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.staff_role AS ENUM ('admin','it_admin','hr_manager','ops_manager','inventory_manager','fnb_manager','maintenance_manager','marketing_manager','crew','gate_crew','ride_crew','fnb_crew','health_crew','merch_crew');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('guest','staff','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','cancelled','completed','no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.menu_item_category AS ENUM ('food','beverage','snack','dessert','combo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.menu_item_status AS ENUM ('available','unavailable','discontinued'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.po_status AS ENUM ('pending','approved','ordered','received','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.transfer_status AS ENUM ('draft','pending','in_transit','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.audit_request_status AS ENUM ('pending','in_progress','completed','discrepancy'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.incident_category AS ENUM ('safety','security','maintenance','medical','guest_complaint','operational'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.incident_status AS ENUM ('open','investigating','resolved','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.maintenance_priority AS ENUM ('low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.maintenance_wo_status AS ENUM ('open','in_progress','on_hold','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.device_status AS ENUM ('online','offline','maintenance','decommissioned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.campaign_status AS ENUM ('draft','active','paused','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.promo_status AS ENUM ('draft','active','expired','revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.employment_status AS ENUM ('pending','active','on_leave','suspended','terminated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.termination_reason AS ENUM ('resignation','end_of_contract','misconduct','redundancy','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.shift_status AS ENUM ('scheduled','checked_in','completed','absent','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.iam_request_type AS ENUM ('role_change','new_account','deactivation','mfa_reset'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.iam_request_status AS ENUM ('pending_hr','hr_approved','pending_it','it_approved','completed','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.check_in_status AS ENUM ('on_time','late','absent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.fnb_order_status AS ENUM ('pending','preparing','ready','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.prep_batch_status AS ENUM ('in_progress','completed','discarded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.waste_reason AS ENUM ('expired','damaged','quality_issue','overproduction','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.restock_priority AS ENUM ('low','normal','high','urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.restock_status AS ENUM ('pending','in_progress','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.alert_type AS ENUM ('system','inventory','maintenance','security','capacity','environmental'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.alert_severity AS ENUM ('low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.alert_status AS ENUM ('open','acknowledged','resolved','dismissed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. STAFF AUTH USERS (one per staff_role enum value) ─────────────────────
-- Static password for all test users: "Agartha2024!"
-- All share the same bcrypt hash.

DO $$
DECLARE
  _hash text := '$2a$10$ix9AOSK.y3d.eP.qN.D32.A7qQ9Vl.O9Z1D4I1aJv.K4VzZ9e9W';
  _roles text[] := ARRAY[
    'admin','it_admin','hr_manager','ops_manager','inventory_manager',
    'fnb_manager','maintenance_manager','marketing_manager','crew',
    'gate_crew','ride_crew','fnb_crew','health_crew','merch_crew'
  ];
  _role text;
  _uid uuid;
  _email text;
  _emp_id text;
  _app_role text;
  _idx int := 1;
BEGIN
  FOREACH _role IN ARRAY _roles LOOP
    _email := _role || '@agartha.local';
    _uid := gen_random_uuid();
    _emp_id := 'EMP-' || LPAD(_idx::text, 4, '0');

    -- Determine app_role
    IF _role IN ('admin', 'it_admin') THEN _app_role := 'admin';
    ELSE _app_role := 'staff';
    END IF;

    -- Insert into auth.users
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    ) VALUES (
      _uid,
      '00000000-0000-0000-0000-000000000000',
      _email,
      _hash,
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'staff_role', _role),
      jsonb_build_object('display_name', initcap(replace(_role, '_', ' '))),
      'authenticated',
      'authenticated',
      now(),
      now()
    ) ON CONFLICT (email) DO NOTHING;

    -- Get the actual uid (in case it already existed)
    SELECT id INTO _uid FROM auth.users WHERE email = _email;

    -- Insert into auth.identities
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (_uid, _uid, _email, 'email', jsonb_build_object('sub', _uid, 'email', _email), now(), now(), now())
    ON CONFLICT DO NOTHING;

    -- Profile
    INSERT INTO public.profiles (id, display_name, app_role, staff_role, is_mfa_enabled)
    VALUES (_uid, initcap(replace(_role, '_', ' ')), _app_role::app_role, _role::staff_role, _role IN ('admin','it_admin'))
    ON CONFLICT (id) DO NOTHING;

    -- Staff record
    INSERT INTO public.staff_records (user_id, employee_id, legal_name, email, role, employment_status, contract_start, created_by)
    VALUES (_uid, _emp_id, initcap(replace(_role, '_', ' ')), _email, _role::staff_role, 'active', CURRENT_DATE - interval '6 months', _uid)
    ON CONFLICT (employee_id) DO NOTHING;

    _idx := _idx + 1;
  END LOOP;
END $$;

-- ── 3. ZONES ────────────────────────────────────────────────────────────────

INSERT INTO public.zones (name, description, capacity) VALUES
  ('The Cafe', 'Entrance zone — walk-in ticketing, F&B POS, kiosks', 200),
  ('Agartha World', 'Core experience — metered arrivals, turnstiles, rides', 500),
  ('The Giftshop', 'Exit zone — merchandising and retail', 100),
  ('Main Warehouse', 'Off-stage — global procurement and inventory', NULL)
ON CONFLICT (name) DO NOTHING;

-- ── 4. DEPARTMENTS ──────────────────────────────────────────────────────────

INSERT INTO public.departments (name, description) VALUES
  ('Operations', 'Day-to-day park operations'),
  ('Food & Beverage', 'Cafe and F&B management'),
  ('Human Resources', 'Staff administration'),
  ('IT & Systems', 'Technology and infrastructure'),
  ('Maintenance', 'Facility upkeep and repairs'),
  ('Marketing', 'Campaigns and promotions'),
  ('Merchandise', 'Retail and giftshop')
ON CONFLICT (name) DO NOTHING;

-- ── 5. STOCK LOCATIONS ──────────────────────────────────────────────────────

INSERT INTO public.stock_locations (name, is_sink) VALUES
  ('Main Warehouse', false),
  ('The Cafe Kitchen', true),
  ('The Cafe Bar', true),
  ('Vending Zone A', true),
  ('Vending Zone B', true),
  ('The Giftshop Floor', true)
ON CONFLICT (name) DO NOTHING;

-- ── 6. SUPPLIERS ────────────────────────────────────────────────────────────

INSERT INTO public.suppliers (name, contact_email, category, is_active) VALUES
  ('FreshFoods Co.', 'orders@freshfoods.local', 'food', true),
  ('BevSupply Ltd.', 'sales@bevsupply.local', 'beverage', true),
  ('MerchPrint Inc.', 'info@merchprint.local', 'merchandise', true),
  ('TechParts Global', 'procurement@techparts.local', 'equipment', true)
ON CONFLICT DO NOTHING;

-- ── 7. PRODUCTS ─────────────────────────────────────────────────────────────

INSERT INTO public.products (name, sku, category, unit, reorder_point, supplier_id) VALUES
  ('Burger Bun', 'RAW-BUN-001', 'raw_ingredient', 'unit', 50,  (SELECT id FROM public.suppliers WHERE name = 'FreshFoods Co.' LIMIT 1)),
  ('Beef Patty', 'RAW-PAT-001', 'raw_ingredient', 'unit', 50,  (SELECT id FROM public.suppliers WHERE name = 'FreshFoods Co.' LIMIT 1)),
  ('Lettuce Head', 'RAW-LET-001', 'raw_ingredient', 'unit', 30,  (SELECT id FROM public.suppliers WHERE name = 'FreshFoods Co.' LIMIT 1)),
  ('Tomato', 'RAW-TOM-001', 'raw_ingredient', 'kg', 20,  (SELECT id FROM public.suppliers WHERE name = 'FreshFoods Co.' LIMIT 1)),
  ('Cheese Slice', 'RAW-CHE-001', 'raw_ingredient', 'unit', 40,  (SELECT id FROM public.suppliers WHERE name = 'FreshFoods Co.' LIMIT 1)),
  ('Cola 330ml', 'PKG-COLA-001', 'prepackaged', 'unit', 100, (SELECT id FROM public.suppliers WHERE name = 'BevSupply Ltd.' LIMIT 1)),
  ('Water 500ml', 'PKG-WAT-001', 'prepackaged', 'unit', 100, (SELECT id FROM public.suppliers WHERE name = 'BevSupply Ltd.' LIMIT 1)),
  ('Orange Juice 250ml', 'PKG-OJ-001', 'prepackaged', 'unit', 60, (SELECT id FROM public.suppliers WHERE name = 'BevSupply Ltd.' LIMIT 1)),
  ('Agartha T-Shirt', 'MERCH-TS-001', 'merchandise', 'unit', 20, (SELECT id FROM public.suppliers WHERE name = 'MerchPrint Inc.' LIMIT 1)),
  ('Agartha Mug', 'MERCH-MUG-001', 'merchandise', 'unit', 15, (SELECT id FROM public.suppliers WHERE name = 'MerchPrint Inc.' LIMIT 1)),
  ('French Fries Frozen', 'RAW-FRY-001', 'raw_ingredient', 'kg', 25, (SELECT id FROM public.suppliers WHERE name = 'FreshFoods Co.' LIMIT 1)),
  ('Coffee Beans', 'RAW-COF-001', 'raw_ingredient', 'kg', 10, (SELECT id FROM public.suppliers WHERE name = 'BevSupply Ltd.' LIMIT 1))
ON CONFLICT (sku) DO NOTHING;

-- ── 8. PRODUCT STOCK LEVELS (populate each product across locations) ────────

INSERT INTO public.product_stock_levels (product_id, location_id, current_qty, max_qty)
SELECT p.id, sl.id, 
  CASE WHEN sl.name = 'Main Warehouse' THEN 500 ELSE floor(random() * 80 + 20)::int END,
  CASE WHEN sl.name = 'Main Warehouse' THEN 1000 ELSE 150 END
FROM public.products p
CROSS JOIN public.stock_locations sl
WHERE (p.category = 'raw_ingredient' AND sl.name IN ('Main Warehouse', 'The Cafe Kitchen'))
   OR (p.category = 'prepackaged' AND sl.name IN ('Main Warehouse', 'The Cafe Bar', 'Vending Zone A', 'Vending Zone B'))
   OR (p.category = 'merchandise' AND sl.name IN ('Main Warehouse', 'The Giftshop Floor'))
ON CONFLICT DO NOTHING;

-- ── 9. TIER TEMPLATES ───────────────────────────────────────────────────────

INSERT INTO public.tier_templates (name, base_price, base_duration_minutes, base_perks) VALUES
  ('Standard', 49.99, 120, ARRAY['General admission', 'Standard rides']),
  ('Premium', 89.99, 180, ARRAY['General admission', 'All rides', 'Fast pass', 'Welcome drink']),
  ('VIP', 149.99, 240, ARRAY['General admission', 'All rides', 'Priority fast pass', 'Welcome package', 'Photo package', 'Lounge access']),
  ('Child', 29.99, 120, ARRAY['General admission', 'Kid-friendly rides']),
  ('Family', 159.99, 180, ARRAY['2 Adults + 2 Children', 'All rides', 'Family photo', 'Meal voucher'])
ON CONFLICT (name) DO NOTHING;

-- ── 10. EXPERIENCE + TIERS ──────────────────────────────────────────────────

INSERT INTO public.experiences (name, description, is_active, capacity_per_slot, max_facility_capacity, arrival_window_minutes)
VALUES ('Agartha World — Main Experience', 'The core underground adventure experience', true, 30, 500, 15)
ON CONFLICT DO NOTHING;

INSERT INTO public.experience_tiers (experience_id, tier_name, price, duration_minutes, perks)
SELECT e.id, tt.name, tt.base_price, tt.base_duration_minutes, tt.base_perks
FROM public.experiences e
CROSS JOIN public.tier_templates tt
WHERE e.name = 'Agartha World — Main Experience'
ON CONFLICT DO NOTHING;

-- ── 11. TIME SLOTS (7 days of future slots via PL/pgSQL loop) ───────────────

DO $$
DECLARE
  _exp_id uuid;
  _day int;
  _hour int;
  _slot_date date;
  _start time;
  _end time;
BEGIN
  SELECT id INTO _exp_id FROM public.experiences WHERE name = 'Agartha World — Main Experience' LIMIT 1;
  IF _exp_id IS NULL THEN RETURN; END IF;

  FOR _day IN 0..6 LOOP
    _slot_date := CURRENT_DATE + _day;
    FOR _hour IN 9..20 LOOP  -- 09:00 to 20:00, every 15 min
      FOR _q IN 0..3 LOOP
        _start := make_time(_hour, _q * 15, 0);
        _end := _start + interval '15 minutes';
        INSERT INTO public.time_slots (experience_id, slot_date, start_time, end_time, booked_count, is_active)
        VALUES (_exp_id, _slot_date, _start, _end, 0, true)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ── 12. F&B MENU ITEMS ──────────────────────────────────────────────────────

INSERT INTO public.fnb_menu_items (name, category, status, unit_price, cost_price, linked_product_id) VALUES
  ('Classic Burger', 'food', 'available', 12.99, 4.50, NULL),
  ('Cheese Burger', 'food', 'available', 14.99, 5.20, NULL),
  ('French Fries', 'food', 'available', 5.99, 1.80, NULL),
  ('Cola', 'beverage', 'available', 3.99, 0.80, (SELECT id FROM public.products WHERE sku = 'PKG-COLA-001')),
  ('Water', 'beverage', 'available', 2.49, 0.30, (SELECT id FROM public.products WHERE sku = 'PKG-WAT-001')),
  ('Orange Juice', 'beverage', 'available', 4.49, 1.20, (SELECT id FROM public.products WHERE sku = 'PKG-OJ-001')),
  ('Espresso', 'beverage', 'available', 3.49, 0.90, NULL)
ON CONFLICT DO NOTHING;

-- ── 13. F&B RECIPES (BOM for prepared items) ────────────────────────────────

INSERT INTO public.fnb_recipes (menu_item_id, product_id, quantity_required, unit) VALUES
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'Classic Burger'), (SELECT id FROM public.products WHERE sku = 'RAW-BUN-001'), 1, 'unit'),
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'Classic Burger'), (SELECT id FROM public.products WHERE sku = 'RAW-PAT-001'), 1, 'unit'),
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'Classic Burger'), (SELECT id FROM public.products WHERE sku = 'RAW-LET-001'), 0.25, 'unit'),
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'Classic Burger'), (SELECT id FROM public.products WHERE sku = 'RAW-TOM-001'), 0.1, 'kg'),
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'Cheese Burger'), (SELECT id FROM public.products WHERE sku = 'RAW-BUN-001'), 1, 'unit'),
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'Cheese Burger'), (SELECT id FROM public.products WHERE sku = 'RAW-PAT-001'), 1, 'unit'),
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'Cheese Burger'), (SELECT id FROM public.products WHERE sku = 'RAW-CHE-001'), 2, 'unit'),
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'Cheese Burger'), (SELECT id FROM public.products WHERE sku = 'RAW-LET-001'), 0.25, 'unit'),
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'French Fries'), (SELECT id FROM public.products WHERE sku = 'RAW-FRY-001'), 0.2, 'kg'),
  ((SELECT id FROM public.fnb_menu_items WHERE name = 'Espresso'), (SELECT id FROM public.products WHERE sku = 'RAW-COF-001'), 0.02, 'kg')
ON CONFLICT DO NOTHING;

-- ── 14. PROMO CODES ─────────────────────────────────────────────────────────

INSERT INTO public.promo_codes (code, description, discount_type, discount_value, max_uses, current_uses, status, valid_from, valid_to) VALUES
  ('WELCOME10', '10% off first booking', 'percentage', 10, 100, 0, 'active', now(), now() + interval '90 days'),
  ('FAMILY20', '$20 off family tier', 'fixed', 20, 50, 0, 'active', now(), now() + interval '60 days'),
  ('EXPIRED01', 'Expired test promo', 'percentage', 5, 10, 10, 'expired', now() - interval '30 days', now() - interval '1 day')
ON CONFLICT (code) DO NOTHING;

-- ── 15. TEST BOOKINGS ───────────────────────────────────────────────────────

INSERT INTO public.bookings (
  experience_id, time_slot_id, tier_name, status, total_price, booking_ref,
  booker_email, booker_name, adult_count, child_count, qr_code_ref
)
SELECT
  e.id,
  ts.id,
  'Standard',
  'confirmed',
  49.99,
  'AG-TEST0001',
  'guest.tester@example.com',
  'Test Guest',
  2, 1,
  'AGARTHA:Standard:3:' || extract(epoch from now())::text
FROM public.experiences e
JOIN public.time_slots ts ON ts.experience_id = e.id
WHERE e.name = 'Agartha World — Main Experience'
  AND ts.slot_date = CURRENT_DATE + 1
ORDER BY ts.start_time
LIMIT 1
ON CONFLICT (booking_ref) DO NOTHING;

-- Second test booking (VIP)
INSERT INTO public.bookings (
  experience_id, time_slot_id, tier_name, status, total_price, booking_ref,
  booker_email, booker_name, adult_count, child_count, qr_code_ref
)
SELECT
  e.id,
  ts.id,
  'VIP',
  'confirmed',
  149.99,
  'AG-TEST0002',
  'vip.guest@example.com',
  'VIP Guest',
  2, 0,
  'AGARTHA:VIP:2:' || extract(epoch from now())::text
FROM public.experiences e
JOIN public.time_slots ts ON ts.experience_id = e.id
WHERE e.name = 'Agartha World — Main Experience'
  AND ts.slot_date = CURRENT_DATE + 2
ORDER BY ts.start_time
LIMIT 1
ON CONFLICT (booking_ref) DO NOTHING;

-- ── 16. BOOKING ATTENDEES ───────────────────────────────────────────────────

INSERT INTO public.booking_attendees (booking_id, attendee_type, attendee_index, nickname)
SELECT b.id, 'adult', 1, 'Test Adult 1' FROM public.bookings b WHERE b.booking_ref = 'AG-TEST0001'
UNION ALL
SELECT b.id, 'adult', 2, 'Test Adult 2' FROM public.bookings b WHERE b.booking_ref = 'AG-TEST0001'
UNION ALL
SELECT b.id, 'child', 1, 'Test Child 1' FROM public.bookings b WHERE b.booking_ref = 'AG-TEST0001'
ON CONFLICT DO NOTHING;

-- ── 17. DEVICES ─────────────────────────────────────────────────────────────

INSERT INTO public.devices (name, device_type, serial_number, zone_id, status, ip_address) VALUES
  ('Entry Turnstile A', 'turnstile', 'TURN-001', (SELECT id FROM public.zones WHERE name = 'Agartha World'), 'online', '10.0.1.10'),
  ('Entry Turnstile B', 'turnstile', 'TURN-002', (SELECT id FROM public.zones WHERE name = 'Agartha World'), 'online', '10.0.1.11'),
  ('Cafe POS Terminal 1', 'pos_terminal', 'POS-001', (SELECT id FROM public.zones WHERE name = 'The Cafe'), 'online', '10.0.2.10'),
  ('Vending Machine A', 'vending', 'VEND-001', (SELECT id FROM public.zones WHERE name = 'Agartha World'), 'online', '10.0.1.20'),
  ('Giftshop POS', 'pos_terminal', 'POS-002', (SELECT id FROM public.zones WHERE name = 'The Giftshop'), 'online', '10.0.3.10'),
  ('HVAC Controller', 'environmental', 'ENV-001', (SELECT id FROM public.zones WHERE name = 'Agartha World'), 'online', '10.0.1.30')
ON CONFLICT (serial_number) DO NOTHING;

-- ── DONE ────────────────────────────────────────────────────────────────────
-- Test Matrix Summary:
--   • 14 auth.users (one per staff_role enum), password: Agartha2024!
--   • 14 profiles + 14 staff_records
--   • 4 zones, 7 departments, 6 stock locations, 4 suppliers
--   • 12 products with stock levels across locations
--   • 5 tier templates, 1 experience with 5 tiers
--   • 7 days × 48 slots/day = 336 time slots
--   • 7 F&B menu items with 10 BOM recipe rows
--   • 3 promo codes, 2 test bookings with attendees
--   • 6 devices across zones
