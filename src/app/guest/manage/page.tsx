import { redirect } from "next/navigation";
import { fetchGuestDashboardAction } from "../actions/auth";
import { GuestDashboardClient } from "./dashboard-client";

export default async function GuestManagePage() {
  // Fetch booking data via Server Action (uses admin.ts)
  const result = await fetchGuestDashboardAction();

  if (!result.success || !result.data) {
    redirect("/guest/login");
  }

  return <GuestDashboardClient booking={result.data} />;
}
