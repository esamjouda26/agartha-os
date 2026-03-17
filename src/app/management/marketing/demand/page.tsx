import { BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DemandForecastClient from "./demand-forecast-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface ForecastRow {
  id: string;
  forecast_date: string;
  predicted_guests: number;
  actual_guests: number | null;
  confidence: number | null;
  notes: string | null;
}

/* ── Page (Server Component — fetches data) ───────────────────────── */
export default async function MarketingDemandPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("demand_forecasts")
    .select("id, forecast_date, predicted_guests, actual_guests, confidence, notes")
    .order("forecast_date", { ascending: true })
    .limit(35) as { data: ForecastRow[] | null };

  const forecasts = data ?? [];

  return <DemandForecastClient forecasts={forecasts} />;
}
