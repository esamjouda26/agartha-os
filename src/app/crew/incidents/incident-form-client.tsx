"use client";

import { useState } from "react";
import { Camera, ChevronDown, CheckCircle2 } from "lucide-react";
import ItemSearchSelect, { SearchableItem } from "../components/item-search-select";

const CATEGORY_MAP: Record<string, string[]> = {
  fnb_crew: ["contaminated_food", "equipment", "spill", "food_waste", "other"],
  service_crew: ["guest_complaint", "ticketing_issue", "crowd_congestion", "other"],
  giftshop_crew: ["guest_complaint", "theft", "damaged_merchandise", "pos_failure", "other"],
  runner_crew: ["guest_complaint", "damaged_in_transit", "missing_items", "vehicle_issue", "other"],
  experience_crew: ["guest_complaint", "vip_issue", "schedule_delay", "prop_damage", "guest_injury", "other"],
};

export default function IncidentFormClient({ role, searchableItems }: { role: string, searchableItems: SearchableItem[] }) {
  const allowedCategories = CATEGORY_MAP[role] || ["other"];
  const [selectedCategory, setSelectedCategory] = useState(allowedCategories[0]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Metadata State
  const [wastedItem, setWastedItem] = useState<SearchableItem | null>(null);
  const [wasteQty, setWasteQty] = useState(1);
  const [wasteReason, setWasteReason] = useState("Expired");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In actual implementation: Send logical payload to Supabase incident's JSONB metadata column 
    // Example: { category: selectedCategory, description, metadata: { product_id: wastedItem?.id, ... } }
    
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Incident reported successfully with standard schema mapping.");
    }, 1000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-[#d4af37] font-bold">Category</label>
        <div className="relative">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none bg-black/40 border border-[#d4af37]/30 text-white p-4 rounded-xl focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none transition"
          >
            {allowedCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]" />
        </div>
      </div>

      {selectedCategory === "food_waste" && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-4">
          <p className="text-sm font-semibold text-red-400">Waste Logging Required</p>
          
          <div className="space-y-2 relative z-10">
            <label className="text-[10px] uppercase tracking-wider text-gray-400">Select Item</label>
            <ItemSearchSelect items={searchableItems} onSelect={setWastedItem} placeholder="Scan or Search Wasted Item..." disabled={isSubmitting}/>
            {wastedItem && <p className="text-sm text-[#d4af37] font-medium mt-1">Item tracking: {wastedItem.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400">Quantity</label>
              <input type="number" min="1" value={wasteQty} onChange={(e) => setWasteQty(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 text-white p-3 rounded-lg mt-1 outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400">Reason</label>
              <select value={wasteReason} onChange={(e) => setWasteReason(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white p-3 rounded-lg mt-1 text-sm outline-none focus:border-red-400">
                <option>Expired</option>
                <option>Dropped / Spilled</option>
                <option>Contaminated</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-[#d4af37] font-bold">Description</label>
        <textarea 
          placeholder="Detailed account of incident..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-black/40 border border-white/10 text-white p-4 rounded-xl focus:border-[#d4af37] outline-none transition resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-[#d4af37] font-bold">Photo Evidence</label>
        <button type="button" className="w-full border-2 border-dashed border-[#d4af37]/40 text-[#d4af37]/60 hover:text-[#d4af37] rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition active:scale-[0.98]">
          <Camera className="w-8 h-8" />
          <span className="text-sm tracking-wide">Attach Image</span>
        </button>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting || (selectedCategory === "food_waste" && !wastedItem)}
        className="w-full py-5 bg-gradient-to-r from-[#d4af37] to-[#806b45] text-space font-bold tracking-widest uppercase rounded-xl active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? "Submitting..." : <><CheckCircle2 className="w-5 h-5"/> Submit Record</>}
      </button>
    </form>
  );
}
