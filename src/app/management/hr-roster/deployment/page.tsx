"use client";

import { useState, useEffect, useCallback, useOptimistic, useTransition } from "react";
import {
  fetchCrewForDeploymentAction,
  assignCrewToZoneAction,
} from "../../operations/actions";

// ── Types ───────────────────────────────────────────────────────────────────

interface StaffRecord {
  id: string;
  user_id: string | null;
  employee_id: string;
  legal_name: string;
  role: string;
}

interface ShiftSchedule {
  id: string;
  staff_record_id: string;
  assigned_zone_id: string | null;
  current_zone_id: string | null;
  last_scanned_at: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface Zone {
  id: string;
  name: string;
  location_id: string | null;
  locations: { id: string; name: string; type: string } | null;
}

// ── Constants ───────────────────────────────────────────────────────────────

const MANAGER_ROLES = [
  "fnb_manager", "merch_manager", "maintenance_manager", "inventory_manager",
  "marketing_manager", "human_resources_manager", "compliance_manager", "operations_manager",
];

const ROLE_LABELS: Record<string, string> = {
  fnb_manager: "F&B Manager", merch_manager: "Merch Manager", maintenance_manager: "Maintenance Mgr",
  inventory_manager: "Inventory Mgr", marketing_manager: "Marketing Mgr", human_resources_manager: "HR Manager",
  compliance_manager: "Compliance Mgr", operations_manager: "Operations Mgr",
  fnb_crew: "F&B Crew", service_crew: "Service Crew", giftshop_crew: "Giftshop Crew",
  runner_crew: "Runner Crew", security_crew: "Security Crew", health_crew: "Health Crew",
  cleaning_crew: "Cleaning Crew", experience_crew: "Experience Crew", internal_maintainence_crew: "Maintenance Crew",
  it_admin: "IT Admin", business_admin: "Business Admin",
};

const DISPLAY_GROUPS: Record<string, string[]> = {
  "Security Crew": ["security_crew"],
  "F&B Crew": ["fnb_crew"],
  "Service Crew": ["service_crew"],
  "Runner Crew": ["runner_crew"],
  "Cleaning Crew": ["cleaning_crew"],
  "Health Crew": ["health_crew"],
  "Experience Crew": ["experience_crew"],
  "Giftshop Crew": ["giftshop_crew"],
  "Maintenance Crew": ["internal_maintainence_crew"],
  "Management (View Only)": MANAGER_ROLES,
};

function isManager(role: string) { return MANAGER_ROLES.includes(role); }
function formatDate(ds: string) { const d = new Date(ds + "T00:00:00"); return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function stepDateStr(ds: string, dir: number) { const d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() + dir); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function formatTime(t: string) { return t.slice(0, 5); }

export default function CrewDeploymentPage() {
  const [date, setDate] = useState(todayStr());
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic state for zone assignments
  const [optimisticShifts, setOptimisticShifts] = useOptimistic(
    shifts,
    (state: ShiftSchedule[], update: { shiftId: string; zoneId: string | null }) =>
      state.map((s) => (s.id === update.shiftId ? { ...s, assigned_zone_id: update.zoneId } : s))
  );

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(async (ds: string) => {
    setLoading(true);
    const data = await fetchCrewForDeploymentAction(ds);
    setStaff(data.staff as StaffRecord[]);
    setShifts(data.shifts as ShiftSchedule[]);
    setZones(data.zones as Zone[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(date); }, [date, refresh]);

  function handleAssignZone(shiftId: string, zoneId: string | null, zoneName: string) {
    setActiveDropdown(null);
    startTransition(async () => {
      setOptimisticShifts({ shiftId, zoneId });
      const res = await assignCrewToZoneAction(shiftId, zoneId);
      if (!res.success) { showToast(`Error: ${res.error}`); return; }
      showToast(`Zone assigned: ${zoneName}`);
      refresh(date);
    });
  }

  // Stats
  const onShift = staff.filter((s) => !isManager(s.role) && optimisticShifts.some((sh) => sh.staff_record_id === s.id)).length;
  const offDuty = staff.filter((s) => !isManager(s.role) && !optimisticShifts.some((sh) => sh.staff_record_id === s.id)).length;
  const totalCrew = staff.filter((s) => !isManager(s.role)).length;
  const mgrCount = staff.filter((s) => isManager(s.role)).length;
  const assignedCount = optimisticShifts.filter((s) => s.assigned_zone_id).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            Resolved daily schedule — operational overrides only
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-success/5 border border-success/20 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-success tracking-widest uppercase font-bold">Live Roster</span>
          </div>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-3 py-1.5">
            <span className="text-muted-foreground text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search crew…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none w-28 placeholder-muted-foreground/40"
            />
          </div>
        </div>
      </div>

      {/* Date Control */}
      <div className="glass rounded-lg p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 max-w-xs">
          <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Operational Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" style={{ colorScheme: "dark" }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDate(stepDateStr(date, -1))} className="px-3 py-2 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-sm">◀</button>
          <button onClick={() => setDate(todayStr())} className="px-3 py-2 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-xs font-semibold uppercase tracking-wider">Today</button>
          <button onClick={() => setDate(stepDateStr(date, 1))} className="px-3 py-2 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-sm">▶</button>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-muted-foreground">{formatDate(date)}</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Crew", value: totalCrew, cls: "" },
          { label: "On Shift", value: onShift, cls: "text-emerald-400" },
          { label: "Off Duty", value: offDuty, cls: "text-muted-foreground" },
          { label: "Managers", value: mgrCount, cls: "text-primary" },
          { label: "Zone Assigned", value: assignedCount, cls: "text-amber-400" },
        ].map((s, i) => (
          <div key={i} className="bg-background/40 border border-border/50 rounded-lg px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{s.label}</p>
            <p className={`text-xl font-bold ${s.cls || "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Data Grid */}
      {loading ? (
        <div className="glass rounded-xl p-12 text-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading roster…</div>
        </div>
      ) : staff.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No active staff records found. Create staff records first.</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/50">
            <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              daily_shift_roster — resolved deployment
            </h4>
            <span className="text-[10px] text-muted-foreground/50 font-mono">{staff.length} personnel</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-muted-foreground uppercase tracking-wider bg-background/50 sticky top-0 z-10 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold w-48 min-w-[180px]">Employee</th>
                  <th className="px-3 py-3 font-semibold text-center w-24">Shift</th>
                  <th className="px-3 py-3 font-semibold text-center w-36">Role</th>
                  <th className="px-3 py-3 font-semibold text-center w-40">Deployed Zone</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(DISPLAY_GROUPS).map(([groupName, roleKeys]) => {
                  const groupEmps = staff.filter((emp) => {
                    if (!roleKeys.includes(emp.role)) return false;
                    if (search && !emp.legal_name.toLowerCase().includes(search.toLowerCase()) && !emp.employee_id.toLowerCase().includes(search.toLowerCase())) return false;
                    return true;
                  });
                  if (groupEmps.length === 0) return null;

                  const groupId = "grp-" + groupName.replace(/[^a-zA-Z]/g, "");
                  const isCollapsed = collapsedGroups[groupId] || false;
                  const isMgrGroup = groupName.includes("Management");

                  return (
                    <GroupRows
                      key={groupId}
                      groupId={groupId}
                      groupName={groupName}
                      isMgrGroup={isMgrGroup}
                      isCollapsed={isCollapsed}
                      onToggle={() => setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))}
                      employees={groupEmps}
                      shifts={optimisticShifts}
                      zones={zones}
                      activeDropdown={activeDropdown}
                      setActiveDropdown={setActiveDropdown}
                      onAssignZone={handleAssignZone}
                      isPending={isPending}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-success/90 border border-success text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-md z-[60]">
          <span className="text-sm font-bold tracking-wide">{toast}</span>
        </div>
      )}
    </div>
  );
}

// ── Sub-Component: GroupRows ────────────────────────────────────────────────

function GroupRows({
  groupId, groupName, isMgrGroup, isCollapsed, onToggle, employees, shifts, zones,
  activeDropdown, setActiveDropdown, onAssignZone, isPending,
}: {
  groupId: string;
  groupName: string;
  isMgrGroup: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  employees: StaffRecord[];
  shifts: ShiftSchedule[];
  zones: Zone[];
  activeDropdown: string | null;
  setActiveDropdown: (id: string | null) => void;
  onAssignZone: (shiftId: string, zoneId: string | null, zoneName: string) => void;
  isPending: boolean;
}) {
  return (
    <>
      {/* Group Header */}
      <tr>
        <td colSpan={4} className="bg-background/80 border-b border-primary/15 px-4 py-2 cursor-pointer select-none hover:bg-primary/5 transition-colors" onClick={onToggle}>
          <div className="flex items-center gap-2">
            <span className={`text-xs text-primary/60 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}>▼</span>
            <span className="text-xs font-bold text-primary/80 uppercase tracking-wider">{groupName}</span>
            <span className="text-[10px] text-muted-foreground font-mono ml-1">{employees.length} staff</span>
            {isMgrGroup && <span className="text-[9px] text-primary/40">🔒</span>}
          </div>
        </td>
      </tr>

      {/* Employee Rows */}
      {!isCollapsed && employees.map((emp) => {
        const empShift = shifts.find((s) => s.staff_record_id === emp.id);
        const mgr = isManager(emp.role);
        const zoneName = empShift?.assigned_zone_id ? zones.find((z) => z.id === empShift.assigned_zone_id)?.name ?? "—" : "Unassigned";
        const dropdownId = `zone-${emp.id}`;

        return (
          <tr key={emp.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
            {/* Employee */}
            <td className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                {mgr && <span className="text-[9px] text-primary/40">🔒</span>}
                <div>
                  <div className="text-xs text-foreground font-medium">{emp.legal_name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{emp.employee_id}</div>
                </div>
              </div>
            </td>

            {/* Shift */}
            <td className="px-3 py-2.5 text-center">
              {empShift ? (
                <span className="inline-flex items-center justify-center min-w-[80px] h-[24px] rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                  {formatTime(empShift.start_time)}–{formatTime(empShift.end_time)}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/40">OFF</span>
              )}
            </td>

            {/* Role */}
            <td className="px-3 py-2.5 text-center">
              <span className="inline-flex items-center justify-center min-w-[80px] h-[24px] rounded text-[10px] font-semibold bg-muted/30 text-muted-foreground border border-border/50 px-2">
                {ROLE_LABELS[emp.role] || emp.role}
              </span>
            </td>

            {/* Deployed Zone */}
            <td className="px-3 py-2.5 text-center relative">
              {empShift && !mgr ? (
                <div className="inline-block relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId)}
                    disabled={isPending}
                    className={`inline-flex items-center justify-center min-w-[100px] h-[28px] rounded text-[10px] font-bold px-2.5 transition-all border ${empShift.assigned_zone_id ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" : "bg-muted/20 text-muted-foreground border-border hover:border-primary/30 hover:text-primary"}`}
                  >
                    {zoneName} ▾
                  </button>

                  {activeDropdown === dropdownId && (() => {
                    // Group zones by parent location
                    const locMap = new Map<string, Zone[]>();
                    zones.forEach((z) => {
                      const locName = z.locations?.name ?? "Unassigned Location";
                      if (!locMap.has(locName)) locMap.set(locName, []);
                      locMap.get(locName)!.push(z);
                    });
                    const sortedLocs = Array.from(locMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
                    return (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl min-w-[200px] max-h-[280px] overflow-y-auto">
                        <button
                          onClick={() => onAssignZone(empShift.id, null, "Unassigned")}
                          className="block w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          ✕ Unassign
                        </button>
                        {sortedLocs.map(([locName, locZones]) => (
                          <div key={locName}>
                            <div className="px-3 py-1 bg-background/80 border-t border-border text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                              {locName}
                            </div>
                            {locZones.map((z) => (
                              <button
                                key={z.id}
                                onClick={() => onAssignZone(empShift.id, z.id, z.name)}
                                className={`block w-full text-left px-4 py-2 text-xs transition-colors ${z.id === empShift.assigned_zone_id ? "text-primary font-bold" : "text-foreground/80 hover:bg-muted/50 hover:text-primary"}`}
                              >
                                {z.name}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : empShift && mgr ? (
                <span className="text-[10px] text-muted-foreground/40">{zoneName}</span>
              ) : (
                <span className="text-[10px] text-muted-foreground/30">—</span>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}
