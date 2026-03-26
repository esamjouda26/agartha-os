import { fetchRolePermissionsMatrixAction } from "@/app/management/actions";
import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import MatrixClient from "./matrix-client";

export const metadata = {
  title: "RBAC Domain Matrix | AgarthaOS",
};

export default async function RbacMatrixPage() {
  const caller = await requireRole("management");
  if (!caller) redirect("/login");
  
  const role = caller.staffRole;
  if (role !== "it_admin" && role !== "business_admin") redirect("/management"); // Only strictly cleared admins

  const initialPermissions = await fetchRolePermissionsMatrixAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-cinzel font-bold text-[#d4af37] tracking-widest uppercase">System Audit Visibility Matrix (READ)</h1>
        <p className="text-xs text-gray-500 max-w-2xl font-mono">
          Strict database-level dictionary binding Operational Roles to Audit Logs. 
          Toggling these parameters instantly grants or revokes native SELECT (View) access on the system_audit_log for the targeted database entity.
        </p>
      </div>
      <MatrixClient initialPermissions={initialPermissions} />
    </div>
  );
}
