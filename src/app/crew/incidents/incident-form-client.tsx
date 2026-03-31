"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import {
  ShieldAlert, ChevronDown, Camera, Upload, MapPin,
  CheckCircle2, FileText, X, Loader2, AlertTriangle,
  Cpu, Car, Network, Package, Ticket, ShoppingBag, Search
} from "lucide-react";
import { submitIncident } from "./actions";

// ── Category Label Map ─────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  guest_complaint: "Guest Complaint",
  crowd_congestion: "Crowd Congestion",
  other: "Other / Non-Mentioned",
  equipment: "Equipment Failure",
  food_waste: "Food Waste",
  ticketing_issue: "Ticketing Issue",
  theft: "Theft / Shoplifting",
  damaged_merchandise: "Damaged Merchandise",
  pos_failure: "POS Failure",
  damaged_in_transit: "Damaged in Transit",
  vehicle_issue: "Vehicle / Cart Issue",
  schedule_delay: "Schedule Delay",
  prop_damage: "Prop / Set Damage",
  unauthorized_access: "Unauthorized Access",
  medical_emergency: "Medical Emergency",
  heat_exhaustion: "Heat Exhaustion",
  vandalism: "Vandalism",
  network_outage: "Network Outage",
  hardware_failure: "Hardware Failure",
  power_outage: "Power Outage",
};

// ── Metadata field configs per category ───────────────────────────
type FormData = {
  zones: { id: string; name: string }[];
  assets: { id: string; name: string; asset_type: string | null }[];
  vehicles: { id: string; name: string; vehicle_type: string | null; plate: string | null }[];
  vlans: { id: number; vlan_id: number; name: string }[];
  fnbItems: { id: string; name: string; linked_product_id: string | null }[];
  retailItems: { id: string; linked_product_id: string }[];
  bookings: { id: string; booking_ref: string | null; booker_email: string | null }[];
  posTerminals: { id: string; name: string }[];
  timeSlots: { id: string; start_time: string; end_time: string }[];
  allowedCategories: string[];
};

type IncidentFormClientProps = {
  role: string;
  formData: FormData;
};

