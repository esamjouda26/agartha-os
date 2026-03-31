import { createClient } from "@/lib/supabase/server";
import LostFoundClient from "./lost-found-client";

export default async function LostFoundPage() {
  const supabase = await createClient();
  
  // Natively query the specialized enum categories, joining physical zones
  const { data: incidents } = await supabase
    .from('incidents')
    .select('*, zones(name)')
    .in('category', ['lost_report', 'found_report'])
    .order('created_at', { ascending: false });

  // Fetch geographic zones to populate the standardized location dropdown
  const { data: zones } = await supabase
    .from('zones')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="max-w-4xl mx-auto">
      <LostFoundClient rawIncidents={incidents || []} zones={zones || []} />
    </div>
  );
}
