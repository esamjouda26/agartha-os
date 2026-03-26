"use client";

import { useState, useMemo, useTransition } from "react";
import { mutateRolePermissionAction } from "@/app/management/actions";
import { CheckCircle2, ShieldAlert, Loader2, Save } from "lucide-react";
import { DataTable, TableHeader, TableBody, TableRow, TableCell, TableHead, TableHeadSortable, TableToolbar, TablePagination } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/useDataTable";

interface PermissionRow {
  id: string;
  role_id: string;
  entity_type: string;
  can_select: boolean;
  can_insert: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export default function MatrixClient({ initialPermissions }: { initialPermissions: PermissionRow[] }) {
  const [permissions, setPermissions] = useState<PermissionRow[]>(initialPermissions);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // Group by Role to make rendering a solid matrix easier
  const rolesMap = useMemo(() => {
    const map = new Map<string, Record<string, boolean>>();
    permissions.forEach(p => {
      if (!map.has(p.role_id)) map.set(p.role_id, {});
      map.get(p.role_id)![p.entity_type] = p.can_select;
    });
    return map;
  }, [permissions]);

  // Extract all unique roles and all unique entity types across the entire DB
  const allRoles = Array.from(rolesMap.keys()).sort();
  const allEntities = Array.from(new Set(permissions.map(p => p.entity_type))).sort();

  const filteredRoles = useMemo(() => {
    if (!search) return allRoles;
    return allRoles.filter(r => r.toLowerCase().includes(search.toLowerCase()));
  }, [allRoles, search]);

  const filteredRolesObj = useMemo(() => filteredRoles.map(r => ({ role_id: r })), [filteredRoles]);
  const { page, setPage, totalPages, pageData, pageSize, setPageSize, sortKey, sortOrder, toggleSort } = useDataTable(filteredRolesObj, 10, "role_id", "asc");

  const handleToggle = (role: string, entity: string, currentState: boolean) => {
    const newState = !currentState;
    
    // Optimistic UI Update
    setPermissions(prev => {
      const exists = prev.find(p => p.role_id === role && p.entity_type === entity);
      if (exists) {
        return prev.map(p => p.id === exists.id ? { ...p, can_select: newState } : p);
      } else {
        return [...prev, { id: 'temp', role_id: role, entity_type: entity, can_select: newState, can_insert: false, can_update: false, can_delete: false }];
      }
    });

    startTransition(async () => {
      try {
        await mutateRolePermissionAction(role, entity, newState);
        showToast(`Authorization mutated: ${role} \u2192 ${entity} [${newState ? 'GRANTED' : 'REVOKED'}]`);
      } catch (err: any) {
        showToast(`❌ Matrix Error: ${err.message}`);
        // Revert on fail
        setPermissions(initialPermissions);
      }
    });
  };

  return (
    <div className={`space-y-6 ${isPending ? 'opacity-80' : ''} transition-opacity`}>
       <div className="glass-panel p-6 rounded-xl bg-[#020408] border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)] overflow-x-auto">
          <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4 mb-6 text-sm text-red-300 leading-relaxed flex gap-3 items-start">
             <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
             <div>
               <span className="font-bold tracking-widest uppercase text-[10px] text-red-400 block mb-1">Level 5 Security Clearance Active</span>
               Manipulating these structural switches instantly alters Postgres Row Level Security constraints across the active system. Proceed with extreme operational caution. Wait for the server sequence to complete before navigating away.
             </div>
          </div>

          <TableToolbar
            search={search}
            setSearch={(v: string) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search strict Role identifiers..."
          />

          <DataTable minWidth="1500px">
            <TableHeader>
              <tr>
                <TableHead className="sticky left-0 z-20 bg-[#020408] border-r border-white/5 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.5)] min-w-[200px] px-4">
                  System Role (JWT Claim)
                </TableHead>
                {allEntities.map(entity => (
                  <TableHead key={entity} className="text-center border-r border-white/5 px-2 py-4 align-middle">
                     <div className="text-[10px] text-gray-400 w-20 text-center whitespace-normal mx-auto leading-tight uppercase font-bold tracking-widest break-words flex items-center justify-center">
                        {entity.replace(/_/g, " ")}
                     </div>
                  </TableHead>
                ))}
              </tr>
            </TableHeader>
            <TableBody>
              {pageData.map((row) => {
                 const role = row.role_id as string;
                 const entityMap = rolesMap.get(role) || {};
                 return (
                 <TableRow key={role}>
                   <TableCell className="sticky left-0 z-10 bg-[#020408] border-r border-white/5 font-mono text-xs font-bold text-[#d4af37] shadow-[5px_0_15px_-5px_rgba(0,0,0,0.5)]">
                      {role}
                   </TableCell>
                   {allEntities.map(entity => {
                      const isAllowed = !!entityMap[entity];
                      return (
                      <TableCell key={entity} className="text-center border-r border-white/5 hover:bg-white/5 transition-colors p-0">
                         <button 
                           onClick={() => handleToggle(role, entity, isAllowed)}
                           disabled={isPending}
                           className="w-full h-full min-h-[48px] flex items-center justify-center disabled:cursor-not-allowed group"
                         >
                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${isAllowed ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 group-hover:bg-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-transparent border-white/10 text-transparent group-hover:border-white/30'}`}>
                               <CheckCircle2 className={`w-3 h-3 ${isAllowed ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                         </button>
                      </TableCell>
                   )})}
                 </TableRow>
              )})}
            </TableBody>
          </DataTable>

          <TablePagination page={page} setPage={setPage} totalPages={totalPages} totalRecords={filteredRoles.length} pageSize={pageSize} setPageSize={setPageSize} />
       </div>

      {toast && (
        <div className="fixed bottom-24 right-8 bg-[#020408] border-l-4 border-l-[#d4af37] border border-[rgba(212,175,55,0.2)] text-white px-6 py-4 rounded-lg shadow-xl backdrop-blur-md text-sm font-bold flex items-center gap-3 z-[60]">
           {toast.includes('Error') ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <Save className="w-5 h-5 text-emerald-400" />}
           <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
