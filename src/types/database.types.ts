// =============================================================================
// AgarthaOS — Auto-generated Database Types from master_schema.sql
// =============================================================================

// ---------------------------------------------------------------------------
//  ENUMS
// ---------------------------------------------------------------------------

export type AppRole = "guest" | "staff" | "admin";

export type StaffRole =
  // Admin (2)
  | "it_admin"
  | "business_admin"
  // Management (8)
  | "fnb_manager"
  | "merch_manager"
  | "maintenance_manager"
  | "inventory_manager"
  | "marketing_manager"
  | "human_resources_manager"
  | "compliance_manager"
  | "operations_manager"
  // Crew (9)
  | "fnb_crew"
  | "service_crew"
  | "giftshop_crew"
  | "runner_crew"
  | "security_crew"
  | "health_crew"
  | "cleaning_crew"
  | "experience_crew"
  | "internal_maintainence_crew";

export type EmploymentStatus = "pending" | "active" | "on_leave" | "suspended" | "terminated";

export type TerminationReason =
  | "resignation"
  | "end_of_contract"
  | "misconduct"
  | "redundancy"
  | "other";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

export type MenuItemCategory = "food" | "beverage" | "snack" | "dessert" | "combo";

export type MenuItemStatus = "available" | "unavailable" | "discontinued";

export type PoStatus = "pending" | "approved" | "ordered" | "received" | "cancelled";

export type TransferStatus = "draft" | "pending" | "in_transit" | "completed" | "cancelled";

export type AuditRequestStatus = "pending" | "in_progress" | "completed" | "discrepancy";

export type IncidentCategory =
  | "safety"
  | "security"
  | "maintenance"
  | "medical"
  | "guest_complaint"
  | "operational";

export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";

export type MaintenancePriority = "low" | "medium" | "high" | "critical";

export type MaintenanceWoStatus = "open" | "in_progress" | "on_hold" | "completed" | "cancelled";

export type DeviceStatus = "online" | "offline" | "maintenance" | "decommissioned";

export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "cancelled";

export type PromoStatus = "draft" | "active" | "expired" | "revoked";

export type ShiftStatus = "scheduled" | "checked_in" | "completed" | "absent" | "cancelled";

export type IamRequestType = "role_change" | "new_account" | "deactivation" | "mfa_reset";

export type IamRequestStatus =
  | "pending_hr"
  | "hr_approved"
  | "pending_it"
  | "it_approved"
  | "completed"
  | "rejected";

export type CheckInStatus = "on_time" | "late" | "absent";

export type FnbOrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export type PrepBatchStatus = "in_progress" | "completed" | "discarded";

export type WasteReason = "expired" | "damaged" | "quality_issue" | "overproduction" | "other";

export type RestockPriority = "low" | "normal" | "high" | "urgent";

export type RestockStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type AlertType =
  | "system"
  | "inventory"
  | "maintenance"
  | "security"
  | "capacity"
  | "environmental";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertStatus = "open" | "acknowledged" | "resolved" | "dismissed";

// ---------------------------------------------------------------------------
//  ROW TYPES (mirrors each public.* table)
// ---------------------------------------------------------------------------

