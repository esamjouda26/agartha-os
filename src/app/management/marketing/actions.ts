"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function toggleCampaignStatusAction(id: string, currentStatus: string) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  const nextStatus = currentStatus === "active" ? "paused" : "active";

  const { error } = await supabase
    .from("campaigns")
    .update({ 
      status: nextStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/management/marketing/campaigns");
  return { success: true };
}

export async function togglePromoStatusAction(id: string, currentStatus: string) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  const nextStatus = currentStatus === "active" ? "paused" : "active";

  const { error } = await supabase
    .from("promo_codes")
    .update({ 
      status: nextStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/management/marketing/promos");
  return { success: true };
}

export async function clonePromoAction(id: string) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  const { data: promo, error: fetchErr } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !promo) throw new Error("Could not find promo code to clone.");

  const { id: _oldId, created_at: _c, updated_at: _u, ...rest } = promo;
  
  const clone = {
    ...rest,
    code: `${promo.code}_COPY_${Math.floor(Math.random() * 1000)}`,
    status: "paused",
    current_uses: 0,
    created_by: caller.id
  };

  const { error: insErr } = await supabase
    .from("promo_codes")
    .insert(clone);

  if (insErr) throw new Error(insErr.message);

  revalidatePath("/management/marketing/promos");
  return { success: true };
}

export async function createPromoAction(formData: FormData) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // Basic Fields
  const code = formData.get("code") as string;
  const description = formData.get("description") as string;
  const discountType = formData.get("discount_type") as string;
  const amountStr = formData.get("amount") as string;
  const maxUsesStr = formData.get("max_uses") as string;
  const scheduleType = formData.get("schedule_type") as string;

  // Rules
  const minGroupSizeStr = formData.get("min_group_size") as string;
  const validTiers: string[] = [];
  if (formData.get("tier_skimmer")) validTiers.push("Skimmer");
  if (formData.get("tier_swimmer")) validTiers.push("Swimmer");
  if (formData.get("tier_diver")) validTiers.push("Diver");
  
  // Fencing Times
  const startDateStr = formData.get("start_date") as string;
  const endDateStr = formData.get("end_date") as string;
  const startTimeStr = formData.get("start_time") as string;
  const endTimeStr = formData.get("end_time") as string;

  if (!code || !discountType || !amountStr || !startDateStr || !endDateStr || !startTimeStr || !endTimeStr) {
    throw new Error("Missing required fields for Promo creation.");
  }

  // Fencing Days
  const validDays: string[] = [];
  if (scheduleType === "recurring") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (const d of days) {
      if (formData.get(`day_${d.toLowerCase()}`)) validDays.push(d);
    }
  }

  // Time conversion
  // We attach the locale time from the form to a standard UTC ISO to ensure it saves cleanly
  const validFromIso = new Date(`${startDateStr}T${startTimeStr}:00.000Z`).toISOString();
  // For End Date, if it's recurring we still want the macro bounds.
  // We use 23:59:59 to guarantee it covers the entire final date window.
  const validToIso = new Date(`${endDateStr}T23:59:59.000Z`).toISOString();

  const recurrentStart = scheduleType === "recurring" ? `${startTimeStr}:00` : null;
  const recurrentEnd = scheduleType === "recurring" ? `${endTimeStr}:00` : null;

  const payload = {
    code: code.trim().toUpperCase(),
    description: description ? description.trim() : null,
    discount_type: discountType,
    discount_value: parseFloat(amountStr),
    max_uses: maxUsesStr ? parseInt(maxUsesStr, 10) : null,
    current_uses: 0,
    status: "active",
    min_group_size: minGroupSizeStr ? parseInt(minGroupSizeStr, 10) : 1,
    valid_tiers: validTiers,
    schedule_type: scheduleType || 'onetime',
    valid_days: validDays,
    valid_from: validFromIso,
    valid_to: validToIso,
    recurrent_start_time: recurrentStart,
    recurrent_end_time: recurrentEnd,
    created_by: caller.id
  };

  const { error } = await supabase
    .from("promo_codes")
    .insert(payload);

  if (error) throw new Error(error.message);

  revalidatePath("/management/marketing/promos");
  return { success: true };
}

