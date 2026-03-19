import { createClient } from "@/lib/supabase/server";
import SupplierPerfClient from "./supplier-perf-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface SupplierPerfRow {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  contact_email: string | null;
  is_active: boolean;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function FnBSupplierPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name, category, rating, contact_email, is_active")
    .order("name") as { data: SupplierPerfRow[] | null };

  return <SupplierPerfClient suppliers={data ?? []} />;
}