export default function IncidentFormClient({ role, formData }: IncidentFormClientProps) {
  const { zones, assets, vehicles, vlans, fnbItems, retailItems, bookings, posTerminals, timeSlots, allowedCategories } = formData;

  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState(allowedCategories[0] ?? "other");
  const [description, setDescription] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Camera state machine for photo evidence
  type CameraState = "idle" | "capturing" | "preview";
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => () => stopStream(), [stopStream]);
  useEffect(() => {
    if (cameraState === "capturing" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraState]);

  // Metadata states
  const [equipmentId, setEquipmentId] = useState("");
  const [criticalFailure, setCriticalFailure] = useState(false);
  const [requiresVendorRma, setRequiresVendorRma] = useState(false);
  const [productId, setProductId] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [wasteRemark, setWasteRemark] = useState("expired_eod");
  const [policeNotified, setPoliceNotified] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [drivable, setDrivable] = useState(true);
  const [bookingId, setBookingId] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [terminalId, setTerminalId] = useState("");
  const [timeSlotId, setTimeSlotId] = useState("");
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [propId, setPropId] = useState("");
  const [needsImmediate, setNeedsImmediate] = useState(false);
  const [patientType, setPatientType] = useState("Guest");
  const [ambulance, setAmbulance] = useState(false);
  const [hydration, setHydration] = useState(false);
  const [graffiti, setGraffiti] = useState(false);
  const [repairNeeded, setRepairNeeded] = useState(false);
  const [vlanId, setVlanId] = useState("");
  const [criticalSystemOffline, setCriticalSystemOffline] = useState(false);
  const [upsActive, setUpsActive] = useState(false);
  const [generatorStarted, setGeneratorStarted] = useState(false);

  function buildMetadata(): Record<string, string | number | boolean | null> {
    switch (category) {
      case "equipment": return { equipment_id: equipmentId || null, critical_failure: criticalFailure };
      case "hardware_failure": return { equipment_id: equipmentId || null, requires_vendor_rma: requiresVendorRma };
      case "food_waste": return { product_id: productId || null, quantity, remark: wasteRemark };
      case "damaged_merchandise":
      case "damaged_in_transit": return { product_ids: JSON.stringify(productIds), quantity };
      case "theft": return { product_ids: JSON.stringify(productIds), quantity, police_notified: policeNotified };
      case "pos_failure": return { terminal_id: terminalId || null };
      case "vehicle_issue": return { vehicle_id: vehicleId || null, drivable };
      case "ticketing_issue": return { booking_id: bookingId || null };
      case "schedule_delay": return { time_slot_id: timeSlotId || null, delay_minutes: delayMinutes };
      case "prop_damage": return { prop_id: propId || null, needs_immediate_removal: needsImmediate };
      case "unauthorized_access": return { police_notified: policeNotified };
      case "medical_emergency": return { patient_type: patientType, ambulance_dispatched: ambulance };
      case "heat_exhaustion": return { patient_type: patientType, hydration_given: hydration };
      case "vandalism": return { graffiti, repair_needed: repairNeeded };
      case "network_outage": return { vlan_id: vlanId || null, critical_system_offline: criticalSystemOffline };
      case "power_outage": return { ups_active: upsActive, generator_started: generatorStarted };
      default: return {};
    }
  }

  function openCamera() {
    setCameraState("capturing");
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        requestAnimationFrame(() => {
          if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
        });
      })
      .catch(() => setCameraState("idle"));
  }
  function captureFrame() {
    const v = videoRef.current; const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    setAttachmentUrl(c.toDataURL("image/jpeg", 0.85));
    stopStream(); setCameraState("preview");
  }
  function retakePhoto() { setAttachmentUrl(null); stopStream(); openCamera(); }
  function removePhoto() { setAttachmentUrl(null); stopStream(); setCameraState("idle"); }

  function toggleProductId(id: string) {
    setProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const filteredBookings = bookings.filter(b =>
    !bookingSearch || (b.booking_ref ?? "").includes(bookingSearch) || (b.booker_email ?? "").toLowerCase().includes(bookingSearch.toLowerCase())
  ).slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!description.trim()) { setErrorMsg("Description is required."); return; }

    startTransition(async () => {
      try {
        await submitIncident({
          category,
          description,
          zone_id: zoneId,
          attachment_url: attachmentUrl,
          metadata: buildMetadata(),
        });
        setSuccessMsg("Incident filed successfully.");
        setDescription("");
        setZoneId("");
        setAttachmentUrl(null);
        setProductIds([]);
        setBookingId("");
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    });
  }

  const selectClass = "w-full appearance-none bg-black/40 border border-white/10 text-white p-3.5 rounded-xl focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 outline-none transition text-sm";
  const inputClass = "w-full bg-black/40 border border-white/10 text-white p-3.5 rounded-xl focus:border-[#d4af37] outline-none transition text-sm placeholder-gray-600";
  const labelClass = "text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2 block";
  const checkboxRowClass = "flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5";

  return (
    <div className="space-y-6 pb-24">
      <div className="glass-panel-gold p-6 rounded-2xl border border-[#d4af37]/30 flex items-center gap-4">
        <ShieldAlert className="text-[#d4af37] flex-shrink-0" size={28} />
        <div>
          <h2 className="text-2xl font-cinzel text-[#d4af37] font-bold">Incident Report</h2>
          <p className="text-gray-400 text-sm mt-0.5">File an operational incident. All reports are timestamped and audit-logged.</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          <AlertTriangle size={18} />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel-gold border border-white/10 rounded-2xl p-6 space-y-6">

        {/* ── Category ── */}
        <div>
          <label className={labelClass}>Incident Category <span className="text-red-400">*</span></label>
          <div className="relative">
            <select value={category} onChange={e => setCategory(e.target.value)} disabled={isPending} className={selectClass}>
              {allowedCategories.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
          </div>
        </div>

        {/* ── Zone ── */}
        <div>
          <label className={labelClass}><MapPin size={10} className="inline mr-1" />Physical Zone</label>
          <div className="relative">
            <select value={zoneId} onChange={e => setZoneId(e.target.value)} disabled={isPending} className={selectClass}>
              <option value="">Select Zone (optional)...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
          </div>
        </div>

        {/* ── Dynamic Metadata Fields ── */}
        {(category === "equipment" || category === "hardware_failure") && (
          <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2"><Cpu size={14} /> Equipment Details</p>
            <div>
              <label className={labelClass}>Asset / Equipment</label>
              <div className="relative">
                <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)} disabled={isPending} className={selectClass}>
                  <option value="">Select Asset...</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}{a.asset_type ? ` (${a.asset_type})` : ""}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
              </div>
            </div>
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={category === "equipment" ? criticalFailure : requiresVendorRma}
                onChange={e => category === "equipment" ? setCriticalFailure(e.target.checked) : setRequiresVendorRma(e.target.checked)} className="accent-[#d4af37] w-4 h-4" />
              <span className="text-sm text-gray-300">{category === "equipment" ? "Critical Failure (system-down)" : "Requires Vendor RMA"}</span>
            </label>
          </div>
        )}

        {category === "food_waste" && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2"><Package size={14} /> Food Waste Details</p>
            <div>
              <label className={labelClass}>Menu Item</label>
              <div className="relative">
                <select value={productId} onChange={e => setProductId(e.target.value)} disabled={isPending} className={selectClass}>
                  <option value="">Select Item...</option>
                  {fnbItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Quantity</label>
                <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} disabled={isPending} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Remark</label>
                <div className="relative">
                  <select value={wasteRemark} onChange={e => setWasteRemark(e.target.value)} disabled={isPending} className={selectClass}>
                    <option value="expired_eod">Expired (EOD)</option>
                    <option value="dropped_spilled">Dropped / Spilled</option>
                    <option value="contaminated">Contaminated</option>
                    <option value="prep_error">Prep Error</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {(category === "theft" || category === "damaged_merchandise" || category === "damaged_in_transit") && (
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <ShoppingBag size={14} /> {CATEGORY_LABELS[category]} Details
            </p>
            <div>
              <label className={labelClass}>Items Involved (multi-select)</label>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-white/10 rounded-xl p-2 bg-black/20">
                {(category === "damaged_in_transit" ? retailItems : [...fnbItems, ...retailItems]).map(item => (
                  <label key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" checked={productIds.includes(item.id)} onChange={() => toggleProductId(item.id)} className="accent-[#d4af37] w-4 h-4" />
                    <span className="text-sm text-gray-300">{(item as { name?: string }).name ?? `Item ${item.id.slice(0,8)}`}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Quantity</label>
                <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} disabled={isPending} className={inputClass} />
              </div>
              {category === "theft" && (
                <label className={checkboxRowClass + " col-span-1"}>
                  <input type="checkbox" checked={policeNotified} onChange={e => setPoliceNotified(e.target.checked)} className="accent-[#d4af37] w-4 h-4" />
                  <span className="text-sm text-gray-300">Police Notified</span>
                </label>
              )}
            </div>
          </div>
        )}

        {category === "pos_failure" && (
          <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">POS Terminal</p>
            <div className="relative">
              <select value={terminalId} onChange={e => setTerminalId(e.target.value)} disabled={isPending} className={selectClass}>
                <option value="">Select Terminal...</option>
                {posTerminals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
            </div>
          </div>
        )}

        {category === "vehicle_issue" && (
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2"><Car size={14} /> Vehicle Details</p>
            <div className="relative">
              <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} disabled={isPending} className={selectClass}>
                <option value="">Select Vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}{v.plate ? ` — ${v.plate}` : ""}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
            </div>
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={drivable} onChange={e => setDrivable(e.target.checked)} className="accent-[#d4af37] w-4 h-4" />
              <span className="text-sm text-gray-300">Still Drivable</span>
            </label>
          </div>
        )}

        {category === "ticketing_issue" && (
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Ticket size={14} /> Booking Reference</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} placeholder="Search booking ref or email..." disabled={isPending} className={inputClass + " pl-9"} />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 border border-white/10 rounded-xl p-2 bg-black/20">
              {filteredBookings.map(b => (
                <label key={b.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input type="radio" name="booking" value={b.id} checked={bookingId === b.id} onChange={() => setBookingId(b.id)} className="accent-[#d4af37] w-4 h-4" />
                  <span className="text-sm text-gray-300 font-mono">{b.booking_ref}</span>
                  <span className="text-xs text-gray-500 truncate">{b.booker_email}</span>
                </label>
              ))}
              {filteredBookings.length === 0 && <p className="text-xs text-gray-500 px-3 py-2">No bookings match.</p>}
            </div>
          </div>
        )}

        {category === "schedule_delay" && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Schedule Details</p>
            <div>
              <label className={labelClass}>Time Slot</label>
              <div className="relative">
                <select value={timeSlotId} onChange={e => setTimeSlotId(e.target.value)} disabled={isPending} className={selectClass}>
                  <option value="">Select Time Slot...</option>
                  {timeSlots.map(t => <option key={t.id} value={t.id}>{t.start_time} – {t.end_time}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Delay (minutes)</label>
              <input type="number" min={0} value={delayMinutes} onChange={e => setDelayMinutes(Number(e.target.value))} disabled={isPending} className={inputClass} />
            </div>
          </div>
        )}

        {category === "prop_damage" && (
          <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Prop / Set Details</p>
            <div className="relative">
              <select value={propId} onChange={e => setPropId(e.target.value)} disabled={isPending} className={selectClass}>
                <option value="">Select Prop / Asset...</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
            </div>
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={needsImmediate} onChange={e => setNeedsImmediate(e.target.checked)} className="accent-red-500 w-4 h-4" />
              <span className="text-sm text-red-300 font-semibold">Needs Immediate Removal</span>
            </label>
          </div>
        )}

        {category === "unauthorized_access" && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={policeNotified} onChange={e => setPoliceNotified(e.target.checked)} className="accent-red-500 w-4 h-4" />
              <span className="text-sm text-red-300 font-semibold">Police / Security Notified</span>
            </label>
          </div>
        )}

        {(category === "medical_emergency" || category === "heat_exhaustion") && (
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Medical Details</p>
            <div>
              <label className={labelClass}>Patient Type</label>
              <div className="flex gap-3">
                {["Guest", "Staff"].map(t => (
                  <label key={t} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition ${patientType === t ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-white/10 text-gray-400"}`}>
                    <input type="radio" name="patientType" value={t} checked={patientType === t} onChange={() => setPatientType(t)} className="sr-only" />
                    <span className="text-sm font-bold">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={category === "medical_emergency" ? ambulance : hydration}
                onChange={e => category === "medical_emergency" ? setAmbulance(e.target.checked) : setHydration(e.target.checked)} className="accent-green-500 w-4 h-4" />
              <span className="text-sm text-gray-300">{category === "medical_emergency" ? "Ambulance Dispatched" : "Hydration Given"}</span>
            </label>
          </div>
        )}

        {category === "vandalism" && (
          <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-3">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Vandalism Details</p>
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={graffiti} onChange={e => setGraffiti(e.target.checked)} className="accent-[#d4af37] w-4 h-4" />
              <span className="text-sm text-gray-300">Involves Graffiti</span>
            </label>
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={repairNeeded} onChange={e => setRepairNeeded(e.target.checked)} className="accent-[#d4af37] w-4 h-4" />
              <span className="text-sm text-gray-300">Structural Repair Needed</span>
            </label>
          </div>
        )}

        {category === "network_outage" && (
          <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-4">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2"><Network size={14} /> Network Details</p>
            <div className="relative">
              <select value={vlanId} onChange={e => setVlanId(e.target.value)} disabled={isPending} className={selectClass}>
                <option value="">Select VLAN...</option>
                {vlans.map(v => <option key={v.id} value={String(v.vlan_id)}>VLAN {v.vlan_id} — {v.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] pointer-events-none" />
            </div>
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={criticalSystemOffline} onChange={e => setCriticalSystemOffline(e.target.checked)} className="accent-red-500 w-4 h-4" />
              <span className="text-sm text-red-300 font-semibold">Critical System Offline</span>
            </label>
          </div>
        )}

        {category === "power_outage" && (
          <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl space-y-3">
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Power Status</p>
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={upsActive} onChange={e => setUpsActive(e.target.checked)} className="accent-yellow-500 w-4 h-4" />
              <span className="text-sm text-gray-300">UPS Active</span>
            </label>
            <label className={checkboxRowClass}>
              <input type="checkbox" checked={generatorStarted} onChange={e => setGeneratorStarted(e.target.checked)} className="accent-yellow-500 w-4 h-4" />
              <span className="text-sm text-gray-300">Generator Started</span>
            </label>
          </div>
        )}

        {/* ── Description ── */}
        <div>
          <label className={labelClass}><FileText size={10} className="inline mr-1" />Description <span className="text-red-400">*</span></label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isPending}
            placeholder="Detailed account of the incident..."
            className="w-full bg-black/40 border border-white/10 text-white p-3.5 rounded-xl focus:border-[#d4af37] outline-none transition resize-none text-sm placeholder-gray-600"
          />
        </div>

        {/* ── Photo Evidence ── */}
        <div className="space-y-2">
          <label className={labelClass}><Camera size={10} className="inline mr-1" />Photo Evidence (optional)</label>

          {/* Idle — no photo yet */}
          {cameraState === "idle" && !attachmentUrl && (
            <button type="button" onClick={openCamera}
              className="w-full border-2 border-dashed border-[#d4af37]/30 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-[#d4af37]/60 hover:text-[#d4af37] hover:border-[#d4af37] transition active:scale-[0.98]">
              <Camera size={20} /><span className="text-sm tracking-wide">Open Camera</span>
            </button>
          )}

          {/* Live feed */}
          {cameraState === "capturing" && (
            <div className="relative rounded-xl overflow-hidden border border-[#d4af37]/30 bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] text-red-400 font-bold">LIVE</span>
              </div>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                <button type="button" onClick={() => { stopStream(); setCameraState("idle"); }}
                  className="px-4 py-2 rounded-full bg-black/60 text-gray-400 text-xs font-bold">Cancel</button>
                <button type="button" onClick={captureFrame}
                  className="w-14 h-14 rounded-full bg-white border-4 border-[#d4af37] flex items-center justify-center shadow-xl active:scale-95 transition">
                  <Camera size={20} className="text-black" />
                </button>
              </div>
            </div>
          )}

          {/* Preview + confirm/retake */}
          {(cameraState === "preview" || (cameraState === "idle" && attachmentUrl)) && attachmentUrl && (
            <div className="space-y-2">
              <div className="relative">
                <img src={attachmentUrl} alt="Evidence" className="w-full h-40 object-cover rounded-xl border border-green-500/30" />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-500/20 border border-green-500/40 rounded-full px-2 py-0.5">
                  <CheckCircle2 size={10} className="text-green-400" />
                  <span className="text-[10px] text-green-400 font-bold">Captured</span>
                </div>
              </div>
              {cameraState === "preview" && (
                <div className="flex gap-2">
                  <button type="button" onClick={retakePhoto} className="flex-1 py-2 rounded-lg text-xs font-bold border border-white/10 text-gray-400 hover:bg-white/5 transition">Retake</button>
                  <button type="button" onClick={() => setCameraState("idle")} className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#d4af37] text-black font-bold">Confirm</button>
                </div>
              )}
              {cameraState === "idle" && (
                <button type="button" onClick={removePhoto} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300">
                  <X size={12} /> Remove photo
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#806b45] text-space font-bold tracking-widest uppercase rounded-xl active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {isPending ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><CheckCircle2 size={18} /> Submit Incident Record</>}
        </button>
      </form>
    </div>
  );
}
