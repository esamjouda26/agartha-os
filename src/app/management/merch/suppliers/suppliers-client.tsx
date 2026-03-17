"use client";

import { useState, useMemo } from "react";
import { Truck, Building2, CheckCircle, Archive, Search, Plus, X, Edit2 } from "lucide-react";
import type { SupplierRow } from "./page";

/* ── Helpers ────────────────────────────────────────────────────────── */
const TERMS_STYLE: Record<string, string> = {
  "Net 15": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Net 30": "bg-green-500/10 text-green-400 border-green-500/20",
  "Net 60": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  COD:      "bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20",
};

/* ── Component ──────────────────────────────────────────────────────── */
export default function SuppliersClient({ suppliers }: { suppliers: SupplierRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const totalVendors = suppliers.length;
  const activeCount = suppliers.filter((s) => s.status !== "inactive").length;
  const inactiveCount = suppliers.filter((s) => s.status === "inactive").length;

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.contact_person ?? "").toLowerCase().includes(q) || (s.ssm_number ?? "").includes(q) || s.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" ||
        (statusFilter === "Active" && s.status !== "inactive") ||
        (statusFilter === "Inactive" && s.status === "inactive");
      return matchSearch && matchStatus;
    });
  }, [suppliers, search, statusFilter]);

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-xl text-[#d4af37] flex items-center tracking-wider">
            <Truck className="w-6 h-6 mr-3" /> Suppliers
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Vendor Master Database — Feeds Catalog &amp; PO Modules</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center text-sm uppercase tracking-widest"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Supplier
        </button>
      </div>

      {/* ═══ KPI Strip ═══ */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: "Total Vendors", value: totalVendors, color: "blue" },
          { icon: CheckCircle, label: "Active", value: activeCount, color: "green" },
          { icon: Archive, label: "Inactive", value: inactiveCount, color: "gray" },
        ].map(({ icon: Icon, label, value, color }) => {
          const colorMap: Record<string, { bg: string; border: string; text: string }> = {
            blue:  { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
            green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
            gray:  { bg: "bg-gray-500/10", border: "border-gray-500/20", text: "text-gray-400" },
          };
          const c = colorMap[color];
          return (
            <div key={label} className="glass-panel rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded ${c.bg} border ${c.border} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
                  <p className={`text-xl font-orbitron font-bold ${color === "blue" ? "text-white" : c.text}`}>{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ═══ Suppliers Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[400px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, SSM, or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
              <option value="all">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-5 py-4 font-semibold">Supplier ID</th>
                  <th className="px-5 py-4 font-semibold">Company Name</th>
                  <th className="px-5 py-4 font-semibold">SSM Number</th>
                  <th className="px-5 py-4 font-semibold">Contact Person</th>
                  <th className="px-5 py-4 font-semibold">Phone</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">Payment Terms</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-500 text-xs">No suppliers found.</td></tr>
                ) : filtered.map((s) => {
                  const isInactive = s.status === "inactive";
                  const termsCls = TERMS_STYLE[s.payment_terms ?? ""] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
                  return (
                    <tr key={s.id} className={`hover:bg-white/[0.02] transition-colors ${isInactive ? "opacity-50" : ""}`}>
                      <td className="px-5 py-4">
                        <span className="bg-[#020408] px-2 py-1 rounded border border-white/10 text-gray-400 font-mono text-[11px]">{s.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-5 py-4"><p className="text-gray-200 font-bold font-sans tracking-wide">{s.name}</p></td>
                      <td className="px-5 py-4 text-gray-400 font-mono">{s.ssm_number ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-300 font-sans">{s.contact_person ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-400 font-sans">{s.contact_phone ?? "—"}</td>
                      <td className="px-5 py-4">
                        {s.contact_email ? (
                          <a href={`mailto:${s.contact_email}`} className="text-blue-400 hover:text-blue-300 transition-colors font-sans">{s.contact_email}</a>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-sans font-semibold ${termsCls}`}>
                          {s.payment_terms ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-sans uppercase tracking-widest ${isInactive ? "text-gray-500" : "text-green-400"}`}>
                          {isInactive ? "Off" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {/* // TODO: Bind to edit modal / Server Action */}
                        <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded" title="Edit Supplier">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ Add Supplier Modal ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className="glass-panel rounded-lg w-full max-w-2xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto relative">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
                <Plus className="w-5 h-5 mr-2" /> Add Supplier
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              <form onSubmit={(e) => { e.preventDefault(); setModalOpen(false); /* TODO: Bind to Server Action */ }} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Company Name <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="e.g. Mega Souvenirs Sdn Bhd" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">SSM Number <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="e.g. 202001012345" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">SST Number <span className="text-gray-600">(Optional)</span></label>
                    <input type="text" placeholder="W10-1234-56789012" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Contact Person <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="e.g. Ahmad Razif" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Phone Number <span className="text-red-400">*</span></label>
                    <input type="tel" placeholder="+60 12-345 6789" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Email Address <span className="text-red-400">*</span></label>
                    <input type="email" placeholder="orders@company.com" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Physical / Billing Address</label>
                  <textarea rows={2} placeholder="Unit 5, Lot 1234, Jalan Industri Utama..." className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Payment Terms</label>
                  <select className="w-full bg-[#020408] border border-white/10 text-sm text-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="COD">COD (Cash on Delivery)</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2 text-sm font-bold rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                    Save Supplier
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
