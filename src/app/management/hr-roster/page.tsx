import { fetchStaffRecordsAction } from "./actions";
import HrRosterClient from "./hr-roster-client";
import { Users, UserCheck, CalendarOff, Clock } from "lucide-react";
import { KpiCard } from "@/components/shared";

export const metadata = {
  title: "HR Roster - AgarthaOS",
};

export default async function HrRosterPage() {
  const records = await fetchStaffRecordsAction();

  // Map backend naming to the UI convention expected by the client component
  const mappedRecords = records.map((r: any) => ({
    id: r.id,
    employeeId: r.employee_id || r.id,
    name: r.legal_name,
    email: r.email,
    phone: r.phone || "",
    address: r.address || "",
    kinName: r.kin_name || "",
    kinRel: r.kin_relationship || "",
    kinPhone: r.kin_phone || "",
    nationalId: r.national_id_enc || "",
    bank: r.bank_name || "",
    account: r.bank_account_enc || "",
    salary: r.salary_enc || "",
    role: r.role,
    startDate: r.contract_start || "",
    endDate: r.contract_end || null,
    status: r.employment_status,
  }));

  // Compute KPI stats from live data
  const totalStaff = mappedRecords.length;
  const activeCount = mappedRecords.filter((r: any) => r.status === "active").length;
  const onLeaveCount = mappedRecords.filter((r: any) => r.status === "on_leave").length;
  const pendingCount = mappedRecords.filter((r: any) => r.status === "pending" || r.status === "probation").length;

  return (
    <div className="flex-1 p-6 md:p-10 font-sans relative z-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-yellow-200 to-[#806b45] mb-2 tracking-wide drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            HR Roster Operations
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl leading-relaxed tracking-wide font-light">
            Centralized registry for Agartha crew profiles, IAM provisioning ledgers, role transfers, and payroll orchestration. E2E PII encryption is active.
          </p>
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Staff"
          value={totalStaff}
          icon={Users}
          subtitle="All registered personnel"
        />
        <KpiCard
          title="Active"
          value={activeCount}
          icon={UserCheck}
          variant="success"
          subtitle={`${totalStaff > 0 ? Math.round((activeCount / totalStaff) * 100) : 0}% of roster`}
        />
        <KpiCard
          title="On Leave"
          value={onLeaveCount}
          icon={CalendarOff}
          variant="warning"
          subtitle="Currently away"
        />
        <KpiCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          variant={pendingCount > 0 ? "danger" : "default"}
          subtitle="Awaiting onboarding"
        />
      </div>

      <HrRosterClient initialEmployees={mappedRecords} />
    </div>
  );
}
