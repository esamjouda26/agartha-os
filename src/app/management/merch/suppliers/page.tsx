import { createClient } from "@/lib/supabase/server";
import SuppliersClient from "./suppliers-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface SupplierRow {
  id: string;
  name: string;
  category: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  rating: number | null;
  is_active: boolean;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function MerchSuppliersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name, category, contact_email, contact_phone, address, rating, is_active")
    .order("name") as { data: SupplierRow[] | null };

  return <SuppliersClient suppliers={data ?? []} />;
}
