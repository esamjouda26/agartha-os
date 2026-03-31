import DomainAuditTable from "@/components/DomainAuditTable";
import { ShieldAlert } from "lucide-react";

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg p-4 flex items-center gap-4 border-[rgba(212,175,55,0.2)]">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)]">
          <ShieldAlert className="w-5 h-5 text-[#d4af37]" />
        </div>
        <div>
          <h1 className="font-cinzel text-lg text-white tracking-wide">System Audit Log</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Full audit trail filtered by your access level</p>
        </div>
      </div>

      {/* ── Global Audit Table ────────────────────────────────────────── */}
      <DomainAuditTable
        entityTypes={["ALL"]}
        title="Global Audit Trail"
      />
    </div>
  );
}
