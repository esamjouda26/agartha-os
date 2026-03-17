import { createClient } from "@/lib/supabase/server";
import SuppliersClient from "./suppliers-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface SupplierRow {
  id: string;
  name: string;
  category: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_person: string | null;
  address: string | null;
  payment_terms: string | null;
  ssm_number: string | null;
  sst_number: string | null;
  rating: number | null;
  status: string | null;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function MerchSuppliersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name, category, contact_email, contact_phone, contact_person, address, payment_terms, ssm_number, sst_number, rating, status")
    .order("name") as { data: SupplierRow[] | null };

  return <SuppliersClient suppliers={data ?? []} />;
}
