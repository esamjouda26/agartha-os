import { Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PromoCodesClient from "./promo-codes-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface PromoCodeRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  status: string;
  valid_from: string | null;
  valid_to: string | null;
  campaigns?: { name: string } | null;
}

/* ── Page (Server Component — fetches data) ───────────────────────── */
export default async function MarketingPromosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("promo_codes")
    .select("id, code, description, discount_type, discount_value, max_uses, current_uses, status, valid_from, valid_to, campaigns(name)")
    .order("status")
    .order("code") as { data: PromoCodeRow[] | null };

  const promoCodes = data ?? [];

  return <PromoCodesClient promoCodes={promoCodes} />;
}
