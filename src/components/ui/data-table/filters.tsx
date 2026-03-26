import { useState } from "react";
export const ROLES: Record<string, string> = {
  it_admin: "IT Admin", business_admin: "Business Admin",
  fnb_manager: "F&B Manager", merch_manager: "Merch Manager", maintenance_manager: "Maintenance Manager",
  inventory_manager: "Inventory Manager", marketing_manager: "Marketing Manager",
  human_resources_manager: "HR Manager", compliance_manager: "Compliance Manager", operations_manager: "Operations Manager",
  fnb_crew: "F&B Crew", service_crew: "Service Crew", giftshop_crew: "Giftshop Crew",
  runner_crew: "Runner Crew", security_crew: "Security Crew", health_crew: "Health Crew",
  cleaning_crew: "Cleaning Crew", experience_crew: "Experience Crew", internal_maintainence_crew: "Internal Maintenance Crew",
};

export const ROLE_GROUPS = {
  ADMIN: ["it_admin", "business_admin"],
  MANAGEMENT: ["fnb_manager", "merch_manager", "maintenance_manager", "inventory_manager", "marketing_manager", "human_resources_manager", "compliance_manager", "operations_manager"],
  CREW: ["fnb_crew", "service_crew", "giftshop_crew", "runner_crew", "security_crew", "health_crew", "cleaning_crew", "experience_crew", "internal_maintainence_crew"],
};

export function RoleFilterDropdown({ filterRoles, setFilterRoles, roleGroups, rolesMap }: any) {
  const [open, setOpen] = useState(false);
  
  const toggleGroup = (group: string) => {
     const groupRoles = roleGroups[group];
     const allSelected = groupRoles.every((r: string) => filterRoles.includes(r));
     if (allSelected) {
       setFilterRoles(filterRoles.filter((r: string) => !groupRoles.includes(r)));
     } else {
       const newRoles = [...filterRoles];
       groupRoles.forEach((r: string) => { if (!newRoles.includes(r)) newRoles.push(r); });
       setFilterRoles(newRoles);
     }
  };

  const toggleRole = (r: string) => {
     if (filterRoles.includes(r)) setFilterRoles(filterRoles.filter((x: string) => x !== r));
     else setFilterRoles([...filterRoles, r]);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 md:px-4 py-2.5 px-3 bg-[#020408] text-xs text-gray-400 border border-white/10 rounded-lg hover:border-[#d4af37]/40 hover:text-[#d4af37] transition-all min-w-[170px] justify-between">
         {filterRoles.length > 0 ? <span className="text-[#d4af37] font-bold">{filterRoles.length} roles</span> : "Filter by Role..."}
         <span className="text-gray-600 text-[10px] ml-2">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-40 bg-[rgba(10,20,30,0.98)] backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl w-64 max-h-80 overflow-y-auto py-1">
             {Object.entries(roleGroups).map(([group, roles]: any) => (
               <div key={group} className="border-b border-white/5 last:border-0 pb-1 mb-1">
                  <div onClick={() => toggleGroup(group)} className="px-3 py-2 text-[10px] font-bold text-[#d4af37] uppercase tracking-wider bg-white/[0.02] cursor-pointer hover:bg-white/[0.05] transition-colors flex items-center justify-between">
                     <span>{group}</span>
                     <input type="checkbox" readOnly checked={roles.every((r: string) => filterRoles.includes(r))} className="accent-[#d4af37] cursor-pointer" />
                  </div>
                  {roles.map((r: string) => (
                    <label key={r} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.08)] cursor-pointer">
                      <input type="checkbox" checked={filterRoles.includes(r)} onChange={() => toggleRole(r)} className="accent-[#d4af37]" />
                      {rolesMap[r]}
                    </label>
                  ))}
               </div>
             ))}
          </div>
        </>
      )}
    </div>
  );
}

export function StatusFilterDropdown({ filterStatuses, setFilterStatuses, statusesMap }: any) {
  const [open, setOpen] = useState(false);
  const toggle = (s: string) => setFilterStatuses(filterStatuses.includes(s) ? filterStatuses.filter((x: string) => x !== s) : [...filterStatuses, s]);
  
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 md:px-4 py-2.5 px-3 bg-[#020408] text-xs text-gray-400 border border-white/10 rounded-lg hover:border-[#d4af37]/40 hover:text-[#d4af37] transition-all min-w-[170px] justify-between">
         {filterStatuses.length > 0 ? <span className="text-[#d4af37] font-bold">{filterStatuses.length} statuses</span> : "Filter by Status..."}
         <span className="text-gray-600 text-[10px] ml-2">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-40 bg-[rgba(10,20,30,0.98)] backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl w-48 overflow-hidden py-1">
             {Object.entries(statusesMap).map(([k, v]: any) => (
               <label key={k} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.08)] cursor-pointer">
                 <input type="checkbox" checked={filterStatuses.includes(k)} onChange={() => toggle(k)} className="accent-[#d4af37]" />
                 {v as string}
               </label>
             ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TimeFilterDropdown({ timeFilter, setTimeFilter, optionsMap }: any) {
  const [open, setOpen] = useState(false);
  const currentLabel = optionsMap[timeFilter] || timeFilter;
  
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 md:px-4 py-2.5 px-3 bg-[#020408] text-xs text-gray-400 border border-white/10 rounded-lg hover:border-[#d4af37]/40 hover:text-[#d4af37] transition-all min-w-[150px] justify-between">
         <span className="font-bold text-gray-300">{currentLabel}</span>
         <span className="text-gray-600 text-[10px] ml-2">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-40 bg-[rgba(10,20,30,0.98)] backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl w-48 overflow-hidden py-1">
             {Object.entries(optionsMap).map(([k, v]: any) => (
               <div key={k} onClick={() => { setTimeFilter(k); setOpen(false); }} className={`px-4 py-2.5 text-xs cursor-pointer transition-colors ${timeFilter === k ? 'bg-[rgba(212,175,55,0.15)] text-[#d4af37] font-bold' : 'text-gray-300 hover:bg-[rgba(212,175,55,0.08)]'}`}>
                 {v as string}
               </div>
             ))}
          </div>
        </>
      )}
    </div>
  );
}
