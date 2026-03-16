import DomainAuditTable from "@/components/DomainAuditTable";

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Full audit trail filtered by your access level</p>
      </div>
      <DomainAuditTable
        entityTypes={["product", "time_slot", "device", "role", "profile", "zone", "incident", "staff_record", "maintenance_work_order"]}
        title="Global Audit Trail"
      />
    </div>
  );
}
