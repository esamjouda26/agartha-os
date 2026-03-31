import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import IncidentFormClient from "./incident-form-client";
import { getIncidentFormData } from "./actions";

export default async function IncidentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // JWT claim is the authoritative source — matches crew/layout.tsx pattern
  const role = (user.app_metadata?.staff_role as string | undefined) ?? "other";
  const formData = await getIncidentFormData(role);

  return (
    <div className="max-w-2xl mx-auto">
      <IncidentFormClient role={role} formData={formData} />
    </div>
  );
}
