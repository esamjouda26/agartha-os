import { fetchStaffRecordsAction, fetchDepartmentsAction } from "./actions";
import HrRosterClient from "./hr-roster-client";

export const metadata = {
  title: "HR Roster - AgarthaOS",
};

export default async function HrRosterPage() {
  const [records, departments] = await Promise.all([
    fetchStaffRecordsAction(),
    fetchDepartmentsAction(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedRecords = records.map((r: any) => {
    // profiles is a one-to-one join but PostgREST returns an array
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;

    return {
      id: r.id,
      employeeId: profile?.employee_id ?? "—",
      name: r.legal_name,
      personalEmail: r.personal_email ?? "",
      workEmail: profile?.email ?? "",
      phone: r.phone ?? "",
      address: r.address ?? "",
      kinName: r.kin_name ?? "",
      kinRel: r.kin_relationship ?? "",
      kinPhone: r.kin_phone ?? "",
      nationalId: r.national_id_enc ?? "",
      bank: r.bank_name ?? "",
      account: r.bank_account_enc ?? "",
      salary: r.salary_enc ?? "",
      role: profile?.staff_role ?? null,
      departmentId: r.department_id ?? "",
      startDate: r.contract_start ?? "",
      endDate: r.contract_end ?? null,
      status: profile?.employment_status ?? "pending",
    };
  });

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

      <HrRosterClient initialEmployees={mappedRecords} departments={departments} />
    </div>
  );
}
