"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function togglePromoStatusAction(promoId: string, currentStatus: string) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized");

  const newStatus = currentStatus === "active" ? "paused" : "active";

  const supabase = await createClient();
  const { error } = await supabase
    .from("promo_codes")
    .update({ status: newStatus })
    .eq("id", promoId);

  if (error) throw new Error(error.message);

  revalidatePath("/management/marketing/promos");
  return { success: true };
}

export async function clonePromoAction(promoId: string) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();
  // Fetch original
  const { data: original, error: fetchErr } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("id", promoId)
    .single();

  if (fetchErr || !original) throw new Error("Failed to fetch promo code for cloning.");

  // Make a copy
  const { id, created_at, code, ...rest } = original;
  const newCode = `${code}_COPY_${Math.floor(Math.random() * 1000)}`;

  const { error: insertErr } = await supabase
    .from("promo_codes")
    .insert([{ ...rest, code: newCode, status: "paused", current_uses: 0 }]);

  if (insertErr) throw new Error(insertErr.message);

  revalidatePath("/management/marketing/promos");
  return { success: true, newCode };
}

export async function createPromoAction(formData: FormData) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized");

  const code = formData.get("code") as string;
  const discount_type = formData.get("discount_type") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const max_uses = parseInt(formData.get("max_uses") as string);

  const supabase = await createClient();
  const { error } = await supabase
    .from("promo_codes")
    .insert([{
      code,
      discount_type,
      discount_value: amount,
      max_uses,
      current_uses: 0,
      status: "active",
      valid_from: new Date().toISOString(),
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }]);

  if (error) throw new Error(error.message);

  revalidatePath("/management/marketing/promos");
  return { success: true };
}

export async function toggleCampaignStatusAction(campaignId: string, currentStatus: string) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized");

  const newStatus = currentStatus === "active" ? "archived" : "active";

  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ status: newStatus })
    .eq("id", campaignId);

  if (error) throw new Error(error.message);

  revalidatePath("/management/marketing/campaigns");
  return { success: true };
}
