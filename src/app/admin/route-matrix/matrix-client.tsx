"use client";

import { useState, useEffect } from "react";
import { Check, X as XIcon, ShieldOff, Loader2, Save } from "lucide-react";
import { fetchRouteAccessMatrixAction, mutateRouteAccessAction, type RouteAccessRecord } from "../actions";

const ALL_ROLES = [
  "it_admin", "business_admin",
  "fnb_manager", "merch_manager", "maintenance_manager", "inventory_manager",
  "marketing_manager", "human_resources_manager", "compliance_manager", "operations_manager",
  "fnb_crew", "service_crew", "giftshop_crew", "runner_crew", "security_crew",
  "health_crew", "cleaning_crew", "experience_crew", "internal_maintainence_crew",
] as const;

const PORTAL_DOMAINS = ["admin", "management", "crew"] as const;

export default function RouteMatrixClient() {
  const [records, setRecords] = useState<RouteAccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRouteAccessMatrixAction();
        setRecords(data);
      } catch (err) {
        console.error("Matrix err", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleToggle(roleId: string, domain: string, currentAccess: boolean) {
    setIsWorking(true);
    // Determine typical tier based on domain if turning ON (basic UX logic, admin usually applies tier admin, else matches domain)
    const projectedTier = domain === "admin" ? "admin" : domain === "management" ? "management" : "crew";

    const res = await mutateRouteAccessAction(roleId, domain, projectedTier, !currentAccess);
    if (res.success) {
      const data = await fetchRouteAccessMatrixAction();
      setRecords(data);
    } else {
      alert("Failed to mutate route matrix: " + res.error);
    }
    setIsWorking(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37] mb-4" />
        <span className="font-mono text-xs uppercase tracking-[0.2em]">Syncing Edge Cache Dictionary...</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10">
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-cinzel font-bold text-white uppercase tracking-widest text-sm flex items-center">
          <Save className="w-4 h-4 mr-2 text-[#d4af37]" /> Live Active Registry
        </h2>
        {isWorking && <span className="text-xs text-[#d4af37] animate-pulse">Mutating PostgreSQL Dictionary...</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
          <thead>
            <tr>
              <th className="p-4 uppercase tracking-widest text-xs text-gray-500 font-bold bg-[#020408] border border-white/10">
                Staff Identity Role
              </th>
              {PORTAL_DOMAINS.map((domain) => (
                <th key={domain} className="p-4 text-center border border-white/10 bg-[#060913]">
                  <span className="block font-mono text-xs text-white pb-1">{`/${domain}`}</span>
                  <span className="block text-[9px] uppercase tracking-widest text-[#d4af37]">Domain</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ALL_ROLES.map((role) => (
              <tr key={role} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 border-l border-r border-white/10 font-mono text-xs text-gray-300">
                  {role}
                </td>
                {PORTAL_DOMAINS.map((domain) => {
                  const hasAccess = records.some(r => r.role_id === role && r.portal_domain === domain);
                  return (
                    <td key={domain} className="p-2 border-r border-white/10 w-32 relative text-center">
                      <button
                        onClick={() => handleToggle(role, domain, hasAccess)}
                        disabled={isWorking}
                        className={`w-full h-10 rounded text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                          hasAccess 
                            ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20" 
                            : "bg-red-500/5 border-red-500/20 text-red-500/50 hover:bg-red-500/20 hover:text-red-400"
                        }`}
                      >
                        {hasAccess ? (
                          <><Check className="w-3.5 h-3.5" /> ALLOWED</>
                        ) : (
                          <><ShieldOff className="w-3 h-3 opacity-50" /> BLOCKED</>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
