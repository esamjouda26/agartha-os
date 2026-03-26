import { createClient } from "@/lib/supabase/server";
import LostFoundClient from "./lost-found-client";

export default async function LostFoundPage() {
  const supabase = await createClient();
  
  // Fetch active lost and found reports mapped natively under guest_complaint + JSONB filters
  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .eq('category', 'guest_complaint')
    .contains('metadata', { isLostAndFound: true })
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto">
      <LostFoundClient rawIncidents={incidents || []} />
    </div>
  );
}
