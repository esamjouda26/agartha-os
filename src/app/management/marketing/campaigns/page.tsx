import { createClient } from "@/lib/supabase/server";
import CampaignsClient from "./campaigns-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface CampaignData {
  id: string;
  name: string;
  channel: string;
  status: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  start_date: string | null;
  end_date: string | null;
  attributed_revenue: number;
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default async function MarketingCampaignPage() {
  const supabase = await createClient();

  // 1. Fetch campaigns
  const { data: rawCampaigns } = await supabase
    .from("campaigns")
    .select("id, name, channel, status, budget, spend, impressions, clicks, conversions, start_date, end_date")
    .order("start_date", { ascending: false });

  if (!rawCampaigns || rawCampaigns.length === 0) {
    return <CampaignsClient campaigns={[]} />;
  }

  // 2. Map Campaigns to Promo Codes to trace revenue attribution
  const { data: promos } = await supabase
    .from("promo_codes")
    .select("id, campaign_id");

  const promoToCampaign: Record<string, string> = {};
  const validPromoIds: string[] = [];

  (promos || []).forEach(p => {
    if (p.campaign_id) {
      promoToCampaign[p.id] = p.campaign_id;
      validPromoIds.push(p.id);
    }
  });

  // 3. Parallel fetch of all converted Revenue utilizing Promos across all channels
  const revenueMap: Record<string, number> = {};
  
  if (validPromoIds.length > 0) {
    const [
      { data: fnbOrders },
      { data: retailOrders },
      { data: bookings }
    ] = await Promise.all([
      supabase.from("fnb_orders").select("promo_code_id, total_amount").not("promo_code_id", "is", null),
      supabase.from("retail_orders").select("promo_code_id, total_amount").not("promo_code_id", "is", null),
      supabase.from("bookings").select("promo_code_id, total_price").not("promo_code_id", "is", null)
    ]);

    const bindRevenue = (orders: any[], amountKey: string) => {
      (orders || []).forEach(o => {
        if (o.promo_code_id && promoToCampaign[o.promo_code_id]) {
          const cId = promoToCampaign[o.promo_code_id];
          revenueMap[cId] = (revenueMap[cId] || 0) + (o[amountKey] || 0);
        }
      });
    };

    bindRevenue(fnbOrders || [], "total_amount");
    bindRevenue(retailOrders || [], "total_amount");
    bindRevenue(bookings || [], "total_price");
  }

  // 4. Construct enriched pipeline
  const enriched: CampaignData[] = rawCampaigns.map(c => ({
    id: c.id,
    name: c.name,
    channel: c.channel || "direct",
    status: c.status,
    budget: c.budget || 0,
    spend: c.spend || 0,
    impressions: c.impressions || 0,
    clicks: c.clicks || 0,
    conversions: c.conversions || 0,
    start_date: c.start_date,
    end_date: c.end_date,
    attributed_revenue: revenueMap[c.id] || 0
  }));

  return <CampaignsClient campaigns={enriched} />;
}
