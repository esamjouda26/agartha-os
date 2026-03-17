"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleZoneActiveAction(
  zoneId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  const { error } = await supabase
    .from("zones")
    .update({ is_active: isActive })
    .eq("id", zoneId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/zones");
  return { success: true };
}