export interface Zone {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  category: string | null;
  is_active: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface StockLocation {
  id: string;
  name: string;
  is_sink: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  unit: string;
  reorder_point: number;
  is_active: boolean;
  supplier_id: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface ProductStockLevel {
  id: string;
  product_id: string;
  location_id: string;
  current_qty: number;
  max_qty: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface FnbMenuItem {
  id: string;
  name: string;
  category: MenuItemCategory;
  status: MenuItemStatus;
  unit_price: number | null;
  cost_price: number | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  linked_product_id: string | null;
}

export interface FnbMenuPricing {
  id: string;
  menu_item_id: string;
  tier_label: string;
  price: number;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  created_by: string | null;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  status: PoStatus;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id: string | null;
  item_name: string;
  barcode: string | null;
  unit: string | null;
  expected_qty: number;
  received_qty: number;
  photo_proof_url: string | null;
  created_at: string;
}

export interface InventoryTransfer {
  id: string;
  source_location_id: string;
  dest_location_id: string;
  assigned_runner_id: string | null;
  status: TransferStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface InventoryTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface InventoryLedger {
  id: string;
  product_id: string;
  location_id: string;
  quantity_delta: number;
  transaction_type: string;
  reference_id: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface InventoryAudit {
  id: string;
  location_id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface InventoryAuditItem {
  id: string;
  audit_id: string;
  product_id: string;
  expected_qty: number | null;
  actual_qty: number | null;
  status: AuditRequestStatus;
  photo_url: string | null;
  counted_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Incident {
  id: string;
  category: IncidentCategory;
  status: IncidentStatus;
  zone_id: string | null;
  description: string;
  logged_by: string;
  resolved_by: string | null;
  resolved_at: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface MaintenanceWorkOrder {
  id: string;
  title: string;
  description: string | null;
  priority: MaintenancePriority;
  status: MaintenanceWoStatus;
  zone_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface Device {
  id: string;
  name: string;
  device_type: string;
  serial_number: string | null;
  zone_id: string | null;
  status: DeviceStatus;
  ip_address: string | null;
  last_heartbeat: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  channel: string | null;
  budget: number | null;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  campaign_id: string | null;
  status: PromoStatus;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface StaffRecord {
  id: string;
  user_id: string | null;
  employee_id: string;
  legal_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  national_id_enc: string | null;
  bank_name: string | null;
  bank_account_enc: string | null;
  salary_enc: string | null;
  role: StaffRole;
  department_id: string | null;
  employment_status: EmploymentStatus;
  contract_start: string;
  contract_end: string | null;
  kin_name: string | null;
  kin_relationship: string | null;
  kin_phone: string | null;
  termination_reason: TerminationReason | null;
  terminated_at: string | null;
  terminated_by: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface ShiftSchedule {
  id: string;
  staff_record_id: string;
  zone_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface IamRequest {
  id: string;
  request_type: IamRequestType;
  status: IamRequestStatus;
  staff_record_id: string | null;
  target_role: StaffRole | null;
  current_role: StaffRole | null;
  justification: string | null;
  hr_approved_by: string | null;
  hr_approved_at: string | null;
  it_approved_by: string | null;
  it_approved_at: string | null;
  it_auth_note: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface SystemAuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  performed_by: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface DemandForecast {
  id: string;
  forecast_date: string;
  predicted_guests: number;
  actual_guests: number | null;
  confidence: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface OperationalConstraint {
  id: string;
  name: string;
  constraint_type: string;
  start_time: string | null;
  end_time: string | null;
  applies_to_date: string | null;
  zone_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface GuestProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  face_pay_enabled: boolean;
  auto_capture_opt: boolean;
  biometric_ref: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Experience {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  capacity_per_slot: number | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  max_facility_capacity: number;
  arrival_window_minutes: number;
}

export interface ExperienceTier {
  id: string;
  experience_id: string;
  tier_name: string;
  price: number;
  created_at: string;
  updated_at: string | null;
  duration_minutes: number;
  perks: string[];
}

export interface TimeSlot {
  id: string;
  experience_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  booked_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  override_capacity: number | null;
}

export interface Booking {
  id: string;
  experience_id: string;
  time_slot_id: string;
  tier_name: string;
  status: BookingStatus;
  total_price: number;
  promo_code_id: string | null;
  qr_code_ref: string | null;
  face_pay_enabled: boolean;
  auto_capture_opt: boolean;
  special_requests: string | null;
  cancelled_at: string | null;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string | null;
  booking_ref: string | null;
  booker_email: string | null;
  booker_name: string | null;
  adult_count: number;
  child_count: number;
  is_used: boolean;
}

export interface BookingPayment {
  id: string;
  booking_id: string;
  method: "card" | "face_pay" | "digital_wallet" | "cash";
  amount: number;
  currency: string;
  gateway_ref: string | null;
  status: "pending" | "success" | "failed" | "refunded";
  paid_at: string | null;
  created_at: string;
}

export interface CrewCheckIn {
  id: string;
  staff_record_id: string;
  shift_id: string | null;
  zone_id: string | null;
  check_in_time: string;
  check_out_time: string | null;
  status: CheckInStatus;
  biometric_ref: string | null;
  created_at: string;
}

export interface FnbOrder {
  id: string;
  zone_label: string | null;
  status: FnbOrderStatus;
  total_amount: number | null;
  notes: string | null;
  prepared_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  booking_id: string | null;
}

export interface FnbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface FnbPrepBatch {
  id: string;
  menu_item_id: string;
  quantity: number;
  batch_label: string | null;
  status: PrepBatchStatus;
  internal_temp: number | null;
  started_at: string;
  completed_at: string | null;
  prepared_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface FnbWasteLog {
  id: string;
  menu_item_id: string;
  quantity: number;
  reason: WasteReason;
  notes: string | null;
  disposed_by: string | null;
  created_at: string;
}

export interface RestockTask {
  id: string;
  product_id: string;
  location_id: string;
  needed_qty: number;
  priority: RestockPriority;
  status: RestockStatus;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface ManualRestockLog {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  photo_url: string | null;
  restocked_by: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  zone_id: string | null;
  source_type: string | null;
  source_id: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface ZoneTelemetry {
  id: string;
  zone_id: string;
  current_occupancy: number;
  temperature: number | null;
  humidity: number | null;
  co2_level: number | null;
  recorded_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  app_role: AppRole;
  staff_role: StaffRole | null;
  is_mfa_enabled: boolean;
  is_locked: boolean;
  locked_reason: string | null;
  locked_at: string | null;
  locked_by: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface BookingAttendee {
  id: string;
  booking_id: string;
  attendee_type: "adult" | "child";
  attendee_index: number;
  nickname: string | null;
  biometric_ref: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface OtpChallenge {
  id: string;
  booking_ref: string;
  otp_code: string;
  ip_address: string | null;
  attempts: number;
  verified: boolean;
  created_at: string;
  expires_at: string;
}

export interface TierTemplate {
  id: string;
  name: string;
  base_price: number;
  base_duration_minutes: number;
  base_perks: string[];
  created_at: string;
  updated_at: string | null;
}

export interface FnbRecipe {
  id: string;
  menu_item_id: string;
  product_id: string;
  quantity_required: number;
  unit: string;
  created_at: string;
  updated_at: string | null;
}

// ---------------------------------------------------------------------------
//  Supabase Database Generic — required by @supabase/supabase-js
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      zones: { Row: Zone; Insert: Partial<Zone> & Pick<Zone, "name">; Update: Partial<Zone> };
      departments: { Row: Department; Insert: Partial<Department> & Pick<Department, "name">; Update: Partial<Department> };
      suppliers: { Row: Supplier; Insert: Partial<Supplier> & Pick<Supplier, "name">; Update: Partial<Supplier> };
      stock_locations: { Row: StockLocation; Insert: Partial<StockLocation> & Pick<StockLocation, "name">; Update: Partial<StockLocation> };
      products: { Row: Product; Insert: Partial<Product> & Pick<Product, "name">; Update: Partial<Product> };
      product_stock_levels: { Row: ProductStockLevel; Insert: Partial<ProductStockLevel> & Pick<ProductStockLevel, "product_id" | "location_id">; Update: Partial<ProductStockLevel> };
      fnb_menu_items: { Row: FnbMenuItem; Insert: Partial<FnbMenuItem> & Pick<FnbMenuItem, "name" | "category">; Update: Partial<FnbMenuItem> };
      fnb_menu_pricing: { Row: FnbMenuPricing; Insert: Partial<FnbMenuPricing> & Pick<FnbMenuPricing, "menu_item_id" | "tier_label" | "price">; Update: Partial<FnbMenuPricing> };
      purchase_orders: { Row: PurchaseOrder; Insert: Partial<PurchaseOrder> & Pick<PurchaseOrder, "supplier_id">; Update: Partial<PurchaseOrder> };
      purchase_order_items: { Row: PurchaseOrderItem; Insert: Partial<PurchaseOrderItem> & Pick<PurchaseOrderItem, "po_id" | "item_name" | "expected_qty">; Update: Partial<PurchaseOrderItem> };
      inventory_transfers: { Row: InventoryTransfer; Insert: Partial<InventoryTransfer> & Pick<InventoryTransfer, "source_location_id" | "dest_location_id">; Update: Partial<InventoryTransfer> };
      inventory_transfer_items: { Row: InventoryTransferItem; Insert: Partial<InventoryTransferItem> & Pick<InventoryTransferItem, "transfer_id" | "product_id" | "quantity">; Update: Partial<InventoryTransferItem> };
      inventory_ledger: { Row: InventoryLedger; Insert: Partial<InventoryLedger> & Pick<InventoryLedger, "product_id" | "location_id" | "quantity_delta" | "transaction_type">; Update: Partial<InventoryLedger> };
      inventory_audits: { Row: InventoryAudit; Insert: Partial<InventoryAudit> & Pick<InventoryAudit, "location_id" | "scheduled_date">; Update: Partial<InventoryAudit> };
      inventory_audit_items: { Row: InventoryAuditItem; Insert: Partial<InventoryAuditItem> & Pick<InventoryAuditItem, "audit_id" | "product_id">; Update: Partial<InventoryAuditItem> };
      incidents: { Row: Incident; Insert: Partial<Incident> & Pick<Incident, "category" | "description" | "logged_by">; Update: Partial<Incident> };
      maintenance_work_orders: { Row: MaintenanceWorkOrder; Insert: Partial<MaintenanceWorkOrder> & Pick<MaintenanceWorkOrder, "title">; Update: Partial<MaintenanceWorkOrder> };
      devices: { Row: Device; Insert: Partial<Device> & Pick<Device, "name" | "device_type">; Update: Partial<Device> };
      campaigns: { Row: Campaign; Insert: Partial<Campaign> & Pick<Campaign, "name">; Update: Partial<Campaign> };
      promo_codes: { Row: PromoCode; Insert: Partial<PromoCode> & Pick<PromoCode, "code" | "discount_type" | "discount_value" | "valid_from" | "valid_to">; Update: Partial<PromoCode> };
      staff_records: { Row: StaffRecord; Insert: Partial<StaffRecord> & Pick<StaffRecord, "employee_id" | "legal_name" | "email" | "role" | "contract_start">; Update: Partial<StaffRecord> };
      shift_schedules: { Row: ShiftSchedule; Insert: Partial<ShiftSchedule> & Pick<ShiftSchedule, "staff_record_id" | "shift_date" | "start_time" | "end_time">; Update: Partial<ShiftSchedule> };
      iam_requests: { Row: IamRequest; Insert: Partial<IamRequest> & Pick<IamRequest, "request_type">; Update: Partial<IamRequest> };
      system_audit_log: { Row: SystemAuditLog; Insert: Partial<SystemAuditLog> & Pick<SystemAuditLog, "action" | "entity_type">; Update: Partial<SystemAuditLog> };
      demand_forecasts: { Row: DemandForecast; Insert: Partial<DemandForecast> & Pick<DemandForecast, "forecast_date" | "predicted_guests">; Update: Partial<DemandForecast> };
      operational_constraints: { Row: OperationalConstraint; Insert: Partial<OperationalConstraint> & Pick<OperationalConstraint, "name" | "constraint_type">; Update: Partial<OperationalConstraint> };
      guest_profiles: { Row: GuestProfile; Insert: Partial<GuestProfile> & Pick<GuestProfile, "user_id" | "full_name" | "email">; Update: Partial<GuestProfile> };
      experiences: { Row: Experience; Insert: Partial<Experience> & Pick<Experience, "name" | "max_facility_capacity">; Update: Partial<Experience> };
      experience_tiers: { Row: ExperienceTier; Insert: Partial<ExperienceTier> & Pick<ExperienceTier, "experience_id" | "tier_name" | "price" | "duration_minutes">; Update: Partial<ExperienceTier> };
      time_slots: { Row: TimeSlot; Insert: Partial<TimeSlot> & Pick<TimeSlot, "experience_id" | "slot_date" | "start_time" | "end_time">; Update: Partial<TimeSlot> };
      bookings: { Row: Booking; Insert: Partial<Booking> & Pick<Booking, "experience_id" | "time_slot_id" | "tier_name" | "total_price">; Update: Partial<Booking> };
      booking_payments: { Row: BookingPayment; Insert: Partial<BookingPayment> & Pick<BookingPayment, "booking_id" | "method" | "amount">; Update: Partial<BookingPayment> };
      crew_check_ins: { Row: CrewCheckIn; Insert: Partial<CrewCheckIn> & Pick<CrewCheckIn, "staff_record_id">; Update: Partial<CrewCheckIn> };
      fnb_orders: { Row: FnbOrder; Insert: Partial<FnbOrder>; Update: Partial<FnbOrder> };
      fnb_order_items: { Row: FnbOrderItem; Insert: Partial<FnbOrderItem> & Pick<FnbOrderItem, "order_id" | "menu_item_id" | "quantity" | "unit_price">; Update: Partial<FnbOrderItem> };
      fnb_prep_batches: { Row: FnbPrepBatch; Insert: Partial<FnbPrepBatch> & Pick<FnbPrepBatch, "menu_item_id" | "quantity">; Update: Partial<FnbPrepBatch> };
      fnb_waste_log: { Row: FnbWasteLog; Insert: Partial<FnbWasteLog> & Pick<FnbWasteLog, "menu_item_id" | "quantity" | "reason">; Update: Partial<FnbWasteLog> };
      restock_tasks: { Row: RestockTask; Insert: Partial<RestockTask> & Pick<RestockTask, "product_id" | "location_id" | "needed_qty">; Update: Partial<RestockTask> };
      manual_restock_log: { Row: ManualRestockLog; Insert: Partial<ManualRestockLog> & Pick<ManualRestockLog, "product_id" | "location_id" | "quantity">; Update: Partial<ManualRestockLog> };
      alerts: { Row: Alert; Insert: Partial<Alert> & Pick<Alert, "title" | "message" | "alert_type">; Update: Partial<Alert> };
      zone_telemetry: { Row: ZoneTelemetry; Insert: Partial<ZoneTelemetry> & Pick<ZoneTelemetry, "zone_id">; Update: Partial<ZoneTelemetry> };
      profiles: { Row: Profile; Insert: Partial<Profile> & Pick<Profile, "id">; Update: Partial<Profile> };
      booking_attendees: { Row: BookingAttendee; Insert: Partial<BookingAttendee> & Pick<BookingAttendee, "booking_id" | "attendee_type" | "attendee_index">; Update: Partial<BookingAttendee> };
      otp_challenges: { Row: OtpChallenge; Insert: Partial<OtpChallenge> & Pick<OtpChallenge, "booking_ref" | "otp_code">; Update: Partial<OtpChallenge> };
      tier_templates: { Row: TierTemplate; Insert: Partial<TierTemplate> & Pick<TierTemplate, "name">; Update: Partial<TierTemplate> };
      fnb_recipes: { Row: FnbRecipe; Insert: Partial<FnbRecipe> & Pick<FnbRecipe, "menu_item_id" | "product_id" | "quantity_required">; Update: Partial<FnbRecipe> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      staff_role: StaffRole;
      employment_status: EmploymentStatus;
      termination_reason: TerminationReason;
      booking_status: BookingStatus;
      menu_item_category: MenuItemCategory;
      menu_item_status: MenuItemStatus;
      po_status: PoStatus;
      transfer_status: TransferStatus;
      audit_request_status: AuditRequestStatus;
      incident_category: IncidentCategory;
      incident_status: IncidentStatus;
      maintenance_priority: MaintenancePriority;
      maintenance_wo_status: MaintenanceWoStatus;
      device_status: DeviceStatus;
      campaign_status: CampaignStatus;
      promo_status: PromoStatus;
      shift_status: ShiftStatus;
      iam_request_type: IamRequestType;
      iam_request_status: IamRequestStatus;
      check_in_status: CheckInStatus;
      fnb_order_status: FnbOrderStatus;
      prep_batch_status: PrepBatchStatus;
      waste_reason: WasteReason;
      restock_priority: RestockPriority;
      restock_status: RestockStatus;
      alert_type: AlertType;
      alert_severity: AlertSeverity;
      alert_status: AlertStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
