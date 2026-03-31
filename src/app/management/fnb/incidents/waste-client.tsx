"use client";

import { useState, useMemo, useTransition } from "react";
import { 
  AlertTriangle, CheckCircle2, Clock, Filter, 
  Search, Info, FileText, Settings, Archive 
} from "lucide-react";
import { resolveIncident } from "./actions";
import { HydratedIncident } from "./page";

export default function IncidentsClient({ incidents }: { incidents: HydratedIncident[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const handleResolve = (id: string) => {
    startTransition(async () => {
      try {
        await resolveIncident(id);
      } catch (e: any) {
        alert("Failed to resolve incident: " + e.message);
      }
    });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    incidents.forEach(i => set.add(i.category));
    return Array.from(set).sort();
  }, [incidents]);

  const filtered = useMemo(() => {
    return incidents.filter(i => {
      const s = search.toLowerCase();
      if (s && !i.description.toLowerCase().includes(s) && !i.reporter_name.toLowerCase().includes(s)) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
      return true;
    });
  }, [incidents, search, statusFilter, categoryFilter]);

  const openCount = incidents.filter(i => i.status === "open").length;

  return (
    <div className="space-y-8 pb-10 max-w-screen-2xl mx-auto">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-3xl text-[#d4af37] font-bold tracking-wider flex items-center">
            <AlertTriangle className="w-8 h-8 mr-3 text-red-500/80" /> 
            Crew Incidents & Waste Log
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-semibold flex items-center">
            Monitoring F&B & Giftshop Operations Data
          </p>
        </div>
      </div>

      {/* ═══ KPI Strip ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-lg p-5 border-l-2 border-red-500/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Unresolved Reports</p>
          <h4 className="font-orbitron text-3xl font-bold text-red-400">{openCount}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-green-500/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Resolved Reports</p>
          <h4 className="font-orbitron text-3xl font-bold text-green-400">{incidents.length - openCount}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-[#d4af37]/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Tracked</p>
          <h4 className="font-orbitron text-3xl font-bold text-[#d4af37]">{incidents.length}</h4>
        </div>
      </section>

      {/* ═══ Main Table Panel ═══ */}
      <section className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px] border-[#d4af37]/30">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search descriptions or crew names..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-[#010204] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all font-mono" 
            />
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold tracking-wide uppercase">
            <Filter className="w-4 h-4 text-gray-500" />
            
            {/* Status Filter */}
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="bg-[#010204] border border-white/10 text-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-[#d4af37]/50"
            >
              <option value="all">Status: All</option>
              <option value="open">Status: Open</option>
              <option value="resolved">Status: Resolved</option>
            </select>

            {/* Category Filter */}
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)} 
              className="bg-[#010204] border border-white/10 text-[#d4af37] rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50"
            >
              <option value="all">Category: All</option>
              {categories.map(c => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-[#010204] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Incident Details</th>
                <th className="px-6 py-4 font-semibold">Metadata Log</th>
                <th className="px-6 py-4 font-semibold">Reporter</th>
                <th className="px-6 py-4 font-semibold text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-xs font-mono uppercase">
                    No matching incidents found.
                  </td>
                </tr>
              ) : filtered.map(inc => {
                const isResolved = inc.status === "resolved";
                const isFoodWaste = inc.category === "food_waste";
                const isMerch = inc.category === "damaged_merchandise";
                
                return (
                  <tr key={inc.id} className={`hover:bg-white/[0.02] transition-colors group ${isResolved ? "opacity-60" : ""}`}>
                    
                    {/* INCIDENT DETAILS */}
                    <td className="px-6 py-4 align-top w-2/5 whitespace-normal">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isFoodWaste || isMerch ? "bg-orange-500/10 text-orange-400 border-orange-500/20" 
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                            {inc.category.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono tracking-widest">
                            {new Date(inc.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{inc.description}</p>
                        
                        {inc.attachment_url && (
                          <div className="mt-3">
                            <a href={inc.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-[#d4af37] hover:underline font-mono">
                              <Archive className="w-3 h-3 mr-1" />
                              View Attachment
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* METADATA EXTRACT */}
                    <td className="px-6 py-4 align-top text-xs font-mono w-1/4 whitespace-normal">
                      {Object.keys(inc.metadata).length > 0 ? (
                        <div className="bg-[#010204] border border-white/5 rounded p-3 space-y-1.5 shadow-inner">
                          {Object.entries(inc.metadata).map(([key, val]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest">{key.replace(/_/g, " ")}</span>
                              <span className="text-[#e2e8f0] font-semibold">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600 italic">No extra data logged</span>
                      )}
                    </td>

                    {/* REPORTER INFO */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                          <UsersIcon className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-200 font-bold font-sans tracking-wide text-sm">{inc.reporter_name}</span>
                          <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-mono mt-0.5">
                            {inc.reporter_role.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* STATUS AND ACTIONS */}
                    <td className="px-6 py-4 align-top text-right min-w-[140px]">
                      {isResolved ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="flex items-center px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px] uppercase font-bold tracking-widest">
                            <CheckCircle2 className="w-3 h-3 mr-1.5" />
                            Resolved
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-end space-y-3">
                          <span className="flex items-center px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] uppercase font-bold tracking-widest flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1.5 animate-pulse" />
                            Open
                          </span>
                          <button
                            onClick={() => handleResolve(inc.id)}
                            disabled={isPending}
                            className="bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 px-3 py-1.5 rounded transition-colors text-xs font-bold uppercase tracking-widest"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// Temporary icon to avoid huge imports block
function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  );
}
