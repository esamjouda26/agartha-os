"use client";

import { useState, useRef, useTransition } from "react";
import { RotateCcw, Camera, CheckCircle2, Loader2, AlertTriangle, Package } from "lucide-react";
import type { SearchableItem } from "@/app/crew/components/item-search-select";
import ItemSearchSelect from "@/app/crew/components/item-search-select";

type BoxCondition = "sealed" | "opened";
type Resolution = "refund" | "exchange";

const CONDITION_CONFIG: Record<BoxCondition, { label: string; resolution: Resolution; note: string; color: string }> = {
  sealed:  { label: "Sealed / Unopened", resolution: "refund",   note: "Eligible for full refund",         color: "border-emerald-500 bg-emerald-500/10 text-emerald-400" },
  opened:  { label: "Opened / Used",     resolution: "exchange", note: "Exchange only — no cash refund",   color: "border-amber-500 bg-amber-500/10 text-amber-400" },
};

export default function RetailReturnsClient({ catalogItems }: { catalogItems: SearchableItem[] }) {
  const [selectedItem, setSelectedItem] = useState<SearchableItem | null>(null);
  const [condition, setCondition] = useState<BoxCondition | null>(null);
  const [exchangeItem, setExchangeItem] = useState<SearchableItem | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const photoRef = useRef<HTMLInputElement>(null);

  const resolution = condition ? CONDITION_CONFIG[condition].resolution : null;

  // Exchange validation: new item price must be ≤ original price
  const exchangeValid = resolution === "exchange" && exchangeItem
    ? (exchangeItem.price ?? 0) <= (selectedItem?.price ?? Infinity)
    : true;

  const canSubmit = selectedItem && condition && photoBase64 && (resolution === "refund" || (resolution === "exchange" && exchangeItem && exchangeValid));

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      // In production: upload photo then write to a returns table
      // Schema does not currently have a retail_returns table — record in console for now
      // TODO: add retail_returns table in a future migration
      await new Promise((r) => setTimeout(r, 800)); // simulate async
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto">
        <div className="glass-panel-gold p-8 rounded-2xl border border-emerald-500/30 text-center space-y-4">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Return Processed</h2>
          <p className="text-sm text-gray-400">
            {resolution === "refund" ? "Full refund authorized for sealed item." : `Exchange authorized for ${exchangeItem?.name}.`}
          </p>
          <button
            onClick={() => { setSubmitted(false); setSelectedItem(null); setCondition(null); setPhotoBase64(null); setExchangeItem(null); }}
            className="w-full py-3 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition min-h-[44px]"
          >
            Process Another Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30 flex items-center gap-3">
        <RotateCcw className="text-[#d4af37] shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Returns & Refunds</h2>
          <p className="text-xs text-gray-400">Gift Shop Return Processing</p>
        </div>
      </div>

      {/* Step 1 — Item */}
      <div className="bg-black/30 border border-white/8 rounded-2xl p-4 space-y-3">
        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">① Return Item</label>
        <ItemSearchSelect
          items={catalogItems}
          onSelect={(item) => { setSelectedItem(item); setCondition(null); setExchangeItem(null); }}
          placeholder="Search returned item..."
          groupByField="category"
        />
        {selectedItem && (
          <div className="flex items-center gap-3 px-3 py-3 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-xl">
            <Package size={16} className="text-[#d4af37] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{selectedItem.name}</p>
              <p className="text-xs text-[#d4af37] font-mono">RM {(selectedItem.price ?? 0).toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — Condition */}
      {selectedItem && (
        <div className="bg-black/30 border border-white/8 rounded-2xl p-4 space-y-3">
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">② Box Condition</label>
          <div className="space-y-2">
            {(Object.entries(CONDITION_CONFIG) as [BoxCondition, typeof CONDITION_CONFIG[BoxCondition]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { setCondition(key); setExchangeItem(null); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition min-h-[52px] text-left ${
                  condition === key ? cfg.color : "border-white/10 bg-black/20 text-gray-400 hover:bg-white/5"
                }`}
              >
                <span className="text-sm font-semibold">{cfg.label}</span>
                <span className="text-xs opacity-70">{cfg.note}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Exchange item (opened only) */}
      {condition === "opened" && (
        <div className="bg-black/30 border border-white/8 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">③ Exchange For</label>
            <span className="text-[10px] text-amber-400">Max RM {(selectedItem?.price ?? 0).toFixed(2)}</span>
          </div>
          <ItemSearchSelect
            items={catalogItems.filter((i) => i.id !== selectedItem?.id)}
            onSelect={setExchangeItem}
            placeholder="Search exchange item..."
            groupByField="category"
          />
          {exchangeItem && !exchangeValid && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertTriangle size={12} /> Exchange item (RM {(exchangeItem.price ?? 0).toFixed(2)}) exceeds original price.
            </div>
          )}
          {exchangeItem && exchangeValid && (
            <div className="flex items-center gap-3 px-3 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <Package size={14} className="text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{exchangeItem.name}</p>
                <p className="text-xs text-emerald-400 font-mono">RM {(exchangeItem.price ?? 0).toFixed(2)} ✓</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Mandatory photo */}
      {condition && (
        <div className="bg-black/30 border border-white/8 rounded-2xl p-4 space-y-3">
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            {resolution === "exchange" ? "④" : "③"} Photo Proof (Required)
          </label>
          <button
            onClick={() => photoRef.current?.click()}
            className={`w-full flex items-center justify-center gap-3 py-5 rounded-xl border-2 border-dashed transition min-h-[44px] ${
              photoBase64 ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400" : "border-white/10 hover:border-[#d4af37]/40 text-gray-500 hover:text-[#d4af37]"
            }`}
          >
            <Camera size={20} />
            <span className="text-sm font-medium">
              {photoBase64 ? "Photo captured ✓" : "Tap to capture photo of item"}
            </span>
          </button>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              // Dev pattern: Base64 encode into state for DB insert.
              // Prod swap: upload to Supabase Storage → store returned public URL.
              const reader = new FileReader();
              reader.onload = () => setPhotoBase64(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
        </div>
      )}

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>}

      {/* Submit */}
      {canSubmit && (
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full py-4 rounded-2xl bg-[#d4af37] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#c9a227] active:scale-95 transition disabled:opacity-60 min-h-[44px]"
        >
          {isPending ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : `Confirm ${resolution === "refund" ? "Refund" : "Exchange"}`}
        </button>
      )}
    </div>
  );
}
